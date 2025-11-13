"""
Database models and setup for multi-tenant Career Agent
"""
import os
import secrets
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any

from sqlalchemy import create_engine, Column, String, Text, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.sql import func

# Database setup
Base = declarative_base()

# Use SQLite for simplicity (can be upgraded to PostgreSQL later)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./career_agent.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL connection settings
    # For Supabase pooler, use more conservative pool settings
    pool_size = int(os.getenv("DATABASE_POOL_SIZE", "2"))  # Reduced from 5
    max_overflow = int(os.getenv("DATABASE_MAX_OVERFLOW", "5"))  # Reduced from 10
    pool_recycle = int(os.getenv("DATABASE_POOL_RECYCLE_SECONDS", "300"))  # 5 minutes
    
    # Connection arguments to prevent duplicate SASL authentication
    connect_args = {
        "connect_timeout": 10,
        "application_name": "career-agent-api"
    }
    
    # Add sslmode if not already in URL
    if "sslmode" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL = f"{DATABASE_URL}&sslmode=require"
        else:
            DATABASE_URL = f"{DATABASE_URL}?sslmode=require"

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_recycle=pool_recycle,
        pool_reset_on_return='commit',  # Reset connections on return
        connect_args=connect_args,
        echo=False  # Set to True for SQL debugging
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    """User model for multi-tenant support"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # UUID or custom ID
    api_key = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Subscription & Usage fields
    subscription_tier = Column(String, default="free", nullable=False)  # free, premium
    requests_used = Column(Integer, default=0, nullable=False)  # Total requests used
    subscription_expires_at = Column(DateTime, nullable=True)  # When subscription expires
    subscription_status = Column(String, default="active", nullable=False)  # active, expired, cancelled
    
    # Relationships
    contexts = relationship("UserContext", back_populates="user", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="user", cascade="all, delete-orphan")
    generated_documents = relationship("GeneratedDocument", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tier={self.subscription_tier})>"


class UserContext(Base):
    """User career context documents"""
    __tablename__ = "user_contexts"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    context_text = Column(Text, nullable=False)  # The actual markdown/text content
    file_name = Column(String)  # Original filename if uploaded
    file_type = Column(String)  # markdown, txt, etc.
    uploaded_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="contexts")
    
    def __repr__(self):
        return f"<UserContext(id={self.id}, user_id={self.user_id}, uploaded_at={self.uploaded_at})>"


class UsageRecord(Base):
    """Track individual API usage requests"""
    __tablename__ = "usage_records"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    endpoint = Column(String, nullable=False)  # e.g., "cover-letter", "blurb", "query"
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="usage_records")
    
    def __repr__(self):
        return f"<UsageRecord(id={self.id}, user_id={self.user_id}, endpoint={self.endpoint}, created_at={self.created_at})>"


class GeneratedDocument(Base):
    """Persist generated outputs for users"""
    __tablename__ = "generated_documents"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_type = Column(String, nullable=False)  # cover-letter, blurb, job-application-answer, query
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="generated_documents")

    def __repr__(self):
        return f"<GeneratedDocument(id={self.id}, user_id={self.user_id}, type={self.document_type})>"


def generate_api_key() -> str:
    """Generate a secure API key for users"""
    return f"ca_{secrets.token_urlsafe(32)}"


def generate_user_id() -> str:
    """Generate a unique user ID"""
    return f"user_{secrets.token_urlsafe(16)}"


def get_db() -> Session:
    """Dependency for getting database session with error handling"""
    db = None
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        # Log the error but don't expose internal details
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Database connection error: {e}", exc_info=True)
        if db:
            try:
                db.rollback()
            except:
                pass
        raise
    finally:
        if db:
            try:
                db.close()
            except:
                pass


def init_db():
    """Initialize the database (create tables) with retry logic"""
    import time
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Database initialized successfully!")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️  Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                print(f"   Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                # Don't raise - let the server start and handle DB errors at runtime
                print(f"❌ Failed to initialize database after {max_retries} attempts: {e}")
                print("⚠️  Server will start, but database operations may fail until connection is restored.")
                print("   Check your DATABASE_URL and ensure the database is not paused.")
                # Re-raise to let api_server.py handle it gracefully
                raise


def get_user_by_api_key(db: Session, api_key: str) -> Optional[User]:
    """Get user by API key"""
    return db.query(User).filter(User.api_key == api_key, User.is_active == True).first()


def get_active_context_for_user(db: Session, user_id: str) -> Optional[UserContext]:
    """Get the most recent active context for a user"""
    return db.query(UserContext).filter(
        UserContext.user_id == user_id,
        UserContext.is_active == True
    ).order_by(UserContext.uploaded_at.desc()).first()


def create_user(
    db: Session,
    email: Optional[str] = None,
    name: Optional[str] = None,
    user_id: Optional[str] = None,
    api_key: Optional[str] = None
) -> User:
    """Create a new user with generated identifiers unless provided"""
    user_id = user_id or generate_user_id()
    api_key = api_key or generate_api_key()
    
    user = User(
        id=user_id,
        api_key=api_key,
        email=email,
        name=name,
        is_active=True,
        subscription_tier="free",
        requests_used=0,
        subscription_status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Fetch a user by email address"""
    if not email:
        return None
    return db.query(User).filter(User.email == email, User.is_active == True).first()


def get_usage_limit_for_tier(tier: str) -> int:
    """Get the usage limit for a subscription tier"""
    limits = {
        "free": 3,  # First 3 requests for $0
        "premium": 999999  # Unlimited for premium
    }
    return limits.get(tier, 3)


def can_user_make_request(user: User) -> Tuple[bool, str]:
    """Check if user can make a request. Returns (can_make, reason)"""
    # Check if subscription is active
    if user.subscription_status != "active":
        return False, "Subscription is not active. Please subscribe to continue."
    
    # Check if subscription expired
    if user.subscription_expires_at and user.subscription_expires_at < datetime.now():
        return False, "Subscription has expired. Please renew your subscription."
    
    # Check usage limit
    limit = get_usage_limit_for_tier(user.subscription_tier)
    if user.requests_used >= limit:
        if user.subscription_tier == "free":
            return False, f"You've used all {limit} free requests. Please subscribe to continue."
        else:
            return False, "Usage limit reached. Please contact support."
    
    return True, ""


def record_usage(db: Session, user_id: str, endpoint: str) -> UsageRecord:
    """Record a usage event for a user"""
    usage_id = f"usage_{secrets.token_urlsafe(16)}"
    usage_record = UsageRecord(
        id=usage_id,
        user_id=user_id,
        endpoint=endpoint
    )
    db.add(usage_record)
    
    # Update user's request count
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.requests_used += 1
    
    db.commit()
    db.refresh(usage_record)
    return usage_record


def save_generated_document(
    db: Session,
    user_id: str,
    document_type: str,
    content: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> GeneratedDocument:
    """Persist generated content for later retrieval."""
    if not content or not content.strip():
        raise ValueError("Generated content cannot be empty.")

    doc_id = f"doc_{secrets.token_urlsafe(16)}"
    metadata_json = json.dumps(metadata) if metadata else None

    document = GeneratedDocument(
        id=doc_id,
        user_id=user_id,
        document_type=document_type,
        title=title,
        content=content,
        metadata_json=metadata_json,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def list_generated_documents(db: Session, user_id: str, limit: int = 50) -> List[GeneratedDocument]:
    """Return recent generated documents for a user."""
    limit = max(1, min(limit, 100))
    return (
        db.query(GeneratedDocument)
        .filter(GeneratedDocument.user_id == user_id)
        .order_by(GeneratedDocument.created_at.desc())
        .limit(limit)
        .all()
    )


def update_subscription(db: Session, user_id: str, tier: str, expires_at: Optional[datetime] = None) -> User:
    """Update user's subscription tier"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    user.subscription_tier = tier
    user.subscription_status = "active"
    if expires_at:
        user.subscription_expires_at = expires_at
    
    db.commit()
    db.refresh(user)
    return user


def save_user_context(
    db: Session,
    user_id: str,
    context_text: str,
    file_name: Optional[str] = None,
    file_type: Optional[str] = None
) -> UserContext:
    """Save or update user context"""
    # Deactivate old contexts
    db.query(UserContext).filter(
        UserContext.user_id == user_id,
        UserContext.is_active == True
    ).update({"is_active": False})
    
    # Create new context
    context_id = f"ctx_{secrets.token_urlsafe(16)}"
    context = UserContext(
        id=context_id,
        user_id=user_id,
        context_text=context_text,
        file_name=file_name,
        file_type=file_type,
        is_active=True
    )
    db.add(context)
    db.commit()
    db.refresh(context)
    return context


def append_to_active_context(
    db: Session,
    user_id: str,
    additional_text: str
) -> UserContext:
    """Append additional text to the user's active context, creating one if absent."""
    additional_text = additional_text.strip()
    if not additional_text:
        raise ValueError("Additional context text cannot be empty.")

    context = get_active_context_for_user(db, user_id)
    if context:
        separator = "\n\n" if context.context_text else ""
        context.context_text = f"{context.context_text}{separator}{additional_text}"
        context.updated_at = datetime.now()
        db.commit()
        db.refresh(context)
        return context

    # No active context exists; create a new one
    return save_user_context(
        db,
        user_id=user_id,
        context_text=additional_text,
        file_name=None,
        file_type=None
    )


def get_context_by_id(db: Session, context_id: str, user_id: Optional[str] = None) -> Optional[UserContext]:
    """Fetch a context by ID, optionally ensuring it belongs to the specified user."""
    query = db.query(UserContext).filter(UserContext.id == context_id)
    if user_id:
        query = query.filter(UserContext.user_id == user_id)
    return query.first()


def get_usage_counts(db: Session, user_id: str) -> Dict[str, int]:
    """Aggregate usage counts per endpoint for the user."""
    records = (
        db.query(UsageRecord.endpoint, func.count(UsageRecord.id))
        .filter(UsageRecord.user_id == user_id)
        .group_by(UsageRecord.endpoint)
        .all()
    )
    return {endpoint: count for endpoint, count in records}


def list_user_contexts(db: Session, user_id: str, limit: int = 20) -> List[UserContext]:
    """Return recent contexts for a user, newest first."""
    return (
        db.query(UserContext)
        .filter(UserContext.user_id == user_id)
        .order_by(UserContext.uploaded_at.desc())
        .limit(limit)
        .all()
    )


def delete_user_context(db: Session, user_id: str, context_id: str) -> bool:
    """Delete a user context and promote the most recent remaining context to active if needed."""
    context = (
        db.query(UserContext)
        .filter(UserContext.id == context_id, UserContext.user_id == user_id)
        .first()
    )
    if not context:
        return False

    was_active = context.is_active
    db.delete(context)
    db.commit()

    if was_active:
        latest_context = (
            db.query(UserContext)
            .filter(UserContext.user_id == user_id)
            .order_by(UserContext.uploaded_at.desc())
            .first()
        )
        if latest_context and not latest_context.is_active:
            latest_context.is_active = True
            db.commit()
    return True


def get_recent_usage_records(db: Session, user_id: str, limit: int = 10) -> List[UsageRecord]:
    """Return the most recent usage records for a user."""
    return (
        db.query(UsageRecord)
        .filter(UsageRecord.user_id == user_id)
        .order_by(UsageRecord.created_at.desc())
        .limit(limit)
        .all()
    )



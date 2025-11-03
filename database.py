"""
Database models and setup for multi-tenant Career Agent
"""
import os
import secrets
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import create_engine, Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.sql import func

# Database setup
Base = declarative_base()

# Use SQLite for simplicity (can be upgraded to PostgreSQL later)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./career_agent.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
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
    
    # Relationships
    contexts = relationship("UserContext", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


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


def generate_api_key() -> str:
    """Generate a secure API key for users"""
    return f"ca_{secrets.token_urlsafe(32)}"


def generate_user_id() -> str:
    """Generate a unique user ID"""
    return f"user_{secrets.token_urlsafe(16)}"


def get_db() -> Session:
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize the database (create tables)"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")


def get_user_by_api_key(db: Session, api_key: str) -> Optional[User]:
    """Get user by API key"""
    return db.query(User).filter(User.api_key == api_key, User.is_active == True).first()


def get_active_context_for_user(db: Session, user_id: str) -> Optional[UserContext]:
    """Get the most recent active context for a user"""
    return db.query(UserContext).filter(
        UserContext.user_id == user_id,
        UserContext.is_active == True
    ).order_by(UserContext.uploaded_at.desc()).first()


def create_user(db: Session, email: Optional[str] = None, name: Optional[str] = None) -> User:
    """Create a new user with generated API key"""
    user_id = generate_user_id()
    api_key = generate_api_key()
    
    user = User(
        id=user_id,
        api_key=api_key,
        email=email,
        name=name,
        is_active=True
    )
    db.add(user)
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



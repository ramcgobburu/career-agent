"""
FastAPI Backend Server for Career-Agent with Monetization
Multi-tenant support with usage tracking and subscription management
by Octan Labs
"""

import os
import logging
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, Response, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
import uvicorn

# Try to import optional production dependencies
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    RATE_LIMITING_AVAILABLE = True
except ImportError:
    RATE_LIMITING_AVAILABLE = False
    limiter = None

try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

try:
    from supabase import create_client, Client
    SUPABASE_CLIENT_AVAILABLE = True
except ImportError:
    SUPABASE_CLIENT_AVAILABLE = False
    Client = None
    create_client = None

from career_agent import CareerAgent
from database import (
    get_db, init_db, get_user_by_api_key, get_active_context_for_user,
    create_user, save_user_context, User, can_user_make_request,
    record_usage, update_subscription, get_usage_limit_for_tier,
    get_user_by_email, list_user_contexts, delete_user_context,
    get_recent_usage_records, append_to_active_context, get_context_by_id,
    get_usage_counts
)

# Load environment variables
load_dotenv()

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Configure logging
logging.basicConfig(
    level=logging.WARNING if IS_PRODUCTION else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize database
init_db()

# Initialize FastAPI app
app = FastAPI(
    title="Career-Agent API",
    description="AI-powered career materials generator API with monetization | by Octan Labs",
    version="2.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,  # Disable docs in production
    redoc_url="/redoc" if not IS_PRODUCTION else None
)

# Rate limiting setup
if RATE_LIMITING_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("Rate limiting enabled")
else:
    logger.warning("Rate limiting not available (slowapi not installed). Install with: pip install slowapi")

# Stripe configuration (optional)
if STRIPE_AVAILABLE:
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    if IS_PRODUCTION and not stripe.api_key:
        logger.warning("STRIPE_SECRET_KEY not set in production! Payment processing will not work.")
else:
    logger.info("Stripe not installed. Install with: pip install stripe")
    STRIPE_WEBHOOK_SECRET = None

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client: Optional["Client"] = None
SUPABASE_AUTH_ENABLED = False

if SUPABASE_CLIENT_AVAILABLE:
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            SUPABASE_AUTH_ENABLED = True
            logger.info("Supabase auth verification enabled")
        except Exception as exc:
            logger.error(f"Failed to initialize Supabase client: {exc}")
            SUPABASE_AUTH_ENABLED = False
    else:
        if IS_PRODUCTION:
            logger.warning("Supabase auth disabled. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable token verification.")
else:
    logger.info("Supabase client not installed. Install with: pip install supabase")

# CORS configuration - environment-aware
if IS_PRODUCTION:
    cors_origins_str = os.getenv("CORS_ORIGINS", "")
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
    if not cors_origins:
        logger.warning("⚠️  CORS_ORIGINS not set in production! This is a security risk.")
        logger.warning("   Set CORS_ORIGINS environment variable to your domain(s), e.g.:")
        logger.warning("   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com")
        cors_origins = []  # Empty list = no CORS allowed
else:
    cors_origins = ["*"]  # Allow all in development

# Custom CORS middleware to handle null origin (file:// protocol) and environment-based origins
class CORSMiddlewareCustom(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            origin = request.headers.get("origin", "*")
            # In production, only allow specified origins
            if IS_PRODUCTION and cors_origins:
                allowed_origin = origin if origin in cors_origins else cors_origins[0] if cors_origins else "*"
            else:
                allowed_origin = origin if origin != "null" else "*"
            
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": allowed_origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "3600",
                }
            )
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to all responses
        origin = request.headers.get("origin")
        if origin:
            if IS_PRODUCTION and cors_origins:
                # In production, only allow specified origins
                allowed_origin = origin if origin in cors_origins else cors_origins[0] if cors_origins else "*"
            else:
                # In development, allow all (including null for file://)
                allowed_origin = origin if origin != "null" else "*"
        else:
            allowed_origin = cors_origins[0] if (IS_PRODUCTION and cors_origins) else "*"
        
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response

# Add custom CORS middleware
app.add_middleware(CORSMiddlewareCustom)

# Security
security = HTTPBearer(auto_error=False)

# Agent cache (per-user agents)
agent_cache: Dict[str, CareerAgent] = {}


# Dependency to get current user (supports Supabase tokens and API keys)
async def get_current_user(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Resolve the current user via Supabase access token or legacy API key."""
    bearer_token = credentials.credentials if credentials else None
    api_key = x_api_key

    # Prefer Supabase authentication if configured
    if SUPABASE_AUTH_ENABLED and supabase_client:
        if not bearer_token:
            # Allow legacy API key fallback if provided
            if api_key:
                user = get_user_by_api_key(db, api_key)
                if not user:
                    raise HTTPException(status_code=401, detail="Invalid API key")
                return user
            raise HTTPException(
                status_code=401,
                detail="Authorization token missing. Provide Authorization: Bearer <access_token>."
            )

        try:
            supabase_response = supabase_client.auth.get_user(bearer_token)
            supabase_user = getattr(supabase_response, "user", None)
        except Exception as exc:
            logger.warning(f"Supabase token verification failed: {exc}")
            raise HTTPException(status_code=401, detail="Invalid or expired Supabase access token")

        if not supabase_user:
            raise HTTPException(status_code=401, detail="Invalid Supabase session")

        email = getattr(supabase_user, "email", None)
        metadata = getattr(supabase_user, "user_metadata", {}) or {}
        full_name = metadata.get("full_name") or metadata.get("name")

        if not email:
            raise HTTPException(status_code=400, detail="Supabase user is missing an email address")

        user = get_user_by_email(db, email)
        if not user:
            user = create_user(
                db,
                email=email,
                name=full_name,
                user_id=getattr(supabase_user, "id", None)
            )
            logger.info(f"Provisioned new application user for Supabase account {email}")
        else:
            updated = False
            if full_name and user.name != full_name:
                user.name = full_name
                updated = True
            if updated:
                db.commit()
                db.refresh(user)
        return user

    # Legacy API key authentication fallback
    api_key = api_key or bearer_token
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide Supabase access token or X-API-Key header."
        )

    user = get_user_by_api_key(db, api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user


def get_or_create_agent(user: User, db: Session) -> CareerAgent:
    """Get or create agent for user. Creates agent if context exists."""
    if user.id in agent_cache:
        return agent_cache[user.id]
    
    # Get user's context
    context = get_active_context_for_user(db, user.id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No career context found. Please upload your career context first using /api/v1/upload-context"
        )
    
    # Create agent with user's context
    agent = CareerAgent(
        career_context_text=context.context_text,
        user_id=user.id,
        user_name=user.name or user.email or "the user",
        model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.7
    )
    
    agent_cache[user.id] = agent
    return agent


# Request/Response Models
class CreateUserRequest(BaseModel):
    email: Optional[str] = Field(None, description="User email")
    name: Optional[str] = Field(None, description="User name")
    
    @validator('email')
    def validate_email(cls, v):
        if v and len(v) > 255:
            raise ValueError('Email too long (max 255 characters)')
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower().strip() if v else v
    
    @validator('name')
    def validate_name(cls, v):
        if v and len(v) > 200:
            raise ValueError('Name too long (max 200 characters)')
        return v.strip() if v else v

class CreateUserResponse(BaseModel):
    user_id: str
    api_key: str
    message: str

class UploadContextRequest(BaseModel):
    context_text: Optional[str] = Field(None, description="Career context as text")

class UserContextSummary(BaseModel):
    id: str
    user_id: str
    file_name: Optional[str]
    file_type: Optional[str]
    uploaded_at: str
    is_active: bool
    character_count: int
    preview: Optional[str]
    download_url: Optional[str] = None

class UploadContextResponse(BaseModel):
    success: bool
    message: str
    context_id: str
    context: Optional[UserContextSummary] = None

class UserInfoResponse(BaseModel):
    user_id: str
    email: Optional[str]
    name: Optional[str]
    subscription_tier: str
    requests_used: int
    requests_limit: int
    subscription_status: str
    subscription_expires_at: Optional[str]

class UsageRecordSummary(BaseModel):
    id: str
    endpoint: str
    created_at: str

class UsageSummaryResponse(BaseModel):
    requests_used: int
    requests_limit: int
    recent_usage: List[UsageRecordSummary]
    totals: Dict[str, int]

class ContextListResponse(BaseModel):
    contexts: List[UserContextSummary]

class DeleteContextResponse(BaseModel):
    success: bool
    message: str

class AppendContextRequest(BaseModel):
    text: str = Field(..., description="Additional text to append to the active context.")

    @validator('text')
    def validate_text(cls, v):
        if len(v.strip()) < 20:
            raise ValueError('Additional context must be at least 20 characters.')
        return v.strip()


def serialize_user_info(user: User) -> UserInfoResponse:
    """Helper to format user info responses consistently."""
    limit = get_usage_limit_for_tier(user.subscription_tier)
    expires_at_str = user.subscription_expires_at.isoformat() if user.subscription_expires_at else None

    return UserInfoResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        subscription_tier=user.subscription_tier,
        requests_used=user.requests_used,
        requests_limit=limit,
        subscription_status=user.subscription_status,
        subscription_expires_at=expires_at_str
    )

def serialize_context_summary(context) -> UserContextSummary:
    """Convert a UserContext ORM object into a serializable summary."""
    text = context.context_text or ""
    preview = text.strip()[:160]
    if len(text.strip()) > 160:
        preview = preview.rstrip() + "…"
    return UserContextSummary(
        id=context.id,
        user_id=context.user_id,
        file_name=context.file_name,
        file_type=context.file_type,
        uploaded_at=context.uploaded_at.isoformat() if context.uploaded_at else datetime.now().isoformat(),
        is_active=context.is_active,
        character_count=len(text),
        preview=preview or None,
        download_url=f"/api/v1/contexts/{context.id}/download"
    )

def serialize_usage_record(record) -> UsageRecordSummary:
    """Convert a UsageRecord ORM object into a summary."""
    return UsageRecordSummary(
        id=record.id,
        endpoint=record.endpoint,
        created_at=record.created_at.isoformat() if record.created_at else datetime.now().isoformat()
    )

class SubscriptionRequest(BaseModel):
    tier: str = Field(..., description="Subscription tier: free or premium")
    payment_token: Optional[str] = Field(None, description="Payment token (Stripe payment method ID) - required for premium")
    
    @validator('tier')
    def validate_tier(cls, v):
        if v not in ["free", "premium"]:
            raise ValueError('Tier must be "free" or "premium"')
        return v

class SubscriptionResponse(BaseModel):
    success: bool
    message: str
    subscription_tier: str
    requests_limit: int

class CoverLetterRequest(BaseModel):
    company_name: str = Field(..., description="Name of the company")
    role_title: str = Field(..., description="Job title/role")
    job_description: Optional[str] = Field(None, description="Job description or requirements")
    additional_context: Optional[str] = Field(None, description="Additional context to consider")
    tone: str = Field("professional", description="Tone: professional, friendly, or formal")
    length: str = Field("medium", description="Length: short, medium, or long")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")
    
    @validator('company_name', 'role_title')
    def validate_string_length(cls, v):
        if len(v) > 200:
            raise ValueError('Field too long (max 200 characters)')
        return v.strip()
    
    @validator('tone')
    def validate_tone(cls, v):
        if v not in ["professional", "friendly", "formal"]:
            raise ValueError('Tone must be professional, friendly, or formal')
        return v
    
    @validator('length')
    def validate_length(cls, v):
        if v not in ["short", "medium", "long"]:
            raise ValueError('Length must be short, medium, or long')
        return v
    
class BlurbRequest(BaseModel):
    purpose: str = Field(..., description="Purpose of the blurb (e.g., 'LinkedIn introduction')")
    target_role: Optional[str] = Field(None, description="Target role to emphasize")
    max_words: int = Field(200, description="Maximum word count")
    style: str = Field("linkedin", description="Style: linkedin, email, or professional")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")
    
    @validator('max_words')
    def validate_max_words(cls, v):
        if v < 50 or v > 1000:
            raise ValueError('Max words must be between 50 and 1000')
        return v
    
    @validator('style')
    def validate_style(cls, v):
        if v not in ["linkedin", "email", "professional"]:
            raise ValueError('Style must be linkedin, email, or professional')
        return v

class JobApplicationAnswerRequest(BaseModel):
    question: str = Field(..., description="Job application question (e.g., 'Why do you want to work for us?')")
    company_name: Optional[str] = Field(None, description="Company name")
    job_description: Optional[str] = Field(None, description="Full job description")
    role_title: Optional[str] = Field(None, description="Job title/role")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class QueryRequest(BaseModel):
    question: str = Field(..., description="Your question about career, skills, or experiences")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class ResponseModel(BaseModel):
    success: bool
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    usage_info: Optional[Dict[str, Any]] = None  # Added usage info to response


def format_response(content: str, sources: Any, format_type: str = "text") -> str:
    """Format the response according to requested format."""
    if format_type == "json":
        import json
        return json.dumps({"content": content, "sources": str(sources)}, indent=2)
    elif format_type == "markdown":
        md = f"# Generated Content\n\n{content}\n\n"
        if sources:
            md += "## Sources\n\n"
            for i, source in enumerate(sources[:3], 1):
                md += f"### Source {i}\n{str(source)[:200]}...\n\n"
        return md
    else:  # text (default)
        return content


def convert_sources_to_dict(sources: Any) -> List[Dict[str, Any]]:
    """Convert LangChain Document objects to dictionaries."""
    if not sources:
        return []
    
    converted = []
    for source in sources:
        if hasattr(source, 'page_content') and hasattr(source, 'metadata'):
            converted.append({
                "page_content": source.page_content[:500],
                "metadata": source.metadata if source.metadata else {}
            })
        elif isinstance(source, dict):
            converted.append(source)
        else:
            converted.append({
                "content": str(source)[:500],
                "metadata": {}
            })
    return converted


# Serve web client at root
@app.get("/")
async def root():
    """Serve the web client HTML file."""
    return FileResponse("web_client.html", media_type="text/html")


@app.get("/api")
async def api_info():
    """API information endpoint."""
    return {
        "message": "Career-Agent API | by Octan Labs",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "create_user": "/api/v1/users",
            "user_info": "/api/v1/user-info",
            "upload_context": "/api/v1/upload-context",
            "append_context": "/api/v1/append-context",
            "list_contexts": "/api/v1/contexts",
            "delete_context": "/api/v1/contexts/{context_id}",
            "download_context": "/api/v1/contexts/{context_id}/download",
            "subscribe": "/api/v1/subscribe",
            "cover_letter": "/api/v1/cover-letter",
            "blurb": "/api/v1/blurb",
            "job_application_answer": "/api/v1/job-application-answer",
            "query": "/api/v1/query",
            "usage_summary": "/api/v1/usage"
        },
        "authentication": "Use Supabase access token in Authorization header or X-API-Key for legacy clients",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "database": "connected",
        "agent_cache_size": len(agent_cache),
        "rate_limiting": RATE_LIMITING_AVAILABLE,
        "stripe_available": STRIPE_AVAILABLE,
        "supabase_auth": SUPABASE_AUTH_ENABLED
    }



# User Management Endpoints
@app.post("/api/v1/users", response_model=CreateUserResponse)
async def create_user_endpoint(
    request: CreateUserRequest,
    db: Session = Depends(get_db)
):
    """Create a new user and get an API key for authentication."""
    try:
        user = create_user(db, email=request.email, name=request.name)
        logger.info(f"New user created: {user.id} ({user.email or 'no email'})")
        return CreateUserResponse(
            user_id=user.id,
            api_key=user.api_key,
            message="User created successfully. Save your API key - it won't be shown again!"
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error creating user: {error_msg}", exc_info=True)
        # In production, don't expose internal errors
        if IS_PRODUCTION:
            error_msg = "Error creating user. Please try again."
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/api/v1/user-info", response_model=UserInfoResponse)
async def get_user_info(
    user: User = Depends(get_current_user),
):
    """Get current user's information and usage stats."""
    return serialize_user_info(user)


@app.get("/api/v1/me", response_model=UserInfoResponse)
async def get_authenticated_user_profile(user: User = Depends(get_current_user)):
    """Return authenticated user's profile (Supabase or legacy)."""
    return serialize_user_info(user)


@app.post("/api/v1/upload-context", response_model=UploadContextResponse)
async def upload_context(
    file: Optional[UploadFile] = File(None),
    context_text: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload career context document (markdown/text file or raw text)."""
    # Clear agent cache for this user
    if user.id in agent_cache:
        del agent_cache[user.id]
        logger.info(f"Cleared agent cache for user {user.id}")
    
    # File size limit (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Get context text from file or form
    if file:
        # Check file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        if file.content_type not in ["text/plain", "text/markdown", "text/x-markdown", None]:
            raise HTTPException(status_code=400, detail="File must be text or markdown")
        
        try:
            context_text = file_content.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File encoding error. Please use UTF-8 text files.")
        
        file_name = file.filename
        file_type = Path(file_name).suffix if file_name else None
    elif context_text:
        if len(context_text) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Context text too long. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        file_name = None
        file_type = None
    else:
        raise HTTPException(status_code=400, detail="Either file or context_text must be provided")
    
    if not context_text or len(context_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Context text is too short (minimum 50 characters)")
    
    # Save context
    try:
        context = save_user_context(
            db,
            user_id=user.id,
            context_text=context_text,
            file_name=file_name,
            file_type=file_type
        )
        logger.info(f"Context uploaded for user {user.id}, context_id: {context.id}")
        
        return UploadContextResponse(
            success=True,
            message="Career context uploaded successfully",
            context_id=context.id,
            context=serialize_context_summary(context)
        )
    except Exception as e:
        logger.error(f"Error saving context for user {user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error saving context. Please try again.")


@app.post("/api/v1/append-context", response_model=UploadContextResponse)
async def append_context(
    request: AppendContextRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Append additional text to the active context without overwriting existing content."""
    try:
        context = append_to_active_context(db, user.id, request.text)
        if user.id in agent_cache:
            agent_cache.pop(user.id, None)
        return UploadContextResponse(
            success=True,
            message="Additional context appended successfully.",
            context_id=context.id,
            context=serialize_context_summary(context)
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"Error appending context for user {user.id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error appending context. Please try again.")


@app.get("/api/v1/contexts", response_model=ContextListResponse)
async def get_user_contexts(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List the most recent contexts uploaded by the authenticated user."""
    limit = max(1, min(limit, 50))
    contexts = list_user_contexts(db, user.id, limit=limit)
    return ContextListResponse(
        contexts=[serialize_context_summary(ctx) for ctx in contexts]
    )


@app.delete("/api/v1/contexts/{context_id}", response_model=DeleteContextResponse)
async def delete_user_context_endpoint(
    context_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a context document for the authenticated user."""
    deleted = delete_user_context(db, user.id, context_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Context not found")

    if user.id in agent_cache:
        agent_cache.pop(user.id, None)
        logger.info(f"Cleared agent cache for user {user.id} after context deletion")

    return DeleteContextResponse(success=True, message="Context deleted successfully")


@app.get("/api/v1/contexts/{context_id}/download")
async def download_user_context(
    context_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download the raw text of a stored context."""
    context = get_context_by_id(db, context_id, user.id)
    if not context:
        raise HTTPException(status_code=404, detail="Context not found")

    return Response(
        content=context.context_text or "",
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="{context.file_name or context.id}.txt"'
        }
    )


@app.get("/api/v1/usage", response_model=UsageSummaryResponse)
async def get_usage_summary(
    limit: int = 10,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return recent usage history for the authenticated user."""
    limit = max(1, min(limit, 50))
    records = get_recent_usage_records(db, user.id, limit=limit)
    limit_per_tier = get_usage_limit_for_tier(user.subscription_tier)
    totals = get_usage_counts(db, user.id)

    return UsageSummaryResponse(
        requests_used=user.requests_used,
        requests_limit=limit_per_tier,
        recent_usage=[serialize_usage_record(record) for record in records],
        totals=totals
    )


# Helper function for rate limiting decorator
def rate_limit_if_available(limit: str):
    """Decorator for rate limiting - no-op if rate limiting not available."""
    if RATE_LIMITING_AVAILABLE and limiter:
        return limiter.limit(limit)
    return lambda f: f  # Return function unchanged if no rate limiting

@app.post("/api/v1/subscribe", response_model=SubscriptionResponse)
@rate_limit_if_available("5/minute")
async def subscribe(
    request: SubscriptionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Subscribe user to a tier (free or premium). Requires payment verification for premium."""
    if request.tier == "premium":
        # Premium requires payment verification
        if not request.payment_token:
            raise HTTPException(
                status_code=400,
                detail="Payment token required for premium subscription"
            )
        
        if not STRIPE_AVAILABLE or not stripe.api_key:
            raise HTTPException(
                status_code=503,
                detail="Payment processing not configured. Please contact support."
            )
        
        try:
            # Verify payment with Stripe
            # Note: This is a simplified example. In production, you might want to:
            # 1. Create a PaymentIntent first
            # 2. Create a Subscription object for recurring billing
            # 3. Use Stripe Checkout for better UX
            
            # For now, we'll create a payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=999,  # $9.99 in cents - adjust as needed
                currency="usd",
                payment_method=request.payment_token,
                confirm=True,
                metadata={"user_id": user.id, "subscription_tier": "premium"}
            )
            
            if payment_intent.status != "succeeded":
                logger.warning(f"Payment failed for user {user.id}: {payment_intent.status}")
                raise HTTPException(
                    status_code=400,
                    detail="Payment failed. Please try again with a valid payment method."
                )
            
            logger.info(f"Payment succeeded for user {user.id}, payment_intent: {payment_intent.id}")
            expires_at = datetime.now() + timedelta(days=30)  # Monthly subscription
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error for user {user.id}: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Payment processing error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error processing payment for user {user.id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error processing payment. Please try again."
            )
    else:
        # Free tier - no payment needed
        expires_at = None
    
    updated_user = update_subscription(db, user.id, request.tier, expires_at)
    limit = get_usage_limit_for_tier(updated_user.subscription_tier)
    
    logger.info(f"User {user.id} subscription updated to {request.tier} tier")
    
    return SubscriptionResponse(
        success=True,
        message=f"Subscription updated to {request.tier} tier",
        subscription_tier=updated_user.subscription_tier,
        requests_limit=limit
    )


# Stripe Webhook Handler (for production payment processing)
if STRIPE_AVAILABLE and STRIPE_WEBHOOK_SECRET:
    @app.post("/api/v1/webhooks/stripe")
    async def stripe_webhook(request: Request):
        """Secure Stripe webhook handler with signature verification."""
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        if not sig_header:
            logger.error("Missing stripe-signature header in webhook")
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle webhook events
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        logger.info(f"Received Stripe webhook: {event_type}")
        
        db = next(get_db())
        
        try:
            if event_type == "checkout.session.completed":
                # Payment succeeded via Checkout
                customer_email = event_data.get("customer_email")
                if customer_email:
                    user = db.query(User).filter(User.email == customer_email).first()
                    if user:
                        expires_at = datetime.now() + timedelta(days=30)
                        update_subscription(db, user.id, "premium", expires_at)
                        logger.info(f"Upgraded user {user.id} to premium via webhook")
            
            elif event_type == "customer.subscription.deleted":
                # Subscription cancelled
                customer_id = event_data.get("customer")
                logger.info(f"Subscription cancelled for customer {customer_id}")
                # You might want to downgrade user here
            
            elif event_type == "invoice.payment_failed":
                # Payment failed
                customer_email = event_data.get("customer_email")
                if customer_email:
                    user = db.query(User).filter(User.email == customer_email).first()
                    if user:
                        logger.warning(f"Payment failed for user {user.id}")
                        # Optionally downgrade or mark subscription as expired
            
            return {"status": "success"}
        
        except Exception as e:
            logger.error(f"Error processing webhook: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error processing webhook")
        finally:
            db.close()

# Career Generation Endpoints (require authentication and check usage limits)
@app.post("/api/v1/cover-letter", response_model=ResponseModel)
@rate_limit_if_available("10/minute")
async def generate_cover_letter(
    request: CoverLetterRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Generate a personalized cover letter."""
    # Check usage limits
    can_make, reason = can_user_make_request(user)
    if not can_make:
        raise HTTPException(status_code=403, detail=reason)
    
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.generate_cover_letter(
            company_name=request.company_name,
            role_title=request.role_title,
            job_description=request.job_description,
            additional_context=request.additional_context,
            tone=request.tone,
            length=request.length
        )
        
        # Record usage
        record_usage(db, user.id, "cover-letter")
        
        # Refresh user to get updated usage count
        db.refresh(user)
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        limit = get_usage_limit_for_tier(user.subscription_tier)
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "company": request.company_name,
                "role": request.role_title,
                "tone": request.tone,
                "length": request.length,
                "has_additional_context": bool(request.additional_context)
            },
            usage_info={
                "requests_used": user.requests_used,
                "requests_limit": limit,
                "remaining": max(0, limit - user.requests_used)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")


@app.post("/api/v1/blurb", response_model=ResponseModel)
@rate_limit_if_available("10/minute")
async def generate_blurb(
    request: BlurbRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Generate a short blurb for LinkedIn, email, etc."""
    # Check usage limits
    can_make, reason = can_user_make_request(user)
    if not can_make:
        raise HTTPException(status_code=403, detail=reason)
    
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.generate_blurb(
            purpose=request.purpose,
            target_role=request.target_role,
            max_words=request.max_words,
            style=request.style
        )
        
        # Record usage
        record_usage(db, user.id, "blurb")
        
        # Refresh user to get updated usage count
        db.refresh(user)
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        limit = get_usage_limit_for_tier(user.subscription_tier)
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "purpose": request.purpose,
                "target_role": request.target_role,
                "max_words": request.max_words,
                "style": request.style
            },
            usage_info={
                "requests_used": user.requests_used,
                "requests_limit": limit,
                "remaining": max(0, limit - user.requests_used)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating blurb: {str(e)}")


@app.post("/api/v1/job-application-answer", response_model=ResponseModel)
@rate_limit_if_available("10/minute")
async def generate_job_application_answer(
    request: JobApplicationAnswerRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Generate an answer to a job application question (similar to Eztrackr)."""
    # Check usage limits
    can_make, reason = can_user_make_request(user)
    if not can_make:
        raise HTTPException(status_code=403, detail=reason)
    
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.generate_job_application_answer(
            question=request.question,
            company_name=request.company_name,
            job_description=request.job_description,
            role_title=request.role_title
        )
        
        # Record usage
        record_usage(db, user.id, "job-application-answer")
        
        # Refresh user to get updated usage count
        db.refresh(user)
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        limit = get_usage_limit_for_tier(user.subscription_tier)
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "question": request.question,
                "company": request.company_name,
                "role": request.role_title
            },
            usage_info={
                "requests_used": user.requests_used,
                "requests_limit": limit,
                "remaining": max(0, limit - user.requests_used)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating job application answer: {str(e)}")


@app.post("/api/v1/query", response_model=ResponseModel)
@rate_limit_if_available("10/minute")
async def query_agent(
    request: QueryRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Generic query endpoint for any career-related question."""
    # Check usage limits
    can_make, reason = can_user_make_request(user)
    if not can_make:
        raise HTTPException(status_code=403, detail=reason)
    
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.query(request.question)
        
        # Record usage
        record_usage(db, user.id, "query")
        
        # Refresh user to get updated usage count
        db.refresh(user)
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        limit = get_usage_limit_for_tier(user.subscription_tier)
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "question": request.question
            },
            usage_info={
                "requests_used": user.requests_used,
                "requests_limit": limit,
                "remaining": max(0, limit - user.requests_used)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with logging."""
    logger.error(f"Unhandled error: {exc}", exc_info=True, extra={
        "path": request.url.path,
        "method": request.method
    })
    
    if IS_PRODUCTION:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    else:
        import traceback
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "traceback": traceback.format_exc()
            },
            headers={"Access-Control-Allow-Origin": "*"}
        )

if __name__ == "__main__":
    # Run the server
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=port,
        reload=not IS_PRODUCTION,
        log_level="warning" if IS_PRODUCTION else "info",
        workers=4 if IS_PRODUCTION else 1
    )

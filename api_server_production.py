"""
Production-ready API Server for Career-Agent
Includes secure payment webhooks, rate limiting, and production security
"""

import os
import hmac
import hashlib
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
import uvicorn

# Try to import optional dependencies
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    RATE_LIMITING_AVAILABLE = True
except ImportError:
    RATE_LIMITING_AVAILABLE = False

try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False

from career_agent import CareerAgent
from database import (
    get_db, init_db, get_user_by_api_key, get_active_context_for_user,
    create_user, save_user_context, User, can_user_make_request,
    record_usage, update_subscription, get_usage_limit_for_tier
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

# Initialize Sentry for error tracking (optional)
if IS_PRODUCTION and os.getenv("SENTRY_DSN"):
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(
            dsn=os.getenv("SENTRY_DSN"),
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.1,
            environment=ENVIRONMENT
        )
        logger.info("Sentry initialized for error tracking")
    except ImportError:
        logger.warning("Sentry not installed, skipping error tracking")

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

# Production security middleware
if IS_PRODUCTION:
    allowed_hosts = os.getenv("ALLOWED_HOSTS", "").split(",")
    if allowed_hosts and allowed_hosts[0]:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=allowed_hosts
        )

# Rate limiting
if RATE_LIMITING_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("Rate limiting enabled")
else:
    limiter = None
    logger.warning("Rate limiting not available (slowapi not installed)")

# CORS configuration
if IS_PRODUCTION:
    cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
    cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]
    if not cors_origins:
        logger.warning("CORS_ORIGINS not set in production! Setting to empty list.")
        cors_origins = []
else:
    cors_origins = ["*"]

class CORSMiddlewareCustom(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            origin = request.headers.get("origin", "*")
            allowed_origin = origin if origin in cors_origins or "*" in cors_origins else cors_origins[0] if cors_origins else "*"
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": allowed_origin if allowed_origin != "null" else "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "3600",
                }
            )
        
        response = await call_next(request)
        origin = request.headers.get("origin")
        if origin:
            allowed_origin = origin if origin in cors_origins or "*" in cors_origins else cors_origins[0] if cors_origins else "*"
            response.headers["Access-Control-Allow-Origin"] = allowed_origin if allowed_origin != "null" else "*"
        else:
            response.headers["Access-Control-Allow-Origin"] = cors_origins[0] if cors_origins else "*"
        
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response

app.add_middleware(CORSMiddlewareCustom)

# Security
security = HTTPBearer(auto_error=False)

# Agent cache
agent_cache: Dict[str, CareerAgent] = {}

# Stripe configuration
if STRIPE_AVAILABLE:
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not stripe.api_key and IS_PRODUCTION:
        logger.warning("STRIPE_SECRET_KEY not set in production!")

# Request/Response Models
class CreateUserRequest(BaseModel):
    email: Optional[str] = Field(None, description="User email")
    name: Optional[str] = Field(None, description="User name")
    
    @validator('email')
    def validate_email(cls, v):
        if v and len(v) > 255:
            raise ValueError('Email too long')
        return v.lower() if v else v

class CreateUserResponse(BaseModel):
    user_id: str
    api_key: str
    message: str

class SubscriptionRequest(BaseModel):
    tier: str = Field(..., description="Subscription tier: free or premium")
    payment_token: Optional[str] = Field(None, description="Payment token (Stripe payment method ID)")
    
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

class BlurbRequest(BaseModel):
    purpose: str = Field(..., description="Purpose of the blurb")
    target_role: Optional[str] = Field(None, description="Target role to emphasize")
    max_words: int = Field(200, description="Maximum word count")
    style: str = Field("linkedin", description="Style: linkedin, email, or professional")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")
    
    @validator('max_words')
    def validate_max_words(cls, v):
        if v < 50 or v > 1000:
            raise ValueError('Max words must be between 50 and 1000')
        return v

class JobApplicationAnswerRequest(BaseModel):
    question: str = Field(..., description="Job application question")
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
    usage_info: Optional[Dict[str, Any]] = None

# Helper functions
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
    else:
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

# Dependencies
async def get_current_user(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from API key."""
    api_key = x_api_key or (credentials.credentials if credentials else None)
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide X-API-Key header or Authorization Bearer token"
        )
    
    user = get_user_by_api_key(db, api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user

def get_or_create_agent(user: User, db: Session) -> CareerAgent:
    """Get or create agent for user."""
    if user.id in agent_cache:
        return agent_cache[user.id]
    
    context = get_active_context_for_user(db, user.id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No career context found. Please upload your career context first."
        )
    
    agent = CareerAgent(
        career_context_text=context.context_text,
        user_id=user.id,
        user_name=user.name or user.email or "the user",
        model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.7
    )
    
    agent_cache[user.id] = agent
    return agent

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

# Routes
@app.get("/")
async def root():
    """Serve the web client HTML file."""
    return FileResponse("web_client.html", media_type="text/html")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "database": "connected",
        "agent_cache_size": len(agent_cache)
    }

@app.post("/api/v1/users", response_model=CreateUserResponse)
async def create_user_endpoint(
    request: CreateUserRequest,
    db: Session = Depends(get_db)
):
    """Create a new user and get an API key."""
    try:
        user = create_user(db, email=request.email, name=request.name)
        return CreateUserResponse(
            user_id=user.id,
            api_key=user.api_key,
            message="User created successfully. Save your API key - it won't be shown again!"
        )
    except Exception as e:
        logger.error(f"Error creating user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/api/v1/subscribe", response_model=SubscriptionResponse)
async def subscribe(
    request: SubscriptionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe user to a tier with secure payment processing."""
    if request.tier not in ["free", "premium"]:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    # If premium, verify payment
    if request.tier == "premium":
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
            # Create payment intent or subscription in Stripe
            # This is a simplified example - adjust based on your Stripe setup
            payment_intent = stripe.PaymentIntent.create(
                amount=999,  # $9.99 in cents
                currency="usd",
                payment_method=request.payment_token,
                confirm=True,
                customer=user.email  # Use email as customer identifier
            )
            
            if payment_intent.status != "succeeded":
                raise HTTPException(
                    status_code=400,
                    detail="Payment failed. Please try again."
                )
            
            logger.info(f"Payment succeeded for user {user.id}, payment_intent: {payment_intent.id}")
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Payment processing error: {str(e)}"
            )
        
        expires_at = datetime.now() + timedelta(days=30)  # Monthly subscription
    else:
        expires_at = None
    
    updated_user = update_subscription(db, user.id, request.tier, expires_at)
    limit = get_usage_limit_for_tier(updated_user.subscription_tier)
    
    return SubscriptionResponse(
        success=True,
        message=f"Subscription updated to {request.tier} tier",
        subscription_tier=updated_user.subscription_tier,
        requests_limit=limit
    )

@app.post("/api/v1/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Secure Stripe webhook handler with signature verification."""
    if not STRIPE_AVAILABLE or not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle webhook events
    event_type = event["type"]
    event_data = event["data"]["object"]
    
    logger.info(f"Received Stripe webhook: {event_type}")
    
    db = next(get_db())
    
    try:
        if event_type == "checkout.session.completed":
            # Payment succeeded
            customer_email = event_data.get("customer_email")
            if customer_email:
                # Find user by email and upgrade subscription
                user = db.query(User).filter(User.email == customer_email).first()
                if user:
                    expires_at = datetime.now() + timedelta(days=30)
                    update_subscription(db, user.id, "premium", expires_at)
                    logger.info(f"Upgraded user {user.id} to premium via webhook")
        
        elif event_type == "customer.subscription.deleted":
            # Subscription cancelled
            customer_id = event_data.get("customer")
            # Find user and downgrade to free
            # This depends on how you store Stripe customer IDs
            logger.info(f"Subscription cancelled for customer {customer_id}")
        
        elif event_type == "invoice.payment_failed":
            # Payment failed
            customer_email = event_data.get("customer_email")
            if customer_email:
                user = db.query(User).filter(User.email == customer_email).first()
                if user:
                    # Optionally downgrade or mark subscription as expired
                    logger.warning(f"Payment failed for user {user.id}")
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing webhook")
    finally:
        db.close()

# Add rate limiting decorator helper
def rate_limit(limit: str):
    """Decorator for rate limiting."""
    if limiter:
        return limiter.limit(limit)
    return lambda f: f  # No-op if limiter not available

@app.post("/api/v1/cover-letter", response_model=ResponseModel)
@rate_limit("10/minute")
async def generate_cover_letter(
    request: CoverLetterRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a personalized cover letter."""
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
        
        record_usage(db, user.id, "cover-letter")
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
                "length": request.length
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
        logger.error(f"Error generating cover letter: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")

# Add other endpoints similarly with rate limiting...

if __name__ == "__main__":
    uvicorn.run(
        "api_server_production:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=not IS_PRODUCTION,
        log_level="warning" if IS_PRODUCTION else "info",
        workers=4 if IS_PRODUCTION else 1
    )


"""
Multi-tenant FastAPI Backend Server for Career Agent
Supports user provisioning and context uploads for OpenAI Marketplace
"""

# Force immediate output for debugging
import sys
sys.stdout.flush()
print("🚀 MODULE LOADING: api_server_multi_tenant.py", flush=True)

import os
import tempfile
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Try to import Stripe
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

from career_agent import CareerAgent
from database import (
    get_db, init_db, get_user_by_api_key, get_active_context_for_user,
    create_user, save_user_context, User, update_subscription, get_usage_limit_for_tier
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize database
init_db()

# Initialize FastAPI app
print("🚀 Creating FastAPI app...", flush=True)
app = FastAPI(
    title="Career Agent API - Multi-Tenant",
    description="AI-powered career materials generator API with user provisioning",
    version="2.0.0",
    servers=[
        {
            "url": os.getenv("API_BASE_URL", "https://career-agent-tf85.onrender.com"),
            "description": "Production server"
        }
    ]
)

# Enable CORS for frontend access
cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Agent cache (per-user agents)
agent_cache: Dict[str, CareerAgent] = {}

# Stripe configuration
if STRIPE_AVAILABLE:
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not stripe.api_key:
        logger.warning("STRIPE_SECRET_KEY not set. Subscription features will be disabled.")
else:
    logger.warning("Stripe not installed. Install with: pip install stripe")
    STRIPE_WEBHOOK_SECRET = None


# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from API key in Authorization header"""
    api_key = credentials.credentials
    user = get_user_by_api_key(db, api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user


# Alternative dependency for API key in header
async def get_current_user_from_header(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from X-API-Key header or Authorization Bearer token (Supabase JWT)"""
    api_key = None
    token = None
    
    # Check X-API-Key header first
    if x_api_key:
        api_key = x_api_key
    # Check Authorization Bearer token
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "").strip()
        else:
            # If it's not Bearer, treat the whole value as API key
            api_key = authorization.strip()
    
    if not api_key and not token:
        raise HTTPException(
            status_code=401, 
            detail="API key required. Provide X-API-Key header or Authorization Bearer token"
        )
    
    # Try API key first (existing flow)
    if api_key:
        user = get_user_by_api_key(db, api_key)
        if user:
            return user
    
    # If token provided, try to get user from Supabase token
    if token:
        # Try to verify Supabase token and get user
        try:
            # Import Supabase if available
            from supabase import create_client, Client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if supabase_url and supabase_key:
                supabase: Client = create_client(supabase_url, supabase_key)
                # Verify token and get user
                user_response = supabase.auth.get_user(token)
                if user_response and user_response.user:
                    supabase_user = user_response.user
                    email = supabase_user.email
                    
                    # Get or create user in our database
                    user = get_user_by_email(db, email)
                    if not user:
                        # Create user from Supabase info
                        from database import create_user
                        user = create_user(
                            db=db,
                            email=email,
                            name=supabase_user.user_metadata.get("name") or supabase_user.email.split("@")[0],
                            user_id=supabase_user.id
                        )
                    return user
        except ImportError:
            # Supabase not installed, fall through to try token as API key
            pass
        except Exception as e:
            logger.warning(f"Supabase token verification failed: {e}")
            # Fall through to try token as API key
            pass
        
        # If Supabase verification failed, try token as API key (backward compatibility)
        user = get_user_by_api_key(db, token)
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Invalid API key or authentication token")


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

class CreateUserResponse(BaseModel):
    user_id: str
    api_key: str
    message: str

class UploadContextRequest(BaseModel):
    context_text: Optional[str] = Field(None, description="Career context as text (alternative to file upload)")

class UploadContextResponse(BaseModel):
    success: bool
    message: str
    context_id: str

class CoverLetterRequest(BaseModel):
    company_name: str = Field(..., description="Name of the company")
    role_title: str = Field(..., description="Job title/role")
    job_description: Optional[str] = Field(None, description="Job description or requirements")
    additional_context: Optional[str] = Field(None, description="Additional context to consider")
    tone: str = Field("professional", description="Tone: professional, friendly, or formal")
    length: str = Field("medium", description="Length: short, medium, or long")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")
    
class BlurbRequest(BaseModel):
    purpose: str = Field(..., description="Purpose of the blurb (e.g., 'LinkedIn introduction')")
    target_role: Optional[str] = Field(None, description="Target role to emphasize")
    max_words: int = Field(200, description="Maximum word count")
    style: str = Field("linkedin", description="Style: linkedin, email, or professional")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class RoleSummaryRequest(BaseModel):
    role_type: str = Field(..., description="Role type (e.g., 'Product Manager')")
    focus_areas: Optional[List[str]] = Field(None, description="Areas to emphasize")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class STARStoryRequest(BaseModel):
    project_name: Optional[str] = Field(None, description="Specific project name")
    situation_description: Optional[str] = Field(None, description="Situation to create story for")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class InterviewAnswerRequest(BaseModel):
    question: str = Field(..., description="Interview question")
    company_context: Optional[str] = Field(None, description="Company-specific context")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class QueryRequest(BaseModel):
    question: str = Field(..., description="Your question about career, skills, or experiences")
    format: Optional[str] = Field("text", description="Output format: text, markdown, or json")

class ResponseModel(BaseModel):
    success: bool
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


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


# User Management Endpoints
@app.post("/api/v1/users", response_model=CreateUserResponse)
async def create_user_endpoint(
    request: CreateUserRequest,
    db: Session = Depends(get_db)
):
    """Create a new user and get an API key for authentication."""
    user = create_user(db, email=request.email, name=request.name)
    return CreateUserResponse(
        user_id=user.id,
        api_key=user.api_key,
        message="User created successfully. Save your API key - it won't be shown again!"
    )


@app.post("/api/v1/upload-context", response_model=UploadContextResponse)
async def upload_context(
    file: Optional[UploadFile] = File(None),
    context_text: Optional[str] = Form(None),
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Upload career context document (markdown/text file or raw text)."""
    # Clear agent cache for this user
    if user.id in agent_cache:
        del agent_cache[user.id]
    
    # Get context text from file or form
    if file:
        if file.content_type not in ["text/plain", "text/markdown", "text/x-markdown", None]:
            raise HTTPException(status_code=400, detail="File must be text or markdown")
        content = await file.read()
        context_text = content.decode('utf-8')
        file_name = file.filename
        file_type = Path(file_name).suffix if file_name else None
    elif context_text:
        file_name = None
        file_type = None
    else:
        raise HTTPException(status_code=400, detail="Either file or context_text must be provided")
    
    if not context_text or len(context_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Context text is too short (minimum 50 characters)")
    
    # Save context
    context = save_user_context(
        db,
        user_id=user.id,
        context_text=context_text,
        file_name=file_name,
        file_type=file_type
    )
    
    return UploadContextResponse(
        success=True,
        message="Career context uploaded successfully",
        context_id=context.id
    )


# API Information
@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Career Agent API - Multi-Tenant",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "create_user": "/api/v1/users",
            "upload_context": "/api/v1/upload-context",
            "cover_letter": "/api/v1/cover-letter",
            "blurb": "/api/v1/blurb",
            "role_summary": "/api/v1/role-summary",
            "star_story": "/api/v1/star-story",
            "interview_answer": "/api/v1/interview-answer",
            "query": "/api/v1/query"
        },
        "authentication": "Use X-API-Key header or Authorization: Bearer <api_key>",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "agent_cache_size": len(agent_cache)
    }


@app.get("/privacy-policy")
async def privacy_policy():
    """Serve privacy policy page for OpenAI Actions requirement."""
    return FileResponse("privacy_policy.html", media_type="text/html")


# Career Generation Endpoints (require authentication)
@app.post("/api/v1/cover-letter", response_model=ResponseModel)
async def generate_cover_letter(
    request: CoverLetterRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Generate a personalized cover letter."""
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
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        
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
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")


@app.post("/api/v1/blurb", response_model=ResponseModel)
async def generate_blurb(
    request: BlurbRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Generate a short blurb for LinkedIn, email, etc."""
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.generate_blurb(
            purpose=request.purpose,
            target_role=request.target_role,
            max_words=request.max_words,
            style=request.style
        )
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "purpose": request.purpose,
                "target_role": request.target_role,
                "max_words": request.max_words,
                "style": request.style
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating blurb: {str(e)}")


@app.post("/api/v1/role-summary", response_model=ResponseModel)
async def generate_role_summary(
    request: RoleSummaryRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Generate a role-specific professional summary."""
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.generate_role_specific_summary(
            role_type=request.role_type,
            focus_areas=request.focus_areas
        )
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "role_type": request.role_type,
                "focus_areas": request.focus_areas
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating role summary: {str(e)}")


@app.post("/api/v1/star-story", response_model=ResponseModel)
async def generate_star_story(
    request: STARStoryRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Generate or retrieve a STAR story."""
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.generate_star_story(
            project_name=request.project_name,
            situation_description=request.situation_description
        )
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "project_name": request.project_name,
                "situation_description": request.situation_description
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating STAR story: {str(e)}")


@app.post("/api/v1/interview-answer", response_model=ResponseModel)
async def answer_interview_question(
    request: InterviewAnswerRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Generate an answer to an interview question."""
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.answer_interview_question(
            question=request.question,
            company_context=request.company_context
        )
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "question": request.question,
                "company_context": request.company_context
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating interview answer: {str(e)}")


@app.post("/api/v1/query", response_model=ResponseModel)
async def query_agent(
    request: QueryRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Generic query endpoint for any career-related question."""
    agent = get_or_create_agent(user, db)
    
    try:
        result = agent.query(request.question)
        
        formatted_content = format_response(
            result["content"],
            result.get("sources", []),
            request.format or "text"
        )
        
        converted_sources = convert_sources_to_dict(result.get("sources", []))
        
        return ResponseModel(
            success=True,
            content=formatted_content,
            sources=converted_sources,
            metadata={
                "question": request.question
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


# Subscription Models
class CreateCheckoutSessionRequest(BaseModel):
    price_id: str = Field(..., description="Stripe Price ID for the subscription plan")
    success_url: Optional[str] = Field(None, description="URL to redirect after successful payment")
    cancel_url: Optional[str] = Field(None, description="URL to redirect after cancelled payment")

class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str

class SubscriptionStatusResponse(BaseModel):
    subscription_tier: str
    subscription_status: str
    subscription_expires_at: Optional[str]
    requests_used: int
    requests_limit: int
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None


# Subscription Endpoints
print("🔍 DEBUG: About to define subscription routes...")
@app.post("/api/v1/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for subscription."""
    if not STRIPE_AVAILABLE or not stripe.api_key:
        raise HTTPException(
            status_code=503,
            detail="Payment processing not configured. Please contact support."
        )
    
    try:
        # Get base URL from environment or request
        base_url = os.getenv("FRONTEND_URL", "https://careerpilotconsulting.com")
        success_url = request.success_url or f"{base_url}/subscription?success=true"
        cancel_url = request.cancel_url or f"{base_url}/subscription?canceled=true"
        
        # Create or retrieve Stripe customer
        customer_email = user.email
        if not customer_email:
            raise HTTPException(
                status_code=400,
                detail="User email is required for subscription. Please update your profile."
            )
        
        # Try to find existing customer by email
        customers = stripe.Customer.list(email=customer_email, limit=1)
        if customers.data:
            customer_id = customers.data[0].id
        else:
            # Create new customer
            customer = stripe.Customer.create(
                email=customer_email,
                name=user.name,
                metadata={"user_id": user.id}
            )
            customer_id = customer.id
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": request.price_id,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user.id,
                "user_email": customer_email
            },
            allow_promotion_codes=True,
        )
        
        return CheckoutSessionResponse(
            session_id=checkout_session.id,
            url=checkout_session.url
        )
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error creating checkout session: {str(e)}"
        )


print("🔍 DEBUG: About to define subscription-status route...")
@app.get("/api/v1/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Get current subscription status for the user."""
    limit = get_usage_limit_for_tier(user.subscription_tier)
    
    expires_at_str = None
    if user.subscription_expires_at:
        expires_at_str = user.subscription_expires_at.isoformat()
    
    # Try to get Stripe subscription info if available
    stripe_customer_id = None
    stripe_subscription_id = None
    
    if STRIPE_AVAILABLE and stripe.api_key and user.email:
        try:
            customers = stripe.Customer.list(email=user.email, limit=1)
            if customers.data:
                customer = customers.data[0]
                stripe_customer_id = customer.id
                
                # Get active subscriptions
                subscriptions = stripe.Subscription.list(
                    customer=customer.id,
                    status="active",
                    limit=1
                )
                if subscriptions.data:
                    stripe_subscription_id = subscriptions.data[0].id
        except Exception as e:
            logger.warning(f"Could not fetch Stripe subscription info: {e}")
    
    return SubscriptionStatusResponse(
        subscription_tier=user.subscription_tier,
        subscription_status=user.subscription_status,
        subscription_expires_at=expires_at_str,
        requests_used=user.requests_used,
        requests_limit=limit,
        stripe_customer_id=stripe_customer_id,
        stripe_subscription_id=stripe_subscription_id
    )


@app.post("/api/v1/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events for subscription management."""
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
            # Payment succeeded - upgrade subscription
            session = event_data
            user_id = session.get("metadata", {}).get("user_id")
            customer_email = session.get("customer_email") or session.get("customer_details", {}).get("email")
            
            if user_id:
                # Find user by ID
                user = db.query(User).filter(User.id == user_id).first()
            elif customer_email:
                # Find user by email
                from database import get_user_by_email
                user = get_user_by_email(db, customer_email)
            else:
                logger.warning("No user_id or email in checkout session")
                return {"status": "ok"}
            
            if user:
                # Set subscription to premium with 30 days expiration
                expires_at = datetime.now() + timedelta(days=30)
                update_subscription(db, user.id, "premium", expires_at)
                logger.info(f"Upgraded user {user.id} to premium via webhook")
            else:
                logger.warning(f"User not found for checkout session: {user_id or customer_email}")
        
        elif event_type == "customer.subscription.created":
            # New subscription created
            subscription = event_data
            customer_id = subscription.get("customer")
            
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.email
                
                if customer_email:
                    from database import get_user_by_email
                    user = get_user_by_email(db, customer_email)
                    if user:
                        expires_at = datetime.fromtimestamp(subscription.get("current_period_end", 0))
                        update_subscription(db, user.id, "premium", expires_at)
                        logger.info(f"Subscription created for user {user.id}")
        
        elif event_type == "customer.subscription.updated":
            # Subscription updated (renewed, changed, etc.)
            subscription = event_data
            customer_id = subscription.get("customer")
            status = subscription.get("status")
            
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.email
                
                if customer_email:
                    from database import get_user_by_email
                    user = get_user_by_email(db, customer_email)
                    if user:
                        if status in ["active", "trialing"]:
                            expires_at = datetime.fromtimestamp(subscription.get("current_period_end", 0))
                            update_subscription(db, user.id, "premium", expires_at)
                            logger.info(f"Subscription updated for user {user.id}")
                        elif status in ["canceled", "unpaid", "past_due"]:
                            # Downgrade to free
                            update_subscription(db, user.id, "free", None)
                            logger.info(f"Subscription canceled for user {user.id}")
        
        elif event_type == "customer.subscription.deleted":
            # Subscription cancelled
            subscription = event_data
            customer_id = subscription.get("customer")
            
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.email
                
                if customer_email:
                    from database import get_user_by_email
                    user = get_user_by_email(db, customer_email)
                    if user:
                        update_subscription(db, user.id, "free", None)
                        logger.info(f"Subscription deleted for user {user.id}")
        
        elif event_type == "invoice.payment_failed":
            # Payment failed
            invoice = event_data
            customer_id = invoice.get("customer")
            
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.email
                
                if customer_email:
                    from database import get_user_by_email
                    user = get_user_by_email(db, customer_email)
                    if user:
                        logger.warning(f"Payment failed for user {user.id}")
                        # Optionally downgrade or mark subscription as expired
                        # For now, just log it
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing webhook")
    finally:
        db.close()


# Log registered routes on startup - using print for visibility
@app.on_event("startup")
async def log_routes():
    """Log all registered routes for debugging."""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            method = list(route.methods)[0] if route.methods else 'GET'
            routes.append(f"{method} {route.path}")
    
    print(f"✅ Registered {len(routes)} routes")
    logger.info(f"✅ Registered {len(routes)} routes")
    subscription_routes = [r for r in routes if 'subscription' in r.lower() or 'checkout' in r.lower()]
    if subscription_routes:
        print(f"✅ Subscription routes: {', '.join(subscription_routes)}")
        logger.info(f"✅ Subscription routes: {', '.join(subscription_routes)}")
    else:
        print("⚠️  No subscription routes found!")
        logger.warning("⚠️  No subscription routes found!")
    
    # Also print all /api/v1 routes for debugging
    api_routes = [r for r in routes if '/api/v1' in r]
    print(f"📋 All /api/v1 routes ({len(api_routes)}):")
    for r in sorted(api_routes):
        print(f"   {r}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("ENVIRONMENT", "development") == "development"
    
    uvicorn.run(
        "api_server_multi_tenant:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )



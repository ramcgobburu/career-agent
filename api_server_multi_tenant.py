"""
Multi-tenant FastAPI Backend Server for Career Agent
Supports user provisioning and context uploads for OpenAI Marketplace
"""

import os
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from career_agent import CareerAgent
from database import (
    get_db, init_db, get_user_by_api_key, get_active_context_for_user,
    create_user, save_user_context, User
)

# Load environment variables
load_dotenv()

# Initialize database
init_db()

# Initialize FastAPI app
app = FastAPI(
    title="Career Agent API - Multi-Tenant",
    description="AI-powered career materials generator API with user provisioning",
    version="2.0.0"
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
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from X-API-Key header"""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required. Provide X-API-Key header or Authorization Bearer token")
    user = get_user_by_api_key(db, x_api_key)
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



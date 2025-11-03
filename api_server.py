"""
FastAPI Backend Server for Career Agent
Exposes REST API endpoints to interact with the Career Agent
"""

import os
import uvicorn
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from career_agent import CareerAgent

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Career Agent API",
    description="AI-powered career materials generator API",
    version="1.0.0"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instance (initialized on startup)
agent: Optional[CareerAgent] = None


# Request/Response Models
class CoverLetterRequest(BaseModel):
    company_name: str = Field(..., description="Name of the company")
    role_title: str = Field(..., description="Job title/role")
    job_description: Optional[str] = Field(None, description="Job description or requirements")
    additional_context: Optional[str] = Field(None, description="Additional context to consider (e.g., specific requirements, company culture, connections, etc.)")
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
    
    class Config:
        arbitrary_types_allowed = True


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
            # It's a LangChain Document
            converted.append({
                "page_content": source.page_content[:500],  # Limit length
                "metadata": source.metadata if source.metadata else {}
            })
        elif isinstance(source, dict):
            # Already a dictionary
            converted.append(source)
        else:
            # Fallback: convert to string representation
            converted.append({
                "content": str(source)[:500],
                "metadata": {}
            })
    return converted


@app.on_event("startup")
async def startup_event():
    """Initialize the Career Agent on server startup."""
    global agent
    
    print("🚀 Initializing Career Agent...")
    career_context_path = os.path.expanduser(
        "~/Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
    )
    
    try:
        agent = CareerAgent(
            career_context_path=career_context_path,
            model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.7
        )
        print("✅ Career Agent initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize Career Agent: {e}")
        raise


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Career Agent API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "cover_letter": "/api/v1/cover-letter",
            "blurb": "/api/v1/blurb",
            "role_summary": "/api/v1/role-summary",
            "star_story": "/api/v1/star-story",
            "interview_answer": "/api/v1/interview-answer",
            "query": "/api/v1/query"
        },
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agent_initialized": agent is not None
    }


@app.post("/api/v1/cover-letter", response_model=ResponseModel)
async def generate_cover_letter(request: CoverLetterRequest):
    """Generate a personalized cover letter."""
    if not agent:
        raise HTTPException(status_code=503, detail="Career Agent not initialized")
    
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
async def generate_blurb(request: BlurbRequest):
    """Generate a short blurb for LinkedIn, email, etc."""
    if not agent:
        raise HTTPException(status_code=503, detail="Career Agent not initialized")
    
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
async def generate_role_summary(request: RoleSummaryRequest):
    """Generate a role-specific professional summary."""
    if not agent:
        raise HTTPException(status_code=503, detail="Career Agent not initialized")
    
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
async def generate_star_story(request: STARStoryRequest):
    """Generate or retrieve a STAR story."""
    if not agent:
        raise HTTPException(status_code=503, detail="Career Agent not initialized")
    
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
async def answer_interview_question(request: InterviewAnswerRequest):
    """Generate an answer to an interview question."""
    if not agent:
        raise HTTPException(status_code=503, detail="Career Agent not initialized")
    
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
async def query_agent(request: QueryRequest):
    """Generic query endpoint for any career-related question."""
    if not agent:
        raise HTTPException(status_code=503, detail="Career Agent not initialized")
    
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
    # Run the server
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )


"""
Career Agent - AI-powered resume and cover letter generator
Uses LangChain RAG with OpenAI to generate personalized career materials
Supports multi-tenant architecture for OpenAI Marketplace
"""

import os
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
# Import chain functions - handle version differences
try:
    from langchain.chains.retrieval import create_retrieval_chain
except ImportError:
    # For older/newer versions, try alternate import path
    from langchain import chains
    if hasattr(chains, 'retrieval'):
        from langchain.chains.retrieval import create_retrieval_chain
    else:
        # This should work in LangChain 0.3.x
        from langchain.chains import create_retrieval_chain

try:
    from langchain.chains.combine_documents import create_stuff_documents_chain
except ImportError:
    from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

# Load environment variables
load_dotenv()


class CareerAgent:
    """
    AI Agent that uses RAG (Retrieval Augmented Generation) to generate
    personalized cover letters and blurbs based on career context.
    Supports multi-tenant architecture with per-user contexts.
    """
    
    def __init__(
        self,
        career_context_path: Optional[str] = None,
        career_context_text: Optional[str] = None,
        user_id: Optional[str] = None,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0.7,
        persist_directory: Optional[str] = None,
        user_name: Optional[str] = None
    ):
        """
        Initialize the Career Agent.
        
        Args:
            career_context_path: Path to the markdown file with career context (legacy)
            career_context_text: Direct text content of career context (preferred for multi-tenant)
            user_id: User ID for multi-tenant isolation
            model_name: OpenAI model to use (gpt-4o-mini, gpt-4o, gpt-4-turbo, etc.)
            temperature: Temperature for model responses (0.0-1.0)
            persist_directory: Directory to persist vector database (auto-generated if None)
            user_name: Optional user name for personalization in prompts
        """
        self.model_name = model_name
        self.temperature = temperature
        self.user_id = user_id
        self.user_name = user_name or "the user"
        
        # Determine vector store location
        if persist_directory:
            self.persist_directory = persist_directory
        elif user_id:
            self.persist_directory = f"./chroma_db/{user_id}"
        else:
            self.persist_directory = "./chroma_db"
        
        # Validate API key
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError(
                "OPENAI_API_KEY not found. Please set it in .env file or environment variables."
            )
        
        # Initialize components
        self.llm = ChatOpenAI(
            model=model_name,
            temperature=temperature
        )
        
        self.embeddings = OpenAIEmbeddings()
        
        # Load and process career context
        if career_context_text:
            self.vectorstore = self._load_and_index_from_text(career_context_text)
        elif career_context_path:
            self.career_context_path = Path(career_context_path)
            self.vectorstore = self._load_and_index_from_path()
        else:
            raise ValueError("Either career_context_path or career_context_text must be provided")
        
        self.qa_chain = self._create_qa_chain()
    
    def _load_and_index_from_text(self, context_text: str):
        """Load from text content and create a vector store for RAG."""
        print(f"Loading career context from text for user {self.user_id or 'default'}...")
        
        # Create document from text
        document = Document(page_content=context_text)
        
        # Split into chunks optimized for RAG
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=200,
            separators=["\n\n---\n\n", "\n\n## ", "\n\n### ", "\n\n", "\n", " "],
            length_function=len,
        )
        
        chunks = text_splitter.split_documents([document])
        print(f"Split document into {len(chunks)} chunks")
        
        # Create or recreate vector store (per-user isolation)
        if os.path.exists(self.persist_directory):
            # Delete existing store to recreate with new content
            import shutil
            shutil.rmtree(self.persist_directory)
        
        print(f"Creating new vector store at {self.persist_directory}...")
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        print(f"Vector store persisted to {self.persist_directory}")
        
        return vectorstore
    
    def _load_and_index_from_path(self):
        """Load the markdown file and create a vector store for RAG (legacy method)."""
        if not self.career_context_path.exists():
            raise FileNotFoundError(
                f"Career context file not found: {self.career_context_path}"
            )
        
        print(f"Loading career context from {self.career_context_path}...")
        
        # Load the markdown file
        loader = TextLoader(str(self.career_context_path), encoding='utf-8')
        documents = loader.load()
        
        # Split into chunks optimized for RAG
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=200,
            separators=["\n\n---\n\n", "\n\n## ", "\n\n### ", "\n\n", "\n", " "],
            length_function=len,
        )
        
        chunks = text_splitter.split_documents(documents)
        print(f"Split document into {len(chunks)} chunks")
        
        # Create or load vector store
        if os.path.exists(self.persist_directory):
            print(f"Loading existing vector store from {self.persist_directory}")
            vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
        else:
            print("Creating new vector store...")
            vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory=self.persist_directory
            )
            print(f"Vector store persisted to {self.persist_directory}")
        
        return vectorstore
    
    def _create_qa_chain(self):
        """Create the QA chain with custom prompt template."""
        
        # Create retriever
        retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}  # Retrieve top 5 most relevant chunks
        )
        
        # Custom prompt template for career-related queries (generic for multi-tenant)
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are an expert career advisor helping {self.user_name} create personalized career materials.

Use the following career context to answer questions accurately and comprehensively. Always:
1. Extract relevant achievements, skills, and experiences
2. Use specific metrics and numbers when available
3. Match the tone and style of the request
4. Reference specific companies, roles, and outcomes
5. Keep responses concise but impactful
6. Personalize all content to match {self.user_name}'s background and experiences"""),
            ("human", """Context from career document:
{context}

Question: {input}

Provide a detailed, personalized response:""")
        ])
        
        # Create document chain
        document_chain = create_stuff_documents_chain(self.llm, prompt)
        
        # Create retrieval chain
        qa_chain = create_retrieval_chain(retriever, document_chain)
        
        return qa_chain
    
    def generate_cover_letter(
        self,
        company_name: str,
        role_title: str,
        job_description: Optional[str] = None,
        additional_context: Optional[str] = None,
        tone: str = "professional",
        length: str = "medium"
    ) -> Dict[str, Any]:
        """
        Generate a personalized cover letter.
        
        Args:
            company_name: Name of the company
            role_title: Title of the role being applied for
            job_description: Optional job description or key requirements
            tone: professional, friendly, or formal
            length: short, medium, or long
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        length_guidance = {
            "short": "2-3 paragraphs",
            "medium": "4-5 paragraphs",
            "long": "6+ paragraphs"
        }
        
        # Build context section
        context_parts = []
        if job_description:
            context_parts.append(f"Job Description/Requirements:\n{job_description}")
        if additional_context:
            context_parts.append(f"Additional Context:\n{additional_context}")
        context_section = "\n\n".join(context_parts) if context_parts else ""
        
        query = f"""Generate a personalized cover letter for {company_name} for the role of {role_title}.

Requirements:
- Tone: {tone}
- Length: {length_guidance.get(length, 'medium')}
- Include specific achievements and metrics from {self.user_name}'s experience
- Highlight relevant skills and experiences for this role
- Use information from the career context document
- Close professionally with a call to action

{context_section if context_section else ""}

Format the letter with proper greeting and closing."""
        
        result = self.qa_chain.invoke({"input": query})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }
    
    def generate_blurb(
        self,
        purpose: str,
        target_role: Optional[str] = None,
        max_words: int = 200,
        style: str = "linkedin"
    ) -> Dict[str, Any]:
        """
        Generate a short blurb for LinkedIn, email, or other purposes.
        
        Args:
            purpose: Purpose of the blurb (e.g., "LinkedIn introduction", "email outreach")
            target_role: Optional target role to emphasize
            max_words: Maximum word count
            style: linkedin, email, or professional
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        query = f"""Create a {max_words}-word {purpose} blurb for {self.user_name}.

Requirements:
- Style: {style}
- Maximum {max_words} words
- Include key achievements with metrics from {self.user_name}'s career context
- Highlight relevant experience{' for ' + target_role if target_role else ''}
- Engaging and professional tone
- Include a call to action or next steps"""
        
        result = self.qa_chain.invoke({"input": query})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }
    
    def generate_role_specific_summary(
        self,
        role_type: str,
        focus_areas: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Generate a role-specific summary using the role profiles section.
        
        Args:
            role_type: Product Manager, Engineering Manager, QA Lead, etc.
            focus_areas: Optional list of areas to emphasize
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        focus_text = f" with focus on: {', '.join(focus_areas)}" if focus_areas else ""
        
        query = f"""Generate a role-specific professional summary for {role_type}{focus_text}.

Use the role-specific profiles section to:
- Create a compelling headline
- List core competencies relevant to this role
- Include proof points with metrics
- Format professionally for resumes or profiles"""
        
        result = self.qa_chain.invoke({"input": query})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }
    
    def generate_star_story(
        self,
        project_name: Optional[str] = None,
        situation_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate or retrieve a STAR story.
        
        Args:
            project_name: Specific project name (e.g., "Manhattan WMOS Migration")
            situation_description: Describe a situation to create a new STAR story for
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        if project_name:
            query = f"""Retrieve and format the STAR story for {project_name} from the career context.

Include:
- Situation
- Task
- Action
- Results (with metrics)

Format clearly with headings."""
        else:
            query = f"""Create a STAR story based on this situation:
{situation_description}

Use relevant experiences and achievements from {self.user_name}'s career context to craft:
- Situation
- Task
- Action  
- Results (with specific metrics)

Make it compelling and authentic."""
        
        result = self.qa_chain.invoke({"input": query})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }
    
    def answer_interview_question(
        self,
        question: str,
        company_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an answer to an interview question.
        
        Args:
            question: The interview question
            company_context: Optional company-specific context
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        context_text = f"\nCompany Context: {company_context}" if company_context else ""
        
        query = f"""Answer this interview question using {self.user_name}'s career context and interview prep section:

Question: {question}
{context_text}

Provide:
- A clear, structured answer (60-90 seconds if appropriate)
- Specific examples from experience
- Relevant metrics and outcomes
- Authentic voice matching {self.user_name}'s background"""
        
        result = self.qa_chain.invoke({"input": query})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }
    
    def generate_job_application_answer(
        self,
        question: str,
        company_name: Optional[str] = None,
        job_description: Optional[str] = None,
        role_title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an answer to a job application question.
        Similar to Eztrackr's Job Application Answer Generator.
        
        Args:
            question: The application question (e.g., "Why do you want to work for us?")
            company_name: Company name
            job_description: Full job description
            role_title: Job title/role
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        context_parts = []
        
        if company_name:
            context_parts.append(f"Company: {company_name}")
        if role_title:
            context_parts.append(f"Role: {role_title}")
        if job_description:
            context_parts.append(f"Job Description: {job_description}")
        
        context_text = "\n".join(context_parts) if context_parts else ""
        
        query = f"""Answer this job application question using {self.user_name}'s career context:

Application Question: {question}
{context_text}

Provide:
- A concise, tailored answer (typically 100-200 words)
- Specific reasons why {self.user_name} is interested in this role/company
- Relevant skills and experiences that match the job requirements
- Authentic and enthusiastic tone
- Connection between {self.user_name}'s background and the company/role
- Professional yet personal voice

Make it compelling and specific to this opportunity."""
        
        result = self.qa_chain.invoke({"input": query})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }
    
    def query(self, question: str) -> Dict[str, Any]:
        """
        Generic query method for any career-related question.
        
        Args:
            question: Your question about career, skills, or experiences
        
        Returns:
            Dictionary with 'content' and 'sources'
        """
        result = self.qa_chain.invoke({"input": question})
        
        return {
            "content": result["answer"],
            "sources": result.get("context", [])
        }


def main():
    """Example usage of the Career Agent."""
    
    # Path to your career context file
    career_context_path = "../Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
    
    # Initialize agent
    print("Initializing Career Agent...")
    agent = CareerAgent(
        career_context_path=career_context_path,
        model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    )
    
    # Example 1: Generate cover letter
    print("\n" + "="*50)
    print("Example 1: Generating Cover Letter")
    print("="*50)
    cover_letter = agent.generate_cover_letter(
        company_name="ServiceNow",
        role_title="Senior Product Manager - AI Platform",
        job_description="Looking for PM with ServiceNow experience and AI/ML background",
        tone="professional",
        length="medium"
    )
    print(cover_letter["content"])
    
    # Example 2: Generate LinkedIn blurb
    print("\n" + "="*50)
    print("Example 2: Generating LinkedIn Blurb")
    print("="*50)
    blurb = agent.generate_blurb(
        purpose="LinkedIn introduction post",
        target_role="Engineering Manager",
        max_words=150,
        style="linkedin"
    )
    print(blurb["content"])
    
    # Example 3: Get role-specific summary
    print("\n" + "="*50)
    print("Example 3: Role-Specific Summary")
    print("="*50)
    summary = agent.generate_role_specific_summary(
        role_type="Product Manager",
        focus_areas=["AI/ML", "Cloud Platforms", "Mobile Apps"]
    )
    print(summary["content"])
    
    # Example 4: Get STAR story
    print("\n" + "="*50)
    print("Example 4: STAR Story")
    print("="*50)
    star = agent.generate_star_story(project_name="Manhattan WMOS Migration")
    print(star["content"])


if __name__ == "__main__":
    main()


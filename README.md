# Career Agent 🤖

An AI-powered career assistant built with LangChain and OpenAI that generates personalized cover letters, LinkedIn blurbs, and other career materials based on your comprehensive career context document.

## Features

- ✅ **RAG (Retrieval Augmented Generation)** - Uses your career context as knowledge base
- ✅ **Cover Letter Generation** - Personalized cover letters for specific roles and companies
- ✅ **LinkedIn Blurbs** - Short, impactful introductions and posts
- ✅ **Role-Specific Summaries** - Tailored summaries for different role types
- ✅ **STAR Stories** - Retrieve and format STAR stories from your experience
- ✅ **Interview Prep** - Generate answers to interview questions
- ✅ **Custom Queries** - Ask any question about your career background

## Architecture

The agent uses:
- **LangChain** for orchestration and RAG pipeline
- **OpenAI API** (GPT-4o-mini or GPT-4o) for generation
- **ChromaDB** for vector storage and semantic search
- **Text chunking** optimized for career context (1500 chars, 200 overlap)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure OpenAI API Key

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional: gpt-4o, gpt-4-turbo, etc.
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Update Career Context Path

Update the path in `example_usage.py` or your own script to point to your `ram_career_context.md` file:

```python
career_context_path = "~/Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
```

## Usage

### Quick Start

Run the example script:

```bash
python example_usage.py
```

### In Your Own Code

```python
from career_agent import CareerAgent

# Initialize agent
agent = CareerAgent(
    career_context_path="path/to/ram_career_context.md",
    model_name="gpt-4o-mini"
)

# Generate cover letter
cover_letter = agent.generate_cover_letter(
    company_name="Google",
    role_title="Senior Product Manager",
    job_description="Looking for PM with AI/ML experience...",
    tone="professional",
    length="medium"
)
print(cover_letter["content"])

# Generate LinkedIn blurb
blurb = agent.generate_blurb(
    purpose="LinkedIn introduction",
    target_role="Engineering Manager",
    max_words=200,
    style="linkedin"
)
print(blurb["content"])

# Custom query
response = agent.query("What are my key achievements at ACE Hardware?")
print(response["content"])
```

## API Reference

### CareerAgent Class

#### Initialization

```python
agent = CareerAgent(
    career_context_path: str,      # Path to markdown career context
    model_name: str = "gpt-4o-mini", # OpenAI model
    temperature: float = 0.7,        # 0.0-1.0
    persist_directory: str = "./chroma_db"  # Vector DB location
)
```

#### Methods

##### `generate_cover_letter()`
Generate a personalized cover letter.

**Parameters:**
- `company_name` (str): Company name
- `role_title` (str): Job title
- `job_description` (str, optional): Job requirements
- `tone` (str): "professional", "friendly", or "formal"
- `length` (str): "short", "medium", or "long"

**Returns:** `{"content": str, "sources": list}`

##### `generate_blurb()`
Generate short blurbs for LinkedIn, email, etc.

**Parameters:**
- `purpose` (str): Purpose description
- `target_role` (str, optional): Target role
- `max_words` (int): Word limit
- `style` (str): "linkedin", "email", or "professional"

**Returns:** `{"content": str, "sources": list}`

##### `generate_role_specific_summary()`
Generate role-specific professional summary.

**Parameters:**
- `role_type` (str): Role type (e.g., "Product Manager")
- `focus_areas` (list, optional): Areas to emphasize

**Returns:** `{"content": str, "sources": list}`

##### `generate_star_story()`
Retrieve or create STAR stories.

**Parameters:**
- `project_name` (str, optional): Specific project name
- `situation_description` (str, optional): Situation to create story for

**Returns:** `{"content": str, "sources": list}`

##### `answer_interview_question()`
Generate interview question answers.

**Parameters:**
- `question` (str): Interview question
- `company_context` (str, optional): Company-specific context

**Returns:** `{"content": str, "sources": list}`

##### `query()`
Generic query method for any career-related question.

**Parameters:**
- `question` (str): Your question

**Returns:** `{"content": str, "sources": list}`

## Vector Database

The agent creates a local ChromaDB vector store (in `./chroma_db/`) for fast semantic search. The first run will index your document. Subsequent runs reuse the index for faster startup.

To rebuild the index, delete the `chroma_db` directory.

## Why LangChain + OpenAI?

**LangChain Advantages:**
- ✅ Built-in RAG pipeline with document loaders and vector stores
- ✅ Flexible prompt templating
- ✅ Easy to extend with more data sources
- ✅ Production-ready abstractions

**OpenAI API Advantages:**
- ✅ High-quality generation (GPT-4o models)
- ✅ Reliable API
- ✅ Good cost-performance balance (GPT-4o-mini)

**Alternative Consideration:**
- Pure OpenAI API: Simpler but requires manual RAG implementation
- Other LLMs: LangChain supports Anthropic, Cohere, etc.

## Cost Considerations

- **GPT-4o-mini**: ~$0.15/1M input tokens, ~$0.60/1M output tokens
- **GPT-4o**: ~$2.50/1M input tokens, ~$10/1M output tokens

For this use case, **GPT-4o-mini** provides excellent quality at much lower cost.

## Tips for Best Results

1. **Keep career context updated** - Update `ram_career_context.md` regularly
2. **Be specific in prompts** - Include company context, role requirements
3. **Adjust temperature** - Lower (0.3-0.5) for more factual, higher (0.7-0.9) for creative
4. **Review and edit** - Generated content should be reviewed and personalized
5. **Iterate** - Try different prompts to refine outputs

## Troubleshooting

### "OPENAI_API_KEY not found"
- Ensure `.env` file exists with `OPENAI_API_KEY=...`
- Or set environment variable: `export OPENAI_API_KEY=...`

### "Career context file not found"
- Check the path in your script
- Use absolute path or ensure relative path is correct

### Slow first run
- First run indexes the document (one-time cost)
- Subsequent runs reuse the vector store

### Quality issues
- Try GPT-4o instead of GPT-4o-mini
- Adjust temperature parameter
- Provide more context in your prompts
- Review and refine your career context document

## License

Personal use project.

## Support

For issues or questions, review the code comments or adjust prompts for your specific needs.


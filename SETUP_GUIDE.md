# Setup Guide: Career Agent

## Why LangChain + OpenAI?

### Recommended Approach: **LangChain with OpenAI API**

#### ✅ Advantages:

1. **Built-in RAG Pipeline**
   - LangChain provides ready-made components for document loading, chunking, and vector storage
   - No need to manually implement semantic search or embedding logic
   - Handles text splitting, overlap, and context preservation automatically

2. **Flexible & Extensible**
   - Easy to add more data sources (PDFs, web pages, databases)
   - Switch between different LLMs (OpenAI, Anthropic, local models) without code changes
   - Modular architecture - swap components as needed

3. **Production-Ready**
   - Handles edge cases, retries, and error handling
   - Supports multiple vector stores (Chroma, Pinecone, Weaviate)
   - Built-in prompt templates and chain orchestration

4. **Cost-Effective**
   - GPT-4o-mini: ~$0.15/1M input tokens (great for this use case)
   - Vector store persists locally (no additional API costs)
   - Smart chunking reduces token usage

5. **Developer Experience**
   - Clean abstractions - focus on your use case, not infrastructure
   - Active community and documentation
   - Easy to debug and iterate

### Alternative: Pure OpenAI API

**When to consider:**
- Very simple use cases (no RAG needed)
- You want minimal dependencies
- You're comfortable implementing RAG yourself

**Trade-offs:**
- ❌ Must manually implement document chunking, embedding, and retrieval
- ❌ More code to write and maintain
- ❌ Less flexible for future enhancements

**Verdict:** For your use case (generating personalized materials from a large context document), **LangChain is the clear winner**.

## Architecture Overview

```
Your Markdown File
    ↓
Text Loader (LangChain)
    ↓
Text Splitter (chunks of 1500 chars, 200 overlap)
    ↓
Embeddings (OpenAI text-embedding-3-small)
    ↓
Vector Store (ChromaDB - local, persistent)
    ↓
Query → Retrieve Top 5 Relevant Chunks
    ↓
LLM (GPT-4o-mini) with Context + Prompt
    ↓
Generated Content
```

## Step-by-Step Setup

### Step 1: Install Python Dependencies

```bash
cd /Users/ramgobburu/Documents/career-agent
pip install -r requirements.txt
```

**What gets installed:**
- `langchain`: Core framework
- `langchain-openai`: OpenAI integration
- `langchain-community`: Community loaders/utilities
- `openai`: OpenAI Python SDK
- `python-dotenv`: Environment variable management
- `chromadb`: Vector database
- `tiktoken`: Token counting

### Step 2: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. **Important:** Copy and save it (you won't see it again)

### Step 3: Create .env File

In the project directory, create a `.env` file:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

**Important:** 
- Never commit `.env` to git (it's in `.gitignore`)
- Keep your API key secret

### Step 4: Verify Career Context Path

Check that the path to your markdown file is correct in the scripts:

```python
career_context_path = os.path.expanduser(
    "~/Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
)
```

Update this path if your file is located elsewhere.

### Step 5: Test the Setup

Run the example script:

```bash
python example_usage.py
```

**First run will:**
1. Load your markdown file
2. Split it into chunks
3. Create embeddings
4. Build vector database (saved to `./chroma_db/`)
5. Generate example outputs

**Subsequent runs** will reuse the vector database (much faster).

### Step 6: Use the Agent

#### Option A: Interactive CLI

```bash
python interactive_cli.py
```

Follow the menu prompts to generate different materials.

#### Option B: In Your Own Script

```python
from career_agent import CareerAgent

agent = CareerAgent(
    career_context_path="path/to/ram_career_context.md"
)

# Generate cover letter
result = agent.generate_cover_letter(
    company_name="Google",
    role_title="Senior PM",
    job_description="...",
    tone="professional"
)
print(result["content"])
```

## Understanding the Components

### 1. CareerAgent Class

Main class that orchestrates everything:
- Loads your career context
- Creates vector store
- Manages LLM interactions
- Provides convenient methods for different use cases

### 2. Vector Store (ChromaDB)

- Stores embedded chunks of your document
- Enables semantic search (finds relevant sections)
- Persists to disk (`./chroma_db/`) for reuse
- No external service needed (runs locally)

### 3. RetrievalQA Chain

- Takes your query
- Searches vector store for relevant context
- Combines context + query into prompt
- Sends to LLM
- Returns generated content

### 4. Prompt Templates

Custom prompts for different tasks:
- Cover letter generation
- Blurb creation
- STAR stories
- Interview answers

All prompts include instructions to use your career context and maintain your voice.

## Customization Options

### Change Model

Edit `.env`:
```bash
OPENAI_MODEL=gpt-4o  # More powerful, more expensive
```

Or in code:
```python
agent = CareerAgent(
    career_context_path="...",
    model_name="gpt-4o"
)
```

**Model Options:**
- `gpt-4o-mini`: Best cost/performance ratio (recommended)
- `gpt-4o`: More powerful, better quality
- `gpt-4-turbo`: Faster than gpt-4o
- `gpt-3.5-turbo`: Cheaper but lower quality

### Adjust Temperature

Higher = more creative, Lower = more factual:

```python
agent = CareerAgent(
    career_context_path="...",
    temperature=0.5  # More focused (default: 0.7)
)
```

### Modify Chunking Strategy

Edit `career_agent.py` in `_load_and_index_context()`:

```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,      # Larger chunks (default: 1500)
    chunk_overlap=300,   # More overlap (default: 200)
    # ...
)
```

### Add More Retrieval Context

In `_create_qa_chain()`, change `k` parameter:

```python
retriever=self.vectorstore.as_retriever(
    search_kwargs={"k": 10}  # Retrieve 10 chunks (default: 5)
)
```

## Troubleshooting

### Issue: "OPENAI_API_KEY not found"

**Solution:**
1. Check `.env` file exists and has `OPENAI_API_KEY=...`
2. Ensure file is in project root
3. Try: `export OPENAI_API_KEY=...` in terminal

### Issue: "Career context file not found"

**Solution:**
1. Check file path in script
2. Use absolute path: `/Users/ramgobburu/Desktop/...`
3. Verify file exists: `ls ~/Desktop/Resumes/Career\ Buddy\ Resumes/`

### Issue: Slow first run

**Expected behavior:** First run takes 30-60 seconds to index document. This is normal.

### Issue: Poor quality outputs

**Solutions:**
1. Use GPT-4o instead of GPT-4o-mini
2. Lower temperature (0.3-0.5) for more factual
3. Provide more context in prompts
4. Review and update your career context document

### Issue: ChromaDB errors

**Solution:**
```bash
rm -rf chroma_db/  # Delete and rebuild
python example_usage.py
```

## Cost Estimates

### GPT-4o-mini (Recommended)
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- Typical cover letter: ~$0.01-0.02
- Typical blurb: ~$0.005-0.01

### GPT-4o
- Input: ~$2.50 per 1M tokens
- Output: ~$10 per 1M tokens
- Typical cover letter: ~$0.10-0.20

**Recommendation:** Start with GPT-4o-mini. Upgrade to GPT-4o if quality is insufficient.

## Next Steps

1. ✅ Complete setup
2. ✅ Run example_usage.py to verify
3. ✅ Try interactive_cli.py
4. ✅ Generate your first cover letter
5. ✅ Customize prompts for your style
6. ✅ Build your own scripts for specific workflows

## Advanced: Extending the Agent

### Add PDF Support

```python
from langchain_community.document_loaders import PyPDFLoader

# In CareerAgent.__init__:
if career_context_path.suffix == '.pdf':
    loader = PyPDFLoader(str(career_context_path))
else:
    loader = TextLoader(str(career_context_path), encoding='utf-8')
```

### Add Multiple Documents

```python
from langchain_community.document_loaders import DirectoryLoader

loader = DirectoryLoader(
    "path/to/career_docs/",
    glob="*.md"
)
documents = loader.load()
```

### Add Web Search (for company research)

```python
from langchain.tools import DuckDuckGoSearchRun

search = DuckDuckGoSearchRun()
company_info = search.run(f"{company_name} company culture values")
# Use in cover letter generation
```

### Export to File

```python
def save_cover_letter(agent, filename):
    result = agent.generate_cover_letter(...)
    with open(filename, 'w') as f:
        f.write(result["content"])
```

## Questions?

Review the code comments in `career_agent.py` for detailed explanations of each component.


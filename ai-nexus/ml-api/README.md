# AI-NEXUS ML API

FastAPI-based service for analyzing interview transcripts and generating AI-powered scorecards.

## Features

- **Mock Interview Analysis** (`/api/analyze-mock`) - Test endpoint for analyzing mock transcripts
- **Live Interview Analysis** (`/api/analyze`) - Production endpoint for analyzing real interviews
- **Q&A Pairing** - Automatically pairs HR questions with candidate answers
- **Ideal Answer Generation** - Generates ideal answers based on job description
- **Scoring System** - Scores each answer (0-10) with detailed justification
- **Summary Generation** - Creates HR and candidate summaries

## Prerequisites

- Python 3.8 or higher
- MongoDB (optional, for production endpoints)
- OpenAI API key or Anthropic API key (set in `.env` file)

## Environment Variables

Create a `.env` file in the `ml-api` directory:

```env
# LLM Provider (openai or anthropic)
LLM_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Configuration (alternative)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# MongoDB (optional, for production)
MONGODB_URI=mongodb://localhost:27017/ai-nexus
```

## Installation & Running

### Option 1: Using Batch Script (Windows)

```bash
start_ml_api.bat
```

### Option 2: Using Shell Script (Linux/Mac)

```bash
chmod +x start_ml_api.sh
./start_ml_api.sh
```

### Option 3: Using Python Script (Cross-platform)

```bash
python run.py
```

### Option 4: Manual Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
cd app
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
```
GET http://localhost:8000/api/health
```

### Mock Interview Analysis
```
POST http://localhost:8000/api/analyze-mock
Content-Type: multipart/form-data

Parameters:
- jobDescription: File (optional) - Job description file (.txt, .pdf, .md)
- jobDescriptionText: String (optional) - Job description as text
- mockTranscript: String (required) - Mock interview transcript

Example transcript format:
HR: Welcome to the interview. Can you tell me about yourself?
Candidate: Thank you. I'm a software engineer with 5 years of experience...
HR: Great! Can you explain how you would design a scalable system?
Candidate: I would start by identifying the requirements...
```

### Live Interview Analysis
```
POST http://localhost:8000/api/analyze
Content-Type: application/json

Body:
{
  "interviewId": "interview-123"
}
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Response Format

```json
{
  "overallScore": 85.5,
  "aiSummaryHR": "The candidate demonstrates strong technical skills...",
  "aiSummaryCandidate": "You performed well in the interview...",
  "qaBreakdown": [
    {
      "question": "Tell me about yourself",
      "candidateAnswer": "I'm a software engineer...",
      "idealAnswer": "An ideal answer would include...",
      "score": 8.5,
      "justification": "The candidate provided a comprehensive answer..."
    }
  ]
}
```

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, change it in the script:
```python
--port 8001
```

### MongoDB Connection Issues
MongoDB is optional for the mock analysis endpoint. For production endpoints, ensure MongoDB is running and the connection string is correct.

### API Key Issues
Make sure your `.env` file contains a valid API key for your chosen LLM provider.

## Development

To run in development mode with auto-reload:
```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## License

Part of the AI-NEXUS project.


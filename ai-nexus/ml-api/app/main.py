"""
AI-NEXUS ML API
Post-interview analysis service using FastAPI
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import pymongo
import re
from services.analysis_service import AnalysisService
from services.file_parser import parse_jd_file, parse_mock_transcript

load_dotenv()

app = FastAPI(title="AI-NEXUS ML API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/ai-nexus")
try:
    client = pymongo.MongoClient(MONGODB_URI)
    db = client["ai-nexus"]
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"⚠️ MongoDB connection failed: {e}")
    db = None

# Initialize analysis service
analysis_service = AnalysisService()


class AnalyzeRequest(BaseModel):
    interviewId: str

class RealTimeIdealAnswerRequest(BaseModel):
    question: str
    jobDescription: str


@app.get("/")
def root():
    return {"message": "AI-NEXUS ML API", "status": "running"}


@app.post("/api/analyze-mock")
async def analyze_mock_interview(
    jobDescription: Optional[UploadFile] = File(None),
    jobDescriptionText: Optional[str] = Form(None),
    mockTranscript: str = Form(...)
):
    """
    🎯 PRIORITY 2 SPIKE: Test endpoint for AI analysis pipeline
    Accepts JD (file or text) and mock transcript, returns full analysis report
    """
    try:
        print("\n" + "="*80)
        print("🧠 Starting Mock Interview Analysis")
        print("="*80)
        
        # Extract Job Description
        jd_text = ""
        if jobDescription:
            print(f"📄 Processing JD file: {jobDescription.filename}")
            jd_text = await parse_jd_file(jobDescription)
        elif jobDescriptionText:
            print("📄 Using JD text")
            jd_text = jobDescriptionText
        else:
            raise HTTPException(status_code=400, detail="Job Description is required (file or text)")
        
        if not jd_text.strip():
            raise HTTPException(status_code=400, detail="Job Description cannot be empty")
        
        print(f"✅ JD loaded ({len(jd_text)} characters)")
        
        # Parse mock transcript
        print("📝 Parsing mock transcript...")
        hr_transcript, candidate_transcript = parse_mock_transcript(mockTranscript)
        print(f"✅ HR transcript: {len(hr_transcript)} chars")
        print(f"✅ Candidate transcript: {len(candidate_transcript)} chars")
        
        # Run analysis pipeline
        interview_id = f"mock-{os.urandom(4).hex()}"
        report = await analysis_service.analyze_interview(
            interview_id=interview_id,
            hr_transcript=hr_transcript,
            candidate_transcript=candidate_transcript,
            job_description=jd_text,
            candidate_id="mock-candidate",
            hr_id="mock-hr"
        )
        
        print("="*80)
        print("✅ Analysis Complete!")
        print("="*80 + "\n")
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in mock analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_interview(request: AnalyzeRequest):
    """
    Main analysis endpoint triggered after interview ends.
    Performs:
    1. Fetch transcripts and JD from MongoDB
    2. Q&A Pairing using LLM
    3. Generate Ideal Answers
    4. Score and generate feedback
    5. Save report to MongoDB
    """
    try:
        interview_id = request.interviewId
        
        if not db:
            raise HTTPException(status_code=500, detail="MongoDB not connected")
        
        # Fetch interview data
        interview = db.interviews.find_one({"interviewId": interview_id})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Extract transcripts
        hr_transcript = " ".join([
            t["text"] for t in interview.get("transcripts", [])
            if t.get("role") == "hr" and t.get("isFinal")
        ])
        
        candidate_transcript = " ".join([
            t["text"] for t in interview.get("transcripts", [])
            if t.get("role") == "candidate" and t.get("isFinal")
        ])
        
        # Get JD
        jd = interview.get("jobDescription", {}).get("text", "")
        if not jd and interview.get("jobDescription", {}).get("fileUrl"):
            # In production, read from file storage
            jd = "Job description from file"
        
        # Run analysis pipeline
        report = await analysis_service.analyze_interview(
            interview_id=interview_id,
            hr_transcript=hr_transcript,
            candidate_transcript=candidate_transcript,
            job_description=jd,
            candidate_id=str(interview["candidateId"]),
            hr_id=str(interview["hrId"])
        )
        
        # Save report to MongoDB
        db.interviewreports.insert_one(report)
        
        return {"success": True, "reportId": str(report.get("_id", ""))}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-ideal-answer")
async def generate_ideal_answer_realtime(request: RealTimeIdealAnswerRequest):
    """
    Real-time endpoint to generate ideal answer for a question.
    Called immediately when HR asks a question during live interview.
    """
    try:
        print(f"🧠 Generating ideal answer for question: {request.question[:50]}...")
        
        ideal_answer = await analysis_service.generate_ideal_answer(
            request.question,
            request.jobDescription
        )
        
        return {
            "question": request.question,
            "idealAnswer": ideal_answer,
            "timestamp": os.urandom(4).hex()  # Simple timestamp ID
        }
        
    except Exception as e:
        print(f"❌ Error generating ideal answer: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/score-answer-realtime")
async def score_answer_realtime(
    question: str = Form(...),
    candidateAnswer: str = Form(...),
    idealAnswer: str = Form(...),
    jobDescription: str = Form(...)
):
    """
    Real-time endpoint to score a candidate's answer.
    Called when candidate finishes answering a question.
    """
    try:
        print(f"📊 Scoring answer for question: {question[:50]}...")
        
        scoring_result = await analysis_service.score_answer(
            question,
            candidateAnswer,
            idealAnswer,
            jobDescription
        )
        
        return {
            "question": question,
            "candidateAnswer": candidateAnswer,
            "idealAnswer": idealAnswer,
            "score": scoring_result["score"],
            "justification": scoring_result["justification"]
        }
        
    except Exception as e:
        print(f"❌ Error scoring answer: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "healthy", "mongodb": "connected" if db else "disconnected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

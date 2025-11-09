"""
Analysis Service
Handles the full post-interview analysis pipeline
"""

import os
import json
import re
from typing import Dict, List
from openai import OpenAI
from anthropic import Anthropic

# Initialize LLM clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY")) if os.getenv("ANTHROPIC_API_KEY") else None


class AnalysisService:
    def __init__(self):
        self.llm_provider = os.getenv("LLM_PROVIDER", "openai")  # or "anthropic"
    
    async def analyze_interview(
        self,
        interview_id: str,
        hr_transcript: str,
        candidate_transcript: str,
        job_description: str,
        candidate_id: str = "mock-candidate",
        hr_id: str = "mock-hr"
    ) -> Dict:
        """
        Main analysis pipeline:
        1. Q&A Pairing
        2. Generate Ideal Answers
        3. Score and Generate Feedback
        4. Create Report
        """
        
        print(f"🔍 Starting analysis for interview {interview_id}")
        
        # Step 1: Q&A Pairing
        print("📝 Step 1: Pairing questions and answers...")
        qa_pairs = await self.pair_questions_and_answers(
            hr_transcript, candidate_transcript
        )
        print(f"✅ Found {len(qa_pairs)} Q&A pairs")
        
        # Step 2 & 3: For each Q&A, generate ideal answer and score
        qa_breakdown = []
        total_score = 0
        
        for idx, qa in enumerate(qa_pairs, 1):
            print(f"🔄 Processing Q&A {idx}/{len(qa_pairs)}...")
            
            # Generate ideal answer
            print(f"  → Generating ideal answer...")
            ideal_answer = await self.generate_ideal_answer(
                qa["question"], job_description
            )
            
            # Score and generate feedback
            print(f"  → Scoring answer...")
            scoring_result = await self.score_answer(
                qa["question"],
                qa["answer"],
                ideal_answer,
                job_description
            )
            
            qa_breakdown.append({
                "question": qa["question"],
                "candidateAnswer": qa["answer"],
                "idealAnswer": ideal_answer,
                "score": scoring_result["score"],
                "justification": scoring_result["justification"]
            })
            
            total_score += scoring_result["score"]
            print(f"  ✅ Score: {scoring_result['score']}/10")
        
        # Calculate overall score (0-100)
        overall_score = (total_score / len(qa_breakdown) * 10) if qa_breakdown else 0
        print(f"📊 Overall Score: {overall_score:.2f}/100")
        
        # Generate summaries
        print("📄 Generating summaries...")
        ai_summary_hr = await self.generate_hr_summary(
            qa_breakdown, job_description, overall_score
        )
        
        ai_summary_candidate = await self.generate_candidate_summary(
            qa_breakdown, overall_score
        )
        
        # Create report
        report = {
            "interviewId": interview_id,
            "candidateId": candidate_id,
            "hrId": hr_id,
            "overallScore": round(overall_score, 2),
            "aiSummaryHR": ai_summary_hr,
            "aiSummaryCandidate": ai_summary_candidate,
            "qaBreakdown": qa_breakdown,
            "fullTranscript": f"HR: {hr_transcript}\n\nCandidate: {candidate_transcript}",
            "jobDescription": job_description
        }
        
        print("✅ Analysis complete!")
        return report
    
    async def pair_questions_and_answers(
        self, hr_transcript: str, candidate_transcript: str
    ) -> List[Dict]:
        """Extract Q&A pairs from transcripts using LLM"""
        
        prompt = f"""You are an expert at analyzing interview transcripts. Extract all question-answer pairs from the following interview.

HR Transcript:
{hr_transcript}

Candidate Transcript:
{candidate_transcript}

Instructions:
1. Identify all questions asked by HR
2. Match each question with the candidate's corresponding answer
3. Return ONLY a valid JSON array, no other text

Format:
[
    {{"question": "Question text here", "answer": "Answer text here"}},
    {{"question": "Next question", "answer": "Next answer"}}
]

Return the JSON array now:"""
        
        response = await self._call_llm(prompt, require_json=True)
        
        # Parse JSON response
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                qa_pairs = json.loads(json_match.group())
            else:
                qa_pairs = json.loads(response)
            
            # Validate structure
            if not isinstance(qa_pairs, list):
                raise ValueError("Response is not a list")
            
            return qa_pairs
        except (json.JSONDecodeError, ValueError) as e:
            print(f"⚠️ Error parsing Q&A pairs: {e}")
            print(f"Response: {response[:500]}")
            # Fallback: return empty list or sample
            return []
    
    async def generate_ideal_answer(
        self, question: str, job_description: str
    ) -> str:
        """Generate ideal answer based on question and JD"""
        
        prompt = f"""Based on the following job description and interview question, generate an ideal answer that a top candidate would give.

Job Description:
{job_description[:2000]}

Question:
{question}

Generate a comprehensive, well-structured ideal answer that:
1. Directly addresses the question
2. Incorporates relevant aspects from the job description
3. Demonstrates expertise and experience
4. Is clear, concise, and professional (2-3 paragraphs max)

Ideal Answer:"""
        
        response = await self._call_llm(prompt)
        return response.strip()
    
    async def score_answer(
        self,
        question: str,
        candidate_answer: str,
        ideal_answer: str,
        job_description: str
    ) -> Dict:
        """Score candidate answer against ideal answer and JD"""
        
        prompt = f"""Score the candidate's answer on a scale of 0-10, comparing it to the ideal answer and job description requirements.

Question: {question}

Candidate Answer:
{candidate_answer}

Ideal Answer:
{ideal_answer}

Job Description:
{job_description[:1000]}

Scoring Criteria:
- 9-10: Excellent - Covers all key points, demonstrates deep understanding
- 7-8: Good - Covers most key points, shows solid understanding
- 5-6: Average - Covers some key points, basic understanding
- 3-4: Below Average - Missing key points, limited understanding
- 0-2: Poor - Does not address the question or job requirements

Return ONLY a valid JSON object with this exact format:
{{"score": 8, "justification": "Brief explanation of the score (2-3 sentences)"}}

JSON:"""
        
        response = await self._call_llm(prompt, require_json=True)
        
        # Parse JSON
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = json.loads(response)
            
            # Validate score is 0-10
            score = int(result.get("score", 0))
            score = max(0, min(10, score))  # Clamp to 0-10
            
            return {
                "score": score,
                "justification": result.get("justification", "No justification provided")
            }
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"⚠️ Error parsing score: {e}")
            return {
                "score": 5,
                "justification": "Error parsing score - default score assigned"
            }
    
    async def generate_hr_summary(
        self, qa_breakdown: List[Dict], job_description: str, overall_score: float
    ) -> str:
        """Generate summary for HR"""
        
        qa_summary = "\n".join([
            f"Q: {qa['question']}\nA: {qa['candidateAnswer'][:200]}... (Score: {qa['score']}/10)"
            for qa in qa_breakdown[:5]  # Limit to first 5 for prompt size
        ])
        
        prompt = f"""Generate a concise, professional summary for HR about the candidate's interview performance.

Overall Score: {overall_score}/100

Key Q&A Performance:
{qa_summary}

Job Description:
{job_description[:1000]}

Provide a 2-3 paragraph assessment covering:
1. Overall fit for the role
2. Key strengths demonstrated
3. Areas of concern or gaps
4. Recommendation summary

Summary:"""
        
        response = await self._call_llm(prompt)
        return response.strip()
    
    async def generate_candidate_summary(
        self, qa_breakdown: List[Dict], overall_score: float
    ) -> str:
        """Generate friendly, constructive summary for candidate"""
        
        qa_summary = "\n".join([
            f"Q: {qa['question']}\nYour Answer: {qa['candidateAnswer'][:150]}... (Score: {qa['score']}/10)"
            for qa in qa_breakdown[:5]
        ])
        
        prompt = f"""Generate a friendly, constructive performance summary for the candidate.

Overall Score: {overall_score}/100

Your Performance:
{qa_summary}

Provide a 2-3 paragraph summary that:
1. Acknowledges their performance positively
2. Highlights what they did well
3. Provides specific, actionable improvement tips
4. Encourages continued growth

Use a supportive, encouraging tone. Be specific about what they can improve.

Summary:"""
        
        response = await self._call_llm(prompt)
        return response.strip()
    
    async def _call_llm(self, prompt: str, require_json: bool = False) -> str:
        """Call LLM (OpenAI or Anthropic)"""
        
        try:
            if self.llm_provider == "openai":
                response = openai_client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4"),
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    response_format={"type": "json_object"} if require_json else None
                )
                return response.choices[0].message.content
            else:
                # Anthropic
                if not anthropic_client:
                    raise ValueError("Anthropic API key not configured")
                
                message = anthropic_client.messages.create(
                    model=os.getenv("ANTHROPIC_MODEL", "claude-3-opus-20240229"),
                    max_tokens=2000,
                    messages=[{"role": "user", "content": prompt}]
                )
                return message.content[0].text
        except Exception as e:
            print(f"❌ LLM API error: {e}")
            raise

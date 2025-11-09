"""
File parsing utilities for JD and transcript processing
"""

import re
from typing import Tuple


async def parse_jd_file(file) -> str:
    """Parse JD file (TXT, MD, or PDF) and extract text"""
    
    filename = file.filename.lower()
    content = await file.read()
    
    if filename.endswith('.pdf'):
        # PDF parsing - requires PyPDF2 or pdfplumber
        try:
            import PyPDF2
            import io
            
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except ImportError:
            # Fallback: return placeholder
            return "PDF file uploaded. Install PyPDF2 for PDF parsing: pip install PyPDF2"
        except Exception as e:
            raise ValueError(f"Error parsing PDF: {str(e)}")
    
    elif filename.endswith(('.txt', '.md')):
        # Text file
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            return content.decode('latin-1')
    
    else:
        raise ValueError(f"Unsupported file type: {filename}")


def parse_mock_transcript(transcript: str) -> Tuple[str, str]:
    """
    Parse mock transcript text into HR and Candidate transcripts.
    Handles formats like:
    - "HR: ... Candidate: ..."
    - "Interviewer: ... Interviewee: ..."
    - Line-by-line format
    """
    
    hr_lines = []
    candidate_lines = []
    
    # Split by lines
    lines = transcript.split('\n')
    
    current_speaker = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect speaker
        if re.match(r'^(HR|Interviewer|Recruiter):', line, re.IGNORECASE):
            current_speaker = 'hr'
            text = re.sub(r'^(HR|Interviewer|Recruiter):\s*', '', line, flags=re.IGNORECASE)
            hr_lines.append(text)
        elif re.match(r'^(Candidate|Interviewee|Student):', line, re.IGNORECASE):
            current_speaker = 'candidate'
            text = re.sub(r'^(Candidate|Interviewee|Student):\s*', '', line, flags=re.IGNORECASE)
            candidate_lines.append(text)
        else:
            # Continue with current speaker
            if current_speaker == 'hr':
                hr_lines.append(line)
            elif current_speaker == 'candidate':
                candidate_lines.append(line)
            else:
                # Default to candidate if no speaker detected
                candidate_lines.append(line)
    
    hr_transcript = ' '.join(hr_lines)
    candidate_transcript = ' '.join(candidate_lines)
    
    # If parsing failed, try alternative method
    if not hr_transcript and not candidate_transcript:
        # Try splitting by common patterns
        parts = re.split(r'(HR|Interviewer|Candidate|Interviewee):', transcript, flags=re.IGNORECASE)
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                speaker = parts[i].lower()
                text = parts[i+1] if i+1 < len(parts) else ""
                if 'hr' in speaker or 'interviewer' in speaker:
                    hr_transcript += text + " "
                else:
                    candidate_transcript += text + " "
    
    return hr_transcript.strip(), candidate_transcript.strip()


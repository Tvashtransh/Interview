import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Use node-fetch for making HTTP requests

dotenv.config();

const router = express.Router();

// Ollama API endpoint for real-time Q&A analysis
router.post('/generate-ideal-answer', async (req, res) => {
  try {
    const { question, jobDescription } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get model from env or use default (exact same pattern as working route.ts)
    const model = process.env.OLLAMA_MODEL || process.env.OLLAMA_CLOUD_MODEL || 'qwen3-coder:480b-cloud';
    const isCloudModel = model.includes('-cloud') || model.includes(':cloud');
    
    // Ollama API endpoint - match working route.ts exactly
    // For cloud models, use https://ollama.com, otherwise use OLLAMA_URL or default to localhost
    let ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // Auto-detect cloud models and use cloud URL
    if (isCloudModel && (!process.env.OLLAMA_URL || process.env.OLLAMA_URL.includes('localhost'))) {
      ollamaUrl = process.env.OLLAMA_CLOUD_URL || 'https://ollama.com';
    }
    
    const apiUrl = `${ollamaUrl}/api/generate`;
    
    console.log(`🤖 Using Ollama model: ${model} (${isCloudModel ? 'CLOUD' : 'LOCAL'})`);
    console.log(`🌐 Ollama URL: ${apiUrl}`);
    
    // Build prompt with or without job description
    let prompt = `You are an expert interviewer. Generate an ideal answer for this interview question.\n\n`;
    
    if (jobDescription && jobDescription.trim()) {
      prompt += `Job Description:\n${jobDescription}\n\n`;
    }
    
    prompt += `Interview Question:\n${question}\n\n`;
    prompt += `Generate a comprehensive ideal answer that a perfect candidate would give. The answer should:
1. Be relevant and demonstrate expertise
2. Show experience and knowledge
3. Be clear and well-structured
4. Provide a complete and thoughtful response

Ideal Answer:`;

    // Prepare headers (exact same pattern as working route.ts)
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if provided (required for cloud models)
    const ollamaApiKey = process.env.OLLAMA_API_KEY;
    if (ollamaApiKey) {
      headers['Authorization'] = `Bearer ${ollamaApiKey}`;
      console.log('🔑 Using Ollama API key for authentication');
    } else if (isCloudModel) {
      console.warn('⚠️ Warning: Cloud model detected but no OLLAMA_API_KEY found');
    }
    
    console.log(`📝 Generating ideal answer for question: "${question.substring(0, 50)}..."`);

    // Send request to Ollama (exact same pattern as working route.ts)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false, // Set to true if you want streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ollama API error:', response.status, errorText);
      
      // Provide helpful error messages (same pattern as working implementation)
      let errorMessage = `Ollama API error: ${response.statusText}`;
      
      if (response.status === 404) {
        if (isCloudModel) {
          errorMessage = `Cloud model "${model}" not found. Make sure you've signed in with "ollama signin" and the model name is correct.`;
        } else {
          errorMessage = `Model "${model}" not found. Make sure Ollama is running (try "ollama serve") and the model is available (try "ollama list").`;
        }
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = `Authentication failed for cloud model. Please sign in with "ollama signin".`;
      } else if (response.status === 503) {
        errorMessage = `Ollama service unavailable. Make sure Ollama is running (try "ollama serve").`;
      } else {
        errorMessage = `Ollama API error: ${response.statusText}. ${errorText.substring(0, 200)}`;
      }
      
      return res.status(response.status).json({ 
        error: errorMessage
      });
    }

    const data = await response.json();
    const idealAnswer = data.response || data.text || '';
    console.log(`✅ Ideal answer generated (${idealAnswer.length} chars)`);
    
    res.json({
      question,
      idealAnswer,
    });
  } catch (error) {
    console.error('Error generating ideal answer:', error);
    
    let errorMessage = 'Failed to generate ideal answer';
    
    // Check for connection errors (same pattern as working implementation)
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      errorMessage = 'Cannot connect to Ollama. Make sure Ollama is running on localhost:11434 (try "ollama serve").';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/score-answer', async (req, res) => {
  try {
    const { question, candidateAnswer, idealAnswer, jobDescription } = req.body;

    if (!question || !candidateAnswer || !idealAnswer) {
      return res.status(400).json({ 
        error: 'Question, candidate answer, and ideal answer are required' 
      });
    }

    // Get model from env or use default (same pattern as working implementation)
    const model = process.env.OLLAMA_MODEL || process.env.OLLAMA_CLOUD_MODEL || 'qwen3-coder:480b-cloud';
    const isCloudModel = model.includes('-cloud') || model.includes(':cloud');
    
    // Ollama API endpoint - use OLLAMA_URL or default to localhost
    let ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // If cloud model and OLLAMA_CLOUD_URL is set, use it
    if (isCloudModel && process.env.OLLAMA_CLOUD_URL) {
      ollamaUrl = process.env.OLLAMA_CLOUD_URL;
    } else if (isCloudModel && !ollamaUrl.includes('ollama.com') && !ollamaUrl.includes('localhost')) {
      ollamaUrl = 'https://ollama.com';
    }
    
    const apiUrl = `${ollamaUrl}/api/generate`;
    
    console.log(`🤖 Using Ollama model: ${model} (${isCloudModel ? 'CLOUD' : 'LOCAL'})`);
    console.log(`🌐 Ollama URL: ${apiUrl}`);
    console.log(`📊 Scoring candidate answer for question: "${question.substring(0, 50)}..."`);

    // Build prompt with or without job description
    let prompt = `You are an expert interviewer evaluating a candidate's answer. Rate the candidate's answer on a scale of 0-10 and provide justification.\n\n`;
    
    if (jobDescription && jobDescription.trim()) {
      prompt += `Job Description:\n${jobDescription}\n\n`;
    }
    
    prompt += `Interview Question:\n${question}\n\n`;
    prompt += `Ideal Answer:\n${idealAnswer}\n\n`;
    prompt += `Candidate's Answer:\n${candidateAnswer}\n\n`;
    prompt += `Evaluate the candidate's answer and provide:
1. A score from 0-10 (where 10 is perfect)
2. A brief justification explaining the score

Respond in JSON format:
{
  "score": <number between 0 and 10>,
  "justification": "<brief explanation>"
}`;

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if provided (for cloud authentication)
    const ollamaApiKey = process.env.OLLAMA_API_KEY;
    if (ollamaApiKey) {
      headers['Authorization'] = `Bearer ${ollamaApiKey}`;
      console.log('🔑 Using Ollama API key for authentication');
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ollama API error:', response.status, errorText);
      
      // Provide helpful error messages (same pattern as working implementation)
      let errorMessage = `Ollama API error: ${response.statusText}`;
      
      if (response.status === 404) {
        if (isCloudModel) {
          errorMessage = `Cloud model "${model}" not found. Make sure you've signed in with "ollama signin" and the model name is correct.`;
        } else {
          errorMessage = `Model "${model}" not found. Make sure Ollama is running (try "ollama serve") and the model is available (try "ollama list").`;
        }
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = `Authentication failed for cloud model. Please sign in with "ollama signin".`;
      } else if (response.status === 503) {
        errorMessage = `Ollama service unavailable. Make sure Ollama is running (try "ollama serve").`;
      } else {
        errorMessage = `Ollama API error: ${response.statusText}. ${errorText.substring(0, 200)}`;
      }
      
      return res.status(response.status).json({ 
        error: errorMessage
      });
    }

    const data = await response.json();
    const responseText = data.response || data.text || '';
    
    // Try to parse JSON from response
    let score = 5; // Default score
    let justification = 'Unable to evaluate answer.';
    
    try {
      // Extract JSON from response (might have extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        score = Math.max(0, Math.min(10, parseFloat(parsed.score) || 5));
        justification = parsed.justification || justification;
      } else {
        // Fallback: try to extract score from text
        const scoreMatch = responseText.match(/score["\s:]*(\d+(?:\.\d+)?)/i);
        if (scoreMatch) {
          score = Math.max(0, Math.min(10, parseFloat(scoreMatch[1]) || 5));
        }
        justification = responseText.substring(0, 200);
      }
    } catch (parseError) {
      console.warn('Failed to parse Ollama response as JSON, using defaults');
      justification = responseText.substring(0, 200);
    }

    res.json({
      question,
      candidateAnswer,
      idealAnswer,
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      justification,
    });
  } catch (error) {
    console.error('Error scoring answer:', error);
    
    let errorMessage = 'Failed to score answer';
    
    // Check for connection errors (same pattern as working implementation)
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      errorMessage = 'Cannot connect to Ollama. Make sure Ollama is running on localhost:11434 (try "ollama serve").';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Generate AI analysis report for completed interview
router.post('/generate-report', async (req, res) => {
  try {
    const { interviewId, transcripts, qaPairs, jobDescription } = req.body;

    if (!interviewId || !transcripts) {
      return res.status(400).json({ error: 'interviewId and transcripts are required' });
    }

    // Get model from env
    const model = process.env.OLLAMA_MODEL || process.env.OLLAMA_CLOUD_MODEL || 'qwen3-coder:480b-cloud';
    const isCloudModel = model.includes('-cloud') || model.includes(':cloud');
    
    let ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    if (isCloudModel && (!process.env.OLLAMA_URL || process.env.OLLAMA_URL.includes('localhost'))) {
      ollamaUrl = process.env.OLLAMA_CLOUD_URL || 'https://ollama.com';
    }
    
    const apiUrl = `${ollamaUrl}/api/generate`;
    
    console.log(`🤖 Generating report using Ollama model: ${model} (${isCloudModel ? 'CLOUD' : 'LOCAL'})`);

    // Separate HR and candidate transcripts
    const hrTranscripts = transcripts.filter(t => t.role === 'hr').map(t => t.text).join(' ');
    const candidateTranscripts = transcripts.filter(t => t.role === 'candidate').map(t => t.text).join(' ');

    // Calculate overall score from Q&A pairs
    const scoredPairs = qaPairs.filter(qa => qa.score !== undefined);
    const overallScore = scoredPairs.length > 0
      ? Math.round((scoredPairs.reduce((sum, qa) => sum + qa.score, 0) / scoredPairs.length) * 10)
      : 0;

    // Generate HR summary
    const hrSummaryPrompt = `You are an expert HR analyst. Analyze this interview transcript and provide a comprehensive summary for HR review.

HR Questions: ${hrTranscripts}
Candidate Answers: ${candidateTranscripts}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Provide a detailed analysis including:
1. Candidate's strengths
2. Areas for improvement
3. Overall assessment
4. Recommendation (hire/consider/reject)

Summary:`;

    // Generate candidate summary
    const candidateSummaryPrompt = `You are a helpful career coach. Analyze this interview and provide constructive feedback for the candidate.

Interview Questions: ${hrTranscripts}
Your Answers: ${candidateTranscripts}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Provide encouraging feedback including:
1. What you did well
2. Areas to improve
3. Tips for future interviews
4. Overall performance assessment

Feedback:`;

    // Make API calls with auth header if needed
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (process.env.OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }

    // Generate both summaries in parallel
    const [hrSummaryResponse, candidateSummaryResponse] = await Promise.all([
      fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          prompt: hrSummaryPrompt,
          stream: false
        })
      }),
      fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          prompt: candidateSummaryPrompt,
          stream: false
        })
      })
    ]);

    if (!hrSummaryResponse.ok || !candidateSummaryResponse.ok) {
      throw new Error('Failed to generate summaries');
    }

    const hrSummaryData = await hrSummaryResponse.json();
    const candidateSummaryData = await candidateSummaryResponse.json();

    const report = {
      interviewId,
      overallScore,
      aiSummaryHR: hrSummaryData.response || hrSummaryData.text || 'Summary generation failed',
      aiSummaryCandidate: candidateSummaryData.response || candidateSummaryData.text || 'Summary generation failed',
      qaBreakdown: qaPairs.map(qa => ({
        question: qa.question,
        candidateAnswer: qa.candidateAnswer || '',
        idealAnswer: qa.idealAnswer || '',
        score: qa.score || 0,
        justification: qa.justification || ''
      })),
      fullTranscript: transcripts.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n\n'),
      jobDescription: jobDescription || ''
    };

    res.json({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

export default router;


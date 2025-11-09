import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'qwen3-coder:480b-cloud' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Ollama API endpoint (default: localhost:11434)
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const apiUrl = `${ollamaUrl}/api/generate`;

    // Send request to Ollama
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false, // Set to true if you want streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', errorText);
      
      // Provide helpful error messages based on status code
      let errorMessage = `Ollama API error: ${response.statusText}`;
      
      if (response.status === 404) {
        // Check if it's a cloud model
        if (model.includes('-cloud') || model.includes(':cloud')) {
          errorMessage = `Cloud model "${model}" not found. Make sure you've signed in with "ollama signin" and the model name is correct.`;
        } else {
          errorMessage = `Model "${model}" not found. Make sure Ollama is running (try "ollama serve") and the model is available (try "ollama list").`;
        }
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = `Authentication failed for cloud model. Please sign in with "ollama signin".`;
      } else if (response.status === 503) {
        errorMessage = `Ollama service unavailable. Make sure Ollama is running (try "ollama serve").`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      response: data.response,
      model: data.model,
    });

  } catch (error: any) {
    console.error('Error calling Ollama:', error);
    
    let errorMessage = 'Failed to communicate with Ollama';
    
    // Check for connection errors
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      errorMessage = 'Cannot connect to Ollama. Make sure Ollama is running on localhost:11434 (try "ollama serve").';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to list available models
export async function GET() {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const apiUrl = `${ollamaUrl}/api/tags`;

    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch models from Ollama' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ models: data.models || [] });

  } catch (error: any) {
    console.error('Error fetching Ollama models:', error);
    return NextResponse.json(
      { error: 'Ollama is not running or not accessible' },
      { status: 503 }
    );
  }
}


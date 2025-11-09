# Real-Time Transcription App + Ollama LLM Integration

A real-time transcription application using the **free Web Speech API** that can send transcriptions to **Ollama** for LLM processing - all running locally!

## Project Architecture

This project uses:
1. **Browser's Web Speech API** - For free, real-time speech-to-text transcription (client-side, no backend needed)
2. **Next.js API Routes** - Proxies requests to Ollama (`/app/api/ollama`)
3. **Ollama** - For LLM processing (runs locally or uses cloud models)

**Note:** The `/backend` folder contains legacy Deepgram code and is **NOT needed**. Everything runs through the Next.js app.

## Setup

### Prerequisites

1. **Install Ollama** (if not already installed):
   - Visit [ollama.ai](https://ollama.ai) and download for your OS
   - Install a model: `ollama pull qwen2:7b` (or any model you prefer)

2. **Start Ollama**:
   - Ollama runs automatically when installed, or run `ollama serve`
   - By default, it runs on `http://localhost:11434`

### Install and Run

1. `npm install` (Installs Next.js dependencies)
2. `npm run dev` (Runs the web app on `http://localhost:3000`)

## How to Use

1. **Start Ollama** (if not already running)
2. Open `http://localhost:3000` in your browser (Chrome, Edge, or Safari recommended)
3. Click "Start Listening" and grant microphone permissions
4. Start speaking - your transcription appears in real-time!
5. **Optional:** 
   - Enable "Auto-send to Ollama" to automatically send final transcriptions to the LLM
   - Or click "Send to Ollama" manually to process the current transcription
   - Change the model name in the input field (default: `qwen3-coder:480b-cloud`)

## Features

- **100% Free** - Uses browser's built-in Web Speech API
- **Local LLM Processing** - Sends transcriptions to Ollama running on your machine
- **Real-time Transcription** - See interim and final results
- **Auto-send Option** - Automatically send transcriptions to Ollama
- **Model Selection** - Choose any Ollama model you have installed
- **Two-panel UI** - See transcription and LLM response side-by-side

## Browser Compatibility

- ✅ **Chrome/Chromium** - Full support
- ✅ **Microsoft Edge** - Full support  
- ✅ **Safari** - Full support
- ❌ **Firefox** - Not supported (Web Speech API not available)

## Ollama Configuration

By default, the app connects to Ollama at `http://localhost:11434`. If your Ollama instance runs on a different URL or port, you can set the `OLLAMA_URL` environment variable:

```bash
OLLAMA_URL=http://localhost:11434 npm run dev
```

## Local vs Cloud Models

### Local Models (Run on Your GPU/CPU)
These models are downloaded and run entirely on your local machine. Performance depends on your hardware.

- `qwen2:7b` - Qwen 2 7B - multilingual, great performance
- `qwen2:1.5b` - Smaller, faster version  
- `qwen2:14b` - Larger, more capable version
- `llama2` - General-purpose model
- `mistral` - Fast and efficient
- `codellama` - Great for code-related tasks

Pull a local model: `ollama pull <model-name>`

### Cloud Models (Run on Ollama's Cloud GPUs) ⚡
These models have `-cloud` suffix and run on Ollama's remote infrastructure. **No local GPU needed!** They use powerful cloud GPUs, so performance is much better than local models.

**To use cloud models:**
1. Sign in to Ollama: `ollama signin` (create account at [ollama.com](https://ollama.com))
2. Use cloud models directly (no download needed):
   - `qwen3-coder:480b-cloud` - **Default model** - 480B parameter coding model
   - `deepseek-v3.1:671b-cloud`
   - `gpt-oss:120b-cloud`
   - `qwen3-vl:235b-cloud`
   - `glm-4.6:cloud`

**Advantages of Cloud Models:**
- ✅ Run on powerful cloud GPUs (much faster than local)
- ✅ No need to download large model files
- ✅ Can use massive models (100B+ parameters) that won't fit locally
- ✅ Better performance regardless of your local hardware

**Note:** Cloud models may have usage limits. Check Ollama's pricing/limits on their website.


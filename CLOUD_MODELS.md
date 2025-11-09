# Using Ollama Cloud Models

## What are Cloud Models?

Cloud models in Ollama have a `-cloud` suffix (e.g., `qwen3-coder:480b-cloud`) and run on Ollama's remote cloud infrastructure, not on your local machine. This means:

- ✅ **No local GPU needed** - They run on powerful cloud GPUs
- ✅ **Better performance** - Datacenter hardware is much faster
- ✅ **Access to huge models** - Can use 100B+ parameter models that won't fit locally
- ✅ **No download required** - Models stay in the cloud

## Setup Cloud Models

### 1. Sign in to Ollama

First, create an account and sign in:

```bash
ollama signin
```

This will open your browser to sign in at [ollama.com](https://ollama.com).

### 2. Use Cloud Models Directly

Once signed in, you can use cloud models just like local models - no download needed!

**Available Cloud Models:**
- `qwen3-coder:480b-cloud` - 480B parameter coding model
- `deepseek-v3.1:671b-cloud` - 671B parameter general model
- `gpt-oss:120b-cloud` - 120B parameter GPT model
- `qwen3-vl:235b-cloud` - 235B parameter vision-language model
- `glm-4.6:cloud` - GLM 4.6 model

### 3. Use in This App

Simply type the cloud model name in the "Model" input field:
- `qwen3-coder:480b-cloud`
- `deepseek-v3.1:671b-cloud`
- etc.

The app will automatically send requests to Ollama, which will route cloud models to the cloud infrastructure.

## Performance Comparison

| Type | GPU Power | Speed | Model Size Limits |
|------|-----------|-------|-------------------|
| **Local Models** | Your laptop GPU | Slower (depends on your hardware) | Limited by local RAM/VRAM |
| **Cloud Models** | Datacenter GPUs | Much faster | Can handle 100B+ models |

## Privacy & Security

According to Ollama:
- They do not retain your data when using cloud models
- Your prompts and responses are processed but not stored

## Usage Limits

Cloud models may have:
- Hourly usage limits
- Daily usage limits
- Potential usage-based pricing (check [ollama.com](https://ollama.com) for current pricing)

## Recommendations

- **For best performance:** Use cloud models (`-cloud` suffix)
- **For privacy/offline use:** Use local models
- **For large models (100B+):** Cloud models are your only option
- **For experimentation:** Try both and compare!

## Example Usage

1. Sign in: `ollama signin`
2. Start the app: `npm run dev`
3. Enter cloud model: `deepseek-v3.1:671b-cloud`
4. Transcribe speech and click "Send to Ollama"
5. Get fast responses from cloud GPUs!


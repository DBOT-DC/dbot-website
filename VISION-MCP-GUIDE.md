# Vision MCP Implementation Guide for Hermes Agent

> **Status:** Production Ready  
> **Last Updated:** 2026-04-02

---

## Overview

Hermes Agent supports two production-ready vision models via MCP (Model Context Protocol):

| Provider | MCP Tool | Speed | Best For |
|----------|----------|-------|----------|
| MiniMax | `minimax::understand_image` | ~12s | Fast, general purpose |
| Z.AI GLM | `glm-vision::analyze_image` | ~39s | Detailed structured analysis |
| Z.AI GLM | `glm-vision::analyze_video` | ~60s+ | Video content (MP4/MOV/M4V up to 8MB) |

---

## Prerequisites

- Hermes Agent installed and running
- `uvx` available on PATH (`pip install uvx`)
- API keys from MiniMax and/or Z.AI

---

## Setup

### 1. Add MCP Server Config

Edit `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  minimax:
    command: uvx
    args:
      - minimax-coding-plan-mcp
      - -y
    env:
      MINIMAX_API_HOST: https://api.minimax.io
      MINIMAX_API_KEY: your-minimax-key

  glm-vision:
    command: uvx
    args:
      - zai-mcp-server
      - --mode
      - ZHIPU
    env:
      ZAI_API_KEY: your-glm-key
```

### 2. Add Keys to Environment

Add to `~/.hermes/.env`:

```
MINIMAX_API_KEY=your-minimax-key
GLM_API_KEY=your-glm-key
```

### 3. Restart Gateway

```
/reload-mcp
```

Or restart the Hermes Agent service.

### 4. Verify

```python
from tools import mcp_tool
mcp_tool.discover_mcp_tools()

with mcp_tool._lock:
    print(list(mcp_tool._servers.keys()))
# Expected: ['glm-vision', 'minimax', ...]
```

---

## Usage

### MiniMax Vision (Fast)

```python
r = mcp_tool.call_mcp_tool('minimax', 'understand_image', {
    'prompt': 'What do you see in this image?',
    'image_source': '/path/to/image.jpg'
})
print(r['result'])
```

**Example output:** "A crowned Shiba Inu dog in a futuristic city"

### Z.AI GLM Vision (Detailed)

```python
r = mcp_tool.call_mcp_tool('glm-vision', 'analyze_image', {
    'prompt': 'Describe this image in detail.',
    'image_source': '/path/to/image.jpg'
})
print(r['result'])
```

**Example output:** "A vibrant illustration of a Shiba Inu wearing a gold crown, black sunglasses, and a blue royal jacket, standing victorious on a glowing platform in a neon-lit Crypto City surrounded by personified cryptocurrency icons..."

### Video Analysis

```python
r = mcp_tool.call_mcp_tool('glm-vision', 'analyze_video', {
    'prompt': 'What happens in this video?',
    'video_source': '/path/to/video.mp4'
})
print(r['result'])
```

### Built-in vision_analyze Tool

Hermes also has a built-in `vision_analyze` tool that routes through `auxiliary_client.py`:

```python
vision_analyze(
    image_url='/path/to/image.jpg',
    user_prompt='Describe this image.',
    model=None  # Auto-selects GLM-4.6V
)
```

This routes through Z.AI GLM-4.6V at ~39s speed.

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  Hermes Agent                                │
│                                              │
│  vision_analyze ──► auxiliary_client.py      │
│                     └─► Z.AI GLM-4.6V        │
│                     (built-in, ~39s)          │
│                                              │
│  MCP: minimax ────► minimax-coding-plan-mcp │
│  ::understand_image   (uvx, proprietary)      │
│                      (~12s)                  │
│                                              │
│  MCP: glm-vision ─► zai-mcp-server           │
│  ::analyze_image    (GLM-4.6V)              │
│                      (~39s)                  │
└──────────────────────────────────────────────┘
```

---

## Performance

| Method | Provider | Speed | Throughput |
|--------|----------|-------|------------|
| `minimax::understand_image` | MiniMax MCP | ~12s | ~5/min |
| `glm-vision::analyze_image` | GLM MCP | ~39s | ~1.5/min |
| `vision_analyze` (built-in) | GLM Direct | ~39s | ~1.5/min |
| `glm-vision::analyze_video` | GLM MCP | ~60s+ | ~1/min |

**Recommendation:** Use MiniMax for speed-critical tasks, GLM for detailed structured output.

---

## Troubleshooting

### MiniMax MCP won't connect

1. Verify `minimax-coding-plan-mcp` is installed:
   ```bash
   uvx minimax-coding-plan-mcp --help
   ```

2. Confirm `MINIMAX_API_KEY` is in `~/.hermes/.env`

3. Check config uses `minimax-coding-plan-mcp` (not `minimax-mcp` — that package is TTS only)

4. Reload gateway: `/reload-mcp`

### GLM MCP won't connect

1. Verify `zai-mcp-server` is installed:
   ```bash
   uvx zai-mcp-server --help
   ```

2. Confirm `ZAI_API_KEY` is in `~/.hermes/.env`

3. Reload gateway: `/reload-mcp`

### vision_analyze tool failing

1. Confirm `ZAI_API_KEY` is loaded in the environment

2. Test directly:
   ```python
   from agent.auxiliary_client import _try_zai
   client, model = _try_zai()
   print(f"Client: {client}, Model: {model}")
   ```

### MiniMax key returns 404 via direct API

**Expected behavior.** MiniMax coding plan keys only work via the MCP server — they are scoped to `minimax-coding-plan-mcp`. Use `minimax::understand_image` for direct MCP access.

---

## Getting API Keys

### MiniMax

1. Visit [api.minimax.io](https://api.minimax.io)
2. Sign up / log in
3. Generate a coding plan API key
4. Use the `minimax-coding-plan-mcp` MCP package

### Z.AI GLM

1. Visit [z.ai](https://z.ai)
2. Sign up / log in
3. Generate a coding plan API key
4. Use the `zai-mcp-server` MCP package with `--mode ZHIPU`

---

## Related

- [Hermes Agent Documentation](https://github.com/DBOT-DC)
- [DBOT Website](https://dbot.ai)

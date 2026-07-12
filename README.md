# Eve OpenAI Agent

This Eve agent is configured for OpenAI direct provider mode through `@ai-sdk/openai`.
It uses `OPENAI_API_KEY`, not Vercel AI Gateway.

## Setup

Install dependencies:

```bash
bun install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.6-luna
```

`OPENAI_MODEL` is optional. If it is not set, the agent defaults to `gpt-5.6-luna`.

## Local Model

For OMLX or another local server that exposes an OpenAI-compatible `/v1` endpoint, point
the agent at that local endpoint:

```bash
OPENAI_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_API_KEY=local
OPENAI_MODEL=<local-model-id>
```

`LOCAL_API_KEY` is used for the local endpoint. Keep `OPENAI_API_KEY` for direct OpenAI
calls. If OMLX requires a specific key, replace `local` with that key.

When `OPENAI_BASE_URL` points away from OpenAI, the agent uses the local endpoint through
the OpenAI-compatible chat completions protocol. Eve records the local model id as-is, so
`Qwen3.5-4B-MLX-4bit` stays `Qwen3.5-4B-MLX-4bit`.

Local model context windows are not in Eve's AI Gateway catalog, so local mode defaults to
`LOCAL_CONTEXT_WINDOW_TOKENS=32768`. Set it if your local model has a different context
window.

## Choose A Model

Eve's `/model` TUI command only edits AI Gateway string models. Because this app uses the
OpenAI SDK provider directly, `/model` is disabled with the message:

```text
Set via an SDK model call in agent.ts; edit the source to change it
```

Use the local OpenAI-only selector instead:

```bash
bun run model
```

List allowed OpenAI models:

```bash
bun run model -- --list
```

Set a model without the prompt:

```bash
bun run model -- --set gpt-4o-mini
```

Set a local model:

```bash
bun run model -- --set-local <local-model-id> --base-url http://127.0.0.1:1234/v1
```

Set the local API key at the same time:

```bash
bun run model -- --set-local <local-model-id> --local-api-key <key>
```

The selector writes `OPENAI_MODEL` to `.env.local`. In local mode, it also writes
`OPENAI_BASE_URL` and `LOCAL_API_KEY`. Restart `bun run dev` after changing it.

Or keep the local model settings in your shell environment and start local mode directly:

```bash
LOCAL_MODEL=<local-model-id>
LOCAL_API_KEY=<key>
bun run local
```

`bun run local` starts `eve dev` with `OPENAI_BASE_URL` set to
`http://127.0.0.1:1234/v1` and `OPENAI_MODEL` set from `LOCAL_MODEL`. To use a different
local endpoint, set `LOCAL_BASE_URL`. To override the context window, set
`LOCAL_CONTEXT_WINDOW_TOKENS`.

## Development

Start the Eve dev TUI:

```bash
bun run dev
```

Run checks:

```bash
bun run typecheck
bun run check
bun run build
```

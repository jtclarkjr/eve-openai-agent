import { spawn } from 'node:child_process'
import { DEFAULT_LOCAL_OPENAI_BASE_URL, selectedOpenAIBaseURL } from '../agent/openai-models.ts'

const localModel = process.env.LOCAL_MODEL?.trim()
const localApiKey = process.env.LOCAL_API_KEY?.trim()
const requestedBaseURL = process.env.LOCAL_BASE_URL ?? process.env.OPENAI_BASE_URL
const localBaseURL = selectedOpenAIBaseURL(requestedBaseURL ?? DEFAULT_LOCAL_OPENAI_BASE_URL)

if (!localModel) {
  throw new Error('Set LOCAL_MODEL to your local model id before running `bun run local`.')
}

if (!localApiKey) {
  throw new Error(
    'Set LOCAL_API_KEY to your local OpenAI-compatible API key before running `bun run local`.'
  )
}

if (!localBaseURL) {
  throw new Error('Missing local OpenAI-compatible base URL.')
}

const child = spawn('bun', ['run', 'dev'], {
  env: {
    ...process.env,
    LOCAL_API_KEY: localApiKey,
    OPENAI_BASE_URL: localBaseURL,
    OPENAI_MODEL: localModel
  },
  stdio: 'inherit'
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

child.on('error', (error) => {
  throw error
})

export const OPENAI_MODELS = [
  'gpt-5.6',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.4-pro',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-5.3-chat-latest',
  'gpt-5.2',
  'gpt-5.2-pro',
  'gpt-5.2-chat-latest',
  'gpt-5.1',
  'gpt-5.1-chat-latest',
  'gpt-5',
  'gpt-5-chat-latest',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'o4-mini',
  'o3',
  'o3-mini',
  'o1'
] as const

export type OpenAIModel = (typeof OPENAI_MODELS)[number]

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_LOCAL_OPENAI_BASE_URL = 'http://127.0.0.1:1234/v1'
export const DEFAULT_OPENAI_MODEL: OpenAIModel = 'gpt-5.4-mini'
export const DEFAULT_LOCAL_OPENAI_API_KEY = 'local'
export const DEFAULT_LOCAL_CONTEXT_WINDOW_TOKENS = 32_768

const LOCAL_OPENAI_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

export function selectedOpenAIModel(
  model = process.env.OPENAI_MODEL,
  baseURL = process.env.OPENAI_BASE_URL
): string {
  const selectedModel = model?.trim()

  if (!selectedModel) {
    return DEFAULT_OPENAI_MODEL
  }

  if (isOpenAIModel(selectedModel) || isCustomOpenAIBaseURL(baseURL)) {
    return selectedModel
  }

  throw new Error(
    `Unsupported OPENAI_MODEL "${selectedModel}". Allowed OpenAI models: ${OPENAI_MODELS.join(
      ', '
    )}. For a local OpenAI-compatible model, set OPENAI_BASE_URL, for example ${DEFAULT_LOCAL_OPENAI_BASE_URL}.`
  )
}

export function isOpenAIModel(model: string): model is OpenAIModel {
  return (OPENAI_MODELS as readonly string[]).includes(model)
}

export function selectedOpenAIBaseURL(baseURL = process.env.OPENAI_BASE_URL): string | undefined {
  const selectedBaseURL = baseURL?.trim()

  if (!selectedBaseURL) {
    return undefined
  }

  try {
    return new URL(selectedBaseURL).toString().replace(/\/+$/, '')
  } catch {
    throw new Error(`OPENAI_BASE_URL must be a valid URL. Received "${selectedBaseURL}".`)
  }
}

export function isCustomOpenAIBaseURL(baseURL = process.env.OPENAI_BASE_URL): boolean {
  const selectedBaseURL = selectedOpenAIBaseURL(baseURL)

  return selectedBaseURL !== undefined && selectedBaseURL !== DEFAULT_OPENAI_BASE_URL
}

export function isLocalOpenAIBaseURL(baseURL = process.env.OPENAI_BASE_URL): boolean {
  const selectedBaseURL = selectedOpenAIBaseURL(baseURL)

  if (!selectedBaseURL) {
    return false
  }

  return LOCAL_OPENAI_HOSTNAMES.has(new URL(selectedBaseURL).hostname)
}

export function selectedLocalOpenAIApiKey(
  baseURL = process.env.OPENAI_BASE_URL,
  localApiKey = process.env.LOCAL_API_KEY,
  openAIApiKey = process.env.OPENAI_API_KEY
): string | undefined {
  const selectedLocalApiKey = localApiKey?.trim()

  if (selectedLocalApiKey) {
    return selectedLocalApiKey
  }

  if (isLocalOpenAIBaseURL(baseURL)) {
    return DEFAULT_LOCAL_OPENAI_API_KEY
  }

  return openAIApiKey?.trim() || undefined
}

export function selectedLocalContextWindowTokens(
  contextWindowTokens = process.env.LOCAL_CONTEXT_WINDOW_TOKENS
): number {
  const selectedContextWindowTokens = contextWindowTokens?.trim()

  if (!selectedContextWindowTokens) {
    return DEFAULT_LOCAL_CONTEXT_WINDOW_TOKENS
  }

  const parsedContextWindowTokens = Number(selectedContextWindowTokens)

  if (!Number.isInteger(parsedContextWindowTokens) || parsedContextWindowTokens <= 0) {
    throw new Error(
      `LOCAL_CONTEXT_WINDOW_TOKENS must be a positive integer. Received "${selectedContextWindowTokens}".`
    )
  }

  return parsedContextWindowTokens
}

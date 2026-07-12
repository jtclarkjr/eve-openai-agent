import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import {
  DEFAULT_LOCAL_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
  OPENAI_MODELS,
  isOpenAIModel,
  selectedOpenAIBaseURL
} from '../agent/openai-models.ts'

const ENV_FILE = resolve(process.cwd(), '.env.local')

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  printHelp()
  process.exit(0)
}

if (args.includes('--list')) {
  printModels(currentOpenAIModel(await readEnvFile()))
  process.exit(0)
}

const envFileText = await readEnvFile()
const requestedModel = readValueArg(args, '--set')
const requestedLocalModel = readValueArg(args, '--set-local')
const requestedBaseURL = readValueArg(args, '--base-url')
const requestedLocalApiKey = readValueArg(args, '--local-api-key')

if (requestedModel && requestedLocalModel) {
  throw new Error('Use either --set or --set-local, not both.')
}

if (requestedBaseURL && !requestedLocalModel) {
  throw new Error('--base-url can only be used with --set-local.')
}

if (requestedLocalApiKey && !requestedLocalModel) {
  throw new Error('--local-api-key can only be used with --set-local.')
}

if (requestedLocalModel) {
  const baseURL = selectedOpenAIBaseURL(requestedBaseURL ?? DEFAULT_LOCAL_OPENAI_BASE_URL)
  const localApiKey = requestedLocalApiKey ?? process.env.LOCAL_API_KEY ?? 'local'

  if (!baseURL) {
    throw new Error('Missing local OpenAI-compatible base URL.')
  }

  await writeFile(
    ENV_FILE,
    updateLocalOpenAIModel(envFileText, requestedLocalModel, baseURL, localApiKey)
  )

  console.log(`Set OPENAI_MODEL=${requestedLocalModel} in .env.local`)
  console.log(`Set OPENAI_BASE_URL=${baseURL} in .env.local`)
  console.log('Set LOCAL_API_KEY in .env.local')
  console.log('Restart `bun run dev` for the model change to take effect.')
  process.exit(0)
}

const selectedModel = currentOpenAIModel(envFileText)
const nextModel = requestedModel ?? (await promptForModel(selectedModel))

if (!isOpenAIModel(nextModel)) {
  throw new Error(
    `Unsupported OpenAI model "${nextModel}". Run "bun run model -- --list" to see options.`
  )
}

await writeFile(ENV_FILE, updateOpenAIModel(envFileText, nextModel))

console.log(`Set OPENAI_MODEL=${nextModel} in .env.local`)
console.log('Restart `bun run dev` for the model change to take effect.')

function printHelp() {
  console.log(`Usage:
  bun run model
  bun run model -- --list
  bun run model -- --set gpt-4o-mini
  bun run model -- --set-local <model-id>
  bun run model -- --set-local <model-id> --base-url ${DEFAULT_LOCAL_OPENAI_BASE_URL}
  bun run model -- --set-local <model-id> --local-api-key <key>`)
}

function readValueArg(inputArgs: string[], flag: string): string | undefined {
  const index = inputArgs.indexOf(flag)

  if (index === -1) {
    return undefined
  }

  const value = inputArgs[index + 1]?.trim()

  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value after ${flag}.`)
  }

  return value
}

async function readEnvFile(): Promise<string> {
  if (!existsSync(ENV_FILE)) {
    return ''
  }

  return readFile(ENV_FILE, 'utf8')
}

function currentOpenAIModel(fileText: string): string {
  const envModel = readEnvValue(fileText, 'OPENAI_MODEL') ?? process.env.OPENAI_MODEL
  return envModel && isOpenAIModel(envModel) ? envModel : DEFAULT_OPENAI_MODEL
}

function readEnvValue(fileText: string, key: string): string | undefined {
  for (const line of fileText.split(/\r?\n/)) {
    const match = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`))

    if (!match) {
      continue
    }

    return unquoteEnvValue(match[1])
  }
}

function unquoteEnvValue(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed[0]

  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

async function promptForModel(activeModel: string): Promise<string> {
  printModels(activeModel)

  const rl = createInterface({ input, output })

  try {
    const answer = (await rl.question(`Choose OpenAI model [${activeModel}]: `)).trim()

    if (!answer) {
      return activeModel
    }

    const index = Number(answer)

    if (Number.isInteger(index) && index >= 1 && index <= OPENAI_MODELS.length) {
      return OPENAI_MODELS[index - 1]
    }

    return answer
  } finally {
    rl.close()
  }
}

function printModels(activeModel: string) {
  for (const [index, model] of OPENAI_MODELS.entries()) {
    const current = model === activeModel ? ' (current)' : ''
    console.log(`${String(index + 1).padStart(2, ' ')}. ${model}${current}`)
  }
}

function updateOpenAIModel(fileText: string, model: string): string {
  return updateEnvValue(fileText, 'OPENAI_MODEL', model)
}

function updateLocalOpenAIModel(
  fileText: string,
  model: string,
  baseURL: string,
  localApiKey: string
): string {
  let nextFileText = updateEnvValue(fileText, 'OPENAI_BASE_URL', baseURL)
  nextFileText = updateEnvValue(nextFileText, 'OPENAI_MODEL', model)
  return updateEnvValue(nextFileText, 'LOCAL_API_KEY', localApiKey)
}

function updateEnvValue(fileText: string, key: string, value: string): string {
  const lines = fileText.split(/\r?\n/)
  const nextLines: string[] = []
  let replaced = false

  for (const line of lines) {
    if (new RegExp(`^\\s*${key}\\s*=`).test(line)) {
      if (!replaced) {
        nextLines.push(`${key}=${value}`)
        replaced = true
      }

      continue
    }

    nextLines.push(line)
  }

  if (!replaced) {
    if (fileText.length > 0 && nextLines.at(-1) !== '') {
      nextLines.push('')
    }

    nextLines.push(`${key}=${value}`)
  }

  return `${nextLines.join('\n').replace(/\n+$/, '')}\n`
}

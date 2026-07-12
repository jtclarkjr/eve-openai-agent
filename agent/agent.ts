import { createOpenAI, openai } from '@ai-sdk/openai'
import { defineAgent } from 'eve'
import {
  isCustomOpenAIBaseURL,
  selectedOpenAIBaseURL,
  selectedLocalOpenAIApiKey,
  selectedLocalContextWindowTokens,
  selectedOpenAIModel
} from './openai-models.ts'

const openAIBaseURL = selectedOpenAIBaseURL()
const openAIModel = selectedOpenAIModel(process.env.OPENAI_MODEL, openAIBaseURL)
const useLocalEndpoint = isCustomOpenAIBaseURL(openAIBaseURL)

if (useLocalEndpoint) {
  globalThis.AI_SDK_DEFAULT_PROVIDER = createOpenAI({
    apiKey: selectedLocalOpenAIApiKey(openAIBaseURL),
    baseURL: openAIBaseURL,
    name: 'local'
  })
}

export default defineAgent({
  model: useLocalEndpoint ? openAIModel : openai(openAIModel),
  modelContextWindowTokens: useLocalEndpoint ? selectedLocalContextWindowTokens() : undefined
})

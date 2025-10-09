/**
 * Abstract LLM Provider Interface
 *
 * This allows swapping between OpenAI, Anthropic, or other LLM providers
 * without changing the rest of the codebase.
 */

export interface LLMResponse {
  sql: string;
  explanation: string;
  confidence: number;
  warnings?: string[];
}

export interface LLMProvider {
  /**
   * Generate SQL from natural language prompt
   */
  generateSQL(
    prompt: string,
    schemaContext: string,
    examples?: string[]
  ): Promise<LLMResponse>;

  /**
   * Get provider name (for logging/debugging)
   */
  getProviderName(): string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

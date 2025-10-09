/**
 * OpenAI LLM Provider Implementation
 *
 * Uses OpenAI GPT-4 for natural language to SQL translation
 */

import OpenAI from 'openai';
import type { LLMProvider, LLMResponse, LLMConfig } from './provider.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-4-turbo-preview';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.1; // Low temperature for accuracy
  }

  async generateSQL(
    prompt: string,
    schemaContext: string,
    examples?: string[]
  ): Promise<LLMResponse> {
    const systemPrompt = this.buildSystemPrompt(schemaContext, examples);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        sql: parsed.sql || '',
        explanation: parsed.explanation || '',
        confidence: parsed.confidence || 0.5,
        warnings: parsed.warnings || [],
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI generation failed: ${error}`);
    }
  }

  private buildSystemPrompt(schemaContext: string, examples?: string[]): string {
    return `You are an expert PostgreSQL query generator for a healthcare claims management system.

SCHEMA CONTEXT:
${schemaContext}

SAFETY RULES:
1. ONLY generate SELECT queries - NO INSERT, UPDATE, DELETE, DROP, or ALTER
2. Always include appropriate WHERE clauses to limit results
3. Use LIMIT clause (default 100) to prevent large result sets
4. Validate that referenced tables and columns exist in the schema
5. Use proper JOIN syntax for relationships
6. Handle NULL values appropriately

OUTPUT FORMAT:
Respond with valid JSON:
{
  "sql": "SELECT ...",
  "explanation": "This query retrieves...",
  "confidence": 0.95,
  "warnings": ["Large result set possible"]
}

${examples ? `\nEXAMPLES:\n${examples.join('\n\n')}` : ''}

Generate accurate, safe PostgreSQL queries based on the user's natural language request.`;
  }

  getProviderName(): string {
    return `OpenAI (${this.model})`;
  }
}

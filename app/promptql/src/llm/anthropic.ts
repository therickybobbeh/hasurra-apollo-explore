/**
 * Anthropic (Claude) LLM Provider Implementation
 *
 * Uses Anthropic Claude for natural language to SQL translation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMResponse, LLMConfig } from './provider.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: LLMConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-3-5-sonnet-20241022';
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
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate a PostgreSQL query for: ${prompt}\n\nRespond with valid JSON containing sql, explanation, confidence (0-1), and warnings array.`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from response (Claude might wrap it in markdown)
      const text = content.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        sql: parsed.sql || '',
        explanation: parsed.explanation || '',
        confidence: parsed.confidence || 0.5,
        warnings: parsed.warnings || [],
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic generation failed: ${error}`);
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
Respond with valid JSON only (no markdown, no explanation outside JSON):
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
    return `Anthropic (${this.model})`;
  }
}

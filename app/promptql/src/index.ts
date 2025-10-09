/**
 * PromptQL Server
 *
 * Natural language to SQL query engine using LLMs
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { OpenAIProvider } from './llm/openai.js';
import { AnthropicProvider } from './llm/anthropic.js';
import type { LLMProvider } from './llm/provider.js';
import { QueryValidator } from './validation/query-validator.js';
import { SchemaContextBuilder } from './schema/context-builder.js';
import { HasuraExecutor } from './execution/hasura-executor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PROMPTQL_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize components
const schemaBuilder = new SchemaContextBuilder();
const hasuraExecutor = new HasuraExecutor(
  process.env.HASURA_GRAPHQL_ENDPOINT + '/v1/graphql' || 'http://localhost:8080/v1/graphql',
  process.env.HASURA_GRAPHQL_ADMIN_SECRET || ''
);

// Initialize LLM provider based on config
let llmProvider: LLMProvider;

const providerType = (process.env.PROMPTQL_LLM_PROVIDER || 'openai') as 'openai' | 'anthropic';

if (providerType === 'anthropic') {
  llmProvider = new AnthropicProvider({
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
} else {
  llmProvider = new OpenAIProvider({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

console.log(`\n🤖 PromptQL Server`);
console.log(`   LLM Provider: ${llmProvider.getProviderName()}`);
console.log(`   Hasura: ${process.env.HASURA_GRAPHQL_ENDPOINT || 'localhost:8080'}\n`);

// Routes

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'promptql',
    llmProvider: llmProvider.getProviderName(),
  });
});

/**
 * Generate SQL from natural language
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get schema context
    const schemaContext = schemaBuilder.buildContext();
    const examples = schemaBuilder.getExamples();

    // Generate SQL using LLM
    const llmResponse = await llmProvider.generateSQL(prompt, schemaContext, examples);

    // Validate generated SQL
    const validation = QueryValidator.validate(llmResponse.sql);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Generated SQL failed validation',
        validationErrors: validation.errors,
        sql: llmResponse.sql,
      });
    }

    // Ensure LIMIT clause
    const safeSql = QueryValidator.ensureLimit(validation.sanitizedSQL!);

    res.json({
      sql: safeSql,
      explanation: llmResponse.explanation,
      confidence: llmResponse.confidence,
      warnings: [...validation.warnings, ...(llmResponse.warnings || [])],
    });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: 'SQL generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Execute SQL query
 */
app.post('/api/execute', async (req, res) => {
  try {
    const { sql } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL is required' });
    }

    // Validate SQL
    const validation = QueryValidator.validate(sql);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'SQL validation failed',
        validationErrors: validation.errors,
      });
    }

    // Execute query
    const result = await hasuraExecutor.executeSQL(validation.sanitizedSQL!);

    res.json({
      data: result.data,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
    });
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({
      error: 'Query execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Combined endpoint: Generate and execute
 */
app.post('/api/query', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Generate SQL
    const schemaContext = schemaBuilder.buildContext();
    const examples = schemaBuilder.getExamples();

    const llmResponse = await llmProvider.generateSQL(prompt, schemaContext, examples);

    // Validate
    const validation = QueryValidator.validate(llmResponse.sql);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Generated SQL failed validation',
        validationErrors: validation.errors,
        sql: llmResponse.sql,
      });
    }

    // Ensure LIMIT
    const safeSql = QueryValidator.ensureLimit(validation.sanitizedSQL!);

    // Execute
    const result = await hasuraExecutor.executeSQL(safeSql);

    res.json({
      prompt,
      sql: safeSql,
      explanation: llmResponse.explanation,
      confidence: llmResponse.confidence,
      warnings: [...validation.warnings, ...(llmResponse.warnings || [])],
      data: result.data,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get schema context (for debugging)
 */
app.get('/api/schema', (req, res) => {
  res.json({
    context: schemaBuilder.buildContext(),
    examples: schemaBuilder.getExamples(),
  });
});

// Start server
async function startServer() {
  // Test Hasura connection
  const hasuraConnected = await hasuraExecutor.testConnection();
  if (!hasuraConnected) {
    console.warn('⚠️  Warning: Could not connect to Hasura. Queries will fail.');
  } else {
    console.log('✓ Hasura connection successful');
  }

  app.listen(PORT, () => {
    console.log(`\n✓ PromptQL server running on port ${PORT}`);
    console.log(`  API endpoint: http://localhost:${PORT}/api/query`);
    console.log(`  Health check: http://localhost:${PORT}/health\n`);
  });
}

startServer().catch((error) => {
  console.error('Error starting PromptQL server:', error);
  process.exit(1);
});

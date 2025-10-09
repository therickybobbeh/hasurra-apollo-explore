/**
 * Schema Context Builder
 *
 * Builds schema context from Hasura metadata for LLM prompts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TableSchema {
  name: string;
  description?: string;
  columns: ColumnSchema[];
  relationships?: RelationshipSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
}

export interface RelationshipSchema {
  name: string;
  type: 'one-to-many' | 'many-to-one' | 'one-to-one';
  targetTable: string;
}

export class SchemaContextBuilder {
  private config: any;

  constructor() {
    // Load schema configuration from promptql/config/promptql.config.yml
    const configPath = join(__dirname, '../../../../promptql/config/promptql.config.yml');
    try {
      // For simplicity, we'll use a JSON version of the config
      // In production, you'd use a YAML parser
      this.config = this.loadSchemaConfig();
    } catch (error) {
      console.warn('Could not load schema config, using defaults');
      this.config = this.getDefaultSchema();
    }
  }

  /**
   * Build schema context string for LLM
   */
  buildContext(): string {
    const tables = this.config.schema?.tables || [];

    let context = 'DATABASE SCHEMA:\n\n';

    tables.forEach((table: any) => {
      context += `TABLE: ${table.name}\n`;
      if (table.description) {
        context += `Description: ${table.description}\n`;
      }
      context += 'Columns:\n';

      (table.columns || []).forEach((col: any) => {
        context += `  - ${col.name} (${col.type})`;
        if (col.description) {
          context += ` - ${col.description}`;
        }
        context += '\n';
      });

      context += '\n';
    });

    // Add glossary terms
    const glossary = this.config.glossary || [];
    if (glossary.length > 0) {
      context += 'BUSINESS GLOSSARY:\n\n';
      glossary.forEach((term: any) => {
        context += `${term.term}: ${term.expansion || term.description}\n`;
      });
      context += '\n';
    }

    return context;
  }

  /**
   * Get example queries
   */
  getExamples(): string[] {
    const patterns = this.config.prompt_patterns || [];
    return patterns.map((p: any) => {
      return `Prompt: "${p.pattern}"\nSQL: ${p.template}`;
    });
  }

  /**
   * Load schema configuration
   */
  private loadSchemaConfig(): any {
    // In a real implementation, parse the YAML file
    // For now, return the structure we know exists
    return this.getDefaultSchema();
  }

  /**
   * Default schema configuration
   */
  private getDefaultSchema() {
    return {
      schema: {
        tables: [
          {
            name: 'members',
            description: 'Health plan members and patients',
            columns: [
              { name: 'id', type: 'uuid' },
              { name: 'first_name', type: 'text' },
              { name: 'last_name', type: 'text' },
              { name: 'dob', type: 'date', description: 'Date of birth' },
              { name: 'plan', type: 'text', description: 'Insurance plan type: PPO, HMO, EPO, POS, HDHP' },
            ],
          },
          {
            name: 'provider_records',
            description: 'Healthcare providers (doctors, hospitals, clinics)',
            columns: [
              { name: 'id', type: 'uuid' },
              { name: 'npi', type: 'text', description: 'National Provider Identifier' },
              { name: 'name', type: 'text' },
              { name: 'specialty', type: 'text', description: 'Medical specialty' },
            ],
          },
          {
            name: 'claims',
            description: 'Medical claims for services rendered',
            columns: [
              { name: 'id', type: 'uuid' },
              { name: 'member_id', type: 'uuid' },
              { name: 'provider_id', type: 'uuid' },
              { name: 'dos', type: 'date', description: 'Date of service' },
              { name: 'cpt', type: 'text', description: 'Current Procedural Terminology code' },
              { name: 'charge_cents', type: 'integer', description: 'Amount charged in cents' },
              { name: 'allowed_cents', type: 'integer', description: 'Amount allowed by insurance in cents' },
              { name: 'status', type: 'text', description: 'Claim status: PAID, DENIED, PENDING' },
              { name: 'denial_reason', type: 'text', description: 'Reason for claim denial' },
            ],
          },
          {
            name: 'notes',
            description: 'Case management notes for members',
            columns: [
              { name: 'id', type: 'uuid' },
              { name: 'member_id', type: 'uuid' },
              { name: 'created_at', type: 'timestamptz' },
              { name: 'body', type: 'text', description: 'Note content' },
            ],
          },
        ],
      },
      glossary: [
        { term: 'PA', expansion: 'Prior Authorization' },
        { term: 'step therapy', description: 'Insurance requirement to try lower-cost drugs first' },
        { term: 'allowed amount', description: 'Maximum amount insurance will pay for a service' },
      ],
      prompt_patterns: [
        {
          pattern: 'top {n} denial reasons',
          template: "SELECT denial_reason, COUNT(*) as count FROM claims WHERE status = 'DENIED' GROUP BY denial_reason ORDER BY count DESC LIMIT {n}",
        },
      ],
    };
  }
}

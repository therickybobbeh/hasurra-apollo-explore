/**
 * Hasura Query Executor
 *
 * Executes validated SQL queries via Hasura's GraphQL endpoint
 */

import { GraphQLClient } from 'graphql-request';

export interface QueryResult {
  data: any[];
  rowCount: number;
  executionTime: number;
}

export class HasuraExecutor {
  private client: GraphQLClient;

  constructor(hasuraEndpoint: string, adminSecret: string) {
    this.client = new GraphQLClient(hasuraEndpoint, {
      headers: {
        'x-hasura-admin-secret': adminSecret,
      },
    });
  }

  /**
   * Execute raw SQL query via Hasura
   */
  async executeSQL(sql: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Use Hasura's run_sql API
      const query = `
        mutation RunSQL($sql: String!) {
          run_sql(args: {sql: $sql}) {
            result_type
            result
          }
        }
      `;

      const variables = { sql };
      const response: any = await this.client.request(query, variables);

      const executionTime = Date.now() - startTime;

      if (!response.run_sql) {
        throw new Error('Invalid response from Hasura');
      }

      const result = response.run_sql.result;

      // Parse Hasura result format
      // First row is column names, rest are data
      if (!Array.isArray(result) || result.length === 0) {
        return {
          data: [],
          rowCount: 0,
          executionTime,
        };
      }

      const [columnNames, ...rows] = result;

      // Convert rows to objects
      const data = rows.map((row: any[]) => {
        const obj: any = {};
        columnNames.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      });

      return {
        data,
        rowCount: data.length,
        executionTime,
      };
    } catch (error) {
      console.error('Hasura execution error:', error);
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  /**
   * Test connection to Hasura
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.executeSQL('SELECT 1');
      return true;
    } catch (error) {
      console.error('Hasura connection test failed:', error);
      return false;
    }
  }
}

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env
config({ path: resolve(process.cwd(), '.env') });

// Verify required environment variables
const requiredEnvVars = [
  'HASURA_GRAPHQL_ENDPOINT',
  'HASURA_GRAPHQL_ADMIN_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

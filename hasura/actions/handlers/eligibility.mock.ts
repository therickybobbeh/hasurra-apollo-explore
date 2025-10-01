/**
 * Hasura Action Handler - Eligibility Check
 * Mock implementation that simulates an external eligibility verification API
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

const { Client } = pg;

const app = express();
const PORT = process.env.ACTION_HANDLER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'eligibility-handler' });
});

// Eligibility check action handler
app.post('/eligibility', async (req: Request, res: Response) => {
  try {
    const { input, session_variables } = req.body;
    const { memberId } = input;

    console.log('[ACTION] Eligibility check requested for member:', memberId);
    console.log('[ACTION] Session variables:', session_variables);

    // Validate member ID
    if (!memberId) {
      return res.status(400).json({
        message: 'memberId is required'
      });
    }

    // Connect to database
    const client = new Client({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'claimsight',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'claimsight'
    });

    await client.connect();

    // Check if member exists
    const memberResult = await client.query(
      'SELECT id, first_name, last_name, plan FROM members WHERE id = $1',
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        message: 'Member not found'
      });
    }

    const member = memberResult.rows[0];
    console.log('[ACTION] Member found:', member.first_name, member.last_name);

    // Simulate eligibility check (mock external API call)
    // In production, this would call a real payer API
    const isEligible = Math.random() > 0.1; // 90% eligible
    const mockResult = {
      eligible: isEligible,
      plan_active: isEligible,
      coverage_start: '2024-01-01',
      coverage_end: '2024-12-31',
      deductible_remaining: Math.floor(Math.random() * 2000),
      oop_max_remaining: Math.floor(Math.random() * 5000),
      benefits: {
        primary_care: { copay: 25, coverage: 100 },
        specialist: { copay: 50, coverage: 80 },
        emergency: { copay: 250, coverage: 80 },
        hospitalization: { copay: 0, coverage: 80, deductible_applies: true }
      },
      checked_at: new Date().toISOString(),
      plan_type: member.plan
    };

    // Insert eligibility check into database
    const insertResult = await client.query(
      `INSERT INTO eligibility_checks (member_id, checked_at, result)
       VALUES ($1, $2, $3)
       RETURNING id, member_id, checked_at, result, created_at`,
      [memberId, new Date().toISOString(), JSON.stringify(mockResult)]
    );

    await client.end();

    const eligibilityCheck = insertResult.rows[0];
    console.log('[ACTION] Eligibility check created:', eligibilityCheck.id);

    // Return the created eligibility check
    // Hasura expects the return type to match the action's output type
    res.json({
      id: eligibilityCheck.id,
      member_id: eligibilityCheck.member_id,
      checked_at: eligibilityCheck.checked_at,
      result: eligibilityCheck.result,
      created_at: eligibilityCheck.created_at
    });

  } catch (error) {
    console.error('[ACTION] Error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Eligibility action handler running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`  Handler endpoint: http://localhost:${PORT}/eligibility\n`);
});

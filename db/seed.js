#!/usr/bin/env node

/**
 * ClaimSight Database Seeder
 * Cross-platform Node.js seeder using pg library (no psql dependency)
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Client } = pg;

// Seed data generators
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jennifer', 'James', 'Mary', 'Richard', 'Patricia', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const PLANS = ['PPO', 'HMO', 'EPO', 'POS', 'HDHP'];

const SPECIALTIES = [
  'Primary Care',
  'Cardiology',
  'Orthopedics',
  'Emergency Medicine',
  'Pediatrics',
  'Dermatology',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Oncology'
];

const CPT_CODES = [
  { code: '99213', desc: 'Office visit - established patient', charge: 15000 },
  { code: '99214', desc: 'Office visit - extended', charge: 22500 },
  { code: '99285', desc: 'Emergency room visit', charge: 75000 },
  { code: '99223', desc: 'Hospital admission', charge: 50000 },
  { code: '70450', desc: 'CT scan head', charge: 125000 },
  { code: '93000', desc: 'Electrocardiogram', charge: 8500 },
  { code: '36415', desc: 'Blood draw', charge: 2500 },
  { code: '80053', desc: 'Comprehensive metabolic panel', charge: 4500 },
  { code: '85025', desc: 'Complete blood count', charge: 3500 },
  { code: '99232', desc: 'Hospital care', charge: 18000 }
];

const DENIAL_REASONS = [
  'Prior authorization required',
  'Step therapy not followed',
  'Not medically necessary',
  'Out of network',
  'Duplicate claim',
  'Missing documentation',
  'Service not covered under plan',
  'Pre-existing condition exclusion'
];

const NOTE_TEMPLATES = [
  'Member called regarding prior authorization for {service}. Submitted PA request to medical review.',
  'Appeal filed for denied claim. Step therapy requirements were met. Awaiting review.',
  'Discussed step therapy requirements with member. Will try generic alternative first.',
  'PA approved for {service}. Valid for 90 days.',
  'Member expressed concerns about out of network charges. Explained benefits.',
  'Case escalated to care management team for complex care coordination.',
  'Prior auth denied. Member will appeal decision with supporting documentation.',
  'Step therapy exception requested due to contraindication with generic option.',
  'Member eligible for case management program. Outreach scheduled.',
  'Reviewed EOB with member. Clarified allowed amounts and member responsibility.'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateNPI() {
  return '1' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
}

async function main() {
  console.log('=== ClaimSight Database Seeder ===\n');

  // Create client
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'your connection string',
    ssl: {
      rejectUnauthorized: false,
      require: true
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    // Check if tables already exist
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'members'
      );
    `);

    const tablesExist = tableCheck.rows[0].exists;

    if (!tablesExist) {
      // Run schema
      console.log('Creating schema...');
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schema);
      console.log('✓ Schema created\n');

      // Run indexes
      console.log('Creating indexes...');
      const indexes = readFileSync(join(__dirname, 'indexes.sql'), 'utf8');
      await client.query(indexes);
      console.log('✓ Indexes created\n');

      // Run RLS
      console.log('Setting up row-level security...');
      const rls = readFileSync(join(__dirname, 'rls.sql'), 'utf8');
      await client.query(rls);
      console.log('✓ RLS configured\n');
    } else {
      console.log('ℹ Schema already exists, skipping creation\n');
    }

    // Seed members
    console.log('Seeding members...');
    const memberIds = [];
    for (let i = 0; i < 50; i++) {
      const dob = randomDate(new Date(1940, 0, 1), new Date(2005, 0, 1));
      const result = await client.query(
        `INSERT INTO members (first_name, last_name, dob, plan)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          randomChoice(FIRST_NAMES),
          randomChoice(LAST_NAMES),
          dob.toISOString().split('T')[0],
          randomChoice(PLANS)
        ]
      );
      memberIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${memberIds.length} members\n`);

    // Seed providers
    console.log('Seeding providers...');
    const providerIds = [];
    for (let i = 0; i < 20; i++) {
      const specialty = randomChoice(SPECIALTIES);
      const lastName = randomChoice(LAST_NAMES);
      const result = await client.query(
        `INSERT INTO provider_records (npi, name, specialty)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          generateNPI(),
          `Dr. ${lastName} ${specialty} Clinic`,
          specialty
        ]
      );
      providerIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${providerIds.length} providers\n`);

    // Seed claims
    console.log('Seeding claims...');
    const statuses = ['PAID', 'PAID', 'PAID', 'PAID', 'DENIED', 'PENDING'];
    for (let i = 0; i < 150; i++) {
      const cptData = randomChoice(CPT_CODES);
      const status = randomChoice(statuses);
      const dos = randomDate(new Date(2024, 0, 1), new Date());
      const chargeCents = cptData.charge + Math.floor(Math.random() * 5000);
      const allowedCents = status === 'PAID'
        ? Math.floor(chargeCents * (0.6 + Math.random() * 0.3))
        : (status === 'DENIED' ? 0 : chargeCents);
      const denialReason = status === 'DENIED' ? randomChoice(DENIAL_REASONS) : null;

      await client.query(
        `INSERT INTO claims (member_id, provider_id, dos, cpt, charge_cents, allowed_cents, status, denial_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          randomChoice(memberIds),
          randomChoice(providerIds),
          dos.toISOString().split('T')[0],
          cptData.code,
          chargeCents,
          allowedCents,
          status,
          denialReason
        ]
      );
    }
    console.log('✓ Created 150 claims\n');

    // Seed eligibility checks
    console.log('Seeding eligibility checks...');
    for (let i = 0; i < 30; i++) {
      const isEligible = Math.random() > 0.2;
      const result = {
        eligible: isEligible,
        plan_active: isEligible,
        coverage_start: '2024-01-01',
        coverage_end: '2024-12-31',
        deductible_remaining: Math.floor(Math.random() * 2000),
        oop_max_remaining: Math.floor(Math.random() * 5000),
        benefits: {
          primary_care: { copay: 25, coverage: 100 },
          specialist: { copay: 50, coverage: 80 },
          emergency: { copay: 250, coverage: 80 }
        }
      };

      const checkedAt = randomDate(new Date(2024, 0, 1), new Date());
      await client.query(
        `INSERT INTO eligibility_checks (member_id, checked_at, result)
         VALUES ($1, $2, $3)`,
        [
          randomChoice(memberIds),
          checkedAt.toISOString(),
          JSON.stringify(result)
        ]
      );
    }
    console.log('✓ Created 30 eligibility checks\n');

    // Seed notes
    console.log('Seeding notes...');
    for (let i = 0; i < 25; i++) {
      const template = randomChoice(NOTE_TEMPLATES);
      const body = template.replace('{service}', randomChoice(CPT_CODES).desc);
      const createdAt = randomDate(new Date(2024, 0, 1), new Date());

      await client.query(
        `INSERT INTO notes (member_id, created_at, body)
         VALUES ($1, $2, $3)`,
        [
          randomChoice(memberIds),
          createdAt.toISOString(),
          body
        ]
      );
    }
    console.log('✓ Created 25 notes\n');

    console.log('=== Seeding Complete ===\n');
    console.log('Summary:');
    console.log('- 50 members');
    console.log('- 20 providers');
    console.log('- 150 claims (various statuses)');
    console.log('- 30 eligibility checks');
    console.log('- 25 case management notes');
    console.log('\nNext step: Run "npm run hasura:apply" to configure Hasura');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

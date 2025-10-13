/**
 * GraphQL Resolvers for Appointments Service
 *
 * This demonstrates writing resolvers manually with SQL queries,
 * contrasting with Hasura's auto-generated resolvers.
 */

import { query } from '../db/connection.js';

export const resolvers = {
  // Entity reference resolvers for Federation
  Appointment: {
    __resolveReference: async (reference: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments.appointments WHERE id = $1',
        [reference.id]
      );
      return result.rows[0] || null;
    },
    // Resolve member relationship - Hasura exposes as 'members' (lowercase plural)
    member: (parent: any) => ({ __typename: 'members', id: parent.member_id }),
    // Resolve provider relationship - Hasura exposes as 'provider_records'
    provider: (parent: any) => ({ __typename: 'provider_records', id: parent.provider_id }),
  },

  BillingRecord: {
    __resolveReference: async (reference: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments.billing_records WHERE id = $1',
        [reference.id]
      );
      return result.rows[0] || null;
    },
    // Resolve claim relationship - Hasura exposes as 'claims' (lowercase plural)
    claim: (parent: any) => ({ __typename: 'claims', id: parent.claim_id }),
  },

  Query: {
    // Get all appointments
    appointments: async () => {
      console.log('Fetching all appointments...');
      const result = await query(`
        SELECT * FROM appointments.appointments
        ORDER BY appointment_date DESC
      `);
      console.log(`Found ${result.rows.length} appointments`);
      return result.rows;
    },

    // Get single appointment by ID
    appointment: async (_: any, { id }: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments.appointments WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    // Get appointments by member
    appointmentsByMember: async (_: any, { member_id }: { member_id: string }) => {
      const result = await query(
        `SELECT * FROM appointments.appointments
         WHERE member_id = $1
         ORDER BY appointment_date DESC`,
        [member_id]
      );
      return result.rows;
    },

    // Get appointments by provider
    appointmentsByProvider: async (_: any, { provider_id }: { provider_id: string }) => {
      const result = await query(
        `SELECT * FROM appointments.appointments
         WHERE provider_id = $1
         ORDER BY appointment_date DESC`,
        [provider_id]
      );
      return result.rows;
    },

    // Get all billing records
    billingRecords: async () => {
      const result = await query(`
        SELECT * FROM appointments.billing_records
        ORDER BY created_at DESC
      `);
      return result.rows;
    },

    // Get single billing record by ID
    billingRecord: async (_: any, { id }: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments.billing_records WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    },

    // Get billing records by claim
    billingRecordsByClaim: async (_: any, { claim_id }: { claim_id: string }) => {
      const result = await query(
        `SELECT * FROM appointments.billing_records
         WHERE claim_id = $1
         ORDER BY created_at DESC`,
        [claim_id]
      );
      return result.rows;
    },
  },

  Mutation: {
    // Create new appointment
    createAppointment: async (_: any, { input }: { input: any }) => {
      const { member_id, provider_id, appointment_date, notes } = input;

      const result = await query(
        `INSERT INTO appointments.appointments (member_id, provider_id, appointment_date, status, notes)
         VALUES ($1, $2, $3, 'SCHEDULED', $4)
         RETURNING *`,
        [member_id, provider_id, appointment_date, notes]
      );

      return result.rows[0];
    },

    // Cancel appointment
    cancelAppointment: async (_: any, { id }: { id: string }) => {
      const result = await query(
        `UPDATE appointments.appointments
         SET status = 'CANCELLED'
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error(`Appointment with ID ${id} not found`);
      }

      return result.rows[0];
    },

    // Complete appointment
    completeAppointment: async (_: any, { id }: { id: string }) => {
      const result = await query(
        `UPDATE appointments.appointments
         SET status = 'COMPLETED'
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error(`Appointment with ID ${id} not found`);
      }

      return result.rows[0];
    },

    // Create billing record
    createBillingRecord: async (_: any, { input }: { input: any }) => {
      const { claim_id, amount_billed, amount_paid, payment_date, payment_method } = input;

      const result = await query(
        `INSERT INTO appointments.billing_records (claim_id, amount_billed, amount_paid, payment_date, payment_method)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [claim_id, amount_billed, amount_paid, payment_date, payment_method]
      );

      return result.rows[0];
    },
  },
};

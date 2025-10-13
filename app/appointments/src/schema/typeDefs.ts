/**
 * GraphQL Schema for Appointments Service
 *
 * This demonstrates building a GraphQL schema from scratch,
 * contrasting with Hasura's auto-generated approach.
 */

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar uuid

  """
  An appointment between a member and a provider
  """
  type Appointment @key(fields: "id") {
    id: ID!
    member_id: ID!
    provider_id: ID!
    appointment_date: String!
    status: AppointmentStatus!
    notes: String
    created_at: String!
    member: members
    provider: provider_records
  }

  """
  Member entity (extended from Hasura subgraph)
  Note: Hasura exposes this as 'members' (lowercase plural)
  """
  type members @key(fields: "id", resolvable: false) @extends {
    id: uuid! @external
  }

  """
  Provider entity (extended from Hasura/Providers subgraph)
  Note: Hasura exposes this as 'provider_records' (lowercase with _records suffix)
  """
  type provider_records @key(fields: "id", resolvable: false) @extends {
    id: uuid! @external
  }

  """
  Appointment status values
  """
  enum AppointmentStatus {
    SCHEDULED
    COMPLETED
    CANCELLED
    NO_SHOW
  }

  """
  Billing record for a claim
  """
  type BillingRecord @key(fields: "id") {
    id: ID!
    claim_id: ID!
    amount_billed: Int!
    amount_paid: Int!
    payment_date: String
    payment_method: PaymentMethod
    created_at: String!
    claim: claims
  }

  """
  Claim entity (extended from Hasura subgraph)
  Note: Hasura exposes this as 'claims' (lowercase plural)
  """
  type claims @key(fields: "id", resolvable: false) @extends {
    id: uuid! @external
  }

  """
  Payment method options
  """
  enum PaymentMethod {
    INSURANCE
    COPAY
    DEDUCTIBLE
    OUT_OF_POCKET
  }

  """
  Input for creating a new appointment
  """
  input CreateAppointmentInput {
    member_id: ID!
    provider_id: ID!
    appointment_date: String!
    notes: String
  }

  """
  Input for creating a billing record
  """
  input CreateBillingRecordInput {
    claim_id: ID!
    amount_billed: Int!
    amount_paid: Int!
    payment_date: String
    payment_method: PaymentMethod
  }

  type Query {
    """
    Get all appointments
    """
    appointments: [Appointment!]!

    """
    Get a single appointment by ID
    """
    appointment(id: ID!): Appointment

    """
    Get appointments for a specific member
    """
    appointmentsByMember(member_id: ID!): [Appointment!]!

    """
    Get appointments for a specific provider
    """
    appointmentsByProvider(provider_id: ID!): [Appointment!]!

    """
    Get all billing records
    """
    billingRecords: [BillingRecord!]!

    """
    Get a single billing record by ID
    """
    billingRecord(id: ID!): BillingRecord

    """
    Get billing records for a specific claim
    """
    billingRecordsByClaim(claim_id: ID!): [BillingRecord!]!
  }

  type Mutation {
    """
    Create a new appointment
    """
    createAppointment(input: CreateAppointmentInput!): Appointment!

    """
    Cancel an appointment
    """
    cancelAppointment(id: ID!): Appointment!

    """
    Mark appointment as completed
    """
    completeAppointment(id: ID!): Appointment!

    """
    Create a new billing record
    """
    createBillingRecord(input: CreateBillingRecordInput!): BillingRecord!
  }
`;

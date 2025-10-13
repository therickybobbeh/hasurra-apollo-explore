# Phase 3: Building Apollo Server from Scratch

## 🎯 Learning Objectives

In this phase, you'll learn:
- How to build a GraphQL API manually with Apollo Server
- Writing GraphQL schemas and resolvers from scratch
- Direct database access with node-postgres
- Key differences between Hasura (database-first) and Apollo Server (code-first)
- Manual query optimization and SQL control

## 📚 What You'll Build

A standalone **Appointments Service** that manages:
- **Appointments**: Schedule, complete, and cancel appointments
- **Billing Records**: Track payments and insurance claims

This contrasts with Phase 1 (Hasura), where GraphQL was auto-generated from your database schema. Here, you'll write everything manually.

---

## 🆚 Hasura vs Apollo Server

| Aspect | Hasura (Phase 1) | Apollo Server (Phase 3) |
|--------|------------------|-------------------------|
| **Approach** | Database-first | Code-first |
| **Schema** | Auto-generated from tables | Manually written |
| **Resolvers** | Automatic | Manually written |
| **Database** | Built-in connection | Manual setup (node-postgres) |
| **Speed** | Fast initial setup | More setup required |
| **Control** | Limited SQL control | Full SQL control |
| **Use Case** | CRUD operations, rapid prototyping | Custom business logic, complex queries |

---

## 📋 Prerequisites

- ✅ Completed Phase 1 (Hasura Cloud)
- ✅ Completed Phase 2 (Apollo Federation)
- ✅ Neon PostgreSQL account (from Phase 1)
- ✅ Node.js 18+ installed

---

## 🚀 Step 1: Use Your Existing Neon Database

**Important**: Neon's free tier allows only one database per project. Instead of creating separate databases, we'll use **PostgreSQL schemas** to logically separate services.

1. **You already have a database**: Use your existing `neondb` database from Phase 1

2. **Schemas provide isolation**: The SQL scripts will create an `appointments` schema within your existing database:
   ```sql
   CREATE SCHEMA IF NOT EXISTS appointments;
   CREATE TABLE appointments.appointments (...);
   ```

3. **Use your existing connection string**:
   - You'll use the same connection string from Phase 1
   - It should look like:
     ```
     postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```

> **Why schemas instead of databases?** PostgreSQL schemas provide logical namespace separation within a single database. This demonstrates service isolation while working within Neon's free tier constraints. In production, you'd typically use separate databases per service.

---

## 🚀 Step 2: Set Up Environment Variables

Add the appointments service configuration to your `.env` file:

```bash
# Add to .env in project root
# Use the SAME connection string as Phase 1 (neondb database)
APPOINTMENTS_DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
APPOINTMENTS_PORT=3004
APPOINTMENTS_URL=http://localhost:3004/graphql
```

> **Note**: Use your existing `neondb` connection string from Phase 1. The `appointments` schema will be created automatically when you run the SQL scripts.

---

## 🚀 Step 3: Initialize Database Schema

Run the SQL scripts to create the `appointments` schema and seed data:

1. **Navigate to Neon SQL Editor**:
   - Select your `neondb` database (the same one from Phase 1)
   - Open the SQL Editor

2. **Run the schema script**:
   - Copy contents of `app/appointments/sql/001_create_tables.sql`
   - Paste into SQL Editor
   - Click **Run**
   - This creates the `appointments` schema with tables

3. **Run the seed data script**:
   - Copy contents of `app/appointments/sql/002_seed_data.sql`
   - Paste into SQL Editor
   - Click **Run**

4. **Verify data**:
   ```sql
   SELECT COUNT(*) FROM appointments.appointments;
   SELECT COUNT(*) FROM appointments.billing_records;
   ```

---

## 🚀 Step 4: Install Dependencies

Install dependencies for the appointments service:

```bash
cd app/appointments
npm install
```

This installs:
- `@apollo/server` - Apollo Server core
- `express` - HTTP server
- `pg` - PostgreSQL client for Node.js
- `graphql` - GraphQL implementation
- `dotenv` - Environment variable management

---

## 🚀 Step 5: Start the Appointments Service

You have two options for running Phase 3:

### Option 1: Run Just the Appointments Service (Standalone Testing)

```bash
npm run appointments:dev
```

### Option 2: Run All Phase 3 Services Together

```bash
npm run phase3:dev
```

**This starts:**
- ✅ Action Handler (port 3001)
- ✅ Providers Subgraph (port 3002)
- ✅ Gateway (port 4000) - still connects to Hasura + Providers only
- ✅ Appointments Service (port 3004) - running standalone
- ✅ Client (port 5173)

> **Note**: At this phase, appointments runs standalone. Phase 4 adds it to federation.

You should see:

```
🏥 Appointments Service
Testing database connection...
✓ Connected to appointments database
✓ Appointments service running on port 3004
  GraphQL endpoint: http://localhost:3004/graphql
  Health check: http://localhost:3004/health
```

---

## 🧪 Step 6: Test Your API

### Open Apollo Sandbox

Navigate to: http://localhost:3004/graphql

### Test Query 1: Get All Appointments

```graphql
query GetAllAppointments {
  appointments {
    id
    member_id
    provider_id
    appointment_date
    status
    notes
    created_at
  }
}
```

### Test Query 2: Get Appointments by Member

```graphql
query GetMemberAppointments {
  appointmentsByMember(member_id: "550e8400-e29b-41d4-a716-446655440000") {
    id
    appointment_date
    status
    notes
  }
}
```

### Test Mutation 1: Create Appointment

```graphql
mutation CreateAppointment {
  createAppointment(input: {
    member_id: "550e8400-e29b-41d4-a716-446655440000"
    provider_id: "bc6630ae-d320-4693-906a-9ab0c7f7eb51"
    appointment_date: "2025-11-15T10:00:00Z"
    notes: "Follow-up appointment"
  }) {
    id
    appointment_date
    status
    notes
  }
}
```

### Test Mutation 2: Cancel Appointment

```graphql
mutation CancelAppointment {
  cancelAppointment(id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d") {
    id
    status
  }
}
```

### Test Query 3: Get Billing Records

```graphql
query GetBillingRecords {
  billingRecords {
    id
    claim_id
    amount_billed
    amount_paid
    payment_date
    payment_method
  }
}
```

---

## 🔍 Code Deep Dive

### 1. GraphQL Schema (`src/schema/typeDefs.ts`)

Unlike Hasura, you define your schema manually:

```typescript
export const typeDefs = gql`
  type Appointment {
    id: ID!
    member_id: ID!
    provider_id: ID!
    appointment_date: String!
    status: AppointmentStatus!
    notes: String
  }

  type Query {
    appointments: [Appointment!]!
    appointment(id: ID!): Appointment
  }

  type Mutation {
    createAppointment(input: CreateAppointmentInput!): Appointment!
  }
`;
```

**Key concepts**:
- `type Appointment` - Object type definition
- `type Query` - Read operations
- `type Mutation` - Write operations
- `!` - Non-nullable field
- `[Appointment!]!` - Non-null array of non-null items

### 2. Resolvers (`src/resolvers/index.ts`)

Every field needs a resolver function:

```typescript
export const resolvers = {
  Query: {
    appointments: async () => {
      const result = await query(`
        SELECT * FROM appointments
        ORDER BY appointment_date DESC
      `);
      return result.rows;
    },

    appointment: async (_: any, { id }: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    }
  },

  Mutation: {
    createAppointment: async (_: any, { input }: { input: any }) => {
      const { member_id, provider_id, appointment_date, notes } = input;
      const result = await query(
        `INSERT INTO appointments (member_id, provider_id, appointment_date, status, notes)
         VALUES ($1, $2, $3, 'SCHEDULED', $4)
         RETURNING *`,
        [member_id, provider_id, appointment_date, notes]
      );
      return result.rows[0];
    }
  }
};
```

**Key concepts**:
- `_` - First parameter is parent object (unused in root resolvers)
- Second parameter contains GraphQL arguments
- Direct SQL queries with parameterized values (`$1`, `$2`)
- `RETURNING *` - Returns inserted/updated row

### 3. Database Connection (`src/db/connection.ts`)

Manual PostgreSQL setup with connection pooling:

```typescript
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.APPOINTMENTS_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}
```

**Key concepts**:
- Connection pooling for performance
- SSL required for Neon
- Parameterized queries prevent SQL injection

### 4. Apollo Server Setup (`src/index.ts`)

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server)
);
```

**Key concepts**:
- Express middleware integration
- CORS enabled for browser access
- Single `/graphql` endpoint for all operations

---

## 🎓 Key Takeaways

### What You Built Manually:
1. ✅ GraphQL schema with types, queries, and mutations
2. ✅ Resolver functions with raw SQL queries
3. ✅ Database connection and pooling
4. ✅ Express server with Apollo Server middleware
5. ✅ Error handling and validation

### What Hasura Did Automatically (Phase 1):
1. ✅ Generated schema from database tables
2. ✅ Created resolvers for CRUD operations
3. ✅ Built-in connection pooling
4. ✅ Built-in HTTP server
5. ✅ Automatic permissions and validation

### When to Use Each Approach:

**Use Hasura when**:
- Rapid prototyping
- Standard CRUD operations
- Database-driven applications
- Need instant GraphQL API

**Use Apollo Server when**:
- Complex business logic
- Custom data sources (REST APIs, microservices)
- Full control over SQL queries
- Custom authentication/authorization logic

---

## 🐛 Troubleshooting

### "Failed to connect to database"
- ✅ Check `APPOINTMENTS_DATABASE_URL` in `.env`
- ✅ Verify database name is `appointments`
- ✅ Ensure SSL mode is enabled

### "Table does not exist"
- ✅ Run `001_create_tables.sql` in Neon SQL Editor
- ✅ Select correct database (`appointments`) before running

### "Port 3004 is already in use"
- ✅ Change `APPOINTMENTS_PORT` in `.env`
- ✅ Update port in queries

### "Cannot find module '@apollo/server'"
- ✅ Run `cd app/appointments && npm install`

---

## ✅ Success Criteria

You've successfully completed Phase 3 when:

- [ ] Appointments service starts without errors
- [ ] Can query all appointments
- [ ] Can create new appointments
- [ ] Can cancel appointments
- [ ] Can query billing records
- [ ] Understand the difference between Hasura and Apollo Server
- [ ] Comfortable writing GraphQL schemas and resolvers

---

## 🎉 Next Steps

**Continue to Phase 4**: [Add to Federation](../phase-4-add-to-federation/README.md)

In Phase 4, you'll:
- Enable Apollo Federation on this service
- Connect it to your existing gateway
- Query across all three services (Hasura + Providers + Appointments)
- See how manually-built and auto-generated services work together

---

## 📚 Additional Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Schema Basics](https://graphql.org/learn/schema/)
- [node-postgres Documentation](https://node-postgres.com/)
- [PostgreSQL with Node.js](https://www.postgresql.org/docs/current/index.html)

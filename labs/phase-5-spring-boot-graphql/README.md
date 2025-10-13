# Phase 5: Building Spring Boot GraphQL from Scratch

## 🎯 Learning Objectives

In this phase, you'll learn:
- How to build a GraphQL API with Spring Boot and Java
- Schema-first GraphQL development with `.graphqls` files
- Spring Data JPA for database access
- GraphQL resolvers vs REST controllers
- Key differences between Spring Boot, Apollo Server, and Hasura

## 📚 What You'll Build

A standalone **Medications Service** that manages:
- **Prescriptions**: Create, track, and manage prescriptions
- **Medication Information**: Dosage, frequency, pharmacy details
- **Refills**: Track refills remaining and manage refill requests

This contrasts with:
- **Phase 1 (Hasura)**: Database-first, auto-generated
- **Phase 3 (Apollo Server)**: Code-first, Node.js/TypeScript
- **Phase 5 (Spring Boot)**: Schema-first, Java/Maven

---

## 🆚 Hasura vs Apollo Server vs Spring Boot

| Aspect | Hasura (Phase 1) | Apollo (Phase 3) | Spring Boot (Phase 5) |
|--------|------------------|------------------|------------------------|
| **Approach** | Database-first | Code-first | Schema-first |
| **Language** | Go (compiled) | Node.js/TypeScript | Java/JVM |
| **Schema** | Auto-generated from tables | Manually written (gql tagged template) | Separate .graphqls file |
| **Resolvers** | Automatic | Manually written (functions) | Annotated methods (@QueryMapping) |
| **Database** | Built-in connection | Manual setup (node-postgres) | Spring Data JPA (ORM) |
| **Type Safety** | Database-driven | TypeScript types | Java classes |
| **Speed** | Fastest initial setup | Fast with TypeScript | Slowest initial setup |
| **Enterprise Use** | Startups, rapid prototyping | Node.js shops | Large enterprises, banks |
| **Best For** | CRUD APIs, rapid development | Custom logic, Node ecosystems | Enterprise apps, strong typing |

---

## 📋 Prerequisites

- ✅ Completed Phase 1 (Hasura Cloud)
- ✅ Completed Phase 2 (Apollo Federation)
- ✅ Completed Phase 3 (Apollo Server from Scratch)
- ✅ Completed Phase 4 (Add to Federation)
- ✅ Java 17+ installed ([adoptium.net](https://adoptium.net/) or [oracle.com/java](https://www.oracle.com/java/technologies/downloads/))
- ✅ Maven 3.6+ installed ([maven.apache.org](https://maven.apache.org/install.html))
- ✅ Neon PostgreSQL account (from Phase 1)

---

## 🚀 Step 1: Verify Java and Maven

Check your Java and Maven installations:

```bash
java --version
# Should show Java 17 or higher

mvn --version
# Should show Maven 3.6 or higher
```

If not installed:
- **macOS**: `brew install openjdk@17 maven`
- **Windows**: Download from [adoptium.net](https://adoptium.net/) and [maven.apache.org](https://maven.apache.org/download.cgi)
- **Linux**: `sudo apt-get install openjdk-17-jdk maven`

---

## 🚀 Step 2: Use Your Existing Neon Database

**Important**: Neon's free tier allows only one database per project. Instead of creating separate databases, we'll use **PostgreSQL schemas** to logically separate services.

1. **You already have a database**: Use your existing `neondb` database from Phase 1

2. **Schemas provide isolation**: The SQL scripts will create a `medications` schema within your existing database:
   ```sql
   CREATE SCHEMA IF NOT EXISTS medications;
   CREATE TABLE medications.prescriptions (...);
   ```

3. **Use your existing connection string**:
   - You'll use the same connection string from Phase 1
   - It should look like:
     ```
     postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```

> **Why schemas instead of databases?** PostgreSQL schemas provide logical namespace separation within a single database:
> - Hasura tables → `public` schema
> - Appointments service → `appointments` schema
> - Medications service → `medications` schema
>
> This demonstrates service isolation while working within Neon's free tier constraints. In production, you'd typically use separate databases per service.

---

## 🚀 Step 3: Set Up Environment Variables

Add the medications service configuration to your `.env` file:

```bash
# Add to .env in project root
# Use the SAME connection string as Phase 1 (neondb database)
# Spring Boot uses jdbc:postgresql:// instead of postgresql://
MEDICATIONS_DATABASE_URL="jdbc:postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
MEDICATIONS_PORT=3005
```

> **Note**: Use your existing `neondb` connection string from Phase 1, but prefix it with `jdbc:` for Spring Boot. The `medications` schema will be created automatically when you run the SQL scripts.

---

## 🚀 Step 4: Initialize Database Schema

Run the SQL scripts to create the `medications` schema and seed data:

1. **Navigate to Neon SQL Editor**:
   - Select your `neondb` database (the same one from Phase 1)
   - Open the SQL Editor

2. **Run the schema script**:
   - Copy contents of `app/medications/sql/001_create_tables.sql`
   - Paste into SQL Editor
   - Click **Run**
   - This creates the `medications` schema with tables

3. **Run the seed data script**:
   - Copy contents of `app/medications/sql/002_seed_data.sql`
   - Paste into SQL Editor
   - Click **Run**

4. **Verify data**:
   ```sql
   SELECT COUNT(*) FROM medications.prescriptions;
   ```

---

## 🚀 Step 5: Install Dependencies

Navigate to the medications service directory and build:

```bash
cd app/medications
mvn clean install
```

This will:
- Download all Maven dependencies
- Compile Java sources
- Run tests (if any)
- Package the application

---

## 🚀 Step 6: Start the Medications Service

You have two options for running Phase 5:

### Option 1: Run Just the Medications Service (Standalone Testing)

From the **project root**:

```bash
npm run medications:dev
```

Or from the medications directory:

```bash
cd app/medications
mvn spring-boot:run
```

### Option 2: Run All Phase 5 Services Together

```bash
npm run phase5:dev
```

**This starts:**
- ✅ Action Handler (port 3001)
- ✅ Providers Subgraph (port 3002)
- ✅ Gateway (port 4000) - connects to Hasura + Providers + Appointments
- ✅ Appointments Service (port 3004)
- ✅ Medications Service (port 3005) - running standalone (Spring Boot)
- ✅ Client (port 5173)

> **Note**: At this phase, medications runs standalone. Phase 6 adds it to federation.

You should see:

```
💊 Medications Service
✓ Medications service running
  GraphQL endpoint: http://localhost:3005/graphql
  GraphiQL UI: http://localhost:3005/graphiql
```

---

## 🧪 Step 7: Test Your API

### Open GraphiQL UI

Navigate to: http://localhost:3005/graphiql

Spring Boot provides a built-in GraphQL playground!

### Test Query 1: Get All Prescriptions

```graphql
query GetAllPrescriptions {
  prescriptions {
    id
    memberId
    providerId
    medicationName
    dosage
    frequency
    status
    pharmacy
    refillsRemaining
    createdAt
  }
}
```

### Test Query 2: Get Prescriptions by Member

```graphql
query GetMemberPrescriptions {
  prescriptionsByMember(memberId: "550e8400-e29b-41d4-a716-446655440000") {
    id
    medicationName
    dosage
    frequency
    status
    startDate
    endDate
  }
}
```

### Test Mutation 1: Create Prescription

```graphql
mutation CreatePrescription {
  createPrescription(input: {
    memberId: "550e8400-e29b-41d4-a716-446655440000"
    providerId: "bc6630ae-d320-4693-906a-9ab0c7f7eb51"
    medicationName: "Metoprolol"
    dosage: "50mg"
    frequency: "Twice daily"
    startDate: "2025-11-01"
    pharmacy: "CVS Pharmacy"
    notes: "Take with food"
  }) {
    id
    medicationName
    status
    refillsRemaining
  }
}
```

### Test Mutation 2: Refill Prescription

```graphql
mutation RefillPrescription {
  refillPrescription(input: {
    prescriptionId: "11111111-1111-4111-8111-111111111111"
    additionalRefills: 3
  }) {
    id
    medicationName
    refillsRemaining
  }
}
```

### Test Mutation 3: Cancel Prescription

```graphql
mutation CancelPrescription {
  cancelPrescription(id: "11111111-1111-4111-8111-111111111111") {
    id
    medicationName
    status
  }
}
```

---

## 🔍 Code Deep Dive

### 1. GraphQL Schema (`schema.graphqls`)

Spring Boot uses **schema-first** development:

```graphql
type Prescription {
    id: ID!
    memberId: ID!
    medicationName: String!
    dosage: String!
    status: PrescriptionStatus!
}

enum PrescriptionStatus {
    ACTIVE
    EXPIRED
    CANCELLED
    COMPLETED
}

type Query {
    prescriptions: [Prescription!]!
    prescription(id: ID!): Prescription
}
```

**Key concepts**:
- Separate `.graphqls` file (not embedded in code)
- Spring Boot automatically loads from `resources/graphql/`
- Schema and code are decoupled

### 2. JPA Entities (`Prescription.java`)

Java classes with JPA annotations:

```java
@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrescriptionStatus status;

    // Getters and setters...
}
```

**Key concepts**:
- `@Entity` - Marks class as JPA entity
- `@Table` - Maps to database table
- `@Column` - Maps to database column
- Type-safe Java classes

### 3. Spring Data Repositories

Interface-based data access:

```java
@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    List<Prescription> findByMemberId(UUID memberId);

    List<Prescription> findByProviderId(UUID providerId);
}
```

**Key concepts**:
- Extend `JpaRepository<Entity, ID>`
- Spring auto-implements methods
- Method names define queries (`findByMemberId` → `WHERE member_id = ?`)
- No SQL needed for basic operations

### 4. GraphQL Resolvers (`QueryResolver.java`)

Annotated methods handle GraphQL operations:

```java
@Controller
public class QueryResolver {

    private final PrescriptionRepository prescriptionRepository;

    @QueryMapping
    public List<Prescription> prescriptions() {
        return prescriptionRepository.findAll();
    }

    @QueryMapping
    public Prescription prescription(@Argument String id) {
        UUID uuid = UUID.fromString(id);
        return prescriptionRepository.findById(uuid).orElse(null);
    }
}
```

**Key concepts**:
- `@Controller` - Spring component for GraphQL
- `@QueryMapping` - Maps to GraphQL query
- `@Argument` - Maps GraphQL argument to parameter
- Method name matches schema field name

### 5. Mutation Resolvers (`MutationResolver.java`)

```java
@Controller
public class MutationResolver {

    @MutationMapping
    public Prescription createPrescription(@Argument Map<String, Object> input) {
        Prescription prescription = new Prescription();
        prescription.setMemberId(UUID.fromString((String) input.get("memberId")));
        prescription.setStatus(PrescriptionStatus.ACTIVE);
        return prescriptionRepository.save(prescription);
    }
}
```

**Key concepts**:
- `@MutationMapping` - Maps to GraphQL mutation
- Input as `Map<String, Object>` or custom Input class
- Spring Data automatically handles database operations

### 6. Application Configuration (`application.yml`)

```yaml
server:
  port: 3005

spring:
  datasource:
    url: ${MEDICATIONS_DATABASE_URL}
    username: ${MEDICATIONS_DB_USER}

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true

  graphql:
    graphiql:
      enabled: true
```

**Key concepts**:
- YAML-based configuration
- Environment variable injection with `${...}`
- `graphiql.enabled` - Enables GraphQL playground
- `ddl-auto: validate` - Validates schema against database

---

## 🎓 Key Takeaways

### What You Built Manually (Spring Boot):
1. ✅ GraphQL schema in separate `.graphqls` file
2. ✅ JPA entities with database mappings
3. ✅ Spring Data repositories for data access
4. ✅ GraphQL resolvers with annotations
5. ✅ Application configuration in YAML
6. ✅ Dependency management with Maven

### Compared to Apollo Server (Phase 3):
- **Apollo**: Code-first, schema in TypeScript with `gql` tag
- **Spring Boot**: Schema-first, separate `.graphqls` file
- **Apollo**: Manual SQL with node-postgres
- **Spring Boot**: ORM with Spring Data JPA
- **Apollo**: JavaScript/TypeScript
- **Spring Boot**: Java with strong typing

### Compared to Hasura (Phase 1):
- **Hasura**: Database-first, auto-generated
- **Spring Boot**: Schema-first, manually written
- **Hasura**: Instant CRUD, no code
- **Spring Boot**: Manual resolver implementation
- **Hasura**: Limited custom logic
- **Spring Boot**: Full control over business logic

### When to Use Each Approach:

**Use Hasura when**:
- Rapid prototyping
- Standard CRUD operations
- Database-driven applications
- Small to medium teams

**Use Apollo Server when**:
- Node.js ecosystem
- Code-first approach preferred
- Flexible, dynamic schemas
- JavaScript/TypeScript teams

**Use Spring Boot when**:
- Enterprise Java applications
- Strong typing required
- Complex business logic
- Large teams with Java expertise
- Banking, healthcare, finance industries

---

## 🐛 Troubleshooting

### "Failed to connect to database"
- ✅ Check `MEDICATIONS_DATABASE_URL` in `.env`
- ✅ Verify database name is `medications`
- ✅ Ensure SSL mode is enabled (`?sslmode=require`)

### "Table 'prescriptions' doesn't exist"
- ✅ Run `001_create_tables.sql` in Neon SQL Editor
- ✅ Select correct database (`medications`) before running

### "Port 3005 is already in use"
- ✅ Change `MEDICATIONS_PORT` in `.env`
- ✅ Update application.yml with new port

### "Maven dependencies won't download"
- ✅ Check internet connection
- ✅ Run `mvn clean install -U` to force update
- ✅ Check Maven settings.xml for proxy configuration

### "Java version error"
- ✅ Ensure Java 17+ is installed
- ✅ Check `JAVA_HOME` environment variable
- ✅ Run `java --version` to verify

---

## ✅ Success Criteria

You've successfully completed Phase 5 when:

- [ ] Medications service starts without errors
- [ ] Can query all prescriptions
- [ ] Can create new prescriptions
- [ ] Can refill prescriptions
- [ ] Can cancel prescriptions
- [ ] Understand schema-first development
- [ ] Understand Spring Data JPA basics
- [ ] Comfortable with Java annotations for GraphQL

---

## 🎉 Next Steps

**Continue to Phase 6**: [Add Spring Boot to Federation](../phase-6-add-spring-boot-to-federation/README.md)

In Phase 6, you'll:
- Enable Apollo Federation on this Spring Boot service
- Connect it to your existing gateway
- Query across all four services (Hasura + Providers + Appointments + Medications)
- See polyglot microservices in action (Node.js + Java)

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring for GraphQL](https://spring.io/projects/spring-graphql)
- [Spring Data JPA Documentation](https://spring.io/projects/spring-data-jpa)
- [GraphQL Java](https://www.graphql-java.com/)
- [Maven Getting Started](https://maven.apache.org/guides/getting-started/)

# Phase 6: Add Spring Boot to Federation

## 🎯 Learning Objectives

In this phase, you'll learn:
- Enabling Apollo Federation on Spring Boot GraphQL services
- Federation directives in `.graphqls` files (`@key`, `@extends`)
- Entity resolution in Java with Spring GraphQL
- Cross-JVM federation (Node.js + Java microservices)
- Polyglot GraphQL architecture patterns
- Querying across 4 subgraphs through unified gateway

## 📚 What You'll Build

Transform your standalone Medications service (Phase 5) into a **federated subgraph** that integrates with:
- **Hasura subgraph**: Members, Claims, Providers (Go-based)
- **Providers subgraph**: Provider ratings and reviews (Node.js)
- **Appointments subgraph**: Appointments and billing (Node.js)
- **Medications subgraph**: Prescriptions and medications (Java/Spring Boot)

After this phase, you'll query prescriptions alongside members and providers from a **single unified endpoint** - demonstrating true polyglot microservices!

---

## 🔄 Architecture: Before vs After

### Before (Phase 5):
```
Client → http://localhost:3005/graphql (Medications only - Spring Boot)
Client → http://localhost:3004/graphql (Appointments only - Node.js)
Client → http://localhost:3002/graphql (Providers only - Node.js)
Client → http://localhost:8080/v1/graphql (Hasura only - Go)
```

### After (Phase 6):
```
Client → http://localhost:4000/graphql → Gateway → {
  - Hasura (port 8080, Go)
  - Providers (port 3002, Node.js)
  - Appointments (port 3004, Node.js)
  - Medications (port 3005, Java)
}
```

**One endpoint. Four services. Three languages. Unified schema.**

---

## 📋 Prerequisites

- ✅ Completed Phase 5 (Spring Boot GraphQL from Scratch)
- ✅ Medications service running on port 3005
- ✅ Hasura running on port 8080 with federation enabled
- ✅ Providers subgraph running on port 3002
- ✅ Appointments subgraph running on port 3004
- ✅ Java 17+ and Maven 3.6+

---

## 🚀 Step 1: Verify Federation Dependency

The federation dependency has already been added to `pom.xml`:

```xml
<dependency>
    <groupId>com.apollographql.federation</groupId>
    <artifactId>federation-graphql-java-support</artifactId>
    <version>4.3.0</version>
</dependency>
```

---

## 🚀 Step 2: Review Updated Schema

The schema has been updated with federation directives in `schema.graphqls`:

```graphql
# Prescription is an entity that can be referenced
type Prescription @key(fields: "id") {
    id: ID!
    memberId: ID!
    providerId: ID!
    medicationName: String!
    # ... other fields
    member: Member        # Cross-subgraph relationship
    provider: Provider    # Cross-subgraph relationship
}

# Reference external Member entity from Hasura
type Member @key(fields: "id", resolvable: false) @extends {
    id: ID! @external
}

# Reference external Provider entity from Hasura
type Provider @key(fields: "id", resolvable: false) @extends {
    id: ID! @external
}
```

**Federation Directives Explained:**

- `@key(fields: "id")` - Makes Prescription an "entity" that can be referenced by other subgraphs
- `@extends` - Indicates this type exists in another subgraph
- `@external` - Marks fields that belong to another subgraph
- `resolvable: false` - This subgraph doesn't resolve Member/Provider, just references them

---

## 🚀 Step 3: Review Entity Resolver

The `EntityResolver.java` has been created to handle federation:

```java
@Controller
public class EntityResolver {

    @SchemaMapping(typeName = "Prescription", field = "member")
    public Map<String, Object> member(Prescription prescription) {
        Map<String, Object> memberReference = new HashMap<>();
        memberReference.put("__typename", "Member");
        memberReference.put("id", prescription.getMemberId().toString());
        return memberReference;  // Gateway will resolve the rest
    }

    @SchemaMapping(typeName = "Prescription", field = "provider")
    public Map<String, Object> provider(Prescription prescription) {
        Map<String, Object> providerReference = new HashMap<>();
        providerReference.put("__typename", "Provider");
        providerReference.put("id", prescription.getProviderId().toString());
        return providerReference;  // Gateway will resolve the rest
    }
}
```

**Key Concepts:**
- `@SchemaMapping` - Maps resolver to GraphQL type and field
- Returns `Map` with `__typename` and `id` - creates entity reference
- Gateway automatically fetches related data from appropriate subgraphs

---

## 🚀 Step 4: Review Federation Configuration

The `FederationConfig.java` enables federation support:

```java
@Configuration
public class FederationConfig {

    @Bean
    public GraphQLSchema federatedSchema() throws IOException {
        String schemaString = new ClassPathResource("graphql/schema.graphqls")
                .getContentAsString(StandardCharsets.UTF_8);

        TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(schemaString);
        RuntimeWiring runtimeWiring = RuntimeWiring.newRuntimeWiring().build();

        return Federation.transform(typeRegistry, runtimeWiring)
                .fetchEntities(env -> null)
                .resolveEntityType(env -> null)
                .build();
    }
}
```

**What this does:**
- Loads the schema from `.graphqls` file
- Transforms it with Apollo Federation support
- Adds `_service` and `_entities` resolvers automatically

---

## 🚀 Step 5: Update Environment Variables

The gateway has been updated to include medications. Add to your `.env`:

```bash
# Already exists from Phase 5
MEDICATIONS_DATABASE_URL="postgresql://..."
MEDICATIONS_PORT=3005

# NEW - for gateway to find medications service
MEDICATIONS_URL="http://localhost:3005/graphql"
```

---

## 🚀 Step 6: Start All Services

You need to start FOUR services for full federation:

### Terminal 1: Hasura (from Phase 1)
```bash
# Already running from Phase 1
# Check: http://localhost:8080/console
```

### Terminal 2: Providers Subgraph (from Phase 2)
```bash
npm run subgraph:dev
```

### Terminal 3: Appointments Subgraph (Phase 3)
```bash
npm run appointments:dev
```

### Terminal 4: Medications Subgraph (Phase 5)
```bash
npm run medications:dev
```

### Terminal 5: Federation Gateway (Phase 2)
```bash
npm run gateway:dev
```

**Or use the combined command (recommended):**
```bash
npm run phase6:dev
```

**This starts:**
- ✅ Action Handler (port 3001)
- ✅ Providers Subgraph (port 3002)
- ✅ Gateway (port 4000) - connects to all 4 subgraphs!
- ✅ Appointments Service (port 3004) - Node.js
- ✅ Medications Service (port 3005) - Spring Boot Java
- ✅ Client (port 5173)

You should see:
```
🚀 Apollo Federation Gateway ready!
   📊 Unified subgraphs:
   - Hasura: http://localhost:8080/v1/graphql
   - Providers: http://localhost:3002/graphql
   - Appointments: http://localhost:3004/graphql
   - Medications: http://localhost:3005/graphql (Spring Boot Java)

   🎯 Query everything from ONE endpoint (port 4000)!
   💡 Polyglot microservices: Node.js + Java working together!
```

---

## 🧪 Step 7: Test Federated Queries

Navigate to: http://localhost:4000/graphql

### Test 1: Query Prescriptions with Member Details

```graphql
query PrescriptionsWithMembers {
  prescriptions {
    id
    medicationName
    dosage
    status
    # Cross-subgraph to Hasura (Go)
    member {
      first_name
      last_name
      date_of_birth
    }
  }
}
```

**What's happening:**
1. Gateway queries medications subgraph (Java) for prescriptions
2. Gateway sees `member` field needs Member data
3. Gateway queries Hasura (Go) for member details
4. Gateway combines results into unified response

**This spans Node.js gateway → Java medications → Go Hasura!**

### Test 2: Query Prescriptions with Provider and Ratings

```graphql
query PrescriptionsWithProviderDetails {
  prescriptions {
    id
    medicationName
    dosage
    # Cross-subgraph to Hasura (Go)
    provider {
      name
      specialty
      # Cross-subgraph to Providers (Node.js)
      rating
      reviewCount
      reviews {
        rating
        comment
      }
    }
  }
}
```

**This query spans FOUR subgraphs:**
1. Medications subgraph (Java) → prescription data
2. Hasura subgraph (Go) → provider name/specialty
3. Providers subgraph (Node.js) → ratings and reviews
4. Gateway (Node.js) → orchestration

### Test 3: Cross-Service Query (All 4 Subgraphs)

```graphql
query ComprehensiveHealthData {
  member_records(limit: 1) {
    first_name
    last_name

    # From Hasura
    claims {
      claim_number
      status

      # From Appointments subgraph (Node.js)
      billing_records {
        amount_billed
        amount_paid
      }
    }

    # From Appointments subgraph (Node.js)
    appointments {
      appointment_date
      status

      # Back to Hasura, then to Providers (Node.js)
      provider {
        name
        rating
      }
    }
  }

  # From Medications subgraph (Java)
  prescriptions {
    medicationName
    dosage

    # Back to Hasura
    member {
      first_name
    }
  }
}
```

**This demonstrates the full power of federation across 4 services in 3 languages!**

---

## 🔍 Understanding Federation Across Languages

### How Cross-Language Entity Resolution Works

1. **Query starts at gateway (Node.js):**
   ```
   Client → Gateway (port 4000)
   ```

2. **Gateway builds execution plan:**
   ```
   medications (Java): Get prescriptions
   Hasura (Go): Get member details for member_ids
   ```

3. **Gateway makes requests in optimal order:**
   ```
   GET /graphql (Medications - Java) → prescription data
   GET /v1/graphql (Hasura - Go) → member data
   ```

4. **Gateway stitches results:**
   ```json
   {
     "prescriptions": [
       {
         "id": "...",
         "medicationName": "Lisinopril",
         "member": { "first_name": "John", "last_name": "Doe" }
       }
     ]
   }
   ```

### Language-Agnostic Federation

The magic of Apollo Federation is that it doesn't care what language each service uses:

| Service | Language | Framework | Communication |
|---------|----------|-----------|---------------|
| Gateway | Node.js | Apollo Gateway | HTTP/GraphQL |
| Hasura | Go | Hasura Engine | HTTP/GraphQL |
| Providers | Node.js | Apollo Server | HTTP/GraphQL |
| Appointments | Node.js | Apollo Server | HTTP/GraphQL |
| Medications | Java | Spring Boot | HTTP/GraphQL |

All services speak GraphQL, so they can federate seamlessly!

---

## 🎓 Key Takeaways

### What You Learned:

1. ✅ **Federation in Java**
   - `@key`, `@extends`, `@external` directives in `.graphqls`
   - Entity resolution with `@SchemaMapping`
   - Federation config with Spring Boot

2. ✅ **Polyglot Microservices**
   - Node.js, Java, and Go working together
   - Language-agnostic federation
   - Unified API across different stacks

3. ✅ **Cross-Service Queries**
   - Single query spans multiple services
   - Gateway handles orchestration automatically
   - No N+1 problem (gateway batches requests)

4. ✅ **Enterprise Patterns**
   - Different teams can own different services
   - Different languages for different use cases
   - Unified schema despite diverse implementations

### Spring Boot vs Apollo Server Federation:

| Aspect | Apollo Server (Phase 4) | Spring Boot (Phase 6) |
|--------|-------------------------|------------------------|
| **Directives** | In TypeScript with `gql` tag | In separate `.graphqls` file |
| **Entity Resolver** | `__resolveReference` function | `@SchemaMapping` annotation |
| **Config** | `buildSubgraphSchema()` | `Federation.transform()` |
| **Language** | JavaScript/TypeScript | Java |
| **Type System** | TypeScript interfaces | Java classes |

### When to Use Each:

**Use Spring Boot when:**
- Enterprise Java applications
- Banking, healthcare, finance
- Strong typing required
- Large Java teams
- Complex business logic
- JVM ecosystem

**Use Apollo Server when:**
- Node.js ecosystem
- JavaScript/TypeScript teams
- Rapid development
- Flexible, dynamic schemas
- Startup/modern web apps

**Use Both (Polyglot):**
- Large organizations with multiple teams
- Different services have different requirements
- Legacy Java systems + modern Node.js apps
- Want best tool for each job

---

## ✅ Success Criteria

You've successfully completed Phase 6 when:

- [ ] Medications service runs with federation enabled
- [ ] Gateway includes medications subgraph
- [ ] Can query prescriptions from gateway (port 4000)
- [ ] Can query prescriptions with member details (cross-language)
- [ ] Can query prescriptions with provider details (cross-language)
- [ ] Can query across all 4 subgraphs in one request
- [ ] Understand polyglot microservices architecture
- [ ] Understand language-agnostic federation

---

## 🎉 Next Steps

**Continue to Phase 7**: [Hasura DDN](../phase-7-hasura-ddn/README.md)

In Phase 7, you'll:
- Explore Hasura Data Delivery Network (DDN)
- Compare DDN to Hasura Cloud
- Learn about modern data delivery patterns

---

## 📚 Additional Resources

- [Apollo Federation Documentation](https://www.apollographql.com/docs/federation/)
- [GraphQL Java Federation](https://github.com/apollographql/federation-jvm)
- [Spring for GraphQL](https://spring.io/projects/spring-graphql)
- [Polyglot Microservices Patterns](https://microservices.io/patterns/index.html)

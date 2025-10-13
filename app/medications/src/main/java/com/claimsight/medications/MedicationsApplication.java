package com.claimsight.medications;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Medications Service - Spring Boot GraphQL Application
 *
 * A manually-built GraphQL API using Spring Boot to contrast with:
 * - Hasura (database-first, auto-generated)
 * - Apollo Server (code-first, Node.js)
 *
 * This service manages prescriptions and medication information.
 */
@SpringBootApplication
public class MedicationsApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicationsApplication.class, args);
        System.out.println("\n💊 Medications Service");
        System.out.println("✓ Medications service running");
        System.out.println("  GraphQL endpoint: http://localhost:3005/graphql");
        System.out.println("  GraphiQL UI: http://localhost:3005/graphiql\n");
    }
}

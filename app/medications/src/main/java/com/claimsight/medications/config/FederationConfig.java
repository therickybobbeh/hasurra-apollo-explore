package com.claimsight.medications.config;

import com.apollographql.federation.graphqljava.Federation;
import graphql.schema.GraphQLSchema;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.graphql.execution.GraphQlSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Federation Configuration for Medications Service
 *
 * This configures the service to work as an Apollo Federation subgraph,
 * enabling it to be composed with other subgraphs in a unified gateway.
 */
@Configuration
public class FederationConfig {

    /**
     * Build federated GraphQL schema
     */
    @Bean
    public GraphQLSchema federatedSchema() throws IOException {
        // Parse schema file
        String schemaString = new ClassPathResource("graphql/schema.graphqls")
                .getContentAsString(StandardCharsets.UTF_8);

        TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(schemaString);

        // Build runtime wiring (will be configured by Spring Boot)
        RuntimeWiring runtimeWiring = RuntimeWiring.newRuntimeWiring().build();

        // Generate federated schema
        return Federation.transform(typeRegistry, runtimeWiring)
                .fetchEntities(env -> null)  // Will be handled by entity resolver
                .resolveEntityType(env -> null)  // Will be handled by entity resolver
                .build();
    }
}

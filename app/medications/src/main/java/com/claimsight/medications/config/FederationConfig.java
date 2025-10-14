package com.claimsight.medications.config;

import com.apollographql.federation.graphqljava.Federation;
import com.apollographql.federation.graphqljava._Entity;
import graphql.Scalars;
import graphql.schema.DataFetcher;
import graphql.schema.GraphQLScalarType;
import graphql.schema.GraphQLSchema;
import graphql.schema.TypeResolver;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.graphql.data.method.annotation.support.AnnotatedControllerConfigurer;
import org.springframework.graphql.execution.GraphQlSource;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Federation Configuration for Medications Service
 *
 * This configures the service to work as an Apollo Federation subgraph.
 * The key challenge: integrate Apollo Federation's schema transformation
 * with Spring Boot's annotation-based resolvers (@QueryMapping, @SchemaMapping).
 */
@Configuration
public class FederationConfig {

    @Autowired
    private ApplicationContext applicationContext;

    /**
     * Override GraphQlSource to use Federation-enabled schema
     * This is the primary bean that Spring Boot GraphQL uses
     */
    @Bean
    public GraphQlSource graphQlSource(
            List<RuntimeWiringConfigurer> configurers,
            AnnotatedControllerConfigurer controllerConfigurer) throws IOException {

        // Load schema file
        String schemaString = new ClassPathResource("graphql/schema.graphqls")
                .getContentAsString(StandardCharsets.UTF_8);

        // Parse schema with federation directives
        TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(schemaString);

        // Build runtime wiring with Spring Boot's resolvers
        RuntimeWiring.Builder runtimeWiringBuilder = RuntimeWiring.newRuntimeWiring();

        // Apply all Spring Boot configurers (adds @QueryMapping, @SchemaMapping resolvers)
        for (RuntimeWiringConfigurer configurer : configurers) {
            configurer.configure(runtimeWiringBuilder);
        }

        // Add uuid scalar implementation (treat as String for federation compatibility)
        GraphQLScalarType uuidScalar = GraphQLScalarType.newScalar()
                .name("uuid")
                .description("UUID scalar type")
                .coercing(Scalars.GraphQLString.getCoercing())
                .build();

        runtimeWiringBuilder.scalar(uuidScalar);

        // Add entity resolver stubs (federation requirement)
        runtimeWiringBuilder.type("_Entity", builder ->
                builder.typeResolver(env -> null)
        );

        RuntimeWiring runtimeWiring = runtimeWiringBuilder.build();

        // Transform schema with Apollo Federation support
        // This adds _service, _entities fields required by the gateway
        GraphQLSchema federatedSchema = Federation.transform(typeRegistry, runtimeWiring)
                .fetchEntities(env -> {
                    // Entity resolver - returns entities by their keys
                    // For now, return empty list (no cross-service entity resolution needed)
                    return null;
                })
                .resolveEntityType(env -> {
                    // Type resolver - determines which type an entity is
                    return null;
                })
                .build();

        // Return GraphQlSource with federated schema
        return GraphQlSource.builder(federatedSchema).build();
    }
}

package com.claimsight.medications.resolver;

import com.claimsight.medications.entity.Prescription;
import com.claimsight.medications.entity.PrescriptionStatus;
import com.claimsight.medications.repository.PrescriptionRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

/**
 * GraphQL Query Resolver for Medications Service
 *
 * Handles all read operations for prescriptions
 */
@Controller
public class QueryResolver {

    private final PrescriptionRepository prescriptionRepository;

    public QueryResolver(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    /**
     * Get all prescriptions
     */
    @QueryMapping
    public List<Prescription> prescriptions() {
        return prescriptionRepository.findAll();
    }

    /**
     * Get a single prescription by ID
     */
    @QueryMapping
    public Prescription prescription(@Argument String id) {
        UUID uuid = UUID.fromString(id);
        return prescriptionRepository.findById(uuid).orElse(null);
    }

    /**
     * Get prescriptions for a specific member
     */
    @QueryMapping
    public List<Prescription> prescriptionsByMember(@Argument String memberId) {
        UUID uuid = UUID.fromString(memberId);
        return prescriptionRepository.findByMemberId(uuid);
    }

    /**
     * Get prescriptions from a specific provider
     */
    @QueryMapping
    public List<Prescription> prescriptionsByProvider(@Argument String providerId) {
        UUID uuid = UUID.fromString(providerId);
        return prescriptionRepository.findByProviderId(uuid);
    }

    /**
     * Get prescriptions by status
     */
    @QueryMapping
    public List<Prescription> prescriptionsByStatus(@Argument PrescriptionStatus status) {
        return prescriptionRepository.findByStatus(status);
    }
}

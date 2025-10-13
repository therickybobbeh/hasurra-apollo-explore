package com.claimsight.medications.repository;

import com.claimsight.medications.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for Prescription entities
 */
@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    /**
     * Find all prescriptions for a specific member
     */
    List<Prescription> findByMemberId(UUID memberId);

    /**
     * Find all prescriptions from a specific provider
     */
    List<Prescription> findByProviderId(UUID providerId);

    /**
     * Find prescriptions by status
     */
    List<Prescription> findByStatus(com.claimsight.medications.entity.PrescriptionStatus status);
}

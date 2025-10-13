package com.claimsight.medications.resolver;

import com.claimsight.medications.entity.Prescription;
import com.claimsight.medications.entity.PrescriptionStatus;
import com.claimsight.medications.repository.PrescriptionRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * GraphQL Mutation Resolver for Medications Service
 *
 * Handles all write operations for prescriptions
 */
@Controller
public class MutationResolver {

    private final PrescriptionRepository prescriptionRepository;

    public MutationResolver(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    /**
     * Create a new prescription
     */
    @MutationMapping
    public Prescription createPrescription(@Argument Map<String, Object> input) {
        Prescription prescription = new Prescription();
        prescription.setMemberId(UUID.fromString((String) input.get("memberId")));
        prescription.setProviderId(UUID.fromString((String) input.get("providerId")));
        prescription.setMedicationName((String) input.get("medicationName"));
        prescription.setDosage((String) input.get("dosage"));
        prescription.setFrequency((String) input.get("frequency"));
        prescription.setStartDate(LocalDate.parse((String) input.get("startDate")));

        if (input.get("endDate") != null) {
            prescription.setEndDate(LocalDate.parse((String) input.get("endDate")));
        }

        prescription.setPharmacy((String) input.get("pharmacy"));
        prescription.setRefillsRemaining(3); // Default 3 refills
        prescription.setStatus(PrescriptionStatus.ACTIVE);

        if (input.get("notes") != null) {
            prescription.setNotes((String) input.get("notes"));
        }

        return prescriptionRepository.save(prescription);
    }

    /**
     * Cancel a prescription
     */
    @MutationMapping
    public Prescription cancelPrescription(@Argument String id) {
        UUID uuid = UUID.fromString(id);
        Prescription prescription = prescriptionRepository.findById(uuid)
                .orElseThrow(() -> new RuntimeException("Prescription with ID " + id + " not found"));

        prescription.setStatus(PrescriptionStatus.CANCELLED);
        return prescriptionRepository.save(prescription);
    }

    /**
     * Add refills to a prescription
     */
    @MutationMapping
    public Prescription refillPrescription(@Argument Map<String, Object> input) {
        UUID prescriptionId = UUID.fromString((String) input.get("prescriptionId"));
        Integer additionalRefills = (Integer) input.get("additionalRefills");

        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription with ID " + prescriptionId + " not found"));

        prescription.setRefillsRemaining(prescription.getRefillsRemaining() + additionalRefills);
        return prescriptionRepository.save(prescription);
    }

    /**
     * Mark prescription as completed
     */
    @MutationMapping
    public Prescription completePrescription(@Argument String id) {
        UUID uuid = UUID.fromString(id);
        Prescription prescription = prescriptionRepository.findById(uuid)
                .orElseThrow(() -> new RuntimeException("Prescription with ID " + id + " not found"));

        prescription.setStatus(PrescriptionStatus.COMPLETED);
        prescription.setRefillsRemaining(0);
        return prescriptionRepository.save(prescription);
    }
}

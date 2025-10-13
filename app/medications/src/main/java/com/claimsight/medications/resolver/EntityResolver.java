package com.claimsight.medications.resolver;

import com.claimsight.medications.entity.Prescription;
import com.claimsight.medications.repository.PrescriptionRepository;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Entity Resolver for Apollo Federation
 *
 * Handles entity resolution and cross-subgraph relationships
 */
@Controller
public class EntityResolver {

    private final PrescriptionRepository prescriptionRepository;

    public EntityResolver(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    /**
     * Resolve Prescription entity by ID (for federation)
     * Called when another subgraph needs to resolve a Prescription reference
     */
    public Prescription resolveReferenceForPrescription(Map<String, Object> reference) {
        String id = (String) reference.get("id");
        UUID uuid = UUID.fromString(id);
        return prescriptionRepository.findById(uuid).orElse(null);
    }

    /**
     * Resolve Member relationship
     * Returns a reference to the Member entity for the gateway to resolve
     */
    @SchemaMapping(typeName = "Prescription", field = "member")
    public Map<String, Object> member(Prescription prescription) {
        Map<String, Object> memberReference = new HashMap<>();
        memberReference.put("__typename", "Member");
        memberReference.put("id", prescription.getMemberId().toString());
        return memberReference;
    }

    /**
     * Resolve Provider relationship
     * Returns a reference to the Provider entity for the gateway to resolve
     */
    @SchemaMapping(typeName = "Prescription", field = "provider")
    public Map<String, Object> provider(Prescription prescription) {
        Map<String, Object> providerReference = new HashMap<>();
        providerReference.put("__typename", "Provider");
        providerReference.put("id", prescription.getProviderId().toString());
        return providerReference;
    }
}

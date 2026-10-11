package com.loopsaathi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pickups")
public class Pickup {
    @Id public String id;
    @Column(nullable = false, length = 255) public String wasteType;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public Types.Stream stream;
    // Weights are stored to 3 decimal places; DTO validation rejects finer values so 0.0001 cannot round to 0.
    @Column(nullable = false, precision = 8, scale = 3) public BigDecimal estimatedWeightKg;
    @Column(precision = 8, scale = 3) public BigDecimal confirmedWeightKg;
    @Column(nullable = false, length = 255) public String locality;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public Types.Slot preferredSlot;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public Types.Status status;
    @Column(length = 255) public String collectorId;
    @Column(length = 255) public String destinationId;
    @Column(nullable = false) public boolean isDemo;
    @Column(nullable = false) public Instant createdAt;
    @Column(nullable = false) public Instant updatedAt;
}

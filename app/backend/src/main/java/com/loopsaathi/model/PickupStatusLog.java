package com.loopsaathi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "pickup_status_log")
public class PickupStatusLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false) public String pickupId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public Types.Status status;
    @Column(name = "at", nullable = false) public Instant at;

    protected PickupStatusLog() {}

    public PickupStatusLog(String pickupId, Types.Status status, Instant at) {
        this.pickupId = pickupId;
        this.status = status;
        this.at = at;
    }
}

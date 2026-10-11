package com.loopsaathi.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "partners")
public class Partner {
    @Id public String id;
    @Column(nullable = false, length = 255) public String name;
    @ElementCollection
    @CollectionTable(name = "partner_accepted_streams", joinColumns = @JoinColumn(name = "partner_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "stream", nullable = false)
    public Set<Types.Stream> acceptedStreams = new HashSet<>();
    @Enumerated(EnumType.STRING) @Column(nullable = false) public Types.DestinationType destinationType;
    @Column(nullable = false) public String verificationStatus = "UNVERIFIED";
    @Column(nullable = false) public boolean isDemo;
}

package com.loopsaathi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "waste_rules")
public class WasteRule {
    @Id public String id;
    @Column(nullable = false, length = 255) public String itemName;
    @Column(nullable = false, length = 600) public String keywords;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public Types.Stream stream;
    @Column(nullable = false) public String instruction;
    @Column(nullable = false) public boolean specialRoute;
}

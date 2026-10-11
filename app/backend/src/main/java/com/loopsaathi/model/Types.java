package com.loopsaathi.model;

public final class Types {
    private Types() {}

    public enum Stream { WET, DRY, SANITARY, SPECIAL_CARE, E_WASTE }
    public enum Slot { MORNING, AFTERNOON, EVENING }
    public enum Status { REQUESTED, ACCEPTED, COLLECTED, DELIVERED }
    public enum DestinationType { COMPOSTING, BIOGAS, RECYCLER, E_WASTE }
}

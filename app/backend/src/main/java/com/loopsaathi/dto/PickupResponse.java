package com.loopsaathi.dto;

import com.loopsaathi.model.Pickup;
import com.loopsaathi.model.PickupStatusLog;
import com.loopsaathi.model.Types;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PickupResponse(String id, String wasteType, Types.Stream stream,
                             BigDecimal estimatedWeightKg, BigDecimal confirmedWeightKg,
                             String locality, Types.Slot preferredSlot, Types.Status status,
                             String collectorId, String destinationId, boolean isDemo,
                             Instant createdAt, Instant updatedAt, List<StatusEvent> statusLog) {
    public record StatusEvent(Types.Status status, Instant at) {}

    public static PickupResponse from(Pickup pickup, List<PickupStatusLog> log) {
        return new PickupResponse(pickup.id, pickup.wasteType, pickup.stream,
                pickup.estimatedWeightKg, pickup.confirmedWeightKg, pickup.locality,
                pickup.preferredSlot, pickup.status, pickup.collectorId, pickup.destinationId,
                pickup.isDemo, pickup.createdAt, pickup.updatedAt,
                log.stream().map(entry -> new StatusEvent(entry.status, entry.at)).toList());
    }
}

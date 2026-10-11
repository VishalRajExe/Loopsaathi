package com.loopsaathi.dto;

import com.loopsaathi.model.Types;
import java.math.BigDecimal;
import java.util.Map;

public record ImpactResponse(long totalRequests, Map<Types.Status, Long> byStatus,
                             BigDecimal requestedKgEstimated, BigDecimal collectedKgConfirmed,
                             Map<Types.DestinationType, BigDecimal> deliveredKgByType,
                             long eWastePickups, double completionRate, boolean containsDemoData) {}

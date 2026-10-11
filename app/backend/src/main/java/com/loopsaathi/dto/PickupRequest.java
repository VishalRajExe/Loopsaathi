package com.loopsaathi.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.loopsaathi.model.Types;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PickupRequest(
        @NotBlank @Size(max = 255) String wasteType,
        @NotNull Types.Stream stream,
        @JsonDeserialize(using = StrictWeightDeserializer.class)
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("100")
        @Digits(integer = 3, fraction = 3, message = "must have at most 3 decimal places")
        BigDecimal estimatedWeightKg,
        @NotBlank @Size(max = 255) String locality,
        @NotNull Types.Slot preferredSlot) {}

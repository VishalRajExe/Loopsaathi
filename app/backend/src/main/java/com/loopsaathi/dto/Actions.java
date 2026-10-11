package com.loopsaathi.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class Actions {
    private Actions() {}
    public record Accept(@NotBlank @Size(max = 255) String collectorId) {}
    public record Collect(@JsonDeserialize(using = StrictWeightDeserializer.class)
                          @NotNull @DecimalMin(value = "0", inclusive = false)
                          @DecimalMax("100")
                          @Digits(integer = 3, fraction = 3, message = "must have at most 3 decimal places")
                          BigDecimal confirmedWeightKg) {}
    public record Deliver(@NotBlank @Size(max = 255) String destinationId) {}
}

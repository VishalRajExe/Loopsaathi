package com.loopsaathi.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.loopsaathi.controller.PickupController;
import com.loopsaathi.dto.Actions;
import com.loopsaathi.exception.ApiErrors;
import com.loopsaathi.exception.ConflictException;
import com.loopsaathi.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class ApiValidationTest {
    private final PickupService service = mock(PickupService.class);
    private MockMvc mvc;

    @BeforeEach void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mvc = MockMvcBuilders.standaloneSetup(new PickupController(service))
                .setControllerAdvice(new ApiErrors()).setValidator(validator).build();
    }

    @Test void badWeightAndUnknownStreamReturnStructured400() throws Exception {
        for (String weight : new String[] {"0", "-1", "100.1"}) {
            mvc.perform(post("/api/pickups").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"wasteType\":\"paper\",\"stream\":\"DRY\",\"estimatedWeightKg\":"
                            + weight + ",\"locality\":\"Hostel A\",\"preferredSlot\":\"MORNING\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").isNotEmpty());
        }
        mvc.perform(post("/api/pickups").contentType(MediaType.APPLICATION_JSON)
                .content("{\"wasteType\":\"paper\",\"stream\":\"UNKNOWN\",\"estimatedWeightKg\":1," +
                        "\"locality\":\"Hostel A\",\"preferredSlot\":\"MORNING\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
        mvc.perform(patch("/api/pickups/PICKUP-ABC123/collect").contentType(MediaType.APPLICATION_JSON)
                .content("{\"confirmedWeightKg\":101}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
    }

    @Test void missingPickupAndInvalidTransitionReturn404And409() throws Exception {
        when(service.accept(eq("MISSING"), any(Actions.Accept.class)))
                .thenThrow(new NotFoundException("Pickup not found: MISSING"));
        when(service.accept(eq("PICKUP-ABC123"), any(Actions.Accept.class)))
                .thenThrow(new ConflictException("Pickup must be REQUESTED"));
        mvc.perform(patch("/api/pickups/MISSING/accept").contentType(MediaType.APPLICATION_JSON)
                .content("{\"collectorId\":\"C-1\"}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error").value("Pickup not found: MISSING"));
        mvc.perform(patch("/api/pickups/PICKUP-ABC123/accept").contentType(MediaType.APPLICATION_JSON)
                .content("{\"collectorId\":\"C-1\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("Pickup must be REQUESTED"));
    }

    @Test void rejectsStringWeightsAndValuesThatWouldRoundToZero() throws Exception {
        for (String weight : new String[] {"\"1\"", "\"NaN\"", "0.0001", "1.2345", "1e-100"}) {
            mvc.perform(post("/api/pickups").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"wasteType\":\"paper\",\"stream\":\"DRY\",\"estimatedWeightKg\":"
                            + weight + ",\"locality\":\"Hostel A\",\"preferredSlot\":\"MORNING\"}"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
        }
        mvc.perform(patch("/api/pickups/PICKUP-ABC123/collect").contentType(MediaType.APPLICATION_JSON)
                .content("{\"confirmedWeightKg\":\"0.5\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Weight must be a JSON number"));
        mvc.perform(patch("/api/pickups/PICKUP-ABC123/collect").contentType(MediaType.APPLICATION_JSON)
                .content("{\"confirmedWeightKg\":0.0001}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
        mvc.perform(post("/api/pickups").contentType(MediaType.APPLICATION_JSON)
                .content("{\"wasteType\":\"paper\",\"stream\":\"DRY\",\"estimatedWeightKg\":0.001,"
                        + "\"locality\":\"Hostel A\",\"preferredSlot\":\"MORNING\"}"))
                .andExpect(status().isCreated());
    }

    @Test void rejectsStringsLongerThanMappedColumns() throws Exception {
        String longValue = "x".repeat(256);
        mvc.perform(post("/api/pickups").contentType(MediaType.APPLICATION_JSON)
                .content("{\"wasteType\":\"" + longValue + "\",\"stream\":\"DRY\",\"estimatedWeightKg\":1,"
                        + "\"locality\":\"Hostel A\",\"preferredSlot\":\"MORNING\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
        mvc.perform(post("/api/pickups").contentType(MediaType.APPLICATION_JSON)
                .content("{\"wasteType\":\"paper\",\"stream\":\"DRY\",\"estimatedWeightKg\":1,"
                        + "\"locality\":\"" + longValue + "\",\"preferredSlot\":\"MORNING\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
        mvc.perform(patch("/api/pickups/PICKUP-ABC123/accept").contentType(MediaType.APPLICATION_JSON)
                .content("{\"collectorId\":\"" + longValue + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/pickups/PICKUP-ABC123/deliver").contentType(MediaType.APPLICATION_JSON)
                .content("{\"destinationId\":\"" + longValue + "\"}"))
                .andExpect(status().isBadRequest());
    }
}

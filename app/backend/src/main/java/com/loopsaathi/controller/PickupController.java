package com.loopsaathi.controller;

import com.loopsaathi.dto.Actions;
import com.loopsaathi.dto.ImpactResponse;
import com.loopsaathi.dto.PartnerResponse;
import com.loopsaathi.dto.PickupRequest;
import com.loopsaathi.dto.PickupResponse;
import com.loopsaathi.model.Types;
import com.loopsaathi.service.PickupService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PickupController {
    private final PickupService service;

    public PickupController(PickupService service) { this.service = service; }

    @GetMapping("/pickups")
    public List<PickupResponse> list(@RequestParam(required = false) Types.Status status,
                                     @RequestParam(required = false) Types.Stream stream) {
        return service.list(status, stream);
    }

    @PostMapping("/pickups")
    @ResponseStatus(HttpStatus.CREATED)
    public PickupResponse create(@Valid @RequestBody PickupRequest request) { return service.create(request); }

    @PatchMapping("/pickups/{id}/accept")
    public PickupResponse accept(@PathVariable String id, @Valid @RequestBody Actions.Accept action) {
        return service.accept(id, action);
    }

    @PatchMapping("/pickups/{id}/collect")
    public PickupResponse collect(@PathVariable String id, @Valid @RequestBody Actions.Collect action) {
        return service.collect(id, action);
    }

    @PatchMapping("/pickups/{id}/deliver")
    public PickupResponse deliver(@PathVariable String id, @Valid @RequestBody Actions.Deliver action) {
        return service.deliver(id, action);
    }

    @GetMapping("/partners")
    public List<PartnerResponse> partners(@RequestParam(required = false) Types.Stream stream) {
        return service.partners(stream);
    }

    @GetMapping("/impact")
    public ImpactResponse impact() { return service.impact(); }
}

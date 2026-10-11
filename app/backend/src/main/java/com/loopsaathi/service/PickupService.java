package com.loopsaathi.service;

import com.loopsaathi.dto.Actions;
import com.loopsaathi.dto.ImpactResponse;
import com.loopsaathi.dto.PartnerResponse;
import com.loopsaathi.dto.PickupRequest;
import com.loopsaathi.dto.PickupResponse;
import com.loopsaathi.exception.ConflictException;
import com.loopsaathi.exception.NotFoundException;
import com.loopsaathi.model.Partner;
import com.loopsaathi.model.Pickup;
import com.loopsaathi.model.PickupStatusLog;
import com.loopsaathi.model.Types;
import com.loopsaathi.repository.PartnerRepository;
import com.loopsaathi.repository.PickupRepository;
import com.loopsaathi.repository.PickupStatusLogRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PickupService {
    private static final String ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();
    private final PickupRepository pickups;
    private final PickupStatusLogRepository logs;
    private final PartnerRepository partners;

    public PickupService(PickupRepository pickups, PickupStatusLogRepository logs,
                         PartnerRepository partners) {
        this.pickups = pickups;
        this.logs = logs;
        this.partners = partners;
    }

    @Transactional(readOnly = true)
    public List<PickupResponse> list(Types.Status status, Types.Stream stream) {
        return pickups.findAll().stream()
                .filter(p -> status == null || p.status == status)
                .filter(p -> stream == null || p.stream == stream)
                .sorted(Comparator.comparing((Pickup p) -> p.createdAt).reversed())
                .map(this::response).toList();
    }

    @Transactional
    public PickupResponse create(PickupRequest request) {
        Pickup pickup = new Pickup();
        pickup.id = newId();
        pickup.wasteType = request.wasteType().trim();
        pickup.stream = request.stream();
        pickup.estimatedWeightKg = request.estimatedWeightKg();
        pickup.locality = request.locality().trim();
        pickup.preferredSlot = request.preferredSlot();
        pickup.status = Types.Status.REQUESTED;
        pickup.createdAt = Instant.now();
        pickup.updatedAt = pickup.createdAt;
        pickups.save(pickup);
        logs.save(new PickupStatusLog(pickup.id, pickup.status, pickup.createdAt));
        return response(pickup);
    }

    @Transactional
    public PickupResponse accept(String id, Actions.Accept action) {
        Pickup pickup = expect(id, Types.Status.REQUESTED);
        pickup.collectorId = action.collectorId().trim();
        return advance(pickup, Types.Status.ACCEPTED);
    }

    @Transactional
    public PickupResponse collect(String id, Actions.Collect action) {
        Pickup pickup = expect(id, Types.Status.ACCEPTED);
        pickup.confirmedWeightKg = action.confirmedWeightKg();
        return advance(pickup, Types.Status.COLLECTED);
    }

    @Transactional
    public PickupResponse deliver(String id, Actions.Deliver action) {
        Pickup pickup = expect(id, Types.Status.COLLECTED);
        Partner partner = partners.findById(action.destinationId().trim())
                .orElseThrow(() -> new NotFoundException("Destination not found: " + action.destinationId()));
        if (!partner.acceptedStreams.contains(pickup.stream)) {
            throw new IllegalArgumentException("Destination does not accept " + pickup.stream + " waste");
        }
        pickup.destinationId = partner.id;
        return advance(pickup, Types.Status.DELIVERED);
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> partners(Types.Stream stream) {
        return partners.findAll().stream()
                .filter(p -> stream == null || p.acceptedStreams.contains(stream))
                .sorted(Comparator.comparing(p -> p.name))
                .map(PartnerResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ImpactResponse impact() {
        var all = pickups.findAll();
        Map<Types.Status, Long> byStatus = new EnumMap<>(Types.Status.class);
        Arrays.stream(Types.Status.values()).forEach(status -> byStatus.put(status, 0L));
        Map<Types.DestinationType, BigDecimal> deliveredKg = new EnumMap<>(Types.DestinationType.class);
        Arrays.stream(Types.DestinationType.values()).forEach(type -> deliveredKg.put(type, BigDecimal.ZERO));
        Map<String, Types.DestinationType> destinations = partners.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.id, p -> p.destinationType));
        BigDecimal requested = BigDecimal.ZERO, collected = BigDecimal.ZERO;
        long eWaste = 0;
        boolean demo = false;
        for (Pickup pickup : all) {
            byStatus.merge(pickup.status, 1L, Long::sum);
            requested = requested.add(pickup.estimatedWeightKg);
            if (pickup.stream == Types.Stream.E_WASTE) eWaste++;
            if (pickup.isDemo) demo = true;
            if (pickup.status == Types.Status.COLLECTED || pickup.status == Types.Status.DELIVERED) {
                collected = collected.add(pickup.confirmedWeightKg);
            }
            if (pickup.status == Types.Status.DELIVERED) {
                Types.DestinationType type = destinations.get(pickup.destinationId);
                if (type != null) deliveredKg.merge(type, pickup.confirmedWeightKg, BigDecimal::add);
            }
        }
        double rate = all.isEmpty() ? 0 : (double) byStatus.get(Types.Status.DELIVERED) / all.size();
        return new ImpactResponse(all.size(), byStatus, requested, collected, deliveredKg, eWaste, rate, demo);
    }

    private Pickup expect(String id, Types.Status required) {
        Pickup pickup = pickups.findForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Pickup not found: " + id));
        if (pickup.status != required) {
            throw new ConflictException("Pickup must be " + required + " before this action; current status: " + pickup.status);
        }
        return pickup;
    }

    private PickupResponse advance(Pickup pickup, Types.Status next) {
        pickup.status = next;
        pickup.updatedAt = Instant.now();
        pickups.save(pickup);
        logs.save(new PickupStatusLog(pickup.id, next, pickup.updatedAt));
        return response(pickup);
    }

    private PickupResponse response(Pickup pickup) {
        return PickupResponse.from(pickup, logs.findByPickupIdOrderByAtAsc(pickup.id));
    }

    private String newId() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder id = new StringBuilder("PICKUP-");
            for (int i = 0; i < 6; i++) id.append(ID_ALPHABET.charAt(random.nextInt(ID_ALPHABET.length())));
            if (!pickups.existsById(id.toString())) return id.toString();
        }
        throw new IllegalStateException("Could not generate a unique pickup ID");
    }
}

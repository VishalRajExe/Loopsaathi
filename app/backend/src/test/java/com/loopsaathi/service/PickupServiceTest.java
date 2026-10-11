package com.loopsaathi.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.loopsaathi.dto.Actions;
import com.loopsaathi.dto.PickupRequest;
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
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PickupServiceTest {
    private final PickupRepository pickups = mock(PickupRepository.class);
    private final PickupStatusLogRepository logs = mock(PickupStatusLogRepository.class);
    private final PartnerRepository partners = mock(PartnerRepository.class);
    private final PickupService service = new PickupService(pickups, logs, partners);

    @BeforeEach void setUp() {
        when(logs.findByPickupIdOrderByAtAsc(any())).thenReturn(List.of());
    }

    @Test void createsRequestedPickupWithNoConfirmedWeightAndLogsIt() {
        var created = service.create(new PickupRequest("  Battery  ", Types.Stream.SPECIAL_CARE,
                new BigDecimal("0.25"), " Hostel A ", Types.Slot.EVENING));
        assertThat(created.id()).matches("PICKUP-[A-Z2-9]{6}");
        assertThat(created.status()).isEqualTo(Types.Status.REQUESTED);
        assertThat(created.confirmedWeightKg()).isNull();
        assertThat(created.isDemo()).isFalse();
        assertThat(created.wasteType()).isEqualTo("Battery");
        ArgumentCaptor<PickupStatusLog> captor = ArgumentCaptor.forClass(PickupStatusLog.class);
        verify(logs).save(captor.capture());
        assertThat(captor.getValue().status).isEqualTo(Types.Status.REQUESTED);
        assertThat(captor.getValue().pickupId).isEqualTo(created.id());
    }

    @Test void acceptsCollectsDeliversOnlyInOrderToMatchingDestination() {
        Pickup pickup = pickup(Types.Status.REQUESTED, Types.Stream.WET, "1");
        when(pickups.findForUpdate(pickup.id)).thenReturn(Optional.of(pickup));
        Partner partner = new Partner();
        partner.id = "PARTNER-COMPOST";
        partner.acceptedStreams = Set.of(Types.Stream.WET);
        when(partners.findById(partner.id)).thenReturn(Optional.of(partner));

        assertThat(service.accept(pickup.id, new Actions.Accept(" C-1 ")).status())
                .isEqualTo(Types.Status.ACCEPTED);
        assertThat(pickup.collectorId).isEqualTo("C-1");
        assertThat(pickup.confirmedWeightKg).isNull();
        assertThat(service.collect(pickup.id, new Actions.Collect(new BigDecimal("0.8"))).status())
                .isEqualTo(Types.Status.COLLECTED);
        assertThat(service.deliver(pickup.id, new Actions.Deliver(partner.id)).status())
                .isEqualTo(Types.Status.DELIVERED);
        assertThat(pickup.destinationId).isEqualTo(partner.id);
        verify(logs, org.mockito.Mockito.times(3)).save(any(PickupStatusLog.class));
    }

    @Test void rejectsSkippedOrRepeatedTransitionsAndWrongDestination() {
        Pickup pickup = pickup(Types.Status.REQUESTED, Types.Stream.WET, "1");
        when(pickups.findForUpdate(pickup.id)).thenReturn(Optional.of(pickup));
        assertThatThrownBy(() -> service.collect(pickup.id, new Actions.Collect(BigDecimal.ONE)))
                .isInstanceOf(ConflictException.class);
        pickup.status = Types.Status.COLLECTED;
        assertThatThrownBy(() -> service.accept(pickup.id, new Actions.Accept("C-1")))
                .isInstanceOf(ConflictException.class);
        Partner wrong = new Partner();
        wrong.id = "PARTNER-DRY";
        wrong.acceptedStreams = Set.of(Types.Stream.DRY);
        when(partners.findById(wrong.id)).thenReturn(Optional.of(wrong));
        assertThatThrownBy(() -> service.deliver(pickup.id, new Actions.Deliver(wrong.id)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("does not accept");
        assertThat(pickup.destinationId).isNull();
        assertThatThrownBy(() -> service.accept("MISSING", new Actions.Accept("C-1")))
                .isInstanceOf(NotFoundException.class);
        when(partners.findById("NOPE")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deliver(pickup.id, new Actions.Deliver("NOPE")))
                .isInstanceOf(NotFoundException.class);
    }

    @Test void listsOnlyDestinationsThatExplicitlyAcceptRequestedStream() {
        Partner wet = new Partner();
        wet.id = "PARTNER-COMPOST";
        wet.name = "Compost";
        wet.acceptedStreams = Set.of(Types.Stream.WET);
        Partner ewaste = new Partner();
        ewaste.id = "PARTNER-EWASTE";
        ewaste.name = "E-waste";
        ewaste.acceptedStreams = Set.of(Types.Stream.E_WASTE);
        when(partners.findAll()).thenReturn(List.of(wet, ewaste));
        assertThat(service.partners(Types.Stream.SPECIAL_CARE)).isEmpty();
        assertThat(service.partners(Types.Stream.E_WASTE)).extracting("id").containsExactly("PARTNER-EWASTE");
        assertThat(service.partners(Types.Stream.WET)).extracting("id").containsExactly("PARTNER-COMPOST");
    }

    @Test void impactSeparatesEstimatedConfirmedAndDeliveredStoredWeights() {
        Pickup requested = pickup(Types.Status.REQUESTED, Types.Stream.WET, "5");
        Pickup collected = pickup(Types.Status.COLLECTED, Types.Stream.DRY, "3");
        collected.confirmedWeightKg = new BigDecimal("2.4");
        Pickup delivered = pickup(Types.Status.DELIVERED, Types.Stream.E_WASTE, "1");
        delivered.confirmedWeightKg = new BigDecimal("0.8");
        delivered.destinationId = "PARTNER-EWASTE";
        delivered.isDemo = true;
        Partner destination = new Partner();
        destination.id = delivered.destinationId;
        destination.destinationType = Types.DestinationType.E_WASTE;
        when(pickups.findAll()).thenReturn(List.of(requested, collected, delivered));
        when(partners.findAll()).thenReturn(List.of(destination));

        var impact = service.impact();
        assertThat(impact.totalRequests()).isEqualTo(3);
        assertThat(impact.requestedKgEstimated()).isEqualByComparingTo("9");
        assertThat(impact.collectedKgConfirmed()).isEqualByComparingTo("3.2");
        assertThat(impact.deliveredKgByType().get(Types.DestinationType.E_WASTE))
                .isEqualByComparingTo("0.8");
        assertThat(impact.deliveredKgByType().get(Types.DestinationType.RECYCLER))
                .isEqualByComparingTo("0");
        assertThat(impact.byStatus().get(Types.Status.ACCEPTED)).isZero();
        assertThat(impact.eWastePickups()).isEqualTo(1);
        assertThat(impact.completionRate()).isCloseTo(1.0 / 3, org.assertj.core.data.Offset.offset(0.0001));
        assertThat(impact.containsDemoData()).isTrue();
    }

    private static Pickup pickup(Types.Status status, Types.Stream stream, String estimate) {
        Pickup pickup = new Pickup();
        pickup.id = "PICKUP-ABC123";
        pickup.status = status;
        pickup.stream = stream;
        pickup.estimatedWeightKg = new BigDecimal(estimate);
        pickup.createdAt = Instant.now();
        return pickup;
    }
}

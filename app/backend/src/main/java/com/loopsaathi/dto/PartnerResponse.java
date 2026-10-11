package com.loopsaathi.dto;

import com.loopsaathi.model.Partner;
import com.loopsaathi.model.Types;
import java.util.Set;

public record PartnerResponse(String id, String name, Set<Types.Stream> acceptedStreams,
                              Types.DestinationType destinationType, String verificationStatus,
                              boolean isDemo) {
    public static PartnerResponse from(Partner partner) {
        return new PartnerResponse(partner.id, partner.name, Set.copyOf(partner.acceptedStreams),
                partner.destinationType, partner.verificationStatus, partner.isDemo);
    }
}

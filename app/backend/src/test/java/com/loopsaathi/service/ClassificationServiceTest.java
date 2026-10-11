package com.loopsaathi.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.loopsaathi.model.Types;
import com.loopsaathi.model.WasteRule;
import com.loopsaathi.repository.WasteRuleRepository;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ClassificationServiceTest {
    private final WasteRuleRepository rules = mock(WasteRuleRepository.class);

    @Test void textMatchesGuideWithoutAiAndUnknownNeedsReview() {
        WasteRule banana = bananaRule();
        when(rules.findAll()).thenReturn(List.of(banana));
        ClassificationService service = new ClassificationService(rules, "http://127.0.0.1:1/classify");
        var matched = service.classify("banana peel", null);
        assertThat(matched.stream()).isEqualTo(Types.Stream.WET);
        assertThat(matched.instruction()).isEqualTo(banana.instruction);
        assertThat(matched.needsReview()).isFalse();
        assertThat(service.classify("mystery item", null).needsReview()).isTrue();
    }

    @Test void imagePostsMultipartAndUsesOnlyGuideInstructionThenFallsBackOffline() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        server.createContext("/classify", exchange -> {
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.ISO_8859_1));
            byte[] response = "{\"label\":\"banana_peels\",\"confidence\":0.59,\"stream\":\"DRY\",\"needsReview\":false}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var output = exchange.getResponseBody()) { output.write(response); }
        });
        server.start();
        WasteRule banana = bananaRule();
        when(rules.findById("banana_peels")).thenReturn(Optional.of(banana));
        ClassificationService service = new ClassificationService(rules,
                "http://127.0.0.1:" + server.getAddress().getPort() + "/classify");
        var image = new MockMultipartFile("image", "banana.jpg", "image/jpeg", "example-image".getBytes());
        try {
            var result = service.classify(null, image);
            assertThat(contentType.get()).startsWith("multipart/form-data;").contains("boundary=");
            assertThat(requestBody.get()).contains("name=\"image\"").contains("example-image");
            assertThat(result.stream()).isEqualTo(Types.Stream.WET); // ignore AI-supplied DRY
            assertThat(result.instruction()).isEqualTo(banana.instruction);
            assertThat(result.needsReview()).isTrue(); // confidence below 0.6
        } finally {
            server.stop(0);
        }
        var unavailable = service.classify(null, image);
        assertThat(unavailable.needsReview()).isTrue();
        assertThat(unavailable.stream()).isNull();
    }

    @Test void mixedItemsRequireManualSelectionAndSpecialCareNeedsReview() {
        WasteRule banana = bananaRule();
        WasteRule bottle = rule("plastic_bottle", "Plastic bottle", "plastic bottle|bottle", Types.Stream.DRY, false);
        WasteRule phone = rule("smartphone", "Old phone", "smartphone|phone|old phone", Types.Stream.E_WASTE, true);
        WasteRule earphones = rule("earphones", "Earphones", "earphones|earbuds", Types.Stream.E_WASTE, true);
        WasteRule battery = rule("battery", "Battery", "battery|batteries", Types.Stream.SPECIAL_CARE, true);
        when(rules.findAll()).thenReturn(List.of(banana, bottle, phone, earphones, battery));
        ClassificationService service = new ClassificationService(rules, "http://127.0.0.1:1/classify");
        var mixed = service.classify("banana peel and plastic bottle", null);
        assertThat(mixed.needsReview()).isTrue();
        assertThat(mixed.stream()).isNull();
        assertThat(mixed.confidence()).isZero();
        assertThat(service.classify("bottle and battery", null).needsReview()).isTrue();
        assertThat(service.classify("bottle and battery", null).stream()).isNull();
        var batteryResult = service.classify("battery", null);
        assertThat(batteryResult.stream()).isEqualTo(Types.Stream.SPECIAL_CARE);
        assertThat(batteryResult.needsReview()).isTrue();
        assertThat(batteryResult.specialRoute()).isTrue();
        for (String text : List.of("phone", "earphones")) {
            var electronic = service.classify(text, null);
            assertThat(electronic.stream()).isEqualTo(Types.Stream.E_WASTE);
            assertThat(electronic.specialRoute()).isTrue();
        }
    }

    private static WasteRule rule(String id, String name, String keywords, Types.Stream stream, boolean special) {
        WasteRule rule = new WasteRule();
        rule.id = id;
        rule.itemName = name;
        rule.keywords = keywords;
        rule.stream = stream;
        rule.specialRoute = special;
        rule.instruction = "From local guide";
        return rule;
    }

    private static WasteRule bananaRule() {
        WasteRule rule = new WasteRule();
        rule.id = "banana_peels";
        rule.itemName = "Banana peel";
        rule.keywords = "banana peel|banana";
        rule.stream = Types.Stream.WET;
        rule.instruction = "Add to the wet-waste collection.";
        return rule;
    }
}

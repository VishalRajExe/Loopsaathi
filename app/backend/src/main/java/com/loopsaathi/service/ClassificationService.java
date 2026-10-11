package com.loopsaathi.service;

import com.loopsaathi.dto.ClassifyResponse;
import com.loopsaathi.dto.WasteItemResponse;
import com.loopsaathi.model.Types;
import com.loopsaathi.model.WasteRule;
import com.loopsaathi.repository.WasteRuleRepository;
import java.io.IOException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ClassificationService {
    private static final Logger log = LoggerFactory.getLogger(ClassificationService.class);
    private final WasteRuleRepository rules;
    private final RestClient ai;

    public ClassificationService(WasteRuleRepository rules, @Value("${loopsaathi.ai-url}") String aiUrl) {
        this.rules = rules;
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.ai = RestClient.builder().requestFactory(factory).baseUrl(aiUrl).build();
    }

    public List<WasteItemResponse> search(String search) {
        String query = normalize(search);
        return rules.findAll().stream()
                .filter(rule -> query.isEmpty() || normalize(rule.itemName).contains(query)
                        || Arrays.stream(rule.keywords.split("\\|")).anyMatch(word -> normalize(word).contains(query)))
                .sorted(Comparator.comparing(rule -> rule.itemName))
                .limit(40).map(WasteItemResponse::from).toList();
    }

    public ClassifyResponse classify(String text, MultipartFile image) {
        boolean hasImage = image != null && !image.isEmpty();
        boolean hasText = text != null && !text.isBlank();
        if (hasImage == hasText) throw new IllegalArgumentException("Provide either an image or text");
        if (hasText) return classifyText(text);
        if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Upload an image file");
        }
        return classifyImage(image);
    }

    private ClassifyResponse classifyText(String text) {
        List<WasteRule> matches = matches(text);
        if (matches.size() > 1) {
            return review(text.trim(), "Multiple items match; classify one item at a time.");
        }
        if (matches.isEmpty()) {
            return review(text.trim(), "Item not in the waste guide; choose a stream manually.");
        }
        WasteRule rule = matches.getFirst();
        boolean specialCare = rule.stream == Types.Stream.SPECIAL_CARE;
        return result(rule, 1.0, specialCare ? "Special-care route needs confirmation."
                : "Matched the waste guide; please confirm.", specialCare);
    }

    private ClassifyResponse classifyImage(MultipartFile image) {
        try {
            byte[] bytes = image.getBytes();
            ByteArrayResource file = new ByteArrayResource(bytes) {
                @Override public String getFilename() { return "photo"; }
            };
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(image.getContentType()));
            var parts = new LinkedMultiValueMap<String, Object>();
            parts.add("image", new HttpEntity<>(file, headers));
            AiPrediction prediction = ai.post().contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(parts).retrieve().body(AiPrediction.class);
            if (prediction == null || prediction.label() == null || prediction.confidence() == null
                    || !Double.isFinite(prediction.confidence()) || prediction.confidence() < 0
                    || prediction.confidence() > 1) {
                return review("Unknown item", "Photo recognition was uncertain; choose an item manually.");
            }
            Optional<WasteRule> matched = rules.findById(prediction.label());
            if (matched.isEmpty()) return review("Unknown item", "Photo label not in the waste guide; choose an item manually.");
            return result(matched.get(), prediction.confidence(), "Photo suggestion; please confirm.",
                    prediction.needsReview() || prediction.confidence() < 0.6
                            || matched.get().stream == Types.Stream.SPECIAL_CARE);
        } catch (IOException | RuntimeException ex) {
            log.warn("Photo classification unavailable: {}", ex.toString());
            return review("Unknown item", "Photo recognition unavailable; choose an item manually.");
        }
    }

    private List<WasteRule> matches(String text) {
        String input = normalize(text);
        return rules.findAll().stream()
                .filter(rule -> normalize(rule.itemName).equals(input) || normalize(rule.id).equals(input)
                        || Arrays.stream(rule.keywords.split("\\|"))
                            .anyMatch(word -> containsPhrase(input, normalize(word))))
                .toList();
    }

    private static boolean containsPhrase(String input, String phrase) {
        return !(phrase.isEmpty()) && (" " + input + " ").contains(" " + phrase + " ");
    }

    private static String normalize(String text) {
        return text == null ? "" : text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static ClassifyResponse result(WasteRule rule, double confidence, String reason, boolean review) {
        return new ClassifyResponse(rule.itemName, rule.stream, confidence, reason,
                rule.instruction, rule.specialRoute, review);
    }

    private static ClassifyResponse review(String item, String reason) {
        return new ClassifyResponse(item, null, 0, reason, "Choose a waste type to continue.", false, true);
    }

    private record AiPrediction(String label, Double confidence, String stream, boolean needsReview) {}
}

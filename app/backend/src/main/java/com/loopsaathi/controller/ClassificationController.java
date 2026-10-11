package com.loopsaathi.controller;

import com.loopsaathi.dto.ClassifyResponse;
import com.loopsaathi.dto.WasteItemResponse;
import com.loopsaathi.service.ClassificationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ClassificationController {
    private final ClassificationService service;

    public ClassificationController(ClassificationService service) { this.service = service; }

    @GetMapping("/waste-items")
    public List<WasteItemResponse> items(@RequestParam(defaultValue = "") String search) {
        return service.search(search);
    }

    @PostMapping(value = "/classify", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ClassifyResponse classify(@RequestParam(required = false) String text,
                                     @RequestParam(required = false) MultipartFile image) {
        return service.classify(text, image);
    }

    @PostMapping(value = "/classify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ClassifyResponse classifyJson(@RequestBody Map<String, String> request) {
        return service.classify(request.get("text"), null);
    }
}

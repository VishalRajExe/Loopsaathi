package com.loopsaathi.dto;

import com.loopsaathi.model.Types;

public record ClassifyResponse(String item, Types.Stream stream, double confidence,
                               String reason, String instruction, boolean specialRoute,
                               boolean needsReview) {}

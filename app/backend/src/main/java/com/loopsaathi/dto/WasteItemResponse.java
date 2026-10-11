package com.loopsaathi.dto;

import com.loopsaathi.model.Types;
import com.loopsaathi.model.WasteRule;

public record WasteItemResponse(String id, String itemName, Types.Stream stream,
                                String instruction, boolean specialRoute) {
    public static WasteItemResponse from(WasteRule rule) {
        return new WasteItemResponse(rule.id, rule.itemName, rule.stream, rule.instruction, rule.specialRoute);
    }
}

package com.loopsaathi.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import java.io.IOException;
import java.math.BigDecimal;

/** Accept only JSON numbers; Bean Validation checks range and three-decimal precision. */
public class StrictWeightDeserializer extends JsonDeserializer<BigDecimal> {
    @Override public BigDecimal deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        if (!parser.currentToken().isNumeric()) {
            throw JsonMappingException.from(parser, "Weight must be a JSON number");
        }
        return parser.getDecimalValue();
    }
}

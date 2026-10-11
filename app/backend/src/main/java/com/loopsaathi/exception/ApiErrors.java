package com.loopsaathi.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class ApiErrors {
    private static final Logger log = LoggerFactory.getLogger(ApiErrors.class);
    public record ErrorBody(String error) {}

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ErrorBody> missing(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorBody(ex.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ErrorBody> conflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorBody(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> invalidFields(MethodArgumentNotValidException ex) {
        var field = ex.getBindingResult().getFieldErrors().stream().findFirst();
        return ResponseEntity.badRequest().body(new ErrorBody(field.map(error ->
                error.getField() + " " + error.getDefaultMessage()).orElse("Invalid request")));
    }

    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class,
            HttpMessageConversionException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, MaxUploadSizeExceededException.class})
    ResponseEntity<ErrorBody> invalid(Exception ex) {
        String message = ex instanceof IllegalArgumentException ? ex.getMessage()
                : ex instanceof MaxUploadSizeExceededException ? "Image must be no larger than 10 MB"
                : "Invalid request: check required fields and allowed values";
        if (ex instanceof HttpMessageConversionException unreadable
                && unreadable.getMostSpecificCause() instanceof JsonMappingException mapping
                && "Weight must be a JSON number".equals(mapping.getOriginalMessage())) {
            message = mapping.getOriginalMessage();
        }
        return ResponseEntity.badRequest().body(new ErrorBody(message));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorBody> mediaType(HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(new ErrorBody("Unsupported content type"));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorBody> unexpected(Exception ex) {
        log.error("Unexpected API error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorBody("An unexpected error occurred"));
    }
}

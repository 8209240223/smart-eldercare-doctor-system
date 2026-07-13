package com.medical.assistant.agent;

import java.util.Map;

@FunctionalInterface
public interface AssistantEventSink {

    AssistantEventSink NOOP = (type, payload) -> { };

    void emit(String type, Map<String, Object> payload);
}

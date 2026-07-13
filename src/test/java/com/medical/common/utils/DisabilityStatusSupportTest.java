package com.medical.common.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DisabilityStatusSupportTest {

    @Test
    void onlyExplicitDisabilityOptionsTriggerAiDisabilityRule() {
        assertTrue(DisabilityStatusSupport.hasConfirmedDisability("部分失能"));
        assertTrue(DisabilityStatusSupport.hasConfirmedDisability("肢体残疾"));
        assertFalse(DisabilityStatusSupport.hasConfirmedDisability("无"));
        assertFalse(DisabilityStatusSupport.hasConfirmedDisability("885"));
        assertFalse(DisabilityStatusSupport.hasConfirmedDisability("部分自理"));
    }
}

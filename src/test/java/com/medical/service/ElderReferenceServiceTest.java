package com.medical.service;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.mapper.ElderInfoMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ElderReferenceServiceTest {

    @Test
    void rejectsMissingDeletedAndInactiveElders() {
        ElderInfoMapper mapper = mock(ElderInfoMapper.class);
        ElderReferenceService service = createService(mapper);

        assertEquals(400, assertThrows(BusinessException.class,
                () -> service.requireActive(null)).getCode());

        when(mapper.selectById(10L)).thenReturn(null);
        assertEquals(404, assertThrows(BusinessException.class,
                () -> service.requireActive(10L)).getCode());

        ElderInfo deleted = elder(11L, 1, 1);
        when(mapper.selectById(11L)).thenReturn(deleted);
        assertEquals(404, assertThrows(BusinessException.class,
                () -> service.requireActive(11L)).getCode());

        ElderInfo inactive = elder(12L, 0, 0);
        when(mapper.selectById(12L)).thenReturn(inactive);
        assertEquals(400, assertThrows(BusinessException.class,
                () -> service.requireActive(12L)).getCode());
    }

    @Test
    void returnsActiveElder() {
        ElderInfoMapper mapper = mock(ElderInfoMapper.class);
        ElderReferenceService service = createService(mapper);
        ElderInfo elder = elder(1L, 0, 1);
        when(mapper.selectById(1L)).thenReturn(elder);

        assertSame(elder, service.requireActive(1L));
    }

    private ElderReferenceService createService(ElderInfoMapper mapper) {
        ElderReferenceService service = new ElderReferenceService();
        ReflectionTestUtils.setField(service, "elderInfoMapper", mapper);
        return service;
    }

    private ElderInfo elder(Long id, Integer deleted, Integer accountStatus) {
        ElderInfo elder = new ElderInfo();
        elder.setId(id);
        elder.setDeleted(deleted);
        elder.setAccountStatus(accountStatus);
        return elder;
    }
}

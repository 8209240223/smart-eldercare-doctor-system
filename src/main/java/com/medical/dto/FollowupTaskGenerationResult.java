package com.medical.dto;

import com.medical.entity.FollowupTask;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FollowupTaskGenerationResult {
    private FollowupTask task;
    private boolean created;
}

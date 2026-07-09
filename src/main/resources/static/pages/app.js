const { createApp } = Vue;

const RECORD_TYPE_MAP = {
    1: '基础护理',
    2: '专科护理',
    3: '生活照料',
    4: '心理护理',
    5: '康复护理'
};

const PLAN_TYPE_MAP = {
    1: '基础护理',
    2: '康复护理',
    3: '专科护理',
    4: '心理护理'
};

const PLAN_STATUS_MAP = { 0: '待执行', 1: '进行中', 2: '已完成', 3: '已终止' };

const REPORT_STATUS_MAP = { 0: '未上报', 1: '已上报', 2: '已处理' };

const EFFECT_SCORE_MAP = { 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' };

const ASSESSMENT_TYPE_MAP = {
    1: '健康评估',
    2: '慢病评估',
    3: '心理评估',
    4: '营养评估',
    5: '康复评估',
    6: '综合评估'
};

const REFERRAL_TYPE_MAP = { 1: '上转', 2: '下转' };
const REFERRAL_STATUS_MAP = {
    0: '待提交',
    1: '待接收',
    2: '已接收',
    3: '已完成',
    4: '已退回',
    5: '已取消'
};
const URGENCY_MAP = { 1: '一般', 2: '紧急', 3: '特急' };
const DEVICE_TYPE_MAP = {
    1: '血压监测设备',
    2: '血糖仪',
    3: '体温计',
    4: '心电监测设备'
};
const VITAL_TYPE_MAP = {
    1: '收缩压',
    2: '舒张压',
    3: '心率',
    4: '空腹血糖',
    5: '餐后血糖',
    6: '血氧',
    7: '体温',
    8: '步数',
    9: '睡眠'
};
const TIMELINE_TYPE_MAP = {
    1: '评估',
    2: '随访',
    3: '预警处理',
    4: '转诊',
    5: '干预',
    6: '体征',
    7: '报告',
    8: '通知',
    9: '其他'
};

const TAB_META = [
    { key: 'dashboard', label: '工作台', icon: 'D' },
    { key: 'elders', label: '老人档案', icon: 'E' },
    { key: 'warnings', label: '预警中心', icon: 'W' },
    { key: 'keyPopulation', label: '重点人群', icon: 'K' },
    { key: 'followup', label: '随访计划', icon: 'F' },
    { key: 'intervention', label: '干预管理', icon: 'I' },
    { key: 'assessment', label: '评估记录', icon: 'A' },
    { key: 'referral', label: '转诊协同', icon: 'R' },
    { key: 'vitals', label: '生命体征', icon: 'V' },
    { key: 'exam', label: '体检管理', icon: 'X' },
    { key: 'review', label: '护士审核', icon: 'H' },
    { key: 'timeline', label: '服务时间线', icon: 'T' },
    { key: 'profile', label: '个人中心', icon: 'P' }
];

const ADMIN_TAB_META = [
    { key: 'admin-dashboard', label: '管理工作台', icon: 'A' },
    { key: 'admin-ai-config', label: 'AI配置', icon: 'Z' },
    { key: 'elders', label: '老人档案', icon: 'E' },
    { key: 'warnings', label: '预警中心', icon: 'W' },
    { key: 'keyPopulation', label: '重点人群', icon: 'K' },
    { key: 'followup', label: '随访计划', icon: 'F' },
    { key: 'intervention', label: '干预管理', icon: 'I' },
    { key: 'assessment', label: '评估记录', icon: 'S' },
    { key: 'referral', label: '转诊协同', icon: 'R' },
    { key: 'vitals', label: '生命体征', icon: 'V' },
    { key: 'exam', label: '体检管理', icon: 'X' },
    { key: 'timeline', label: '服务时间线', icon: 'T' },
    { key: 'profile', label: '个人中心', icon: 'P' }
];

const NURSE_TAB_META = [
    { key: 'nurse-dashboard', label: '护士工作台', icon: 'N' },
    { key: 'nurse-records', label: '护理记录', icon: 'R' },
    { key: 'nurse-plans', label: '护理计划', icon: 'P' },
    { key: 'elders', label: '老人档案', icon: 'E' },
    { key: 'warnings', label: '预警中心', icon: 'W' },
    { key: 'followup', label: '随访计划', icon: 'F' },
    { key: 'assessment', label: 'AI评估', icon: 'A' },
    { key: 'vitals', label: '生命体征', icon: 'V' },
    { key: 'timeline', label: '服务时间线', icon: 'T' },
    { key: 'profile', label: '个人中心', icon: 'P' }
];

const DISEASE_MAP = { 1: '高血压', 2: '糖尿病', 3: '冠心病', 4: '脑卒中', 5: '慢阻肺', 6: '阿尔茨海默病', 7: '其他' };
const FREQ_MAP = { 1: '每日', 2: '每周', 3: '每月', 4: '每季度', 5: '每年' };
const PLAN_STATUS = { 0: '待执行', 1: '进行中', 2: '已完成', 3: '已关闭' };
const WARN_LEVEL_MAP = { 1: '低', 2: '中', 3: '高' };
const WARN_STATUS_MAP = { 0: '待处理', 1: '处理中', 2: '已处理', 3: '已关闭' };
const WARN_TYPE_MAP = { 1: '血压异常', 2: '血糖异常', 3: '心率异常', 4: '血氧异常', 5: '设备离线', 6: '睡眠异常', 7: '其他' };
const FOLLOW_TYPE_MAP = { 1: '电话', 2: '上门', 3: '视频', 4: '其他' };
const INTERVENTION_MAP = { 1: '健康宣教', 2: '用药指导', 3: '康复训练', 4: '心理干预' };
const EFFECT_MAP = { 1: '良好', 2: '一般', 3: '较差', 4: '无效' };

const blankAssessment = () => ({
    id: null,
    elderId: '',
    doctorId: '',
    assessType: 1,
    assessDate: new Date().toISOString().slice(0, 10),
    score: '',
    level: '',
    result: '',
    suggestion: ''
});

const blankReferral = () => ({
    id: null,
    elderId: '',
    referralType: 1,
    fromOrg: '',
    fromDoctorId: '',
    fromDoctorName: '',
    toOrg: '',
    toDoctorId: '',
    toDoctorName: '',
    toDept: '',
    diagnosis: '',
    referralReason: '',
    urgencyLevel: 2,
    bedReserved: 0,
    remark: ''
});

const blankDevice = () => ({
    elderId: '',
    deviceType: 1,
    deviceName: '',
    deviceSn: ''
});

const blankElder = () => ({
    id: null,
    name: '',
    gender: 1,
    birthDate: '',
    idCard: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    nation: '',
    maritalStatus: '',
    education: '',
    address: '',
    community: '',
    medicalInsuranceType: '',
    doctorId: '',
    accountStatus: 1
});

const blankWarning = () => ({
    elderId: '',
    warningLevel: 1,
    warningType: 7,
    warningTitle: '',
    warningContent: '',
    doctorId: '',
    handleResult: ''
});

const blankPlan = () => ({
    id: null,
    planName: '',
    elderId: '',
    doctorId: '',
    diseaseType: 1,
    frequencyType: 3,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    nextFollowDate: '',
    totalCount: 12,
    status: 1,
    remark: ''
});

const blankFollowRecord = () => ({
    id: null,
    planId: '',
    elderId: '',
    doctorId: '',
    followDate: new Date().toISOString().slice(0, 19),
    followType: 1,
    diseaseType: 1,
    symptomDesc: '',
    systolicPressure: '',
    diastolicPressure: '',
    heartRate: '',
    bloodSugarFasting: '',
    weight: '',
    medicationCompliance: '',
    currentMedication: '',
    followResult: '',
    nextFollowDate: '',
    remark: ''
});

const blankIntervention = () => ({
    id: null,
    followRecordId: '',
    elderId: '',
    doctorId: '',
    interventionType: 1,
    interventionTitle: '',
    interventionContent: '',
    medicationAdjust: '',
    lifestyleGuidance: '',
    healthEducation: '',
    effectEvaluation: '',
    effectDesc: '',
    nextPlan: '',
    interventionDate: new Date().toISOString().slice(0, 19)
});

createApp({
    template: `
    <div class="shell">
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-top">
                    <div class="brand-logo">医</div>
                    <div>
                        <h1>智慧医养大数据公共服务平台</h1>
                        <p>Vue 3 + Spring Boot 全栈驱动，为医生提供一站式智慧医养服务</p>
                    </div>
                </div>
            </div>
            <nav class="nav">
                <button v-for="tab in tabs" :key="tab.key" :class="{active: activeTab===tab.key}" @click="switchTab(tab.key)">
                    <span class="icon">{{ tab.icon }}</span>
                    <span>{{ tab.label }}</span>
                </button>
            </nav>
            <div class="sidebar-footer">
                <div>当前用户：{{ userDisplayName }}</div>
                <div>角色：{{ userRoleText }}</div>
                <div>Vue 3 + Spring Boot API</div>
            </div>
        </aside>
        <main class="content">
            <transition name="content" mode="out-in">
            <div :key="activeTab">
            <header class="topbar">
                <div class="hero">
                    <h2>{{ welcomeTitle }}</h2>
                    <p>{{ welcomeText }}</p>
                </div>
                <div class="toolbar">
                    <div class="user-chip">
                        <div class="avatar">
                            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="头像" @error="handleAvatarError" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
                            <span v-else>{{ userAvatar }}</span>
                        </div>
                        <div>
                            <div class="name">{{ userDisplayName }}</div>
                            <div class="role">{{ userRoleText }}</div>
                        </div>
                    </div>
                    <button class="ghost-btn" @click="switchTab('profile')">个人中心</button>
                    <button class="danger-btn" @click="logout">退出登录</button>
                </div>
            </header>
<section v-if="activeTab==='dashboard'" class="grid-1">
                <div class="panel-grid">
                    <div class="card stat-card" style="border-top: 4px solid #4A80C0; padding-right: 60px;">
                        <div class="stat-label">老人总数</div>
                        <div class="stat-value" style="color: #4A80C0;">{{ dashboard.stats.eldersTotal || 0 }}</div>
                        <div class="stat-sub">当前平台管理的老人档案数量</div>
                        <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); font-size: 40px; opacity: 0.15; color: #4A80C0;">👥</div>
                    </div>
                    <div class="card stat-card" style="border-top: 4px solid #E06A6A; padding-right: 60px;">
                        <div class="stat-label">待处理预警</div>
                        <div class="stat-value" style="color: #E06A6A;">{{ dashboard.stats.warningPending || 0 }}</div>
                        <div class="stat-sub">高优先级预警需要优先处置</div>
                        <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); font-size: 40px; opacity: 0.15; color: #E06A6A;">🚨</div>
                    </div>
                    <div class="card stat-card" style="border-top: 4px solid #E6A23C; padding-right: 60px;">
                        <div class="stat-label">进行中随访</div>
                        <div class="stat-value" style="color: #E6A23C;">{{ dashboard.stats.followupActive || 0 }}</div>
                        <div class="stat-sub">进入执行周期的随访计划</div>
                        <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); font-size: 40px; opacity: 0.15; color: #E6A23C;">📅</div>
                    </div>
                    <div class="card stat-card" style="border-top: 4px solid #67C23A; padding-right: 60px;">
                        <div class="stat-label">今日待办</div>
                        <div class="stat-value" style="color: #67C23A;">{{ dashboard.stats.todayTodo || 0 }}</div>
                        <div class="stat-sub">今日到期随访 + 待处理预警</div>
                        <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); font-size: 40px; opacity: 0.15; color: #67C23A;">📋</div>
                    </div>
                </div>
                <div class="grid-2">
                    <div class="card list-card">
                        <div class="list-head">
                            <div>
                                <div class="list-title">📈 数据概览</div>
                                <div class="hint">使用 ECharts 实时呈现关键比例</div>
                            </div>
                            <div class="actions">
                                <button class="link" @click="renderCharts()">重新渲染</button>
                            </div>
                        </div>
                        <div class="panel-grid">
                            <div class="card" style="grid-column: span 4; padding: 12px;"><div id="genderChart" class="chart-box"></div></div>
                            <div class="card" style="grid-column: span 4; padding: 12px;"><div id="warningChart" class="chart-box"></div></div>
                            <div class="card" style="grid-column: span 4; padding: 12px;"><div id="followChart" class="chart-box"></div></div>
                        </div>
                    </div>
                    <div class="grid-1">
                        <div class="card list-card" style="padding-bottom: 10px;">
                            <div class="list-head">
                                <div><div class="list-title">⚡ 快捷操作</div></div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <button class="primary-btn" @click="switchTab('elders')" style="display: flex; align-items: center; justify-content: center; gap: 8px;">👥 新增档案</button>
                                <button class="primary-btn" @click="switchTab('followup')" style="background: linear-gradient(135deg, #E6A23C, #F5B041); display: flex; align-items: center; justify-content: center; gap: 8px;">📅 今日随访</button>
                                <button class="primary-btn" @click="switchTab('warnings')" style="background: linear-gradient(135deg, #E06A6A, #F78989); display: flex; align-items: center; justify-content: center; gap: 8px;">🚨 预警处理</button>
                                <button class="primary-btn" @click="switchTab('referral')" style="background: linear-gradient(135deg, #909399, #A6A9AD); display: flex; align-items: center; justify-content: center; gap: 8px;">🔄 转诊申请</button>
                            </div>
                        </div>
                        <div class="card list-card" style="flex: 1;">
                            <div class="list-head">
                                <div>
                                    <div class="list-title">🚨 最新预警</div>
                                </div>
                                <button class="soft-btn" @click="switchTab('warnings')">查看全部</button>
                            </div>
                            <div v-if="dashboard.latestWarnings.length===0" class="empty-state">暂无预警数据</div>
                            <div v-else>
                                <div class="timeline-card" v-for="item in dashboard.latestWarnings" :key="item.id" style="border-bottom: 1px dashed #ebeef5;">
                                    <div>
                                        <div class="title" style="color: #303133;">{{ item.warningTitle }}</div>
                                        <div class="desc" style="margin-top: 4px;">{{ warnTypeText(item.warningType) }} · {{ dateText(item.createTime) }}</div>
                                    </div>
                                    <span class="tag" :class="warnLevelClass(item.warningLevel)">{{ warnLevelText(item.warningLevel) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 慢病管理概览 -->
                <div class="card list-card" style="margin-top: 20px;">
                    <div class="list-head">
                        <div><div class="list-title">📊 慢病管理概览</div><div class="hint">重点关注慢性病管理情况，及时调整干预方案</div></div>
                        <div class="actions">
                            <button class="link" @click="switchTab('elders')">老人档案</button>
                            <button class="link" @click="switchTab('warnings')">预警中心</button>
                        </div>
                    </div>
                    <div class="panel-grid" style="grid-template-columns: repeat(5, 1fr);">
                        <div class="card stat-card" style="border-top: 4px solid #4A80C0; padding: 14px 10px;">
                            <div class="stat-label">管理老人总数</div>
                            <div class="stat-value" style="font-size: 24px;">{{ chronicOverview.totalElders || 0 }}</div>
                            <div class="stat-sub">签约管理总人数</div>
                        </div>
                        <div class="card stat-card" style="border-top: 4px solid #E6A23C; padding: 14px 10px;">
                            <div class="stat-label">高血压</div>
                            <div class="stat-value" style="font-size: 24px; color: #E6A23C;">{{ chronicOverview.hypertension || 0 }}</div>
                            <div class="stat-sub">高血压管理人数</div>
                        </div>
                        <div class="card stat-card" style="border-top: 4px solid #E06A6A; padding: 14px 10px;">
                            <div class="stat-label">糖尿病</div>
                            <div class="stat-value" style="font-size: 24px; color: #E06A6A;">{{ chronicOverview.diabetes || 0 }}</div>
                            <div class="stat-sub">糖尿病管理人数</div>
                        </div>
                        <div class="card stat-card" style="border-top: 4px solid #67C23A; padding: 14px 10px;">
                            <div class="stat-label">高风险预警</div>
                            <div class="stat-value" style="font-size: 24px; color: #67C23A;">{{ chronicOverview.highRiskCount || 0 }}</div>
                            <div class="stat-sub">未处理的高风险预警</div>
                        </div>
                        <div class="card stat-card" style="border-top: 4px solid #909399; padding: 14px 10px;">
                            <div class="stat-label">随访完成率</div>
                            <div class="stat-value" style="font-size: 24px; color: #909399;">{{ chronicOverview.followupRate || 0 }}%</div>
                            <div class="stat-sub">总体随访完成率</div>
                        </div>
                    </div>
                </div>
                <!-- 工作台增强：今日待办 + 待审核 -->
                <div class="grid-2" style="margin-top: 20px;">
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">📋 今日待办清单</div><div class="hint">汇总需要您关注和处理的事项</div></div>
                            <div class="actions">
                                <button class="link" @click="switchTab('warnings')">预警</button>
                                <button class="link" @click="switchTab('followup')">随访</button>
                                <button class="link" @click="switchTab('review')">审核</button>
                            </div>
                        </div>
                        <div class="timeline-card">
                            <div><div class="title">待处理预警</div><div class="desc">需要及时处理的高优先级预警</div></div>
                            <span class="tag" :class="todoList.pendingWarnings>0?'tag-danger':'tag-success'">{{ todoList.pendingWarnings || 0 }}</span>
                        </div>
                        <div class="timeline-card">
                            <div><div class="title">今日需随访</div><div class="desc">今日到期的随访计划数量</div></div>
                            <span class="tag" :class="todoList.todayFollowups>0?'tag-warning':'tag-success'">{{ todoList.todayFollowups || 0 }}</span>
                        </div>
                        <div class="timeline-card">
                            <div><div class="title">今日已随访</div><div class="desc">今日已完成的随访记录数</div></div>
                            <span class="tag tag-success">{{ todoList.todayRecords || 0 }}</span>
                        </div>
                        <div class="timeline-card">
                            <div><div class="title">逾期未随访</div><div class="desc">超过计划日期未执行的随访</div></div>
                            <span class="tag" :class="todoList.overdueFollowups>0?'tag-danger':'tag-success'">{{ todoList.overdueFollowups || 0 }}</span>
                        </div>
                        <div class="timeline-card">
                            <div><div class="title">待审核护理记录</div><div class="desc">护士上报的异常护理记录待审核</div></div>
                            <span class="tag" :class="todoList.pendingNurseRecords>0?'tag-warning':'tag-success'">{{ todoList.pendingNurseRecords || 0 }}</span>
                        </div>
                        <div class="timeline-card">
                            <div><div class="title">待审核护理计划</div><div class="desc">护士制定的护理计划待审阅</div></div>
                            <span class="tag" :class="todoList.pendingNursePlans>0?'tag-warning':'tag-success'">{{ todoList.pendingNursePlans || 0 }}</span>
                        </div>
                        <div style="margin-top:12px;"><button class="primary-btn" @click="switchTab('review')" style="width:100%;">去审核中心查看详情</button></div>
                    </div>
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">👩‍⚕️ 护士工作待审核</div><div class="hint">来自护士团队的待处理事项</div></div>
                            <button class="soft-btn" @click="switchTab('review')">查看全部</button>
                        </div>
                        <div class="panel-grid" style="margin-top:8px;">
                            <div class="card stat-card">
                                <div class="stat-label">待审核护理记录</div>
                                <div class="stat-value" :style="{color: reviewCounts.pendingNurseRecords>0?'#e6a23c':'#67c23a'}">{{ reviewCounts.pendingNurseRecords || 0 }}</div>
                                <div class="stat-sub">护士上报的异常记录</div>
                            </div>
                            <div class="card stat-card">
                                <div class="stat-label">待审核护理计划</div>
                                <div class="stat-value" :style="{color: reviewCounts.pendingNursePlans>0?'#e6a23c':'#67c23a'}">{{ reviewCounts.pendingNursePlans || 0 }}</div>
                                <div class="stat-sub">护士制定的护理计划</div>
                            </div>
                        </div>
                        <div class="actions" style="margin-top:12px;justify-content:center;">
                            <button class="primary-btn" @click="switchTab('review')">进入审核中心</button>
                        </div>
                    </div>
                </div>
            </section>
            <section v-if="activeTab==='elders'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>老人档案管理</h3>
                        <p>管理所有签约老人的基本信息、健康档案和联系方式，支持检索和筛选</p>
                    </div>
                    <div class="actions"><button class="primary-btn" v-if="!isAdmin && !isNurse" @click="openElderModal()">+ 新增老人档案</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>姓名</label><input v-model="elderFilter.name" placeholder="输入姓名搜索"></div>
                    <div class="field"><label>所属社区</label><input v-model="elderFilter.community" placeholder="输入社区名称"></div>
                    <div class="field"><label>责任医生ID</label><input v-model="elderFilter.doctorId" type="number" min="1" placeholder="医生ID"></div>
                    <div class="field"><label>疾病类型</label><select v-model="elderFilter.diseaseType"><option value="">全部疾病</option><option v-for="(txt,key) in diseaseMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadElders(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>老人ID</th><th>姓名</th><th>性别</th><th>出生日期</th><th>联系电话</th><th>所属社区</th><th>责任医生ID</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="elderPage.records.length===0"><td colspan="8"><div class="empty-state">暂无老人档案数据</div></td></tr>
                        <tr v-for="row in elderPage.records" :key="row.id">
                            <td>{{ row.id }}</td>
                            <td><strong>{{ row.name }}</strong></td>
                            <td>{{ genderText(row.gender) }}</td>
                            <td>{{ row.birthDate || '-' }}</td>
                            <td>{{ row.phone || '-' }}</td>
                            <td>{{ row.community || '-' }}</td>
                            <td>{{ row.doctorId || '-' }}</td>
                            <td><div class="actions">
                                <button class="link" @click="openHealthDetail(row.id)">查看健康详情</button>
                                <button class="ok" @click="openUnifiedHealthReport(row.id)">📋 报告</button>
                                <button class="ok" v-if="!isAdmin && !isNurse" @click="openElderModal(row)">编辑</button>
                                <button class="danger" v-if="!isAdmin && !isNurse" @click="deleteElder(row.id)">删除</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="elderPage.pages>1">
                    <button :disabled="elderPage.pageNum<=1" @click="loadElders(elderPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(elderPage.pageNum, elderPage.pages)" :key="'e'+p" :class="{active: p===elderPage.pageNum}" @click="loadElders(p)">{{ p }}</button>
                    <button :disabled="elderPage.pageNum>=elderPage.pages" @click="loadElders(elderPage.pageNum+1)">下一页</button>
                </div>
            </section>
            <section v-if="activeTab==='keyPopulation'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>重点人群风险分层</h3>
                        <p>基于高龄、慢病、预警、护理异常和随访逾期等因素识别重点管理对象，并自动生成随访计划</p>
                    </div>
                    <div class="actions">
                        <button class="primary-btn" @click="generateFollowupPlans()">生成随访计划</button>
                    </div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card">
                        <div class="stat-label">高危老人</div>
                        <div class="stat-value" style="color:#ff6b6b;">{{ riskStats.highRisk || 0 }}</div>
                        <div class="stat-sub">需优先跟进</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">重点人群</div>
                        <div class="stat-value" style="color:#e6a23c;">{{ riskStats.key || 0 }}</div>
                        <div class="stat-sub">纳入重点随访</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">关注人群</div>
                        <div class="stat-value" style="color:#4fc3f7;">{{ riskStats.attention || 0 }}</div>
                        <div class="stat-sub">持续观察</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">普通老人</div>
                        <div class="stat-value" style="color:#67c23a;">{{ riskStats.normal || 0 }}</div>
                        <div class="stat-sub">常规管理</div>
                    </div>
                </div>
                <div class="filters">
                    <div class="field">
                        <label>风险等级</label>
                        <select v-model.number="riskFilter.riskLevel">
                            <option :value="null">全部等级</option>
                            <option :value="4">高危</option>
                            <option :value="3">重点</option>
                            <option :value="2">关注</option>
                            <option :value="1">普通</option>
                        </select>
                    </div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadKeyPopulation(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>老人ID</th><th>姓名</th><th>风险等级</th><th>风险评分</th><th>风险标签</th><th>上次计算</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="keyPopulationPage.records.length===0"><td colspan="7"><div class="empty-state">暂无重点人群数据，系统会从老人、预警、随访、护理和体征数据自动计算风险分层</div></td></tr>
                        <tr v-for="row in keyPopulationPage.records" :key="'risk'+row.elderId">
                            <td>{{ row.elderId }}</td>
                            <td><strong>{{ row.elderName || row.name || '-' }}</strong></td>
                            <td><span class="tag" :class="riskLevelTag(row.riskLevel)">{{ riskLevelText(row.riskLevel) }}</span></td>
                            <td>{{ row.riskScore || 0 }}</td>
                            <td>{{ row.riskTags || '-' }}</td>
                            <td>{{ dateTimeText(row.lastCalculateTime) }}</td>
                            <td><div class="actions">
                                <button class="link" @click="viewRiskDetail(row)">查看画像</button>
                                <button class="ok" @click="generateFollowupPlans(row)">生成计划</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="keyPopulationPage.pages>1">
                    <button :disabled="keyPopulationPage.pageNum<=1" @click="loadKeyPopulation(keyPopulationPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(keyPopulationPage.pageNum, keyPopulationPage.pages)" :key="'kp'+p" :class="{active: p===keyPopulationPage.pageNum}" @click="loadKeyPopulation(p)">{{ p }}</button>
                    <button :disabled="keyPopulationPage.pageNum>=keyPopulationPage.pages" @click="loadKeyPopulation(keyPopulationPage.pageNum+1)">下一页</button>
                </div>
                <div class="card list-card" style="margin-top:14px;">
                    <div class="list-head">
                        <div><div class="list-title">今日随访任务</div><div class="hint">由风险分层规则自动生成的待办随访</div></div>
                        <span class="tag tag-warning">待处理 {{ taskStats.pending || 0 }}</span>
                    </div>
                    <div v-if="todayTasks.length===0" class="empty-state">暂无今日随访任务</div>
                    <div v-else class="timeline-list">
                        <div class="timeline-card" v-for="task in todayTasks" :key="'task'+task.id">
                            <div>
                                <div class="title">老人 {{ task.elderId }} · {{ taskTypeText(task.taskType) }}</div>
                                <div class="desc">{{ task.taskReason || '-' }}</div>
                            </div>
                            <span class="tag" :class="priorityTag(task.priority)">{{ priorityText(task.priority) }}</span>
                        </div>
                    </div>
                </div>
            </section>
            <section v-if="activeTab==='warnings'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>预警中心</h3>
                        <p>实时监测老人健康异常信号，支持按等级、类型和状态进行多维度筛选和处理</p>
                    </div>
                    <div class="actions">
                        <span class="rt-badge" :class="sse.connected ? 'rt-on' : 'rt-off'">
                            <span class="rt-dot"></span>{{ sse.connected ? '实时监测中' : (sse.connecting ? '连接中…' : '未连接') }}
                        </span>
                        <button class="primary-btn" v-if="!isAdmin && !isNurse" @click="openWarningModal()">+ 新建预警</button>
                    </div>
                </div>
                <div class="rt-panel">
                    <div class="rt-stats">
                        <div class="rt-stat rt-stat-red">
                            <div class="rt-stat-num">{{ realtime.redPending || 0 }}</div>
                            <div class="rt-stat-label">高危待处理</div>
                        </div>
                        <div class="rt-stat rt-stat-orange">
                            <div class="rt-stat-num">{{ realtime.orangePending || 0 }}</div>
                            <div class="rt-stat-label">中危待处理</div>
                        </div>
                        <div class="rt-stat rt-stat-yellow">
                            <div class="rt-stat-num">{{ realtime.yellowPending || 0 }}</div>
                            <div class="rt-stat-label">低危待处理</div>
                        </div>
                        <div class="rt-stat rt-stat-total">
                            <div class="rt-stat-num">{{ realtime.totalPending || 0 }}</div>
                            <div class="rt-stat-label">待处理合计</div>
                        </div>
                    </div>
                    <div class="rt-grid">
                        <div class="rt-chart-card">
                            <div class="rt-card-title">近 24 小时预警趋势</div>
                            <div id="rtTrendChart" class="chart-box" style="height:220px;"></div>
                        </div>
                        <div class="rt-feed-card">
                            <div class="rt-card-title">
                                实时预警流
                                <span class="rt-feed-count" v-if="realtimeFeed.length">{{ realtimeFeed.length }}</span>
                            </div>
                            <div class="rt-feed" v-if="realtimeFeed.length">
                                <div class="rt-feed-item" v-for="ev in realtimeFeed" :key="ev._key" :class="'rt-lv-'+ev.warningLevel">
                                    <span class="rt-feed-lv" :class="warnLevelClass(ev.warningLevel)">{{ warnLevelText(ev.warningLevel) }}</span>
                                    <div class="rt-feed-body">
                                        <div class="rt-feed-title">{{ ev.warningTitle }}</div>
                                        <div class="rt-feed-meta">老人 {{ ev.elderId }} · {{ warnTypeText(ev.warningType) }} · {{ ev._time }}</div>
                                    </div>
                                    <button class="link" @click="ev.id ? openWarningDetail(ev.id) : loadWarnings(1)">查看</button>
                                </div>
                            </div>
                            <div class="rt-feed-empty" v-else>暂无实时推送，新预警将自动出现在此</div>
                        </div>
                    </div>
                </div>
                <div class="filters">
                    <div class="field"><label>状态</label><select v-model="warningFilter.status"><option value="">全部状态</option><option value="0">待处理</option><option value="1">处理中</option><option value="2">已处理</option><option value="3">已关闭</option></select></div>
                    <div class="field"><label>预警等级</label><select v-model="warningFilter.warningLevel"><option value="">全部等级</option><option value="1">低等级</option><option value="2">中等级</option><option value="3">高等级</option></select></div>
                    <div class="field"><label>老人ID</label><input v-model="warningFilter.elderId" type="number" min="1" placeholder="老人ID"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadWarnings(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>预警等级</th><th>预警标题</th><th>老人ID</th><th>预警类型</th><th>预警值</th><th>状态</th><th>触发时间</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="warningPage.records.length===0"><td colspan="8"><div class="empty-state">暂无预警记录数据</div></td></tr>
                        <tr v-for="row in warningPage.records" :key="row.id">
                            <td><span class="tag" :class="warnLevelClass(row.warningLevel)">{{ warnLevelText(row.warningLevel) }}</span></td>
                            <td>{{ row.warningTitle }}</td>
                            <td>{{ row.elderId }}</td>
                            <td>{{ warnTypeText(row.warningType) }}</td>
                            <td>{{ row.warningValue || '-' }}</td>
                            <td><span class="tag" :class="warningStatusClass(row.status)">{{ warningStatusText(row.status) }}</span></td>
                            <td>{{ dateTimeText(row.createTime) }}</td>
                            <td><div class="actions">
                                <button class="link" v-if="row.status===0 && !isAdmin && !isNurse" @click="markWarningProcessing(row)">处理中</button>
                                <button class="link" v-if="(row.status===0 || row.status===1) && !isAdmin && !isNurse" @click="openWarningHandle(row, 'handle')">处理</button>
                                <button class="warn" v-if="row.status===0 && !isAdmin && !isNurse" @click="openWarningHandle(row, 'ignore')">忽略</button>
                                <button class="ok" v-else @click="openWarningDetail(row.id)">查看详情</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="warningPage.pages>1">
                    <button :disabled="warningPage.pageNum<=1" @click="loadWarnings(warningPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(warningPage.pageNum, warningPage.pages)" :key="'w'+p" :class="{active: p===warningPage.pageNum}" @click="loadWarnings(p)">{{ p }}</button>
                    <button :disabled="warningPage.pageNum>=warningPage.pages" @click="loadWarnings(warningPage.pageNum+1)">下一页</button>
                </div>
            </section>
            <section v-if="activeTab==='followup'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>随访计划管理</h3>
                        <p>制定和执行老人随访计划，记录每次随访结果，确保慢病管理和健康跟踪不遗漏</p>
                    </div>
                    <div class="actions">
                        <button class="danger" v-if="!isAdmin && !isNurse" @click="deleteGeneratedFollowupPlans()">清理自动生成计划</button>
                        <button class="primary-btn" v-if="!isAdmin && !isNurse" @click="openPlanModal()">+ 新增随访计划</button>
                    </div>
                </div>
                <div class="filters">
                    <div class="field"><label>状态</label><select v-model="followFilter.status"><option value="">全部状态</option><option value="0">待执行</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已关闭</option></select></div>
                    <div class="field"><label>疾病类型</label><select v-model="followFilter.diseaseType"><option value="">全部类型</option><option v-for="(text,key) in diseaseMap" :key="key" :value="key">{{ text }}</option></select></div>
                    <div class="field"><label>老人ID</label><input v-model="followFilter.elderId" type="number" min="1" placeholder="老人ID"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadFollowups(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>计划名称</th><th>老人ID</th><th>疾病类型</th><th>随访频次</th><th>下次随访日期</th><th>完成进度</th><th>状态</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="followPage.records.length===0"><td colspan="8"><div class="empty-state">暂无随访计划数据</div></td></tr>
                        <tr v-for="row in followPage.records" :key="row.id">
                            <td><strong>{{ row.planName }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td>{{ diseaseText(row.diseaseType) }}</td>
                            <td>{{ freqText(row.frequencyType) }}</td>
                            <td>{{ row.nextFollowDate || '-' }}</td>
                            <td>{{ row.completedCount || 0 }}/{{ row.totalCount || 0 }}</td>
                            <td><select class="inline-select" :value="row.status" @change="changeFollowPlanStatus(row.id, $event.target.value)"><option value="0">待执行</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已终止</option></select></td>
                            <td><div class="actions"><button class="link" @click="openFollowRecords(row)">查看记录</button><button class="link" v-if="!isAdmin && !isNurse" @click="openRecordModal(row)">记录随访结果</button><button class="link" v-if="!isAdmin && !isNurse" @click="openPlanModal(row)">编辑</button><button class="danger" v-if="!isAdmin && !isNurse" @click="deletePlan(row.id)">删除</button></div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="followPage.pages>1">
                    <button :disabled="followPage.pageNum<=1" @click="loadFollowups(followPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(followPage.pageNum, followPage.pages)" :key="'f'+p" :class="{active: p===followPage.pageNum}" @click="loadFollowups(p)">{{ p }}</button>
                    <button :disabled="followPage.pageNum>=followPage.pages" @click="loadFollowups(followPage.pageNum+1)">下一页</button>
                </div>
            </section>
            <section v-if="activeTab==='intervention'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>干预管理</h3>
                        <p>记录和执行健康干预措施，包括用药调整、生活指导、健康宣教和心理干预</p>
                    </div>
                    <div class="actions"><button class="primary-btn" v-if="!isAdmin && !isNurse" @click="openInterventionModal()">+ 新增干预记录</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>干预类型</label><select v-model="interventionFilter.type"><option value="">全部类型</option><option value="1">健康宣教</option><option value="2">用药指导</option><option value="3">康复训练</option><option value="4">心理干预</option></select></div>
                    <div class="field"><label>老人ID</label><input v-model="interventionFilter.elderId" type="number" min="1" placeholder="老人ID"></div>
                    <div class="field"><label>关联随访记录ID</label><input v-model="interventionFilter.followRecordId" type="number" min="1" placeholder="记录ID"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadInterventions(1, { notify: true })">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>干预标题</th><th>老人ID</th><th>干预类型</th><th>干预日期</th><th>效果评价</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="interventionPage.records.length===0"><td colspan="6"><div class="empty-state">{{ interventionPage.error || '暂无干预记录数据' }}</div></td></tr>
                        <tr v-for="row in interventionPage.records" :key="row.id">
                            <td><strong>{{ row.interventionTitle }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td><span class="tag" :class="interventionClass(row.interventionType)">{{ interventionText(row.interventionType) }}</span></td>
                            <td>{{ dateText(row.interventionDate) }}</td>
                            <td><span v-if="row.effectEvaluation" class="tag" :class="effectClass(row.effectEvaluation)">{{ effectText(row.effectEvaluation) }}</span><span v-else class="tag tag-default">未评价</span></td>
                            <td><div class="actions">
                                <button class="link" @click="openInterventionDetail(row)">查看详情</button>
                                <button class="ok" v-if="!isAdmin && !isNurse" @click="openInterventionModal(row)">编辑</button>
                                <button class="danger" v-if="!isAdmin && !isNurse" @click="deleteIntervention(row.id)">删除</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="interventionPage.pages>1">
                    <button :disabled="interventionPage.pageNum<=1" @click="loadInterventions(interventionPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(interventionPage.pageNum, interventionPage.pages)" :key="'i'+p" :class="{active: p===interventionPage.pageNum}" @click="loadInterventions(p)">{{ p }}</button>
                    <button :disabled="interventionPage.pageNum>=interventionPage.pages" @click="loadInterventions(interventionPage.pageNum+1)">下一页</button>
                </div>
            </section>
            <section v-if="activeTab==='profile'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>个人中心</h3>
                        <p>查看和管理个人账户信息、修改密码、查看操作日志和系统消息</p>
                    </div>
                </div>
                <div class="profile-tabs">
                    <button :class="{active: profileTab==='info'}" @click="profileTab='info'">基本信息</button>
                    <button :class="{active: profileTab==='password'}" @click="profileTab='password'">修改密码</button>
                    <button :class="{active: profileTab==='logs'}" @click="profileTab='logs'">操作日志</button>
                    <button :class="{active: profileTab==='messages'}" @click="profileTab='messages'">系统消息 <span v-if="profile.unreadCount>0">({{ profile.unreadCount }})</span></button>
                </div>
                <div v-if="profileTab==='info'" class="grid-2">
                    <div class="card list-card">
                        <div class="list-title">个人基本信息</div>
                        <div class="timeline-card"><div class="desc">用户ID</div><div>{{ profile.info.userId || profile.info.id || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">用户名</div><div>{{ profile.info.username || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">姓名</div><div>{{ profile.info.realName || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">手机号</div><div>{{ profile.info.phone || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">邮箱</div><div>{{ profile.info.email || '-' }}</div></div>
                        <div class="timeline-card">
                            <div class="desc">头像</div>
                            <div>
                                <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="头像" @error="handleProfileAvatarError" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.18);">
                                <span v-else>-</span>
                            </div>
                        </div>
                        <div class="timeline-card"><div class="desc">角色</div><div>{{ userRoleText }}</div></div>
                        <div style="margin-top:16px;" class="actions"><button class="primary-btn" @click="saveProfile">保存基本信息</button></div>
                    </div>
                    <div class="card list-card">
                        <div class="list-title">快速修改信息</div>
                        <div class="form-row" style="margin-top: 14px;">
                            <div class="field"><label>姓名</label><input v-model="profile.info.realName" placeholder="请输入新的姓名"></div>
                            <div class="field"><label>手机号</label><input v-model="profile.info.phone" placeholder="请输入11位大陆手机号"></div>
                            <div class="field"><label>邮箱</label><input v-model="profile.info.email" placeholder="请输入新的邮箱"></div>
                            <div class="field">
                                <label>头像</label>
                                <div class="actions" style="gap:10px;margin-top:0;">
                                    <button class="ghost-btn" type="button" @click="chooseAvatarFile" :disabled="avatarUploading">{{ avatarUploading ? '上传中...' : '选择头像' }}</button>
                                    <button v-if="profile.info.avatar" class="ghost-btn" type="button" @click="clearProfileAvatar">清除</button>
                                </div>
                                <input ref="avatarFileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="uploadProfileAvatar" style="display:none;">
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="profileTab==='password'" class="card list-card" style="max-width: 640px;">
                    <div class="form-row" style="grid-template-columns:1fr;">
                        <div class="field"><label>旧密码</label><input type="password" v-model="profile.pwd.oldPassword" placeholder="请输入当前使用的密码" maxlength="20" autocomplete="current-password"></div>
                        <div class="field"><label>新密码</label><input type="password" v-model="profile.pwd.newPassword" placeholder="8-20位，至少包含字母和数字" minlength="8" maxlength="20" autocomplete="new-password"></div>
                        <div class="field"><label>确认新密码</label><input type="password" v-model="profile.pwd.confirmPassword" placeholder="请再次输入相同的新密码" minlength="8" maxlength="20" autocomplete="new-password"></div>
                    </div>
                    <div style="margin-top: 16px;" class="actions"><button class="primary-btn" @click="changePassword">确认修改密码</button></div>
                </div>
                <div v-else-if="profileTab==='logs'" class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>操作时间</th><th>模块</th><th>操作类型</th><th>描述</th><th>IP</th></tr></thead>
                        <tbody>
                        <tr v-if="profile.logs.length===0"><td colspan="5"><div class="empty-state">暂无操作日志</div></td></tr>
                        <tr v-for="row in profile.logs" :key="row.id">
                            <td>{{ dateTimeText(row.createTime) }}</td><td>{{ row.module || '-' }}</td><td>{{ row.operationType || '-' }}</td><td>{{ row.description || '-' }}</td><td>{{ row.requestIp || '-' }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="grid-1">
                    <div class="actions" style="justify-content:flex-end;"><button class="soft-btn" @click="markAllMessagesRead">全部标记已读</button></div>
                    <div v-if="profile.messages.length===0" class="empty-state">暂无系统消息</div>
                    <div v-for="msg in profile.messages" :key="msg.id" class="card list-card" :style="{opacity: msg.isRead===1?0.75:1}">
                        <div class="list-head" style="margin-bottom: 0;">
                            <div>
                                <div class="list-title">{{ msg.title || '系统通知' }}</div>
                                <div class="hint">{{ dateTimeText(msg.createTime) }}</div>
                            </div>
                            <span class="tag" :class="msg.isRead===0 ? 'tag-success' : 'tag-default'">{{ msg.isRead===0 ? '未读' : '已读' }}</span>
                        </div>
                        <div style="margin-top:8px; color: var(--muted); font-size:13px;">{{ msg.content || '' }}</div>
                        <div class="actions" style="margin-top: 12px;"><button class="link" @click="markMessageRead(msg.id)">标记为已读</button></div>
                    </div>
                </div>
            </section>
            <section v-if="activeTab==='assessment'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>评估记录</h3>
                        <p>记录和管理老人的各类健康评估，包括ADL、慢病和心理评估，支持多维度评分和建议</p>
                    </div>
                    <div class="actions"><button class="primary-btn" v-if="!isAdmin && !isNurse" @click="openAssessmentModal()">+ 新增评估记录</button><button class="soft-btn" @click="openUnifiedHealthReport()">📋 综合健康报告</button><button class="soft-btn" @click="openAiReportList()">📂 查看AI评估记录</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">总评估数</div><div class="stat-value">{{ assessmentStats.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">ADL</div><div class="stat-value">{{ assessmentStats.type1 || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">慢病评估</div><div class="stat-value">{{ assessmentStats.type2 || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">AI评估</div><div class="stat-value">{{ aiAssessmentStats.count || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="assessmentFilter.elderId" type="number" min="1" placeholder="输入老人档案ID" @change="loadAiReportsForElder"></div>
                    <div class="field"><label>评估类型</label><select v-model="assessmentFilter.assessType"><option value="">全部类型</option><option v-for="(txt,key) in assessmentTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadAssessments(1);loadAiReportsForElder()">查询</button></div>
                </div>
                <div v-if="aiReportsForElder.length>0" class="table-wrap" style="margin-bottom:14px;">
                    <h4 style="margin:0 0 8px;">🤖 AI 健康评估报告</h4>
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>来源</th><th>风险分</th><th>风险等级</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
                        <tbody><tr v-for="r in aiReportsForElder" :key="'ai'+r.id">
                            <td>{{ r.id }}</td><td>{{ r.source===1?'规则引擎':'AI引擎' }}</td><td>{{ r.riskScore }}</td>
                            <td><span class="tag" :class="r.riskLevel==='CRITICAL'||r.riskLevel==='HIGH'?'tag-danger':r.riskLevel==='MEDIUM'?'tag-warning':'tag-success'">{{ aiRiskLevelTextOf(r.riskLevel) }}</span></td>
                            <td>{{ ['草稿','已确认','已驳回','已归档'][r.status]||'-' }}</td>
                            <td>{{ dateTimeText(r.createTime) }}</td>
                            <td><button class="link" @click="viewAiReport(r.id)">查看</button></td>
                        </tr></tbody>
                    </table>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>老人ID</th><th>评估类型</th><th>评估日期</th><th>评分</th><th>等级</th><th>结果</th><th>建议</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="assessmentPage.records.length===0"><td colspan="9"><div class="empty-state">暂无评估记录数据</div></td></tr>
                        <tr v-for="row in assessmentPage.records" :key="row.id">
                            <td>{{ row.id }}</td><td>{{ row.elderId }}</td><td>{{ assessmentTypeText(row.assessType) }}</td><td>{{ dateText(row.assessDate) }}</td><td>{{ row.score ?? '-' }}</td><td>{{ row.level || '-' }}</td><td>{{ row.result || '-' }}</td><td style="max-width:260px;">{{ row.suggestion || '-' }}</td>
                            <td><div class="actions">
                                <button class="link" @click="openAssessmentDetail(row.id)">查看详情</button>
                                <button class="ok" v-if="!isAdmin && !isNurse" @click="openAssessmentModal(row)">编辑</button>
                                <button class="danger" v-if="!isAdmin && !isNurse" @click="deleteAssessment(row.id)">删除</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="assessmentPage.pages>1">
                    <button :disabled="assessmentPage.pageNum<=1" @click="loadAssessments(assessmentPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(assessmentPage.pageNum, assessmentPage.pages)" :key="'a'+p" :class="{active: p===assessmentPage.pageNum}" @click="loadAssessments(p)">{{ p }}</button>
                    <button :disabled="assessmentPage.pageNum>=assessmentPage.pages" @click="loadAssessments(assessmentPage.pageNum+1)">下一页</button>
                </div>
            </section>
            <section v-if="activeTab==='admin-ai-config'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>🤖 AI 健康评估 — 管理员配置</h3>
                        <p>配置 AI API Key 及模型参数，支持 Mock 模式用于开发测试</p>
                    </div>
                    <div class="actions">
                        <button class="soft-btn" @click="loadAiConfig()">🔄 刷新配置</button>
                        <button class="primary-btn" @click="saveAiConfig()">💾 保存配置</button>
                    </div>
                </div>
                <div v-if="aiConfig.loading" class="empty-state">加载中...</div>
                <div v-else style="max-width:640px;">
                    <div class="form-row" style="margin-bottom:12px; grid-template-columns:1fr;">
                        <div class="field">
                            <label>API Key</label>
                            <input v-model="aiConfig.form.apiKey" type="password" placeholder="sk-xxxxxxxxxxxxxxxx" style="font-family:monospace;">
                            <span class="hint">可通过环境变量注入，或在此处直接填写</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="field"><label>API 地址</label><input v-model="aiConfig.form.baseUrl" placeholder="https://open.bigmodel.cn/api/paas/v4/chat/completions"></div>
                        <div class="field"><label>模型</label><input v-model="aiConfig.form.model" placeholder="glm-4.7-flash"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px;">
                        <div class="field"><label>每日限制（次/医生）</label><input v-model.number="aiConfig.form.maxPerDay" type="number" min="1"></div>
                        <div class="field"><label>超时（秒）</label><input v-model.number="aiConfig.form.timeoutSeconds" type="number" min="1"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px;">
                        <div class="field"><label>重试次数</label><input v-model.number="aiConfig.form.maxRetries" type="number" min="1"></div>
                        <div class="field" style="align-self:end;">
                            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                                <input type="checkbox" v-model="aiConfig.form.mockEnabled" style="width:auto;">
                                Mock 模式（开发测试用，不消耗 API 额度）
                            </label>
                        </div>
                    </div>
                    <div v-if="aiConfig.saved" class="tag tag-success" style="margin-top:12px;display:inline-block;">✅ 配置已保存</div>
                </div>
            </section>
            <section v-if="activeTab==='referral'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>转诊协同</h3>
                        <p>实现上下级医疗机构间的双向转诊，支持紧急程度分级和床位预留管理</p>
                    </div>
                    <div class="actions"><button class="primary-btn" v-if="!isNurse" @click="openReferralModal()">+ 新建转诊</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">待接收</div><div class="stat-value">{{ referralStats.pending || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">处理中</div><div class="stat-value">{{ referralStats.processing || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">已完成</div><div class="stat-value">{{ referralStats.completed || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">上转 / 下转</div><div class="stat-value">{{ referralStats.upCount || 0 }} / {{ referralStats.downCount || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>责任医生ID</label><input v-model="referralFilter.doctorId" type="number" min="1" placeholder="输入责任医生ID"></div>
                    <div class="field"><label>状态</label><select v-model="referralFilter.status"><option value="">全部状态</option><option v-for="(txt,key) in referralStatusMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field"><label>转诊类型</label><select v-model="referralFilter.referralType"><option value="">全部类型</option><option v-for="(txt,key) in referralTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadReferrals(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>转诊编号</th><th>老人ID</th><th>转诊类型</th><th>转出机构</th><th>转入机构</th><th>状态</th><th>紧急程度</th><th>创建时间</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="referralPage.records.length===0"><td colspan="9"><div class="empty-state">暂无转诊记录数据</div></td></tr>
                        <tr v-for="row in referralPage.records" :key="row.id">
                            <td>{{ row.referralNo || row.id }}</td><td>{{ row.elderId }}</td><td>{{ referralTypeText(row.referralType) }}</td><td>{{ row.fromOrg || '-' }}</td><td>{{ row.toOrg || '-' }}</td>
                            <td><span class="tag" :class="row.status===3?'tag-success':row.status===0?'tag-warning':row.status===4?'tag-danger':'tag-info'">{{ referralStatusText(row.status) }}</span></td>
                            <td>{{ urgencyText(row.urgencyLevel) }}</td><td>{{ dateTimeText(row.createTime) }}</td>
                            <td><div class="actions">
                                <button class="link" @click="openReferralDetail(row.id)">查看详情</button>
                                <button v-if="Number(row.status)===0 && !isNurse" class="ok" @click="acceptReferral(row.id)">接收</button>
                                <button v-if="[0,1].includes(Number(row.status)) && !isNurse" class="warn" @click="openReferralAction(row,'reject')">拒绝</button>
                                <button v-if="[1,2].includes(Number(row.status)) && !isNurse" class="ok" @click="openReferralAction(row,'complete')">完成</button>
                                <button v-if="[0,1].includes(Number(row.status)) && !isNurse" class="danger" @click="cancelReferral(row.id)">取消</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="referralPage.pages>1">
                    <button :disabled="referralPage.pageNum<=1" @click="loadReferrals(referralPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(referralPage.pageNum, referralPage.pages)" :key="'r'+p" :class="{active: p===referralPage.pageNum}" @click="loadReferrals(p)">{{ p }}</button>
                    <button :disabled="referralPage.pageNum>=referralPage.pages" @click="loadReferrals(referralPage.pageNum+1)">下一页</button>
                </div>
            </section>
            <section v-if="activeTab==='vitals'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>生命体征监测</h3>
                        <p>实时查看老人血压、血糖、体温、心率等体征数据，支持趋势图表和设备绑定管理</p>
                    </div>
                    <div class="actions"><button class="primary-btn" @click="openDeviceModal()">+ 新增绑定设备</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="vitalsState.elderId" type="number" min="1" placeholder="输入老人档案ID"></div>
                    <div class="field"><label>监测指标</label><select v-model.number="vitalsState.metric"><option v-for="(txt,key) in vitalTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                    <div class="field"><label>开始日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="vitalsState.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="vitalsState.endDate" type="date"></div>
                    <div class="field"><label>模拟数据天数</label><input v-model.number="vitalsState.mockDays" type="number" min="1" max="365"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadVitals">查询</button></div>
                    <div class="field" style="align-self:end;"><button class="soft-btn" @click="generateMockVitals">生成模拟数据</button></div>
                </div>
                <div class="grid-2">
                    <div class="card list-card">
                        <div class="list-head"><div><div class="list-title">趋势变化图</div><div class="hint">选择指标和时间范围后点击查询，图表将展示变化趋势</div></div></div>
                        <div id="trendChart" class="chart-box"></div>
                    </div>
                    <div class="card list-card">
                        <div class="list-title">最新监测数据</div>
                        <div v-if="vitalsState.latest.length===0" class="empty-state" style="margin-top:14px;">请先输入老人ID并查询数据</div>
                        <div v-else>
                            <div v-for="item in vitalsState.latest" :key="item.metric" class="timeline-card">
                                <div>
                                    <div class="title">{{ vitalKeyText(item.metric) }}</div>
                                    <div class="desc">{{ item.value?.measureTime ? dateTimeText(item.value.measureTime) : '-' }}</div>
                                </div>
                                <div style="text-align:right;">
                                    <div class="title">{{ item.value?.dataValue ?? item.value?.value ?? '-' }} {{ item.value?.unit || '' }}</div>
                                    <div class="desc" v-if="item.value?.isAbnormal===1">异常</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:18px;" class="card list-card">
                    <div class="list-head"><div><div class="list-title">绑定设备列表</div><div class="hint">管理老人档案关联的监测设备，查看绑定状态</div></div></div>
                    <div class="table-wrap">
                        <table class="data-table">
                            <thead><tr><th>ID</th><th>设备名称</th><th>设备类型</th><th>设备序列号</th><th>绑定状态</th><th>绑定时间</th><th>操作</th></tr></thead>
                            <tbody>
                            <tr v-if="vitalsState.devices.length===0"><td colspan="7"><div class="empty-state">暂无绑定设备</div></td></tr>
                            <tr v-for="row in vitalsState.devices" :key="row.id">
                                <td>{{ row.id }}</td><td>{{ row.deviceName || '-' }}</td><td>{{ deviceTypeText(row.deviceType) }}</td><td>{{ row.deviceSn || '-' }}</td>
                                <td><span class="tag" :class="Number(row.bindStatus)===1?'tag-success':'tag-default'">{{ Number(row.bindStatus)===1 ? '已绑定' : '未绑定' }}</span></td>
                                <td>{{ dateTimeText(row.bindTime) }}</td>
                                <td><div class="actions"><button class="danger" v-if="Number(row.bindStatus)===1" @click="unbindDevice(row.id)">解绑</button></div></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <section v-if="activeTab==='timeline'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>服务时间线</h3>
                        <p>汇总展示老人的所有服务事件，包括评估、随访、预警处理、转诊、干预和体征记录</p>
                    </div>
                    <div class="actions"><button class="primary-btn" @click="loadTimeline(1)">查询</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="timelineFilter.elderId" type="number" min="1" placeholder="输入老人档案ID"></div>
                    <div class="field"><label>事件类型</label><select v-model="timelineFilter.eventType"><option value="">全部类型</option><option v-for="(txt,key) in timelineTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field"><label>开始日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="timelineFilter.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="timelineFilter.endDate" type="date"></div>
                </div>
                <div class="panel-grid" style="margin:14px 0;">
                    <div class="card stat-card"><div class="stat-label">总事件数</div><div class="stat-value">{{ timelineSummary.total || 0 }}</div></div>
                    <div class="card stat-card" v-for="item in timelineSummaryCards" :key="'tls'+item.key">
                        <div class="stat-label">{{ item.label }}</div>
                        <div class="stat-value">{{ item.count || 0 }}</div>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>时间</th><th>类型</th><th>标题</th><th>内容</th><th>来源</th></tr></thead>
                        <tbody>
                        <tr v-if="timelinePage.records.length===0"><td colspan="5"><div class="empty-state">暂无时间线事件数据</div></td></tr>
                        <tr v-for="row in timelinePage.records" :key="row.id">
                            <td>{{ dateTimeText(row.eventTime) }}</td><td><span class="tag tag-info">{{ timelineTypeText(row.eventType) }}</span></td><td>{{ row.eventTitle || '-' }}</td><td style="max-width:360px;">{{ row.eventContent || '-' }}</td><td>{{ row.sourceType || '-' }} / {{ row.sourceId || '-' }}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="timelinePage.pages>1">
                    <button :disabled="timelinePage.pageNum<=1" @click="loadTimeline(timelinePage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(timelinePage.pageNum, timelinePage.pages)" :key="'t'+p" :class="{active: p===timelinePage.pageNum}" @click="loadTimeline(p)">{{ p }}</button>
                    <button :disabled="timelinePage.pageNum>=timelinePage.pages" @click="loadTimeline(timelinePage.pageNum+1)">下一页</button>
                </div>
            </section>

            <!-- ====== 管理员工作台 ====== -->
            <section v-if="activeTab==='admin-dashboard'" class="grid-1">
                <div class="panel-grid">
                    <div class="card stat-card">
                        <div class="stat-label">用户总数</div>
                        <div class="stat-value">{{ adminDashboard.stats.userTotal || 0 }}</div>
                        <div class="stat-sub">管理员 {{ adminDashboard.stats.adminCount || 1 }} · 医生 {{ adminDashboard.stats.doctorCount || 0 }} · 护士 {{ adminDashboard.stats.nurseCount || 0 }}</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">老人档案总数</div>
                        <div class="stat-value">{{ adminDashboard.stats.elderTotal || 0 }}</div>
                        <div class="stat-sub">男 {{ adminDashboard.stats.elderMale || 0 }} · 女 {{ adminDashboard.stats.elderFemale || 0 }}</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">待处理预警</div>
                        <div class="stat-value">{{ adminDashboard.stats.warningPending || 0 }}</div>
                        <div class="stat-sub">今日新增 {{ adminDashboard.stats.warningToday || 0 }} · 累计 {{ adminDashboard.stats.warningTotal || 0 }}</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">进行中随访</div>
                        <div class="stat-value">{{ adminDashboard.stats.followupActive || 0 }}</div>
                        <div class="stat-sub">累计随访计划 {{ adminDashboard.stats.followupTotal || 0 }} 条</div>
                    </div>
                </div>

                <div class="panel-grid">
                    <div class="card stat-card">
                        <div class="stat-label">干预记录</div>
                        <div class="stat-value">{{ adminDashboard.stats.interventionTotal || 0 }}</div>
                        <div class="stat-sub">覆盖健康宣教、用药、康复等类型</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">评估记录</div>
                        <div class="stat-value">{{ adminDashboard.stats.assessmentTotal || 0 }}</div>
                        <div class="stat-sub">健康、慢病、心理、营养等评估</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">转诊单</div>
                        <div class="stat-value">{{ adminDashboard.stats.referralTotal || 0 }}</div>
                        <div class="stat-sub">上下级机构双向协同</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">体检记录</div>
                        <div class="stat-value">{{ adminDashboard.stats.examTotal || 0 }}</div>
                        <div class="stat-sub">年度体检与异常追踪</div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">老人性别分布</div><div class="hint">全部档案的性别构成</div></div>
                        </div>
                        <div id="adminGenderChart" class="chart-box"></div>
                    </div>
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">用户角色分布</div><div class="hint">管理员 / 医生 / 护士 数量</div></div>
                        </div>
                        <div id="adminRoleChart" class="chart-box"></div>
                    </div>
                </div>

                <div class="card list-card">
                    <div class="list-head">
                        <div><div class="list-title">业务模块累计数据</div><div class="hint">各业务模块累计生成的记录量</div></div>
                    </div>
                    <div id="adminBizChart" class="chart-box" style="height:300px;"></div>
                </div>

                <div class="grid-2">
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">最新待处理预警</div><div class="hint">状态为「待处理」的最近 6 条</div></div>
                            <button class="soft-btn" @click="switchTab('warnings')">进入预警中心</button>
                        </div>
                        <div v-if="adminDashboard.latestWarnings.length===0" class="empty-state">暂无待处理预警</div>
                        <div v-else>
                            <div class="timeline-card" v-for="item in adminDashboard.latestWarnings" :key="'aw'+item.id">
                                <div>
                                    <div class="title">{{ item.warningTitle }}</div>
                                    <div class="desc">{{ warnTypeText(item.warningType) }} · {{ dateTimeText(item.createTime) }}</div>
                                </div>
                                <span class="tag" :class="warnLevelClass(item.warningLevel)">{{ warnLevelText(item.warningLevel) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">最新转诊记录</div><div class="hint">最近发起的 6 条转诊申请</div></div>
                            <button class="soft-btn" @click="switchTab('referral')">查看全部</button>
                        </div>
                        <div v-if="adminDashboard.latestReferrals.length===0" class="empty-state">暂无转诊记录</div>
                        <div v-else>
                            <div class="timeline-card" v-for="item in adminDashboard.latestReferrals" :key="'ar'+item.id">
                                <div>
                                    <div class="title">{{ item.referralNo || ('转诊 #' + item.id) }}</div>
                                    <div class="desc">{{ referralTypeText(item.referralType) }} · {{ item.fromOrg || '-' }} → {{ item.toOrg || '-' }}</div>
                                </div>
                                <span class="tag" :class="'tag-info'">{{ referralStatusText(item.status) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card list-card">
                    <div class="list-head">
                        <div><div class="list-title">快捷入口</div><div class="hint">跳转到常用管理页面</div></div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;">
                        <button class="soft-btn" @click="switchTab('elders')">老人档案</button>
                        <button class="soft-btn" @click="switchTab('warnings')">预警中心</button>
                        <button class="soft-btn" @click="switchTab('followup')">随访计划</button>
                        <button class="soft-btn" @click="switchTab('intervention')">干预管理</button>
                        <button class="soft-btn" @click="switchTab('assessment')">评估记录</button>
                        <button class="soft-btn" @click="switchTab('referral')">转诊协同</button>
                        <button class="soft-btn" @click="switchTab('vitals')">生命体征</button>
                        <button class="soft-btn" @click="switchTab('exam')">体检管理</button>
                        <button class="soft-btn" @click="switchTab('timeline')">服务时间线</button>
                        <button class="soft-btn" @click="switchTab('profile')">个人中心</button>
                    </div>
                </div>
            </section>

            <!-- ====== 护士工作台 ====== -->
            <section v-if="activeTab==='nurse-dashboard'" class="grid-1">
                <div class="panel-grid">
                    <div class="card stat-card">
                        <div class="stat-label">今日护理记录</div>
                        <div class="stat-value">{{ nurseDashboard.stats.todayRecords || 0 }}</div>
                        <div class="stat-sub">今日已录入的护理记录数量</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">进行中计划</div>
                        <div class="stat-value">{{ nurseDashboard.stats.activePlans || 0 }}</div>
                        <div class="stat-sub">当前执行中的护理计划数量</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">待处理异常</div>
                        <div class="stat-value">{{ nurseDashboard.stats.pendingReports || 0 }}</div>
                        <div class="stat-sub">需上报医生的异常护理记录</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-label">老人总数</div>
                        <div class="stat-value">{{ nurseDashboard.stats.totalElders || 0 }}</div>
                        <div class="stat-sub">当前平台管理的老人档案数量</div>
                    </div>
                </div>
                <div class="grid-2">
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">今日护理记录</div><div class="hint">最近 5 条今日录入的护理记录</div></div>
                            <button class="soft-btn" @click="switchTab('nurse-records')">查看全部</button>
                        </div>
                        <div v-if="nurseDashboard.todayRecords.length===0" class="empty-state">今日暂无护理记录</div>
                        <div v-else>
                            <div class="timeline-card" v-for="item in nurseDashboard.todayRecords" :key="item.id">
                                <div>
                                    <div class="title">{{ item.recordTitle }}</div>
                                    <div class="desc">{{ recordTypeText(item.recordType) }} · {{ dateTimeText(item.recordDate) }}</div>
                                </div>
                                <span class="tag" :class="item.isAbnormal===1?'tag-danger':'tag-success'">{{ item.isAbnormal===1?'异常':'正常' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card list-card">
                        <div class="list-head">
                            <div><div class="list-title">进行中的护理计划</div><div class="hint">最近 5 条执行中的护理计划</div></div>
                            <button class="soft-btn" @click="switchTab('nurse-plans')">查看全部</button>
                        </div>
                        <div v-if="nurseDashboard.activePlans.length===0" class="empty-state">暂无进行中的护理计划</div>
                        <div v-else>
                            <div class="timeline-card" v-for="item in nurseDashboard.activePlans" :key="item.id">
                                <div>
                                    <div class="title">{{ item.planName }}</div>
                                    <div class="desc">{{ planTypeText(item.planType) }} · 进度 {{ item.completedCount || 0 }}/{{ item.totalCount || 0 }}</div>
                                </div>
                                <span class="tag tag-success">进行中</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ====== 护理记录列表 ====== -->
            <section v-if="activeTab==='nurse-records'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>护理记录管理</h3>
                        <p>记录和管理老人的日常护理信息，支持异常情况上报给医生处理</p>
                    </div>
                    <div class="actions"><button class="primary-btn" @click="openNurseRecordModal()">+ 新增护理记录</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">总记录</div><div class="stat-value">{{ nurseRecordStats.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">今日</div><div class="stat-value">{{ nurseRecordStats.todayCount || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">异常</div><div class="stat-value">{{ nurseRecordStats.abnormal || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">已上报</div><div class="stat-value">{{ nurseRecordStats.reported || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="nurseRecordFilter.elderId" type="number" min="1" placeholder="老人ID"></div>
                    <div class="field"><label>记录类型</label><select v-model="nurseRecordFilter.recordType"><option value="">全部类型</option><option v-for="(txt,key) in recordTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field"><label>上报状态</label><select v-model="nurseRecordFilter.reportStatus"><option value="">全部</option><option value="0">未上报</option><option value="1">已上报</option><option value="2">已处理</option></select></div>
                    <div class="field"><label>开始日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="nurseRecordFilter.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="nurseRecordFilter.endDate" type="date"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadNurseRecords(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>记录标题</th><th>老人ID</th><th>记录类型</th><th>护理日期</th><th>是否异常</th><th>上报状态</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="nurseRecordPage.records.length===0"><td colspan="7"><div class="empty-state">暂无护理记录数据</div></td></tr>
                        <tr v-for="row in nurseRecordPage.records" :key="row.id">
                            <td><strong>{{ row.recordTitle }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td><span class="tag tag-info">{{ recordTypeText(row.recordType) }}</span></td>
                            <td>{{ dateText(row.recordDate) }}</td>
                            <td><span class="tag" :class="row.isAbnormal===1?'tag-danger':'tag-success'">{{ row.isAbnormal===1?'异常':'正常' }}</span></td>
                            <td><span class="tag" :class="row.reportStatus===0?'tag-default':row.reportStatus===1?'tag-warning':'tag-success'">{{ row.reportStatus===0?'未上报':row.reportStatus===1?'已上报':'已处理' }}</span></td>
                            <td><div class="actions">
                                <button class="link" @click="openNurseRecordDetail(row)">详情</button>
                                <button class="ok" v-if="row.reportStatus===0" @click="openNurseRecordModal(row)">编辑</button>
                                <button class="warn" v-if="row.isAbnormal===0||row.reportStatus===0" @click="reportNurseRecord(row.id)">上报异常</button>
                                <button class="danger" v-if="row.reportStatus===0" @click="deleteNurseRecord(row.id)">删除</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="nurseRecordPage.pages>1">
                    <button :disabled="nurseRecordPage.pageNum<=1" @click="loadNurseRecords(nurseRecordPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(nurseRecordPage.pageNum, nurseRecordPage.pages)" :key="'nr'+p" :class="{active: p===nurseRecordPage.pageNum}" @click="loadNurseRecords(p)">{{ p }}</button>
                    <button :disabled="nurseRecordPage.pageNum>=nurseRecordPage.pages" @click="loadNurseRecords(nurseRecordPage.pageNum+1)">下一页</button>
                </div>
            </section>

            <!-- ====== 护理计划列表 ====== -->
            <section v-if="activeTab==='nurse-plans'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>护理计划管理</h3>
                        <p>制定和执行老人的个性化护理计划，跟踪护理进度和效果评价</p>
                    </div>
                    <div class="actions"><button class="primary-btn" @click="openNursePlanModal()">+ 新增护理计划</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">总计划</div><div class="stat-value">{{ nursePlanStats.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">待执行</div><div class="stat-value">{{ nursePlanStats.pending || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">进行中</div><div class="stat-value">{{ nursePlanStats.active || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">已完成</div><div class="stat-value">{{ nursePlanStats.completed || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="nursePlanFilter.elderId" type="number" min="1" placeholder="老人ID"></div>
                    <div class="field"><label>计划类型</label><select v-model="nursePlanFilter.planType"><option value="">全部类型</option><option v-for="(txt,key) in planTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field"><label>状态</label><select v-model="nursePlanFilter.status"><option value="">全部状态</option><option value="0">待执行</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已终止</option></select></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadNursePlans(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>计划名称</th><th>老人ID</th><th>计划类型</th><th>开始日期</th><th>进度</th><th>状态</th><th>医生审核</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="nursePlanPage.records.length===0"><td colspan="8"><div class="empty-state">暂无护理计划数据</div></td></tr>
                        <tr v-for="row in nursePlanPage.records" :key="row.id">
                            <td><strong>{{ row.planName }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td><span class="tag tag-info">{{ planTypeText(row.planType) }}</span></td>
                            <td>{{ row.startDate || '-' }}</td>
                            <td>{{ row.completedCount || 0 }}/{{ row.totalCount || 0 }}</td>
                            <td><span class="tag" :class="row.status===1?'tag-success':row.status===0?'tag-warning':row.status===2?'tag-info':'tag-default'">{{ nursePlanStatusText(row.status) }}</span></td>
                            <td><span class="tag" :class="row.doctorApproval===0?'tag-default':row.doctorApproval===1?'tag-success':'tag-danger'">{{ row.doctorApproval===0?'待审核':row.doctorApproval===1?'已通过':'已驳回' }}</span></td>
                            <td><div class="actions">
                                <button class="link" @click="openNursePlanDetail(row)">详情</button>
                                <button class="ok" v-if="row.status===0||row.status===1" @click="openNursePlanModal(row)">编辑</button>
                                <button class="primary-btn" v-if="row.status===0" @click="startNursePlan(row.id)" style="font-size:12px;padding:4px 10px;">开始执行</button>
                                <button class="ok" v-if="row.status===1" @click="incrementNursePlan(row.id)" style="font-size:12px;padding:4px 10px;">完成一次</button>
                                <button class="danger" v-if="row.status===0||row.status===1" @click="deleteNursePlan(row.id)">删除</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="nursePlanPage.pages>1">
                    <button :disabled="nursePlanPage.pageNum<=1" @click="loadNursePlans(nursePlanPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(nursePlanPage.pageNum, nursePlanPage.pages)" :key="'np'+p" :class="{active: p===nursePlanPage.pageNum}" @click="loadNursePlans(p)">{{ p }}</button>
                    <button :disabled="nursePlanPage.pageNum>=nursePlanPage.pages" @click="loadNursePlans(nursePlanPage.pageNum+1)">下一页</button>
                </div>
            </section>

            <!-- ====== 体检管理 ====== -->
            <section v-if="activeTab==='exam'" class="card section">
                <div class="section-head">
                    <div><h3>体检管理</h3><p>管理老人的体检记录，查看各指标变化趋势和异常标记</p></div>
                    <div class="actions"><button class="primary-btn" v-if="!isAdmin" @click="openExamModal()">+ 新增体检记录</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">总记录</div><div class="stat-value">{{ examStats.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">今年体检</div><div class="stat-value">{{ examStats.thisYear || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">异常项</div><div class="stat-value">{{ examStats.abnormal || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="examFilter.elderId" type="number" min="1" placeholder="老人档案ID"></div>
                    <div class="field"><label>开始日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="examFilter.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" v-model="examFilter.endDate" type="date"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadExams(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>老人ID</th><th>体检日期</th><th>身高</th><th>体重</th><th>BMI</th><th>血压</th><th>空腹血糖</th><th>心率</th><th>异常</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="examPage.records.length===0"><td colspan="10"><div class="empty-state">暂无体检数据，请先新增体检记录</div></td></tr>
                        <tr v-for="row in examPage.records" :key="row.id">
                            <td>{{ row.elderId }}</td>
                            <td>{{ row.examDate || '-' }}</td>
                            <td>{{ row.height ?? '-' }}cm</td>
                            <td>{{ row.weight ?? '-' }}kg</td>
                            <td>{{ row.bmi ?? '-' }}</td>
                            <td>{{ row.systolicPressure ?? '-' }}/{{ row.diastolicPressure ?? '-' }}</td>
                            <td>{{ row.bloodSugarFasting ?? '-' }}</td>
                            <td>{{ row.heartRate ?? '-' }}</td>
                            <td><span class="tag" :class="row.abnormalFlag===1?'tag-danger':'tag-success'">{{ row.abnormalFlag===1?'异常':'正常' }}</span></td>
                            <td><div class="actions">
                                <button class="link" @click="openExamDetail(row)">详情</button>
                                <button class="ok" v-if="!isAdmin" @click="openExamModal(row)">编辑</button>
                                <button class="danger" v-if="!isAdmin && !isNurse" @click="deleteExam(row.id)">删除</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="pager" v-if="examPage.pages>1">
                    <button :disabled="examPage.pageNum<=1" @click="loadExams(examPage.pageNum-1)">上一页</button>
                    <button v-for="p in pageWindow(examPage.pageNum, examPage.pages)" :key="'ex'+p" :class="{active: p===examPage.pageNum}" @click="loadExams(p)">{{ p }}</button>
                    <button :disabled="examPage.pageNum>=examPage.pages" @click="loadExams(examPage.pageNum+1)">下一页</button>
                </div>
            </section>

            <!-- ====== 护士审核 ====== -->
            <section v-if="activeTab==='review'" class="card section">
                <div class="section-head">
                    <div><h3>护士工作审核</h3><p>审核护士提交的异常护理记录和护理计划，形成医护协作闭环</p></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">待审护理记录</div><div class="stat-value" :style="{color:reviewStats.pendingRecords>0?'#e6a23c':'#67c23a'}">{{ reviewStats.pendingRecords || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">待审护理计划</div><div class="stat-value" :style="{color:reviewStats.pendingPlans>0?'#e6a23c':'#67c23a'}">{{ reviewStats.pendingPlans || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">已审记录</div><div class="stat-value">{{ reviewStats.reviewedRecords || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">已通过计划</div><div class="stat-value">{{ reviewStats.approvedPlans || 0 }}</div></div>
                </div>
                <div class="profile-tabs" style="margin-bottom:16px;">
                    <button :class="{active: reviewFilter.tab==='records'}" @click="reviewFilter.tab='records';loadReviewRecords(1)">待审核护理记录</button>
                    <button :class="{active: reviewFilter.tab==='plans'}" @click="reviewFilter.tab='plans';loadReviewPlans(1)">待审核护理计划</button>
                </div>
                <!-- 待审核护理记录 -->
                <div v-if="reviewFilter.tab==='records'" class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>记录标题</th><th>老人ID</th><th>记录类型</th><th>护理日期</th><th>异常描述</th><th>上报时间</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="reviewRecordsPage.records.length===0"><td colspan="7"><div class="empty-state">暂无待审核的护理记录</div></td></tr>
                        <tr v-for="row in reviewRecordsPage.records" :key="row.id">
                            <td><strong>{{ row.recordTitle }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td><span class="tag tag-info">{{ recordTypeText(row.recordType) }}</span></td>
                            <td>{{ dateText(row.recordDate) }}</td>
                            <td style="max-width:200px;">{{ row.abnormalDesc || '-' }}</td>
                            <td>{{ dateTimeText(row.createTime) }}</td>
                            <td><div class="actions">
                                <button class="link" @click="openReviewRecordDetail(row)">查看</button>
                                <button class="ok" v-if="!isAdmin && !isNurse" @click="approveReviewRecord(row.id)">通过</button>
                                <button class="danger" v-if="!isAdmin && !isNurse" @click="rejectReviewRecord(row.id)">驳回</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                    <div class="pager" v-if="reviewRecordsPage.pages>1" style="margin-top:16px;">
                        <button :disabled="reviewRecordsPage.pageNum<=1" @click="loadReviewRecords(reviewRecordsPage.pageNum-1)">上一页</button>
                        <button v-for="p in pageWindow(reviewRecordsPage.pageNum, reviewRecordsPage.pages)" :key="'rr'+p" :class="{active: p===reviewRecordsPage.pageNum}" @click="loadReviewRecords(p)">{{ p }}</button>
                        <button :disabled="reviewRecordsPage.pageNum>=reviewRecordsPage.pages" @click="loadReviewRecords(reviewRecordsPage.pageNum+1)">下一页</button>
                    </div>
                </div>
                <!-- 待审核护理计划 -->
                <div v-if="reviewFilter.tab==='plans'" class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>计划名称</th><th>老人ID</th><th>计划类型</th><th>开始日期</th><th>护理目标</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="reviewPlansPage.records.length===0"><td colspan="6"><div class="empty-state">暂无待审核的护理计划</div></td></tr>
                        <tr v-for="row in reviewPlansPage.records" :key="row.id">
                            <td><strong>{{ row.planName }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td><span class="tag tag-info">{{ planTypeText(row.planType) }}</span></td>
                            <td>{{ row.startDate || '-' }}</td>
                            <td style="max-width:260px;">{{ row.nursingGoal || '-' }}</td>
                            <td><div class="actions">
                                <button class="link" @click="openReviewPlanDetail(row)">查看</button>
                                <button class="ok" v-if="!isAdmin && !isNurse" @click="approveReviewPlan(row.id)">通过</button>
                                <button class="danger" v-if="!isAdmin && !isNurse" @click="rejectReviewPlan(row.id)">驳回</button>
                            </div></td>
                        </tr>
                        </tbody>
                    </table>
                    <div class="pager" v-if="reviewPlansPage.pages>1" style="margin-top:16px;">
                        <button :disabled="reviewPlansPage.pageNum<=1" @click="loadReviewPlans(reviewPlansPage.pageNum-1)">上一页</button>
                        <button v-for="p in pageWindow(reviewPlansPage.pageNum, reviewPlansPage.pages)" :key="'rp'+p" :class="{active: p===reviewPlansPage.pageNum}" @click="loadReviewPlans(p)">{{ p }}</button>
                        <button :disabled="reviewPlansPage.pageNum>=reviewPlansPage.pages" @click="loadReviewPlans(reviewPlansPage.pageNum+1)">下一页</button>
                    </div>
                </div>
            </section>

            </div>
            </transition>
        </main>
    </div>
    <div v-if="modal" class="modal-mask" @click.self="closeModal">
        <div class="modal" :class="modalWidth">
            <div class="modal-head"><h4>{{ modalTitle }}</h4><button class="ghost-btn" @click="closeModal">关闭</button></div>
            <div class="modal-body">
                <template v-if="modal==='elder'">
                    <div class="form-row">
                        <div class="field"><label>姓名</label><input v-model="elderForm.name" placeholder="请输入姓名"></div>
                        <div class="field"><label>性别</label><select v-model.number="elderForm.gender"><option :value="1">男</option><option :value="2">女</option></select></div>
                        <div class="field"><label>出生日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="elderForm.birthDate"></div>
                        <div class="field"><label>身份证号</label><input v-model="elderForm.idCard" maxlength="18"></div>
                        <div class="field"><label>联系电话</label><input v-model="elderForm.phone"></div>
                        <div class="field"><label>所属社区</label><input v-model="elderForm.community"></div>
                        <div class="field"><label>紧急联系人</label><input v-model="elderForm.emergencyContact"></div>
                        <div class="field"><label>紧急联系电话</label><input v-model="elderForm.emergencyPhone"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>详细地址</label><input v-model="elderForm.address"></div></div>
                </template>
                <template v-else-if="modal==='warning'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input type="number" min="1" v-model.number="warningForm.elderId"></div>
                        <div class="field"><label>预警等级</label><select v-model.number="warningForm.warningLevel"><option :value="1">低等级</option><option :value="2">中等级</option><option :value="3">高等级</option></select></div>
                        <div class="field"><label>预警类型</label><select v-model.number="warningForm.warningType"><option v-for="(txt,key) in warnTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>预警标题</label><input v-model="warningForm.warningTitle"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>预警内容</label><textarea v-model="warningForm.warningContent"></textarea></div></div>
                </template>
                <template v-else-if="modal==='warning-handle'">
                    <div class="form-row">
                        <div class="field"><label>操作</label><input :value="modalData.action==='handle'?'处理':'查看'" disabled></div>
                        <div class="field"><label>老人ID</label><input :value="modalData.item?.elderId || '-'" disabled></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>处理意见</label><textarea v-model="warningForm.handleResult" placeholder="请填写处理意见或查看详细信息"></textarea></div></div>
                </template>
                <template v-else-if="modal==='plan'">
                    <div class="form-row">
                        <div class="field"><label>计划名称</label><input v-model="planForm.planName"></div>
                        <div class="field"><label>老人ID</label><input type="number" min="1" v-model.number="planForm.elderId"></div>
                        <div class="field"><label>疾病类型</label><select v-model.number="planForm.diseaseType"><option v-for="(txt,key) in diseaseMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>随访频次</label><select v-model.number="planForm.frequencyType"><option v-for="(txt,key) in freqMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>开始日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="planForm.startDate"></div>
                        <div class="field"><label>总次数</label><input type="number" min="1" v-model.number="planForm.totalCount"></div>
                        <div class="field"><label>随访状态</label><select v-model.number="planForm.status"><option :value="0">待执行</option><option :value="1">进行中</option><option :value="2">已完成</option><option :value="3">已终止</option></select></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>备注</label><textarea v-model="planForm.remark"></textarea></div></div>
                </template>
                <template v-else-if="modal==='record'">
                    <div class="form-row">
                        <div class="field"><label>随访计划ID</label><input v-model="followRecordForm.planId" disabled></div>
                        <div class="field"><label>老人ID</label><input v-model="followRecordForm.elderId" disabled></div>
                        <div class="field"><label>随访方式</label><select v-model.number="followRecordForm.followType"><option v-for="(txt,key) in followTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>随访日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="datetime-local" v-model="followRecordForm.followDate"></div>
                        <div class="field"><label>收缩压</label><input type="number" min="60" max="240" v-model.number="followRecordForm.systolicPressure"></div>
                        <div class="field"><label>舒张压</label><input type="number" min="40" max="140" v-model.number="followRecordForm.diastolicPressure"></div>
                        <div class="field"><label>心率</label><input type="number" min="30" max="180" v-model.number="followRecordForm.heartRate"></div>
                        <div class="field"><label>空腹血糖</label><input type="number" min="2" max="30" step="0.1" v-model.number="followRecordForm.bloodSugarFasting"></div>
                        <div class="field"><label>体重</label><input type="number" min="20" max="200" step="0.1" v-model.number="followRecordForm.weight"></div>
                        <div class="field"><label>下次随访日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="followRecordForm.nextFollowDate"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>随访结果</label><textarea v-model="followRecordForm.followResult"></textarea></div></div>
                </template>
                <!-- ====== 随访记录列表（按计划下钻） ====== -->
                <template v-else-if="modal==='follow-records'">
                    <div class="table-wrap">
                        <table class="data-table">
                            <thead><tr><th>随访日期</th><th>随访方式</th><th>血压</th><th>心率</th><th>空腹血糖</th><th>用药依从性</th><th>操作</th></tr></thead>
                            <tbody>
                            <tr v-if="followRecords.length===0"><td colspan="7"><div class="empty-state">该计划暂无随访记录</div></td></tr>
                            <tr v-for="rec in followRecords" :key="rec.id">
                                <td>{{ dateTimeText(rec.followDate) }}</td>
                                <td>{{ followTypeText(rec.followType) }}</td>
                                <td>{{ rec.systolicPressure || '-' }}/{{ rec.diastolicPressure || '-' }}</td>
                                <td>{{ rec.heartRate || '-' }}</td>
                                <td>{{ rec.bloodSugarFasting || '-' }}</td>
                                <td>{{ medicationComplianceText(rec.medicationCompliance) }}</td>
                                <td><div class="actions"><button class="link" @click="openFollowRecordDetail(rec)">详情</button></div></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
                <!-- ====== 随访记录详情 ====== -->
                <template v-else-if="modal==='follow-record-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">随访记录详情</div>
                        <div class="timeline-card"><div class="desc">随访日期</div><div>{{ dateTimeText(modalData.item?.followDate) }}</div></div>
                        <div class="timeline-card"><div class="desc">随访方式</div><div>{{ followTypeText(modalData.item?.followType) }}</div></div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">血压 (收缩/舒张)</div><div>{{ modalData.item?.systolicPressure || '-' }} / {{ modalData.item?.diastolicPressure || '-' }} mmHg</div></div>
                        <div class="timeline-card"><div class="desc">心率</div><div>{{ modalData.item?.heartRate || '-' }} 次/分</div></div>
                        <div class="timeline-card"><div class="desc">空腹血糖</div><div>{{ modalData.item?.bloodSugarFasting || '-' }} mmol/L</div></div>
                        <div class="timeline-card"><div class="desc">体重</div><div>{{ modalData.item?.weight || '-' }} kg</div></div>
                        <div class="timeline-card"><div class="desc">用药依从性</div><div>{{ medicationComplianceText(modalData.item?.medicationCompliance) }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.currentMedication"><div class="desc">当前用药</div><div>{{ modalData.item.currentMedication }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.symptomDesc"><div class="desc">症状描述</div><div>{{ modalData.item.symptomDesc }}</div></div>
                        <div class="timeline-card"><div class="desc">随访结果</div><div>{{ modalData.item?.followResult || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">下次随访日期</div><div>{{ modalData.item?.nextFollowDate || '-' }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.remark"><div class="desc">备注</div><div>{{ modalData.item.remark }}</div></div>
                    </div></div>
                </template>
                <template v-else-if="modal==='intervention'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input type="number" min="1" v-model.number="interventionForm.elderId"></div>
                        <div class="field"><label>关联随访记录ID</label><input type="number" min="1" v-model.number="interventionForm.followRecordId"></div>
                        <div class="field"><label>干预类型</label><select v-model.number="interventionForm.interventionType"><option v-for="(txt,key) in interventionMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>干预标题</label><input v-model="interventionForm.interventionTitle"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>干预内容</label><textarea v-model="interventionForm.interventionContent"></textarea></div></div>
                    <div class="form-row" style="margin-top:12px;">
                        <div class="field"><label>用药调整</label><textarea v-model="interventionForm.medicationAdjust"></textarea></div>
                        <div class="field"><label>生活指导</label><textarea v-model="interventionForm.lifestyleGuidance"></textarea></div>
                        <div class="field"><label>健康宣教</label><textarea v-model="interventionForm.healthEducation"></textarea></div>
                        <div class="field"><label>效果评价</label><select v-model.number="interventionForm.effectEvaluation"><option value="">未评价</option><option v-for="(txt,key) in effectMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>效果描述</label><textarea v-model="interventionForm.effectDesc"></textarea></div>
                        <div class="field"><label>下次计划</label><textarea v-model="interventionForm.nextPlan"></textarea></div>
                    </div>
                </template>
                <template v-else-if="modal==='assessment'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input v-model="assessmentForm.elderId" type="number" min="1"></div>
                        <div class="field"><label>责任医生ID</label><input v-model="assessmentForm.doctorId" type="number" min="1"></div>
                        <div class="field"><label>评估类型</label><select v-model.number="assessmentForm.assessType"><option v-for="(txt,key) in assessmentTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>评估日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="assessmentForm.assessDate"></div>
                        <div class="field"><label>评分</label><input type="number" min="0" max="100" step="0.1" v-model="assessmentForm.score"></div>
                        <div class="field"><label>等级</label><input v-model="assessmentForm.level" placeholder="如：轻度、中度、重度"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>结果</label><textarea v-model="assessmentForm.result"></textarea></div>
                        <div class="field"><label>建议</label><textarea v-model="assessmentForm.suggestion"></textarea></div>
                    </div>
                </template>
                <template v-else-if="modal==='assessment-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">评估详情</div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">评估类型</div><div>{{ assessmentTypeText(modalData.item?.assessType) }}</div></div>
                        <div class="timeline-card"><div class="desc">评估日期</div><div>{{ dateText(modalData.item?.assessDate) }}</div></div>
                        <div class="timeline-card"><div class="desc">评分</div><div>{{ modalData.item?.score ?? '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">等级</div><div>{{ modalData.item?.level || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">结果</div><div>{{ modalData.item?.result || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">建议</div><div>{{ modalData.item?.suggestion || '-' }}</div></div>
                    </div></div>
                </template>
                <template v-else-if="modal==='report-input'">
                    <div style="padding:10px 0;">
                        <p style="margin-bottom:16px;color:#606266;">请输入老人档案 ID，选择生成基础健康评估报告或 AI 健康评估报告。基础报告会同步展示该老人的最近 AI 评估摘要。</p>
                        <div class="field"><label>老人档案ID</label><input v-model="generateReportInput.elderId" type="number" min="1" placeholder="请输入老人ID（如 1, 2, 3...）" @keyup.enter="submitGenerateReport"></div>
                        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
                            <button class="ghost-btn" @click="closeModal">取消</button>
                            <button class="soft-btn" @click="submitAiAssessmentFromUnified">🤖 生成AI评估报告</button>
                            <button class="primary-btn" @click="submitGenerateReport">生成基础报告</button>
                        </div>
                    </div>
                </template>
                <template v-else-if="modal==='ai-assessment-input'">
                    <div style="padding:10px 0;">
                        <p style="margin-bottom:8px;font-weight:600;">🤖 AI 健康评估</p>
                        <p class="hint" style="margin-bottom:16px;">系统将自动读取老人全部健康数据，通过专业规则模板生成评估报告（秒级响应）。报告包含风险评分、慢病管理建议、随访干预建议和注意事项。</p>
                        <div class="field"><label>老人档案ID</label><input v-model="aiAssessmentInput.elderId" type="number" min="1" placeholder="请输入老人ID（如 1, 2, 3...）" @keyup.enter="submitAiAssessment"></div>
                        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
                            <button class="ghost-btn" @click="closeModal">取消</button>
                            <button class="primary-btn" @click="submitAiAssessment">🤖 生成AI评估报告</button>
                        </div>
                    </div>
                </template>
                <template v-else-if="modal==='ai-report-list'">
                    <div style="padding:10px 0;">
                        <p class="hint" style="margin-bottom:16px;">输入老人ID，查看该老人的所有AI健康评估报告记录。</p>
                        <div class="field"><label>老人档案ID</label><input v-model="aiReportListFilter.elderId" type="number" min="1" placeholder="请输入老人ID" @keyup.enter="loadAiReportList"></div>
                        <div style="margin-top:12px;display:flex;gap:10px;"><button class="primary-btn" @click="loadAiReportList">查询</button></div>
                        <div v-if="aiReportList.loading" class="empty-state" style="margin-top:12px;">加载中...</div>
                        <div v-else-if="aiReportList.records.length===0" class="empty-state" style="margin-top:12px;">暂无AI评估记录</div>
                        <div v-else class="table-wrap" style="margin-top:12px;">
                            <table class="data-table"><thead><tr><th>ID</th><th>老人</th><th>来源</th><th>风险分</th><th>风险等级</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
                            <tbody><tr v-for="r in aiReportList.records" :key="r.id">
                                <td>{{ r.id }}</td><td>{{ r.elderId }}</td>
                                <td>{{ r.source===1?'规则引擎':'AI引擎' }}</td>
                                <td>{{ r.riskScore }}</td>
                                <td><span class="tag" :class="r.riskLevel==='CRITICAL'||r.riskLevel==='HIGH'?'tag-danger':r.riskLevel==='MEDIUM'?'tag-warning':'tag-success'">{{ aiRiskLevelTextOf(r.riskLevel) }}</span></td>
                                <td>{{ ['草稿','已确认','已驳回','已归档'][r.status]||'-' }}</td>
                                <td>{{ dateTimeText(r.createTime) }}</td>
                                <td><button class="link" @click="viewAiReport(r.id)">查看</button></td>
                            </tr></tbody></table>
                        </div>
                    </div>
                </template>
                <template v-else-if="modal==='ai-report'">
                    <div v-if="aiReport.loading" class="empty-state">
                        <p>⏳ 正在生成评估报告...</p>
                        <p class="hint">读取健康数据，匹配评估规则，请稍候</p>
                    </div>
                    <div v-else-if="aiReport.error" class="empty-state" style="color:#f56c6c;">{{ aiReport.error }}</div>
                    <div v-else-if="aiReport.data" class="report-container" style="max-height:65vh;overflow-y:auto;">
                        <div style="text-align:center;padding:20px;margin-bottom:16px;border-radius:12px;" :style="aiRiskCardStyle()">
                            <div style="font-size:48px;font-weight:bold;">{{ aiReport.data.riskScore || 0 }}</div>
                            <div style="font-size:16px;margin-top:4px;">风险评分</div>
                            <div style="display:inline-block;padding:4px 16px;border-radius:20px;font-weight:bold;margin-top:8px;font-size:14px;" :style="aiRiskBadgeStyle()">{{ aiRiskLevelText() }}</div>
                        </div>
                        <div class="hint" style="margin-bottom:12px;text-align:center;" v-if="aiReport.data.elderBrief">
                            {{ aiReport.data.elderBrief.name || '-' }} · {{ aiReport.data.elderBrief.gender || '' }} · {{ aiReport.data.elderBrief.age || '' }}岁
                        </div>
                        <div v-if="aiReport.data.riskReasons && aiReport.data.riskReasons.length" style="margin-bottom:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">⚠️ 风险原因</h4>
                            <div v-for="(r,i) in aiReport.data.riskReasons" :key="i" class="timeline-card" style="margin:4px 0;">{{ r }}</div>
                        </div>
                        <div v-if="aiReport.data.findings && aiReport.data.findings.length" style="margin-bottom:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">📋 详细发现与建议</h4>
                            <div v-for="(f,i) in aiReport.data.findings" :key="i" class="timeline-card" style="margin:4px 0;">
                                <div class="desc">[{{ f.category }}] {{ f.finding }}</div>
                                <div style="margin-top:2px;">→ {{ f.advice }}</div>
                            </div>
                        </div>
                        <div v-if="aiReport.data.chronicAdvice && aiReport.data.chronicAdvice.length" style="margin-bottom:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">💊 慢病管理建议</h4>
                            <div v-for="(c,i) in aiReport.data.chronicAdvice" :key="i" class="timeline-card" style="margin:4px 0;">
                                <strong>{{ c.disease }}</strong><br>{{ c.advice }}
                            </div>
                        </div>
                        <div v-if="aiReport.data.followUpAdvice && aiReport.data.followUpAdvice.length" style="margin-bottom:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">📅 随访建议</h4>
                            <div v-for="(f,i) in aiReport.data.followUpAdvice" :key="i" class="timeline-card" style="margin:4px 0;">{{ f }}</div>
                        </div>
                        <div v-if="aiReport.data.interventionAdvice && aiReport.data.interventionAdvice.length" style="margin-bottom:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">🩺 干预建议</h4>
                            <div v-for="(iv,i) in aiReport.data.interventionAdvice" :key="i" class="timeline-card" style="margin:4px 0;">
                                [{{ iv.type }}] {{ iv.content }}<span v-if="iv.effect" class="desc">（{{ iv.effect }}）</span>
                            </div>
                        </div>
                        <div v-if="aiReport.data.notices && aiReport.data.notices.length" style="margin-bottom:14px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">⚡ 注意事项</h4>
                            <div v-for="(n,i) in aiReport.data.notices" :key="i" class="timeline-card" style="margin:4px 0;">{{ n }}</div>
                        </div>
                        <div class="timeline-card" style="margin-bottom:12px;line-height:1.8;">
                            <strong>📝 综合摘要：</strong>{{ aiReport.data.reportText }}
                        </div>
                        <div v-if="aiReport.data.aiComment" class="timeline-card" style="margin-bottom:12px;">
                            <h4 style="margin:0 0 8px;font-size:14px;">🧠 AI 深度分析</h4>
                            <p style="margin:4px 0;font-size:13px;">{{ aiReport.data.aiComment }}</p>
                            <div v-if="aiReport.data.aiSuggestions" style="margin-top:8px;">
                                <p v-for="(s,i) in aiReport.data.aiSuggestions" :key="i" style="margin:3px 0;font-size:12px;">💡 {{ s }}</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;padding-top:10px;">
                            <button v-if="aiReport.reportId && !aiReport.data.aiComment" class="soft-btn" @click="triggerDeepAnalysis(aiReport.reportId)">🧠 AI 增强分析</button>
                            <button v-if="aiReport.reportId && aiReport.data.aiComment" class="soft-btn" @click="triggerDeepAnalysis(aiReport.reportId)">🔄 重新AI分析</button>
                            <button v-if="aiReport.reportId" class="primary-btn" @click="confirmAiReport(aiReport.reportId)">💾 确认保存</button>
                            <button v-if="aiReport.reportId" class="ghost-btn" @click="rejectAiReport(aiReport.reportId)">驳回</button>
                            <button class="ghost-btn" @click="closeModal">退出</button>
                        </div>
                    </div>
                </template>
                <template v-else-if="modal==='assessment-report'">
                    <div v-if="reportData.loading" class="empty-state">正在生成报告...</div>
                    <div v-else-if="reportData.error" class="empty-state" style="color:#E06A6A;">{{ reportData.error }}</div>
                    <div v-else-if="reportData.data" class="report-container">
                        <!-- 报告头部 -->
                        <div class="report-header">
                            <div class="report-brand">
                                <div class="report-logo">医</div>
                                <div>
                                    <h2>健康评估报告</h2>
                                    <p>智慧医养大数据公共服务平台</p>
                                </div>
                            </div>
                            <div class="report-meta">
                                <div>报告编号：{{ reportData.data.meta?.reportNo || '-' }}</div>
                                <div>生成日期：{{ dateTimeText(reportData.data.meta?.generatedAt) }}</div>
                            </div>
                        </div>
                        <!-- 基本信息 -->
                        <div class="report-section">
                            <h4 class="report-section-title">{{ reportSectionIndex.basicInfo }}、老人基本信息</h4>
                            <div class="report-grid">
                                <div class="report-field"><label>姓名</label><span>{{ reportData.data.basicInfo?.name || '-' }}</span></div>
                                <div class="report-field"><label>性别</label><span>{{ reportData.data.basicInfo?.gender || '-' }}</span></div>
                                <div class="report-field"><label>年龄</label><span>{{ reportData.data.basicInfo?.age ?? '-' }} 岁</span></div>
                                <div class="report-field"><label>出生日期</label><span>{{ reportData.data.basicInfo?.birthDate || '-' }}</span></div>
                                <div class="report-field"><label>身份证号</label><span>{{ reportData.data.basicInfo?.idCard || '-' }}</span></div>
                                <div class="report-field"><label>联系电话</label><span>{{ reportData.data.basicInfo?.phone || '-' }}</span></div>
                                <div class="report-field"><label>所属社区</label><span>{{ reportData.data.basicInfo?.community || '-' }}</span></div>
                                <div class="report-field"><label>住址</label><span>{{ reportData.data.basicInfo?.address || '-' }}</span></div>
                                <div class="report-field"><label>紧急联系人</label><span>{{ reportData.data.basicInfo?.emergencyContact || '-' }}</span></div>
                                <div class="report-field"><label>紧急电话</label><span>{{ reportData.data.basicInfo?.emergencyPhone || '-' }}</span></div>
                            </div>
                        </div>
                        <!-- 健康档案 -->
                        <div class="report-section" v-if="reportData.data.healthRecord">
                            <h4 class="report-section-title">{{ reportSectionIndex.healthRecord }}、健康档案</h4>
                            <div class="report-grid">
                                <div class="report-field"><label>血型</label><span>{{ reportData.data.healthRecord?.bloodType || '-' }}</span></div>
                                <div class="report-field"><label>身高</label><span>{{ reportData.data.healthRecord?.height ?? '-' }} cm</span></div>
                                <div class="report-field"><label>体重</label><span>{{ reportData.data.healthRecord?.weight ?? '-' }} kg</span></div>
                                <div class="report-field"><label>BMI</label><span>{{ reportData.data.healthRecord?.bmi || '-' }}（{{ reportData.data.healthRecord?.bmiDesc || '-' }}）</span></div>
                                <div class="report-field" style="grid-column: span 2;"><label>既往病史</label><span>{{ reportData.data.healthRecord?.medicalHistory || '无' }}</span></div>
                                <div class="report-field" style="grid-column: span 2;"><label>过敏史</label><span>{{ reportData.data.healthRecord?.allergyHistory || '无' }}</span></div>
                                <div class="report-field" style="grid-column: span 2;"><label>当前用药</label><span>{{ reportData.data.healthRecord?.currentMedication || '无' }}</span></div>
                            </div>
                        </div>
                        <!-- 详细病史 -->
                        <div class="report-section" v-if="reportData.data.medicalHistories?.length">
                            <h4 class="report-section-title">{{ reportSectionIndex.medicalHistories }}、病史明细</h4>
                            <table class="data-table">
                                <thead><tr><th>疾病名称</th><th>确诊日期</th><th>治疗方式</th><th>备注</th></tr></thead>
                                <tbody>
                                    <tr v-for="item in reportData.data.medicalHistories" :key="item.id">
                                        <td>{{ item.diseaseName || '-' }}</td>
                                        <td>{{ item.diagnoseDate || '-' }}</td>
                                        <td>{{ item.treatment || '-' }}</td>
                                        <td>{{ item.remark || '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- 评估记录汇总 -->
                        <div class="report-section" v-if="reportData.data.assessments?.length">
                            <h4 class="report-section-title">{{ reportSectionIndex.assessments }}、评估记录汇总（共 {{ reportData.data.assessmentCount }} 条）</h4>
                            <div class="report-score-summary">
                                <div class="report-score-card" v-if="reportData.data.overallScore">
                                    <div class="score-label">综合评估得分</div>
                                    <div class="score-value">{{ reportData.data.overallScore }}</div>
                                    <div class="score-level">{{ reportData.data.overallLevel || '-' }}</div>
                                </div>
                            </div>
                            <table class="data-table">
                                <thead><tr><th>评估日期</th><th>类型</th><th>评分</th><th>等级</th><th>结果</th><th>建议</th></tr></thead>
                                <tbody>
                                    <tr v-for="item in reportData.data.assessments" :key="item.id">
                                        <td>{{ dateText(item.assessDate) }}</td>
                                        <td>{{ assessmentTypeText(item.assessType) }}</td>
                                        <td>{{ item.score ?? '-' }}</td>
                                        <td><span class="tag" :class="reportLevelClass(item.level)">{{ item.level || '-' }}</span></td>
                                        <td style="max-width:200px;">{{ item.result || '-' }}</td>
                                        <td style="max-width:200px;">{{ item.suggestion || '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- AI健康评估摘要 -->
                        <div class="report-section" v-if="reportData.data.aiReports?.length">
                            <h4 class="report-section-title">{{ reportSectionIndex.aiReports }}、AI健康评估摘要（共 {{ reportData.data.aiReportCount }} 条）</h4>
                            <div class="report-score-summary" v-if="reportData.data.latestAiReport">
                                <div class="report-score-card">
                                    <div class="score-label">最近AI风险评分</div>
                                    <div class="score-value">{{ reportData.data.latestAiReport.riskScore ?? '-' }}</div>
                                    <div class="score-level">{{ aiRiskLevelTextOf(reportData.data.latestAiReport.riskLevel) }}</div>
                                </div>
                            </div>
                            <table class="data-table">
                                <thead><tr><th>ID</th><th>来源</th><th>风险分</th><th>风险等级</th><th>状态</th><th>生成时间</th><th>操作</th></tr></thead>
                                <tbody>
                                    <tr v-for="item in reportData.data.aiReports" :key="'report-ai'+item.id">
                                        <td>{{ item.id }}</td>
                                        <td>{{ item.source===1?'规则引擎':'AI引擎' }}</td>
                                        <td>{{ item.riskScore ?? '-' }}</td>
                                        <td><span class="tag" :class="item.riskLevel==='CRITICAL'||item.riskLevel==='HIGH'?'tag-danger':item.riskLevel==='MEDIUM'?'tag-warning':'tag-success'">{{ aiRiskLevelTextOf(item.riskLevel) }}</span></td>
                                        <td>{{ ['草稿','已确认','已驳回','已归档'][item.status]||'-' }}</td>
                                        <td>{{ dateTimeText(item.createTime) }}</td>
                                        <td><button class="link" @click="viewAiReport(item.id)">查看AI报告</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- 最新体征 -->
                        <div class="report-section" v-if="reportData.data.recentVitals?.length">
                            <h4 class="report-section-title">{{ reportSectionIndex.recentVitals }}、最新生命体征</h4>
                            <div class="report-grid">
                                <div class="report-field report-vital" v-for="(v, i) in reportData.data.recentVitals" :key="i">
                                    <label>{{ v.name }}</label>
                                    <span :class="v.isAbnormal === 1 ? 'abnormal' : ''">{{ v.value ?? '-' }} {{ v.unit }}</span>
                                </div>
                            </div>
                        </div>
                        <!-- 最近预警 -->
                        <div class="report-section" v-if="reportData.data.recentWarnings?.length">
                            <h4 class="report-section-title">{{ reportSectionIndex.recentWarnings }}、近期预警记录</h4>
                            <div v-for="w in reportData.data.recentWarnings" :key="w.id" class="report-warning-item">
                                <span class="tag" :class="warnLevelClass(w.warningLevel)">{{ warnLevelText(w.warningLevel) }}</span>
                                <span class="title">{{ w.warningTitle }}</span>
                                <span class="time">{{ dateText(w.createTime) }}</span>
                            </div>
                            <div v-if="!reportData.data.recentWarnings.length" class="empty-state">暂无预警记录</div>
                        </div>
                        <!-- 报告结论 -->
                        <div class="report-section report-conclusion">
                            <h4 class="report-section-title">{{ reportSectionIndex.conclusion }}、综合评估结论</h4>
                            <div v-if="reportData.data.overallLevel" class="conclusion-level">
                                当前综合健康等级：<strong>{{ reportData.data.overallLevel }}</strong>
                            </div>
                            <div class="conclusion-text" v-for="(line, i) in reportConclusionLines" :key="i">
                                {{ line }}
                            </div>
                        </div>
                    </div>
                </template>
                <div v-if="modal==='assessment'" class="actions" style="justify-content:flex-end; margin-top:12px;"><button class="primary-btn" @click="saveAssessment">保存评估记录</button></div>
                <template v-else-if="modal==='referral'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input v-model="referralForm.elderId" type="number" min="1"></div>
                        <div class="field"><label>转诊类型</label><select v-model.number="referralForm.referralType"><option v-for="(txt,key) in referralTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>紧急程度</label><select v-model.number="referralForm.urgencyLevel"><option v-for="(txt,key) in urgencyMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>是否预留床位</label><select v-model.number="referralForm.bedReserved"><option :value="0">否</option><option :value="1">是</option></select></div>
                        <div class="field"><label>转出机构名称</label><input v-model="referralForm.fromOrg"></div>
                        <div class="field"><label>转出医生ID</label><input v-model="referralForm.fromDoctorId" type="number" min="1"></div>
                        <div class="field"><label>转出医生姓名</label><input v-model="referralForm.fromDoctorName"></div>
                        <div class="field"><label>转入机构名称</label><input v-model="referralForm.toOrg"></div>
                        <div class="field"><label>转入科室名称</label><input v-model="referralForm.toDept"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px;">
                        <div class="field"><label>转入医生ID</label><input v-model="referralForm.toDoctorId" type="number" min="1"></div>
                        <div class="field"><label>转入医生姓名</label><input v-model="referralForm.toDoctorName"></div>
                        <div class="field"><label>诊断</label><input v-model="referralForm.diagnosis"></div>
                        <div class="field"><label>转诊原因</label><input v-model="referralForm.referralReason"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>备注</label><textarea v-model="referralForm.remark"></textarea></div></div>
                </template>
                <div v-if="modal==='referral'" class="actions" style="justify-content:flex-end; margin-top:12px;"><button class="primary-btn" @click="saveReferral">保存转诊记录</button></div>
                <template v-else-if="modal==='referral-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">转诊详情</div>
                        <div class="timeline-card"><div class="desc">转诊编号</div><div>{{ modalData.item?.referralNo || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">转诊类型</div><div>{{ referralTypeText(modalData.item?.referralType) }}</div></div>
                        <div class="timeline-card"><div class="desc">转出机构</div><div>{{ modalData.item?.fromOrg || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">转入机构</div><div>{{ modalData.item?.toOrg || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">状态</div><div>{{ referralStatusText(modalData.item?.status) }}</div></div>
                        <div class="timeline-card"><div class="desc">诊断</div><div>{{ modalData.item?.diagnosis || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">转诊原因</div><div>{{ modalData.item?.referralReason || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">出院小结</div><div>{{ modalData.item?.dischargeSummary || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">拒绝原因</div><div>{{ modalData.item?.rejectReason || '-' }}</div></div>
                    </div></div>
                </template>
                <template v-else-if="modal==='referral-complete' || modal==='referral-reject'">
                    <div class="form-row" style="grid-template-columns:1fr;"><div class="field">
                        <label>{{ modal==='referral-complete' ? '出院小结' : '拒绝原因' }}</label>
                        <textarea v-model="referralActionForm.value" :placeholder="modal==='referral-complete' ? '请填写出院小结和后续治疗方案' : '请填写拒绝接收的具体原因'"></textarea>
                    </div></div>
                </template>
                <div v-if="modal==='referral-complete' || modal==='referral-reject'" class="actions" style="justify-content:flex-end; margin-top:12px;"><button class="primary-btn" @click="submitReferralAction">提交处理结果</button></div>
                <template v-else-if="modal==='device'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input v-model="deviceForm.elderId" type="number" min="1"></div>
                        <div class="field"><label>设备类型</label><select v-model.number="deviceForm.deviceType"><option v-for="(txt,key) in deviceTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>设备名称</label><input v-model="deviceForm.deviceName"></div>
                        <div class="field"><label>设备序列号</label><input v-model="deviceForm.deviceSn"></div>
                    </div>
                </template>
                <div v-if="modal==='device'" class="actions" style="justify-content:flex-end; margin-top:12px;"><button class="primary-btn" @click="saveDevice">保存设备信息</button></div>
                <template v-else-if="modal==='healthDetail'">
                    <div v-if="!healthDetail.loading && healthDetail.data">
                        <div class="grid-2">
                            <div class="card list-card">
                                <div class="list-title">病史记录</div>
                                <div v-if="healthDetail.data.medicalHistory.length===0" class="empty-state">暂无病史记录</div>
                                <div v-for="item in healthDetail.data.medicalHistory" :key="'mh'+item.id" class="timeline-card"><div><div class="title">{{ item.diseaseName || '未知疾病' }}</div><div class="desc">{{ item.diagnoseDate || '-' }} · {{ item.treatment || '-' }}</div></div></div>
                            </div>
                            <div class="card list-card">
                                <div class="list-title">用药记录</div>
                                <div v-if="healthDetail.data.medications.length===0" class="empty-state">暂无用药记录</div>
                                <div v-for="item in healthDetail.data.medications" :key="'med'+item.id" class="timeline-card"><div><div class="title">{{ item.drugName || item.medicationName || '未知药物' }}</div><div class="desc">{{ item.status || item.dose || '-' }}</div></div></div>
                            </div>
                        </div>
                        <div class="grid-2" style="margin-top: 16px;">
                            <div class="card list-card">
                                <div class="list-title">过敏史</div>
                                <div v-if="healthDetail.data.allergies.length===0" class="empty-state">暂无过敏史记录</div>
                                <div v-for="item in healthDetail.data.allergies" :key="'al'+item.id" class="timeline-card"><div><div class="title">{{ item.allergyName || item.allergyType || '未知过敏原' }}</div><div class="desc">{{ item.remark || item.allergyDesc || '-' }}</div></div></div>
                            </div>
                            <div class="card list-card">
                                <div class="list-title">家族史</div>
                                <div v-if="healthDetail.data.familyHistory.length===0" class="empty-state">暂无家族史记录</div>
                                <div v-for="item in healthDetail.data.familyHistory" :key="'fh'+item.id" class="timeline-card"><div><div class="title">{{ item.diseaseName || '家族遗传性疾病' }}</div><div class="desc">{{ item.remark || '-' }}</div></div></div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="empty-state">{{ healthDetail.loading ? '加载中...' : '暂无数据' }}</div>
                </template>
                <template v-else-if="modal==='interventionDetail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">{{ modalData.item?.interventionTitle || '干预详情' }}</div>
                        <div class="timeline-card"><div class="desc">干预记录ID</div><div>{{ modalData.item?.id || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">医生ID</div><div>{{ modalData.item?.doctorId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">关联随访记录ID</div><div>{{ modalData.item?.followRecordId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">干预类型</div><div>{{ interventionText(modalData.item?.interventionType) }}</div></div>
                        <div class="timeline-card"><div class="desc">干预日期</div><div>{{ dateTimeText(modalData.item?.interventionDate) }}</div></div>
                        <div class="timeline-card"><div class="desc">干预内容</div><div>{{ modalData.item?.interventionContent || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">用药调整</div><div>{{ modalData.item?.medicationAdjust || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">生活方式指导</div><div>{{ modalData.item?.lifestyleGuidance || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">健康宣教</div><div>{{ modalData.item?.healthEducation || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">状态</div><div>{{ modalData.item?.status ?? '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">效果评价</div><div>{{ modalData.item?.effectEvaluation ? effectText(modalData.item?.effectEvaluation) : '未评价' }}</div></div>
                        <div class="timeline-card"><div class="desc">效果描述</div><div>{{ modalData.item?.effectDesc || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">下次计划</div><div>{{ modalData.item?.nextPlan || '-' }}</div></div>
                    </div></div>
                </template>
                <template v-else-if="modal==='warning-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">{{ modalData.item?.warningTitle || '预警详情' }}</div>
                        <div class="timeline-card"><div class="desc">预警等级</div><div>{{ warnLevelText(modalData.item?.warningLevel) }}</div></div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">状态</div><div>{{ warningStatusText(modalData.item?.status) }}</div></div>
                        <div class="timeline-card"><div class="desc">预警值</div><div>{{ modalData.item?.warningValue || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">阈值</div><div>{{ modalData.item?.thresholdValue || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">预警内容</div><div>{{ modalData.item?.warningContent || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">处理意见</div><div>{{ modalData.item?.handleResult || '-' }}</div></div>
                    </div></div>
                </template>
                <!-- ====== 护理记录表单 ====== -->
                <template v-else-if="modal==='nurse-record'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input v-model="nurseRecordForm.elderId" type="number" min="1" placeholder="老人档案ID"></div>
                        <div class="field"><label>记录类型</label><select v-model.number="nurseRecordForm.recordType"><option v-for="(txt,key) in recordTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>护理日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="datetime-local" v-model="nurseRecordForm.recordDate"></div>
                        <div class="field"><label>是否异常</label><select v-model.number="nurseRecordForm.isAbnormal"><option :value="0">正常</option><option :value="1">异常</option></select></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>记录标题</label><input v-model="nurseRecordForm.recordTitle" placeholder="请输入护理记录标题"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>护理内容</label><textarea v-model="nurseRecordForm.recordContent" placeholder="请描述护理的具体内容"></textarea></div>
                        <div class="field"><label>护理措施</label><textarea v-model="nurseRecordForm.nursingMeasures" placeholder="记录采取的护理措施"></textarea></div>
                        <div class="field"><label>观察结果</label><textarea v-model="nurseRecordForm.observation" placeholder="记录观察到的结果"></textarea></div>
                        <div class="field"><label>效果评价</label><textarea v-model="nurseRecordForm.evaluation" placeholder="记录护理效果评价"></textarea></div>
                    </div>
                    <div v-if="nurseRecordForm.isAbnormal===1" class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>异常描述</label><textarea v-model="nurseRecordForm.abnormalDesc" placeholder="请详细描述异常情况"></textarea></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>备注</label><textarea v-model="nurseRecordForm.remark"></textarea></div>
                    </div>
                </template>
                <!-- ====== 护理记录详情 ====== -->
                <template v-else-if="modal==='nurse-record-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">{{ modalData.item?.recordTitle || '护理记录详情' }}</div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">记录类型</div><div>{{ recordTypeText(modalData.item?.recordType) }}</div></div>
                        <div class="timeline-card"><div class="desc">护理日期</div><div>{{ dateTimeText(modalData.item?.recordDate) }}</div></div>
                        <div class="timeline-card"><div class="desc">是否异常</div><div><span class="tag" :class="modalData.item?.isAbnormal===1?'tag-danger':'tag-success'">{{ modalData.item?.isAbnormal===1?'异常':'正常' }}</span></div></div>
                        <div class="timeline-card"><div class="desc">上报状态</div><div><span class="tag" :class="modalData.item?.reportStatus===0?'tag-default':modalData.item?.reportStatus===1?'tag-warning':'tag-success'">{{ modalData.item?.reportStatus===0?'未上报':modalData.item?.reportStatus===1?'已上报':'已处理' }}</span></div></div>
                        <div class="timeline-card" v-if="modalData.item?.recordContent"><div class="desc">护理内容</div><div>{{ modalData.item.recordContent }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.nursingMeasures"><div class="desc">护理措施</div><div>{{ modalData.item.nursingMeasures }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.observation"><div class="desc">观察结果</div><div>{{ modalData.item.observation }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.evaluation"><div class="desc">效果评价</div><div>{{ modalData.item.evaluation }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.abnormalDesc"><div class="desc">异常描述</div><div>{{ modalData.item.abnormalDesc }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.remark"><div class="desc">备注</div><div>{{ modalData.item.remark }}</div></div>
                    </div></div>
                </template>
                <!-- ====== 护理计划表单 ====== -->
                <template v-else-if="modal==='nurse-plan'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input v-model="nursePlanForm.elderId" type="number" min="1" placeholder="老人档案ID"></div>
                        <div class="field"><label>计划名称</label><input v-model="nursePlanForm.planName" placeholder="如：基础护理计划"></div>
                        <div class="field"><label>计划类型</label><select v-model.number="nursePlanForm.planType"><option v-for="(txt,key) in planTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>开始日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="nursePlanForm.startDate"></div>
                        <div class="field"><label>结束日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="nursePlanForm.endDate"></div>
                        <div class="field"><label>总次数</label><input type="number" min="1" v-model.number="nursePlanForm.totalCount" placeholder="计划总执行次数"></div>
                        <div class="field"><label>护理频次</label><input v-model="nursePlanForm.frequency" placeholder="如：每日1次"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>护理目标</label><textarea v-model="nursePlanForm.nursingGoal" placeholder="设定护理目标"></textarea></div>
                        <div class="field"><label>护理内容</label><textarea v-model="nursePlanForm.nursingContent" placeholder="详细描述护理内容"></textarea></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>备注</label><textarea v-model="nursePlanForm.remark"></textarea></div>
                    </div>
                </template>
                <!-- ====== 护理计划详情 ====== -->
                <template v-else-if="modal==='nurse-plan-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">{{ modalData.item?.planName || '护理计划详情' }}</div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">计划类型</div><div>{{ planTypeText(modalData.item?.planType) }}</div></div>
                        <div class="timeline-card"><div class="desc">开始日期</div><div>{{ modalData.item?.startDate || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">结束日期</div><div>{{ modalData.item?.endDate || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">护理频次</div><div>{{ modalData.item?.frequency || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">进度</div><div>{{ modalData.item?.completedCount || 0 }}/{{ modalData.item?.totalCount || 0 }}</div></div>
                        <div class="timeline-card"><div class="desc">状态</div><div><span class="tag" :class="modalData.item?.status===1?'tag-success':modalData.item?.status===0?'tag-warning':'tag-default'">{{ nursePlanStatusText(modalData.item?.status) }}</span></div></div>
                        <div class="timeline-card"><div class="desc">医生审核</div><div><span class="tag" :class="modalData.item?.doctorApproval===0?'tag-default':modalData.item?.doctorApproval===1?'tag-success':'tag-danger'">{{ modalData.item?.doctorApproval===0?'待审核':modalData.item?.doctorApproval===1?'已通过':'已驳回' }}</span></div></div>
                        <div class="timeline-card" v-if="modalData.item?.nursingGoal"><div class="desc">护理目标</div><div>{{ modalData.item.nursingGoal }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.nursingContent"><div class="desc">护理内容</div><div>{{ modalData.item.nursingContent }}</div></div>
                    </div></div>
                </template>
                <!-- ====== 体检表单 ====== -->
                <template v-else-if="modal==='exam'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input v-model="examForm.elderId" type="number" min="1"></div>
                        <div class="field"><label>体检日期</label><input class="calendar-input" inputmode="none" autocomplete="off" @keydown="blockDateTyping" @paste.prevent @drop.prevent @focus="openDatePicker" @click="openDatePicker" type="date" v-model="examForm.examDate"></div>
                        <div class="field"><label>身高(cm)</label><input v-model="examForm.height" type="number" min="1" step="0.1"></div>
                        <div class="field"><label>体重(kg)</label><input v-model="examForm.weight" type="number" min="1" step="0.1"></div>
                        <div class="field"><label>收缩压</label><input v-model="examForm.systolicPressure" type="number" min="1"></div>
                        <div class="field"><label>舒张压</label><input v-model="examForm.diastolicPressure" type="number" min="1"></div>
                        <div class="field"><label>心率</label><input v-model="examForm.heartRate" type="number" min="1"></div>
                        <div class="field"><label>空腹血糖</label><input v-model="examForm.bloodSugarFasting" type="number" min="1" step="0.01"></div>
                        <div class="field"><label>体温(℃)</label><input v-model="examForm.temperature" type="number" min="1" step="0.1"></div>
                        <div class="field"><label>血氧(%)</label><input v-model="examForm.bloodOxygen" type="number" min="1" step="0.1"></div>
                        <div class="field"><label>腰围(cm)</label><input v-model="examForm.waistline" type="number" min="1" step="0.1"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;">
                        <div class="field"><label>体检总结</label><textarea v-model="examForm.examSummary"></textarea></div>
                        <div class="field"><label>医生建议</label><textarea v-model="examForm.doctorAdvice"></textarea></div>
                    </div>
                </template>
                <!-- ====== 体检详情 ====== -->
                <template v-else-if="modal==='exam-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">体检详情 #{{ modalData.item?.id }}</div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">体检日期</div><div>{{ modalData.item?.examDate || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">身高/体重/BMI</div><div>{{ modalData.item?.height ?? '-' }}cm / {{ modalData.item?.weight ?? '-' }}kg / {{ modalData.item?.bmi ?? '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">血压</div><div>{{ modalData.item?.systolicPressure ?? '-' }}/{{ modalData.item?.diastolicPressure ?? '-' }} mmHg</div></div>
                        <div class="timeline-card"><div class="desc">心率</div><div>{{ modalData.item?.heartRate ?? '-' }} 次/分</div></div>
                        <div class="timeline-card"><div class="desc">空腹血糖</div><div>{{ modalData.item?.bloodSugarFasting ?? '-' }} mmol/L</div></div>
                        <div class="timeline-card"><div class="desc">随机血糖</div><div>{{ modalData.item?.bloodSugarRandom ?? '-' }} mmol/L</div></div>
                        <div class="timeline-card"><div class="desc">体温</div><div>{{ modalData.item?.temperature ?? '-' }} ℃</div></div>
                        <div class="timeline-card"><div class="desc">血氧</div><div>{{ modalData.item?.bloodOxygen ?? '-' }} %</div></div>
                        <div class="timeline-card"><div class="desc">腰围</div><div>{{ modalData.item?.waistline ?? '-' }} cm</div></div>
                        <div class="timeline-card"><div class="desc">异常标记</div><div><span class="tag" :class="modalData.item?.abnormalFlag===1?'tag-danger':'tag-success'">{{ modalData.item?.abnormalFlag===1?'异常':'正常' }}</span></div></div>
                        <div class="timeline-card" v-if="modalData.item?.examSummary"><div class="desc">体检总结</div><div>{{ modalData.item.examSummary }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.doctorAdvice"><div class="desc">医生建议</div><div>{{ modalData.item.doctorAdvice }}</div></div>
                    </div></div>
                </template>
                <!-- ====== 审核记录详情 ====== -->
                <template v-else-if="modal==='review-record-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">护理记录详情</div>
                        <div class="timeline-card"><div class="desc">记录标题</div><div>{{ modalData.item?.recordTitle || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">记录类型</div><div>{{ recordTypeText(modalData.item?.recordType) }}</div></div>
                        <div class="timeline-card"><div class="desc">护理日期</div><div>{{ dateTimeText(modalData.item?.recordDate) }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.recordContent"><div class="desc">护理内容</div><div>{{ modalData.item.recordContent }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.nursingMeasures"><div class="desc">护理措施</div><div>{{ modalData.item.nursingMeasures }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.observation"><div class="desc">观察结果</div><div>{{ modalData.item.observation }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.abnormalDesc"><div class="desc">异常描述</div><div style="color:#E06A6A;">{{ modalData.item.abnormalDesc }}</div></div>
                    </div></div>
                </template>
                <!-- ====== 审核计划详情 ====== -->
                <template v-else-if="modal==='review-plan-detail'">
                    <div class="grid-1"><div class="card list-card">
                        <div class="list-title">护理计划详情</div>
                        <div class="timeline-card"><div class="desc">计划名称</div><div>{{ modalData.item?.planName || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">老人ID</div><div>{{ modalData.item?.elderId || '-' }}</div></div>
                        <div class="timeline-card"><div class="desc">计划类型</div><div>{{ planTypeText(modalData.item?.planType) }}</div></div>
                        <div class="timeline-card"><div class="desc">护理频次</div><div>{{ modalData.item?.frequency || '-' }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.nursingGoal"><div class="desc">护理目标</div><div>{{ modalData.item.nursingGoal }}</div></div>
                        <div class="timeline-card" v-if="modalData.item?.nursingContent"><div class="desc">护理内容</div><div>{{ modalData.item.nursingContent }}</div></div>
                    </div></div>
                </template>
            </div>
            <div class="modal-foot">
                <template v-if="modal==='elder'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveElder">保存</button></template>
                <template v-else-if="modal==='warning'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveWarning">保存</button></template>
                <template v-else-if="modal==='warning-handle'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="submitWarningHandle">{{ modalData.action==='handle' ? '确认处理' : '确认忽略' }}</button></template>
                <template v-else-if="modal==='plan'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="savePlan">保存</button></template>
                <template v-else-if="modal==='record'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveFollowRecord">保存并记录随访</button></template>
                <template v-else-if="modal==='follow-records'"><button class="ghost-btn" @click="closeModal">关闭</button><button class="primary-btn" @click="openRecordModal(followRecordsPlan)">+ 记录随访结果</button></template>
                <template v-else-if="modal==='follow-record-detail'"><button class="ghost-btn" @click="backToFollowRecords">返回列表</button><button class="primary-btn" @click="closeModal">关闭</button></template>
                <template v-else-if="modal==='intervention'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveIntervention">保存</button></template>
                <template v-else-if="modal==='nurse-record'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveNurseRecord">保存护理记录</button></template>
                <template v-else-if="modal==='nurse-plan'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveNursePlan">保存护理计划</button></template>
                <template v-else-if="modal==='exam'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveExam">保存体检记录</button></template>
                <template v-else><button class="ghost-btn" @click="closeModal">关闭</button></template>
            </div>
        </div>
    </div>
    <transition name="alert">
        <div v-if="warningAlertVisible && realtimeWarning" class="warning-alert-overlay" @click.self="dismissWarningAlert">
            <div class="warning-alert-card" :class="'level-' + (realtimeWarning.warningLevel || 3)">
                <div class="alert-header">
                    <span class="alert-icon">{{ realtimeWarning.warningLevel === 3 ? '🚨' : realtimeWarning.warningLevel === 2 ? '⚠️' : '⚡' }}</span>
                    <span class="alert-title">{{ realtimeWarning.warningLevel === 3 ? '红色预警' : realtimeWarning.warningLevel === 2 ? '橙色预警' : '黄色预警' }}</span>
                </div>
                <div class="alert-body">
                    <div class="alert-msg">{{ realtimeWarning.warningTitle || '收到新的健康预警' }}</div>
                    <div class="alert-detail" v-if="realtimeWarning.warningContent">{{ realtimeWarning.warningContent }}</div>
                    <div class="alert-meta">
                        <span>老人ID: {{ realtimeWarning.elderId || '-' }}</span>
                        <span v-if="realtimeWarning.warningValue">数值: {{ realtimeWarning.warningValue }}</span>
                        <span v-if="realtimeWarning.createTime">{{ dateTimeText(realtimeWarning.createTime) }}</span>
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="primary-btn" @click="handleRealtimeWarningAction">立即处理</button>
                    <button class="ghost-btn" @click="dismissWarningAlert">稍后处理</button>
                </div>
                <div class="alert-timer"><div class="timer-bar"></div></div>
            </div>
        </div>
    </transition>

    <div class="toast-wrap">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="{error: toast.type==='error'}">
            <strong>{{ toast.title }}</strong>
            <span class="small" v-if="toast.message">{{ toast.message }}</span>
        </div>
    </div>
    `,

    data() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const roleType = Number(userInfo.userType);
        const isNurse = roleType === 3;
        const isAdmin = roleType === 1;
        return {
            token: localStorage.getItem('token') || '',
            userInfo,
            isNurse,
            isAdmin,
            isCollapse: false,
            chartType: 'gender',
            dashboardStatsMap: {
                eldersTotal: { label: '管理老人总数', icon: 'User', color: '#4A80C0' },
                warningPending: { label: '待处理预警', icon: 'Bell', color: '#E06A6A' },
                followupActive: { label: '进行中随访', icon: 'Calendar', color: '#E6A23C' },
                todayTodo: { label: '今日待办任务', icon: 'List', color: '#67C23A' }
            },
            adminDashboard: {
                stats: {
                    userTotal: 0, doctorCount: 0, nurseCount: 0, adminCount: 0,
                    elderTotal: 0, elderMale: 0, elderFemale: 0,
                    warningTotal: 0, warningPending: 0, warningToday: 0,
                    followupTotal: 0, followupActive: 0,
                    interventionTotal: 0, assessmentTotal: 0,
                    referralTotal: 0, examTotal: 0
                },
                latestWarnings: [],
                latestReferrals: [],
                loading: false
            },
            tabs: isAdmin ? ADMIN_TAB_META : (isNurse ? NURSE_TAB_META : TAB_META),
            activeTab: isAdmin ? 'admin-dashboard' : (isNurse ? 'nurse-dashboard' : 'dashboard'),
            profileTab: 'info',
            modal: '',
            modalData: {},
            toasts: [],
            lastApiErrorToast: { message: '', at: 0 },
            // 护士工作台
            nurseDashboard: {
                stats: { todayRecords: 0, activePlans: 0, pendingReports: 0, pendingWarnings: 0, totalElders: 0, myFollowTasks: 0 },
                todayRecords: [],
                activePlans: []
            },
            // 护理记录
            nurseRecordFilter: { elderId: '', recordType: '', reportStatus: '', startDate: '', endDate: '' },
            nurseRecordPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            nurseRecordStats: { total: 0, todayCount: 0, abnormal: 0, reported: 0 },
            nurseRecordForm: {
                id: null, elderId: '', nurseId: '', recordType: 1, recordTitle: '',
                recordContent: '', nursingMeasures: '', observation: '', evaluation: '',
                recordDate: new Date().toISOString().slice(0, 16), isAbnormal: 0,
                abnormalDesc: '', reportStatus: 0, remark: ''
            },
            // 护理计划
            nursePlanFilter: { elderId: '', planType: '', status: '' },
            nursePlanPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            nursePlanStats: { total: 0, pending: 0, active: 0, completed: 0 },
            nursePlanForm: {
                id: null, elderId: '', nurseId: '', planName: '', planType: 1,
                startDate: new Date().toISOString().slice(0, 10), endDate: '',
                frequency: '', nursingGoal: '', nursingContent: '',
                status: 0, totalCount: 10, completedCount: 0,
                effectScore: null, doctorApproval: 0, remark: ''
            },
            dashboard: {
                stats: { eldersTotal: 0, warningPending: 0, followupActive: 0, todayTodo: 0 },
                latestWarnings: [],
                latestFollowups: []
            },
            elderFilter: { name: '', community: '', doctorId: '', diseaseType: '' },
            elderPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            elderForm: blankElder(),
            warningFilter: { status: '', warningLevel: '', elderId: '' },
            warningPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            sse: { connected: false, connecting: false, source: null, retry: 0 },
            realtime: { redPending: 0, orangePending: 0, yellowPending: 0, totalPending: 0, hourlyTrend: [], onlineDoctors: 0 },
            realtimeFeed: [],
            realtimeWarning: null,
            warningAlertVisible: false,
            warningAlertTimer: null,
            alertedWarningIds: {},
            recentAlertFingerprints: {},
            audioCtx: null,
            warningForm: blankWarning(),
            followFilter: { status: '', diseaseType: '', elderId: '' },
            followPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            planForm: blankPlan(),
            followRecordForm: blankFollowRecord(),
            followRecords: [],
            followRecordsPlan: null,
            interventionFilter: { type: '', elderId: '', followRecordId: '' },
            interventionPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0, error: '' },
            interventionForm: blankIntervention(),
            assessmentFilter: { elderId: '', assessType: '' },
            assessmentPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            assessmentStats: { total: 0 },
            assessmentForm: blankAssessment(),
            reportData: { loading: false, error: '', data: null },
            generateReportInput: { elderId: '' },
            aiAssessmentInput: { elderId: '' },
            aiReport: { loading: false, error: '', data: null, reportId: null, status: 0 },
            aiConfig: { loading: false, saved: false, form: { apiKey: '', baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4.7-flash', maxPerDay: 20, timeoutSeconds: 60, maxRetries: 2, mockEnabled: true } },
            aiReportListFilter: { elderId: '' },
            aiReportList: { loading: false, records: [] },
            aiReportsForElder: [],
            aiAssessmentStats: { count: 0 },
            referralFilter: { doctorId: '', status: '', referralType: '' },
            referralPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            referralStats: { pending: 0, processing: 0, completed: 0, upCount: 0, downCount: 0 },
            referralForm: blankReferral(),
            referralActionForm: { value: '' },
            referralDetail: null,
            vitalsState: {
                elderId: '',
                devices: [],
                latest: [],
                trend: [],
                metric: 1,
                startDate: '',
                endDate: '',
                mockDays: 30
            },
            deviceForm: blankDevice(),
            timelineFilter: { elderId: '', startDate: '', endDate: '', eventType: '' },
            timelinePage: { records: [], pageNum: 1, pageSize: 20, pages: 0, total: 0 },
            // 重点人群模块数据
            keyPopulationPage: { pageNum: 1, pageSize: 10, total: 0, records: [] },
            riskStats: { highRisk: 0, key: 0, attention: 0, normal: 0 },
            riskFilter: { riskLevel: null },
            todayTasks: [],
            taskStats: { pending: 0, today: 0 },
            timelineSummary: { total: 0 },
            // 体检管理
            examFilter: { elderId: '', startDate: '', endDate: '' },
            examPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            examStats: { total: 0, abnormal: 0, thisYear: 0 },
            examForm: {
                id: null, elderId: '', doctorId: '', examDate: new Date().toISOString().slice(0, 10),
                height: '', weight: '', systolicPressure: '', diastolicPressure: '',
                heartRate: '', bloodSugarFasting: '', bloodSugarRandom: '',
                temperature: '', bloodOxygen: '', waistline: '',
                examSummary: '', doctorAdvice: '', abnormalFlag: 0
            },
            // 护士审核
            reviewFilter: { tab: 'records' },
            reviewRecordsPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            reviewPlansPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            reviewStats: { pendingRecords: 0, pendingPlans: 0, reviewedRecords: 0, approvedPlans: 0 },
            reviewComment: '',
            // 工作台增强
            todoList: { pendingWarnings: 0, todayFollowups: 0, todayRecords: 0, pendingNurseRecords: 0, pendingNursePlans: 0, totalTodo: 0, overdueFollowups: 0 },
            reviewCounts: { pendingNurseRecords: 0, pendingNursePlans: 0, total: 0 },
            chronicOverview: {},
            profile: {
                info: {},
                logs: [],
                messages: [],
                unreadCount: 0,
                pwd: { oldPassword: '', newPassword: '', confirmPassword: '' }
            },
            avatarUploading: false,
            avatarLoadFailed: false,
            profileAvatarLoadFailed: false,
            healthDetail: { loading: false, data: null },
            charts: { gender: null, warning: null, follow: null, trend: null, rtTrend: null, adminGender: null, adminRole: null, adminBiz: null }
        };
    },
    computed: {
        userDisplayName() {
            return this.userInfo.realName || this.userInfo.username || '医生';
        },
        userAvatar() {
            return (this.userDisplayName || '医').charAt(0);
        },
        userAvatarUrl() {
            if (this.avatarLoadFailed) return '';
            return this.userInfo.avatar || this.profile.info.avatar || '';
        },
        profileAvatarUrl() {
            if (this.profileAvatarLoadFailed) return '';
            return this.profile.info.avatar || '';
        },
        currentTabLabel() {
            const tab = this.tabs.find(t => t.key === this.activeTab);
            return tab ? tab.label : '工作台';
        },
        userRoleText() {
            const t = Number(this.userInfo.userType || 2);
            return t === 1 ? '管理员' : t === 2 ? '医生' : t === 3 ? '护士' : '机构人员';
        },
        welcomeTitle() {
            const hour = new Date().getHours();
            const prefix = hour < 11 ? '上午好，' : hour < 14 ? '中午好，' : hour < 18 ? '下午好，' : '晚上好，';
            return `${prefix}${this.userDisplayName}`;
        },
        welcomeText() {
            if (this.isAdmin) return '全局概览用户、老人、预警、随访、干预等业务运行状况，一屏掌握平台脉搏。';
            if (this.isNurse) return '快速录入护理记录、跟踪护理计划，让每一次护理都留痕可查。';
            return '统一查看老人档案、预警、随访与干预任务，保持医生工作流清晰顺手。';
        },
        modalTitle() {
            const titles = {
                elder: this.elderForm.id ? '编辑老人档案' : '新增老人档案',
                warning: '新建预警',
                'warning-handle': this.modalData.action === 'handle' ? '处理预警' : '查看预警',
                plan: this.planForm.id ? '编辑随访计划' : '新增随访计划',
                record: '记录随访结果',
                'follow-records': this.followRecordsPlan?.planName ? ('随访记录 · ' + this.followRecordsPlan.planName) : '随访记录',
                'follow-record-detail': '随访记录详情',
                intervention: this.interventionForm.id ? '编辑干预记录' : '新增干预记录',
                healthDetail: '老人健康详情',
                interventionDetail: '干预详情',
                'assessment-report': '健康评估报告',
                'report-input': '生成健康评估报告',
                'ai-assessment-input': 'AI 健康评估',
                'ai-report': 'AI 健康评估报告',
                'ai-report-list': 'AI 评估记录',
                exam: this.examForm.id ? '编辑体检记录' : '新增体检记录',
                'exam-detail': '体检详情',
                'review-record-detail': '护理记录详情',
                'review-plan-detail': '护理计划详情'
            };
            return titles[this.modal] || '详情';
        },
        reportConclusionLines() {
            const text = this.reportConclusionText;
            return text ? text.split('\n').filter(Boolean) : [];
        },
        reportSectionIndex() {
            const data = this.reportData.data || {};
            const sections = [
                ['basicInfo', true],
                ['healthRecord', !!data.healthRecord],
                ['medicalHistories', !!(data.medicalHistories && data.medicalHistories.length)],
                ['assessments', !!(data.assessments && data.assessments.length)],
                ['aiReports', !!(data.aiReports && data.aiReports.length)],
                ['recentVitals', !!(data.recentVitals && data.recentVitals.length)],
                ['recentWarnings', !!(data.recentWarnings && data.recentWarnings.length)],
                ['conclusion', true]
            ];
            const numerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
            const result = {};
            let index = 0;
            sections.forEach(([key, visible]) => {
                if (visible) {
                    result[key] = numerals[index] || String(index + 1);
                    index += 1;
                }
            });
            return result;
        },
        reportConclusionText() {
            const data = this.reportData.data;
            if (!data) return '';
            const parts = [];

            // 1. 综合评估等级结论
            const level = data.overallLevel;
            const levelMap = {
                '优': '整体健康状况优良',
                '良': '健康状况良好，部分指标有改善空间',
                '中': '健康状况一般，需要加强管理',
                '差': '健康状况较差，需要加强医疗干预',
                '自理': '日常生活能力良好',
                '轻度依赖': '存在轻度功能依赖',
                '中度依赖': '功能状态中度下降',
                '重度依赖': '功能状态严重下降',
                '正常': '各项评估指标正常',
                '轻度障碍': '存在轻度健康障碍',
                '中度障碍': '存在中度健康障碍',
                '重度障碍': '存在重度健康障碍',
                '低风险': '健康风险较低',
                '中风险': '存在中等健康风险',
                '高风险': '健康风险较高',
                '营养良好': '营养状况良好',
                '有营养不良风险': '存在营养不良风险',
                '营养不良': '营养状况差'
            };
            if (level && levelMap[level]) {
                parts.push(`【综合评估】该老人${levelMap[level]}（${level}）。`);
            } else if (data.assessmentCount > 0) {
                parts.push(`【综合评估】该老人共有 ${data.assessmentCount} 条评估记录，建议结合各维度结果综合判断健康状况。`);
            } else {
                parts.push('【综合评估】该老人暂无评估记录，建议尽快安排全面健康评估。');
            }

            // 2. 异常体征分析
            const vitals = data.recentVitals || [];
            const abnormalVitals = vitals.filter(v => v.isAbnormal === 1);
            if (abnormalVitals.length > 0) {
                const abnormalNames = abnormalVitals.map(v => v.name).join('、');
                parts.push(`【体征异常】监测发现 ${abnormalNames} 指标异常，建议密切监测并及时就医复查。`);
            } else if (vitals.length > 0) {
                parts.push('【体征监测】近期生命体征指标均在正常范围内，情况良好。');
            }

            // 3. BMI 分析
            const hr = data.healthRecord;
            if (hr?.bmi) {
                const bmi = parseFloat(hr.bmi);
                if (bmi < 18.5) parts.push('【营养状况】BMI 偏低，存在消瘦风险，建议加强营养摄入，增加优质蛋白和热量。');
                else if (bmi >= 24 && bmi < 28) parts.push('【营养状况】体重超重，建议控制饮食，增加运动，预防代谢性疾病。');
                else if (bmi >= 28) parts.push('【营养状况】达到肥胖标准，肥胖会增加心脑血管疾病风险，建议制定科学的减重计划。');
                else parts.push('【营养状况】BMI 处于正常范围，建议保持均衡饮食和规律运动。');
            }

            // 4. 预警分析
            const warnings = data.recentWarnings || [];
            const highWarnings = warnings.filter(w => w.warningLevel === 3);
            const mediumWarnings = warnings.filter(w => w.warningLevel === 2);
            if (highWarnings.length > 0) {
                const names = highWarnings.map(w => w.warningTitle).join('、');
                parts.push(`【风险预警】存在 ${highWarnings.length} 条高风险预警（${names}），需要立即关注和紧急处理。`);
            }
            if (mediumWarnings.length > 0) {
                parts.push(`【风险预警】另有 ${mediumWarnings.length} 条中级预警，建议尽快安排复查和干预。`);
            }
            if (highWarnings.length === 0 && mediumWarnings.length === 0 && warnings.length > 0) {
                parts.push('【风险预警】近期预警均已处理，风险可控。');
            }

            // 5. 病史分析
            const histories = data.medicalHistories || [];
            const chronicDiseases = histories.filter(h => h.isCured === 0 || h.isCured == null);
            if (chronicDiseases.length > 0) {
                const diseaseNames = chronicDiseases.map(h => h.diseaseName).join('、');
                parts.push(`【慢病管理】患 ${chronicDiseases.length} 种慢性疾病（${diseaseNames}），建议坚持规范治疗，定期复查，防止并发症。`);
            }

            // 6. 评估建议汇总
            const assessments = data.assessments || [];
            const suggestions = assessments.filter(a => a.suggestion).map(a => a.suggestion);
            if (suggestions.length > 0) {
                // 取最近的2条建议
                const recent = suggestions.slice(0, 2);
                parts.push(`【专业建议】${recent.join(' ')}`);
            }

            // 7. 总结性健康管理建议
            const generalAdvice = [];
            if (chronicDiseases.length > 0) generalAdvice.push('遵医嘱规律用药，不可自行停药或改药');
            if (hr?.bmi && parseFloat(hr.bmi) >= 24) generalAdvice.push('控制饮食热量摄入，增加体力活动');
            if (hr?.bmi && parseFloat(hr.bmi) < 18.5) generalAdvice.push('加强营养支持，少食多餐');
            if (abnormalVitals.length > 0) generalAdvice.push('定期监测异常体征指标，记录变化趋势');
            generalAdvice.push('保持规律作息和良好心态');
            generalAdvice.push('定期参加健康体检和随访');

            if (generalAdvice.length > 0) {
                parts.push(`【健康管理建议】${generalAdvice.join('；')}。`);
            }

            return parts.join('\n');
        },
        modalWidth() {
            return ['healthDetail', 'interventionDetail', 'assessment-report', 'follow-records', 'ai-report', 'ai-report-list'].includes(this.modal) ? 'modal' : 'modal sm';
        },
        diseaseMap() { return DISEASE_MAP; },
        freqMap() { return FREQ_MAP; },
        warnTypeMap() { return WARN_TYPE_MAP; },
        followTypeMap() { return FOLLOW_TYPE_MAP; },
        interventionMap() { return INTERVENTION_MAP; },
        effectMap() { return EFFECT_MAP; },
        assessmentTypeMap() { return ASSESSMENT_TYPE_MAP; },
        referralTypeMap() { return REFERRAL_TYPE_MAP; },
        referralStatusMap() { return REFERRAL_STATUS_MAP; },
        urgencyMap() { return URGENCY_MAP; },
        deviceTypeMap() { return DEVICE_TYPE_MAP; },
        vitalTypeMap() { return VITAL_TYPE_MAP; },
        timelineTypeMap() { return TIMELINE_TYPE_MAP; },
        timelineSummaryCards() {
            const counts = this.timelineSummary.typeCounts || {};
            return Object.entries(TIMELINE_TYPE_MAP).map(([key, label]) => ({
                key,
                label,
                count: counts[key] ?? this.timelineSummary['type' + key] ?? 0
            }));
        },
        // 护士模块常量映射
        recordTypeMap() { return RECORD_TYPE_MAP; },
        planTypeMap() { return PLAN_TYPE_MAP; },
        nursePlanStatusMap() { return PLAN_STATUS_MAP; },
        reportStatusMap() { return REPORT_STATUS_MAP; },
        effectScoreMap() { return EFFECT_SCORE_MAP; }
    },
    watch: {
        activeTab(newVal) {
            if (newVal === 'keyPopulation') {
                this.loadRiskStats();
                this.loadKeyPopulation(1);
                this.loadTodayTasks();
            }
        }
    },
    mounted() {
        if (!this.token) {
            window.location.href = '/index.html';
            return;
        }
        if (this.isAdmin) {
            this.bootstrapAdmin();
        } else if (this.isNurse) {
            this.bootstrapNurse();
        } else {
            this.bootstrap();
        }
        window.addEventListener('resize', this.resizeCharts);
        this.connectSse();
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.resizeCharts);
        this.disconnectSse();
        Object.keys(this.charts).forEach(k => {
            if (this.charts[k] && !this.charts[k].isDisposed()) {
                this.charts[k].dispose();
            }
            this.charts[k] = null;
        });
    },
    methods: {
        apiErrorMessage(error) {
            if (error?.name === 'AbortError') return '请求超时，请稍后重试';
            if (error instanceof SyntaxError) return '服务器返回数据格式异常';
            if (error instanceof TypeError && /Failed to fetch|NetworkError|Load failed|fetch/i.test(error.message || '')) {
                return '网络连接失败，请确认后端服务已启动';
            }
            return error?.message || '操作失败';
        },
        toastApiError(error, fallback = '操作失败') {
            const message = this.apiErrorMessage(error) || fallback;
            const now = Date.now();
            if (this.lastApiErrorToast.message === message && now - this.lastApiErrorToast.at < 1500) return;
            this.lastApiErrorToast = { message, at: now };
            this.toast('提示', message, 'error');
        },
        async api(url, options = {}) {
            const { silent = false, timeout = 8000, ...fetchOptions } = options;
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
            try {
                const res = await fetch(url, {
                    ...fetchOptions,
                    signal: controller ? controller.signal : fetchOptions.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + this.token,
                        ...(fetchOptions.headers || {})
                    }
                });
                const data = await res.json();
                if (data && data.code === 401) {
                    this.logout();
                    return null;
                }
                return data;
            } catch (e) {
                console.error(e);
                if (!silent) this.toastApiError(e);
                return null;
            } finally {
                if (timer) clearTimeout(timer);
            }
        },
        toast(title, message = '', type = 'success') {
            const id = Date.now() + Math.random();
            this.toasts.push({ id, title, message, type });
            setTimeout(() => {
                this.toasts = this.toasts.filter(t => t.id !== id);
            }, 2800);
        },
        logout() {
            localStorage.clear();
            window.location.href = '/index.html';
        },
        switchTab(tab) {
            this.activeTab = tab;
            if (tab === 'warnings') this.loadRealtimeStats();
            if (this.isAdmin) {
                if (tab === 'admin-dashboard') this.loadAdminDashboard();
                else if (tab === 'admin-ai-config') this.loadAiConfig();
                else if (tab === 'elders') this.loadElders(1);
                else if (tab === 'warnings') this.loadWarnings(1);
                else if (tab === 'followup') this.loadFollowups(1);
                else if (tab === 'intervention') this.loadInterventions(1);
                else if (tab === 'assessment') this.loadAssessments(1);
                else if (tab === 'referral') this.loadReferrals(1);
                else if (tab === 'vitals') this.loadVitals();
                else if (tab === 'exam') this.loadExams(1);
                else if (tab === 'timeline') this.loadTimeline(1);
                else if (tab === 'profile') this.loadProfile();
                return;
            }
            if (this.isNurse) {
                if (tab === 'nurse-dashboard') this.loadNurseDashboard();
                if (tab === 'nurse-records') this.loadNurseRecords(1);
                if (tab === 'nurse-plans') this.loadNursePlans(1);
                if (tab === 'elders') this.loadElders(1);
                if (tab === 'warnings') this.loadWarnings(1);
                if (tab === 'followup') this.loadFollowups(1);
                if (tab === 'assessment') this.loadAssessments(1);
                if (tab === 'vitals') this.loadVitals();
                if (tab === 'timeline') this.loadTimeline(1);
                if (tab === 'profile') this.loadProfile();
                return;
            }
            if (tab === 'dashboard') {
                this.loadDashboard();
            }
            if (tab === 'elders') this.loadElders(1);
            if (tab === 'warnings') this.loadWarnings(1);
            if (tab === 'followup') this.loadFollowups(1);
            if (tab === 'intervention') this.loadInterventions(1);
            if (tab === 'assessment') this.loadAssessments(1);
            if (tab === 'referral') this.loadReferrals(1);
            if (tab === 'vitals') this.loadVitals();
            if (tab === 'exam') this.loadExams(1);
            if (tab === 'review') this.loadReview();
            if (tab === 'timeline') this.loadTimeline(1);
            if (tab === 'profile') this.loadProfile();
        },
        // ========== 重点人群管理方法 ==========
        async loadRiskStats() {
            try {
                const res = await this.api('/api/risk/stats');
                if (res?.code === 200) {
                    this.riskStats = res.data || this.riskStats;
                }
            } catch (error) {
                console.error('加载风险统计失败:', error);
            }
        },
        async loadKeyPopulation(pageNum) {
            if (pageNum) this.keyPopulationPage.pageNum = pageNum;
            try {
                const params = {
                    pageNum: this.keyPopulationPage.pageNum,
                    pageSize: this.keyPopulationPage.pageSize
                };
                if (this.riskFilter.riskLevel) {
                    params.riskLevel = this.riskFilter.riskLevel;
                }
                const query = new URLSearchParams(params);
                const res = await this.api(`/api/risk/elders?${query.toString()}`);
                if (res?.code === 200) {
                    this.keyPopulationPage = res.data || this.keyPopulationPage;
                    // 处理数据，添加风险等级文本
                    this.keyPopulationPage.records = (this.keyPopulationPage.records || []).map(item => {
                        item.riskLevelText = this.riskLevelText(item.riskLevel);
                        return item;
                    });
                }
            } catch (error) {
                console.error('加载重点人群失败:', error);
                this.toast('提示', '加载重点人群失败', 'error');
            }
        },
        async generateFollowupPlans(row = null) {
            try {
                const params = new URLSearchParams();
                const doctorId = this.userInfo.userId || this.userInfo.id;
                if (doctorId) params.set('doctorId', doctorId);
                if (row?.elderId) params.set('elderId', row.elderId);
                const suffix = params.toString() ? `?${params.toString()}` : '';
                const res = await this.api(`/api/followup/plans/generate-risk${suffix}`, { method: 'POST' });
                if (res?.code === 200) {
                    const data = res.data || {};
                    const createdCount = Number(data.createdCount || 0);
                    if (createdCount > 0) {
                        const lines = (data.createdPlans || []).map(item => {
                            const elder = item.elderName ? `${item.elderName}(ID:${item.elderId})` : `老人ID:${item.elderId}`;
                            return `- ${item.planName}，${elder}，下次随访：${item.nextFollowDate || '-'}`;
                        }).join('\n');
                        const goFollowup = confirm(`已生成 ${createdCount} 条随访计划：\n${lines}\n\n是否跳转到“随访计划管理”页面查看？`);
                        this.toast('成功', `已生成 ${createdCount} 条随访计划`);
                        this.followFilter.status = '';
                        this.followFilter.diseaseType = '';
                        this.followFilter.elderId = row?.elderId ? String(row.elderId) : '';
                        if (goFollowup) {
                            this.activeTab = 'followup';
                            await this.loadFollowups(1);
                        }
                    } else {
                        const reasons = (data.skippedReasons || []).slice(0, 5).join('\n');
                        alert(`本次未生成新的随访计划。\n${data.message || '当前没有可生成的重点/高危老人。'}${reasons ? `\n\n明细：\n${reasons}` : ''}`);
                    }
                    this.loadRiskStats();
                    this.loadKeyPopulation(1);
                    this.loadDashboard();
                }
            } catch (error) {
                console.error('生成随访计划失败:', error);
                this.toast('提示', '生成随访计划失败', 'error');
            }
        },
        async generateFollowupTasks(row = null) {
            return this.generateFollowupPlans(row);
        },
        async loadTodayTasks() {
            try {
                const res = await this.api('/api/followup/tasks/today');
                if (res?.code === 200) {
                    this.todayTasks = res.data || [];
                }
            } catch (error) {
                console.error('加载今日任务失败:', error);
            }
        },
        async viewRiskDetail(row) {
            try {
                const res = await this.api(`/api/risk/elders/${encodeURIComponent(row.elderId)}`);
                if (res?.code === 200) {
                    const detail = res.data || {};
                    const profile = detail.profile || {};
                    const scoreDetails = detail.reasonDetails?.scoreDetails || [];
                    alert([
                        `风险等级：${this.riskLevelText(profile.riskLevel)}`,
                        `风险评分：${profile.riskScore ?? '-'}分`,
                        `风险标签：${profile.riskTags || '-'}`,
                        `上次计算时间：${this.dateTimeText(profile.lastCalculateTime)}`,
                        '',
                        '评分详情：',
                        ...(scoreDetails.length ? scoreDetails.map(d => `${d.ruleName}: +${d.score}分`) : ['暂无评分明细'])
                    ].join('\n'));
                }
            } catch (error) {
                console.error('获取风险详情失败:', error);
                this.toast('提示', '获取风险详情失败', 'error');
            }
        },
        async createFollowupTask(row) {
            try {
                if (!confirm('当前系统按风险规则生成随访计划，是否立即执行生成？')) return;
                await this.generateFollowupPlans(row);
            } catch (error) {
                console.error('创建随访计划失败:', error);
            }
        },
        async finishFollowupTask(row) {
            try {
                const value = prompt('请输入关联的随访记录ID');
                if (value === null) return;
                const followRecordId = this.normalizePositiveId(value, '随访记录ID');
                if (!followRecordId) return;
                const res = await this.api(`/api/followup/tasks/${row.id}/finish?followRecordId=${encodeURIComponent(followRecordId)}`, { method: 'PUT' });
                if (res?.code === 200) {
                    this.toast('成功', '任务已完成');
                    this.loadTodayTasks();
                } else {
                    this.toast('提示', res?.msg || res?.message || '完成任务失败', 'error');
                }
            } catch (error) {
                console.error('完成任务失败:', error);
                this.toast('提示', '完成任务失败', 'error');
            }
        },
        async cancelFollowupTask(row) {
            try {
                const value = prompt('请输入取消原因');
                if (value === null) return;
                const res = await this.api(`/api/followup/tasks/${row.id}/cancel?reason=${encodeURIComponent(value || '手动取消')}`, { method: 'PUT' });
                if (res?.code === 200) {
                    this.toast('成功', '任务已取消');
                    this.loadTodayTasks();
                } else {
                    this.toast('提示', res?.msg || res?.message || '取消任务失败', 'error');
                }
            } catch (error) {
                console.error('取消任务失败:', error);
                this.toast('提示', '取消任务失败', 'error');
            }
        },
        // 辅助方法
        riskLevelText(level) {
            const map = { 1: '普通', 2: '关注', 3: '重点', 4: '高危' };
            return map[level] || '未知';
        },
        riskLevelTag(level) {
            const map = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' };
            return map[level] || 'info';
        },
        normalizePositiveId(value, label = 'ID') {
            const raw = String(value ?? '').trim();
            if (!raw) return '';
            const num = Number(raw);
            if (!Number.isInteger(num) || num <= 0) {
                this.toast('提示', `${label}必须为正整数`, 'error');
                return null;
            }
            return String(num);
        },
        validateOptionalPositiveId(value, label = 'ID') {
            const raw = String(value ?? '').trim();
            if (!raw) return '';
            return this.normalizePositiveId(raw, label);
        },
        validateScoreRange(value) {
            if (value === null || value === undefined || String(value).trim() === '') return true;
            const score = Number(value);
            if (Number.isNaN(score) || score < 0 || score > 100) {
                this.toast('提示', '评分必须在0到100之间', 'error');
                return false;
            }
            return true;
        },
        validatePhone(value, label = '手机号', required = false) {
            const raw = String(value ?? '').trim();
            if (!raw) {
                if (required) this.toast('提示', `${label}不能为空`, 'error');
                return !required;
            }
            if (!/^1[3-9]\d{9}$/.test(raw)) {
                this.toast('提示', `${label}格式不正确`, 'error');
                return false;
            }
            return true;
        },
        validateRealName(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return true;
            if (!/^[\u4e00-\u9fa5A-Za-z0-9·.\s]{2,30}$/.test(raw)) {
                this.toast('提示', '姓名必须为2-30位中文、字母、数字、空格、点号或间隔号', 'error');
                return false;
            }
            return true;
        },
        validateEmail(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return true;
            if (raw.length > 100 || !/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,20}$/.test(raw)) {
                this.toast('提示', '邮箱格式不正确', 'error');
                return false;
            }
            return true;
        },
        validateAvatarPath(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return true;
            const uploaded = /^\/upload\/avatar\/[A-Za-z0-9._-]+\.(png|jpe?g|gif|webp)$/i.test(raw);
            const remote = /^https?:\/\/[^\s?#]+\.(png|jpe?g|gif|webp)([?#][^\s]*)?$/i.test(raw);
            if (!uploaded && !remote) {
                this.toast('提示', '头像必须通过图片上传生成', 'error');
                return false;
            }
            return true;
        },
        validateStrongPassword(value, label = '密码') {
            const raw = String(value ?? '');
            if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{8,20}$/.test(raw)) {
                this.toast('提示', `${label}必须为8-20位，至少包含字母和数字`, 'error');
                return false;
            }
            return true;
        },
        validateIdCard(value) {
            const raw = String(value ?? '').trim().toUpperCase();
            if (!/^\d{17}[\dX]$/.test(raw)) {
                this.toast('提示', '身份证号必须为18位，前17位为数字，最后一位为数字或X', 'error');
                return false;
            }
            const birth = raw.slice(6, 14);
            const y = Number(birth.slice(0, 4));
            const m = Number(birth.slice(4, 6));
            const d = Number(birth.slice(6, 8));
            const dt = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00`);
            if (Number.isNaN(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d || dt > new Date()) {
                this.toast('提示', '身份证出生日期不存在或晚于今天', 'error');
                return false;
            }
            return true;
        },
        validateDateOrder(start, end, message = '结束日期不能早于开始日期') {
            if (!start || !end) return true;
            if (String(end) < String(start)) {
                this.toast('提示', message, 'error');
                return false;
            }
            return true;
        },
        taskTypeText(type) {
            const map = { 1: '风险随访', 2: '逾期随访', 3: '预约随访' };
            return map[type] || '未知';
        },
        priorityText(priority) {
            const map = { 1: '低', 2: '中', 3: '高', 4: '紧急' };
            return map[priority] || '未知';
        },
        priorityTag(priority) {
            const map = { 1: 'tag-success', 2: 'tag-warning', 3: 'tag-danger', 4: 'tag-danger' };
            return map[priority] || 'tag-default';
        },
        priorityTag(priority) {
            const map = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' };
            return map[priority] || 'info';
        },
        getRiskColor(level) {
            const map = { 1: '#7E9B96', 2: '#3BB39B', 3: '#E0A44E', 4: '#E06A6A' };
            return map[level] || '#7E9B96';
        },
        // ========== 重点人群管理方法结束 ==========
        reloadCurrentTab() {
            this.switchTab(this.activeTab);
        },
        moduleTitle(key) {
            const item = this.tabs.find(t => t.key === key);
            return item ? item.label : '模块';
        },
        handleUserCommand(command) {
            if (command === 'logout') this.logout();
            else if (command === 'profile') this.switchTab('profile');
        },
        handleWarning(item) {
            this.openWarningHandle(item, 'handle');
        },
        viewWarning(item) {
            this.openWarningDetail(item.id);
        },
        recordFollowup(item) {
            this.openRecordModal(item);
        },
        viewIntervention(item) {
            this.openInterventionDetail(item);
        },
        warnLevelTag(value) {
            const v = Number(value);
            return v === 3 ? 'danger' : v === 2 ? 'warning' : 'info';
        },
        warningStatusTag(value) {
            const v = Number(value);
            return v === 0 ? 'warning' : v === 1 ? 'info' : v === 2 ? 'success' : 'info';
        },
        planStatusTag(value) {
            const v = Number(value);
            return v === 1 ? 'success' : v === 2 ? 'info' : v === 0 ? 'warning' : 'info';
        },
        effectTag(value) {
            const v = Number(value);
            return v === 1 ? 'success' : v === 2 ? 'info' : v === 3 ? 'warning' : 'danger';
        },
        genderText(value) { return Number(value) === 1 ? '男' : '女'; },
        diseaseText(value) { return DISEASE_MAP[Number(value)] || '其他'; },
        freqText(value) { return FREQ_MAP[Number(value)] || '-'; },
        planStatusText(value) { return PLAN_STATUS[Number(value)] || '未知'; },
        followTypeText(value) { return FOLLOW_TYPE_MAP[Number(value)] || '未知'; },
        medicationComplianceText(value) {
            const map = { 1: '完全依从', 2: '部分依从', 3: '不依从' };
            return map[Number(value)] || '-';
        },
        warnLevelText(value) { return WARN_LEVEL_MAP[Number(value)] || '未知'; },
        warnLevelClass(value) {
            const v = Number(value);
            return v === 3 ? 'tag-danger' : v === 2 ? 'tag-warning' : 'tag-info';
        },
        warnTypeText(value) { return WARN_TYPE_MAP[Number(value)] || '其他'; },
        warningStatusText(value) { return WARN_STATUS_MAP[Number(value)] || '未知'; },
        warningStatusClass(value) {
            const v = Number(value);
            return v === 0 ? 'tag-warning' : v === 1 ? 'tag-info' : v === 2 ? 'tag-success' : 'tag-default';
        },
        interventionText(value) { return INTERVENTION_MAP[Number(value)] || '其他'; },
        interventionClass(value) {
            const v = Number(value);
            return v === 1 ? 'tag-info' : v === 2 ? 'tag-success' : v === 3 ? 'tag-danger' : 'tag-warning';
        },
        effectText(value) { return EFFECT_MAP[Number(value)] || '未知'; },
        effectClass(value) {
            const v = Number(value);
            return v === 1 ? 'tag-success' : v === 2 ? 'tag-info' : v === 3 ? 'tag-warning' : 'tag-danger';
        },
        dateText(v) {
            if (!v) return '-';
            return String(v).replace('T', ' ').slice(0, 10);
        },
        dateTimeText(v) {
            if (!v) return '-';
            return String(v).replace('T', ' ').slice(0, 16);
        },
        openDatePicker(event) {
            const input = event && event.target;
            if (!input || typeof input.showPicker !== 'function') return;
            try {
                input.showPicker();
            } catch (error) {
                // showPicker may be rejected if the browser decides the focus event is not user-initiated.
            }
        },
        blockDateTyping(event) {
            const allowedKeys = ['Tab', 'Escape'];
            if (!allowedKeys.includes(event.key)) event.preventDefault();
        },
        pageWindow(current, total) {
            const pages = [];
            const start = Math.max(1, current - 2);
            const end = Math.min(total, start + 4);
            for (let i = start; i <= end; i += 1) pages.push(i);
            return pages;
        },
        async bootstrap() {
            await Promise.all([
                this.loadDashboard(),
                this.loadProfile(),
                this.loadRiskStats(),
                this.loadTodayTasks()
            ]);
        },
        async bootstrapNurse() {
            await Promise.all([
                this.loadNurseDashboard(),
                this.loadProfile()
            ]);
        },
        async bootstrapAdmin() {
            await Promise.all([
                this.loadAdminDashboard(),
                this.loadProfile()
            ]);
        },
        async loadAdminDashboard() {
            this.adminDashboard.loading = true;
            const [elders, warnings, followup, assess, referrals, exams, interventions, latestWarnings, latestReferrals] = await Promise.all([
                this.api('/api/elders/stats'),
                this.api('/api/warnings/stats'),
                this.api('/api/followup/stats'),
                this.api('/api/assessments/stats'),
                this.api('/api/referrals/stats'),
                this.api('/api/exams/stats'),
                this.api('/api/intervention/stats'),
                this.api('/api/warnings?pageNum=1&pageSize=6&status=0'),
                this.api('/api/referrals?pageNum=1&pageSize=6')
            ]);
            const s = this.adminDashboard.stats;
            if (elders?.code === 200) {
                s.elderTotal = elders.data.total || 0;
                s.elderMale = elders.data.male || 0;
                s.elderFemale = elders.data.female || 0;
                // 用户/角色估算：无专用接口，先按已知种子/关系粗算，后续接管理接口再替换
                s.doctorCount = elders.data.doctorCount || 0;
                s.nurseCount = elders.data.nurseCount || 0;
            }
            if (warnings?.code === 200) {
                s.warningTotal = warnings.data.total || 0;
                s.warningPending = warnings.data.pending || 0;
                s.warningToday = warnings.data.todayCount || warnings.data.today || 0;
            }
            if (followup?.code === 200) {
                s.followupTotal = followup.data.total || 0;
                s.followupActive = followup.data.active || followup.data.processing || 0;
            }
            if (assess?.code === 200) s.assessmentTotal = assess.data.total || 0;
            if (referrals?.code === 200) s.referralTotal = referrals.data.total || 0;
            if (exams?.code === 200) s.examTotal = exams.data.total || 0;
            if (interventions?.code === 200) s.interventionTotal = interventions.data.total || 0;
            if (latestWarnings?.code === 200) this.adminDashboard.latestWarnings = latestWarnings.data.records || [];
            if (latestReferrals?.code === 200) this.adminDashboard.latestReferrals = latestReferrals.data.records || [];
            s.userTotal = (s.doctorCount || 0) + (s.nurseCount || 0) + (s.adminCount || 1);
            this.adminDashboard.loading = false;
            this.$nextTick(() => this.renderAdminCharts());
        },
        renderAdminCharts() {
            if (typeof echarts === 'undefined') return;
            const s = this.adminDashboard.stats;
            const genderEl = document.getElementById('adminGenderChart');
            if (genderEl) {
                if (this.charts.adminGender && !this.charts.adminGender.isDisposed()) this.charts.adminGender.dispose();
                this.charts.adminGender = echarts.init(genderEl);
                this.charts.adminGender.setOption({
                    backgroundColor: 'transparent',
                    textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                    tooltip: {
                        trigger: 'item',
                        backgroundColor: 'rgba(27,34,43,0.92)',
                        borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                        textStyle: { color: '#E6EDF3' },
                        extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);'
                    },
                    legend: { bottom: 0, textStyle: { color: '#8B98A5' }, inactiveColor: '#454F5B' },
                    color: ['#3BB39B', '#E06A6A'],
                    series: [{
                        type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
                        itemStyle: { borderColor: '#0D1117', borderWidth: 3 },
                        label: { formatter: '{b}\n{c}人 ({d}%)', color: '#B8C2CC' },
                        data: [
                            { name: '男', value: s.elderMale || 0 },
                            { name: '女', value: s.elderFemale || 0 }
                        ]
                    }]
                });
            }
            const roleEl = document.getElementById('adminRoleChart');
            if (roleEl) {
                if (this.charts.adminRole && !this.charts.adminRole.isDisposed()) this.charts.adminRole.dispose();
                this.charts.adminRole = echarts.init(roleEl);
                this.charts.adminRole.setOption({
                    backgroundColor: 'transparent',
                    textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                    tooltip: {
                        trigger: 'axis',
                        backgroundColor: 'rgba(27,34,43,0.92)',
                        borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                        textStyle: { color: '#E6EDF3' },
                        axisPointer: { type: 'line', lineStyle: { color: 'rgba(59,179,155,0.4)', width: 1, type: 'dashed' } },
                        extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);'
                    },
                    grid: { left: 40, right: 20, top: 30, bottom: 30 },
                    xAxis: {
                        type: 'category', data: ['管理员', '医生', '护士'],
                        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
                        axisTick: { show: false },
                        axisLabel: { color: '#8B98A5' },
                        splitLine: { show: false }
                    },
                    yAxis: {
                        type: 'value',
                        axisLine: { show: false },
                        axisLabel: { color: '#8B98A5' },
                        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } }
                    },
                    color: ['#3BB39B'],
                    series: [{
                        type: 'bar', barWidth: 40,
                        itemStyle: {
                            borderRadius: [4, 4, 0, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#3BB39B' },
                                { offset: 1, color: 'rgba(59,179,155,0.15)' }
                            ]),
                            shadowColor: 'rgba(59,179,155,0.4)', shadowBlur: 10
                        },
                        data: [s.adminCount || 1, s.doctorCount || 0, s.nurseCount || 0]
                    }]
                });
            }
            const bizEl = document.getElementById('adminBizChart');
            if (bizEl) {
                if (this.charts.adminBiz && !this.charts.adminBiz.isDisposed()) this.charts.adminBiz.dispose();
                this.charts.adminBiz = echarts.init(bizEl);
                this.charts.adminBiz.setOption({
                    backgroundColor: 'transparent',
                    textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                    tooltip: {
                        trigger: 'axis',
                        backgroundColor: 'rgba(27,34,43,0.92)',
                        borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                        textStyle: { color: '#E6EDF3' },
                        axisPointer: { type: 'line', lineStyle: { color: 'rgba(59,179,155,0.4)', width: 1, type: 'dashed' } },
                        extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);'
                    },
                    grid: { left: 50, right: 20, top: 30, bottom: 40 },
                    xAxis: {
                        type: 'category', data: ['预警', '随访', '干预', '评估', '转诊', '体检'],
                        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
                        axisTick: { show: false },
                        axisLabel: { color: '#8B98A5' },
                        splitLine: { show: false }
                    },
                    yAxis: {
                        type: 'value',
                        axisLine: { show: false },
                        axisLabel: { color: '#8B98A5' },
                        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } }
                    },
                    color: ['#3BB39B'],
                    series: [{
                        type: 'bar', barWidth: 32,
                        itemStyle: { borderRadius: [4, 4, 0, 0], color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: '#3BB39B' }, { offset: 1, color: 'rgba(59,179,155,0.15)' }]
                        }, shadowColor: 'rgba(59,179,155,0.4)', shadowBlur: 10 },
                        data: [s.warningTotal, s.followupTotal, s.interventionTotal, s.assessmentTotal, s.referralTotal, s.examTotal]
                    }]
                });
            }
        },
        async loadDashboard() {
            const [elders, warnings, followup, latestWarnings, latestPlans, todo, reviewCounts, chronic, assessments] = await Promise.all([
                this.api('/api/elders/stats'),
                this.api('/api/warnings/stats'),
                this.api('/api/followup/stats'),
                this.api('/api/warnings?pageNum=1&pageSize=5&status=0'),
                this.api('/api/followup/plans?pageNum=1&pageSize=5&status=1'),
                this.api('/api/dashboard/todo'),
                this.api('/api/dashboard/review-counts'),
                this.api('/api/dashboard/chronic-overview'),
                this.api('/api/assessments/stats')
            ]);
            if (elders?.code === 200) this.dashboard.stats.eldersTotal = elders.data.total || 0;
            if (warnings?.code === 200) {
                this.dashboard.stats.warningPending = warnings.data.pending || 0;
            }
            if (followup?.code === 200) {
                this.dashboard.stats.followupActive = followup.data.activePlans || 0;
                this.dashboard.stats.todayTodo = (followup.data.dueTodayCount || 0) + (warnings?.data?.pending || 0);
            }
            if (latestWarnings?.code === 200) this.dashboard.latestWarnings = latestWarnings.data.records || [];
            if (latestPlans?.code === 200) this.dashboard.latestFollowups = latestPlans.data.records || [];
            if (todo?.code === 200) {
                this.todoList = todo.data || this.todoList;
                this.dashboard.stats.todayTodo = (todo.data.totalTodo || 0);
            }
            if (reviewCounts?.code === 200) {
                this.reviewCounts = reviewCounts.data || this.reviewCounts;
            }
            if (chronic?.code === 200) {
                this.chronicOverview = chronic.data || this.chronicOverview;
            }
            this.scheduleDashboardCharts(
                elders?.code === 200 ? elders.data : null,
                warnings?.code === 200 ? warnings.data : null,
                followup?.code === 200 ? followup.data : null
            );
        },
        scheduleDashboardCharts(eldersData, warningsData, followData) {
            const tryRender = (retry = 0) => {
                const ok1 = this.renderGenderChart(eldersData);
                const ok2 = this.renderWarningChart(warningsData);
                const ok3 = this.renderFollowChart(followData);
                if ((!ok1 || !ok2 || !ok3) && retry < 5) {
                    setTimeout(() => tryRender(retry + 1), 200);
                }
            };
            this.$nextTick(() => tryRender(0));
        },
        ensureChart(key, elementId) {
            const el = document.getElementById(elementId);
            if (!el || !window.echarts) return null;
            if (!this.charts[key] || this.charts[key].isDisposed?.()) {
                while (el.firstChild) el.removeChild(el.firstChild);
                this.charts[key] = window.echarts.init(el);
            } else if (this.charts[key].getDom() !== el) {
                this.charts[key].dispose();
                while (el.firstChild) el.removeChild(el.firstChild);
                this.charts[key] = window.echarts.init(el);
            }
            return this.charts[key];
        },
        renderGenderChart(data) {
            const chart = this.ensureChart('gender', 'genderChart');
            if (!chart) return false;
            const male = data?.male || 0;
            const female = data?.female || 0;
            const total = male + female;
            chart.setOption({
                backgroundColor: 'transparent',
                textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                title: { text: '性别比例', left: 'center', top: 6, textStyle: { fontSize: 14, fontWeight: 600, color: '#E6EDF3' } },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(27,34,43,0.92)',
                    borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                    textStyle: { color: '#E6EDF3' },
                    extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);',
                    formatter: (p) => {
                        const pct = total ? ((p.value / total) * 100).toFixed(1) : 0;
                        return `<strong>${p.name}</strong><br/>人数：${p.value} 人<br/>占比：${pct}%`;
                    }
                },
                graphic: [{
                    type: 'text', left: 'center', top: '46%',
                    style: { text: `${total} 人`, fontSize: 18, fontWeight: 'bold', fill: '#E6EDF3', textAlign: 'center', textVerticalAlign: 'middle' }
                }],
                series: [{
                    type: 'pie',
                    radius: ['52%', '72%'],
                    avoidLabelOverlap: true,
                    padAngle: 2,
                    itemStyle: { borderRadius: 6, borderColor: '#0D1117', borderWidth: 3 },
                    label: {
                        formatter: (p) => `${p.name}\n${p.percent?.toFixed(1) || 0}%`,
                        fontSize: 12, fontWeight: 500, color: '#B8C2CC'
                    },
                    labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
                    emphasis: {
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(59,179,155,0.5)' },
                        label: { fontSize: 14, fontWeight: 'bold' }
                    },
                    animationDelay: () => Math.random() * 200,
                    data: [
                        { value: male, name: '男' },
                        { value: female, name: '女' }
                    ],
                    color: ['#4FB6C4', '#E8895A']
                }]
            }, true);
            chart.resize();
            return true;
        },
        renderWarningChart(data) {
            const chart = this.ensureChart('warning', 'warningChart');
            if (!chart) return false;
            const yellow = data?.yellow || 0;
            const orange = data?.orange || 0;
            const red = data?.red || 0;
            const total = yellow + orange + red;
            chart.setOption({
                backgroundColor: 'transparent',
                textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                title: { text: '预警级别分布', left: 'center', top: 6, textStyle: { fontSize: 14, fontWeight: 600, color: '#E6EDF3' } },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(27,34,43,0.92)',
                    borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                    textStyle: { color: '#E6EDF3' },
                    extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);',
                    formatter: (p) => {
                        const pct = total ? ((p.value / total) * 100).toFixed(1) : 0;
                        return `<strong>${p.name}级别</strong><br/>数量：${p.value} 条<br/>占比：${pct}%`;
                    }
                },
                legend: {
                    bottom: 4,
                    textStyle: { fontSize: 11, color: '#8B98A5' },
                    inactiveColor: '#454F5B',
                    itemWidth: 10,
                    itemHeight: 10
                },
                series: [{
                    type: 'pie',
                    radius: ['42%', '68%'],
                    center: ['50%', '44%'],
                    avoidLabelOverlap: true,
                    padAngle: 1.5,
                    itemStyle: { borderRadius: 4, borderColor: '#0D1117', borderWidth: 3 },
                    label: {
                        formatter: (p) => `${p.name}\n${p.value}条`,
                        fontSize: 11, color: '#B8C2CC'
                    },
                    labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
                    emphasis: {
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(59,179,155,0.5)' },
                        label: { fontSize: 13, fontWeight: 'bold' }
                    },
                    animationType: 'scale',
                    animationDelay: () => Math.random() * 200,
                    data: [
                        { value: yellow, name: '低', itemStyle: { color: '#E0A44E' } },
                        { value: orange, name: '中', itemStyle: { color: '#FF8A3D' } },
                        { value: red, name: '高', itemStyle: { color: '#E06A6A' } }
                    ]
                }]
            }, true);
            chart.resize();
            return true;
        },
        renderCharts() {
            this.scheduleDashboardCharts(
                null, null, null
            );
        },
        renderFollowChart(data) {
            const chart = this.ensureChart('follow', 'followChart');
            if (!chart) return false;
            const active = data?.activePlans || 0;
            const total = data?.totalPlans || 0;
            const pct = total ? Math.round((active / total) * 100) : 0;
            chart.setOption({
                backgroundColor: 'transparent',
                textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                title: { text: '随访进度', left: 'center', top: 6, textStyle: { fontSize: 14, fontWeight: 600, color: '#E6EDF3' } },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(27,34,43,0.92)',
                    borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                    textStyle: { color: '#E6EDF3' },
                    extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);',
                    formatter: (p) => `<strong>${p.name}</strong><br/>数量：${p.value} 个<br/>占比：${p.percent?.toFixed(1) || 0}%`
                },
                graphic: [{
                    type: 'text', left: 'center', top: '44%',
                    style: { text: `${pct}%`, fontSize: 28, fontWeight: 'bold', fill: '#3BB39B', textAlign: 'center', textVerticalAlign: 'middle' }
                }, {
                    type: 'text', left: 'center', top: '54%',
                    style: { text: `${active}/${total}`, fontSize: 13, fill: '#8B98A5', textAlign: 'center', textVerticalAlign: 'middle' }
                }],
                series: [{
                    type: 'pie',
                    radius: ['52%', '74%'],
                    avoidLabelOverlap: true,
                    padAngle: 3,
                    clockwise: true,
                    itemStyle: { borderRadius: 8, borderColor: '#0D1117', borderWidth: 3 },
                    label: { show: false },
                    emphasis: {
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(59,179,155,0.5)' },
                        scale: true,
                        scaleSize: 6
                    },
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDelay: () => Math.random() * 150,
                    data: [
                        { value: active, name: '进行中', itemStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#3BB39B' }, { offset: 1, color: '#2E9683' }]) } },
                        { value: Math.max(total - active, 0), name: '待执行', itemStyle: { color: 'rgba(255,255,255,0.08)' } }
                    ]
                }]
            }, true);
            chart.resize();
            return true;
        },
        resizeCharts() {
            Object.values(this.charts).forEach(chart => {
                try {
                    if (chart && !chart.isDisposed() && chart.resize) {
                        chart.resize();
                    }
                } catch(e) { /* ignore */ }
            });
        },
        assessmentTypeText(value) {
            return ASSESSMENT_TYPE_MAP[Number(value)] || '未知';
        },
        referralTypeText(value) {
            return REFERRAL_TYPE_MAP[Number(value)] || '未知';
        },
        referralStatusText(value) {
            return REFERRAL_STATUS_MAP[Number(value)] || '未知';
        },
        urgencyText(value) {
            return URGENCY_MAP[Number(value)] || '未知';
        },
        deviceTypeText(value) {
            return DEVICE_TYPE_MAP[Number(value)] || '未知';
        },
        vitalTypeText(value) {
            return VITAL_TYPE_MAP[Number(value)] || '未知';
        },
        vitalKeyText(key) {
            const map = {
                systolic: '收缩压',
                diastolic: '舒张压',
                heartRate: '心率',
                bloodSugarFasting: '空腹血糖',
                bloodSugarPostprandial: '餐后血糖',
                spo2: '血氧',
                temperature: '体温',
                steps: '步数',
                sleep: '睡眠'
            };
            return map[key] || key || '未知';
        },
        timelineTypeText(value) {
            return TIMELINE_TYPE_MAP[Number(value)] || '未知';
        },
        async loadElders(page = 1) {
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.elderPage.pageSize,
                name: this.elderFilter.name || '',
                community: this.elderFilter.community || '',
                doctorId: this.elderFilter.doctorId || '',
                diseaseType: this.elderFilter.diseaseType || ''
            });
            const res = await this.api(`/api/elders?${query.toString()}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.elderPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.elderPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
        },
        openElderModal(item = null) {
            this.elderForm = item ? { ...blankElder(), ...item } : blankElder();
            this.modal = 'elder';
            this.modalData = { item };
            // 如果是编辑模式，加载老人的风险信息
            if (item && item.id) {
                this.loadElderRiskProfile(item.id);
            }
        },
        async loadElderRiskProfile(elderId) {
            try {
                const res = await this.api(`/api/risk/elders/${elderId}`);
                if (res && res.code === 200) {
                    const detail = res.data;
                    this.modalData.riskProfile = detail.profile;
                    // 解析评分详情
                    if (detail.profile && detail.profile.reasonJson) {
                        try {
                            this.modalData.riskDetails = JSON.parse(detail.profile.reasonJson);
                        } catch (e) {
                            console.error('解析风险详情失败', e);
                        }
                    }
                }
            } catch (error) {
                console.error('加载风险信息失败', error);
            }
        },
        async saveElder() {
            if (!this.elderForm.name || !this.elderForm.idCard || !this.elderForm.phone) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            if (!this.validateIdCard(this.elderForm.idCard)) return;
            if (!this.validatePhone(this.elderForm.phone, '联系电话', true)) return;
            if (!this.validatePhone(this.elderForm.emergencyPhone, '紧急联系电话', false)) return;
            const doctorId = this.elderForm.doctorId
                ? this.normalizePositiveId(this.elderForm.doctorId, '责任医生ID')
                : (this.userInfo.userId || this.userInfo.id || 1);
            if (!doctorId) return;
            const body = {
                ...this.elderForm,
                idCard: String(this.elderForm.idCard).trim().toUpperCase(),
                phone: String(this.elderForm.phone).trim(),
                emergencyPhone: String(this.elderForm.emergencyPhone || '').trim(),
                doctorId: Number(doctorId)
            };
            const isEdit = !!body.id;
            const res = await this.api(isEdit ? `/api/elders/${body.id}` : '/api/elders', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '档案更新成功' : '新增档案成功');
                this.closeModal();
                this.loadElders(this.elderPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async deleteElder(id) {
            if (!confirm('确认要删除吗？')) return;
            const res = await this.api(`/api/elders/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                this.toast('成功', '删除成功');
                this.loadElders(this.elderPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async openHealthDetail(elderId) {
            this.modal = 'healthDetail';
            this.modalData = { elderId };
            this.healthDetail = { loading: true, data: null };
            const res = await this.api(`/api/health-detail/${elderId}`);
            if (res?.code === 200) {
                this.healthDetail = {
                    loading: false,
                    data: {
                        medicalHistory: res.data.medicalHistory || [],
                        medications: res.data.medications || [],
                        allergies: res.data.allergies || [],
                        familyHistory: res.data.familyHistory || []
                    }
                };
            } else {
                this.healthDetail = { loading: false, data: null };
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadWarnings(page = 1) {
            const elderId = this.validateOptionalPositiveId(this.warningFilter.elderId, '老人ID');
            if (elderId === null) return;
            this.warningFilter.elderId = elderId;
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.warningPage.pageSize,
                status: this.warningFilter.status || '',
                warningLevel: this.warningFilter.warningLevel || '',
                elderId: elderId || ''
            });
            const res = await this.api(`/api/warnings?${query.toString()}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.warningPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.warningPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
            this.loadRealtimeWarningFeed();
        },
        async loadRealtimeStats() {
            const res = await this.api('/api/warnings/stats/realtime');
            if (res?.code === 200 && res.data) {
                this.realtime = {
                    redPending: res.data.redPending || 0,
                    orangePending: res.data.orangePending || 0,
                    yellowPending: res.data.yellowPending || 0,
                    totalPending: res.data.totalPending || 0,
                    hourlyTrend: res.data.hourlyTrend || [],
                    onlineDoctors: res.data.onlineDoctors || 0
                };
                this.syncRealtimeFeedFromWarnings(res.data.recentWarnings || []);
                this.$nextTick(() => this.renderRtTrendChartWithRetry());
            }
        },
        async loadRealtimeWarningFeed() {
            const res = await this.api('/api/warnings?pageNum=1&pageSize=8');
            if (res?.code === 200) {
                this.syncRealtimeFeedFromWarnings((res.data || {}).records || []);
            }
        },
        renderRtTrendChartWithRetry(retry = 0) {
            const rendered = this.renderRtTrendChart();
            if (!rendered && retry < 8) {
                setTimeout(() => this.renderRtTrendChartWithRetry(retry + 1), 200);
            }
        },
        renderRtTrendChart() {
            const el = document.getElementById('rtTrendChart');
            if (!el) return false;
            while (el.firstChild) el.removeChild(el.firstChild);
            const trend = Array.isArray(this.realtime.hourlyTrend) ? this.realtime.hourlyTrend : [];
            const xData = trend.map(t => String(t?.hour || ''));
            const yData = trend.map(t => Number(t?.count || 0));
            const width = Math.max(el.clientWidth || 720, 320);
            const height = Math.max(el.clientHeight || 220, 180);
            const pad = { left: 44, right: 18, top: 20, bottom: 34 };
            const chartWidth = width - pad.left - pad.right;
            const chartHeight = height - pad.top - pad.bottom;
            const maxValue = Math.max(1, ...yData);
            const points = yData.map((value, index) => {
                const x = pad.left + (xData.length <= 1 ? chartWidth : (chartWidth * index) / (xData.length - 1));
                const y = pad.top + chartHeight - (chartHeight * value) / maxValue;
                return { x, y, value, label: xData[index] || '' };
            });
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', '近 24 小时预警趋势');
            const make = (tag, attrs = {}, text = '') => {
                const node = document.createElementNS(ns, tag);
                Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
                if (text) node.textContent = text;
                return node;
            };
            [0, 0.25, 0.5, 0.75, 1].forEach(ratio => {
                const y = pad.top + chartHeight * ratio;
                svg.appendChild(make('line', { x1: pad.left, y1: y, x2: width - pad.right, y2: y, stroke: 'rgba(120,200,185,0.10)', 'stroke-width': 1 }));
            });
            if (points.length) {
                const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - pad.bottom} L ${points[0].x.toFixed(1)} ${height - pad.bottom} Z`;
                svg.appendChild(make('path', { d: area, fill: 'rgba(59,179,155,0.13)' }));
                svg.appendChild(make('path', { d: path, fill: 'none', stroke: '#3BB39B', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
                points.forEach((p, index) => {
                    svg.appendChild(make('circle', { cx: p.x, cy: p.y, r: 4, fill: '#3BB39B', stroke: '#0D1917', 'stroke-width': 2 }));
                    if (index % Math.ceil(points.length / 8) === 0 || index === points.length - 1) {
                        svg.appendChild(make('text', { x: p.x, y: height - 10, fill: '#8A9C98', 'font-size': 11, 'text-anchor': 'middle' }, p.label));
                    }
                });
            }
            svg.appendChild(make('text', { x: pad.left - 8, y: pad.top + 4, fill: '#8A9C98', 'font-size': 11, 'text-anchor': 'end' }, String(maxValue)));
            svg.appendChild(make('text', { x: pad.left - 8, y: height - pad.bottom + 4, fill: '#8A9C98', 'font-size': 11, 'text-anchor': 'end' }, '0'));
            el.appendChild(svg);
            return true;
        },
        connectSse() {
            if (!this.token || this.sse.source) return;
            if (typeof EventSource === 'undefined') {
                console.warn('浏览器不支持 EventSource, 实时推送不可用');
                return;
            }
            this.sse.connecting = true;
            const source = new EventSource(`/api/warnings/stream?token=${encodeURIComponent(this.token)}`);
            this.sse.source = source;
            source.addEventListener('connected', () => {
                this.sse.connected = true;
                this.sse.connecting = false;
                this.sse.retry = 0;
            });
            source.addEventListener('warning', (e) => this.onSseWarning(e));
            source.addEventListener('error', () => {
                // 服务端鉴权失败事件或连接中断
                this.sse.connected = false;
            });
            source.onerror = () => {
                this.sse.connected = false;
                this.sse.connecting = false;
                // EventSource 会自动重连; 若被服务端关闭则手动退避重连
                if (source.readyState === EventSource.CLOSED) {
                    this.disconnectSse();
                    this.sse.retry = Math.min(this.sse.retry + 1, 6);
                    const delay = Math.min(1000 * Math.pow(2, this.sse.retry), 30000);
                    setTimeout(() => { if (this.token) this.connectSse(); }, delay);
                }
            };
        },
        warningToRealtimeFeedItem(row, index = 0) {
            const createdAt = row?.createTime || row?.triggerTime || row?.eventTime || row?.createdAt;
            const timeText = createdAt
                ? this.dateTimeText(createdAt).slice(11) || this.dateTimeText(createdAt)
                : new Date().toLocaleTimeString('zh-CN', { hour12: false });
            return {
                id: row?.id || null,
                warningId: row?.id || row?.warningId || null,
                warningLevel: Number(row?.warningLevel || row?.level || 1),
                warningTitle: row?.warningTitle || row?.title || '健康异常预警',
                warningType: Number(row?.warningType || row?.type || 9),
                elderId: row?.elderId || '-',
                _key: `warning_${row?.id || Date.now()}_${index}`,
                _time: timeText
            };
        },
        syncRealtimeFeedFromWarnings(records = []) {
            const feed = (records || []).slice(0, 8).map((row, index) => this.warningToRealtimeFeedItem(row, index));
            if (feed.length) {
                this.realtimeFeed = feed;
            }
        },
        onSseWarning(e) {
            let data;
            try { data = JSON.parse(e.data); } catch (_) { return; }
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (_) { return; }
            }
            if (!this.shouldAcceptRealtimeWarning(data)) return;
            const item = this.warningToRealtimeFeedItem(data);
            item._key = Date.now() + '_' + Math.random();
            item._time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            this.realtimeFeed.unshift(item);
            if (this.realtimeFeed.length > 20) this.realtimeFeed.pop();
            this.showRealtimeWarningAlert(data);
            const lvText = this.warnLevelText(data.warningLevel);
            this.toast(`🚨 新预警 · ${lvText}`, `${data.warningTitle || ''}（老人 ${data.elderId}）`, data.warningLevel >= 3 ? 'error' : 'warning');
            this.loadRealtimeStats();
            if (this.activeTab === 'warnings') this.loadWarnings(this.warningPage.pageNum);
        },
        shouldAcceptRealtimeWarning(data) {
            if (!data) return false;
            if (!data.id && !data.warningId && !data.warningTitle && !data.warningContent && !data.elderId) {
                console.log('[SSE] 忽略空预警事件:', data);
                return false;
            }
            const now = Date.now();
            const warningId = data.id || data.warningId;
            if (warningId != null) {
                if (Object.prototype.hasOwnProperty.call(this.alertedWarningIds, warningId)) {
                    console.log('[SSE] 忽略重复预警(id):', warningId);
                    return false;
                }
                this.alertedWarningIds[warningId] = now;
                const ids = Object.keys(this.alertedWarningIds);
                if (ids.length > 500) {
                    ids.sort((a, b) => this.alertedWarningIds[a] - this.alertedWarningIds[b]);
                    for (let i = 0; i < 100; i += 1) delete this.alertedWarningIds[ids[i]];
                }
            }
            Object.keys(this.recentAlertFingerprints).forEach((key) => {
                if (this.recentAlertFingerprints[key] <= now) delete this.recentAlertFingerprints[key];
            });
            const fp = [
                data.elderId || '',
                data.warningType || '',
                data.warningLevel || '',
                data.warningTitle || '',
                data.warningValue || ''
            ].join('|');
            if (this.recentAlertFingerprints[fp]) {
                console.log('[SSE] 忽略重复预警(指纹):', fp);
                return false;
            }
            this.recentAlertFingerprints[fp] = now + 5000;
            return true;
        },
        showRealtimeWarningAlert(data) {
            this.playWarningSound(Number(data.warningLevel || 3));
            this.realtimeWarning = { ...data, id: data.id || data.warningId };
            this.warningAlertVisible = true;
            if (this.warningAlertTimer) clearTimeout(this.warningAlertTimer);
            this.warningAlertTimer = setTimeout(() => {
                this.warningAlertVisible = false;
                this.realtimeWarning = null;
                this.warningAlertTimer = null;
            }, 10000);
        },
        playWarningSound(level) {
            try {
                if (!this.audioCtx) {
                    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                const ctx = this.audioCtx;
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                if (level === 3) {
                    oscillator.frequency.value = 880;
                    oscillator.type = 'square';
                } else if (level === 2) {
                    oscillator.frequency.value = 660;
                    oscillator.type = 'triangle';
                } else {
                    oscillator.frequency.value = 440;
                    oscillator.type = 'sine';
                }
                gainNode.gain.value = 0.1;
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                oscillator.stop(ctx.currentTime + 0.5);
            } catch (err) {
                console.warn('[SSE] 音频播放失败:', err);
            }
        },
        dismissWarningAlert() {
            if (this.warningAlertTimer) {
                clearTimeout(this.warningAlertTimer);
                this.warningAlertTimer = null;
            }
            this.warningAlertVisible = false;
            this.realtimeWarning = null;
        },
        handleRealtimeWarningAction() {
            const item = this.realtimeWarning;
            if (!item) return;
            this.dismissWarningAlert();
            this.switchTab('warnings');
            if (item.id) {
                this.openWarningHandle(item, 'handle');
            } else {
                this.loadWarnings(1);
            }
        },
        disconnectSse() {
            if (this.sse.source) {
                try { this.sse.source.close(); } catch (_) {}
            }
            this.sse.source = null;
            this.sse.connected = false;
            this.sse.connecting = false;
            if (this.warningAlertTimer) {
                clearTimeout(this.warningAlertTimer);
                this.warningAlertTimer = null;
            }
        },
        openWarningModal() {
            this.warningForm = blankWarning();
            this.modal = 'warning';
            this.modalData = {};
        },
        async saveWarning() {
            if (!this.warningForm.elderId || !this.warningForm.warningTitle) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const body = { ...this.warningForm, doctorId: this.warningForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1) };
            const res = await this.api('/api/warnings', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', '预警创建成功');
                this.closeModal();
                this.loadWarnings(this.warningPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        openWarningHandle(item, action) {
            this.warningForm = blankWarning();
            this.modalData = { item, action };
            this.modal = 'warning-handle';
        },
        async submitWarningHandle() {
            const item = this.modalData.item;
            if (!item) return;
            if (!this.warningForm.handleResult) {
                this.toast('提示', '请填写处理意见', 'error');
                return;
            }
            const url = this.modalData.action === 'handle' ? `/api/warnings/${item.id}/handle` : `/api/warnings/${item.id}/ignore`;
            const payload = { handleResult: this.warningForm.handleResult, doctorId: this.userInfo.userId || this.userInfo.id || 1 };
            const res = await this.api(url, { method: 'PUT', body: JSON.stringify(payload) });
            if (res?.code === 200) {
                this.toast('成功', '预警处理成功');
                this.closeModal();
                this.loadWarnings(this.warningPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async openWarningDetail(id) {
            const res = await this.api(`/api/warnings/${id}`);
            if (res?.code === 200) {
                this.modal = 'warning-detail';
                this.modalData = { item: res.data };
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadFollowups(page = 1) {
            const elderId = this.validateOptionalPositiveId(this.followFilter.elderId, '老人ID');
            if (elderId === null) return;
            this.followFilter.elderId = elderId;
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.followPage.pageSize,
                status: this.followFilter.status || '',
                diseaseType: this.followFilter.diseaseType || '',
                elderId: elderId || ''
            });
            const res = await this.api(`/api/followup/plans?${query.toString()}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.followPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.followPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
        },
        openPlanModal(item = null) {
            this.planForm = item ? { ...blankPlan(), ...item } : blankPlan();
            if (!item) this.planForm.startDate = new Date().toISOString().slice(0, 10);
            this.modal = 'plan';
            this.modalData = { item };
        },
        async savePlan() {
            if (!this.planForm.planName || !this.planForm.elderId) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const elderId = this.normalizePositiveId(this.planForm.elderId, '老人ID');
            if (!elderId) return;
            const totalCount = this.normalizePositiveId(this.planForm.totalCount, '计划总次数');
            if (!totalCount) return;
            if (!this.validateDateOrder(this.planForm.startDate, this.planForm.endDate)) return;
            if (!this.validateDateOrder(this.planForm.startDate, this.planForm.nextFollowDate, '下次随访日期不能早于开始日期')) return;
            this.planForm.elderId = Number(elderId);
            this.planForm.totalCount = Number(totalCount);
            const body = { ...this.planForm, doctorId: this.planForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1) };
            body.status = Number(body.status ?? 1);
            const isEdit = !!body.id;
            const res = await this.api(isEdit ? `/api/followup/plans/${body.id}` : '/api/followup/plans', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '随访计划更新成功' : '随访计划创建成功');
                this.closeModal();
                this.loadFollowups(this.followPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async markWarningProcessing(item) {
            if (!item?.id) return;
            const res = await this.api(`/api/warnings/${item.id}/processing`, {
                method: 'PUT',
                body: JSON.stringify({ doctorId: this.userInfo.userId || this.userInfo.id || 1 })
            });
            if (res?.code === 200) {
                this.toast('成功', '预警已标记为处理中');
                this.loadWarnings(this.warningPage.pageNum);
                this.loadRealtimeStats();
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async deletePlan(id) {
            if (!confirm('确认删除此随访计划吗？')) return;
            const res = await this.api(`/api/followup/plans/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                this.toast('成功', '随访计划删除成功');
                this.loadFollowups(this.followPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '删除失败', 'error');
            }
        },
        async deleteGeneratedFollowupPlans() {
            if (!confirm('确认清理所有自动生成的风险随访计划吗？\n此按钮只删除系统自动生成的演示计划，不会删除手工新增计划。')) return;
            const res = await this.api('/api/followup/plans/generated', { method: 'DELETE' });
            if (res?.code === 200) {
                const count = Number(res.data || 0);
                this.toast('成功', `已清理 ${count} 条自动生成计划`);
                this.loadFollowups(1);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '清理失败', 'error');
            }
        },
        async changeFollowPlanStatus(id, status) {
            const res = await this.api(`/api/followup/plans/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PUT' });
            if (res?.code === 200) {
                this.toast('成功', '随访状态已更新');
                this.loadFollowups(this.followPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '状态更新失败', 'error');
                this.loadFollowups(this.followPage.pageNum);
            }
        },
        openRecordModal(plan) {
            this.followRecordForm = {
                ...blankFollowRecord(),
                planId: plan.id,
                elderId: plan.elderId,
                diseaseType: plan.diseaseType,
                doctorId: this.userInfo.userId || this.userInfo.id || 1
            };
            this.modal = 'record';
            this.modalData = { plan };
        },
        async saveFollowRecord() {
            if (!this.followRecordForm.followResult) {
                this.toast('提示', '请填写随访结果', 'error');
                return;
            }
            const ranges = [
                ['systolicPressure', '收缩压', 60, 240],
                ['diastolicPressure', '舒张压', 40, 140],
                ['heartRate', '心率', 30, 180],
                ['bloodSugarFasting', '空腹血糖', 2, 30],
                ['weight', '体重', 20, 200]
            ];
            for (const [key, label, min, max] of ranges) {
                const value = this.followRecordForm[key];
                if (value !== '' && value !== null && value !== undefined && (Number(value) < min || Number(value) > max)) {
                    this.toast('提示', `${label}必须在${min}到${max}之间`, 'error');
                    return;
                }
            }
            const body = {
                ...this.followRecordForm,
                doctorId: this.followRecordForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1)
            };
            const res = await this.api('/api/followup/records', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', '随访记录保存成功');
                this.closeModal();
                this.loadFollowups(this.followPage.pageNum);
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async openFollowRecords(plan) {
            this.followRecordsPlan = plan;
            this.followRecords = [];
            this.modal = 'follow-records';
            this.modalData = { plan };
            const query = new URLSearchParams({ pageNum: 1, pageSize: 50, planId: plan.id });
            const res = await this.api(`/api/followup/records?${query.toString()}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.followRecords = pg.records || [];
            } else {
                this.toast('提示', res?.msg || res?.message || '加载随访记录失败', 'error');
            }
        },
        openFollowRecordDetail(record) {
            this.modal = 'follow-record-detail';
            this.modalData = { item: record };
        },
        backToFollowRecords() {
            this.modal = 'follow-records';
            this.modalData = { plan: this.followRecordsPlan };
        },
        async loadInterventions(page = 1, options = {}) {
            const { notify = false } = options;
            this.interventionPage = { ...this.interventionPage, error: '' };
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.interventionPage.pageSize,
                type: this.interventionFilter.type || '',
                elderId: this.interventionFilter.elderId || '',
                followRecordId: this.interventionFilter.followRecordId || ''
            });
            const res = await this.api(`/api/intervention/list?${query.toString()}`, { silent: !notify });
            if (res?.code === 200) {
                const pg = res.data || {};
                this.interventionPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.interventionPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0,
                    error: ''
                };
            } else {
                const message = res?.msg || res?.message || '干预记录加载失败，请稍后重试';
                this.interventionPage = {
                    ...this.interventionPage,
                    records: [],
                    pageNum: page,
                    pages: 0,
                    total: 0,
                    error: message
                };
                if (notify) this.toast('提示', message, 'error');
            }
        },
        openInterventionModal(item = null) {
            this.interventionForm = item ? { ...blankIntervention(), ...item } : blankIntervention();
            this.modal = 'intervention';
            this.modalData = { item };
        },
        async saveIntervention() {
            if (!this.interventionForm.elderId || !this.interventionForm.interventionTitle || !this.interventionForm.interventionContent) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const body = {
                ...this.interventionForm,
                doctorId: this.interventionForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1)
            };
            const isEdit = !!body.id;
            const res = await this.api(isEdit ? `/api/intervention/${body.id}` : '/api/intervention', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '干预记录更新成功' : '干预记录创建成功');
                this.closeModal();
                this.loadInterventions(this.interventionPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async openInterventionDetail(item) {
            this.modal = 'interventionDetail';
            this.modalData = { item };
        },
        async deleteIntervention(id) {
            if (!confirm('确认要删除吗？')) return;
            const res = await this.api(`/api/intervention/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                this.toast('成功', '删除成功');
                this.loadInterventions(this.interventionPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadAssessments(page = 1) {
            const elderId = this.validateOptionalPositiveId(this.assessmentFilter.elderId, '老人ID');
            if (elderId === null) return;
            this.assessmentFilter.elderId = elderId;
            const params = new URLSearchParams();
            params.set('pageNum', page);
            params.set('pageSize', this.assessmentPage.pageSize);
            if (elderId) params.set('elderId', elderId);
            if (this.assessmentFilter.assessType) params.set('assessType', this.assessmentFilter.assessType);
            const [listRes, statsRes] = await Promise.all([
                this.api(`/api/assessments?${params.toString()}`),
                this.api(`/api/assessments/stats${elderId ? `?elderId=${encodeURIComponent(elderId)}` : ''}`)
            ]);
            if (listRes?.code === 200) {
                const pg = listRes.data || {};
                this.assessmentPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.assessmentPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
            if (statsRes?.code === 200) {
                this.assessmentStats = statsRes.data || { total: 0 };
            }
        },
        openAssessmentModal(item = null) {
            this.assessmentForm = item ? { ...blankAssessment(), ...item } : blankAssessment();
            this.modal = 'assessment';
            this.modalData = { item };
        },
        openAssessmentReport(elderId = '') {
            this.openUnifiedHealthReport(elderId);
        },
        openUnifiedHealthReport(elderId = '') {
            this.generateReportInput = { elderId: elderId ? String(elderId) : '' };
            this.modal = 'report-input';
            this.modalData = {};
        },
        submitGenerateReport() {
            const elderId = this.normalizePositiveId(this.generateReportInput.elderId, '老人档案ID');
            if (!elderId) {
                if (elderId === '') this.toast('提示', '请输入老人档案ID', 'error');
                return;
            }
            this.generateReport(elderId);
        },
        submitAiAssessmentFromUnified() {
            const elderId = this.normalizePositiveId(this.generateReportInput.elderId, '老人档案ID');
            if (!elderId) {
                if (elderId === '') this.toast('提示', '请输入老人档案ID', 'error');
                return;
            }
            this.runAiAssessment(elderId);
        },
        async generateReport(elderId) {
            this.reportData = { loading: true, error: '', data: null };
            this.modal = 'assessment-report';
            this.modalData = {};
            const res = await this.api(`/api/assessments/report/${encodeURIComponent(elderId)}`);
            if (res?.code === 200) {
                this.reportData = { loading: false, error: '', data: res.data };
            } else {
                this.reportData = { loading: false, error: res?.msg || '获取报告失败，请检查老人ID是否正确', data: null };
            }
        },
        // ========== AI 健康评估 ==========
        openAiAssessment() {
            this.aiAssessmentInput = { elderId: '' };
            this.modal = 'ai-assessment-input';
            this.modalData = {};
        },
        submitAiAssessment() {
            const elderId = this.normalizePositiveId(this.aiAssessmentInput.elderId, '老人档案ID');
            if (!elderId) {
                if (elderId === '') this.toast('提示', '请输入老人档案ID', 'error');
                return;
            }
            this.runAiAssessment(elderId);
        },
        async runAiAssessment(elderId) {
            this.aiReport = { loading: true, error: '', data: null, reportId: null, status: 0 };
            this.modal = 'ai-report';
            this.modalData = {};
            const res = await this.api(`/api/ai/health-report/generate/${encodeURIComponent(elderId)}`, { method: 'POST' });
            if (res?.code === 200 && res.data) {
                const report = res.data;
                this.aiReport = {
                    loading: false, error: '',
                    data: report.reportJson ? JSON.parse(report.reportJson) : null,
                    reportId: report.id, status: report.status || 0
                };
            } else {
                this.aiReport = { loading: false, error: res?.msg || '评估生成失败，请检查老人ID是否正确', data: null, reportId: null, status: 0 };
            }
        },
        async triggerDeepAnalysis(reportId) {
            if (!reportId) return;
            this.aiReport.loading = true;
            const res = await this.api(`/api/ai/health-report/${reportId}/deep-analysis`, { method: 'POST' });
            if (res?.code === 200 && res.data) {
                const report = res.data;
                this.aiReport = {
                    loading: false, error: '',
                    data: report.reportJson ? JSON.parse(report.reportJson) : null,
                    reportId: report.id, status: report.status || 0
                };
                this.toast('成功', 'AI 深度分析完成');
            } else {
                this.aiReport.loading = false;
                this.toast('提示', res?.msg || 'AI 分析失败，请稍后重试', 'error');
            }
        },
        async confirmAiReport(reportId) {
            if (!reportId) return;
            const res = await this.api(`/api/ai/health-report/${reportId}/confirm`, { method: 'PUT', body: JSON.stringify({}) });
            if (res?.code === 200) {
                this.toast('成功', '报告已确认，将进入老人时间轴');
                this.closeModal();
                this.loadAiReportsForElder();
            } else {
                this.toast('提示', res?.msg || '操作失败', 'error');
            }
        },
        async rejectAiReport(reportId) {
            const reason = prompt('请输入驳回原因：');
            if (reason === null) return;
            const res = await this.api(`/api/ai/health-report/${reportId}/reject`, {
                method: 'PUT', body: JSON.stringify({ reason: reason || '医生驳回' })
            });
            if (res?.code === 200) {
                this.toast('成功', '报告已驳回');
                this.closeModal();
                this.loadAiReportsForElder();
            } else {
                this.toast('提示', res?.msg || '操作失败', 'error');
            }
        },
        aiRiskCardStyle() {
            const level = this.aiReport.data?.riskLevel;
            if (level === 'CRITICAL') return 'background:rgba(245,108,108,0.12);border:2px solid #f56c6c;';
            if (level === 'HIGH') return 'background:rgba(230,162,60,0.12);border:2px solid #e6a23c;';
            if (level === 'MEDIUM') return 'background:rgba(59,179,155,0.12);border:2px solid #3BB39B;';
            return 'background:rgba(103,194,58,0.12);border:2px solid #67c23a;';
        },
        aiRiskBadgeStyle() {
            const level = this.aiReport.data?.riskLevel;
            if (level === 'CRITICAL') return 'background:#f56c6c;color:#fff;';
            if (level === 'HIGH') return 'background:#e6a23c;color:#fff;';
            if (level === 'MEDIUM') return 'background:#3BB39B;color:#fff;';
            return 'background:#67c23a;color:#fff;';
        },
        aiRiskLevelText() {
            const map = { LOW: '低风险', MEDIUM: '中等风险', HIGH: '高风险', CRITICAL: '危急' };
            return map[this.aiReport.data?.riskLevel] || '-';
        },
        aiRiskLevelTextOf(level) {
            const map = { LOW: '低风险', MEDIUM: '中等风险', HIGH: '高风险', CRITICAL: '危急' };
            return map[level] || (level || '-');
        },
        // ========== AI 报告记录查看 ==========
        openAiReportList() {
            this.aiReportListFilter = { elderId: '' };
            this.aiReportList = { loading: false, records: [] };
            this.modal = 'ai-report-list';
            this.modalData = {};
        },
        async loadAiReportList() {
            const eid = this.normalizePositiveId(this.aiReportListFilter.elderId, '老人ID');
            if (!eid) { if (eid === '') this.toast('提示', '请输入老人ID', 'error'); return; }
            this.aiReportList.loading = true;
            const res = await this.api(`/api/ai/health-report/list?elderId=${encodeURIComponent(eid)}&pageSize=50`);
            if (res?.code === 200 && res.data) {
                this.aiReportList.records = res.data.records || [];
            }
            this.aiReportList.loading = false;
        },
        async viewAiReport(id) {
            const res = await this.api(`/api/ai/health-report/${id}`);
            if (res?.code === 200 && res.data) {
                const report = res.data;
                this.aiReport = {
                    loading: false, error: '',
                    data: JSON.parse(report.reportJson || '{}'),
                    reportId: report.id, status: report.status || 0
                };
                this.modal = 'ai-report';
                this.modalData = {};
            } else {
                this.toast('提示', res?.msg || '加载失败', 'error');
            }
        },
        async loadAiReportsForElder() {
            const eid = this.validateOptionalPositiveId(this.assessmentFilter.elderId, '老人ID');
            if (eid === null) return;
            if (!eid) { this.aiReportsForElder = []; this.aiAssessmentStats.count = 0; return; }
            const res = await this.api(`/api/ai/health-report/list?elderId=${encodeURIComponent(eid)}&pageSize=20`);
            if (res?.code === 200 && res.data) {
                this.aiReportsForElder = res.data.records || [];
                this.aiAssessmentStats.count = res.data.total || this.aiReportsForElder.length;
            }
        },
        // ========== 管理员 AI 配置 ==========
        async loadAiConfig() {
            this.aiConfig.loading = true;
            this.aiConfig.saved = false;
            try {
                const res = await this.api('/api/ai/config');
                if (res?.code === 200 && res.data) {
                    const map = {};
                    (res.data || []).forEach(c => { map[c.configKey] = c.configValue; });
                    this.aiConfig.form.apiKey = map['ai.api_key'] || '';
                    this.aiConfig.form.baseUrl = map['ai.base_url'] || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                    this.aiConfig.form.model = map['ai.model'] || 'glm-4.7-flash';
                    this.aiConfig.form.maxPerDay = parseInt(map['ai.max_per_day'] || '20');
                    this.aiConfig.form.timeoutSeconds = parseInt(map['ai.timeout_seconds'] || '60');
                    this.aiConfig.form.maxRetries = parseInt(map['ai.max_retries'] || '2');
                    this.aiConfig.form.mockEnabled = (map['ai.mock_enabled'] || 'true') === 'true';
                }
            } catch (e) {
                console.warn('加载AI配置失败，使用默认值', e);
            }
            this.aiConfig.loading = false;
        },
        async saveAiConfig() {
            const f = this.aiConfig.form;
            const body = {
                'ai.api_key': { value: f.apiKey || '', desc: 'AI API Key' },
                'ai.base_url': { value: f.baseUrl || 'https://open.bigmodel.cn/api/paas/v4/chat/completions', desc: 'API 基础地址' },
                'ai.model': { value: f.model || 'glm-4.7-flash', desc: '模型名称' },
                'ai.mock_enabled': { value: f.mockEnabled ? 'true' : 'false', desc: 'Mock模式' },
                'ai.max_per_day': { value: String(f.maxPerDay || 20), desc: '每日上限' },
                'ai.timeout_seconds': { value: String(f.timeoutSeconds || 60), desc: '超时秒数' },
                'ai.max_retries': { value: String(f.maxRetries || 2), desc: '重试次数' }
            };
            const res = await this.api('/api/ai/config', { method: 'PUT', body: JSON.stringify(body) });
            if (res?.code === 200) {
                this.aiConfig.saved = true;
                this.toast('成功', 'AI 配置已保存');
                setTimeout(() => { this.aiConfig.saved = false; }, 3000);
            } else {
                this.toast('提示', res?.msg || '保存失败', 'error');
            }
        },
        reportLevelClass(level) {
            if (!level) return 'tag-default';
            const positive = ['优', '良', '自理', '正常', '营养良好', '低风险'];
            const warning = ['轻度依赖', '轻度障碍', '中风险', '有营养不良风险', '中', '一般'];
            const danger = ['中度依赖', '中度障碍', '中度抑郁', '高风险', '营养不良', '差'];
            if (positive.includes(level)) return 'tag-success';
            if (warning.includes(level)) return 'tag-warning';
            if (danger.includes(level)) return 'tag-danger';
            return 'tag-default';
        },
        async saveAssessment() {
            if (!this.assessmentForm.elderId || !this.assessmentForm.assessDate) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const elderId = this.normalizePositiveId(this.assessmentForm.elderId, '老人ID');
            if (!elderId) return;
            const doctorId = this.validateOptionalPositiveId(this.assessmentForm.doctorId, '责任医生ID');
            if (doctorId === null) return;
            if (!this.validateScoreRange(this.assessmentForm.score)) return;
            const payload = {
                ...this.assessmentForm,
                elderId: Number(elderId),
                doctorId: doctorId ? Number(doctorId) : (this.userInfo.userId || this.userInfo.id || 1)
            };
            const isEdit = !!payload.id;
            const res = await this.api(isEdit ? `/api/assessments/${payload.id}` : '/api/assessments', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '评估记录更新成功' : '评估记录创建成功');
                this.closeModal();
                this.loadAssessments(this.assessmentPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async openAssessmentDetail(id) {
            const res = await this.api(`/api/assessments/${id}`);
            if (res?.code === 200) {
                this.modal = 'assessment-detail';
                this.modalData = { item: res.data };
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async deleteAssessment(id) {
            if (!confirm('确认要删除吗？')) return;
            const res = await this.api(`/api/assessments/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                this.toast('成功', '删除成功');
                this.loadAssessments(this.assessmentPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadReferrals(page = 1) {
            const params = new URLSearchParams();
            params.set('pageNum', page);
            params.set('pageSize', this.referralPage.pageSize);
            if (this.referralFilter.doctorId) params.set('doctorId', this.referralFilter.doctorId);
            if (this.referralFilter.status !== '') params.set('status', this.referralFilter.status);
            if (this.referralFilter.referralType !== '') params.set('referralType', this.referralFilter.referralType);
            const [listRes, statsRes] = await Promise.all([
                this.api(`/api/referrals?${params.toString()}`),
                this.api('/api/referrals/stats')
            ]);
            if (listRes?.code === 200) {
                const pg = listRes.data || {};
                this.referralPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.referralPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
            if (statsRes?.code === 200) {
                this.referralStats = statsRes.data || this.referralStats;
            }
        },
        openReferralModal(item = null) {
            this.referralForm = item ? { ...blankReferral(), ...item } : blankReferral();
            this.modal = 'referral';
            this.modalData = { item };
        },
        async saveReferral() {
            if (!this.referralForm.elderId || !this.referralForm.fromOrg || !this.referralForm.toOrg) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const elderId = this.normalizePositiveId(this.referralForm.elderId, '老人ID');
            if (!elderId) return;
            const fromDoctorId = this.referralForm.fromDoctorId
                ? this.normalizePositiveId(this.referralForm.fromDoctorId, '转出医生ID')
                : (this.userInfo.userId || this.userInfo.id || 1);
            if (!fromDoctorId) return;
            const toDoctorId = this.referralForm.toDoctorId ? this.normalizePositiveId(this.referralForm.toDoctorId, '转入医生ID') : '';
            if (toDoctorId === null) return;
            const payload = {
                ...this.referralForm,
                elderId: Number(elderId),
                fromDoctorId: Number(fromDoctorId),
                toDoctorId: toDoctorId ? Number(toDoctorId) : null,
                fromDoctorName: this.referralForm.fromDoctorName || this.userInfo.realName || this.userInfo.username || '责任医生'
            };
            const res = await this.api('/api/referrals', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res?.code === 200) {
                this.toast('成功', '转诊单创建成功');
                this.closeModal();
                this.loadReferrals(this.referralPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async openReferralDetail(id) {
            const res = await this.api(`/api/referrals/${id}`);
            if (res?.code === 200) {
                this.modal = 'referral-detail';
                this.modalData = { item: res.data };
                this.referralDetail = res.data;
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async acceptReferral(id) {
            if (!confirm('确认接收此转诊单吗？')) return;
            const res = await this.api(`/api/referrals/${id}/accept`, { method: 'PUT' });
            if (res?.code === 200) {
                this.toast('成功', '转诊单接收成功');
                this.loadReferrals(this.referralPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        openReferralAction(item, action) {
            this.referralDetail = item;
            this.referralActionForm = { value: '' };
            this.modal = action === 'complete' ? 'referral-complete' : 'referral-reject';
            this.modalData = { item, action };
        },
        async submitReferralAction() {
            const item = this.modalData.item;
            if (!item) return;
            const action = this.modalData.action;
            const payload = action === 'complete'
                ? { dischargeSummary: this.referralActionForm.value }
                : { reason: this.referralActionForm.value };
            if (action === 'complete' && !payload.dischargeSummary) {
                this.toast('提示', '请填写出院小结', 'error');
                return;
            }
            if (action === 'reject' && !payload.reason) {
                this.toast('提示', '请填写拒绝原因', 'error');
                return;
            }
            const res = await this.api(`/api/referrals/${item.id}/${action === 'complete' ? 'complete' : 'reject'}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (res?.code === 200) {
                this.toast('成功', action === 'complete' ? '转诊完成确认成功' : '转诊已拒绝');
                this.closeModal();
                this.loadReferrals(this.referralPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async cancelReferral(id) {
            if (!confirm('确认取消此转诊单吗？')) return;
            const res = await this.api(`/api/referrals/${id}/cancel`, { method: 'PUT' });
            if (res?.code === 200) {
                this.toast('成功', '转诊单已取消');
                this.loadReferrals(this.referralPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadVitals() {
            const elderId = this.validateOptionalPositiveId(this.vitalsState.elderId, '老人ID');
            if (elderId === null) return;
            this.vitalsState.elderId = elderId;
            if (!elderId) {
                this.vitalsState.devices = [];
                this.vitalsState.latest = [];
                this.vitalsState.trend = [];
                return;
            }
            const trendUrl = `/api/vitals/trend/${encodeURIComponent(elderId)}?dataType=${encodeURIComponent(this.vitalsState.metric)}${this.vitalsState.startDate ? `&startDate=${encodeURIComponent(this.vitalsState.startDate)}` : ''}${this.vitalsState.endDate ? `&endDate=${encodeURIComponent(this.vitalsState.endDate)}` : ''}`;
            const [devicesRes, latestRes, trendRes] = await Promise.all([
                this.api(`/api/vitals/devices/${encodeURIComponent(elderId)}`),
                this.api(`/api/vitals/latest/${encodeURIComponent(elderId)}`),
                this.api(trendUrl)
            ]);
            if (devicesRes?.code === 200) this.vitalsState.devices = devicesRes.data || [];
            if (latestRes?.code === 200) {
                const latest = latestRes.data || {};
                this.vitalsState.latest = Object.keys(latest).map(key => ({ metric: key, value: latest[key] }));
            }
            if (trendRes?.code === 200) {
                this.vitalsState.trend = trendRes.data || [];
                this.renderTrendChart();
            }
        },
        renderTrendChart() {
            this.$nextTick(() => {
                const el = document.getElementById('trendChart');
                if (!el || !window.echarts) return;
                if (!this.charts.trend || this.charts.trend.isDisposed()) {
                    while (el.firstChild) el.removeChild(el.firstChild);
                    this.charts.trend = window.echarts.init(el);
                }
                const rows = this.vitalsState.trend || [];
                if (!rows.length) return;
                const x = rows.map(item => this.dateTimeText(item.measureTime));
                const y = rows.map(item => Number(item.dataValue || 0));
                const avg = y.reduce((a, b) => a + b, 0) / y.length || 0;
                const max = Math.max(...y);
                const min = Math.min(...y);
                this.charts.trend.setOption({
                    backgroundColor: 'transparent',
                    textStyle: { color: '#B8C2CC', fontFamily: 'Rajdhani, "PingFang SC", sans-serif' },
                    title: {
                        text: `${this.vitalTypeText(this.vitalsState.metric)}趋势`,
                        left: 'center', top: 6,
                        textStyle: { fontSize: 15, fontWeight: 600, color: '#E6EDF3' }
                    },
                    tooltip: {
                        trigger: 'axis',
                        backgroundColor: 'rgba(27,34,43,0.92)',
                        borderColor: 'rgba(59,179,155,0.35)', borderWidth: 1,
                        textStyle: { color: '#E6EDF3' },
                        axisPointer: { type: 'line', lineStyle: { color: 'rgba(59,179,155,0.4)', width: 1, type: 'dashed' } },
                        extraCssText: 'backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.5);',
                        formatter: (params) => {
                            const p = params[0];
                            return `<strong>${p.axisValue}</strong><br/>${p.marker} ${p.seriesName}: <strong>${p.value}</strong>`;
                        }
                    },
                    grid: { left: 44, right: 16, top: 48, bottom: 32 },
                    xAxis: {
                        type: 'category',
                        data: x,
                        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
                        axisTick: { show: false },
                        axisLabel: { fontSize: 10, color: '#8B98A5' }
                    },
                    yAxis: {
                        type: 'value',
                        axisLine: { show: false },
                        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
                        axisLabel: { fontSize: 10, color: '#8B98A5' }
                    },
                    series: [{
                        name: this.vitalTypeText(this.vitalsState.metric),
                        type: 'line',
                        data: y,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: x.length <= 31,
                        lineStyle: { width: 3, color: '#3BB39B', shadowColor: 'rgba(59,179,155,0.6)', shadowBlur: 12 },
                        itemStyle: { color: '#3BB39B', borderColor: '#0D1117', borderWidth: 2 },
                        areaStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(59,179,155,0.35)' },
                            { offset: 1, color: 'rgba(59,179,155,0.02)' }
                        ]) },
                        emphasis: { focus: 'series', lineStyle: { shadowBlur: 20 } },
                        markLine: {
                            silent: true,
                            symbol: 'none',
                            data: [
                                { yAxis: avg, name: '均值', label: { formatter: `${avg.toFixed(1)}`, fontSize: 10, color: '#8B98A5' }, lineStyle: { color: '#8B98A5', type: 'dashed', width: 1 } }
                            ]
                        },
                        animationDuration: 600,
                        animationEasing: 'cubicOut'
                    }]
                }, true);
                try { this.charts.trend.resize(); } catch(e) { /* ignore echarts internal errors */ }
            });
        },
        openDeviceModal() {
            this.deviceForm = blankDevice();
            this.modal = 'device';
            this.modalData = {};
        },
        async saveDevice() {
            if (!this.deviceForm.elderId || !this.deviceForm.deviceName) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const res = await this.api('/api/vitals/devices', {
                method: 'POST',
                body: JSON.stringify(this.deviceForm)
            });
            if (res?.code === 200) {
                this.toast('成功', '设备绑定成功');
                this.closeModal();
                this.loadVitals();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async unbindDevice(id) {
            if (!confirm('确认解绑此设备吗？')) return;
            const res = await this.api(`/api/vitals/devices/${id}/unbind`, { method: 'PUT' });
            if (res?.code === 200) {
                this.toast('成功', '设备解绑成功');
                this.loadVitals();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async generateMockVitals() {
            if (!this.vitalsState.elderId) {
                this.toast('提示', '请先输入老人ID', 'error');
                return;
            }
            const elderId = this.normalizePositiveId(this.vitalsState.elderId, '老人ID');
            if (!elderId) return;
            this.vitalsState.elderId = elderId;
            const res = await this.api(`/api/vitals/mock/${encodeURIComponent(this.vitalsState.elderId)}?days=${encodeURIComponent(this.vitalsState.mockDays || 30)}`, { method: 'POST' });
            if (res?.code === 200) {
                this.toast('成功', '模拟数据生成成功');
                this.loadVitals();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadTimeline(page = 1) {
            const elderId = this.validateOptionalPositiveId(this.timelineFilter.elderId, '老人ID');
            if (elderId === null) return;
            this.timelineFilter.elderId = elderId;
            if (!elderId) {
                this.timelineSummary = { total: 0 };
                this.timelinePage = { records: [], pageNum: 1, pageSize: 20, pages: 0, total: 0 };
                return;
            }
            const params = new URLSearchParams();
            params.set('pageNum', page);
            params.set('pageSize', this.timelinePage.pageSize);
            if (this.timelineFilter.startDate) params.set('startDate', this.timelineFilter.startDate);
            if (this.timelineFilter.endDate) params.set('endDate', this.timelineFilter.endDate);
            if (this.timelineFilter.eventType) params.set('eventType', this.timelineFilter.eventType);
            const [listRes, summaryRes] = await Promise.all([
                this.api(`/api/timeline/${encodeURIComponent(elderId)}?${params.toString()}`),
                this.api(`/api/timeline/${encodeURIComponent(elderId)}/summary?${params.toString()}`)
            ]);
            if (listRes?.code === 200) {
                const pg = listRes.data || {};
                this.timelinePage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.timelinePage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
            if (summaryRes?.code === 200) {
                this.timelineSummary = summaryRes.data || { total: 0 };
            }
        },
        async loadProfile() {
            const [info, logs, messages, unread] = await Promise.all([
                this.api('/api/auth/info'),
                this.api(`/api/profile/logs?userId=${this.userInfo.userId || this.userInfo.id || 0}`),
                this.api(`/api/profile/messages?userId=${this.userInfo.userId || this.userInfo.id || 0}`),
                this.api(`/api/profile/messages/unread-count?userId=${this.userInfo.userId || this.userInfo.id || 0}`)
            ]);
            if (info?.code === 200) {
                this.profile.info = info.data || {};
                this.avatarLoadFailed = false;
                this.profileAvatarLoadFailed = false;
            }
            else this.profile.info = { ...this.profile.info, ...this.userInfo };
            if (logs?.code === 200) this.profile.logs = logs.data.records || logs.data || [];
            if (messages?.code === 200) this.profile.messages = messages.data.records || messages.data || [];
            if (unread?.code === 200) this.profile.unreadCount = unread.data || 0;
        },
        chooseAvatarFile() {
            this.$refs.avatarFileInput?.click();
        },
        handleAvatarError() {
            this.avatarLoadFailed = true;
        },
        handleProfileAvatarError() {
            this.profileAvatarLoadFailed = true;
        },
        clearProfileAvatar() {
            this.profile.info.avatar = '';
            this.userInfo = { ...this.userInfo, avatar: '' };
            localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
            this.avatarLoadFailed = false;
            this.profileAvatarLoadFailed = false;
        },
        async uploadProfileAvatar(event) {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                this.toast('提示', '头像只支持jpg、png、gif或webp图片', 'error');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                this.toast('提示', '头像图片不能超过2MB', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            this.avatarUploading = true;
            try {
                const res = await fetch('/api/profile/avatar', {
                    method: 'POST',
                    headers: {
                        Authorization: 'Bearer ' + this.token
                    },
                    body: formData
                });
                const data = await res.json();
                if (data?.code === 401) {
                    this.logout();
                    return;
                }
                if (data?.code !== 200) {
                    this.toast('提示', data?.msg || data?.message || '头像上传失败', 'error');
                    return;
                }
                const avatar = data.data?.avatar || '';
                this.profile.info.avatar = avatar;
                this.userInfo = { ...this.userInfo, avatar };
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
                this.avatarLoadFailed = false;
                this.profileAvatarLoadFailed = false;
                this.toast('成功', '头像上传成功');
            } catch (e) {
                console.error(e);
                this.toast('提示', e?.message || '头像上传失败', 'error');
            } finally {
                this.avatarUploading = false;
            }
        },
        async saveProfile() {
            if (!this.validateRealName(this.profile.info.realName)) return;
            if (!this.validatePhone(this.profile.info.phone, '手机号', true)) return;
            if (!this.validateEmail(this.profile.info.email)) return;
            if (!this.validateAvatarPath(this.profile.info.avatar)) return;
            const body = {
                id: this.profile.info.id || this.userInfo.id || this.userInfo.userId,
                realName: this.profile.info.realName,
                phone: this.profile.info.phone,
                email: this.profile.info.email,
                avatar: this.profile.info.avatar || ''
            };
            const res = await this.api('/api/profile/info', {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                const updatedUserInfo = { ...this.userInfo };
                ['realName', 'phone', 'email', 'avatar'].forEach(key => {
                    if (body[key] !== undefined) updatedUserInfo[key] = body[key];
                });
                this.userInfo = updatedUserInfo;
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
                this.toast('成功', '基本信息保存成功');
                this.loadProfile();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async changePassword() {
            if (!this.profile.pwd.oldPassword || !this.profile.pwd.newPassword) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            if (!this.validateStrongPassword(this.profile.pwd.newPassword, '新密码')) return;
            if (this.profile.pwd.oldPassword === this.profile.pwd.newPassword) {
                this.toast('提示', '新密码不能与当前密码相同', 'error');
                return;
            }
            if (this.profile.pwd.newPassword !== this.profile.pwd.confirmPassword) {
                this.toast('提示', '两次输入的密码不一致', 'error');
                return;
            }
            const res = await this.api('/api/auth/password', {
                method: 'PUT',
                body: JSON.stringify({
                    oldPassword: this.profile.pwd.oldPassword,
                    newPassword: this.profile.pwd.newPassword,
                    confirmPassword: this.profile.pwd.confirmPassword
                })
            });
            if (res?.code === 200) {
                this.toast('成功', '密码修改成功，请重新登录');
                setTimeout(() => this.logout(), 1200);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async markMessageRead(id) {
            const res = await this.api(`/api/profile/messages/${id}/read`, { method: 'PUT' });
            if (res?.code === 200) {
                this.profile.messages = this.profile.messages.map(msg => msg.id === id ? { ...msg, isRead: 1 } : msg);
                this.profile.unreadCount = Math.max(this.profile.unreadCount - 1, 0);
            }
        },
        async markAllMessagesRead() {
            const res = await this.api(`/api/profile/messages/read-all?userId=${this.userInfo.userId || this.userInfo.id || 0}`, { method: 'PUT' });
            if (res?.code === 200) {
                this.profile.messages = this.profile.messages.map(msg => ({ ...msg, isRead: 1 }));
                this.profile.unreadCount = 0;
                this.toast('成功', '全部消息已标记为已读');
            }
        },
        // ==================== 护士模块方法 ====================
        recordTypeText(value) { return RECORD_TYPE_MAP[Number(value)] || '未知'; },
        planTypeText(value) { return PLAN_TYPE_MAP[Number(value)] || '未知'; },
        nursePlanStatusText(value) { return PLAN_STATUS_MAP[Number(value)] || '未知'; },
        reportStatusText(value) { return REPORT_STATUS_MAP[Number(value)] || '未知'; },
        async loadNurseDashboard() {
            const [statsRes, tasksRes] = await Promise.all([
                this.api('/api/nurse/dashboard/stats'),
                this.api('/api/nurse/dashboard/tasks')
            ]);
            if (statsRes?.code === 200) {
                this.nurseDashboard.stats = statsRes.data || this.nurseDashboard.stats;
            }
            if (tasksRes?.code === 200) {
                const d = tasksRes.data || {};
                this.nurseDashboard.stats = { ...this.nurseDashboard.stats, ...(d.stats || {}) };
                this.nurseDashboard.todayRecords = d.todayRecords || [];
                this.nurseDashboard.activePlans = d.activePlans || [];
            }
        },
        async loadNurseRecords(page = 1) {
            const params = new URLSearchParams({
                pageNum: page,
                pageSize: this.nurseRecordPage.pageSize,
                elderId: this.nurseRecordFilter.elderId || '',
                recordType: this.nurseRecordFilter.recordType || '',
                reportStatus: this.nurseRecordFilter.reportStatus || '',
                startDate: this.nurseRecordFilter.startDate || '',
                endDate: this.nurseRecordFilter.endDate || ''
            });
            const [listRes, statsRes] = await Promise.all([
                this.api(`/api/nurse/records?${params.toString()}`),
                this.api('/api/nurse/records/stats')
            ]);
            if (listRes?.code === 200) {
                const pg = listRes.data || {};
                this.nurseRecordPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.nurseRecordPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
            if (statsRes?.code === 200) {
                this.nurseRecordStats = statsRes.data || this.nurseRecordStats;
            }
        },
        openNurseRecordModal(item = null) {
            if (item) {
                this.nurseRecordForm = {
                    id: item.id, elderId: item.elderId, nurseId: item.nurseId,
                    recordType: item.recordType, recordTitle: item.recordTitle,
                    recordContent: item.recordContent || '',
                    nursingMeasures: item.nursingMeasures || '',
                    observation: item.observation || '',
                    evaluation: item.evaluation || '',
                    recordDate: item.recordDate ? String(item.recordDate).slice(0, 16) : new Date().toISOString().slice(0, 16),
                    isAbnormal: item.isAbnormal || 0,
                    abnormalDesc: item.abnormalDesc || '',
                    reportStatus: item.reportStatus || 0,
                    remark: item.remark || ''
                };
            } else {
                this.nurseRecordForm = {
                    id: null, elderId: '', nurseId: this.userInfo.userId || this.userInfo.id || 5,
                    recordType: 1, recordTitle: '',
                    recordContent: '', nursingMeasures: '', observation: '', evaluation: '',
                    recordDate: new Date().toISOString().slice(0, 16), isAbnormal: 0,
                    abnormalDesc: '', reportStatus: 0, remark: ''
                };
            }
            this.modal = 'nurse-record';
            this.modalData = {};
        },
        openNurseRecordDetail(item) {
            this.modalData = { item };
            this.modal = 'nurse-record-detail';
        },
        async saveNurseRecord() {
            if (!this.nurseRecordForm.elderId || !this.nurseRecordForm.recordTitle) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const elderId = this.normalizePositiveId(this.nurseRecordForm.elderId, '老人ID');
            if (!elderId) return;
            const nurseId = this.nurseRecordForm.nurseId
                ? this.normalizePositiveId(this.nurseRecordForm.nurseId, '护士ID')
                : (this.userInfo.userId || this.userInfo.id || 5);
            if (!nurseId) return;
            const body = {
                ...this.nurseRecordForm,
                elderId: Number(elderId),
                nurseId: Number(nurseId)
            };
            const isEdit = !!body.id;
            const res = await this.api(isEdit ? `/api/nurse/records/${body.id}` : '/api/nurse/records', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '护理记录更新成功' : '护理记录新增成功');
                this.closeModal();
                this.loadNurseRecords(this.nurseRecordPage.pageNum);
                this.loadNurseDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async deleteNurseRecord(id) {
            if (!confirm('确认要删除吗？')) return;
            const res = await this.api(`/api/nurse/records/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                this.toast('成功', '删除成功');
                this.loadNurseRecords(this.nurseRecordPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async reportNurseRecord(id) {
            const desc = prompt('请描述异常情况：');
            if (!desc) return;
            const res = await this.api(`/api/nurse/records/${id}/report`, {
                method: 'POST',
                body: JSON.stringify({ abnormalDesc: desc })
            });
            if (res?.code === 200) {
                this.toast('成功', '异常已上报，等待医生处理');
                this.loadNurseRecords(this.nurseRecordPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadNursePlans(page = 1) {
            const params = new URLSearchParams({
                pageNum: page,
                pageSize: this.nursePlanPage.pageSize,
                elderId: this.nursePlanFilter.elderId || '',
                planType: this.nursePlanFilter.planType || '',
                status: this.nursePlanFilter.status || ''
            });
            const [listRes, statsRes] = await Promise.all([
                this.api(`/api/nurse/plans?${params.toString()}`),
                this.api('/api/nurse/plans/stats')
            ]);
            if (listRes?.code === 200) {
                const pg = listRes.data || {};
                this.nursePlanPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.nursePlanPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
            }
            if (statsRes?.code === 200) {
                this.nursePlanStats = statsRes.data || this.nursePlanStats;
            }
        },
        openNursePlanModal(item = null) {
            if (item) {
                this.nursePlanForm = {
                    id: item.id, elderId: item.elderId, nurseId: item.nurseId,
                    planName: item.planName, planType: item.planType,
                    startDate: item.startDate ? String(item.startDate).slice(0, 10) : '',
                    endDate: item.endDate ? String(item.endDate).slice(0, 10) : '',
                    frequency: item.frequency || '', nursingGoal: item.nursingGoal || '',
                    nursingContent: item.nursingContent || '',
                    status: item.status, totalCount: item.totalCount || 10,
                    completedCount: item.completedCount || 0,
                    effectScore: item.effectScore, doctorApproval: item.doctorApproval,
                    remark: item.remark || ''
                };
            } else {
                this.nursePlanForm = {
                    id: null, elderId: '', nurseId: this.userInfo.userId || this.userInfo.id || 5,
                    planName: '', planType: 1,
                    startDate: new Date().toISOString().slice(0, 10), endDate: '',
                    frequency: '', nursingGoal: '', nursingContent: '',
                    status: 0, totalCount: 10, completedCount: 0,
                    effectScore: null, doctorApproval: 0, remark: ''
                };
            }
            this.modal = 'nurse-plan';
            this.modalData = {};
        },
        openNursePlanDetail(item) {
            this.modalData = { item };
            this.modal = 'nurse-plan-detail';
        },
        async saveNursePlan() {
            if (!this.nursePlanForm.elderId || !this.nursePlanForm.planName || !this.nursePlanForm.startDate) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const elderId = this.normalizePositiveId(this.nursePlanForm.elderId, '老人ID');
            if (!elderId) return;
            const nurseId = this.nursePlanForm.nurseId
                ? this.normalizePositiveId(this.nursePlanForm.nurseId, '护士ID')
                : (this.userInfo.userId || this.userInfo.id || 5);
            if (!nurseId) return;
            const totalCount = this.nursePlanForm.totalCount
                ? this.normalizePositiveId(this.nursePlanForm.totalCount, '总次数')
                : '';
            if (totalCount === null) return;
            if (!this.validateDateOrder(this.nursePlanForm.startDate, this.nursePlanForm.endDate)) return;
            const body = {
                ...this.nursePlanForm,
                elderId: Number(elderId),
                nurseId: Number(nurseId),
                totalCount: totalCount ? Number(totalCount) : this.nursePlanForm.totalCount
            };
            const isEdit = !!body.id;
            const res = await this.api(isEdit ? `/api/nurse/plans/${body.id}` : '/api/nurse/plans', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '护理计划更新成功' : '护理计划新增成功');
                this.closeModal();
                this.loadNursePlans(this.nursePlanPage.pageNum);
                this.loadNurseDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async deleteNursePlan(id) {
            if (!confirm('确认要删除吗？')) return;
            const res = await this.api(`/api/nurse/plans/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                const currentPage = this.nursePlanPage.pageNum || 1;
                await this.loadNursePlans(currentPage);
                if ((this.nursePlanPage.records || []).length === 0 && currentPage > 1) {
                    await this.loadNursePlans(currentPage - 1);
                }
                const stillExists = (this.nursePlanPage.records || [])
                    .some(row => Number(row.id) === Number(id));
                if (stillExists) {
                    this.toast('提示', '删除请求已返回成功，但列表仍存在该护理计划，请刷新后重试', 'error');
                    return;
                }
                this.toast('成功', '删除成功');
                this.loadNurseDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async startNursePlan(id) {
            const res = await this.api(`/api/nurse/plans/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 1 })
            });
            if (res?.code === 200) {
                this.toast('成功', '护理计划已开始执行');
                this.loadNursePlans(this.nursePlanPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async incrementNursePlan(id) {
            const res = await this.api(`/api/nurse/plans/${id}/increment`, { method: 'POST' });
            if (res?.code === 200) {
                this.toast('成功', '完成次数+1');
                this.loadNursePlans(this.nursePlanPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        // ==================== 体检管理方法 ====================
        async loadExams(page = 1) {
            const params = new URLSearchParams({
                pageNum: page, pageSize: this.examPage.pageSize,
                elderId: this.examFilter.elderId || '',
                startDate: this.examFilter.startDate || '',
                endDate: this.examFilter.endDate || ''
            });
            const [listRes, statsRes] = await Promise.all([
                this.api(`/api/exams?${params.toString()}`),
                this.api('/api/exams/stats')
            ]);
            if (listRes?.code === 200) {
                const pg = listRes.data || {};
                this.examPage = {
                    records: pg.records || [], pageNum: pg.current || page,
                    pageSize: pg.size || this.examPage.pageSize, pages: pg.pages || 0, total: pg.total || 0
                };
            }
            if (statsRes?.code === 200) this.examStats = statsRes.data || this.examStats;
        },
        openExamModal(item = null) {
            if (item) {
                this.examForm = {
                    id: item.id, elderId: item.elderId, doctorId: item.doctorId,
                    examDate: item.examDate ? String(item.examDate).slice(0, 10) : '',
                    height: item.height ?? '', weight: item.weight ?? '',
                    systolicPressure: item.systolicPressure ?? '', diastolicPressure: item.diastolicPressure ?? '',
                    heartRate: item.heartRate ?? '', bloodSugarFasting: item.bloodSugarFasting ?? '',
                    bloodSugarRandom: item.bloodSugarRandom ?? '', temperature: item.temperature ?? '',
                    bloodOxygen: item.bloodOxygen ?? '', waistline: item.waistline ?? '',
                    examSummary: item.examSummary || '', doctorAdvice: item.doctorAdvice || '',
                    abnormalFlag: item.abnormalFlag || 0
                };
            } else {
                this.examForm = {
                    id: null, elderId: '', doctorId: '', examDate: new Date().toISOString().slice(0, 10),
                    height: '', weight: '', systolicPressure: '', diastolicPressure: '',
                    heartRate: '', bloodSugarFasting: '', bloodSugarRandom: '', temperature: '',
                    bloodOxygen: '', waistline: '', examSummary: '', doctorAdvice: '', abnormalFlag: 0
                };
            }
            this.modal = 'exam';
            this.modalData = {};
        },
        openExamDetail(item) {
            this.modalData = { item };
            this.modal = 'exam-detail';
        },
        async saveExam() {
            if (!this.examForm.elderId || !this.examForm.examDate) {
                this.toast('提示', '请填写老人ID和体检日期', 'error'); return;
            }
            const body = {
                ...this.examForm,
                elderId: Number(this.examForm.elderId),
                height: this.examForm.height ? Number(this.examForm.height) : null,
                weight: this.examForm.weight ? Number(this.examForm.weight) : null,
                systolicPressure: this.examForm.systolicPressure ? Number(this.examForm.systolicPressure) : null,
                diastolicPressure: this.examForm.diastolicPressure ? Number(this.examForm.diastolicPressure) : null,
                heartRate: this.examForm.heartRate ? Number(this.examForm.heartRate) : null,
                bloodSugarFasting: this.examForm.bloodSugarFasting ? Number(this.examForm.bloodSugarFasting) : null,
                bloodSugarRandom: this.examForm.bloodSugarRandom ? Number(this.examForm.bloodSugarRandom) : null,
                temperature: this.examForm.temperature ? Number(this.examForm.temperature) : null,
                bloodOxygen: this.examForm.bloodOxygen ? Number(this.examForm.bloodOxygen) : null,
                waistline: this.examForm.waistline ? Number(this.examForm.waistline) : null
            };
            const isEdit = !!body.id;
            const res = await this.api(isEdit ? `/api/exams/${body.id}` : '/api/exams', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
                this.toast('成功', isEdit ? '体检记录更新成功' : '体检记录新增成功');
                this.closeModal();
                this.loadExams(this.examPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async deleteExam(id) {
            if (!confirm('确认要删除该体检记录吗？')) return;
            const res = await this.api(`/api/exams/${id}`, { method: 'DELETE' });
            if (res?.code === 200) {
                this.toast('成功', '删除成功');
                this.loadExams(this.examPage.pageNum);
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        // ==================== 护士审核方法 ====================
        async loadReview() {
            await Promise.all([
                this.loadReviewRecords(1),
                this.loadReviewPlans(1),
                this.loadReviewStats()
            ]);
        },
        async loadReviewStats() {
            const res = await this.api('/api/review/stats');
            if (res?.code === 200) this.reviewStats = res.data || this.reviewStats;
        },
        async loadReviewRecords(page = 1) {
            const res = await this.api(`/api/review/records?pageNum=${page}&pageSize=${this.reviewRecordsPage.pageSize}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.reviewRecordsPage = {
                    records: pg.records || [], pageNum: pg.current || page,
                    pageSize: pg.size || this.reviewRecordsPage.pageSize, pages: pg.pages || 0, total: pg.total || 0
                };
            }
        },
        async loadReviewPlans(page = 1) {
            const res = await this.api(`/api/review/plans?pageNum=${page}&pageSize=${this.reviewPlansPage.pageSize}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.reviewPlansPage = {
                    records: pg.records || [], pageNum: pg.current || page,
                    pageSize: pg.size || this.reviewPlansPage.pageSize, pages: pg.pages || 0, total: pg.total || 0
                };
            }
        },
        openReviewRecordDetail(item) {
            this.modalData = { item };
            this.modal = 'review-record-detail';
        },
        openReviewPlanDetail(item) {
            this.modalData = { item };
            this.modal = 'review-plan-detail';
        },
        async approveReviewRecord(id) {
            if (!confirm('确认通过该护理记录的审核？')) return;
            const res = await this.api(`/api/review/records/${id}/approve`, { method: 'POST', body: '{}' });
            if (res?.code === 200) {
                this.toast('成功', '已审核通过');
                this.loadReview();
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async rejectReviewRecord(id) {
            const reason = prompt('请输入驳回原因：');
            if (reason === null) return;
            const res = await this.api(`/api/review/records/${id}/reject`, { method: 'POST', body: JSON.stringify({ comment: reason || '未说明原因' }) });
            if (res?.code === 200) {
                this.toast('提示', '已驳回');
                this.loadReview();
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async approveReviewPlan(id) {
            if (!confirm('确认通过该护理计划？通过后将自动开始执行。')) return;
            const res = await this.api(`/api/review/plans/${id}/approve`, { method: 'POST' });
            if (res?.code === 200) {
                this.toast('成功', '护理计划已审核通过');
                this.loadReview();
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async rejectReviewPlan(id) {
            if (!confirm('确认驳回该护理计划？')) return;
            const res = await this.api(`/api/review/plans/${id}/reject`, { method: 'POST' });
            if (res?.code === 200) {
                this.toast('提示', '护理计划已驳回');
                this.loadReview();
                this.loadDashboard();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        closeModal() {
            this.modal = '';
            this.modalData = {};
        }
    }
}).mount('#app');

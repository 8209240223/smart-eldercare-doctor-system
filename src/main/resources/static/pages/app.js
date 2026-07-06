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
    { key: 'elders', label: '老人档案', icon: 'E' },
    { key: 'warnings', label: '预警中心', icon: 'W' },
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
                        <div class="avatar">{{ userAvatar }}</div>
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
                    <div class="actions"><button class="primary-btn" @click="openElderModal()">+ 新增老人档案</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>姓名</label><input v-model="elderFilter.name" placeholder="输入姓名搜索"></div>
                    <div class="field"><label>所属社区</label><input v-model="elderFilter.community" placeholder="输入社区名称"></div>
                    <div class="field"><label>责任医生ID</label><input v-model="elderFilter.doctorId" type="number" placeholder="医生ID"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadElders(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>姓名</th><th>性别</th><th>出生日期</th><th>联系电话</th><th>所属社区</th><th>状态</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="elderPage.records.length===0"><td colspan="7"><div class="empty-state">暂无老人档案数据</div></td></tr>
                        <tr v-for="row in elderPage.records" :key="row.id">
                            <td><strong>{{ row.name }}</strong></td>
                            <td>{{ genderText(row.gender) }}</td>
                            <td>{{ row.birthDate || '-' }}</td>
                            <td>{{ row.phone || '-' }}</td>
                            <td>{{ row.community || '-' }}</td>
                            <td><span class="tag" :class="row.accountStatus===1?'tag-success':'tag-default'">{{ row.accountStatus===1?'已启用':'未启用' }}</span></td>
                            <td><div class="actions">
                                <button class="link" @click="openHealthDetail(row.id)">查看健康详情</button>
                                <button class="ok" @click="generateReport(row.id)">📋 报告</button>
                                <button class="ok" @click="openElderModal(row)">编辑</button>
                                <button class="danger" @click="deleteElder(row.id)">删除</button>
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
            <section v-if="activeTab==='warnings'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>预警中心</h3>
                        <p>实时监测老人健康异常信号，支持按等级、类型和状态进行多维度筛选和处理</p>
                    </div>
                    <div class="actions"><button class="primary-btn" @click="openWarningModal()">+ 新建预警</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>状态</label><select v-model="warningFilter.status"><option value="">全部状态</option><option value="0">待处理</option><option value="1">处理中</option><option value="2">已处理</option><option value="3">已关闭</option></select></div>
                    <div class="field"><label>预警等级</label><select v-model="warningFilter.warningLevel"><option value="">全部等级</option><option value="1">低等级</option><option value="2">中等级</option><option value="3">高等级</option></select></div>
                    <div class="field"><label>老人ID</label><input v-model="warningFilter.elderId" type="number" placeholder="老人ID"></div>
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
                                <button class="link" v-if="row.status===0" @click="openWarningHandle(row, 'handle')">处理</button>
                                <button class="warn" v-if="row.status===0" @click="openWarningHandle(row, 'ignore')">忽略</button>
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
                    <div class="actions"><button class="primary-btn" @click="openPlanModal()">+ 新增随访计划</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>状态</label><select v-model="followFilter.status"><option value="">全部状态</option><option value="0">待执行</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已关闭</option></select></div>
                    <div class="field"><label>疾病类型</label><select v-model="followFilter.diseaseType"><option value="">全部类型</option><option v-for="(text,key) in diseaseMap" :key="key" :value="key">{{ text }}</option></select></div>
                    <div class="field"><label>老人ID</label><input v-model="followFilter.elderId" type="number" placeholder="老人ID"></div>
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
                            <td><span class="tag" :class="row.status===1?'tag-success':row.status===0?'tag-warning':'tag-default'">{{ planStatusText(row.status) }}</span></td>
                            <td><div class="actions"><button class="link" @click="openRecordModal(row)">记录随访结果</button></div></td>
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
                    <div class="actions"><button class="primary-btn" @click="openInterventionModal()">+ 新增干预记录</button></div>
                </div>
                <div class="filters">
                    <div class="field"><label>干预类型</label><select v-model="interventionFilter.type"><option value="">全部类型</option><option value="1">健康宣教</option><option value="2">用药指导</option><option value="3">康复训练</option><option value="4">心理干预</option></select></div>
                    <div class="field"><label>老人ID</label><input v-model="interventionFilter.elderId" type="number" placeholder="老人ID"></div>
                    <div class="field"><label>关联随访记录ID</label><input v-model="interventionFilter.followRecordId" type="number" placeholder="记录ID"></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadInterventions(1)">查询</button></div>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>干预标题</th><th>老人ID</th><th>干预类型</th><th>干预日期</th><th>效果评价</th><th>操作</th></tr></thead>
                        <tbody>
                        <tr v-if="interventionPage.records.length===0"><td colspan="6"><div class="empty-state">暂无干预记录数据</div></td></tr>
                        <tr v-for="row in interventionPage.records" :key="row.id">
                            <td><strong>{{ row.interventionTitle }}</strong></td>
                            <td>{{ row.elderId }}</td>
                            <td><span class="tag" :class="interventionClass(row.interventionType)">{{ interventionText(row.interventionType) }}</span></td>
                            <td>{{ dateText(row.interventionDate) }}</td>
                            <td><span v-if="row.effectEvaluation" class="tag" :class="effectClass(row.effectEvaluation)">{{ effectText(row.effectEvaluation) }}</span><span v-else class="tag tag-default">未评价</span></td>
                            <td><div class="actions">
                                <button class="link" @click="openInterventionDetail(row)">查看详情</button>
                                <button class="ok" @click="openInterventionModal(row)">编辑</button>
                                <button class="danger" @click="deleteIntervention(row.id)">删除</button>
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
                        <div class="timeline-card"><div class="desc">角色</div><div>{{ userRoleText }}</div></div>
                        <div style="margin-top:16px;" class="actions"><button class="primary-btn" @click="saveProfile">保存基本信息</button></div>
                    </div>
                    <div class="card list-card">
                        <div class="list-title">快速修改信息</div>
                        <div class="form-row" style="margin-top: 14px;">
                            <div class="field"><label>姓名</label><input v-model="profile.info.realName" placeholder="请输入新的姓名"></div>
                            <div class="field"><label>手机号</label><input v-model="profile.info.phone" placeholder="请输入新的手机号"></div>
                            <div class="field"><label>邮箱</label><input v-model="profile.info.email" placeholder="请输入新的邮箱"></div>
                        </div>
                    </div>
                </div>
                <div v-else-if="profileTab==='password'" class="card list-card" style="max-width: 640px;">
                    <div class="form-row" style="grid-template-columns:1fr;">
                        <div class="field"><label>旧密码</label><input type="password" v-model="profile.pwd.oldPassword" placeholder="请输入当前使用的密码"></div>
                        <div class="field"><label>新密码</label><input type="password" v-model="profile.pwd.newPassword" placeholder="至少 6 位"></div>
                        <div class="field"><label>确认新密码</label><input type="password" v-model="profile.pwd.confirmPassword" placeholder="请再次输入相同的新密码"></div>
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
                    <div class="actions"><button class="primary-btn" @click="openAssessmentModal()">+ 新增评估记录</button><button class="soft-btn" @click="openAssessmentReport()">📋 生成评估报告</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">总评估数</div><div class="stat-value">{{ assessmentStats.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">ADL</div><div class="stat-value">{{ assessmentStats.type1 || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">慢病评估</div><div class="stat-value">{{ assessmentStats.type2 || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">心理评估</div><div class="stat-value">{{ assessmentStats.type3 || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="assessmentFilter.elderId" type="number" placeholder="输入老人档案ID"></div>
                    <div class="field"><label>评估类型</label><select v-model="assessmentFilter.assessType"><option value="">全部类型</option><option v-for="(txt,key) in assessmentTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field" style="align-self:end;"><button class="primary-btn" @click="loadAssessments(1)">查询</button></div>
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
                                <button class="ok" @click="openAssessmentModal(row)">编辑</button>
                                <button class="danger" @click="deleteAssessment(row.id)">删除</button>
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
            <section v-if="activeTab==='referral'" class="card section">
                <div class="section-head">
                    <div>
                        <h3>转诊协同</h3>
                        <p>实现上下级医疗机构间的双向转诊，支持紧急程度分级和床位预留管理</p>
                    </div>
                    <div class="actions"><button class="primary-btn" @click="openReferralModal()">+ 新建转诊</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">待接收</div><div class="stat-value">{{ referralStats.pending || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">处理中</div><div class="stat-value">{{ referralStats.processing || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">已完成</div><div class="stat-value">{{ referralStats.completed || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">上转 / 下转</div><div class="stat-value">{{ referralStats.upCount || 0 }} / {{ referralStats.downCount || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>责任医生ID</label><input v-model="referralFilter.doctorId" type="number" placeholder="输入责任医生ID"></div>
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
                                <button v-if="Number(row.status)===0" class="ok" @click="acceptReferral(row.id)">接收</button>
                                <button v-if="[0,1].includes(Number(row.status))" class="warn" @click="openReferralAction(row,'reject')">拒绝</button>
                                <button v-if="[1,2].includes(Number(row.status))" class="ok" @click="openReferralAction(row,'complete')">完成</button>
                                <button v-if="[0,1].includes(Number(row.status))" class="danger" @click="cancelReferral(row.id)">取消</button>
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
                    <div class="field"><label>老人ID</label><input v-model="vitalsState.elderId" type="number" placeholder="输入老人档案ID"></div>
                    <div class="field"><label>监测指标</label><select v-model.number="vitalsState.metric"><option v-for="(txt,key) in vitalTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                    <div class="field"><label>开始日期</label><input v-model="vitalsState.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input v-model="vitalsState.endDate" type="date"></div>
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
                    <div class="field"><label>老人ID</label><input v-model="timelineFilter.elderId" type="number" placeholder="输入老人档案ID"></div>
                    <div class="field"><label>事件类型</label><select v-model="timelineFilter.eventType"><option value="">全部类型</option><option v-for="(txt,key) in timelineTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field"><label>开始日期</label><input v-model="timelineFilter.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input v-model="timelineFilter.endDate" type="date"></div>
                </div>
                <div class="panel-grid" style="margin:14px 0;">
                    <div class="card stat-card"><div class="stat-label">总事件数</div><div class="stat-value">{{ timelineSummary.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">随访</div><div class="stat-value">{{ timelineSummary.type5 || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">评估</div><div class="stat-value">{{ timelineSummary.type6 || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">干预</div><div class="stat-value">{{ timelineSummary.type7 || 0 }}</div></div>
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
                    <div class="field"><label>老人ID</label><input v-model="nurseRecordFilter.elderId" type="number" placeholder="老人ID"></div>
                    <div class="field"><label>记录类型</label><select v-model="nurseRecordFilter.recordType"><option value="">全部类型</option><option v-for="(txt,key) in recordTypeMap" :key="key" :value="key">{{ txt }}</option></select></div>
                    <div class="field"><label>上报状态</label><select v-model="nurseRecordFilter.reportStatus"><option value="">全部</option><option value="0">未上报</option><option value="1">已上报</option><option value="2">已处理</option></select></div>
                    <div class="field"><label>开始日期</label><input v-model="nurseRecordFilter.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input v-model="nurseRecordFilter.endDate" type="date"></div>
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
                    <div class="field"><label>老人ID</label><input v-model="nursePlanFilter.elderId" type="number" placeholder="老人ID"></div>
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
                    <div class="actions"><button class="primary-btn" @click="openExamModal()">+ 新增体检记录</button></div>
                </div>
                <div class="panel-grid" style="margin-bottom:14px;">
                    <div class="card stat-card"><div class="stat-label">总记录</div><div class="stat-value">{{ examStats.total || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">今年体检</div><div class="stat-value">{{ examStats.thisYear || 0 }}</div></div>
                    <div class="card stat-card"><div class="stat-label">异常项</div><div class="stat-value">{{ examStats.abnormal || 0 }}</div></div>
                </div>
                <div class="filters">
                    <div class="field"><label>老人ID</label><input v-model="examFilter.elderId" type="number" placeholder="老人档案ID"></div>
                    <div class="field"><label>开始日期</label><input v-model="examFilter.startDate" type="date"></div>
                    <div class="field"><label>结束日期</label><input v-model="examFilter.endDate" type="date"></div>
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
                                <button class="ok" @click="openExamModal(row)">编辑</button>
                                <button class="danger" @click="deleteExam(row.id)">删除</button>
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
                                <button class="ok" @click="approveReviewRecord(row.id)">通过</button>
                                <button class="danger" @click="rejectReviewRecord(row.id)">驳回</button>
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
                                <button class="ok" @click="approveReviewPlan(row.id)">通过</button>
                                <button class="danger" @click="rejectReviewPlan(row.id)">驳回</button>
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
                        <div class="field"><label>出生日期</label><input type="date" v-model="elderForm.birthDate"></div>
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
                        <div class="field"><label>老人ID</label><input type="number" v-model.number="warningForm.elderId"></div>
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
                        <div class="field"><label>老人ID</label><input type="number" v-model.number="planForm.elderId"></div>
                        <div class="field"><label>疾病类型</label><select v-model.number="planForm.diseaseType"><option v-for="(txt,key) in diseaseMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>随访频次</label><select v-model.number="planForm.frequencyType"><option v-for="(txt,key) in freqMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>开始日期</label><input type="date" v-model="planForm.startDate"></div>
                        <div class="field"><label>总次数</label><input type="number" v-model.number="planForm.totalCount"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>备注</label><textarea v-model="planForm.remark"></textarea></div></div>
                </template>
                <template v-else-if="modal==='record'">
                    <div class="form-row">
                        <div class="field"><label>随访计划ID</label><input v-model="followRecordForm.planId" disabled></div>
                        <div class="field"><label>老人ID</label><input v-model="followRecordForm.elderId" disabled></div>
                        <div class="field"><label>随访方式</label><select v-model.number="followRecordForm.followType"><option v-for="(txt,key) in followTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>随访日期</label><input type="datetime-local" v-model="followRecordForm.followDate"></div>
                        <div class="field"><label>收缩压</label><input type="number" v-model.number="followRecordForm.systolicPressure"></div>
                        <div class="field"><label>舒张压</label><input type="number" v-model.number="followRecordForm.diastolicPressure"></div>
                        <div class="field"><label>心率</label><input type="number" v-model.number="followRecordForm.heartRate"></div>
                        <div class="field"><label>空腹血糖</label><input type="number" step="0.1" v-model.number="followRecordForm.bloodSugarFasting"></div>
                        <div class="field"><label>体重</label><input type="number" step="0.1" v-model.number="followRecordForm.weight"></div>
                        <div class="field"><label>下次随访日期</label><input type="date" v-model="followRecordForm.nextFollowDate"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px; grid-template-columns:1fr;"><div class="field"><label>随访结果</label><textarea v-model="followRecordForm.followResult"></textarea></div></div>
                </template>
                <template v-else-if="modal==='intervention'">
                    <div class="form-row">
                        <div class="field"><label>老人ID</label><input type="number" v-model.number="interventionForm.elderId"></div>
                        <div class="field"><label>关联随访记录ID</label><input type="number" v-model.number="interventionForm.followRecordId"></div>
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
                        <div class="field"><label>老人ID</label><input v-model="assessmentForm.elderId" type="number"></div>
                        <div class="field"><label>责任医生ID</label><input v-model="assessmentForm.doctorId" type="number"></div>
                        <div class="field"><label>评估类型</label><select v-model.number="assessmentForm.assessType"><option v-for="(txt,key) in assessmentTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>评估日期</label><input type="date" v-model="assessmentForm.assessDate"></div>
                        <div class="field"><label>评分</label><input type="number" step="0.1" v-model="assessmentForm.score"></div>
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
                        <p style="margin-bottom:16px;color:#606266;">请输入老人档案 ID，系统将自动生成包含基本信息、健康档案、评估记录、生命体征和历史预警的完整健康评估报告。</p>
                        <div class="field"><label>老人档案ID</label><input v-model="generateReportInput.elderId" type="number" placeholder="请输入老人ID（如 1, 2, 3...）" @keyup.enter="submitGenerateReport"></div>
                        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
                            <button class="ghost-btn" @click="closeModal">取消</button>
                            <button class="primary-btn" @click="submitGenerateReport">生成报告</button>
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
                            <h4 class="report-section-title">一、老人基本信息</h4>
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
                            <h4 class="report-section-title">二、健康档案</h4>
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
                            <h4 class="report-section-title">三、病史明细</h4>
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
                            <h4 class="report-section-title">四、评估记录汇总（共 {{ reportData.data.assessmentCount }} 条）</h4>
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
                        <!-- 最新体征 -->
                        <div class="report-section" v-if="reportData.data.recentVitals?.length">
                            <h4 class="report-section-title">五、最新生命体征</h4>
                            <div class="report-grid">
                                <div class="report-field report-vital" v-for="(v, i) in reportData.data.recentVitals" :key="i">
                                    <label>{{ v.name }}</label>
                                    <span :class="v.isAbnormal === 1 ? 'abnormal' : ''">{{ v.value ?? '-' }} {{ v.unit }}</span>
                                </div>
                            </div>
                        </div>
                        <!-- 最近预警 -->
                        <div class="report-section" v-if="reportData.data.recentWarnings?.length">
                            <h4 class="report-section-title">六、近期预警记录</h4>
                            <div v-for="w in reportData.data.recentWarnings" :key="w.id" class="report-warning-item">
                                <span class="tag" :class="warnLevelClass(w.warningLevel)">{{ warnLevelText(w.warningLevel) }}</span>
                                <span class="title">{{ w.warningTitle }}</span>
                                <span class="time">{{ dateText(w.createTime) }}</span>
                            </div>
                            <div v-if="!reportData.data.recentWarnings.length" class="empty-state">暂无预警记录</div>
                        </div>
                        <!-- 报告结论 -->
                        <div class="report-section report-conclusion">
                            <h4 class="report-section-title">七、综合评估结论</h4>
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
                        <div class="field"><label>老人ID</label><input v-model="referralForm.elderId" type="number"></div>
                        <div class="field"><label>转诊类型</label><select v-model.number="referralForm.referralType"><option v-for="(txt,key) in referralTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>紧急程度</label><select v-model.number="referralForm.urgencyLevel"><option v-for="(txt,key) in urgencyMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>是否预留床位</label><select v-model.number="referralForm.bedReserved"><option :value="0">否</option><option :value="1">是</option></select></div>
                        <div class="field"><label>转出机构名称</label><input v-model="referralForm.fromOrg"></div>
                        <div class="field"><label>转出医生姓名</label><input v-model="referralForm.fromDoctorName"></div>
                        <div class="field"><label>转入机构名称</label><input v-model="referralForm.toOrg"></div>
                        <div class="field"><label>转入科室名称</label><input v-model="referralForm.toDept"></div>
                    </div>
                    <div class="form-row" style="margin-top:12px;">
                        <div class="field"><label>转入医生ID</label><input v-model="referralForm.toDoctorId" type="number"></div>
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
                        <div class="field"><label>老人ID</label><input v-model="deviceForm.elderId" type="number"></div>
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
                        <div class="timeline-card"><div class="desc">干预类型</div><div>{{ interventionText(modalData.item?.interventionType) }}</div></div>
                        <div class="timeline-card"><div class="desc">干预日期</div><div>{{ dateTimeText(modalData.item?.interventionDate) }}</div></div>
                        <div class="timeline-card"><div class="desc">干预内容</div><div>{{ modalData.item?.interventionContent || '-' }}</div></div>
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
                        <div class="field"><label>老人ID</label><input v-model="nurseRecordForm.elderId" type="number" placeholder="老人档案ID"></div>
                        <div class="field"><label>记录类型</label><select v-model.number="nurseRecordForm.recordType"><option v-for="(txt,key) in recordTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>护理日期</label><input type="datetime-local" v-model="nurseRecordForm.recordDate"></div>
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
                        <div class="field"><label>老人ID</label><input v-model="nursePlanForm.elderId" type="number" placeholder="老人档案ID"></div>
                        <div class="field"><label>计划名称</label><input v-model="nursePlanForm.planName" placeholder="如：基础护理计划"></div>
                        <div class="field"><label>计划类型</label><select v-model.number="nursePlanForm.planType"><option v-for="(txt,key) in planTypeMap" :key="key" :value="Number(key)">{{ txt }}</option></select></div>
                        <div class="field"><label>开始日期</label><input type="date" v-model="nursePlanForm.startDate"></div>
                        <div class="field"><label>结束日期</label><input type="date" v-model="nursePlanForm.endDate"></div>
                        <div class="field"><label>总次数</label><input type="number" v-model.number="nursePlanForm.totalCount" placeholder="计划总执行次数"></div>
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
                        <div class="field"><label>老人ID</label><input v-model="examForm.elderId" type="number"></div>
                        <div class="field"><label>体检日期</label><input type="date" v-model="examForm.examDate"></div>
                        <div class="field"><label>身高(cm)</label><input v-model="examForm.height" type="number" step="0.1"></div>
                        <div class="field"><label>体重(kg)</label><input v-model="examForm.weight" type="number" step="0.1"></div>
                        <div class="field"><label>收缩压</label><input v-model="examForm.systolicPressure" type="number"></div>
                        <div class="field"><label>舒张压</label><input v-model="examForm.diastolicPressure" type="number"></div>
                        <div class="field"><label>心率</label><input v-model="examForm.heartRate" type="number"></div>
                        <div class="field"><label>空腹血糖</label><input v-model="examForm.bloodSugarFasting" type="number" step="0.01"></div>
                        <div class="field"><label>体温(℃)</label><input v-model="examForm.temperature" type="number" step="0.1"></div>
                        <div class="field"><label>血氧(%)</label><input v-model="examForm.bloodOxygen" type="number" step="0.1"></div>
                        <div class="field"><label>腰围(cm)</label><input v-model="examForm.waistline" type="number" step="0.1"></div>
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
                        <div class="timeline-card"><div class="desc">体温</div><div>{{ modalData.item?.temperature ?? '-' }} ℃</div></div>
                        <div class="timeline-card"><div class="desc">血氧</div><div>{{ modalData.item?.bloodOxygen ?? '-' }} %</div></div>
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
                <template v-else-if="modal==='intervention'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveIntervention">保存</button></template>
                <template v-else-if="modal==='nurse-record'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveNurseRecord">保存护理记录</button></template>
                <template v-else-if="modal==='nurse-plan'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveNursePlan">保存护理计划</button></template>
                <template v-else-if="modal==='exam'"><button class="ghost-btn" @click="closeModal">取消</button><button class="primary-btn" @click="saveExam">保存体检记录</button></template>
                <template v-else><button class="ghost-btn" @click="closeModal">关闭</button></template>
            </div>
        </div>
    </div>
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
            elderFilter: { name: '', community: '', doctorId: '' },
            elderPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            elderForm: blankElder(),
            warningFilter: { status: '', warningLevel: '', elderId: '' },
            warningPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            warningForm: blankWarning(),
            followFilter: { status: '', diseaseType: '', elderId: '' },
            followPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            planForm: blankPlan(),
            followRecordForm: blankFollowRecord(),
            interventionFilter: { type: '', elderId: '', followRecordId: '' },
            interventionPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            interventionForm: blankIntervention(),
            assessmentFilter: { elderId: '', assessType: '' },
            assessmentPage: { records: [], pageNum: 1, pageSize: 10, pages: 0, total: 0 },
            assessmentStats: { total: 0 },
            assessmentForm: blankAssessment(),
            reportData: { loading: false, error: '', data: null },
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
            healthDetail: { loading: false, data: null },
            charts: { gender: null, warning: null, follow: null, trend: null, adminGender: null, adminRole: null, adminBiz: null }
        };
    },
    computed: {
        userDisplayName() {
            return this.userInfo.realName || this.userInfo.username || '医生';
        },
        userAvatar() {
            return (this.userDisplayName || '医').charAt(0);
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
                intervention: this.interventionForm.id ? '编辑干预记录' : '新增干预记录',
                healthDetail: '老人健康详情',
                interventionDetail: '干预详情',
                'assessment-report': '健康评估报告',
                'report-input': '生成健康评估报告',
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
            return ['healthDetail', 'interventionDetail', 'assessment-report'].includes(this.modal) ? 'modal' : 'modal sm';
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
        // 护士模块常量映射
        recordTypeMap() { return RECORD_TYPE_MAP; },
        planTypeMap() { return PLAN_TYPE_MAP; },
        nursePlanStatusMap() { return PLAN_STATUS_MAP; },
        reportStatusMap() { return REPORT_STATUS_MAP; },
        effectScoreMap() { return EFFECT_SCORE_MAP; }
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
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.resizeCharts);
        Object.keys(this.charts).forEach(k => {
            if (this.charts[k] && !this.charts[k].isDisposed()) {
                this.charts[k].dispose();
            }
            this.charts[k] = null;
        });
    },
    methods: {
        async api(url, options = {}) {
            try {
                const res = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + this.token,
                        ...(options.headers || {})
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
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
                return null;
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
            if (this.isAdmin) {
                if (tab === 'admin-dashboard') this.loadAdminDashboard();
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
                this.loadProfile()
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
                doctorId: this.elderFilter.doctorId || ''
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
        },
        async saveElder() {
            if (!this.elderForm.name || !this.elderForm.idCard || !this.elderForm.phone) {
                this.toast('提示', '请填写完整信息', 'error');
                return;
            }
            const body = { ...this.elderForm, doctorId: this.elderForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1) };
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
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.warningPage.pageSize,
                status: this.warningFilter.status || '',
                warningLevel: this.warningFilter.warningLevel || '',
                elderId: this.warningFilter.elderId || ''
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
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.followPage.pageSize,
                status: this.followFilter.status || '',
                diseaseType: this.followFilter.diseaseType || '',
                elderId: this.followFilter.elderId || ''
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
            const body = { ...this.planForm, doctorId: this.planForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1) };
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
        async loadInterventions(page = 1) {
            const query = new URLSearchParams({
                pageNum: page,
                pageSize: this.interventionPage.pageSize,
                type: this.interventionFilter.type || '',
                elderId: this.interventionFilter.elderId || '',
                followRecordId: this.interventionFilter.followRecordId || ''
            });
            const res = await this.api(`/api/intervention/list?${query.toString()}`);
            if (res?.code === 200) {
                const pg = res.data || {};
                this.interventionPage = {
                    records: pg.records || [],
                    pageNum: pg.current || page,
                    pageSize: pg.size || this.interventionPage.pageSize,
                    pages: pg.pages || 0,
                    total: pg.total || 0
                };
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
            const params = new URLSearchParams();
            params.set('pageNum', page);
            params.set('pageSize', this.assessmentPage.pageSize);
            if (this.assessmentFilter.elderId) params.set('elderId', this.assessmentFilter.elderId);
            if (this.assessmentFilter.assessType) params.set('assessType', this.assessmentFilter.assessType);
            const [listRes, statsRes] = await Promise.all([
                this.api(`/api/assessments?${params.toString()}`),
                this.api(`/api/assessments/stats${this.assessmentFilter.elderId ? `?elderId=${encodeURIComponent(this.assessmentFilter.elderId)}` : ''}`)
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
        generateReportInput: { elderId: '' },
        openAssessmentReport() {
            this.generateReportInput = { elderId: '' };
            this.modal = 'report-input';
            this.modalData = {};
        },
        submitGenerateReport() {
            const elderId = String(this.generateReportInput.elderId).trim();
            if (!elderId) {
                this.toast('提示', '请输入老人档案ID', 'error');
                return;
            }
            this.generateReport(elderId);
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
            const payload = {
                ...this.assessmentForm,
                doctorId: this.assessmentForm.doctorId || (this.userInfo.userId || this.userInfo.id || 1)
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
            const payload = {
                ...this.referralForm,
                fromDoctorId: this.referralForm.fromDoctorId || (this.userInfo.userId || this.userInfo.id || 1),
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
            const elderId = this.vitalsState.elderId;
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
            const res = await this.api(`/api/vitals/mock/${encodeURIComponent(this.vitalsState.elderId)}?days=${encodeURIComponent(this.vitalsState.mockDays || 30)}`, { method: 'POST' });
            if (res?.code === 200) {
                this.toast('成功', '模拟数据生成成功');
                this.loadVitals();
            } else {
                this.toast('提示', res?.msg || res?.message || '操作失败', 'error');
            }
        },
        async loadTimeline(page = 1) {
            if (!this.timelineFilter.elderId) {
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
                this.api(`/api/timeline/${encodeURIComponent(this.timelineFilter.elderId)}?${params.toString()}`),
                this.api(`/api/timeline/${encodeURIComponent(this.timelineFilter.elderId)}/summary`)
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
            if (info?.code === 200) this.profile.info = info.data || {};
            else this.profile.info = { ...this.profile.info, ...this.userInfo };
            if (logs?.code === 200) this.profile.logs = logs.data.records || logs.data || [];
            if (messages?.code === 200) this.profile.messages = messages.data.records || messages.data || [];
            if (unread?.code === 200) this.profile.unreadCount = unread.data || 0;
        },
        async saveProfile() {
            const body = {
                id: this.profile.info.id || this.userInfo.id || this.userInfo.userId,
                realName: this.profile.info.realName,
                phone: this.profile.info.phone,
                email: this.profile.info.email
            };
            const res = await this.api('/api/profile/info', {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            if (res?.code === 200) {
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
            if (this.profile.pwd.newPassword.length < 6) {
                this.toast('提示', '新密码至少6位', 'error');
                return;
            }
            if (this.profile.pwd.newPassword !== this.profile.pwd.confirmPassword) {
                this.toast('提示', '两次输入的密码不一致', 'error');
                return;
            }
            const res = await this.api('/api/profile/password', {
                method: 'PUT',
                body: JSON.stringify({
                    oldPassword: this.profile.pwd.oldPassword,
                    newPassword: this.profile.pwd.newPassword
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
            const body = {
                ...this.nurseRecordForm,
                nurseId: this.nurseRecordForm.nurseId || this.userInfo.userId || this.userInfo.id || 5
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
            const body = {
                ...this.nursePlanForm,
                nurseId: this.nursePlanForm.nurseId || this.userInfo.userId || this.userInfo.id || 5
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
                this.toast('成功', '删除成功');
                this.loadNursePlans(this.nursePlanPage.pageNum);
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
                temperature: this.examForm.temperature ? Number(this.examForm.temperature) : null,
                bloodOxygen: this.examForm.bloodOxygen ? Number(this.examForm.bloodOxygen) : null
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

// =====================================
// 重点人群模块前端JavaScript补充代码
// 需要将这些代码添加到 app.js 中的相应位置
// =====================================

// 1. 在Vue app的data()函数中添加以下数据属性:

keyPopulationPage: {
    pageNum: 1,
    pageSize: 10,
    total: 0,
    records: []
},
riskStats: {
    highRisk: 0,
    key: 0,
    attention: 0,
    normal: 0
},
riskFilter: {
    riskLevel: null
},
todayTasks: [],
taskStats: {
    pending: 0,
    today: 0
},

// 2. 在methods中添加以下方法:

async loadRiskStats() {
    try {
        const res = await axios.get('/api/risk/stats');
        if (res.data.code === 200) {
            this.riskStats = res.data.data;
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
        const res = await axios.get('/api/risk/elders', { params });
        if (res.data.code === 200) {
            this.keyPopulationPage = res.data.data;
            // 处理数据，添加风险等级文本
            this.keyPopulationPage.records = this.keyPopulationPage.records.map(item => {
                item.riskLevelText = this.riskLevelText(item.riskLevel);
                return item;
            });
        }
    } catch (error) {
        console.error('加载重点人群失败:', error);
        this.$message.error('加载重点人群失败');
    }
},

async calculateAllRisk() {
    try {
        const res = await axios.post('/api/risk/elders/calculate');
        if (res.data.code === 200) {
            this.$message.success(res.data.message);
            this.loadRiskStats();
            this.loadKeyPopulation(1);
        }
    } catch (error) {
        console.error('风险计算失败:', error);
        this.$message.error('风险计算失败');
    }
},

async generateFollowupTasks() {
    try {
        const res = await axios.post('/api/followup/tasks/generate');
        if (res.data.code === 200) {
            this.$message.success(res.data.message);
            this.loadTodayTasks();
        }
    } catch (error) {
        console.error('生成任务失败:', error);
        this.$message.error('生成任务失败');
    }
},

async loadTodayTasks() {
    try {
        const res = await axios.get('/api/followup/tasks/today');
        if (res.data.code === 200) {
            this.todayTasks = res.data.data;
        }
    } catch (error) {
        console.error('加载今日任务失败:', error);
    }
},

async viewRiskDetail(row) {
    try {
        const res = await axios.get(`/api/risk/elders/${row.elderId}`);
        if (res.data.code === 200) {
            const detail = res.data.data;
            // 显示风险详情对话框
            this.$alert(
                `<div>
                    <p><strong>风险等级:</strong> ${this.riskLevelText(detail.profile.riskLevel)}</p>
                    <p><strong>风险评分:</strong> ${detail.profile.riskScore}分</p>
                    <p><strong>风险标签:</strong> ${detail.profile.riskTags}</p>
                    <p><strong>上次计算时间:</strong> ${this.dateTimeText(detail.profile.lastCalculateTime)}</p>
                    <hr/>
                    <p><strong>评分详情:</strong></p>
                    <ul>
                        ${detail.reasonDetails.scoreDetails.map(d => 
                            `<li>${d.ruleName}: +${d.score}分</li>`
                        ).join('')}
                    </ul>
                </div>`,
                '风险画像详情',
                {
                    dangerouslyUseHTMLString: true,
                    confirmButtonText: '关闭'
                }
            );
        }
    } catch (error) {
        console.error('获取风险详情失败:', error);
        this.$message.error('获取风险详情失败');
    }
},

async createFollowupTask(row) {
    try {
        await this.$confirm('确认为此老人创建随访任务?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        });
        
        // 这里可以调用后端API创建单个任务（需要扩展后端接口）
        this.$message.success('任务创建成功');
        this.loadTodayTasks();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('创建任务失败:', error);
        }
    }
},

async finishFollowupTask(row) {
    try {
        await this.$prompt('请输入关联的随访记录ID', '完成任务', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /^\d+$/,
            inputErrorMessage: '请输入有效的数字ID'
        }).then(({ value }) => {
            return axios.put(`/api/followup/tasks/${row.id}/finish?followRecordId=${value}`);
        });
        
        this.$message.success('任务已完成');
        this.loadTodayTasks();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('完成任务失败:', error);
            this.$message.error('完成任务失败');
        }
    }
},

async cancelFollowupTask(row) {
    try {
        await this.$prompt('请输入取消原因', '取消任务', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        }).then(({ value }) => {
            return axios.put(`/api/followup/tasks/${row.id}/cancel?reason=${encodeURIComponent(value)}`);
        });
        
        this.$message.success('任务已取消');
        this.loadTodayTasks();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('取消任务失败:', error);
        }
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

taskTypeText(type) {
    const map = { 1: '风险随访', 2: '逾期随访', 3: '预约随访' };
    return map[type] || '未知';
},

priorityText(priority) {
    const map = { 1: '低', 2: '中', 3: '高', 4: '紧急' };
    return map[priority] || '未知';
},

priorityTag(priority) {
    const map = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' };
    return map[priority] || 'info';
},

// 3. 在watch中添加对activeTab的监听,当切换到keyPopulation时加载数据:

watch: {
    activeTab(newVal) {
        if (newVal === 'keyPopulation') {
            this.loadRiskStats();
            this.loadKeyPopulation(1);
            this.loadTodayTasks();
        }
    }
},

// 4. 在created()钩子中可以预先加载一次统计数据:

created() {
    // ... 现有代码 ...
    this.loadRiskStats(); // 加载风险统计
}

// =====================================
// 整合说明:
// =====================================
// 
// 1. 找到 app.js 中的 data() 函数，将上面的数据属性添加进去
// 2. 找到 methods 部分，将上面的方法添加进去
// 3. 找到 watch 部分，添加对 activeTab 的监听
// 4. 在 created() 钩子中调用 loadRiskStats()
// 
// 或者可以直接将这个文件的内容复制到 app.js 文件的末尾，
// 然后手动调整位置（确保不会重复定义）
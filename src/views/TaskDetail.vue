<template>
  <div class="task-detail cyber-theme" id="report-container">
    <div class="header-action-bar">
      <el-page-header
        @back="$router.back()"
        :content="'TASK DOSSIER: ' + baseInfo.task_code"
        class="cyber-header no-print"
      />
      
      <div class="no-print">
        <el-button 
          v-if="baseInfo.status !== 'done'" 
          type="success" 
          plain 
          @click="completeTask" 
          style="margin-right: 10px;"
        >
          <i class="el-icon-check"></i> 确认办结此任务
        </el-button>

        <el-button type="warning" @click="generateReport">
          <i class="el-icon-printer"></i> 生成并导出巡检报告 (PDF)
        </el-button>
      </div>
    </div>

    <div class="print-only report-title">
      <h2>建筑表面裂纹智能巡检报告单</h2>
      <p>生成时间: {{ new Date().toLocaleString() }}</p>
    </div>

    <el-card class="cyber-card no-print" style="margin-top: 20px">
      <el-steps
        :active="currentStep"
        finish-status="success"
        align-center
        class="cyber-steps"
      >
        <el-step title="任务分配"></el-step>
        <el-step title="现场巡检 (抓拍/录像)"></el-step>
        <el-step title="数据同步与归档"></el-step>
        <el-step title="出具巡检报告"></el-step>
      </el-steps>
    </el-card>

    <el-card class="cyber-card" style="margin-top: 20px">
      <el-descriptions title="巡检基础信息" border class="cyber-desc" :column="2">
        <el-descriptions-item label="任务工单编号">{{ baseInfo.task_code }}</el-descriptions-item>
        <el-descriptions-item label="巡检目标位置">{{ baseInfo.location }}</el-descriptions-item>
        <el-descriptions-item label="发现病害总数">
          <span style="color: #ef4444; font-weight: bold;">{{ snapshots.length }} 处</span>
        </el-descriptions-item>
        <el-descriptions-item label="报告更新时间">{{ lastLogTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="cyber-card page-break" style="margin-top: 20px">
      <template #header>
        <span>📸 现场异常抓拍证据链与定级</span>
      </template>
      <div v-if="snapshots.length > 0" class="gallery-grid">
        <div v-for="(img, index) in snapshots" :key="img.id" class="snapshot-card">
          <el-image
            :src="img.image"
            :preview-src-list="snapshots.map((s) => s.image)"
            :initial-index="index"
            fit="cover"
            class="gallery-img"
          />
          <div class="snapshot-meta">
            <div style="font-weight: bold; margin-bottom: 5px;">证据编号: IMG-{{ img.id.toString().slice(-6) }}</div>
            <div>雷达探距: {{ img.distance || '---' }} cm | 车速: {{ img.speed || 0 }} %</div>
            <div v-if="img.cracks && img.cracks.length > 0">
              <span v-for="c in img.cracks" :key="c.id" style="color: #ef4444; display: block; margin-top: 2px;">
                ⚠️ 检出{{ c.type }} (置信度 {{ c.confidence }}%) - 定级: {{ c.severity }}星
              </span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无现场抓拍证据" />
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12" class="no-print">
        <el-card class="cyber-card">
          <template #header><span>📹 巡检录像档案</span></template>
          <div v-if="videos.length > 0" class="video-list">
            <div v-for="vid in videos" :key="vid.id" class="video-card">
              <div class="video-icon">▶</div>
              <div class="video-info">
                <div class="v-title">现场巡检录像片段</div>
                <div class="v-desc">时长: {{ vid.duration }} | 录制于: {{ vid.time }}</div>
              </div>
              <el-button size="small" type="primary" plain @click="playVideo">调取查看</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无录像记录" />
        </el-card>
      </el-col>

      <el-col :span="12" class="print-full-width">
        <el-card class="cyber-card">
          <template #header><span>📋 缺陷流转与处置日志</span></template>
          <el-timeline v-if="logs.length > 0">
            <el-timeline-item
              v-for="log in logs"
              :key="log.id"
              :timestamp="log.time"
              :type="log.type"
              color="#00e5ff"
            >
              <span
                :style="{
                  color: log.type === 'danger' ? '#ef4444' : 'inherit',
                  fontWeight: log.type === 'danger' ? 'bold' : 'normal',
                }"
              >
                {{ log.event }}
              </span>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无流转日志" />
        </el-card>
      </el-col>
    </el-row>
    
    <div class="print-only signature-area">
      <div class="sign-box">巡检员签字：______________</div>
      <div class="sign-box">审核人签字：______________</div>
      <div class="sign-box">日期：____年__月__日</div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from "element-plus";

export default {
  data() {
    return {
      baseInfo: {
        status: "in_progress",
        task_code: "TSK-001",
        location: "教学楼A区外墙",
      },
      logs: [],
      snapshots: [],
      videos: [],
      statusMap: {
        pending: { text: "待分配", tag: "info", step: 0 },
        in_progress: { text: "巡检中", tag: "warning", step: 1 },
        done: { text: "已完成", tag: "success", step: 4 },
      },
    };
  },
  computed: {
    currentStep() {
      // 只要有了证据，进度条推到第3步
      return this.snapshots.length > 0 ? 3 : (this.statusMap[this.baseInfo.status]?.step || 0);
    },
    lastLogTime() {
      return this.logs.length > 0
        ? this.logs[0].time
        : new Date().toLocaleString();
    },
  },
  mounted() {
    const id = this.$route.params.id || "TSK-001";
    this.baseInfo.task_code = id;
    this.initData(id);
  },
  methods: {
    initData(id) {
      const localRecords = JSON.parse(
        localStorage.getItem(`task_records_${id}`) || "[]",
      );

      // 分类数据，兼容 AI 定级数据 (snapshot_with_ai)
      this.snapshots = localRecords.filter((r) => r.type === "snapshot" || r.type === "snapshot_with_ai");
      this.videos = localRecords.filter((r) => r.type === "video");

      const defectLogs = localRecords
        .filter((r) => r.type === "defect_tag")
        .map((r) => ({
          id: r.id, time: r.time, type: "danger",
          event: `🚨 人工强制上报: ${r.defectType} (严重级别: ${r.severity}星) - ${r.desc || "无描述"}`,
        }));
        
      const aiLogs = this.snapshots.map(r => ({
          id: r.id + 1, time: r.time, type: "warning",
          event: `📸 自动抓拍留证: 发现 ${r.cracks?.length || 0} 处病害`
      }))

      const videoLogs = this.videos.map((r) => ({
        id: r.id, time: r.time, type: "primary",
        event: `📹 完成现场录像录制 (时长: ${r.duration})`,
      }));

      this.logs = [...defectLogs, ...aiLogs, ...videoLogs].sort(
        (a, b) => new Date(b.time) - new Date(a.time),
      );

      const allTasks = JSON.parse(localStorage.getItem("system_tasks") || "[]");
      const currentTask = allTasks.find((t) => t.id === id);
      if (currentTask) this.baseInfo.location = currentTask.location;
    },
    playVideo() {
      ElMessage.success("视频源受保护，演示环境仅作存证展示。");
    },
    generateReport() {
      // 直接调用打印，不要任何 ElMessage 提示框！
      window.print(); 
    },
    // 🌟 新增：办结任务的业务逻辑
    completeTask() {
      // 更新当前页面的显示状态
      this.baseInfo.status = 'done';
      
      // 更新到本地数据库
      const allTasks = JSON.parse(localStorage.getItem('system_tasks') || '[]');
      const taskIndex = allTasks.findIndex(t => t.id === this.baseInfo.task_code);
      if (taskIndex !== -1) {
        allTasks[taskIndex].status = 'done';
        localStorage.setItem('system_tasks', JSON.stringify(allTasks));
      }

      ElMessage.success("✅ 任务已彻底办结归档！进度条已更新。");
    },
  },
};
</script>

<style scoped>
.cyber-theme { padding: 20px; background-color: #050810; min-height: 100vh; color: #e2e8f0; }
.header-action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
:deep(.el-page-header__content) { color: #00e5ff; font-weight: bold; letter-spacing: 1px; }

:deep(.cyber-card) { background: #0b1320; border: 1px solid rgba(0, 229, 255, 0.2); color: #e2e8f0; }
:deep(.cyber-card .el-card__header) { border-bottom: 1px solid rgba(0, 229, 255, 0.2); color: #00e5ff; font-weight: bold; }
:deep(.el-step__title.is-success), :deep(.el-step__head.is-success) { color: #00e5ff; border-color: #00e5ff; }

/* 描述列表暗黑样式 */
:deep(.el-descriptions__body) { background: transparent; }
:deep(.el-descriptions__label) { background: #070b14 !important; color: #00e5ff !important; border-color: rgba(0, 229, 255, 0.1) !important; width: 150px;}
:deep(.el-descriptions__content) { color: #e2e8f0 !important; border-color: rgba(0, 229, 255, 0.1) !important; background: #0b1320 !important;}

/* 画廊布局 */
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
.snapshot-card { background: #050810; border: 1px solid rgba(0, 229, 255, 0.15); border-radius: 6px; overflow: hidden; transition: transform 0.2s; }
.snapshot-card:hover { transform: translateY(-3px); border-color: #00e5ff; box-shadow: 0 5px 15px rgba(0, 229, 255, 0.1); }
.gallery-img { width: 100%; height: 180px; display: block; cursor: pointer; border-bottom: 1px solid rgba(0,229,255,0.1); }
.snapshot-meta { padding: 10px; font-size: 11px; color: #94a3b8; font-family: monospace; line-height: 1.6;}

/* 录像列表布局 */
.video-list { display: flex; flex-direction: column; gap: 12px; }
.video-card { display: flex; align-items: center; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); padding: 12px; border-radius: 6px; }
.video-icon { width: 40px; height: 40px; background: #00e5ff; color: #050810; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 15px; }
.video-info { flex: 1; }
.v-title { font-weight: bold; color: #e2e8f0; font-size: 14px; margin-bottom: 4px; }
.v-desc { color: #64748b; font-size: 12px; font-family: monospace; }

.print-only { display: none; }

/* ==========================================
   🖨️ 打印专属 CSS (将赛博朋克转换为正式A4公文)
   ========================================== */
@media print {
  @page { margin: 15mm; size: A4 portrait; }
  
  /* 强制变白底黑字 */
  html, body, .cyber-theme { background: #ffffff !important; color: #000000 !important; min-height: auto; padding: 0; }
  
  /* 隐藏所有不需要打印的控件 */
  .no-print, .el-steps, .video-list { display: none !important; }
  
  /* 显示打印专用的表头和签字区 */
  .print-only { display: block; }
  .report-title { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  .report-title h2 { font-size: 24px; letter-spacing: 2px; margin: 0 0 10px 0; }
  .report-title p { font-size: 12px; color: #666; margin: 0; }
  
  .signature-area { margin-top: 50px; display: flex; justify-content: space-around; font-size: 14px; page-break-inside: avoid; }
  
  /* 卡片和表格样式重写为正式文档风 */
  :deep(.cyber-card) { background: #fff !important; border: none !important; box-shadow: none !important; margin-top: 10px !important; margin-bottom: 20px;}
  :deep(.cyber-card .el-card__header) { border-bottom: 1px solid #000 !important; color: #000 !important; padding: 10px 0; font-size: 16px; margin-bottom: 15px;}
  :deep(.el-descriptions__label), :deep(.el-descriptions__content) { background: #fff !important; color: #000 !important; border-color: #000 !important; font-size: 12px; padding: 8px;}
  
  /* 证据图片排版优化，防止被切断 */
  .page-break { page-break-before: auto; }
  .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .snapshot-card { border: 1px solid #999 !important; background: #fff; page-break-inside: avoid; }
  .snapshot-meta { color: #000 !important; border-top: 1px solid #999; }
  .gallery-img { height: 200px; border-bottom: none;}

  /* 时间轴日志拉宽 */
  .print-full-width { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }
  :deep(.el-timeline-item__content span) { color: #000 !important; }
}
</style>

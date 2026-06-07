<template>
  <div class="task-detail cyber-theme">
    <el-page-header
      @back="$router.back()"
      :content="'TASK DOSSIER: ' + baseInfo.task_code"
      class="cyber-header"
    />

    <el-card class="cyber-card" style="margin-top: 20px">
      <el-steps
        :active="currentStep"
        finish-status="success"
        align-center
        class="cyber-steps"
      >
        <el-step title="任务分配"></el-step>
        <el-step title="现场巡检 (抓拍/录像)"></el-step>
        <el-step title="数据同步与归档"></el-step>
        <el-step title="任务完成"></el-step>
      </el-steps>
    </el-card>

    <el-card class="cyber-card" style="margin-top: 20px">
      <el-descriptions title="教学楼巡检基本信息" border class="cyber-desc">
        <el-descriptions-item label="任务编号">{{
          baseInfo.task_code
        }}</el-descriptions-item>
        <el-descriptions-item label="巡检位置">{{
          baseInfo.location
        }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag
            :type="statusMap[baseInfo.status]?.tag || 'info'"
            effect="dark"
            class="cyber-tag"
          >
            {{ statusMap[baseInfo.status]?.text || "未知" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{
          lastLogTime
        }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="cyber-card" style="margin-top: 20px">
      <template #header>
        <span>📸 现场抓拍证据链 (点击图片可放大)</span>
      </template>
      <div v-if="snapshots.length > 0" class="gallery-grid">
        <div
          v-for="(img, index) in snapshots"
          :key="img.id"
          class="snapshot-card"
        >
          <el-image
            :src="img.image"
            :preview-src-list="snapshots.map((s) => s.image)"
            :initial-index="index"
            fit="cover"
            class="gallery-img"
          />
          <div class="snapshot-meta">
            <div><i class="el-icon-time"></i> {{ img.time }}</div>
            <div>雷达探距: {{ img.distance }}cm | 车速: {{ img.speed }}%</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无现场抓拍图片" />
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="cyber-card">
          <template #header><span>📹 巡检录像档案</span></template>
          <div v-if="videos.length > 0" class="video-list">
            <div v-for="vid in videos" :key="vid.id" class="video-card">
              <div class="video-icon">▶</div>
              <div class="video-info">
                <div class="v-title">现场巡检录像片段</div>
                <div class="v-desc">
                  时长: {{ vid.duration }} | 录制于: {{ vid.time }}
                </div>
              </div>
              <el-button size="small" type="primary" plain @click="playVideo"
                >调取查看</el-button
              >
            </div>
          </div>
          <el-empty v-else description="暂无录像记录" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="cyber-card">
          <template #header><span>⚠️ 缺陷标记与流转日志</span></template>
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
                  color: log.type === 'danger' ? '#ef4444' : '#e2e8f0',
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
      return this.statusMap[this.baseInfo.status]?.step || 0;
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
      // 直接读取本地 PiControl 产生的数据闭环，不再请求 localhost:3000
      const localRecords = JSON.parse(
        localStorage.getItem(`task_records_${id}`) || "[]",
      );

      // 分类数据：图片、视频、人工标记
      this.snapshots = localRecords.filter((r) => r.type === "snapshot");
      this.videos = localRecords.filter((r) => r.type === "video");

      // 构建日志时间轴
      const defectLogs = localRecords
        .filter((r) => r.type === "defect_tag")
        .map((r) => ({
          id: r.id,
          time: r.time,
          type: "danger",
          event: `🚨 人工上报缺陷: ${r.defectType} (严重级别: ${r.severity}星) - ${r.desc || "无描述"}`,
        }));
      const videoLogs = this.videos.map((r) => ({
        id: r.id,
        time: r.time,
        type: "primary",
        event: `📹 完成现场录像录制 (时长: ${r.duration})`,
      }));

      this.logs = [...defectLogs, ...videoLogs].sort(
        (a, b) => new Date(b.time) - new Date(a.time),
      );

      // 动态更新任务位置信息
      const allTasks = JSON.parse(localStorage.getItem("system_tasks") || "[]");
      const currentTask = allTasks.find((t) => t.id === id);
      if (currentTask) this.baseInfo.location = currentTask.location;
    },
    playVideo() {
      ElMessage.success("视频源受保护，演示环境仅作存证展示。");
    },
  },
};
</script>

<style scoped>
.cyber-theme {
  padding: 20px;
  background-color: #050810;
  min-height: 100vh;
  color: #e2e8f0;
}
:deep(.el-page-header__content) {
  color: #00e5ff;
  font-weight: bold;
  letter-spacing: 1px;
}
:deep(.cyber-card) {
  background: #0b1320;
  border: 1px solid rgba(0, 229, 255, 0.2);
  color: #e2e8f0;
}
:deep(.cyber-card .el-card__header) {
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  color: #00e5ff;
  font-weight: bold;
}
:deep(.el-step__title.is-success),
:deep(.el-step__head.is-success) {
  color: #00e5ff;
  border-color: #00e5ff;
}
:deep(.el-descriptions__body) {
  background: transparent;
}
:deep(.el-descriptions__label) {
  background: #070b14 !important;
  color: #00e5ff !important;
  border-color: rgba(0, 229, 255, 0.1) !important;
}
:deep(.el-descriptions__content) {
  color: #e2e8f0 !important;
  border-color: rgba(0, 229, 255, 0.1) !important;
  background: #0b1320 !important;
}

/* 画廊布局 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.snapshot-card {
  background: #050810;
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s;
}
.snapshot-card:hover {
  transform: translateY(-3px);
  border-color: #00e5ff;
  box-shadow: 0 5px 15px rgba(0, 229, 255, 0.1);
}
.gallery-img {
  width: 100%;
  height: 180px;
  display: block;
  cursor: pointer;
}
.snapshot-meta {
  padding: 10px;
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: monospace;
  border-top: 1px solid rgba(0, 229, 255, 0.1);
}

/* 录像列表布局 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.video-card {
  display: flex;
  align-items: center;
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  padding: 12px;
  border-radius: 6px;
}
.video-icon {
  width: 40px;
  height: 40px;
  background: #00e5ff;
  color: #050810;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 15px;
}
.video-info {
  flex: 1;
}
.v-title {
  font-weight: bold;
  color: #e2e8f0;
  font-size: 14px;
  margin-bottom: 4px;
}
.v-desc {
  color: #64748b;
  font-size: 12px;
  font-family: monospace;
}
</style>

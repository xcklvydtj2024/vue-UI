<template>
  <div class="task-detail">
    <!-- 页头 -->
    <el-page-header @back="$router.back()" :content="'任务详情: ' + baseInfo.task_code" />

    <!-- 1. 进度展示：使用 el-steps 增强直观感 -->
    <el-card style="margin-top: 20px">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="任务分配"></el-step>
        <el-step title="现场巡检"></el-step>
        <el-step title="图片上传"></el-step>
        <el-step title="模型检测"></el-step>
        <el-step title="任务完成"></el-step>
      </el-steps>
    </el-card>

    <!-- 2. 基础信息展示：映射状态颜色与中文 -->
    <el-card class="box-card" style="margin-top: 20px">
      <el-descriptions title="巡检基本信息" border>
        <el-descriptions-item label="任务编号">{{ baseInfo.task_code }}</el-descriptions-item>
        <el-descriptions-item label="巡检位置">{{ baseInfo.location }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <!-- 使用 el-tag 映射状态枚举 -->
          <el-tag :type="statusMap[baseInfo.status]?.tag || 'info'" effect="dark">
            {{ statusMap[baseInfo.status]?.text || '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ lastLogTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 3. 照片与检测结果：联动显示裂纹概率 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card header="检测结果可视化">
          <div v-if="images.length > 0" class="image-viewer-container">
            <div style="position: relative; display: inline-block;">
              <el-image 
                :src="currentViewImage.url" 
                fit="contain" 
                class="main-inspection-img" 
              />
              <!-- 动态绘制 bbox 并叠加置信度标签 -->
              <div 
                v-for="box in getBboxes(currentViewImage.id)" 
                :key="box.id"
                class="detection-bbox"
                :style="{ left: box.x+'px', top: box.y+'px', width: box.w+'px', height: box.h+'px' }"
              >
                <span class="confidence-label">{{ (box.prob * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无巡检照片" />
        </el-card>
      </el-col>

      <!-- 右侧：缩略图列表与日志 -->
      <el-col :span="8">
        <el-card header="照片列表" style="margin-bottom: 20px">
          <el-scrollbar height="200px">
            <div 
              v-for="img in images" 
              :key="img.id" 
              class="thumb-item" 
              @click="currentViewImage = img"
              :class="{active: currentViewImage.id === img.id}"
            >
              <el-image :src="img.url" fit="cover" style="width: 80px; height: 60px" />
              <span style="margin-left: 10px; font-size: 12px;">{{ img.name }}</span>
            </div>
          </el-scrollbar>
        </el-card>

        <el-card header="执行日志">
          <el-timeline>
            <el-timeline-item 
              v-for="log in logs" 
              :key="log.id" 
              :timestamp="log.time"
              :type="log.type"
            >
              {{ log.event }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { SERVER } from './config.js';
import { ElMessage } from 'element-plus'; // 引入消息组件 [4, 5]

export default {
  data() {
    return {
      baseInfo: { status: 'pending' },
      logs: [],
      images: [],
      detections: [],
      currentViewImage: {},
      // 状态映射表 [6]
      statusMap: {
        pending: { text: '待分配', tag: 'info', step: 0 },
        in_progress: { text: '巡检中', tag: 'warning', step: 2 },
        done: { text: '已完成', tag: 'success', step: 5 }
      }
    }
  },
  computed: {
    // 动态计算当前步骤条索引 [7]
    currentStep() {
      return this.statusMap[this.baseInfo.status]?.step || 0;
    },
    lastLogTime() {
      return this.logs.length > 0 ? this.logs[this.logs.length - 1].time : '---';
    }
  },
  mounted() {
    this.initData(this.$route.params.id);
  },
  methods: {
    // 3. 增强的错误处理机制 [3]
    async initData(id) {
      try {
        // 聚合请求
        const [taskRes, logRes, imgRes, detRes] = await Promise.all([
          fetch(`${SERVER}/tasks/${id}`),
          fetch(`${SERVER}/logs?task_id=${id}`),
          fetch(`${SERVER}/images?task_id=${id}`),
          fetch(`${SERVER}/detections?task_id=${id}`)
        ]);

        if (!taskRes.ok) throw new Error("服务器未响应");

        this.baseInfo = await taskRes.json();
        this.logs = await logRes.json();
        this.images = await imgRes.json();
        this.detections = await detRes.json();

        if (this.images.length > 0) this.currentViewImage = this.images[0];
        
      } catch (error) {
        // 调用 Element Plus 错误提示 [3, 8]
        ElMessage.error("任务详情加载失败，请检查网络或后端配置");
      }
    },
    getBboxes(imageId) {
      return this.detections.filter(d => d.image_id === imageId);
    }
  }
}
</script>

<style scoped>
/* BBox 样式增强 */
.detection-bbox {
  position: absolute;
  border: 2px solid #F56C6C; /* 使用警告色 [6] */
  background: rgba(245, 108, 108, 0.15);
  pointer-events: none;
}
/* 概率标签：显示在框的左上角 */
.confidence-label {
  position: absolute;
  top: -20px;
  left: -2px;
  background: #F56C6C;
  color: white;
  padding: 0 4px;
  font-size: 11px;
  border-radius: 2px;
}
.thumb-item {
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  border: 1px solid transparent;
}
.thumb-item.active {
  border-color: #409EFF;
  background: #ecf5ff;
}
.main-inspection-img {
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); /* 卡片式阴影 [9] */
}
</style>
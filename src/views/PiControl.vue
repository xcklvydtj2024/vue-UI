<template>
  <div class="cyber-dashboard">
    <header class="telemetry-status-bar">
      <div class="bar-item">
        <span class="label">当前巡检任务:</span>
        <el-select
          v-model="currentTaskId"
          size="small"
          placeholder="请选择系统派发的任务"
          style="width: 180px"
          @change="handleTaskDispatch"
        >
          <el-option
            v-for="task in availableTasks"
            :key="task.id"
            :label="`[${task.id}] ${task.location}`"
            :value="task.id"
          >
          </el-option>
        </el-select>
      </div>
      <div class="bar-divider"></div>
      <div class="bar-item">
        <span class="dot" :class="{ online: isConnected }"></span>
        <span class="label">控制链路:</span>
        <span class="val text-green" v-if="isConnected">CONNECTED</span>
        <span class="val text-red" v-else>DISCONNECTED</span>
      </div>
      <div class="bar-divider"></div>
      <div class="bar-item">
        <i class="el-icon-connection"></i>
        <span class="label">网络延迟:</span>
        <span
          class="val"
          :class="pingDelay > 50 ? 'text-orange' : 'text-cyan'"
          >{{ isConnected ? pingDelay + "ms" : "---" }}</span
        >
      </div>
      <div class="bar-item">
        <span class="label">丢包率:</span>
        <span class="val" :class="packetLoss > 0 ? 'text-red' : 'text-muted'">{{
          isConnected ? packetLoss + "%" : "---"
        }}</span>
      </div>
      <div class="bar-divider"></div>
      <div class="bar-item">
        <span class="label">CPU温度:</span>
        <span
          class="val"
          :class="telemetry.cpuTemp > 75 ? 'text-red-blink' : 'text-orange'"
          >{{ isConnected ? telemetry.cpuTemp + "℃" : "---" }}</span
        >
      </div>
      <div class="bar-item">
        <span class="label">CPU负载:</span>
        <span class="val text-cyan">{{
          isConnected ? telemetry.cpuUsage + "%" : "---"
        }}</span>
      </div>
    </header>

    <div class="hud-master-screen" ref="masterScreenRef" :class="{ 'offline-blur': !isConnected }">
      <img
        v-if="isConnected"
        ref="videoStreamRef"
        crossorigin="anonymous"
        :src="videoStreamUrl"
        class="live-video-stream"
        alt="Pi Camera FPV"
      />

      <div v-else class="video-offline-placeholder">
        <div class="radar-scan"></div>
        <p class="offline-text">SIGNAL LOST // 等待树莓派视频流接入...</p>
      </div>

      <div v-if="isRecording" class="recording-badge">
        <span class="rec-dot"></span> REC {{ recordTime }}
      </div>

      <div class="hud-action-floating-box" v-if="isConnected">
        <button class="hud-action-btn" style="color: #4ade80; border-color: #4ade80; cursor: default;">
        <span class="rec-dot" style="display:inline-block; margin-right:5px; animation: boxPulse 1s infinite alternate;"></span>
        🤖 自动巡航侦测中...
        </button>
        <button class="hud-action-btn" @click="handleFullscreen" title="全屏显示监控画面">
        🖥️ 全屏预览
        </button>
        <button
          class="hud-action-btn btn-record"
          :class="{ 'recording-active': isRecording }"
          @click="handleRecordToggle"
        >
          📹 {{ isRecording ? "停止录像" : "录制视频" }}
        </button>
        <button class="hud-action-btn btn-tag" @click="handleManualTag">
          ⚠️ 标记缺陷
        </button>
      </div>

      <div class="hud-overlay-panel left-gauge" v-if="isConnected">
        <svg class="progress-ring" width="140" height="90">
          <path
            d="M 15 80 A 55 55 0 0 1 125 80"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            stroke-width="6"
            stroke-linecap="round"
          />
          <path
            d="M 15 80 A 55 55 0 0 1 125 80"
            fill="none"
            stroke="url(#cyanGlow)"
            stroke-width="6"
            stroke-linecap="round"
            class="speed-arc"
            :style="{
              strokeDasharray: 172,
              strokeDashoffset: 172 - 172 * (telemetry.speed / 100),
            }"
          />
          <defs>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0ea5e9" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <div class="digital-speed">
          <span class="num">{{ Math.round(telemetry.speed) }}</span>
          <span class="unit">PWM % (功率)</span>
        </div>
      </div>

      <div class="hud-overlay-panel right-radar" v-if="isConnected">
        <div class="radar-bar-wrapper">
          <div class="radar-track">
            <div
              class="radar-fill"
              :class="{ 'danger-glow': telemetry.distance < 40 }"
              :style="{
                height: Math.min((telemetry.distance / 300) * 100, 100) + '%',
              }"
            ></div>
          </div>
          <div class="radar-val">{{ telemetry.distance }}cm</div>
        </div>
      </div>

      <div
        class="hud-ai-bounding-box"
        v-if="isConnected && aiEnabled && telemetry.speed > 0"
        :style="{ top: '40%', left: '35%', width: '140px', height: '90px' }"
      >
        <div class="ai-label">CRACK: {{ aiConfidence }}%</div>
      </div>
    </div>

    <div class="hardware-control-grid">
      <div class="panel-box">
        <div class="panel-title">🏎️ 小车底盘行驶（长按控制）</div>
        <div class="control-matrix">
          <button
            :disabled="!isConnected"
            @mousedown="handlePress('forward')"
            @mouseup="handleRelease"
            @touchstart.prevent="handlePress('forward')"
            @touchend="handleRelease"
            class="matrix-btn up"
          >
            前进
          </button>
          <div class="matrix-row">
            <button
              :disabled="!isConnected"
              @mousedown="handlePress('left')"
              @mouseup="handleRelease"
              @touchstart.prevent="handlePress('left')"
              @touchend="handleRelease"
              class="matrix-btn left"
            >
              左转
            </button>
            <button
              :disabled="!isConnected"
              @mousedown="handlePress('backward')"
              @mouseup="handleRelease"
              @touchstart.prevent="handlePress('backward')"
              @touchend="handleRelease"
              class="matrix-btn down"
            >
              后退
            </button>
            <button
              :disabled="!isConnected"
              @mousedown="handlePress('right')"
              @mouseup="handleRelease"
              @touchstart.prevent="handlePress('right')"
              @touchend="handleRelease"
              class="matrix-btn right"
            >
              右转
            </button>
          </div>
        </div>
      </div>

      <div class="panel-box estop-panel">
        <div class="panel-title text-red">⚠️ 安全动能防御</div>
        <div class="estop-wrapper">
          <button
            class="estop-btn"
            :disabled="!isConnected"
            @click="handleEmergencyStop"
          >
            <div class="estop-inner">
              <span>E-STOP</span>
              <small>紧急制动</small>
            </div>
          </button>
        </div>
      </div>

      <div class="panel-box">
        <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span>📸 舵机云台 (绝对角度)</span>
          <el-button size="small" type="primary" plain @click="calibratePTZ" :disabled="!isConnected">
            归中校准
          </el-button>
        </div>
        
        <div class="ptz-sliders" style="padding: 0 10px;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom: 8px;">
            <span style="color:#94a3b8; font-size:11px; width:45px;">水平(X)</span>
            <el-slider v-model="ptzPan" :min="0" :max="180" :step="1" style="flex:1;" :disabled="!isConnected" @change="updatePTZ" />
            <span style="color:#00e5ff; font-size:12px; width:35px; text-align:right;">{{ptzPan}}°</span>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:#94a3b8; font-size:11px; width:45px;">垂直(Y)</span>
            <el-slider v-model="ptzTilt" :min="0" :max="180" :step="1" style="flex:1;" :disabled="!isConnected" @change="updatePTZ" />
            <span style="color:#00e5ff; font-size:12px; width:35px; text-align:right;">{{ptzTilt}}°</span>
          </div>
        </div>
      </div>
      <div class="panel-box terminal-panel">
        <div class="panel-title">📋 WEBSOCKET 实时报文流通信日志</div>
        <div class="terminal-body" ref="logContainer">
          <div v-for="(log, idx) in logs" :key="idx" class="terminal-row">
            <span class="t-time">[{{ log.time }}]</span>
            <span class="t-text" :class="log.type">{{ log.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="control-footer">
      <div class="footer-item">
        <span class="footer-label">树莓派长连</span>
        <el-switch
          v-model="isConnected"
          active-color="#4ade80"
          inactive-color="#334155"
          @change="handleConnectToggle"
        />
      </div>

      <div class="footer-item slider-item">
        <span class="footer-label">强光补光灯亮度</span>
        <div class="slider-wrapper">
          <el-slider
            v-model="lightBrightness"
            :min="0"
            :max="100"
            :disabled="!isConnected"
            @change="handleLightChange"
          />
          <span class="slider-val">{{ lightBrightness }}%</span>
        </div>
      </div>

      <div class="footer-item slider-item">
        <span class="footer-label">行驶输出功率 (PWM %)</span>
        <div class="slider-wrapper">
          <el-slider
            v-model="maxSpeed"
            :min="10"
            :max="100"
            :disabled="!isConnected"
            @change="handleConfigChange"
          />
          <span class="slider-val">{{ maxSpeed }}%</span>
        </div>
      </div>

      <div class="footer-item">
        <span class="footer-label">AI实时裂纹检测</span>
        <el-switch
          v-model="aiEnabled"
          active-color="#4ade80"
          inactive-color="#334155"
          :disabled="!isConnected"
          @change="watchAiStatus"
        />
      </div>
    </div>

    <el-dialog
      v-model="showCaptureDialog"
      title="📸 AI-人工协同定级归档"
      width="600px"
      custom-class="cyber-dialog"
      append-to-body
    >
      <div class="capture-preview" style="position: relative">
        <img
          :src="captureImage"
          style="width: 100%; border-radius: 6px; border: 1px solid #00e5ff"
        />
      </div>

      <div class="defect-assessment-list" style="margin-top: 15px">
        <h4 style="color: #00e5ff; margin-bottom: 10px; font-family: monospace">
          <i class="el-icon-cpu"></i> 模型检出
          {{ detectedCracks.length }} 处疑似病害，请人工定级：
        </h4>

        <div
          v-for="crack in detectedCracks"
          :key="crack.id"
          class="defect-item"
        >
          <div class="defect-header">
            <el-tag
              size="small"
              color="#0B1320"
              style="border-color: #00e5ff; color: #00e5ff"
            >
              裂纹 #{{ crack.id }}
            </el-tag>
            <span class="conf-text">AI 置信度: {{ crack.confidence }}%</span>
          </div>

          <el-form label-width="90px" size="small" style="margin-top: 10px">
            <el-form-item label="人工定级">
              <el-rate
                v-model="crack.severity"
                :colors="['#10b981', '#f59e0b', '#ef4444']"
                show-text
                :texts="[
                  '极轻微',
                  '轻微',
                  '中度(需关注)',
                  '严重(需修补)',
                  '极度危险',
                ]"
              ></el-rate>
            </el-form-item>
            <el-form-item label="病害类型">
              <el-select
                v-model="crack.type"
                placeholder="校验病害类型"
                style="width: 100%"
              >
                <el-option label="表面细纹" value="细纹"></el-option>
                <el-option label="结构性裂缝" value="结构裂缝"></el-option>
                <el-option label="渗水龟裂" value="渗水龟裂"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="showCaptureDialog = false" plain
          >舍 弃 图 像</el-button
        >
        <el-button
          type="primary"
          @click="saveCapture"
          color="#00e5ff"
          style="color: #050810; font-weight: bold"
        >
          💾 同步定级数据并归档
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showTagDialog"
      title="⚠️ 人工缺陷上报"
      width="400px"
      custom-class="cyber-dialog"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="缺陷类型">
          <el-select v-model="tagForm.type" placeholder="选择肉眼发现的缺陷">
            <el-option
              label="横向裂纹 (Transverse)"
              value="horizontal"
            ></el-option>
            <el-option
              label="纵向裂纹 (Longitudinal)"
              value="vertical"
            ></el-option>
            <el-option label="网状龟裂 (Alligator)" value="mesh"></el-option>
            <el-option label="坑槽剥落 (Pothole)" value="pothole"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="严重级别">
          <el-rate
            v-model="tagForm.severity"
            :colors="['#00e5ff', '#facc15', '#ef4444']"
          ></el-rate>
        </el-form-item>
        <el-form-item label="现场描述">
          <el-input
            type="textarea"
            v-model="tagForm.desc"
            placeholder="例如：裂纹较深，伴随严重渗水现象..."
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTagDialog = false" plain>取 消</el-button>
        <el-button
          type="primary"
          @click="submitTag"
          color="#00e5ff"
          style="color: #050810; font-weight: bold"
        >
          🚀 立即上报系统
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
// ==========================================
// ⌨️ WASD 键盘监听与防抖逻辑
// ==========================================
// 记录按键状态，防止长按时触发疯狂连续请求
const activeKeys = reactive({ w: false, a: false, s: false, d: false });

const handleKeyDown = (e) => {
  if (!isConnected.value) return;
  // 忽略在输入框里的按键
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; 
  
  const key = e.key.toLowerCase();
  if (key === 'w' && !activeKeys.w) { activeKeys.w = true; handlePress('forward'); }
  if (key === 's' && !activeKeys.s) { activeKeys.s = true; handlePress('backward'); }
  if (key === 'a' && !activeKeys.a) { activeKeys.a = true; handlePress('left'); }
  if (key === 'd' && !activeKeys.d) { activeKeys.d = true; handlePress('right'); }
};

const handleKeyUp = (e) => {
  if (!isConnected.value) return;
  const key = e.key.toLowerCase();
  
  if (['w', 'a', 's', 'd'].includes(key)) {
    activeKeys[key] = false;
    // 只有当所有方向键都松开时，才发送停车指令
    if (!activeKeys.w && !activeKeys.a && !activeKeys.s && !activeKeys.d) {
      handleRelease();
    }
  }
};
// 📡 绑定 FastAPI 真实视频流地址
// 📡 绑定 FastAPI 真实视频流地址 (替换为树莓派的真实IP)
// ⚠️ 注意：每次树莓派重新连 WiFi，这个 IP 可能会变，请确保这里填的是最新的！
// 📡 绑定 FastAPI 真实视频流地址
// 网页前端只跟 Windows 本机的 AI 大脑对话！
const BASE_URL = "http://127.0.0.1:8000"; 
const videoStreamUrl = ref(`${BASE_URL}/inspection/stream.mjpg`);

const isConnected = ref(true);
const maxSpeed = ref(50);
const lightBrightness = ref(0);
const aiEnabled = ref(false);
const aiConfidence = ref(0);
const isRecording = ref(false);
const currentTaskId = ref("");
const availableTasks = ref([]);

// 新增：存放 AI 识别出的裂纹数据数组
const detectedCracks = ref([]);

// 📸 抓拍所需变量
const showCaptureDialog = ref(false);
const captureImage = ref("");
const videoStreamRef = ref(null);

// 📹 录像所需变量
const recordTime = ref("00:00:00");
let recordInterval = null;

// ⚠️ 标记所需变量
const showTagDialog = ref(false);
const tagForm = reactive({ type: "", severity: 2, desc: "" });

const pingDelay = ref(15);
const packetLoss = ref(0);
let heartbeatTimer = null;
let telemetryTimer = null;
// 🖥️ 触发全屏 API 逻辑
const masterScreenRef = ref(null); // 👈 绑定上方加的 ref

const handleFullscreen = () => {
  const elem = masterScreenRef.value;
  if (elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari/Chrome */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  }
};
const telemetry = reactive({
  speed: 0,
  voltage: 11.8,
  distance: 195,
  cpuTemp: 52,
  cpuUsage: 24,
});
const logs = ref([]);
const logContainer = ref(null);

onMounted(() => { 
  telemetryTimer = setInterval(fetchCarState, 1500); 
  const savedTasks = JSON.parse(localStorage.getItem('system_tasks') || '[]');
  availableTasks.value = savedTasks;
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // 🌟 新增：页面加载时，自动唤醒后端的普通视频流！
  watchAiStatus(false);
});

const handleTaskDispatch = (val) => {
  if (val) {
    ElMessage.success(`任务 ${val} 已成功下发至小车控制总线！`);
    printLog(`[系统总线] 任务上下文已切换至 ${val}，巡检数据将同步至任务详情`, "recv");
    
    // 🌟 核心状态流转：将选中的任务状态改为“执行中 (in_progress)”
    const allTasks = JSON.parse(localStorage.getItem('system_tasks') || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === val);
    if (taskIndex !== -1) {
      allTasks[taskIndex].status = 'in_progress';
      localStorage.setItem('system_tasks', JSON.stringify(allTasks));
    }
  }
};

const printLog = (text, type = "info") => {
  const time = new Date().toTimeString().split(" ")[0];
  logs.value.push({ time, text, type });
  nextTick(() => {
    if (logContainer.value)
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
  });

  const globalLogs = JSON.parse(
    localStorage.getItem("global_system_logs") || "[]",
  );
  globalLogs.unshift({
    time: new Date().toLocaleString(),
    event: text,
    operator: "Admin_Pilot",
    task_id: currentTaskId.value || "N/A",
  });
  localStorage.setItem("global_system_logs", JSON.stringify(globalLogs));
};

const apiRequest = async (endpoint, method = "GET", payload = null) => {
  try {
    const options = { method, headers: {} };
    if (payload) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }
    
    // 统一发送给本机的 app.py
    const requestUrl = `${BASE_URL}${endpoint}`;

    const startTime = Date.now();
    const response = await fetch(requestUrl, options);
    pingDelay.value = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "请求失败");
    return data;
// ... 后续代码不变
  } catch (err) {
    printLog(`[ERROR] ${err.message}`, "red");
    throw err;
  }
};

// 💡 视觉平滑过渡逻辑 (模拟电机真实起步缓和与刹车)
let speedInterval = null;

const handlePress = async (direction) => {
  const dirMap = { forward: "F", backward: "B", left: "L", right: "R" };
  
  // 视觉上的逐渐加速效果 (每 50ms 增加 5%)
  clearInterval(speedInterval);
  speedInterval = setInterval(() => {
    if (telemetry.speed < maxSpeed.value) telemetry.speed += 5;
    if (telemetry.speed >= maxSpeed.value) { 
      telemetry.speed = maxSpeed.value; 
      clearInterval(speedInterval); 
    }
  }, 50);

  try {
    await apiRequest("/control/move", "POST", {
      direction: dirMap[direction],
      speed: maxSpeed.value,
    });
  } catch (e) {}
};

const handleRelease = async () => {
  // 视觉上的刹车减速效果
  clearInterval(speedInterval);
  speedInterval = setInterval(() => {
    if (telemetry.speed > 0) telemetry.speed -= 10;
    if (telemetry.speed <= 0) { 
      telemetry.speed = 0; 
      clearInterval(speedInterval); 
    }
  }, 50);
  
  try {
    await apiRequest("/control/stop", "POST");
  } catch (e) {}
};

const handleEmergencyStop = async () => {
  telemetry.speed = 0; 
  clearInterval(speedInterval);
  printLog("EMERGENCY STOP (硬件急停) 已下发！", "error");
  try {
    await apiRequest("/control/stop", "POST");
  } catch (e) {}
};

// ==========================================
// 📸 舵机绝对角度与校准控制 (在 PiControl.vue 中)
// ==========================================
const ptzPan = ref(90);  // 对应后端 yaw
const ptzTilt = ref(90); // 对应后端 pitch

const calibratePTZ = async () => {
  ptzPan.value = 90;
  ptzTilt.value = 90;
  await updatePTZ();
  ElMessage.success("云台舵机已强制归中！");
  printLog("云台校准: [X:90°, Y:90°]", "info");
};

// 发送绝对角度给后端
const updatePTZ = async () => {
  try {
    // 调用现有的 angle 接口，并将参数名改为后端能识别的 yaw 和 pitch
    await apiRequest('/control/gimbal/angle', 'POST', { 
      yaw: ptzPan.value, 
      pitch: ptzTilt.value 
    });
  } catch(e) {}
};

const handleConfigChange = async () => {
  try {
    await apiRequest("/control/speed", "POST", { speed: maxSpeed.value });
  } catch (e) {}
};



const saveCapture = () => {
  if (!currentTaskId.value) {
    ElMessage.error("无法保存！请先在顶部选择当前正在执行的“巡检任务”。");
    return;
  }

  const captureRecord = {
    id: Date.now(),
    taskId: currentTaskId.value,
    type: "snapshot_with_ai", // 标志为带AI协同的数据
    image: captureImage.value,
    cracks: detectedCracks.value, // ✅ 保存包含人工评级的裂纹数据数组！
    distance: telemetry.distance,
    speed: telemetry.speed,
    time: new Date().toLocaleString(),
  };

  const dbKey = `task_records_${currentTaskId.value}`;
  const existingRecords = JSON.parse(localStorage.getItem(dbKey) || "[]");
  existingRecords.push(captureRecord);
  localStorage.setItem(dbKey, JSON.stringify(existingRecords));

  ElMessage.success("抓拍图像及人工定级数据已成功归档至任务详情！");
  printLog(
    `[数据中心] 现场截屏与AI定级已上传，已挂载至任务工单: ${currentTaskId.value}`,
    "recv",
  );
  showCaptureDialog.value = false;
};

const handleRecordToggle = () => {
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    ElMessage({ message: "▶ 开始实时转录巡检视频...", type: "success" });
    let secs = 0;
    recordTime.value = "00:00:00";
    recordInterval = setInterval(() => {
      secs++;
      recordTime.value = new Date(secs * 1000).toISOString().substr(11, 8);
    }, 1000);
  } else {
    clearInterval(recordInterval);
    ElMessage.success(
      `⏹ 录制完成！时长 ${recordTime.value}，已同步至任务详情。`,
    );
    if (currentTaskId.value) {
      const dbKey = `task_records_${currentTaskId.value}`;
      const existing = JSON.parse(localStorage.getItem(dbKey) || "[]");
      existing.push({
        id: Date.now(),
        type: "video",
        duration: recordTime.value,
        time: new Date().toLocaleString(),
      });
      localStorage.setItem(dbKey, JSON.stringify(existing));
    }
  }
};

const handleManualTag = () => {
  tagForm.type = "";
  tagForm.desc = "";
  tagForm.severity = 2;
  showTagDialog.value = true;
};

const submitTag = () => {
  if (!currentTaskId.value) {
    ElMessage.error("无法上报！请先在顶部关联“巡检任务”。");
    return;
  }
  if (!tagForm.type) {
    ElMessage.warning("警告：必须选择一项缺陷类型！");
    return;
  }
  const tagRecord = {
    id: Date.now(),
    taskId: currentTaskId.value,
    type: "defect_tag",
    defectType: tagForm.type,
    severity: tagForm.severity,
    desc: tagForm.desc,
    time: new Date().toLocaleString(),
  };
  const dbKey = `task_records_${currentTaskId.value}`;
  const existingRecords = JSON.parse(localStorage.getItem(dbKey) || "[]");
  existingRecords.push(tagRecord);
  localStorage.setItem(dbKey, JSON.stringify(existingRecords));

  ElMessage.success(`异常工单已生成！[等级: ${tagForm.severity}星]`);
  printLog(
    `[数据中心] 人工缺陷标记已同步至任务: ${currentTaskId.value}`,
    "send",
  );
  showTagDialog.value = false;
};

const watchAiStatus = async (val) => {
  try {
    if (val) {
      printLog("正在切换至 AI 实时检测模式...", "info");
      await apiRequest("/inspection/start-detection", "POST");
    } else {
      printLog("正在切换至 普通预览模式...", "info");
      await apiRequest("/inspection/start-preview", "POST");
    }
  } catch (e) {}
};

// 新增：记录上一次自动弹窗的图片ID，防止同一张图片无限疯狂弹窗
const lastAutoImgId = ref(null);

const fetchCarState = async () => {
  if (!isConnected.value) return;
  try {
    const state = await apiRequest("/inspection/state", "GET");
    
    // 1. 更新 HUD 面板上的置信度显示 (绿色雷达框里的数字)
    if (state.detection_count > 0 && state.detections) {
      aiConfidence.value = Math.round(state.detections[0].confidence * 100);
    } else {
      aiConfidence.value = 0;
    }

    // 2. 🚨 核心逻辑：监听后端的“自动落盘抓拍”信号！
    if (state.latest_capture_info) {
      const autoInfo = state.latest_capture_info;
      
      // 检查这张照片的 ID 是否是新的 (前端没处理过的)
      if (autoInfo.image_id !== lastAutoImgId.value) {
        lastAutoImgId.value = autoInfo.image_id; // 记录下来，标记为已处理
        
        // 读取后端保存好的图片真实路径
        // (假设后端的静态资源映射在根目录，拼接 BASE_URL)
        const pathStr = autoInfo.image_url.replace(/\\/g, '/');
        const matchIdx = pathStr.indexOf('data/output');
        if (matchIdx !== -1) {
          captureImage.value = BASE_URL + '/' + pathStr.substring(matchIdx);
        } else {
          captureImage.value = BASE_URL + '/' + pathStr;
        } 
        
        // 读取后端传来的这条裂缝的具体数据
        detectedCracks.value = autoInfo.cracks.map((c, i) => ({
          id: i + 1,
          confidence: (c.confidence * 100).toFixed(1),
          severity: 3, // 默认给3星中度，等待操作员人工复核
          type: c.class_name || "表面细纹"
        }));
        
        // 🚀 强制全自动弹出人工定级框！
        showCaptureDialog.value = true;
        ElMessage.warning("🚨 AI 自动捕获到外墙病害，已为您自动留证，请立即定级！");
      }
    }
  } catch (e) {
    packetLoss.value = 100;
  }
};

onUnmounted(() => { 
  clearInterval(telemetryTimer); 
  handleRelease(); 
  
  // 🔴 卸载键盘监听
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style scoped>
/* 修改 PiControl.vue 里的 .cyber-dashboard 样式 */
.cyber-dashboard {
  background-color: #030712;
  background-image: radial-gradient(circle at 50% 20%, #0b1528 0%, #030712 80%);
  color: #f8fafc;
  
  /* 关键修改在这里 👇 */
  height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
  overflow-y: auto;          /* 允许内容区溢出滚动 */
  
  padding: 16px;
  font-family: 'SF Pro Display', system-ui, monospace;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.telemetry-status-bar {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 12px;
}
.bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bar-divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
}
.dot {
  width: 6px;
  height: 6px;
  background: #475569;
  border-radius: 50%;
}
.dot.online {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}
.label {
  color: #64748b;
}
.val {
  font-weight: bold;
  font-family: monospace;
}

.hud-master-screen {
  width: 100%;
  height: 380px;
  background: #000;
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}
.live-video-stream {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.85;
}

.hud-action-floating-box {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
  z-index: 10;
}
.hud-action-btn {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.hud-action-btn:hover {
  background: #1e293b;
  color: #38bdf8;
  border-color: #38bdf8;
}
.btn-tag:hover {
  color: #facc15;
  border-color: #facc15;
}
.recording-active {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: #ef4444 !important;
  color: #f87171 !important;
  animation: boxPulse 1s infinite alternate;
}

.recording-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 6px 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}
.rec-dot {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  animation: recBlink 1s infinite;
}

.hud-overlay-panel {
  position: absolute;
  bottom: 16px;
  background: rgba(10, 17, 32, 0.7);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px;
  pointer-events: none;
}
.left-gauge {
  left: 16px;
}
.right-radar {
  right: 16px;
  width: 70px;
  height: 110px;
}
.speed-arc {
  transition: stroke-dashoffset 0.1s ease;
}
.digital-speed {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.digital-speed .num {
  font-size: 28px;
  font-weight: 900;
  color: #38bdf8;
  font-family: monospace;
  line-height: 1;
}
.digital-speed .unit {
  font-size: 9px;
  color: #475569;
}
.radar-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 6px;
}
.radar-track {
  width: 12px;
  flex: 1;
  background: #020617;
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}
.radar-fill {
  width: 100%;
  background: linear-gradient(to top, #22c55e, #4ade80);
}
.radar-fill.danger-glow {
  background: linear-gradient(to top, #ef4444, #f87171);
  box-shadow: 0 0 10px #ef4444;
}
.radar-val {
  font-size: 11px;
  font-family: monospace;
  color: #94a3b8;
}

.hud-ai-bounding-box {
  position: absolute;
  border: 2px dashed #4ade80;
  box-shadow: inset 0 0 12px rgba(74, 222, 128, 0.2);
  animation: boxPulse 1s infinite alternate;
}
.hud-ai-bounding-box::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  width: 8px;
  height: 8px;
  border-color: #4ade80;
  border-style: solid;
  border-width: 2px 0 0 2px;
}
.hud-ai-bounding-box::after {
  content: "";
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-color: #4ade80;
  border-style: solid;
  border-width: 0 2px 2px 0;
}
.ai-label {
  position: absolute;
  top: -20px;
  left: -2px;
  background: #4ade80;
  color: #020617;
  font-size: 9px;
  font-weight: bold;
  padding: 1px 4px;
  font-family: monospace;
}

.hardware-control-grid { 
  display: grid; 
  grid-template-columns: 1.2fr 1fr 1.2fr 2fr; 
  gap: 14px; 
  /* 💡 核心 1：将 min-height 换成强硬的 height 锁死总高度 */
  height: 165px; 
  flex-shrink: 0; 
}
.panel-box { 
  background: rgba(15, 23, 42, 0.4); 
  border: 1px solid rgba(255, 255, 255, 0.04); 
  border-radius: 8px; 
  padding: 10px; 
  display: flex; 
  flex-direction: column; 
  justify-content: space-between; 
  /* 💡 核心 2：严禁内部元素把盒子撑破 */
  overflow: hidden; 
}
.panel-title {
  font-size: 11px;
  color: #475569;
  font-weight: bold;
  margin-bottom: 4px;
}

.control-matrix {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: auto 0;
}
.matrix-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.matrix-btn {
  width: 56px;
  height: 36px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  font-weight: 600;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.matrix-btn:active:not(:disabled) {
  background: rgba(14, 165, 233, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}
.matrix-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
}
.ptz-center-node {
  font-size: 10px;
  color: #64748b;
  width: 40px;
  text-align: center;
  font-weight: bold;
}

.estop-panel {
  border-color: rgba(239, 68, 68, 0.15);
  background: rgba(239, 68, 68, 0.02);
}
.estop-wrapper {
  display: flex;
  items: center;
  justify-content: center;
  height: 100%;
  margin: auto 0;
}
.estop-btn {
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 4px solid #7f1d1d;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.3);
  transition: all 0.1s;
}
.estop-btn:active:not(:disabled) {
  background: #b91c1c;
  transform: scale(0.92);
  box-shadow: 0 0 5px rgba(220, 38, 38, 0.5);
}
.estop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.estop-inner span {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.5px;
}
.estop-inner small {
  font-size: 8px;
  opacity: 0.7;
  margin-top: 2px;
}

.terminal-panel { 
  flex: 1; 
  /* 💡 核心 3：日志面板也限制溢出 */
  overflow: hidden; 
}
.terminal-body { 
  flex: 1; 
  overflow-y: auto; 
  background: #010307; 
  border-radius: 4px; 
  padding: 6px; 
  font-family: monospace; 
  font-size: 11px; 
  /* 💡 核心 4：终极魔法 min-height: 0，强制让 Flex 子元素触发内滚动，而不是撑开父元素 */
  min-height: 0; 
}
.terminal-row {
  display: flex;
  gap: 6px;
  line-height: 1.3;
  margin-bottom: 1px;
}
.t-time {
  color: #334155;
}
.info {
  color: #eab308;
}
.send {
  color: #38bdf8;
}
.recv {
  color: #4ade80;
}

.control-footer {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.footer-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.footer-label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}
.slider-item {
  flex: 1;
  min-width: 180px;
}
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.slider-wrapper :deep(.el-slider) {
  flex: 1;
}
.slider-val {
  background: #010409;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: #38bdf8;
  min-width: 25px;
  text-align: center;
}

@keyframes boxPulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
@keyframes recBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
@keyframes rScan {
  100% {
    transform: rotate(360deg);
  }
}

.text-cyan {
  color: #38bdf8;
}
.text-orange {
  color: #f97316;
}
.text-red {
  color: #ef4444;
}
.text-green {
  color: #4ade80;
}
.text-muted {
  color: #475569;
}
.text-red-blink {
  color: #ef4444;
  animation: boxPulse 0.5s infinite alternate;
  font-weight: bold;
}
.video-offline-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.radar-scan {
  position: absolute;
  width: 160px;
  height: 160px;
  border: 2px solid rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(239, 68, 68, 0.08) 0%,
    transparent 40%
  );
  animation: rScan 3s linear infinite;
}
.offline-text {
  color: #f87171;
  font-family: monospace;
  font-size: 12px;
  z-index: 2;
}

:deep(.cyber-dialog) {
  background: #0b1320 !important;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.1);
}
:deep(.el-dialog__title) {
  color: #00e5ff;
  font-weight: bold;
  letter-spacing: 1px;
}
:deep(.el-form-item__label) {
  color: #94a3b8;
}
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: #050810;
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.2) inset;
  color: #e2e8f0;
}
:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #00e5ff inset;
}

/* 🔴 抓拍弹窗中的评估列表样式 */
.defect-item {
  background: rgba(0, 229, 255, 0.05);
  border: 1px dashed rgba(0, 229, 255, 0.3);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}
.defect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
  padding-bottom: 8px;
}
.conf-text {
  font-family: monospace;
  font-size: 12px;
  color: #ef4444;
  font-weight: bold;
}
</style>

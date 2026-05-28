<template>
  <div class="camera-monitor" style="padding: 24px;">
    <h2>树莓派摄像头监控（真实版）</h2>

    <!-- 真实视频画面：来自树莓派 MJPEG 流 -->
    <div class="video-box" style="
      width: 100%;
      max-width: 800px;
      height: 450px;
      background: #000;
      margin: 20px 0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      position: relative;
      overflow: hidden;
    ">
      <!-- 真视频流 -->
      <img
        v-if="isStreaming"
        :src="streamUrl"
        style="width:100%;height:100%;object-fit:cover;"
        alt="实时视频流"
      />
      <!-- 未开启提示 -->
      <div v-else style="text-align:center;">
        <div>📷 摄像头未连接</div>
        <div style="font-size:14px;opacity:0.7;margin-top:10px">点击【开启监控】连接树莓派摄像头</div>
      </div>

      <!-- 状态角标 -->
      <div style="
        position: absolute;
        top: 12px;
        left: 12px;
        background: #ff3b30;
        color: #fff;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
      ">
        <span v-if="isStreaming" style="width:8px;height:8px;background:#fff;border-radius:50%;margin-right:6px;animation:flash 1s infinite"></span>
        {{ isStreaming ? '实时直播' : '未连接' }}
      </div>
    </div>

    <!-- 控制按钮（真交互） -->
    <div style="display: flex; gap: 12px; margin: 10px 0;">
      <el-button type="primary" @click="toggleStream" :loading="connecting">
        {{ isStreaming ? '⏸ 断开监控' : '▶ 开启监控' }}
      </el-button>
      <el-button type="success" @click="takePhoto" :disabled="!isStreaming">
        📸 抓拍照片
      </el-button>
      <el-button type="warning" @click="clearPhoto" :disabled="photoList.length===0">
        🗑 清空抓拍
      </el-button>
    </div>

    <!-- 抓拍照片展示（真实图片） -->
    <div v-if="photoList.length > 0" style="margin-top: 30px;">
      <h4>抓拍记录</h4>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top:10px">
        <div
          v-for="(item, index) in photoList"
          :key="index"
          style="width:160px;height:90px;background:#eee;border-radius:6px;overflow:hidden;"
        >
          < img :src="item" style="width:100%;height:100%;object-fit:cover;" alt="抓拍"/>
        </div>
      </div>
    </div>

    <!-- 日志 -->
    <div style="margin-top: 30px; border-top:1px solid #eee; padding-top:20px;">
      <h4>操作日志</h4>
      <p v-for="(log, i) in logs" :key="i" style="margin:4px 0;">{{ log }}</p >
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElButton } from 'element-plus'

// ---------- 这里改成你树莓派的 IP ----------
const PI_IP = '192.168.1.100' // 换成你树莓派局域网IP
const streamUrl = ref(`http://${PI_IP}:8080/stream.mjpg`) // MJPEG 流地址
const photoApi = ref(`http://${PI_IP}:8080/take_photo`)   // 拍照接口

const isStreaming = ref(false)
const connecting = ref(false)
const photoList = ref([])
const logs = ref([])

// 开启/断开监控
const toggleStream = () => {
  if (isStreaming.value) {
    // 断开：清空src
    streamUrl.value = ''
    isStreaming.value = false
    logs.value.unshift('⏸ 已断开摄像头连接')
  } else {
    // 连接：重新赋值触发加载
    connecting.value = true
    streamUrl.value = `http://${PI_IP}:8080/stream.mjpg?t=${Date.now()}`
    // 模拟等待（实际由图片加载决定）
    setTimeout(() => {
      isStreaming.value = true
      connecting.value = false
      logs.value.unshift('✅ 已连接树莓派摄像头，开始实时监控')
    }, 800)
  }
}

// 真实拍照：调用树莓派接口，拿到图片URL
const takePhoto = async () => {
  try {
    const res = await fetch(photoApi.value)
    if (!res.ok) throw new Error('拍照失败')
    // 树莓派返回图片URL或base64，这里假设返回可直接访问的URL
    const imgUrl = await res.text() 
    photoList.value.unshift(imgUrl)
    logs.value.unshift(`📸 已抓拍照片 (共${photoList.value.length}张)`)
  } catch (e) {
    logs.value.unshift(`❌ 抓拍失败：${e.message}`)
  }
}

const clearPhoto = () => {
  photoList.value = []
  logs.value.unshift('🗑 已清空所有抓拍照片')
}
</script>

<style>
@keyframes flash {
  0% { opacity:1; }
  50% { opacity:0.3; }
  100% { opacity:1; }
}
</style>

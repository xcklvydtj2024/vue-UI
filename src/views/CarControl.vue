<template>
  <div style="padding: 24px;">
    <h2>STM32 巡检小车操控</h2>

    <!-- 连接状态 -->
    <div style="margin: 10px 0;">
      <el-tag :type="isConnected ? 'success' : 'danger'">
        {{ isConnected ? '✅ 已连接小车' : '❌ 未连接小车' }}
      </el-tag>
      <el-button 
        style="margin-left: 15px" 
        :type="isConnected ? 'warning' : 'primary'"
        @click="toggleConnect"
        :loading="loading"
      >
        {{ isConnected ? '断开连接' : '连接小车' }}
      </el-button>
    </div>

    <!-- 参数输入：距离、角度 -->
    <el-input 
      v-model.number="distance" 
      placeholder="行驶距离（单位：cm）" 
      style="width: 220px; margin: 10px 10px 10px 0"
      :disabled="!isConnected"
    />
    <el-input 
      v-model.number="angle" 
      placeholder="转向角度（单位：°）" 
      style="width: 220px; margin: 10px 0"
      :disabled="!isConnected"
    />

    <!-- 控制按钮组 -->
    <div style="margin: 20px 0; display: flex; gap: 12px;">
      <el-button type="primary" @click="sendCmd('forward')" :disabled="!isConnected">前进</el-button>
      <el-button type="warning" @click="sendCmd('back')" :disabled="!isConnected">后退</el-button>
      <el-button type="success" @click="sendCmd('left')" :disabled="!isConnected">左转</el-button>
      <el-button type="danger" @click="sendCmd('right')" :disabled="!isConnected">右转</el-button>
      <el-button type="info" @click="sendCmd('stop')" :disabled="!isConnected">急停</el-button>
    </div>

    <!-- 操作日志 -->
    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      <h4>指令日志</h4>
      <div style="max-height: 200px; overflow-y: auto;">
        <p v-for="(log, idx) in cmdLog" :key="idx" style="margin: 4px 0; font-size: 14px;">
          {{ log }}
        </p >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// ===================== 配置项（根据你的硬件修改）=====================
// 方案1：WiFi模块(ESP8266/ESP32) 局域网地址 + 端口
const CAR_URL = "http://192.168.1.101:80" // STM32+WiFi模块的IP和端口
// 方案2：如果用WebSocket长连接，替换上面为 ws://192.168.1.101:8081
// =================================================================

const distance = ref(0)  // 行驶距离
const angle = ref(0)     // 转向角度
const isConnected = ref(false)
const loading = ref(false)
const cmdLog = ref([])   // 指令日志

// 拼接通信指令格式（和STM32约定好格式，示例：指令,参数）
const getCmdStr = (cmd) => {
  switch(cmd) {
    case 'forward':
      return `F,${distance.value}`  // F=前进，后跟距离
    case 'back':
      return `B,${distance.value}`   // B=后退
    case 'left':
      return `L,${angle.value}`     // L=左转
    case 'right':
      return `R,${angle.value}`     // R=右转
    case 'stop':
      return `S,0`                  // S=停止
    default:
      return ''
  }
}

// 连接/断开 小车
const toggleConnect = async () => {
  loading.value = true
  if (isConnected.value) {
    // 断开逻辑
    isConnected.value = false
    cmdLog.value.unshift("🔌 已断开与STM32小车的连接")
  } else {
    // 测试连通性（简单心跳检测）
    try {
      const res = await fetch(`${CAR_URL}/ping`)
      if (res.ok) {
        isConnected.value = true
        cmdLog.value.unshift("🔗 成功连接STM32小车，可下发控制指令")
      }
    } catch (err) {
      cmdLog.value.unshift("❌ 连接失败，请检查小车电源、网络及WiFi模块")
    }
  }
  loading.value = false
}

// 下发控制指令
const sendCmd = async (cmd) => {
  const cmdText = getCmdStr(cmd)
  if (!cmdText) return

  try {
    // 向前端小车WiFi服务发送指令
    const res = await fetch(`${CAR_URL}/cmd?data=${cmdText}`)
    if (res.ok) {
      cmdLog.value.unshift(`✅ 指令下发成功：${cmdText}`)
    } else {
      cmdLog.value.unshift(`⚠️ 指令下发异常：${cmdText}`)
    }
  } catch (err) {
    cmdLog.value.unshift(`❌ 通信失败：${cmdText}`)
  }
}
</script>
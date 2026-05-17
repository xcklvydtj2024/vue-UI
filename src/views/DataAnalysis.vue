<template>
  <div class="page-container">

    <!-- 筛选 -->
    <el-form :inline="true" class="filter-bar">
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadAllData">刷新数据</el-button>
      </el-form-item>
    </el-form>

    <!-- 图表 -->
    <el-row :gutter="20">

      <!-- 柱状图 -->
      <el-col :span="12">
        <el-card>
          <template #header>区域裂纹统计</template>
          <div ref="barChart" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 折线图 -->
      <el-col :span="12">
        <el-card>
          <template #header>任务完成趋势</template>
          <div ref="lineChart" class="chart-box"></div>
        </el-card>
      </el-col>

    </el-row>

    <!-- 热力图 -->
    <el-row style="margin-top:20px">
      <el-col :span="24">
        <el-card>
          <template #header>裂纹分布热力图</template>
          <div ref="heatmapChart" class="heatmap-box"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  data() {
    return {
      dateRange: [],
      tasks: [],
      detections: [],

      regionData: [],
      progressData: [],
      heatmapData: [],

      barChart: null,
      lineChart: null,
      heatmapChart: null
    }
  },

  mounted() {
    this.initCharts()
    this.loadAllData()
  },

  methods: {

    // 初始化图表
    initCharts() {
      this.barChart = echarts.init(this.$refs.barChart)
      this.lineChart = echarts.init(this.$refs.lineChart)
      this.heatmapChart = echarts.init(this.$refs.heatmapChart)
    },

    // 获取数据
    async loadAllData() {
      try {
        const [t, d] = await Promise.all([
          fetch("http://localhost:3000/tasks"),
          fetch("http://localhost:3000/detections")
        ])

        this.tasks = await t.json()
        this.detections = await d.json()

        this.processData()

      } catch (err) {
        this.$notify.error({
          title: "错误",
          message: "数据加载失败"
        })
      }
    },

    // ⭐ 核心：动态计算
    processData() {

      // ========= 1. 区域统计 =========
      const regionMap = {}

      this.tasks.forEach(t => {
        if (!regionMap[t.location]) {
          regionMap[t.location] = 0
        }
        regionMap[t.location] += t.crack_count || 0
      })

      this.regionData = Object.keys(regionMap).map(k => ({
        region: k,
        value: regionMap[k]
      }))


      // ========= 2. 完成趋势 =========
      const dateMap = {}

      this.tasks.forEach(t => {
        if (!t.plan_time) return

        const date = t.plan_time.slice(5, 10) // 05-10

        if (!dateMap[date]) dateMap[date] = 0

        if (t.status === 'done') {
          dateMap[date]++
        }
      })

      this.progressData = Object.keys(dateMap).map(k => ({
        date: k,
        value: dateMap[k]
      }))


      // ========= 3. 热力图 =========
      this.heatmapData = this.detections.map(d => [
        d.x,
        d.y,
        d.confidence
      ])

      // 渲染图表
      this.renderBar()
      this.renderLine()
      this.renderHeatmap()
    },

    // 柱状图
    renderBar() {
      this.barChart.setOption({
        tooltip: {},
        xAxis: {
          type: 'category',
          data: this.regionData.map(i => i.region)
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: this.regionData.map(i => i.value)
        }]
      })
    },

    // 折线图
    renderLine() {
      this.lineChart.setOption({
        tooltip: {},
        xAxis: {
          type: 'category',
          data: this.progressData.map(i => i.date)
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          smooth: true,
          data: this.progressData.map(i => i.value)
        }]
      })
    },

    // 热力图（scatter模拟）
    renderHeatmap() {
      this.heatmapChart.setOption({
        tooltip: {},
        xAxis: { show: false },
        yAxis: { show: false },
        series: [{
          type: 'scatter',
          symbolSize: val => val[2] * 10,
          data: this.heatmapData
        }]
      })
    }

  }
}
</script>

<style scoped>
.filter-bar {
  background: #fff;
  padding: 15px;
  margin-bottom: 20px;
}

.chart-box {
  height: 300px;
}

.heatmap-box {
  height: 400px;
}
</style>
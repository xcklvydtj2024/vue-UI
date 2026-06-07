<template>
  <div class="page-container cyber-theme">
    <el-form
      :inline="true"
      class="filter-bar cyber-card"
      style="display: flex; justify-content: space-between"
    >
      <div>
        <el-form-item label="当前展示建筑">
          <el-select
            v-model="currentBuilding"
            class="cyber-input"
            style="width: 200px"
            @change="renderAllCharts"
          >
            <el-option label="默认 - 理科教学楼" value="default"></el-option>
            <el-option
              v-if="customBuilding.name"
              :label="`自定义 - ${customBuilding.name}`"
              value="custom"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            color="#00e5ff"
            style="color: #050810; font-weight: bold"
            @click="renderAllCharts"
          >
            <i class="el-icon-refresh"></i> 刷新底层数据
          </el-button>
        </el-form-item>
      </div>
      <div>
        <el-button type="warning" plain @click="showConfigDialog = true">
          ⚙️ 动态配置建筑架构 (楼层/区域)
        </el-button>
      </div>
    </el-form>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="cyber-card">
          <template #header>🏢 各层级病害高发频次统计</template>
          <div ref="barChart" class="chart-box"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="cyber-card">
          <template #header>📊 人机协同评估危急程度占比</template>
          <div ref="pieChart" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card class="cyber-card">
          <template #header>
            🗺️ 动态建筑网格病害落图 (结合AI置信度与人工定级)
          </template>
          <div ref="gridHeatmapChart" class="grid-heatmap-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showConfigDialog"
      title="⚙️ 配置目标建筑空间网格"
      width="500px"
      custom-class="cyber-dialog"
    >
      <el-form label-width="100px">
        <el-form-item label="建筑名称">
          <el-input
            v-model="configForm.name"
            placeholder="例如：实验楼C座"
          ></el-input>
        </el-form-item>
        <el-form-item label="层数 (Y轴)">
          <el-input-number
            v-model="configForm.floorCount"
            :min="1"
            :max="20"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="立面区域 (X轴)">
          <el-input
            type="textarea"
            v-model="configForm.zonesStr"
            placeholder="用逗号分隔，如：东侧,南侧,西侧,北侧"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfigDialog = false" plain>取消</el-button>
        <el-button
          type="primary"
          color="#00e5ff"
          style="color: #050810"
          @click="saveBuildingConfig"
          >保存并重绘网格</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from "echarts";

export default {
  data() {
    return {
      currentBuilding: "default",
      showConfigDialog: false,
      barChart: null,
      pieChart: null,
      gridHeatmapChart: null,

      // 默认架构
      defaultStructure: {
        name: "理科教学楼",
        floors: ["1F(基座)", "2F", "3F", "4F(顶层)"],
        zones: ["左侧区域", "主入口", "右侧区域"],
      },
      // 用户自定义架构
      customBuilding: { name: "", floors: [], zones: [] },

      // 表单绑定
      configForm: {
        name: "实验楼C座",
        floorCount: 6,
        zonesStr: "东立面,南立面,西立面,北立面",
      },
    };
  },
  mounted() {
    this.barChart = echarts.init(this.$refs.barChart);
    this.pieChart = echarts.init(this.$refs.pieChart);
    this.gridHeatmapChart = echarts.init(this.$refs.gridHeatmapChart);

    // 尝试读取本地缓存的建筑结构
    const savedConfig = localStorage.getItem("custom_building_config");
    if (savedConfig) this.customBuilding = JSON.parse(savedConfig);

    this.renderAllCharts();
    window.addEventListener("resize", () => {
      this.barChart.resize();
      this.pieChart.resize();
      this.gridHeatmapChart.resize();
    });
  },
  methods: {
    saveBuildingConfig() {
      // 动态生成楼层数组 ['1F', '2F', ...]
      const floors = Array.from(
        { length: this.configForm.floorCount },
        (_, i) => `${i + 1}F`,
      );
      const zones = this.configForm.zonesStr
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter((s) => s);

      this.customBuilding = { name: this.configForm.name, floors, zones };
      localStorage.setItem(
        "custom_building_config",
        JSON.stringify(this.customBuilding),
      );
      this.currentBuilding = "custom";
      this.showConfigDialog = false;
      this.renderAllCharts();
    },

    renderAllCharts() {
      // 1. 确定当前使用的坐标轴架构
      const struct =
        this.currentBuilding === "custom"
          ? this.customBuilding
          : this.defaultStructure;
      const xZones = struct.zones;
      const yFloors = struct.floors;

      let gridDataMap = Array(xZones.length)
        .fill(0)
        .map(() => Array(yFloors.length).fill(0));
      let severityStats = { mild: 0, moderate: 0, severe: 0 };
      let floorStats = {};
      yFloors.forEach((f) => (floorStats[f] = 0));

      // 2. 提取 PiControl 产生的真实人机协同数据
      let realDefectCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("task_records_")) {
          const records = JSON.parse(localStorage.getItem(key));

          // 找到包含 cracks（置信度+评级）的快照记录
          records
            .filter((r) => r.type === "snapshot_with_ai")
            .forEach((record) => {
              record.cracks.forEach((crack) => {
                realDefectCount++;

                // 统计危急程度 (基于人工定级 crack.severity 1~5星)
                if (crack.severity >= 4) severityStats.severe++;
                else if (crack.severity === 3) severityStats.moderate++;
                else severityStats.mild++;

                // 随机映射到网格中（仅为模拟展示，实际可根据方位角/高度传感器分配）
                const xIndex = Math.floor(Math.random() * xZones.length);
                const yIndex = Math.floor(Math.random() * yFloors.length);

                gridDataMap[xIndex][yIndex] = Math.max(
                  gridDataMap[xIndex][yIndex],
                  crack.severity,
                );
                floorStats[yFloors[yIndex]]++;
              });
            });
        }
      }

      // 如果没有任何真实数据，造两点假数据防止图表空虚
      if (realDefectCount === 0) {
        gridDataMap[0][0] = 3;
        if (yFloors.length > 1 && xZones.length > 1) gridDataMap[1][1] = 5;
        floorStats[yFloors[0]] += 1;
        severityStats.moderate = 1;
        severityStats.severe = 1;
      }

      // 拼装热力图数据
      let gridData = [];
      for (let i = 0; i < xZones.length; i++) {
        for (let j = 0; j < yFloors.length; j++) {
          gridData.push([i, j, gridDataMap[i][j]]);
        }
      }

      this.drawCharts(floorStats, severityStats, gridData, xZones, yFloors);
    },

    drawCharts(floorStats, severityStats, gridData, xZones, yFloors) {
      const darkOpts = {
        textStyle: { color: "#94a3b8" },
        tooltip: {
          backgroundColor: "rgba(11, 19, 32, 0.9)",
          borderColor: "#00e5ff",
          textStyle: { color: "#fff" },
        },
      };

      // 柱状图
      this.barChart.setOption({
        ...darkOpts,
        xAxis: { type: "category", data: Object.keys(floorStats) },
        yAxis: {
          type: "value",
          minInterval: 1,
          splitLine: { lineStyle: { color: "#1e293b" } },
        },
        series: [
          {
            type: "bar",
            barWidth: "40%",
            itemStyle: { color: "#00e5ff", borderRadius: [4, 4, 0, 0] },
            data: Object.values(floorStats),
          },
        ],
      });

      // 饼图
      this.pieChart.setOption({
        ...darkOpts,
        series: [
          {
            type: "pie",
            radius: ["40%", "70%"],
            label: { formatter: "{b}\n{c} 处", color: "#e2e8f0" },
            itemStyle: {
              borderRadius: 8,
              borderColor: "#050810",
              borderWidth: 2,
            },
            data: [
              {
                value: severityStats.severe,
                name: "严重 (红警)",
                itemStyle: { color: "#ef4444" },
              },
              {
                value: severityStats.moderate,
                name: "中度 (需关注)",
                itemStyle: { color: "#f59e0b" },
              },
              {
                value: severityStats.mild,
                name: "轻微 (可忽略)",
                itemStyle: { color: "#10b981" },
              },
            ],
          },
        ],
      });

      // 动态网格热力图
      this.gridHeatmapChart.setOption({
        tooltip: {
          position: "top",
          formatter: (p) => {
            const val = p.data[2];
            let status =
              val === 0
                ? "安全无异常"
                : val < 4
                  ? "发现中轻度裂纹"
                  : "⚠️ 存在严重结构病害";
            return `${yFloors[p.data[1]]} - ${xZones[p.data[0]]}<br/>状态: ${status}`;
          },
          ...darkOpts.tooltip,
        },
        grid: { height: "70%", top: "10%", left: "8%", right: "5%" },
        xAxis: {
          type: "category",
          data: xZones,
          splitArea: {
            show: true,
            areaStyle: {
              color: ["rgba(0,229,255,0.02)", "rgba(0,229,255,0.05)"],
            },
          },
          axisLine: { lineStyle: { color: "#334155" } },
        },
        yAxis: {
          type: "category",
          data: yFloors,
          splitArea: {
            show: true,
            areaStyle: {
              color: ["rgba(0,229,255,0.02)", "rgba(0,229,255,0.05)"],
            },
          },
          axisLine: { lineStyle: { color: "#334155" } },
        },
        visualMap: {
          min: 0,
          max: 5,
          calculable: false,
          orient: "horizontal",
          left: "center",
          bottom: "0%",
          text: ["严重危险", "安全"],
          textStyle: { color: "#94a3b8" },
          inRange: {
            color: [
              "#0B1320",
              "#10b981",
              "#facc15",
              "#f59e0b",
              "#ef4444",
              "#9f1239",
            ],
          },
        },
        series: [
          {
            type: "heatmap",
            data: gridData,
            label: {
              show: true,
              formatter: (p) =>
                p.data[2] >= 4 ? "🚨" : p.data[2] > 0 ? "⚠️" : "",
              fontSize: 18,
            },
            itemStyle: { borderColor: "#050810", borderWidth: 2 },
          },
        ],
      });
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
.cyber-card {
  background: #0b1320;
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 6px;
}
:deep(.cyber-card .el-card__header) {
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  color: #00e5ff;
  font-weight: bold;
}
:deep(.el-form-item__label) {
  color: #00e5ff;
}
:deep(.cyber-input .el-input__wrapper),
:deep(.el-textarea__inner) {
  background: #050810;
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.2) inset;
  color: #00e5ff;
}
:deep(.cyber-dialog) {
  background: #0b1320 !important;
  border: 1px solid rgba(0, 229, 255, 0.3);
}
:deep(.el-dialog__title) {
  color: #00e5ff;
  font-weight: bold;
}
.chart-box {
  height: 260px;
}
.grid-heatmap-box {
  height: 420px;
}
</style>

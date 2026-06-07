<template>
  <div class="page-container cyber-theme">
    <el-form :inline="true" class="filter-bar cyber-card">
      <el-form-item label="按账号搜索">
        <el-input
          v-model="searchUser"
          placeholder="输入操作员账号"
          class="cyber-input"
        />
      </el-form-item>
      <el-form-item>
        <el-button color="#00e5ff" style="color: #050810; font-weight: bold"
          >搜索日志</el-button
        >
        <el-button
          type="info"
          plain
          style="border-color: #00e5ff; color: #00e5ff"
          @click="exportExcel"
          >导出Excel</el-button
        >
      </el-form-item>
    </el-form>

    <el-table :data="filteredLogs" border height="600" class="cyber-table">
      <el-table-column prop="time" label="操作时间" width="220" />
      <el-table-column prop="task_id" label="关联任务" width="150" />
      <el-table-column prop="event" label="操作内容" />
      <el-table-column prop="operator" label="操作员" width="150">
        <template #default="scope">
          <el-tag
            color="#0B1320"
            style="border-color: #00e5ff; color: #00e5ff"
            >{{ scope.row.operator }}</el-tag
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return { logs: [], searchUser: "", timer: null };
  },
  computed: {
    filteredLogs() {
      return this.logs.filter(
        (log) => log.operator?.includes(this.searchUser) || !this.searchUser,
      );
    },
  },
  mounted() {
    this.fetchLogs();
    this.timer = setInterval(this.fetchLogs, 2000); // 加快刷新率以观察实时日志
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    async fetchLogs() {
      try {
        // 1. 拿取你原本数据库里的日志
        const res = await fetch("http://localhost:3000/logs").catch(() => ({
          json: () => [],
        }));
        let serverLogs = await res.json();

        // 🚩 2. 联动核心：拿取我们在 PiControl 控制小车产生的全局实时指令！
        const localLogs = JSON.parse(
          localStorage.getItem("global_system_logs") || "[]",
        );

        this.logs = [...localLogs, ...serverLogs].sort(
          (a, b) => new Date(b.time) - new Date(a.time),
        ); // 最新在上面
      } catch (e) {}
    },
    exportExcel() {
      /* 原有导出逻辑 */
    },
  },
};
</script>

<style scoped>
.cyber-theme {
  padding: 20px;
  background-color: #050810;
  min-height: 100vh;
}
.cyber-card {
  background: #0b1320;
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}
:deep(.el-form-item__label) {
  color: #00e5ff;
}

/* 表格赛博朋克化 */
.cyber-table {
  --el-table-border-color: rgba(0, 229, 255, 0.1);
  background-color: transparent;
}
:deep(.el-table),
:deep(.el-table tr),
:deep(.el-table th.el-table__cell) {
  background-color: #0b1320 !important;
  color: #e2e8f0;
  border-color: rgba(0, 229, 255, 0.1) !important;
}
:deep(.el-table--border .el-table__cell) {
  border-right-color: rgba(0, 229, 255, 0.1) !important;
}
:deep(.el-table td.el-table__cell) {
  border-bottom-color: rgba(0, 229, 255, 0.1) !important;
}
:deep(.el-table tbody tr:hover > td) {
  background-color: rgba(0, 229, 255, 0.05) !important;
}

/* 输入框定制 */
:deep(.cyber-input .el-input__wrapper) {
  background: #050810;
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.2) inset;
}
:deep(.cyber-input .el-input__inner) {
  color: #00e5ff;
}
</style>

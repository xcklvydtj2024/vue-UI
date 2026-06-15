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
        <el-button
          type="primary"
          plain
          style="border-color: #00e5ff; color: #00e5ff; margin-left: 10px;"
          @click="printLogPage"
          >打印日志</el-button
        >
      </el-form-item>
    </el-form>

    <div id="print-area">
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
        const res = await fetch("http://localhost:3000/logs").catch(() => ({
          json: () => [],
        }));
        let serverLogs = await res.json();

        const localLogs = JSON.parse(
          localStorage.getItem("global_system_logs") || "[]",
        );

        this.logs = [...localLogs, ...serverLogs].sort(
          (a, b) => new Date(b.time) - new Date(a.time),
        );
      } catch (e) {}
    },
    // 🌟 纯前端导出 CSV (Excel 可直接打开)
    exportExcel() {
      if (!this.filteredLogs.length) {
        this.$message.warning("暂无数据可导出");
        return;
      }
      
      // 组装 CSV 表头与内容
      let csvContent = "\uFEFF操作时间,关联任务,操作内容,操作员\r\n";
      this.filteredLogs.forEach(row => {
        csvContent += `"${row.time || ''}","${row.task_id || ''}","${row.event || ''}","${row.operator || ''}"\r\n`;
      });

      // 创建 Blob 和下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `巡检系统操作日志_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    // 🌟 纯前端调用浏览器打印
    printLogPage() {
      window.print();
    }
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

/* 🌟 优化打印样式：打印时隐藏表单操作栏，仅保留表格展示 */
@media print {
  body * {
    visibility: hidden;
  }
  #print-area, #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .cyber-card, .filter-bar {
    display: none !important;
  }
}
</style>

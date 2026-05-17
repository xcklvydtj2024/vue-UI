<template>
  <div class="page-container">

    <!-- 搜索栏 -->
    <el-form :inline="true" class="filter-bar">
      <el-form-item label="按账号搜索">
        <el-input v-model="searchUser" placeholder="输入操作员账号" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="applyFilter">搜索日志</el-button>
        <el-button type="info" @click="exportExcel">导出Excel</el-button>
      </el-form-item>
    </el-form>

    <!-- 日志表格 -->
    <el-table :data="filteredLogs" border height="500">
      <el-table-column prop="time" label="操作时间" width="200" />
      <el-table-column prop="event" label="操作内容" />
      <el-table-column prop="operator" label="操作员" width="120" />
    </el-table>

  </div>
</template>

<script>
export default {
  data() {
    return {
      logs: [],
      searchUser: "",
      timer: null
    }
  },

  computed: {
    filteredLogs() {
      return this.logs.filter(log =>
        log.operator?.includes(this.searchUser)
      )
    }
  },

  mounted() {
    this.fetchLogs()

    // ⭐ 自动刷新日志（每 3 秒）
    this.timer = setInterval(() => {
      this.fetchLogs()
    }, 3000)
  },

  beforeUnmount() {
    clearInterval(this.timer)
  },

  methods: {
    async fetchLogs() {
      const taskId = this.$route.query.task_id
      let url = "http://localhost:3000/logs"

      if (taskId) {
        url += `?task_id=${taskId}`
      }

      const res = await fetch(url)
      this.logs = await res.json()
    },

    applyFilter() {
      // 只是触发 computed 重新计算
    },

    exportExcel() {
      const headers = ["操作时间", "操作内容", "操作员"]

      const rows = this.filteredLogs.map(log => [
        log.time,
        log.event,
        log.operator
      ])

      let csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...rows].map(e => e.join(",")).join("\n")

      const link = document.createElement("a")
      link.href = encodeURI(csvContent)
      link.download = "logs.csv"
      link.click()
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.filter-bar {
  margin-bottom: 20px;
}
</style>

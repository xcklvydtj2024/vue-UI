<template>
  <el-container class="dashboard-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="system-name">裂纹智能巡检系统 - 管理员后台</div>
      <el-menu mode="horizontal" background-color="#B3C0D1" text-color="#333" active-text-color="#409eff">
        <el-menu-item index="1">个人信息</el-menu-item>
        <el-menu-item index="2"@click="$router.push('/')">安全退出</el-menu-item>
      </el-menu>
    </el-header>

    <el-container>
      <!-- 左侧侧边栏 -->
      <el-aside width="200px" class="aside">
        <el-menu router default-active="/admin-dashboard/overview" class="el-menu-vertical">
          <el-menu-item index="/admin-dashboard/overview">系统总览</el-menu-item>
          <el-menu-item index="/admin-dashboard/task-manager">任务管理</el-menu-item>
          <el-menu-item index="/admin-dashboard/user-manager">用户管理</el-menu-item>
          <el-menu-item index="/admin-dashboard/data-analysis">数据分析</el-menu-item>
          <el-menu-item index="/admin-dashboard/log-record">日志记录</el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区：渲染子页面 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: "AdminDashboard"
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #B3C0D1;
  color: #333;
  line-height: 60px;
}
.system-name {
  font-size: 20px;
  font-weight: bold;
}
.aside {
  background-color: #D3DCE6;
  color: #333;
}
.main-content {
  background-color: #E9EEF3;
  padding: 20px;
}
</style>

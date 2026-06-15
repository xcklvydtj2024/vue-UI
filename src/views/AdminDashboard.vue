<template>
  <el-container class="dashboard-container cyber-theme">
    <el-header class="header">
      <div class="system-name">
        <span class="logo-icon">💠</span>
        裂纹智能巡检系统 <span class="sys-badge">ADMIN_OS</span>
      </div>
      <el-menu
        mode="horizontal"
        background-color="#0B1320"
        text-color="#94a3b8"
        active-text-color="#00e5ff"
        class="top-menu"
      >
        <el-menu-item index="1">个人信息</el-menu-item>
        <el-menu-item index="2" @click="$router.push('/')"
          >安全退出</el-menu-item
        >
      </el-menu>
    </el-header>

    <el-container class="main-wrapper">
      <el-aside width="220px" class="aside">
        <el-menu
          router
          default-active="/admin-dashboard/pi-control"
          class="el-menu-vertical"
          background-color="#0B1320"
          text-color="#94a3b8"
          active-text-color="#00e5ff"
        >
          
          <el-menu-item index="/admin-dashboard/task-manager">
            <i class="el-icon-document"></i> 任务管理
          </el-menu-item>

          <el-menu-item index="/admin-dashboard/pi-control">
            <i class="el-icon-monitor"></i> 小车实时控制
          </el-menu-item>

          <el-menu-item index="/admin-dashboard/user-manager">
            <i class="el-icon-user"></i> 用户管理
          </el-menu-item>
          <el-menu-item index="/admin-dashboard/data-analysis">
            <i class="el-icon-pie-chart"></i> 数据分析
          </el-menu-item>
          <el-menu-item index="/admin-dashboard/log-record">
            <i class="el-icon-notebook-2"></i> 日志记录
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: "AdminDashboard",
};
</script>

<style scoped>
/* 全局暗黑背景 */
.dashboard-container {
  height: 100vh;
  background-color: #050810; /* 最深的背景色，和小车页面完全一致 */
}

/* 顶部 Header 定制 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0b1320; /* 深空蓝 */
  border-bottom: 1px solid rgba(0, 229, 255, 0.15); /* 底部科技感青色发光边框 */
  color: #e2e8f0;
  line-height: 60px;
  padding: 0 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

/* 左上角系统名称发光效果 */
.system-name {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  color: #00e5ff;
  font-size: 22px;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
}
.sys-badge {
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid #00e5ff;
  color: #00e5ff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  line-height: 1;
}

/* 去除 Element UI 顶部菜单自带的底边框 */
.top-menu.el-menu--horizontal {
  border-bottom: none;
}

/* 左侧 Aside 定制 */
.main-wrapper {
  height: calc(100vh - 60px);
}
.aside {
  background-color: #0b1320;
  border-right: 1px solid rgba(0, 229, 255, 0.1); /* 右侧科技感边框 */
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  z-index: 5;
}

/* 优化侧边栏菜单样式 */
.el-menu-vertical {
  border-right: none; /* 去除自带右边框 */
}
.el-menu-vertical .el-menu-item {
  transition: all 0.3s;
  border-left: 3px solid transparent;
}
/* 鼠标悬停和激活状态的高亮特效 */
.el-menu-vertical .el-menu-item:hover,
.el-menu-vertical .el-menu-item.is-active {
  background-color: rgba(0, 229, 255, 0.05) !important;
  border-left: 3px solid #00e5ff; /* 左侧青色指示条 */
  box-shadow: inset 20px 0 20px -20px rgba(0, 229, 255, 0.3);
}
.el-menu-vertical .el-menu-item i {
  color: inherit; /* 让图标颜色和文字颜色同步变化 */
  margin-right: 10px;
}

/* 主内容区 */
.main-content {
  background-color: #050810; /* 与 PiControl 背景无缝融合 */
  padding: 0; /* 取消原有的 20px 内边距，让小车控制台填满屏幕 */
  overflow: hidden;
}
/* ==========================================
   🖨️ 全局打印专属 CSS (隐藏侧边栏和顶部导航)
   ========================================== */
@media print {
  /* 隐藏顶部头和左侧菜单 */
  .header, .aside {
    display: none !important;
  }
  
  /* 解除主内容区的布局限制，让报告填满整张 A4 纸 */
  .dashboard-container, .main-wrapper, .main-content {
    height: auto !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #ffffff !important;
  }
}
</style>

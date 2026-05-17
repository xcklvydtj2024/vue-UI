<template>
  <el-container style="height: 100vh">
    <!-- 左侧导航 -->
    <el-aside width="200px">
      <el-menu router>
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/tasks">巡检任务</el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧整体 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header>Header</el-header>

      <!-- 内容区域 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
// 暂时不需要逻辑
</script>

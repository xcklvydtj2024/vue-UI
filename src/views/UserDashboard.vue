<template>
  <el-container class="user-layout">
    <!-- 顶部导航栏 -->
    <el-header class="user-header">
      <div class="logo">裂纹智能巡检系统 - 巡检员工作台</div>
      <div class="user-info">
        <span>欢迎您，{{ userProfile.name }}</span>
        <el-button type="text" @click="handleLogout" style="margin-left: 20px; color: #fff;">退出登录</el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 左侧侧边栏：导航菜单 -->
      <el-aside width="200px" class="user-aside">
        <el-menu :default-active="activeMenu" @select="handleMenuSelect">
          <el-menu-item index="tasks">
            <i class="el-icon-s-claim"></i>
            <template #title>任务列表</template>
          </el-menu-item>
          <el-menu-item index="profile">
            <i class="el-icon-user"></i>
            <template #title>个人信息</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主要内容区 -->
      <el-main class="user-main">
        
        <!-- 视图一：任务列表 (el-table) -->
        <div v-if="activeMenu === 'tasks'">
          <el-card shadow="never">
            <template #header>我的巡检任务</template>
            <el-table :data="tasks" style="width: 100%">
              <el-table-column prop="id" label="编号" width="80"></el-table-column>
              <el-table-column prop="location" label="巡检位置"></el-table-column>
              <el-table-column prop="time" label="计划时间" width="180"></el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="mini" @click="viewTaskDetail(scope.row)">详情</el-button>
                  <el-button size="mini" type="primary" @click="openUpload(scope.row)">上报</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 视图二：个人信息修改 (el-form) -->
        <div v-else-if="activeMenu === 'profile'">
          <el-card shadow="never" style="max-width: 600px; margin: 0 auto;">
            <template #header>修改个人信息</template>
            <el-form :model="userProfile" label-width="100px">
              <el-form-item label="姓名">
                <el-input v-model="userProfile.name"></el-input>
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="userProfile.phone"></el-input>
              </el-form-item>
              <el-form-item label="所属班组">
                <el-input v-model="userProfile.team" disabled></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updateProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>

      </el-main>
    </el-container>

    <!-- 任务详情与上传弹窗 (el-dialog) -->
    <el-dialog title="巡检结果上报" v-model="uploadVisible" width="500px">
      <div v-if="selectedTask" style="margin-bottom: 20px;">
        <p><strong>位置：</strong>{{ selectedTask.location }}</p>
        <p><strong>要求：</strong>{{ selectedTask.requirements }}</p>
      </div>
      
      <!-- 文件上传组件 (el-upload) -->
      <el-upload
        class="upload-area"
        action="https://jsonplaceholder.typicode.com/posts/"
        list-type="picture-card"
        :on-success="handleUploadSuccess"
        :limit="3"
      >
        <i class="el-icon-plus"></i>
        <template #tip>
          <div class="el-upload__tip">请上传裂纹实拍照片，最多3张 [4, 7]</div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">确认提交</el-button>
      </template>
    </el-dialog>

  </el-container>
</template>

<script>
export default {
  data() {
    return {
      activeMenu: 'tasks',
      uploadVisible: false,
      selectedTask: null,
      userProfile: {
        name: 'abc',
        phone: '13800138000',
        team: '裂纹检测一组'
      },
      tasks: [
        { id: '001', location: '1号桥墩北侧', time: '2026-05-08 09:00', requirements: '需高清扫描裂纹深度', status: '待处理' },
        { id: '002', location: '2号隧道入口', time: '2026-05-08 14:00', requirements: '检查防水层渗漏情况', status: '待处理' }
      ]
    }
  },
  methods: {
    handleMenuSelect(index) {
      this.activeMenu = index;
    },
    viewTaskDetail(row) {
      this.$alert(row.requirements, `任务详情 - ${row.location}`, { confirmButtonText: '确定' });
    },
    openUpload(row) {
      this.selectedTask = row;
      this.uploadVisible = true;
    },
    handleUploadSuccess(res, file) {
      this.$message.success('图片上传预览成功'); // [8]
    },
    updateProfile() {
      this.$message.success('个人信息更新成功');
    },
    submitReport() {
      this.$message({ message: '巡检数据已提交审核', type: 'success' });
      this.uploadVisible = false;
    },
    handleLogout() {
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.user-layout { height: 100vh; background: #f0f2f5; }
.user-header { 
  background: #409EFF; color: white; 
  display: flex; justify-content: space-between; align-items: center; 
}
.user-aside { background: #fff; border-right: 1px solid #e6e6e6; }
.user-main { padding: 20px; }
.upload-area { text-align: center; }
</style>
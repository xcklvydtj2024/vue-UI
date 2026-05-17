<template>
  <div class="login-wrapper">
    <!-- 使用 el-card 作为登录容器 [6] -->
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>裂纹智能巡检系统登录</span>
        </div>
      </template>

      <!-- el-form 表单组件 [2] -->
      <el-form :model="loginForm" label-width="80px">
        
        <!-- 账号输入框 [3] -->
        <el-form-item label="账号">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入账号"
            prefix-icon="el-icon-user" 
          ></el-input>
        </el-form-item>

        <!-- 密码输入框，使用 show-password 开启切换显示功能 [4] -->
        <el-form-item label="密码">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            show-password 
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
          ></el-input>
        </el-form-item>

        <!-- 角色选择框 [7] -->
        <el-form-item label="角色">
          <el-select v-model="loginForm.role" placeholder="请选择登录角色" style="width: 100%">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>

        <!-- 登录按钮 [8] -->
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%">
            登录系统
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 引入消息提示组件（按需引用方式示例）[9]
import { ElMessage } from 'element-plus'

export default {
  data() {
    return {
      // 响应式表单数据对象 [1, 10]
      loginForm: {
        username: '',
        password: '',
        role: ''
      }
    }
  },
  methods: {
    handleLogin() {
      const { username, password, role } = this.loginForm;

      // 1. 基础非空校验
      if (!username || !password || !role) {
        ElMessage.warning('请完整填写账号、密码并选择角色'); // [5]
        return;
      }

      // 2. 根据账号、密码和角色执行逻辑判断
      if (role === 'admin') {
        if (username === '123' && password === '456') {
          ElMessage.success('管理员登录成功，正在跳转...'); // [11]
          // 跳转至管理员看板
          this.$router.push('/admin-dashboard');
        } else {
          ElMessage.error('管理员账号或密码错误'); // [11]
        }
      } 
      else if (role === 'user') {
        if (username === 'abc' && password === '123') {
          ElMessage.success('用户登录成功，欢迎回来');
          // 跳转至普通用户看板
          this.$router.push('/user-dashboard');
        } else {
          ElMessage.error('用户账号或密码错误');
        }
      }
    }
  }
}
</script>

<style scoped>
/* 登录页面布局样式 */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 此处可替换为真实的裂纹巡检系统背景图 */
  background-color: #f5f7fa; 
}
.login-card {
  width: 400px;
}
.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff; /* Element Plus 主题色 [12] */
}
</style>
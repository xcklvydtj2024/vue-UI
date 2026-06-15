import { createRouter, createWebHistory } from 'vue-router'

// 登录与主界面
import Login from '../views/Login.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import UserDashboard from '../views/UserDashboard.vue'

// 子页面
import Dashboard from '../views/Dashboard.vue'       // 系统总览
import TaskManager from '../views/TaskManager.vue'   // 任务管理
import UserManager from '../views/UserManager.vue'   // 用户管理
import DataAnalysis from '../views/DataAnalysis.vue' // 数据分析
import LogRecord from '../views/LogRecord.vue'       // 日志记录
import TaskDetail from '../views/TaskDetail.vue'     // 任务详情
// 🟢 1. 在这里引入你的树莓派控制台组件
import PiControl from '../views/PiControl.vue'       

const routes = [
  // 登录页
  { path: '/', name: 'Login', component: Login },

  // 用户端
  { path: '/user-dashboard', name: 'UserDashboard', component: UserDashboard },

  // 管理员端
  {
    path: '/admin-dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    redirect: '/admin-dashboard/task-manager',
    children: [
      
      { path: 'task-manager', name: 'TaskManager', component: TaskManager },
      { path: 'user-manager', name: 'UserManager', component: UserManager },
      { path: 'data-analysis', name: 'DataAnalysis', component: DataAnalysis },
      { path: 'log-record', name: 'LogRecord', component: LogRecord },
      
      // 🟢 2. 在这里添加小车控制台路由
      // 访问路径将会是: /admin-dashboard/pi-control
      { path: 'pi-control', name: 'PiControl', component: PiControl },

      // ⭐ 核心：任务详情路由，带 name
      { path: 'task/:id', name: 'TaskDetail', component: TaskDetail }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router


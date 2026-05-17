<template>
  <div class="page-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreateDialog">新建任务</el-button>
      <span class="current-user">当前操作员：{{ currentUser }}</span>
    </div>

    <!-- 任务表格 -->
    <el-table :data="tasks" border style="width: 100%" height="500">
      <el-table-column prop="task_code" label="任务编号" width="120" />
      <el-table-column prop="location" label="巡检位置" />
      <el-table-column prop="plan_time" label="计划时间" width="180" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="crack_count" label="裂缝数量" width="120" />
      <el-table-column label="操作" width="260">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEditDialog(scope.row)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">
            删除
          </el-button>
          <el-button
            size="small"
            type="info"
            @click="goToLogs(scope.row)"
          >
            查看日志
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建 / 编辑任务弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新建任务'"
      width="500px"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="任务编号">
          <el-input v-model="form.task_code" />
        </el-form-item>
        <el-form-item label="巡检位置">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="计划时间">
          <el-input v-model="form.plan_time" placeholder="2026-05-10 10:00" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="待执行" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="done" />
          </el-select>
        </el-form-item>
        <el-form-item label="裂缝数量">
          <el-input v-model.number="form.crack_count" type="number" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

// ⭐ 当前操作员（审计用）——后面可以接登录系统动态赋值
const currentUser = ref("admin")

// 任务列表
const tasks = ref([])

// 弹窗 & 表单
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  task_code: "",
  location: "",
  plan_time: "",
  status: "pending",
  crack_count: 0
})

// ===================== 通用工具函数 =====================

// 写日志（审计核心）
async function writeLog(taskId, event) {
  await fetch("http://localhost:3000/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task_id: taskId,
      time: new Date().toISOString().slice(0, 19).replace("T", " "),
      operator: currentUser.value,
      event
    })
  })
}

// 拉取任务列表
async function fetchTasks() {
  const res = await fetch("http://localhost:3000/tasks")
  tasks.value = await res.json()
}

// ===================== 任务操作 =====================

// 打开新建弹窗
function openCreateDialog() {
  isEdit.value = false
  form.value = {
    id: null,
    task_code: "",
    location: "",
    plan_time: "",
    status: "pending",
    crack_count: 0
  }
  dialogVisible.value = true
}

// 打开编辑弹窗
function openEditDialog(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

// 提交（新建 or 编辑）
async function handleSubmit() {
  if (isEdit.value) {
    await updateTask()
  } else {
    await createTask()
  }
  dialogVisible.value = false
  await fetchTasks()
}

// 创建任务 + 自动写日志
async function createTask() {
  const res = await fetch("http://localhost:3000/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form.value)
  })
  const created = await res.json()

  // ⭐ 审计日志：谁创建了什么任务
  await writeLog(created.id, `创建任务：${created.task_code}`)
}

// 更新任务 + 自动写日志
async function updateTask() {
  await fetch(`http://localhost:3000/tasks/${form.value.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form.value)
  })

  // ⭐ 审计日志：谁修改了什么任务
  await writeLog(form.value.id, `修改任务：${form.value.task_code}`)
}

// 删除任务 + 自动写日志
async function handleDelete(row) {
  await fetch(`http://localhost:3000/tasks/${row.id}`, {
    method: "DELETE"
  })

  // ⭐ 审计日志：谁删除了什么任务
  await writeLog(row.id, `删除任务：${row.task_code}`)

  await fetchTasks()
}

// 跳转到日志页面（任务联动）
function goToLogs(row) {
  router.push({
    path: "/admin-dashboard/log-record",
    query: { task_id: row.id }
  })
}

// 初始化
onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.current-user {
  font-size: 14px;
  color: #666;
}
</style>

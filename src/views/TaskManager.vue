<template>
  <div class="task-manager">
    <!-- 顶部操作栏 -->
    <div class="header-actions" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <el-button type="primary" icon="el-icon-plus" @click="openCreate">新建巡检任务</el-button>
        <el-button icon="el-icon-refresh" @click="fetchTasks(true)">手动刷新</el-button>
      </div>
      <el-tag type="info">系统状态：{{ isPolling ? '实时同步中' : '自动刷新已停止' }}</el-tag>
    </div>

    <!-- 任务表格：增加 v-loading 提升加载体验 [1] -->
    <el-table :data="tasks" border v-loading="loading" style="width: 100%">
      <el-table-column prop="task_code" label="任务编号" width="140" />
      <el-table-column prop="location" label="巡检位置" />
      <el-table-column prop="scheduled_time" label="计划时间" width="180" />
      
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="statusMap[scope.row.status].tag" effect="dark">
            {{ statusMap[scope.row.status].text }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="管理操作" width="280">
        <template #default="scope">
          <!-- 分配逻辑 -->
          <el-button 
            size="mini" 
            type="success" 
            :disabled="scope.row.status !== 'pending'"
            @click="handleAllocate(scope.row)"
          >分配</el-button>

          <el-button size="mini" @click="goDetails(scope.row.id)">结果</el-button>
          <el-button size="mini" type="info" @click="openEdit(scope.row)">编辑</el-button>

          <!-- 气泡确认删除 [2, 3] -->
          <el-popconfirm title="确定彻底删除此任务吗？" @confirm="handleDelete(scope.row.id)">
            <template #reference>
              <el-button size="mini" type="danger" style="margin-left: 10px">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 任务表单弹窗 [4, 5] -->
    <el-dialog :title="isEdit ? '编辑任务' : '新建任务'" v-model="dialogVisible" width="500px">
      <el-form :model="taskForm" :rules="formRules" ref="taskFormRef" label-width="100px">
        <el-form-item label="任务编号" prop="task_code">
          <el-input v-model="taskForm.task_code" :disabled="isEdit" placeholder="T+日期+序号" />
        </el-form-item>
        <el-form-item label="巡检位置" prop="location">
          <el-input v-model="taskForm.location" />
        </el-form-item>
        <el-form-item label="计划时间" prop="scheduled_time">
          <el-date-picker 
            v-model="taskForm.scheduled_time" 
            type="datetime" 
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTask" :loading="submitLoading">提交保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { SERVER } from './config.js';
import { ElMessage, ElNotification } from 'element-plus'; [6, 7]

export default {
  data() {
    return {
      tasks: [],
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      isEdit: false,
      isPolling: true,
      refreshTimer: null, // 轮询定时器
      taskForm: { task_code: '', location: '', scheduled_time: '', status: 'pending' },
      statusMap: {
        pending: { text: '待分配', tag: 'info' },
        in_progress: { text: '巡检中', tag: 'warning' },
        done: { text: '已完成', tag: 'success' }
      },
      formRules: { // 表单验证 [8, 9]
        task_code: [{ required: true, message: '请输入编号', trigger: 'blur' }],
        location: [{ required: true, message: '请填写位置', trigger: 'blur' }]
      }
    }
  },
  mounted() {
    this.fetchTasks();
    this.startPolling(); // 组件挂载时启动自动刷新
  },
  beforeUnmount() {
    this.stopPolling(); // 组件销毁前必须清除定时器 [10]
  },
  methods: {
    // 1. 强化的错误处理：获取列表 [11]
    async fetchTasks(isManual = false) {
      if (isManual) this.loading = true;
      try {
        const res = await fetch(`${SERVER}/tasks`);
        if (!res.ok) throw new Error("获取任务列表失败");
        this.tasks = await res.json();
        if (isManual) ElMessage.success("数据同步成功");
      } catch (error) {
        ElNotification.error({ title: '网络错误', message: error.message });
      } finally {
        this.loading = false;
      }
    },

    // 2. 自动刷新机制 (轮询)
    startPolling() {
      this.refreshTimer = setInterval(() => {
        this.fetchTasks();
      }, 5000); // 每 5 秒自动同步一次状态
    },
    stopPolling() {
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.isPolling = false;
    },

    // 3. 完整的 CRUD：提交新建或修改 [12, 13]
    async submitTask() {
      this.$refs.taskFormRef.validate(async (valid) => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          const method = this.isEdit ? 'PUT' : 'POST';
          const url = this.isEdit ? `${SERVER}/tasks/${this.taskForm.id}` : `${SERVER}/tasks`;
          
          await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.taskForm)
          });

          ElMessage.success(this.isEdit ? "更新成功" : "创建成功");
          this.dialogVisible = false;
          this.fetchTasks();
        } catch (e) {
          ElMessage.error("提交失败，请检查后端服务");
        } finally {
          this.submitLoading = false;
        }
      });
    },

    // 4. 分配逻辑增强：状态变更 + 日志上报
    async handleAllocate(row) {
      try {
        // 更新任务状态
        await fetch(`${SERVER}/tasks/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: 'in_progress' })
        });

        // 记录日志供详情页 [TaskDetail] 使用
        await fetch(`${SERVER}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: row.id,
            time: new Date().toLocaleString(),
            event: "管理员已指派任务，树莓派正在响应..."
          })
        });

        ElMessage({ message: "任务已成功下发", type: 'success' });
        this.fetchTasks();
      } catch (e) {
        ElMessage.error("分配请求超时");
      }
    },

    async handleDelete(id) {
      try {
        await fetch(`${SERVER}/tasks/${id}`, { method: 'DELETE' });
        ElMessage.warning("任务已从系统移除");
        this.fetchTasks();
      } catch (e) { ElMessage.error("删除失败"); }
    },

    // 辅助：打开对话框
    openCreate() {
      this.isEdit = false;
      this.taskForm = { task_code: '', location: '', scheduled_time: '', status: 'pending' };
      this.dialogVisible = true;
    },
    openEdit(row) {
      this.isEdit = true;
      this.taskForm = { ...row }; // 浅拷贝避免实时影响表格 [14]
      this.dialogVisible = true;
    },
    goDetails(id) {
      this.$router.push({ name: 'TaskDetail', params: { id } });
    }
  }
}
</script>
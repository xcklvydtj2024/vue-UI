<template>
  <div class="page-container cyber-theme">
    <div class="header-actions">
      <el-button
        type="primary"
        color="#00e5ff"
        style="color: #050810; font-weight: bold"
        @click="showCreateDialog = true"
      >
        <i class="el-icon-plus"></i> 新建巡检任务
      </el-button>
      <el-input
        v-model="searchKey"
        placeholder="搜索任务编号或位置..."
        class="cyber-input"
        style="width: 250px"
      />
    </div>

    <el-table :data="filteredTasks" border height="600" class="cyber-table">
      <el-table-column prop="id" label="任务编号" width="180">
        <template #default="scope">
          <span
            class="text-accent"
            style="font-family: monospace; font-weight: bold"
            >{{ scope.row.id }}</span
          >
        </template>
      </el-table-column>
      <el-table-column prop="location" label="巡检目标位置" />
      <el-table-column prop="creator" label="下发人" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="status" label="任务状态" width="120">
        <template #default="scope">
          <el-tag
            :type="scope.row.status === 'pending' ? 'info' : 'success'"
            color="#0B1320"
            style="border-color: #00e5ff"
          >
            {{ scope.row.status === "pending" ? "待下发执行" : "执行中" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="控制台" width="150" align="center">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            plain
            @click="goToDetail(scope.row.id)"
            >查看档案</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showCreateDialog"
      title="📝 下达新巡检指令"
      width="500px"
      custom-class="cyber-dialog"
      append-to-body
    >
      <el-form :model="newTask" label-width="90px">
        <el-form-item label="巡检位置">
          <el-input
            v-model="newTask.location"
            placeholder="例如：跨海大桥南侧底座A区"
          ></el-input>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input
            v-model="newTask.creator"
            placeholder="输入操作员姓名"
            disabled
          ></el-input>
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input
            type="textarea"
            v-model="newTask.desc"
            placeholder="输入本次巡检的重点目标..."
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false" plain>取 消</el-button>
        <el-button
          type="primary"
          @click="createTask"
          color="#00e5ff"
          style="color: #050810; font-weight: bold"
        >
          立 即 建 立
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const searchKey = ref("");
const tasks = ref([]);
const showCreateDialog = ref(false);

const newTask = ref({
  location: "",
  creator: "Admin_Pilot", // 默认当前账号
  desc: "",
});

// 1. 初始化时读取本地任务库
onMounted(() => {
  const localTasks = JSON.parse(localStorage.getItem("system_tasks") || "[]");
  if (localTasks.length === 0) {
    // 塞入几个默认数据兜底
    localTasks.push(
      {
        id: "TSK-2026001",
        location: "跨海大桥底座巡检",
        creator: "System",
        createTime: new Date().toLocaleString(),
        status: "pending",
      },
      {
        id: "TSK-2026002",
        location: "隧道A区渗水排查",
        creator: "System",
        createTime: new Date().toLocaleString(),
        status: "pending",
      },
    );
    localStorage.setItem("system_tasks", JSON.stringify(localTasks));
  }
  tasks.value = localTasks;
});

// 2. 搜索过滤
const filteredTasks = computed(() => {
  return tasks.value.filter(
    (t) =>
      t.id.includes(searchKey.value) || t.location.includes(searchKey.value),
  );
});

// 3. 核心：建立新任务
const createTask = () => {
  if (!newTask.value.location) {
    ElMessage.warning("巡检位置不能为空！");
    return;
  }

  // 生成任务流水号
  const taskId = "TSK-" + Date.now().toString().slice(-6);
  const taskObj = {
    id: taskId,
    location: newTask.value.location,
    creator: newTask.value.creator,
    desc: newTask.value.desc,
    createTime: new Date().toLocaleString(),
    status: "pending",
  };

  tasks.value.unshift(taskObj); // 放到最前面
  localStorage.setItem("system_tasks", JSON.stringify(tasks.value)); // 存入数据库

  ElMessage.success(`任务 ${taskId} 建立成功！请前往小车控制台下发执行。`);
  showCreateDialog.value = false;
  newTask.value.location = "";
  newTask.value.desc = "";
};

// 4. 跳转详情页
const goToDetail = (id) => {
  router.push(`/admin-dashboard/task/${id}`);
};
</script>

<style scoped>
.cyber-theme {
  padding: 20px;
  background-color: #050810;
  min-height: 100vh;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
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
.text-accent {
  color: #00e5ff;
}

/* 弹窗定制 */
:deep(.cyber-dialog) {
  background: #0b1320 !important;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.1);
}
:deep(.el-dialog__title) {
  color: #00e5ff;
  font-weight: bold;
  letter-spacing: 1px;
}
:deep(.el-form-item__label) {
  color: #94a3b8;
}
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: #050810;
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.2) inset;
  color: #e2e8f0;
}
</style>

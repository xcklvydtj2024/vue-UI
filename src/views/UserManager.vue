<template>
  <div class="page-container">
    <div class="action-header">
      <el-button type="success" @click="addVisible = true">添加用户账号</el-button>
    </div>

    <el-table :data="users" border>
      <el-table-column prop="account" label="账号" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">{{ scope.row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" type="danger" @click="removeUser(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗：添加用户 -->
    <el-dialog title="新增系统用户" v-model="addVisible">
      <el-form :model="newUser" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="newUser.account" />
        </el-form-item>
        <el-form-item label="初始角色">
          <el-select v-model="newUser.role" placeholder="请选择角色" style="width:100%">
            <el-option label="管理员" value="admin" />
            <el-option label="巡检员" value="user" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddUser">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [],
      addVisible: false,
      newUser: {
        account: '',
        role: ''
      }
    }
  },

  mounted() {
    this.fetchUsers()
  },

  methods: {
    async fetchUsers() {
      const res = await fetch("http://localhost:3000/users")
      this.users = await res.json()
    },

    async submitAddUser() {
      await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...this.newUser,
          status: "正常"
        })
      })

      this.addVisible = false
      this.fetchUsers()
    },

    async removeUser(row) {
      await fetch(`http://localhost:3000/users/${row.id}`, {
        method: "DELETE"
      })
      this.fetchUsers()
    }
  }
}
</script>
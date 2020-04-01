<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图 -->
    <el-card>
      <el-row>
        <el-col><el-button type="primary" @click="dialogVisible = true">添加角色</el-button></el-col>
      </el-row>
    </el-card>

    <!-- 列表区域 -->
    <el-table :data="rolelist" border stripe>
      <!-- 展开 -->
      <el-table-column type="expand">
        <template slot-scope="scope">
          <el-row :class="['bdbottom', i1 === 0 ? 'bdtop' : '', 'vcenter']" v-for="(item1, i1) in scope.row.children" :key="item1.id">
            <!-- 渲染一级权限 -->
            <el-col :span="5">
              <el-tag @close="removeRightById(scope.row, item1.id)" closable>{{ item1.authName }}</el-tag>
              <i class="el-icon-caret-right"></i>
            </el-col>
            <!-- 渲染二级和三级权限 -->
            <el-col :span="19">
              <!-- 通过 for 循环 嵌套渲染二级权限 -->
              <el-row :class="[i2 === 0 ? '' : 'bdtop', 'vcenter']" v-for="(item2, i2) in item1.children" :key="item2.id">
                <el-col :span="6">
                  <el-tag @close="removeRightById(scope.row, item2.id)" type="success" closable>{{ item2.authName }}</el-tag>
                  <i class="el-icon-caret-right"></i>
                </el-col>
                <el-col :span="18">
                  <el-tag @close="removeRightById(scope.row, item3.id)" type="warning" v-for="item3 in item2.children" :key="item3.id" closable>{{ item3.authName }}</el-tag>
                </el-col>
              </el-row>
            </el-col>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column type="index"></el-table-column>
      <el-table-column label="角色名称" prop="roleName"></el-table-column>
      <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
      <el-table-column label="操作" width="400px">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="showEditDialog(scope.row.id)" icon="el-icon-edit">编辑</el-button>
          <el-button size="mini" type="danger" @click="removeRolesByid(scope.row.id)" icon="el-icon-delete">删除</el-button>
          <el-button @click="showSetRightDialog(scope.row)" size="mini" type="warning" icon="el-icon-setting">分配权限</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加角色窗口 -->
    <el-dialog title="添加角色" :visible.sync="dialogVisible">
      <el-form ref="addFormRef" :rules="addFormRules" :model="addForm" label-width="100px">
        <el-form-item label="角色名称" prop="roleName"><el-input v-model="addForm.roleName"></el-input></el-form-item>
        <el-form-item label="角色描述"><el-input v-model="addForm.roleDesc"></el-input></el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addRole">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="修改角色" :visible.sync="editDialogVisible">
      <el-form @click="editDialogClosed" ref="editFormRef" :rules="editFormRules" :model="editForm" label-width="100px">
        <el-form-item label="角色 ID"><el-input v-model="editForm.roleId" disabled></el-input></el-form-item>
        <el-form-item label="角色名称" prop="roleName"><el-input v-model="editForm.roleName"></el-input></el-form-item>
        <el-form-item label="角色描述"><el-input v-model="editForm.roleDesc"></el-input></el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editRole">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 分配权限 -->
    <el-dialog title="分配权限" :visible.sync="setRightDialogVisible" width="50%" @close="setRightDialogClosed">
      <el-tree ref="treeRef" :data="rightslist" :props="treeProps" show-checkbox node-key="id" default-expand-all :default-checked-keys="defKeys"></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="setRightDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="allotRights">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 所以角色的列表
      rolelist: [],
      dialogVisible: false,
      addForm: {
        roleName: '',
        roleDesc: ''
      },
      addFormRules: {
        roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }, { min: 2, max: 6, message: '用户名的长度在2~6个字符之间', trigger: 'blur' }]
      },
      editDialogVisible: false,
      editForm: {},
      editFormRules: {
        roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }, { min: 2, max: 6, message: '用户名的长度在2~6个字符之间', trigger: 'blur' }]
      },
      // 分配权限对话框
      setRightDialogVisible: false,
      rightslist: [],
      treeProps: {
        label: 'authName',
        children: 'children'
      },
      // 默认选中的节点
      defKeys: [],
      // 当前即将分配权限的角色id
      roleId: ''
    }
  },

  methods: {
    async getRoleList() {
      const { data: res } = await this.$http.get('roles')
      if (res.meta.status !== 200) {
        return this.$message.error('获取角色列表失败')
      }
      this.rolelist = res.data
    },
    addRole() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.post('roles', this.addForm)
        console.log(res)
        if (res.meta.status !== 201) {
          return this.$message.error('添加角色失败')
        }
        this.$message.success('添加角色成功！')
        this.getRoleList()
        this.dialogVisible = false
      })
    },
    async showEditDialog(id) {
      const { data: res } = await this.$http.get('roles/' + id)
      this.editForm = res.data
      this.editDialogVisible = true
    },
    editDialogClosed() {
      this.$refs.editFormRef.resetFields()
    },
    editRole() {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.put('roles/' + this.editForm.roleId, {
          roleName: this.editForm.roleName,
          roleDesc: this.editForm.roleDesc
        })
        console.log(res)
        if (res.meta.status !== 200) {
          this.$message.error('修改用户失败！')
        }
        this.$message.success('修改用户成功！')
        this.editDialogVisible = false
        this.getRoleList()
      })
    },
    async removeRolesByid(id) {
      const confirmResult = await this.$confirm('此操作将永久删除该角色, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('取消了删除！')
      }
      const { data: res } = await this.$http.delete('roles/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除角色失败')
      }
      this.$message.success('删除角色成功！')
      this.getRoleList()
    },
    // 删除权限
    async removeRightById(roles, rightId) {
      const confirmResuit = await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err)
      if (confirmResuit !== 'confirm') {
        return this.$message.error('取消了删除')
      }
      const { data: res } = await this.$http.delete(`roles/${roles.id}/rights/${rightId}`)
      if (res.meta.status !== 200) {
        return this.$message('删除用户失败')
      }
      roles.children = res.data
    },
    // 分配权限
    async showSetRightDialog(role) {
      this.roleId = role.id
      const { data: res } = await this.$http.get('rights/tree')
      if (res.meta.status !== 200) {
        return this.$message('获取权限数据失败')
      }
      this.rightslist = res.data
      console.log(this.rightslist)

      // 递归获取三级节点的Id
      this.getLeafKeys(role, this.defKeys)
      this.setRightDialogVisible = true
    },
    getLeafKeys(node, arr) {
      // 如果当前 node 节点不包含 children 属性，则是三级节点
      if (!node.children) {
        return arr.push(node.id)
      }
      node.children.forEach(item => this.getLeafKeys(item, arr))
    },
    // 监听分配权限对话框的关闭事件,清空数组
    setRightDialogClosed() {
      this.defKeys = []
    },
    // 点击为角色分配权限
    async allotRights() {
      const keys = [...this.$refs.treeRef.getCheckedKeys(), ...this.$refs.treeRef.getHalfCheckedKeys()]

      const idStr = keys.join(',')

      const { data: res } = await this.$http.post(`roles/${this.roleId}/rights`, { rids: idStr })

      if (res.meta.status !== 200) {
        return this.$message.error('分配权限失败！')
      }

      this.$message.success('分配权限成功！')
      this.getRoleList()
      this.setRightDialogVisible = false
    }
  },
  created() {
    this.getRoleList()
  }
}
</script>

<style lang="less" scoped>
.el-tag {
  margin: 7px;
}
.bdtop {
  border-top: 1px solid #eee;
}
.bdbottom {
  border-bottom: 1px solid #eee;
}
.vcenter {
  display: flex;
  align-items: center;
}
</style>

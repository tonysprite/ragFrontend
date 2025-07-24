<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { debounce } from 'lodash';

const roles = ref([])
const selectedRole = ref('')
const query = ref('')
const conversations = ref([]) // 存储多轮对话历史
const showRoleList = ref(false)
const cursorPosition = ref(0) // 记录光标位置
const filteredRoles = ref([]) // 过滤后的角色列表

const fetchRoles = async () => {
  try {
    const response = await axios.get('/roles', {
      headers: {
        'Accept': 'application/json'
      }
    })
    roles.value = response.data.roles
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const handleRoleSelect = (role) => {
  const queryText = query.value
  const beforeCursor = queryText.substring(0, cursorPosition.value)
  const afterCursor = queryText.substring(cursorPosition.value)
  
  // 替换@后面的内容为选中的角色
  const lastAtPos = beforeCursor.lastIndexOf('@')
  query.value = beforeCursor.substring(0, lastAtPos + 1) + role + afterCursor
  
  selectedRole.value = role
  showRoleList.value = false
  
  // 移动光标到角色名后面
  setTimeout(() => {
      const inputEl = document.querySelector('.query-input input')
      if (inputEl) {
        inputEl.focus()
        inputEl.setSelectionRange(lastAtPos + 1 + role.length, lastAtPos + 1 + role.length)
      }
    }, 0)
}

const handleKeyUp = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
    return
  }
  checkAtTrigger(e)
}

const checkAtTrigger = (e) => {
  const input = e.target
  cursorPosition.value = input.selectionStart
  
  const textBeforeCursor = query.value.substring(0, cursorPosition.value)
  const lastAtPos = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtPos >= 0 && (cursorPosition.value - lastAtPos === 1 || query.value.substring(lastAtPos + 1, cursorPosition.value).trim() === '')) {
    // 显示角色列表
    showRoleList.value = true
    filteredRoles.value = roles.value
  } else {
    // 根据输入过滤角色
    if (lastAtPos >= 0) {
      const searchText = query.value.substring(lastAtPos + 1, cursorPosition.value).toLowerCase()
      filteredRoles.value = roles.value.filter(role => 
        role.toLowerCase().includes(searchText))
      showRoleList.value = filteredRoles.value.length > 0
    } else {
      showRoleList.value = false
    }
  }
}

const handleInputClick = (e) => {
  cursorPosition.value = e.target.selectionStart
  checkAtTrigger(e)
}

const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  
  // 从输入框中提取@后面的角色名
  const atPos = query.value.lastIndexOf('@')
  if (atPos >= 0) {
    const afterAt = query.value.substring(atPos + 1)
    const spacePos = afterAt.indexOf(' ')
    const roleName = spacePos === -1 ? afterAt : afterAt.substring(0, spacePos)
    
    // 检查角色是否存在
    const roleExists = roles.value.includes(roleName)
    if (roleExists) {
      selectedRole.value = roleName
    } else {
      alert('请选择有效的角色')
      return
    }
  } else if (!selectedRole.value || !query.value.trim()) {
    alert('请@角色并输入有效的问题内容');
    return;
  }
  try {
    // 构建上下文内容
    const context = conversations.value.map(conv => `Q: ${conv.query}\nA: ${conv.answer}`).join('\n\n');
    const response = await axios.post('/query', {
      role: selectedRole.value,
      query: query.value.trim(),
      context: context
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    conversations.value.push({
      answer: response.data.answer,
      source: response.data.source,
      query: query.value,
      timestamp: new Date().toLocaleString()
    })
    query.value = '' // 清空输入框
  } catch (error) {
    console.error('提交问题失败:', error)
    alert('提交问题失败，请稍后重试')
  } finally {
    isSubmitting.value = false;
    selectedRole.value = null;
    query.value = '';
  }
}

onMounted(() => {
  fetchRoles()
})
// 在selectRole方法后添加
const handleKeydown = (e) => {
  if (showRoleList.value) {
    const items = document.querySelectorAll('.role-item');
    const active = document.activeElement;
    // 实现上下箭头选择逻辑
  }
}
// 在checkAtTrigger方法中添加
window.addEventListener('click', (e) => {
  if (!e.target.closest('.query-input')) {
    showRoleList.value = false;
  }
})
</script>

<template>
  <div class="qa-container">
    <div class="role-list" v-if="showRoleList">
      <div class="roles">
        <div
          v-for="role in filteredRoles"
          :key="role"
          class="role-item"
          @click="handleRoleSelect(role)"
        >
          {{ role }}
        </div>
      </div>
    </div>

    <div class="query-section">
      <div class="conversations-container">
        <div v-for="(conv, index) in conversations" :key="index" class="conversation-item">
          <div class="query-text">{{ conv.query }}</div>
          <div class="answer-text">{{ conv.answer }}</div>
          <div v-if="conv.source" class="source-text">来源：{{ conv.source }}</div>
          <div class="timestamp">{{ conv.timestamp }}</div>
        </div>
      </div>

      <div class="query-input">
        <textarea
           v-model="query"
           placeholder="请输入您的问题，使用@选择角色"
           @keyup.enter="handleSubmit"
           @keyup="handleKeyUp"
           @click="handleInputClick"
           ref="queryInput"
           style="width: 100%"
         ></textarea>
        <button @click="handleSubmit" :disabled="isSubmitting || !selectedRole || !query.trim()">
          提问
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qa-container {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

.role-list {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-height: 300px;
  overflow-y: auto;
  margin-top: 5px;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 20px;
}

.roles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.role-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.role-item:hover {
  background-color: #f0f0f0;
}

.role-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.role-item.selected {
  background-color: #646cff;
  color: white;
  border-color: #646cff;
}

.no-roles {
  text-align: center;
  color: #6c757d;
  padding: 20px;
}

.query-section {
  width: 100%;
  margin: 0 auto;
}

.query-input {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

button {
  padding: 12px 24px;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background-color: #535bf2;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.conversations-container {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.conversation-item {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.query-text {
  color: #646cff;
  font-weight: 500;
  margin-bottom: 10px;
}

.answer-text {
  color: #2c3e50;
  margin-bottom: 10px;
}

.source-text {
  color: #6c757d;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.timestamp {
  color: #999;
  font-size: 0.8em;
  text-align: right;
  margin-top: 20px;
}

@media (prefers-color-scheme: dark) {
  .role-item {
    background-color: #2c3e50;
    border-color: #34495e;
    color: #fff;
  }

  .role-item.selected {
    background-color: #646cff;
    border-color: #535bf2;
  }

  h2, .answer h3 {
    color: #fff;
  }

  .no-roles {
    color: #a8b2bc;
  }

  input {
    background-color: #2c3e50;
    border-color: #34495e;
    color: #fff;
  }

  .conversation-item {
    background-color: #2c3e50;
  }

  .answer-text {
    color: #fff;
  }

  .source {
    color: #a8b2bc;
    border-color: #34495e;
  }
}
</style>
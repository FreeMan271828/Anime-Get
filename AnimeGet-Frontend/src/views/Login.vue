<template>
  <div class="login-container dark:bg-gray-900 transition-colors duration-300">
    <form @submit.prevent="handleLogin" class="login-form dark:bg-gray-800 dark:shadow-gray-900/50 transition-colors duration-300">
      <h2 class="dark:text-gray-100">用户登录</h2>
      
      <!-- 错误信息提示 -->
      <div v-if="errorMessage" class="error-message dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
        {{ errorMessage }}
      </div>
      
      <div class="form-group">
        <label for="username" class="dark:text-gray-300">用户名</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          required 
          placeholder="请输入用户名"
          class="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
        />
      </div>
      
      <div class="form-group">
        <label for="password" class="dark:text-gray-300">密码</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required 
          placeholder="请输入密码"
          class="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
        />
      </div>
      
      <button type="submit" :disabled="isLoading" class="dark:bg-indigo-600 dark:hover:bg-indigo-500">
        {{ isLoading ? '登录中...' : '登 录' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // 1. 导入 useRouter
import apiClient from '@/api/axios';

const router = useRouter(); // 2. 获取 router 实例

// --- 响应式状态定义 (保持不变) ---
const username = ref('');
const password = ref('');
const errorMessage = ref(null);
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = null;
  isLoading.value = true;

  try {
    const response = await apiClient.post('/api/auth/login', {
      username: username.value,
      password: password.value,
    });

    const data = response.data;

    // --- 登录成功 ---
    localStorage.setItem('authToken', data.token);

    // 3. 使用 router 进行跳转，而不是刷新页面
    router.push({ name: 'all' }); // 跳转到名为 'all' 的路由

  } catch (error) {
    console.error('Login failed:', error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh; /* 使容器在视口中垂直居中 */
  background-color: #f4f4f9;
}

.login-form {
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* 确保 padding 不会影响宽度 */
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #4a90e2;
}

button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background-color: #4a90e2;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background-color: #357abd;
}

button:disabled {
  background-color: #a0c8f0;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}
</style>

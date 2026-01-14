<template>
  <header class="bg-white dark:bg-gray-800 dark:border-b dark:border-gray-700 shadow-sm h-16 flex items-center justify-between px-8 transition-colors duration-300">
    <div class="flex items-center space-x-4">
       <!-- 头像区域 -->
       <div class="relative w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-200 bg-gray-200">
         <img 
            :src="avatorUrl" 
            alt="avator" 
            class="object-cover w-full h-full" 
          />
       </div>
       <!-- 用户名 -->
       <span class="font-medium text-lg dark:text-gray-200">欢迎回来, {{ username }}</span>
    </div>
    
    <div class="flex items-center space-x-4">
      <ThemeToggle />
      <button @click="$emit('open-add')" class="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition shadow-md flex items-center">
        <span>+ 添加追番</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ThemeToggle from '../ThemeToggle.vue';
// 导入我们配置好的 Axios 实例，而不是全局的 axios
import apiClient from '@/api/axios'; // 确保路径正确

// 1. 响应式状态（无需改变）
const username = ref('');
const avatorUrl = ref(''); // 默认头像

// 2. 图片加载失败处理（无需改变）
const onImageError = (event) => {
  console.warn('avator image failed to load, falling back to default.');
  event.target.src = '/default-avator.svg';
};

// 3. 获取用户信息的异步函数 (*** 已修改 ***)
const fetchUserProfile = async () => {
  try {
    // 使用 apiClient 发送请求，它会自动附带 token
    // 将 URL 修改为正确的后端端点 '/api/user/me'
    const response = await apiClient.get('/api/user/profile'); 
    const user = response.data;
    // 更新状态
    username.value = user.username || 'Master';
    
    // 如果后端返回了有效的 avator_url，则更新它
    if (user.avator_url) {
      avatorUrl.value = user.avator_url;
    }
    console.log("user_avator: "+ user.avator_url);

  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    // 错误处理，例如 token 失效可以引导用户去登录页面
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Authentication failed, redirecting to login...');
    }
  }
};

// 4. 组件挂载后调用（无需改变）
onMounted(() => {
  fetchUserProfile();
});

defineEmits(['open-add']);
</script>

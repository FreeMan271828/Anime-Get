<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded shadow transition-colors duration-300">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-100">系统管理</h2>
    
    <!-- 1. 番剧类型配置 -->
    <div class="mb-8">
      <h3 class="font-medium mb-2 dark:text-gray-200">番剧类型配置 (数据库动态加载)</h3>
      
      <!-- 加载中提示 -->
      <div v-if="loading" class="text-gray-400 dark:text-gray-500 text-sm mb-2">加载中...</div>

      <!-- 类型列表 -->
      <div class="flex flex-wrap gap-2 mb-2">
        <span 
          v-for="t in types" 
          :key="t.id" 
          class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm flex items-center transition-colors"
        >
          {{ t.label }}
          <!-- 删除按钮 -->
          <button 
            @click="removeType(t.id)" 
            class="ml-2 text-indigo-400 dark:text-indigo-300 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors"
            title="删除此类型"
          >
            ×
          </button>
        </span>
      </div>

      <!-- 添加输入框 -->
      <div class="flex gap-2">
        <input 
          v-model="newType" 
          @keyup.enter="addType"
          placeholder="输入新类型 (如: 剧场版)" 
          class="border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 transition-colors" 
        />
        <button 
          @click="addType" 
          class="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          :disabled="!newType"
        >
          添加
        </button>
      </div>
    </div>

    <!-- 2. 头像上传测试 -->
    <div class="mb-8">
      <h3 class="font-medium mb-2 dark:text-gray-200">文件/头像上传</h3>
      <div class="flex items-center gap-4">
        <!-- 图片预览 -->
        <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 transition-colors">
          <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
            无图
          </div>
        </div>
        
        <!-- 文件选择 -->
        <div class="flex flex-col">
           <input 
            type="file" 
            @change="handleFile" 
            accept="image/*"
            class="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 transition-colors" 
          />
          <span v-if="uploading" class="text-xs text-indigo-500 dark:text-indigo-400 mt-1">上传中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient  from '@/api/axios';


const types = ref([]);
const newType = ref('');
const avatarUrl = ref('');
const loading = ref(false);
const uploading = ref(false);

// --- 1. 获取所有类型 ---
const fetchTypes = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get(`/api/types`);
    // 后端返回的是 [{id: 1, label: 'TV'}, ...]
    types.value = res.data;
  } catch (err) {
    console.error('获取类型失败', err);
    alert('无法连接服务器');
  } finally {
    loading.value = false;
  }
};

// --- 2. 添加类型 ---
const addType = async () => {
  if (!newType.value.trim()) return;
  
  try {
    await apiClient.post(`/api/types`, {
      label: newType.value
    });
    newType.value = '';
    // 添加成功后，重新获取列表以显示最新 ID
    await fetchTypes();
  } catch (err) {
    alert('添加失败: ' + (err.response?.data?.message || err.message));
  }
};

// --- 3. 删除类型 ---
const removeType = async (id) => {
  if (!confirm('确定要删除这个类型吗？')) return;
  
  try {
    await axios.delete(`/types/${id}`);
    // 在前端直接移除，或者重新 fetchTypes() 也可以
    types.value = types.value.filter(t => t.id !== id);
  } catch (err) {
    alert('删除失败');
  }
};

// --- 4. 上传文件 ---
const handleFile = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file); // key 必须是 'file'，对应后端 upload.single('file')

  uploading.value = true;
  try {
    const res = await apiClient.post(`/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // 后端返回 { url: 'http://...' }
    avatarUrl.value = res.data.url;
    console.log('图片地址:', res.data.url);
  } catch (err) {
    console.error(err);
    alert('上传失败，请检查后端 AWS S3 配置是否正确');
  } finally {
    uploading.value = false;
  }
};

// 页面加载时执行
onMounted(() => {
  fetchTypes();
});
</script>

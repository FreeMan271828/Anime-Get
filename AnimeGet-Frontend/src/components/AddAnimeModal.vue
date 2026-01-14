<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity">
    <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all duration-300">
      
      <!-- 头部 -->
      <div class="bg-indigo-600 dark:bg-indigo-800 px-6 py-4 flex justify-between items-center transition-colors duration-300">
        <h3 class="text-white font-bold text-lg">✨ 添加新番剧</h3>
        <button @click="$emit('close')" class="text-indigo-200 hover:text-white text-2xl">×</button>
      </div>
      
      <!-- 表单内容 -->
      <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        
        <!-- 封面上传 -->
        <div class="flex justify-center mb-4">
            <div class="w-32 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center relative cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-400 transition overflow-hidden">
                <img v-if="form.cover_image" :src="form.cover_image" class="w-full h-full object-cover" />
                <div v-else class="text-center p-2">
                    <span class="text-3xl text-gray-300 dark:text-gray-500">+</span>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">上传封面</p>
                </div>
                <input type="file" @change="uploadCover" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">番剧名称 <span class="text-red-500">*</span></label>
          <input v-model="form.name" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-100" placeholder="例如：葬送的芙莉莲" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">观看链接</label>
          <input v-model="form.url" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-100" placeholder="例如：https://www.bilibili.com/bangumi/play/..." />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                <select v-model="form.type" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100">
                    <option v-for="t in types" :key="t.id" :value="t.label">{{ t.label }}</option>
                </select>
            </div>
             <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">总集数</label>
                <input v-model="form.total_episodes" type="number" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100" placeholder="12" />
            </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">上映时间</label>
          <input v-model="form.release_date" type="date" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100" />
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">如果未上映或日期晚于今天，自动归入待追番。</p>
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">追番理由/备注</label>
           <textarea v-model="form.reason" rows="2" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100" placeholder="为什么想看这部？"></textarea>
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ errorMsg }}</div>
      </div>

      <!-- 底部按钮 -->
      <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3 transition-colors duration-300">
        <button @click="$emit('close')" class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">取消</button>
        <button @click="submit" :disabled="loading" class="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-lg disabled:opacity-50">
           {{ loading ? '提交中...' : '确定添加' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from "../api/axios";

const emit = defineEmits(['close', 'refresh']);
const types = ref([]);
const loading = ref(false);
const errorMsg = ref('');

const form = ref({
    name: '',
    type: 'TV动画',
    total_episodes: null,
    release_date: '',
    reason: '',
    cover_image: '',
    url: ''
});

onMounted(async () => {
    try {
        const res = await apiClient.get('/api/types');
        types.value = res.data;
        if(types.value.length > 0) form.value.type = types.value[0].label;
    } catch(e){}
});

const uploadCover = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await apiClient.post('/api/upload', formData);
        form.value.cover_image = res.data.key
    } catch(e) {
        alert('图片上传失败');
    }
};

const submit = async () => {
    loading.value = true;
    errorMsg.value = '';
    try {
        await apiClient.post('/api/anime', form.value);
        emit('refresh');
        emit('close');
    } catch (e) {
        errorMsg.value = e.response?.data?.message || '提交失败，请检查填写';
    } finally {
        loading.value = false;
    }
};
</script>

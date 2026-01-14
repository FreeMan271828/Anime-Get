<template>
  <!-- 整个 div 监听点击事件，发出 show-details 事件 -->
  <div 
    class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
    @click="showDetails"
    >
    <div class="relative h-48 overflow-hidden">
      <img :src="anime.cover_image_url || '/default-anime.jpg'" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
      <div class="absolute top-0 right-0 bg-black bg-opacity-60 text-white px-2 py-1 text-xs rounded-bl-lg">
        {{ mapStatus(anime.status) }}
      </div>
      <div v-if="anime.watch_count > 1" class="absolute bottom-0 left-0 bg-yellow-500 text-white px-2 py-0.5 text-xs">
        {{ anime.watch_count }}周目
      </div>
    </div>
    
    <div class="p-4">
      <h3 class="font-bold text-gray-800 text-lg truncate dark:text-gray-100">{{ anime.names[0] }}</h3>
      <h4 v-if="anime.names[1]" class="text-gray-500 text-sm truncate dark:text-gray-400">{{ anime.names[1] }}</h4>
      
      <div class="mt-3 flex items-center justify-between">
        <a v-if="anime.url" 
           :href="anime.url" 
           target="_blank" 
           rel="noopener noreferrer" 
           @click.stop 
           class="text-gray-400 hover:text-indigo-600 transition-colors p-1 -ml-1 dark:hover:text-indigo-400"
           title="前往观看">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </a>
        <!-- 使用 flex-grow 将右侧元素推开 -->
        <div class="flex-grow"></div>

        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">{{ anime.type || 'TV' }}</span>
        <span class="text-xs text-gray-400 ml-2">{{ formatDate(anime.release_date) }}</span>
      </div>

      <!-- 操作按钮区域: 使用 .stop 修饰符阻止事件冒泡到父 div -->
      <div class="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity dark:border-gray-700">
        <button @click.stop="changeStatus('TO_WATCHING')" v-if="anime.status === 'WAIT'" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800">开始追</button>
        
        <button @click.stop="changeStatus('TO_FINISHED')" v-if="anime.status === 'WATCHING'" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800">追完了</button>
        <button @click.stop="changeStatus('TO_DROPPED')" v-if="anime.status === 'WATCHING'" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800">弃坑</button>

        <button @click.stop="changeStatus('RE_WATCH')" v-if="anime.status === 'FINISHED'" class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800">{{ rewatchButtonText }}</button>
        
        <button @click.stop="changeStatus('TO_WATCHING')" v-if="anime.status === 'DROPPED'" class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">捡回来</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import apiClient from '../../api/axios';


const props = defineProps(['anime']);
// 增加了 'show-details' 事件
const emit = defineEmits(['refresh', 'show-details']);

const showDetails = () => {
  console.log('AnimeCard clicked! Emitting show-details with ID:', props.anime.id); 
  emit('show-details', props.anime.id);
};


const mapStatus = (status) => {
  const map = { 'WAIT': '待追', 'WATCHING': '正在追', 'FINISHED': '追完啦', 'DROPPED': '已放弃' };
  return map[status] || status;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间';
  return new Date(dateStr).toLocaleDateString();
};

const rewatchButtonText = computed(() => {
  if (!props.anime.watch_count) {
    return '二刷'; 
  }
  const nextWatchCount = props.anime.watch_count + 1;
  const chineseNumerals = ['二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (nextWatchCount >= 2 && nextWatchCount <= 10) {
    return `${chineseNumerals[nextWatchCount - 2]}刷`;
  }

  return `第${nextWatchCount}刷`;
});

const changeStatus = async (action) => {
  let payload = {};
  if (action === 'TO_FINISHED') {
     let rating = prompt("请打分 (0.0 - 10.0):", "9.5");
     if (rating === null) return; 
     if (parseFloat(rating) < 0 || parseFloat(rating) > 10 || isNaN(parseFloat(rating))) {
         alert("评分必须在 0 到 10 之间");
         return;
     }
     const review = prompt("完结感言 (可选):", "");
     payload = { rating, review };
  }
  
  if (confirm('确定要变更状态吗？')) {
    try {
      await apiClient.post(`/api/anime/${props.anime.id}/status`, { action, payload });
      emit('refresh');
    } catch (e) {
      alert('操作失败');
    }
  }
};
</script>

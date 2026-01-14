<!-- src/components/Layout/AddCommentModal.vue -->
<template>
  <Transition name="modal-fade">
    <div 
      v-if="isVisible" 
      class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300">
        <!-- 头部 -->
        <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center transition-colors duration-300">
          <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100">添加分集评论</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors">&times;</button>
        </div>

        <!-- 表单 -->
        <div class="p-6 space-y-4">
          <div>
            <label for="episode-num" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">集数</label>
            <input 
              id="episode-num" 
              type="number" 
              v-model.number="episodeNumber" 
              min="1" 
              class="w-full border dark:border-gray-600 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            >
          </div>
          <div>
            <label for="episode-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">评论内容</label>
            <textarea 
              id="episode-content" 
              v-model.trim="content" 
              rows="4" 
              class="w-full border dark:border-gray-600 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100" 
              placeholder="对这一集说点什么..."
            ></textarea>
          </div>
        </div>
        
        <!-- 底部按钮 -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 flex justify-end transition-colors duration-300">
          <button 
            @click="submitComment" 
            :disabled="isSubmitting" 
            class="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 shadow-md transition-colors"
          >
            {{ isSubmitting ? '提交中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import apiClient from '@/api/axios';
import { ref } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  animeId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['close', 'comment-added']);

const episodeNumber = ref(1);
const content = ref('');
const isSubmitting = ref(false);

const submitComment = async () => {
  if (!content.value || !episodeNumber.value) {
    alert('请填写集数和评论内容！');
    return;
  }
  if (episodeNumber.value < 1) {
    alert('集数不能小于1！');
    return;
  }

  isSubmitting.value = true;
  try {
    await apiClient.post('/api/comment', {
      anime_id: props.animeId,
      type: 'EPISODE_COMMENT',
      content: content.value,
      episode_number: episodeNumber.value,
    });
    // 重置表单
    content.value = '';
    episodeNumber.value += 1; // 智能+1
    // 通知父组件
    emit('comment-added');
  } catch (error) {
    console.error('Failed to submit episode comment:', error);
    alert('提交评论失败！');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

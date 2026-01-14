<template>
  <!-- 遮罩层 -->
  <Transition name="modal-fade">
    <div 
      v-if="isVisible" 
      class="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <!-- 加载状态 -->
      <div v-if="!detail" class="text-white text-xl">加载中...</div>

      <!-- 模态框内容 -->
      <div v-else class="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300">
        <!-- 头部 -->
         <div class="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center flex-shrink-0 transition-colors duration-300">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">番剧详情</h2>
            <div>
              <template v-if="!isEditing">
                <button @click="startFullEdit" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md mr-4 transition-colors">编辑</button>
              </template>
              <template v-else>
                <button @click="cancelFullEdit" class="text-sm bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 px-3 py-1.5 rounded-md mr-2 transition-colors">取消</button>
                <button @click="saveChanges" :disabled="isSaving" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors">
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
              </template>
              <button @click="closeModal" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl ml-4 transition-colors">&times;</button>
            </div>
        </div>

        <!-- 主体内容区域 -->
        <div class="flex-grow overflow-y-auto p-6">
          
          <!-- 【布局切换】根据是否编辑，切换不同的根布局 -->

          <!-- #################### DISPLAY MODE LAYOUT #################### -->
          <div v-if="!isEditing" class="flex flex-col md:flex-row gap-6">
            <!-- 左侧：封面图片 -->
            <div class="flex-shrink-0 md:w-1/3">
               <div class="relative rounded-lg shadow-md aspect-[3/4] cursor-pointer group overflow-hidden" @click="triggerFileInput">
                <img :src="detail.anime.cover_image_url || '/default-anime.jpg'" alt="Anime Cover" class="w-full h-full object-cover rounded-lg transition-all duration-300 ease-in-out group-hover:blur-sm group-hover:scale-105"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center rounded-lg transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                    <p class="text-white text-xl font-semibold pb-4"> 更换海报 </p>
                </div>
                <div v-if="isUploading" class="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded-lg z-10">
                  <p class="text-white text-lg">上传中...</p>
                </div>
              </div>
              <input type="file" ref="fileInput" @change="handleCoverImageChange" class="hidden" accept="image/png, image/jpeg, image/webp"/>
            </div>

            <!-- 右侧：单列垂直布局 -->
            <div class="flex-grow md:w-2/3 flex flex-col gap-4">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-3 transition-colors duration-300">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-baseline gap-x-4 flex-wrap">
                      <h3 class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ detail.anime.names[0] }}</h3>
                      <p v-if="detail.anime.names[1]" class="text-gray-500 dark:text-gray-400 text-xl">{{ detail.anime.names[1] }}</p>
                      <p class="text-gray-400 dark:text-gray-500 text-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{{ detail.anime.type }}</p>
                    </div>
                  </div>
                  <a v-if="detail.anime.url" :href="detail.anime.url" target="_blank" class="flex-shrink-0 ml-4 text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm">点击观看</a>
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm transition-colors duration-300">
                <div @click="toggleHistory" class="flex justify-between items-center cursor-pointer">
                  <h4 class="font-bold text-gray-700 dark:text-gray-200">追番记录</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transition-transform duration-300" :class="{'rotate-180': isHistoryExpanded}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div class="overflow-hidden transition-all duration-300 ease-in-out" :class="isHistoryExpanded ? 'max-h-60 mt-2' : 'max-h-0'">
                  <div class="overflow-y-auto max-h-56 custom-scrollbar pr-2">
                    <div v-if="displayedHistory.length > 0" class="space-y-2 text-sm">
                      <div v-for="h in displayedHistory" :key="h.id" class="p-2 bg-gray-50 dark:bg-gray-700 rounded"><p class="flex items-center flex-wrap dark:text-gray-200"><span class="font-semibold">第 {{ h.watch_count }} 周目:</span> <span class="ml-2" v-if="h.start_date">从 {{ formatDate(h.start_date) }}</span><span v-if="h.end_date"> 到 {{ formatDate(h.end_date) }}</span><span v-else class="text-green-600 dark:text-green-400"> 正在追</span><span v-if="h.rating" class="ml-auto text-yellow-600 dark:text-yellow-400 font-medium">评分: {{ h.rating }} / 10 </span></p></div>
                    </div>
                    <p v-else class="text-gray-400 text-sm py-4">还未追番</p>
                  </div>
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm transition-colors duration-300">
                <div @click="toggleComments" class="flex justify-between items-center mb-1 cursor-pointer">
                  <h4 class="font-bold text-gray-700 dark:text-gray-200">相关评论</h4>
                  <div class="flex items-center gap-4">
                    <button @click.stop="isCommentModalVisible = true" class="flex items-center gap-1 text-sm bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>添加</button>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transition-transform duration-300" :class="{'rotate-180': isCommentsExpanded}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <div class="overflow-hidden transition-all duration-300 ease-in-out" :class="isCommentsExpanded ? 'max-h-60 mt-2' : 'max-h-0'">
                  <div class="overflow-y-auto max-h-56 space-y-3 pr-2 custom-scrollbar">
                    <div v-for="comment in displayedComments" :key="comment.id" class="text-sm border-b dark:border-gray-700 pb-2 last:border-b-0">
                        <div class="flex justify-between items-start">
                           <div class="text-gray-600 dark:text-gray-300 flex-grow pr-4 break-words"><span v-if="comment.type === 'EPISODE_COMMENT' && comment.episode_number" class="font-bold text-indigo-600 dark:text-indigo-400 mr-2">EP.{{ comment.episode_number }}:</span><span>{{ comment.content }}</span></div>
                           <div class="flex-shrink-0 flex items-center gap-4"><span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{{ mapCommentType(comment.type, comment.episode_number) }}</span></div>
                        </div>
                        <p class="text-right text-xs text-gray-400 mt-1">{{ formatDateTime(comment.created_at) }}</p>
                    </div>
                    <div v-if="displayedComments.length === 0" class="text-gray-400 text-sm h-20 flex items-center justify-center">还没有相关评论</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- #################### EDIT MODE LAYOUT (New 2/3 + 1/3 structure) #################### -->
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            
            <!-- Left Column (2/3 width) -->
            <div class="md:col-span-2 flex flex-col gap-6">
              
              <!-- Top Part of Left Column: Cover + Basic Info -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- Cover Image -->
                <div>
                  <div class="relative rounded-lg shadow-md aspect-[3/4]">
                    <img :src="detail.anime.cover_image_url || '/default-anime.jpg'" alt="Anime Cover" class="w-full h-full object-cover rounded-lg"/>
                  </div>
                </div>
                
                <!-- Basic Info Form -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-3 flex flex-col justify-center transition-colors duration-300">
                  <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400">主名称</label><input type="text" v-model="editableDetail.anime.names[0]" class="w-full border dark:border-gray-600 rounded p-2 text-lg font-bold dark:bg-gray-700 dark:text-gray-100"></div>
                  <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400">第二名称 (可选)</label><input type="text" v-model="editableDetail.anime.names[1]" class="w-full border dark:border-gray-600 rounded p-2 text-base dark:bg-gray-700 dark:text-gray-100"></div>
                  <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400">类型</label><select v-model="editableDetail.anime.type" class="w-full border dark:border-gray-600 rounded p-2 text-base dark:bg-gray-700 dark:text-gray-100"><option v-for="t in types" :key="t.id" :value="t.label">{{ t.label }}</option></select></div>
                  <div><label class="text-xs font-medium text-gray-500 dark:text-gray-400">观看链接</label><input type="text" v-model="editableDetail.anime.url" class="w-full border dark:border-gray-600 rounded p-2 text-sm dark:bg-gray-700 dark:text-gray-100"></div>
                </div>
                
              </div>
              
              <!-- Bottom Part of Left Column: History Form -->
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex-grow flex flex-col min-h-0 transition-colors duration-300">
                <h4 class="font-bold text-gray-700 dark:text-gray-200 mb-2 flex-shrink-0">追番记录</h4>
                <div class="flex-grow space-y-2 text-sm overflow-y-auto custom-scrollbar pr-2">
                  <div v-for="(h, index) in editableDetail.history" :key="h.id" class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                      <span class="font-semibold dark:text-gray-200">第 {{ h.watch_count }} 周目:</span>
                      <div class="flex items-center gap-2"><input type="date" v-model="editableDetail.history[index].start_date" class="w-full border dark:border-gray-600 rounded p-1 text-xs dark:bg-gray-600 dark:text-gray-100"><span class="text-gray-400">-</span><input type="date" v-model="editableDetail.history[index].end_date" class="w-full border dark:border-gray-600 rounded p-1 text-xs dark:bg-gray-600 dark:text-gray-100"></div>
                    </div>
                  </div>
                  <p v-if="!editableDetail.history.length" class="text-gray-400 text-sm py-4">还未追番</p>
                </div>
              </div>
              
            </div>
            
            <!-- Right Column (1/3 width): Comments -->
            <div class="md:col-span-1 flex flex-col">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex-grow flex flex-col h-full min-h-0 transition-colors duration-300">
                <h4 class="font-bold text-gray-700 dark:text-gray-200 mb-2 flex-shrink-0">相关评论 (只读)</h4>
                <div class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  <div v-for="comment in detail.comments" :key="comment.id" class="text-sm border-b dark:border-gray-700 pb-2 last:border-b-0">
                    <div class="flex justify-between items-start"><div class="text-gray-600 dark:text-gray-300 flex-grow pr-4 break-words"><span v-if="comment.type === 'EPISODE_COMMENT' && comment.episode_number" class="font-bold text-indigo-600 dark:text-indigo-400 mr-2">EP.{{ comment.episode_number }}:</span><span>{{ comment.content }}</span></div><div class="flex-shrink-0 flex items-center gap-4"><span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{{ mapCommentType(comment.type, comment.episode_number) }}</span></div></div><p class="text-right text-xs text-gray-400 mt-1">{{ formatDateTime(comment.created_at) }}</p>
                  </div>
                  <div v-if="!detail.comments.length" class="text-gray-400 text-sm h-20 flex items-center justify-center">还没有相关评论</div>
                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    
      <AddCommentModal v-if="detail" :is-visible="isCommentModalVisible" :anime-id="detail.anime.id" @close="isCommentModalVisible = false" @comment-added="handleCommentAdded"/>
    </div>
  </Transition>
</template>


<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import apiClient from '../../api/axios';
import AddCommentModal from '../AddCommentModal.vue';

const props = defineProps({
  isVisible: Boolean,
  detail: Object,
});

const emit = defineEmits(['close', 'refresh']);

const isEditing = ref(false);
const isSaving = ref(false);
const editableDetail = ref(null);
const types = ref([]);
const fileInput = ref(null);
const isUploading = ref(false);
const isCommentModalVisible = ref(false);

const isHistoryExpanded = ref(true);
const isCommentsExpanded = ref(false);

const latestHistoryEntry = computed(() => {
  if (!props.detail?.history?.length) return null;
  return [...props.detail.history].sort((a, b) => b.watch_count - a.watch_count)[0];
});

const displayedHistory = computed(() => {
  if (!props.detail || !props.detail.history) return [];
  if (isHistoryExpanded.value) {
    return [...props.detail.history].sort((a, b) => a.watch_count - b.watch_count);
  }

  return latestHistoryEntry.value ? [latestHistoryEntry.value] : [];
});

const latestFinalReview = computed(() => {
  if (!props.detail?.comments?.length) return null;
  const finalReviews = props.detail.comments.filter(c => c.type === 'FINAL_REVIEW');
  if (finalReviews.length === 0) return null;
  return finalReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
});

const displayedComments = computed(() => {
  if (isCommentsExpanded.value) return props.detail.comments;
  return latestFinalReview.value ? [latestFinalReview.value] : [];
});

const toggleHistory = () => {
  isHistoryExpanded.value = !isHistoryExpanded.value;
  if (isHistoryExpanded.value) isCommentsExpanded.value = false;
};
const toggleComments = () => {
  isCommentsExpanded.value = !isCommentsExpanded.value;
  if (isCommentsExpanded.value) isHistoryExpanded.value = false;
};

const startFullEdit = () => {
  editableDetail.value = JSON.parse(JSON.stringify(props.detail));
  if (editableDetail.value && editableDetail.value.history) {
    editableDetail.value.history.sort((a, b) => a.watch_count - b.watch_count);
    editableDetail.value.history.forEach(h => {
      h.start_date = formatDate(h.start_date);
      h.end_date = formatDate(h.end_date);
    });
  }
  isEditing.value = true;
};

const cancelFullEdit = () => {
  editableDetail.value = null;
  isEditing.value = false;
  isHistoryExpanded.value = true;
  isCommentsExpanded.value = false;
};

watch(() => props.isVisible, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      if (isEditing.value) cancelFullEdit();
      isHistoryExpanded.value = true;
      isCommentsExpanded.value = false;
    }, 300);
  }
});

onMounted(async () => {
    try {
        const res = await apiClient.get('/api/types');
        types.value = res.data;
    } catch(e){ console.error("Failed to fetch types", e); }
});

const handleCommentAdded = () => {
  isCommentModalVisible.value = false;
  emit('refresh');
};

const closeModal = () => {
    emit('close');
};

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString() : '';

const mapCommentType = (type, episodeNumber) => {
  if (type === 'EPISODE_COMMENT' && episodeNumber) return `第 ${episodeNumber} 集`;
  const map = { 'REASON_TO_WATCH': '追番理由', 'FINAL_REVIEW': '完结评论' };
  return map[type] || '评论';
};

const saveChanges = async () => {
  isSaving.value = true;
  try {
    const animePayload = {
      names: editableDetail.value.anime.names,
      type: editableDetail.value.anime.type,
      url: editableDetail.value.anime.url
    };
    const updateAnimePromise = apiClient.put(`/api/anime/${props.detail.anime.id}`, animePayload);
    const historyUpdatePromises = editableDetail.value.history.map((editedHistory, index) => {
      const originalHistory = props.detail.history[index];
      if (formatDate(originalHistory.start_date) !== editedHistory.start_date || formatDate(originalHistory.end_date) !== editedHistory.end_date) {
        return apiClient.put(`/api/anime/history/${editedHistory.id}`, {
          start_date: editedHistory.start_date || null,
          end_date: editedHistory.end_date || null
        });
      }
      return Promise.resolve();
    });
    await Promise.all([updateAnimePromise, ...historyUpdatePromises]);
    cancelFullEdit();
    emit('refresh');
  } catch (error) {
    console.error("Failed to save changes:", error);
    alert('保存失败！');
  } finally {
    isSaving.value = false;
  }
};

const triggerFileInput = () => {
  if (isUploading.value || isEditing.value) return;
  fileInput.value.click();
};

const handleCoverImageChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  isUploading.value = true;
  try {
    const uploadResponse = await apiClient.post(`/api/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    await apiClient.put(`/api/anime/${props.detail.anime.id}`, { cover_image: uploadResponse.data.key });
    emit('refresh');
  } catch (error) {
    console.error('Failed to update cover image:', error);
    alert('封面更新失败，请稍后重试。');
  } finally {
    isUploading.value = false;
    event.target.value = ''; 
  }
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }
</style>

<template>
  <div>
    <!-- 工具栏 (已简化) -->
    <div class="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-300">
      <div class="flex flex-col md:flex-row gap-4 justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-100 flex-shrink-0">{{ currentTitle }}</h2>
        
        <div class="flex-grow flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center justify-end">
          <!-- 触发筛选弹窗的按钮 -->
          <button @click="openFilterModal" class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            筛选与搜索
          </button>
          
          <!-- 排序选择 -->
          <select
            v-model="sortBy"
            class="form-select w-full sm:w-auto rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2 px-3 text-base dark:bg-gray-700 dark:text-gray-200 transition-colors"
          >
            <option value="release_date">按上映时间</option>
            <option value="recent_watch">按最近观看</option>
            <option value="watch_count">按观看次数</option>
            <option value="rating">按评分</option>
          </select>

          <!-- [修改2]: 增大排序顺序切换按钮的 padding 和图标尺寸 -->
          <button @click="toggleSortOrder" class="p-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <svg v-if="sortOrder === 'DESC'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9M3 12h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9M3 12h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4" /></svg>
          </button>

          <!-- 清除筛选按钮 -->
          <button @click="resetFilters" class="text-base text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 transition-colors">重置</button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-20 text-gray-500 dark:text-gray-400">正在拼命加载中...</div>
    <div v-else-if="error" class="text-center py-20 text-red-500 dark:text-red-400">糟糕，加载失败了：{{ error }}</div>
    <template v-else>
      <TransitionGroup name="list" tag="div" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" v-if="animeList.length > 0">
        <AnimeCard v-for="anime in animeList" :key="anime.id" :anime="anime" @refresh="fetchData" @show-details="openDetailModal" />
      </TransitionGroup>
      <div v-else class="text-center py-20 text-gray-400 dark:text-gray-500">没有找到符合条件的番剧喵~</div>
    </template>
    
    <AnimeDetailModal :is-visible="isModalVisible" :detail="animeDetailData" @close="closeDetailModal" @refresh="fetchAnimeDetails" @update:detail="handleDetailUpdate" />

    <Transition name="modal">
      <div v-if="isFilterModalVisible" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <!-- [修改1]: 增大弹窗宽度 (max-w-md -> max-w-lg) 和内边距 (p-6 -> p-8) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg transition-colors duration-300">
          <h3 class="text-xl font-medium leading-6 text-gray-900 dark:text-gray-100 mb-6">筛选与搜索</h3>
          <!-- [修改2]: 增大元素间的垂直间距 (space-y-4 -> space-y-6) -->
          <div class="space-y-6">
            <!-- 名称搜索 -->
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300">名称/别名</label>
              <!-- [修改3]: 增大输入框高度和字体 (移除 sm:text-sm, 添加 py-2 px-3 text-base) -->
              <input type="text" id="search" v-model="tempSearchTerm" placeholder="输入关键词..." class="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-base dark:bg-gray-700 dark:text-gray-100">
            </div>
            <!-- 年份和季度选择 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">年份</label>
                <!-- [修改4]: 增大选择器高度和字体 -->
                <select id="year" v-model="tempSelectedYear" class="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-base dark:bg-gray-700 dark:text-gray-100">
                  <option v-for="year in yearOptions" :key="year.value" :value="year.value">{{ year.label }}</option>
                </select>
              </div>
              <div>
                <label for="quarter" class="block text-sm font-medium text-gray-700 dark:text-gray-300">季度</label>
                <!-- [修改5]: 增大选择器高度和字体 -->
                <select id="quarter" v-model="tempSelectedQuarter" :disabled="!tempSelectedYear" class="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-base disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-100">
                  <option v-for="quarter in quarterOptions" :key="quarter.value" :value="quarter.value">{{ quarter.label }}</option>
                </select>
              </div>
            </div>
          </div>
          <!-- 弹窗操作按钮 -->
          <div class="mt-8 flex justify-end gap-3">
            <button @click="closeFilterModal" type="button" class="px-5 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">取消</button>
            <button @click="applyFilters" type="button" class="px-5 py-2 bg-indigo-600 dark:bg-indigo-500 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">确认筛选</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import AnimeCard from '../components/Layout/AnimeCard.vue';
import AnimeDetailModal from '../components/Layout/AnimeDetailModal.vue';
import apiClient from '@/api/axios';

// --- 状态定义 ---
const route = useRoute();
const animeList = ref([]);
const isLoading = ref(false);
const error = ref(null);

// 主要的、已应用的筛选和排序状态
const searchTerm = ref('');
const selectedYear = ref('');
const selectedQuarter = ref('');
const sortBy = ref('release_date');
const sortOrder = ref('DESC');

// 筛选弹窗的可见性状态
const isFilterModalVisible = ref(false);
// 弹窗内部的临时状态，在点击确认前不影响主列表
const tempSearchTerm = ref('');
const tempSelectedYear = ref('');
const tempSelectedQuarter = ref('');

// 主详情弹窗相关状态 (保持不变)
const isModalVisible = ref(false);
const selectedAnimeId = ref(null);
const animeDetailData = ref(null);

const statusMap = { '/all': 'ALL', '/watching': 'WATCHING', '/wait': 'WAIT', '/finished': 'FINISHED', '/dropped': 'DROPPED' };
const titleMap = { '/all': '全部番剧', '/watching': '少年，开始追番吧', '/wait': '前面的番剧，以后再来探索吧', '/finished': '恭喜补完', '/dropped': '不想看了喵' };
const currentTitle = computed(() => titleMap[route.path] || '番剧列表');

// --- 计算属性，用于生成筛选选项 ---
const yearOptions = computed(() => {
  const options = [{ label: '所有年份', value: '' }];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 2000; year--) {
    options.push({ label: `${year}年`, value: year.toString() });
  }
  return options;
});

const quarterOptions = ref([
  { label: '所有季度', value: '' },
  { label: '1月番', value: '01' },
  { label: '4月番', value: '04' },
  { label: '7月番', value: '07' },
  { label: '10月番', value: '10' }
]);

// --- API 调用 ---
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const params = {
      status: statusMap[route.path] || 'ALL',
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    };
    if (searchTerm.value) params.search_term = searchTerm.value;
    // 只有当年份和季度都被选择时，才组合成 release_season 参数
    if (selectedYear.value && selectedQuarter.value) {
      params.release_season = `${selectedYear.value}-${selectedQuarter.value}`;
    }
    const res = await apiClient.get('/api/anime', { params });
    animeList.value = res.data;
  } catch (err) {
    console.error('Failed to fetch anime list:', err);
    error.value = err.response?.data?.message || err.message || '未知错误';
  } finally {
    isLoading.value = false;
  }
};

const toggleSortOrder = () => { sortOrder.value = sortOrder.value === 'DESC' ? 'ASC' : 'DESC'; };

const resetFilters = () => {
  // 重置主状态
  searchTerm.value = '';
  selectedYear.value = '';
  selectedQuarter.value = '';
  // 重置临时状态
  tempSearchTerm.value = '';
  tempSelectedYear.value = '';
  tempSelectedQuarter.value = '';
  // 重置排序状态
  sortBy.value = 'release_date';
  sortOrder.value = 'DESC';
};

// --- 筛选弹窗相关函数 ---
const openFilterModal = () => {
  // 打开弹窗时，将当前已应用的筛选条件同步到临时状态
  tempSearchTerm.value = searchTerm.value;
  tempSelectedYear.value = selectedYear.value;
  tempSelectedQuarter.value = selectedQuarter.value;
  isFilterModalVisible.value = true;
};

const closeFilterModal = () => {
  isFilterModalVisible.value = false;
};

const applyFilters = () => {
  // 点击确认时，用临时状态覆盖主状态
  searchTerm.value = tempSearchTerm.value;
  selectedYear.value = tempSelectedYear.value;
  // 如果年份被清空，季度也应随之清空
  if (!tempSelectedYear.value) {
    tempSelectedQuarter.value = '';
  }
  selectedQuarter.value = tempSelectedQuarter.value;
  // 关闭弹窗
  closeFilterModal();
  // watch会自动触发fetchData
};

const openDetailModal = async (animeId) => {
  selectedAnimeId.value = animeId;
  isModalVisible.value = true;
  await fetchAnimeDetails(); 
};

const closeDetailModal = () => {
  isModalVisible.value = false;
  selectedAnimeId.value = null;
  animeDetailData.value = null;
};

const fetchAnimeDetails = async () => {
  if (!selectedAnimeId.value) return;
  // 详情加载时，先清空旧数据，避免看到上一个番剧的残留信息
  animeDetailData.value = null; 
  try {
    const res = await apiClient.get(`/api/anime/${selectedAnimeId.value}`);
    animeDetailData.value = res.data;
  } catch (err) {
    console.error('Failed to fetch anime details:', err);
    alert('获取番剧详情失败！');
    closeDetailModal();
  }
};

const handleDetailUpdate = (updatedDetail) => {
  // 当详情页数据更新后，同步更新列表中的对应项，无需刷新整个页面
  animeDetailData.value = updatedDetail;
  const index = animeList.value.findIndex(a => a.id === updatedDetail.anime.id);
  if (index !== -1) {
    // 使用 Object.assign 保留响应性，并用新数据覆盖旧数据
    Object.assign(animeList.value[index], updatedDetail.anime);
  }
};

// --- 侦听器 ---
// 监听所有会影响数据获取的【主状态】
watch(
  [searchTerm, selectedYear, selectedQuarter, sortBy, sortOrder, () => route.path],
  () => {
    fetchData();
  },
  { immediate: true }
);

// 监听年份临时状态的变化，如果年份被清空，自动清空季度
watch(tempSelectedYear, (newYear) => {
  if (!newYear) {
    tempSelectedQuarter.value = '';
  }
});
</script>

<style>
/* 列表动效样式 */
.list-move, .list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(30px); }
.list-leave-active { position: absolute; }

/* 弹窗动效样式 */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

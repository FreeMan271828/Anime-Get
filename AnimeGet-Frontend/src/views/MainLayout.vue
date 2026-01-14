<script setup>
// 引入布局组件
import Sidebar from '../components/Layout/Sidebar.vue';
import Header from '../components/Layout/Header.vue';
import AddAnimeModal from '../components/AddAnimeModal.vue';
import { ref } from 'vue';

// 控制添加弹窗显示的全局状态（如果Header里的按钮要触发它）
const showAddModal = ref(false);

// 刷新列表的简单逻辑（通过 key 强制刷新 router-view，或者使用 Pinia，这里用简单方式）
const refreshKey = ref(0);
const handleRefresh = () => {
  refreshKey.value++;
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
    <!-- 1. 左侧侧边栏 -->
    <Sidebar @refresh="handleRefresh" />
    
    <!-- 右侧内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 2. 顶部导航栏 -->
      <!-- 监听 open-add 事件，当点击添加按钮时打开弹窗 -->
      <Header @open-add="showAddModal = true" />

      <!-- 3. 页面主体 (路由出口) -->
      <!-- 所有的页面（HomeView, AdminView等）都会显示在这里 -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-300">
        <!-- 添加过渡动效 -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="refreshKey" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 4. 全局弹窗组件 -->
    <Transition name="modal">
      <AddAnimeModal 
        v-if="showAddModal" 
        @close="showAddModal = false" 
        @refresh="handleRefresh"
      />
    </Transition>
  </div>
</template>

<style>
/* 页面切换动效 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 弹窗动效 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

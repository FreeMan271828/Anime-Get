<template>
  <aside class="w-64 bg-white dark:bg-gray-800 shadow-lg z-10 flex flex-col border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <div class="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">AnimeGet</h1>
    </div>

    <nav class="mt-6 flex-1 px-4 space-y-2">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path" 
        :to="item.path"
        class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
        active-class="bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 font-medium border-r-4 border-indigo-600 dark:border-indigo-400"
        @click="emit('refresh')"
      >
        <span class="mr-3">{{ item.icon }}</span>
        {{ item.name }}
      </router-link>
    </nav>
    
    <div class="p-4 border-t dark:border-gray-700">
       <router-link to="/admin" class="block text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
         进入管理后台
       </router-link>
    </div>
  </aside>
</template>

<script setup>
const emit = defineEmits(['refresh']);

const menuItems = [
  { name: '全部', path: '/all', icon: '📺' },
  { name: '正在追番', path: '/watching', icon: '▶️' },
  { name: '待追番', path: '/wait', icon: '⏳' },
  { name: '追完喵', path: '/finished', icon: '✅' },
  { name: '放弃喵', path: '/dropped', icon: '🚮' },
];
</script>

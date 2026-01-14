<template>
  <!-- 路由会在这里渲染 Login 组件或 MainLayout 组件 -->
  <router-view />
</template>

<script setup>
// 不需要任何脚本逻辑了
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

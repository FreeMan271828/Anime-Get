import { createApp } from 'vue'
import './style.css' // 1. 引入样式文件 (Tailwind)
import App from './App.vue'
import router from './router' // 2. 引入路由配置

const app = createApp(App)

app.use(router) // 3. 挂载路由
app.mount('#app')

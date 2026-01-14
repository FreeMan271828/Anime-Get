import { createRouter, createWebHistory } from 'vue-router';

// 导入你的视图组件
import HomeView from '../views/HomeView.vue';
import AdminView from '../views/AdminView.vue';

// 导入我们稍后会创建的布局组件和登录组件
import MainLayout from '../views/MainLayout.vue';
import Login from '../views/Login.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    // (可选) 如果用户已登录，访问/login时自动跳转到首页
    beforeEnter: (to, from, next) => {
      if (localStorage.getItem('authToken')) {
        next({ name: 'all' }); // 跳转到默认的 'all' 路由
      } else {
        next();
      }
    },
  },
  
  // 2. 主应用布局路由：包含所有需要认证的页面
  {
    path: '/',
    component: MainLayout, // 所有子路由都会在这个布局内显示
    meta: { requiresAuth: true }, // 标记这个路由及其所有子路由都需要认证
    redirect: '/all', // 默认重定向到 /all
    children: [
      {
        path: '/all',
        name: 'all',
        component: HomeView
      },
      {
        path: '/watching',
        name: 'watching',
        component: HomeView
      },
      {
        path: '/wait',
        name: 'wait',
        component: HomeView
      },
      {
        path: '/finished',
        name: 'finished',
        component: HomeView
      },
      {
        path: '/dropped',
        name: 'dropped',
        component: HomeView
      },
      {
        path: '/admin',
        name: 'Admin',
        component: AdminView
      }
      // 如果有详情页，也放在这里
      // { path: '/anime/:id', name: 'anime-detail', component: () => import('../views/DetailView.vue') }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 3. 全局前置守卫 (Navigation Guard)
router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('authToken');

  // 检查目标路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 如果需要认证但用户未登录
    if (!loggedIn) {
      // 重定向到登录页
      next({ name: 'Login' });
    } else {
      // 用户已登录，正常放行
      next();
    }
  } else {
    // 目标路由不需要认证，直接放行
    next();
  }
});

export default router;

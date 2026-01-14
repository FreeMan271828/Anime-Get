import axios from 'axios';
import router from '../router'; // 导入 Vue Router 实例

// 1. 创建一个新的 Axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 生产环境使用相对路径，开发环境可配置 .env
  timeout: 10000, // 请求超时时间
});

// 2. 添加请求拦截器 (Request Interceptor)
apiClient.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('authToken');
    if (token) {
      // 如果 token 存在，则为每个请求头添加 Authorization 字段
      // 'Bearer ' 是 OAuth 2.0 规范，很多后端框架（如 Express+Passport）都遵循此规范
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 3. 添加响应拦截器 (Response Interceptor)
apiClient.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    return response;
  },
  error => {
    // 对响应错误做点什么
    if (error.response) {
      switch (error.response.status) {
        case 401:
        case 403:
          // 401 Unauthorized 错误通常表示 token 无效或过期
          console.error('Authentication error: Token is invalid or expired.');
          
          // 清除本地存储的无效 token
          localStorage.removeItem('authToken');
          
          // 使用 router 将用户重定向到登录页面
          // 使用 replace 防止用户通过浏览器后退按钮回到之前的页面
          router.replace({ name: 'Login' });
          
          // 也可以给用户一个提示
          alert('您的登录已过期，请重新登录。');
      }
    }
    else {
      console.error("网络错误或后端服务未响应:", error.message);
    }
    
    // 返回一个被拒绝的 Promise，这样 .catch() 就会被触发
    return Promise.reject(error);
  }
);

// 4. 导出配置好的 Axios 实例
export default apiClient;

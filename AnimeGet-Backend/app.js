// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 核心中间件 ---
app.use(cors());
app.use(express.json());

// --- 路由 ---
// 所有API路由都以 /api 开头
app.use('/api', apiRoutes);

// --- 全局错误处理中间件 ---
// 这个中间件必须放在所有路由和业务逻辑之后
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

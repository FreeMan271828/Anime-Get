// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => {
    console.error('❌ 数据库连接失败', err.stack);
    process.exit(1); // 连接失败时退出进程
  });

module.exports = pool;

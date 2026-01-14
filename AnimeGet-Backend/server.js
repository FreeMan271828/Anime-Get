// 1. 最先引入 dotenv
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. 数据库连接 (从 .env 读取) ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 测试连接，方便排查问题
pool.connect().then(() => console.log('✅ 数据库连接成功')).catch(err => console.error('❌ 数据库连接失败', err));

// --- 2. S3 对象存储配置 (从 .env 读取) ---
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true // 必须保持 true，因为你是通过 IP 访问的
});

// Multer S3 上传中间件
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: 'public-read', // 注释或删除这一行
    acl: 'private', // 明确设置为私有，或者不设置acl，依赖存储桶默认策略
    key: function (req, file, cb) {
      const folder = req.path.includes('avator') ? 'avators/' : 'covers/';
      cb(null, folder + Date.now().toString() + '-' + file.originalname);
    }
  })
});

const animeSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    release_date: Joi.date().iso().required(),
    total_episodes: Joi.number().integer().allow(null).optional(),
    url: Joi.string().uri({
        scheme: [
            /https?/, 
        ]
    }).allow('').optional(),
    cover_image: Joi.string().allow('').optional(),
    reason: Joi.string().allow('').optional()
});

// --- 新增: 用户注册和登录的校验 Schema ---
const userRegisterSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required() // 建议在生产环境中设置更强的密码策略
});
const userLoginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden, token is invalid
    }
    req.user = user; // 将解码后的用户信息（payload）附加到请求对象上
    next();
  });
}

// [POST] /api/auth/register - 用户注册
app.post('/api/auth/register', async (req, res) => {
    // 1. 校验输入
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { username, password } = req.body;
    try {
        // 2. 检查用户名是否已存在
        const userExists = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists.' }); // 409 Conflict
        }
        // 3. 哈希密码
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        // 4. 将新用户存入数据库
        const newUser = await pool.query(
            'INSERT INTO "user" (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
            [username, passwordHash]
        );
        res.status(201).json({
            message: 'User created successfully.',
            user: newUser.rows[0]
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// [POST] /api/auth/login - 用户登录
app.post('/api/auth/login', async (req, res) => {
    // 1. 校验输入
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { username, password } = req.body;
    try {
        // 2. 根据用户名查找用户
        const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' }); // 401 Unauthorized
        }
        // 3. 比较密码
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        // 4. 密码匹配，生成 JWT
        const payload = {
            userId: user.id,
            username: user.username
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token 有效期，例如 7 天
        );
        // 5. 返回 Token
        res.json({
            message: 'Login successful.',
            token: token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- 新增: 获取当前登录用户的信息 ---
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  // authenticateToken 中间件已经运行，并把用户信息放在了 req.user
  const userId = req.user.userId;
  try {
    // 1. 从数据库查询用户信息，注意：绝不查询 password_hash
    const query = 'SELECT id, username, created_at, avator FROM "user" WHERE id = $1';
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      // 这种情况很少见，因为 token 有效但数据库找不到用户，可能是用户被删除了
      return res.status(404).json({ message: 'User not found.' });
    }
    const userProfile = result.rows[0];
    // 2. 为用户的头像生成预签名 URL (复用已有的函数)
    // 即使 avator 字段为 null，我们的函数也能正常处理
    userProfile.avator_url = await generatePresignedUrl(s3, userProfile.avator);
    // 3. 返回处理过的用户信息
    res.json(userProfile);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * 为给定的S3对象键生成一个预签名的URL。
 * @param {S3Client} s3Client - 已初始化的AWS S3客户端实例。
 * @param {string} key - S3存储桶中对象的键（文件路径）。
 * @param {number} [expiresIn=3600] - URL的有效时间（秒），默认为1小时。
 * @returns {Promise<string|null>} 返回预签名的URL字符串，如果key无效或生成失败则返回null。
 */
const generatePresignedUrl = async (s3Client, key, expiresIn = 3600) => {
  // 如果没有提供key（例如，数据库中该字段为null），则直接返回null
  if (!key) {
    return null;
  }
  // 从环境变量中获取存储桶名称
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    console.error("AWS_BUCKET_NAME environment variable is not set.");
    return null;
  }
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Failed to generate presigned URL for key "${key}":`, error);
    // 在生产环境中，你可能不希望因为单个URL生成失败而中断整个请求
    return null;
  }
};

// 上传接口
app.post('/api/upload', upload.single('file'),authenticateToken, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  // 现在我们只返回 key，因为 URL 将是动态生成的
  res.json({ 
    message: 'Upload successful',
    key: req.file.key 
  });
});

// 获取类型
app.get('/api/types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anime_types ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// 添加类型
app.post('/api/types',authenticateToken, async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).send("Label required");
  try {
    await pool.query('INSERT INTO anime_types (label) VALUES ($1)', [label]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// 删除类型
app.delete('/api/types/:id', authenticateToken,async (req, res) => {
  try {
    await pool.query('DELETE FROM anime_types WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// 添加番剧
app.post('/api/anime',authenticateToken, async (req, res) => {
  const { error, value } = animeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if(value.type === 1 && value.total_episodes === null){
      value.total_episodes = 12;
    }

    let initialStatus = 'WAIT'; 

    const animeRes = await client.query(
      `INSERT INTO anime (names, release_date, total_episodes, type, status, cover_image, url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        [value.name], 
        value.release_date || null, 
        value.total_episodes, 
        value.type, 
        initialStatus, 
        value.cover_image,
        value.url || null // 接收并保存 url
      ]
    );
    const animeId = animeRes.rows[0].id;

    if (value.reason) {
      await client.query(
        `INSERT INTO comment (anime_id, type, content) VALUES ($1, 'REASON_TO_WATCH', $2)`,
        [animeId, value.reason]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, id: animeId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json(e);
  } finally {
    client.release();
  }
});

// 获取番剧列表
app.get('/api/anime', authenticateToken, async (req, res) => {
  // 从查询参数中解构所有可能的过滤和排序选项
  const { 
    status,
    search_term,   // 用于名称/别名搜索的字符串
    release_season,
    sort_by = 'release_date', // 默认按上映时间排序
    sort_order = 'DESC'       // 默认降序
  } = req.query;
  try {
    // --- 1. 动态构建 SQL 查询 ---
    const queryParams = [];
    let paramIndex = 1;
    
    // [主要修改点] 在这里调整 history 聚合逻辑
    let baseQuery = `
      WITH aggregated_history AS (
        SELECT
          anime_id,
          MAX(start_date) AS most_recent_watch_date,
          -- 获取 watch_count 最高的那条记录的 rating
          -- 增加 start_date DESC 作为次要排序，以防 watch_count 相同
          (array_agg(rating ORDER BY watch_count DESC, start_date DESC))[1] AS latest_rating,
          -- 直接获取最高的 watch_count
          MAX(watch_count) AS latest_watch_count
        FROM history
        GROUP BY anime_id
      )
      SELECT 
        a.*, 
        ah.most_recent_watch_date,
        ah.latest_rating as rating,
        ah.latest_watch_count as watch_count
      FROM anime a
      LEFT JOIN aggregated_history ah ON a.id = ah.anime_id
    `;
    
    const whereClauses = [];
    // --- 2. 构建 WHERE 子句 ---
    if (status && status !== 'ALL') {
      whereClauses.push(`a.status = $${paramIndex++}`);
      queryParams.push(status);
    }
    if (search_term) {
      whereClauses.push(`EXISTS (SELECT 1 FROM unnest(a.names) name WHERE name ILIKE $${paramIndex++})`);
      queryParams.push(`%${search_term}%`);
    }
    
    if (release_season) {
      const seasonRegex = /^\d{4}-(01|04|07|10)$/;
      if (seasonRegex.test(release_season)) {
        const [year, monthStr] = release_season.split('-');
        const month = parseInt(monthStr, 10);
        const startDate = `${year}-${monthStr}-01`;
        let endDate;
        if (month === 1) { endDate = `${year}-03-31`; }
        else if (month === 4) { endDate = `${year}-06-30`; }
        else if (month === 7) { endDate = `${year}-09-30`; }
        else { endDate = `${year}-12-31`; }
        whereClauses.push(`a.release_date BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        queryParams.push(startDate, endDate);
      }
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    const validSortColumns = {
      release_date: 'a.release_date',
      recent_watch: 'ah.most_recent_watch_date',
      watch_count: 'ah.latest_watch_count',
      rating: 'ah.latest_rating'
    };
    const validSortOrders = ['ASC', 'DESC'];
    const orderByColumn = validSortColumns[sort_by] || 'a.release_date';
    const orderDirection = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    baseQuery += ` ORDER BY ${orderByColumn} ${orderDirection} NULLS LAST`;

    // --- 4. 执行查询 ---
    const result = await pool.query(baseQuery, queryParams);
    
    // --- 5. 生成签名 URL ---
    const animesWithSignedUrls = await Promise.all(
      result.rows.map(async (anime) => {
        const url = await generatePresignedUrl(s3, anime.cover_image);
        return { ...anime, cover_image_url: url };
      })
    );
    
    res.json(animesWithSignedUrls);
  } catch (err) { 
    console.error('Error fetching anime list:', err);
    res.status(500).json({ message: 'Failed to fetch anime list', error: err.message }); 
  }
});


// 状态流转
app.post('/api/anime/:id/status',authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { action, payload } = req.body; 
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (action === 'TO_WATCHING' || action === 'RE_WATCH') {
      await client.query(`UPDATE anime SET status = 'WATCHING' WHERE id = $1`, [id]);
      
      let count = 1;
      if (action === 'RE_WATCH') {
        const maxRes = await client.query(`SELECT MAX(watch_count) as mc FROM history WHERE anime_id = $1`, [id]);
        count = (maxRes.rows[0].mc || 0) + 1;
      }
      
      const existing = await client.query(`SELECT id FROM history WHERE anime_id = $1 AND end_date IS NULL`, [id]);
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO history (anime_id, start_date, watch_count) VALUES ($1, NOW(), $2)`, 
          [id, count]
        );
      }
    } 
    else if (action === 'TO_DROPPED') {
      // 1. 查找当前正在进行的观看记录
      const currentHistoryRes = await client.query(
        `SELECT id, watch_count FROM history WHERE anime_id = $1 AND end_date IS NULL`,
        [id]
      );
      // 如果找不到正在进行的记录，说明状态不一致，直接返回错误或成功，避免后续操作失败
      if (currentHistoryRes.rows.length === 0) {
        // 这是一个防御性编程，正常情况下前端不会发送这种请求
        await client.query('COMMIT');
        return res.status(409).json({ message: 'No active watching session to drop.' });
      }
      const currentHistory = currentHistoryRes.rows[0];
      // 2. 删除这条正在进行的观看记录 (无论如何都要删除)
      await client.query(`DELETE FROM history WHERE id = $1`, [currentHistory.id]);
      // 3. 根据 watch_count 判断是更新为 DROPPED 还是 FINISHED
      if (currentHistory.watch_count > 1) {
        // 如果是二周目或以上，放弃观看则状态回到“已看完”
        await client.query(`UPDATE anime SET status = 'FINISHED' WHERE id = $1`, [id]);
      } else {
        // 如果是一周目，放弃观看则状态变为“已弃番”
        await client.query(`UPDATE anime SET status = 'DROPPED' WHERE id = $1`, [id]);
      }
    }
    else if (action === 'TO_WAIT') {
        await client.query(`UPDATE anime SET status = 'WAIT' WHERE id = $1`, [id]);
    }
    else if (action === 'TO_FINISHED') {
      await client.query(`UPDATE anime SET status = 'FINISHED' WHERE id = $1`, [id]);
      await client.query(
        `UPDATE history SET end_date = NOW(), rating = $2 WHERE anime_id = $1 AND end_date IS NULL`,
        [id, payload.rating || null]
      );
      if (payload.review) {
        await client.query(
          `INSERT INTO comment (anime_id, type, content) VALUES ($1, 'FINAL_REVIEW', $2)`,
          [id, payload.review]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json(e);
  } finally {
    client.release();
  }
});

// --- 新增：获取单个番剧的详细信息 ---
app.get('/api/anime/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ message: 'Invalid anime ID' });
  }
  try {
      const animeRes = await pool.query('SELECT * FROM anime WHERE id = $1', [id]);
      if (animeRes.rows.length === 0) {
          return res.status(404).json({ message: 'Anime not found' });
      }
      const anime = animeRes.rows[0];
      // 为番剧封面生成预签名 URL
      if (anime.cover_image) {
          const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: anime.cover_image,
          });
          anime.cover_image_url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      } else {
          anime.cover_image_url = null;
      }
         // 3. 获取关联的观看历史 (确保这里有正确的 SQL 语句)
      const historyQuery = 'SELECT * FROM history WHERE anime_id = $1 ORDER BY start_date DESC';
      const historyRes = await pool.query(historyQuery, [id]);
      // 4. 获取关联的评论 (确保这里有正确的 SQL 语句)
      const commentsQuery = 'SELECT * FROM comment WHERE anime_id = $1 ORDER BY created_at DESC';
      const commentsRes = await pool.query(commentsQuery, [id]);
      res.json({
          anime, // 现在 anime 对象里包含了 cover_image_url
          history: historyRes.rows,
          comments: commentsRes.rows
      });
  } catch (err) {
    console.error(`Error fetching details for anime ${id}:`, err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// --- 新增：修改评论 ---
app.put('/api/comment/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }
  try {
    const result = await pool.query(
      'UPDATE comment SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.json({ success: true, comment: result.rows[0] });
  } catch (err) {
    console.error(`Error updating comment ${id}:`, err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 更新番剧信息接口
app.put('/api/anime/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { names, type, url, cover_image } = req.body; // 接收多个可能的字段
  const fieldsToUpdate = [];
  const values = [];
  let paramIndex = 1;
  // 动态构建 SET 子句
  if (names !== undefined) {
    fieldsToUpdate.push(`names = $${paramIndex++}`);
    values.push(names);
  }
  if (type !== undefined) {
    fieldsToUpdate.push(`type = $${paramIndex++}`);
    values.push(type);
  }
  if (url !== undefined) {
    fieldsToUpdate.push(`url = $${paramIndex++}`);
    values.push(url);
  }
  if (cover_image !== undefined) {
    fieldsToUpdate.push(`cover_image = $${paramIndex++}`);
    values.push(cover_image);
  }
  
  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ message: 'No valid fields provided for update.' });
  }
  values.push(id); // 最后一个参数是 WHERE 子句的 id
  const query = `UPDATE anime SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Anime not found' });
    }
    const updatedAnime = result.rows[0];
    
    // 如果封面被更新，需要重新生成签名URL
    if (updatedAnime.cover_image) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: updatedAnime.cover_image,
        });
        updatedAnime.cover_image_url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    } else {
        updatedAnime.cover_image_url = null;
    }
    
    res.json(updatedAnime);
  } catch (err) {
    console.error(`Error updating anime ${id}:`, err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/api/history/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date } = req.body;
  
  // 简单的校验
  if (!start_date && !end_date) {
    return res.status(400).json({ message: 'At least one date field is required.' });
  }
  try {
    // 这里我们假设前端会传来合法的日期字符串或 null
    const result = await pool.query(
      'UPDATE history SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING *',
      [start_date, end_date, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'History record not found.' });
    }
    
    res.json({ success: true, history: result.rows[0] });
  } catch(err) {
    console.error(`Error updating history ${id}:`, err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 添加评论
app.post('/api/comment', authenticateToken, async (req, res) => {
  const { anime_id, type, content, episode_number } = req.body;
  try {
    await pool.query(
      `INSERT INTO comment (anime_id, type, content, episode_number) VALUES ($1, $2, $3, $4)`,
      [anime_id, type, content, episode_number]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

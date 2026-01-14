// controllers/animeController.js
const pool = require('../config/db');
const { generatePresignedUrl } = require('../services/s3Service');
const { animeSchema } = require('../utils/joiSchemas');

exports.getAllAnime = async (req, res, next) => {
    const { status, search_term, release_season, sort_by = 'release_date', sort_order = 'DESC' } = req.query;
    try {
        const queryParams = [];
        let paramIndex = 1;
        
        let baseQuery = `
          WITH aggregated_history AS (
            SELECT
              anime_id,
              MAX(start_date) AS most_recent_watch_date,
              (array_agg(rating ORDER BY watch_count DESC, start_date DESC))[1] AS latest_rating,
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

        const result = await pool.query(baseQuery, queryParams);
        
        const animesWithSignedUrls = await Promise.all(
          result.rows.map(async (anime) => ({
            ...anime,
            cover_image_url: await generatePresignedUrl(anime.cover_image),
          }))
        );
        
        res.json(animesWithSignedUrls);
    } catch (err) { 
        next(err);
    }
};

exports.createAnime = async (req, res, next) => {
    // 注：您原有的 'POST /api/anime' 逻辑和 schema 不完全匹配，这里以您原代码逻辑为准
    const { error, value } = animeSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const animeRes = await client.query(
        `INSERT INTO anime (names, release_date, total_episodes, type, status, cover_image, url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          [value.name], 
          value.release_date || null, 
          value.total_episodes || 12, 
          value.type, 
          'WAIT', 
          value.cover_image,
          value.url || null
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
      res.status(201).json({ success: true, id: animeId });
    } catch (e) {
      await client.query('ROLLBACK');
      next(e);
    } finally {
      client.release();
    }
};

exports.getAnimeById = async (req, res, next) => {
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
        anime.cover_image_url = await generatePresignedUrl(anime.cover_image);

        const historyRes = await pool.query('SELECT * FROM history WHERE anime_id = $1 ORDER BY start_date DESC', [id]);
        const commentsRes = await pool.query('SELECT * FROM comment WHERE anime_id = $1 ORDER BY created_at DESC', [id]);
        
        res.json({
            anime,
            history: historyRes.rows,
            comments: commentsRes.rows
        });
    } catch (err) {
      next(err);
    }
};

exports.updateAnimeInfo = async (req, res, next) => {
    const { id } = req.params;
    const { names, type, url, cover_image } = req.body;
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;
  
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
    values.push(id);
    const query = `UPDATE anime SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      const updatedAnime = result.rows[0];
      updatedAnime.cover_image_url = await generatePresignedUrl(updatedAnime.cover_image);
      
      res.json(updatedAnime);
    } catch (err) {
      next(err);
    }
};

exports.updateAnimeStatus = async (req, res, next) => {
    const { id } = req.params;
    const { action, payload } = req.body; 
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      if (action === 'TO_WATCHING' || action === 'RE_WATCH') {
        await client.query(`UPDATE anime SET status = 'WATCHING' WHERE id = $1`, [id]);
        let count = (action === 'RE_WATCH') 
            ? (await client.query(`SELECT MAX(watch_count) as mc FROM history WHERE anime_id = $1`, [id])).rows[0].mc + 1 
            : 1;
        const existing = await client.query(`SELECT id FROM history WHERE anime_id = $1 AND end_date IS NULL`, [id]);
        if (existing.rows.length === 0) {
          await client.query(`INSERT INTO history (anime_id, start_date, watch_count) VALUES ($1, NOW(), $2)`, [id, count]);
        }
      } 
      else if (action === 'TO_DROPPED') {
        const currentHistoryRes = await client.query(`SELECT id, watch_count FROM history WHERE anime_id = $1 AND end_date IS NULL`, [id]);
        if (currentHistoryRes.rows.length === 0) {
          await client.query('COMMIT');
          return res.status(409).json({ message: 'No active watching session to drop.' });
        }
        const { id: historyId, watch_count } = currentHistoryRes.rows[0];
        await client.query(`DELETE FROM history WHERE id = $1`, [historyId]);
        const newStatus = watch_count > 1 ? 'FINISHED' : 'DROPPED';
        await client.query(`UPDATE anime SET status = $1 WHERE id = $2`, [newStatus, id]);
      }
      else if (action === 'TO_WAIT') {
          await client.query(`UPDATE anime SET status = 'WAIT' WHERE id = $1`, [id]);
      }
      else if (action === 'TO_FINISHED') {
        await client.query(`UPDATE anime SET status = 'FINISHED' WHERE id = $1`, [id]);
        await client.query(`UPDATE history SET end_date = NOW(), rating = $2 WHERE anime_id = $1 AND end_date IS NULL`, [id, payload.rating || null]);
        if (payload.review) {
          await client.query(`INSERT INTO comment (anime_id, type, content) VALUES ($1, 'FINAL_REVIEW', $2)`, [id, payload.review]);
        }
      }
  
      await client.query('COMMIT');
      res.json({ success: true, message: 'Status updated successfully.' });
    } catch (e) {
      await client.query('ROLLBACK');
      next(e);
    } finally {
      client.release();
    }
};

exports.updateHistory = async (req, res, next) => {
    const { id } = req.params;
    const { start_date, end_date } = req.body;
    
    if (!start_date && !end_date) {
      return res.status(400).json({ message: 'At least one date field is required.' });
    }
    try {
      const result = await pool.query(
        'UPDATE history SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING *',
        [start_date, end_date, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'History record not found.' });
      }
      res.json({ success: true, history: result.rows[0] });
    } catch(err) {
      next(err);
    }
};

exports.createComment = async (req, res, next) => {
    const { anime_id, type, content, episode_number } = req.body;
    if(!anime_id || !type || !content) {
        return res.status(400).json({ message: 'anime_id, type, and content are required.' });
    }
    try {
      await pool.query(
        `INSERT INTO comment (anime_id, type, content, episode_number) VALUES ($1, $2, $3, $4)`,
        [anime_id, type, content, episode_number]
      );
      res.status(201).json({ success: true, message: 'Comment created successfully.' });
    } catch (err) { 
        next(err);
    }
};

exports.updateComment = async (req, res, next) => {
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
      next(err);
    }
};

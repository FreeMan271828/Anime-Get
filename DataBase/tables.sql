-- ----------------------------
-- 1. 创建自定义枚举类型用于评论分类
-- ----------------------------
-- 使用 ENUM 可以确保 'type' 字段的数据完整性
CREATE TYPE comment_type AS ENUM (
    'REASON_TO_WATCH', -- 追番原因
    'EPISODE_COMMENT', -- N集评论
    'FINAL_REVIEW'     -- 追完评论
);

-- ----------------------------
-- 2. 创建 Anime (动画) 表
-- ----------------------------
CREATE TABLE anime (
    id BIGSERIAL PRIMARY KEY, -- 使用BIGSERIAL作为自增主键，适用于大量数据
    names TEXT[] NOT NULL, -- 动画名称，数组类型，可存多个名字（如：中文、日文、英文名）
    release_date DATE, -- 上映时间，DATE类型足够
    total_episodes INT -- 总集数
	type  VARCHAR -- 类型
);

COMMENT ON COLUMN anime.id IS '动画唯一ID';
COMMENT ON COLUMN anime.names IS '动画名称数组，如：{"中文名", "日文名"}';
COMMENT ON COLUMN anime.release_date IS '首播上映日期';
COMMENT ON COLUMN anime.total_episodes IS '动画总集数';


-- ----------------------------
-- 3. 创建 Comment (评论) 表
-- ----------------------------
CREATE TABLE comment (
    id BIGSERIAL PRIMARY KEY,
    anime_id BIGINT NOT NULL, -- 关联到 Anime 表的ID
    type comment_type NOT NULL, -- 使用我们创建的枚举类型
    episode_number INT, -- 对应集数，对于'追番原因'或'追完评论'可为NULL
    content TEXT NOT NULL, -- 评论的具体内容，不允许为空
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 评论创建时间，TIMESTAMPTZ带时区更标准

    -- 添加外键约束，确保anime_id一定存在于anime表中
    -- ON DELETE CASCADE 表示如果动画被删除，其所有相关评论也会被自动删除
    CONSTRAINT fk_anime
        FOREIGN KEY(anime_id) 
        REFERENCES anime(id)
        ON DELETE CASCADE
);

COMMENT ON COLUMN comment.id IS '评论唯一ID';
COMMENT ON COLUMN comment.anime_id IS '关联的动画ID';
COMMENT ON COLUMN comment.type IS '评论类型 (追番原因, N集评论, 追完评论)';
COMMENT ON COLUMN comment.episode_number IS '评论针对的集数 (如果是整部番的评论则为NULL)';
COMMENT ON COLUMN comment.content IS '评论正文';
COMMENT ON COLUMN comment.created_at IS '评论创建时间';


-- ----------------------------
-- 4. 创建 History (观看历史) 表
-- ----------------------------
-- 每一行代表一次完整的观看记录 (一个周目)
CREATE TABLE history (
    id BIGSERIAL PRIMARY KEY,
    anime_id BIGINT NOT NULL,
    watch_count INT NOT NULL DEFAULT 1, -- 周目数，默认为1
    rating NUMERIC(3, 1), -- 评分，允许一位小数，如 9.5
    start_date DATE, -- 本次观看的开始日期
    end_date DATE, -- 本次观看的结束日期 (如果还在看，可以为NULL)
    
    -- 添加外键约束
    CONSTRAINT fk_anime
        FOREIGN KEY(anime_id)
        REFERENCES anime(id)
        ON DELETE CASCADE,

    -- 添加检查约束，确保评分在 0.0 到 10.0 之间
    CONSTRAINT rating_check
        CHECK (rating >= 0.0 AND rating <= 10.0)
);

COMMENT ON COLUMN history.id IS '观看历史记录唯一ID';
COMMENT ON COLUMN history.anime_id IS '关联的动画ID';
COMMENT ON COLUMN history.watch_count IS '观看周目 (第几次看)';
COMMENT ON COLUMN history.rating IS '本次观看后的评分 (0.0 - 10.0)';
COMMENT ON COLUMN history.start_date IS '本次观看的开始日期';
COMMENT ON COLUMN history.end_date IS '本次观看的完成日期';


-- ----------------------------
-- 5. 创建索引以优化查询性能
-- ----------------------------
-- 在外键列上创建索引是数据库优化的常规操作，可以极大提升关联查询的速度
CREATE INDEX idx_comment_anime_id ON comment(anime_id);
CREATE INDEX idx_history_anime_id ON history(anime_id);


-- 1. 创建番剧类型管理表 (替代硬编码的 Enum)
CREATE TABLE anime_types (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE
);

-- 初始化一些基础类型
INSERT INTO anime_types (label) VALUES ('TV动画'), ('剧场版'), ('OVA'), ('SP');

-- 2. 修改 Anime 表
-- 添加 status 字段 (如果还没加)
ALTER TABLE anime ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'WAIT';
-- 添加 封面图片 字段
ALTER TABLE anime ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);
-- 修改 type 字段，为了兼容旧数据，我们暂时保留 varchar，但在后端逻辑中关联 anime_types
-- 如果希望强关联，可以执行: ALTER TABLE anime ADD COLUMN type_id INT REFERENCES anime_types(id); (这里暂时保持灵活)

-- 3. 确保 History 表和 Comment 表结构符合之前的定义
-- (假设之前的表已存在，不再重复创建，仅确保数据完整性)

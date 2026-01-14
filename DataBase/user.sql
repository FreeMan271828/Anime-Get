CREATE TABLE "user" ( -- 使用双引号以避免 "user" 关键字冲突
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- 用户名，设置长度限制且唯一
    password_hash TEXT NOT NULL, -- 存储密码的哈希值，而不是明文密码！
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- 账户创建时间
);
COMMENT ON TABLE "user" IS '用户表';
COMMENT ON COLUMN "user".id IS '用户唯一ID';
COMMENT ON COLUMN "user".username IS '用户名';
COMMENT ON COLUMN "user".password_hash IS '存储bcrypt或类似算法生成的密码哈希值';
COMMENT ON COLUMN "user".created_at IS '用户注册时间';

curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"username\": \"freeman\", \"password\": \"freeman\"}"

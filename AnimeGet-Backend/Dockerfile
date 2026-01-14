# --- STAGE 1: Build Stage ---
# 使用完整的 Node.js 镜像作为构建环境，命名为 'builder'
FROM node:20-alpine AS builder

# 设置构建环境的工作目录
WORKDIR /app

# 复制依赖描述文件
COPY package*.json ./

# 安装所有依赖，包括构建时可能需要的 devDependencies
RUN npm install

# 复制所有源代码
COPY . .

# 如果您有构建步骤 (例如 TypeScript 编译)，可以在这里执行
# RUN npm run build


# --- STAGE 2: Production Stage ---
# 使用一个干净、轻量的 Node.js 镜像作为最终的生产环境
FROM node:20-alpine

# 设置生产环境的工作目录
WORKDIR /app

# 从 'builder' 阶段复制优化过的 node_modules
# 只复制生产依赖，避免了 devDependencies 进入最终镜像
COPY --from=builder /app/node_modules ./node_modules

# 从 'builder' 阶段复制应用程序代码
COPY --from=builder /app ./

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 定义容器启动命令
CMD ["node", "app.js"]

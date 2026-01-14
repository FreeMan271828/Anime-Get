# Anime-Get

[中文](#中文) | [English](#english)

<a name="中文"></a>
## 📖 项目介绍

作为老二次元，一直想要找一个符合我心意的番剧统计工具，曾经试过纸质、excel、obsidian...但都不太令我满意。同时作为一名程序员，想趁着这段空闲的时间来做一个符合我心意的工具。

### ✨ 主要功能

- **番剧管理**: 轻松添加、更新和分类番剧（想看、在看、看过、弃坑）。
- **进度追踪**: 记录观看进度，支持多周目观看记录。
- **评分与评论**: 为番剧打分，撰写详细的剧评或单集评论。
- **高级搜索与排序**: 支持按名称、别名搜索，以及按上映时间、观看时间、观看次数或评分排序。
- **深色模式**: 内置深色/浅色主题切换，提供舒适的视觉体验。
- **数据统计**: 自动聚合观看历史和评分数据。
- **现代化 UI**: 基于 Vue 3 和 Tailwind CSS 构建的响应式界面。

### 🛠️ 技术栈

- **前端**: Vue 3, Vite, Tailwind CSS, Axios
- **后端**: Node.js, Express
- **存储**: AWS S3 (这里推荐[RustFs]{https://github.com/rustfs/rustfs})，PostgreSQL
- **部署**: Docker, Docker Compose, Nginx

## 🚀 如何部署

1. 确保本地已安装 Docker 和 Docker Compose。
2. 克隆项目到本地。
3. 修改配置文件：
   1. 修改后端配置文件 `AnimeGet-Backend/.env`，配置好数据库、S3、以及后端 Port。
   2. 修改`docker-compose.yaml`，修改`services:frontend:ports`对外暴露的端口
4. 在你的数据库中运行 `/DataBase/tables.sql`，创建表格和种子数据。
5. 在项目根目录下运行：
   ```bash
   docker-compose up --build -d
   ```

<a name="english"></a>
## 📖 Project Introduction

As a veteran anime fan, I have always been looking for an anime tracking tool that fits my heart. I have tried paper, Excel, Obsidian... but none of them satisfied me. At the same time, as a programmer, I wanted to take this free time to make a tool that suits my wishes.

### ✨ Key Features

- **Anime Management**: Easily add, update, and categorize anime (Plan to Watch, Watching, Completed, Dropped).
- **Progress Tracking**: Record watching progress, supporting multiple re-watch history.
- **Ratings & Reviews**: Rate anime and write detailed series reviews or episode-specific comments.
- **Advanced Search & Sort**: Support search by name or alias, and sort by release date, watch date, watch count, or rating.
- **Dark Mode**: Built-in dark/light theme toggle for a comfortable visual experience.
- **Data Statistics**: Automatically aggregates viewing history and rating data.
- **Modern UI**: Responsive interface built with Vue 3 and Tailwind CSS.

### 🛠️ Tech Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS, Axios
- **Backend**: Node.js, Express
- **Storage**: AWS S3 (I recommand [RustFs]{https://github.com/rustfs/rustfs}), PostgreSQL
- **Deployment**: Docker, Docker Compose, Nginx

## 🚀 How to Deploy

1. Ensure Docker and Docker Compose are installed locally.
2. Clone the project to your local machine.
3. Modify configuration files:
   1. Modify the backend configuration file `AnimeGet-Backend/.env` to configure the database, S3, and backend Port.
   2. Modify`docker-compose.yaml`to exhange the exposed port`services:frontend:ports`

4. Run `/DataBase/tables.sql` in your database to create tables and seed data.
5. Run the following command in the project root directory:
   ```bash
   docker-compose up --build -d
   ```

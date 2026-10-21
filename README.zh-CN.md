# EXIF Photo Blog

[Sam Becker / exif-photo-blog](https://github.com/sambecker/exif-photo-blog) 的非官方、社区维护自托管版本，主要面向中国大陆网络环境。基于 Next.js、React、PostgreSQL 和对象存储。

![EXIF Photo Blog](docs/assets/social-preview.png)

## 功能

- 上传照片并提取 EXIF，支持标签、相册、相机和镜头分类。
- 大图与瀑布流布局、明暗主题、中文界面。
- 管理员密码哈希验证、进程内登录限流。
- S3 兼容存储、自定义访问域名、图片直连。
- 批量编辑标题和拍摄位置、照片可见性控制。
- RSS/JSON feed、OG 图生成、Cmd-K 搜索、AI 辅助描述、胶片与预设信息。
- About 介绍保留回车与空行，提供中文字体回退。

## 启动

准备 Node.js 22+、pnpm 11.0.9、独立 PostgreSQL 数据库和对象存储。

```sh
corepack enable
corepack prepare pnpm@11.0.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env
node scripts/hash-password.mjs
pnpm dev
```

Windows PowerShell 可用 `Copy-Item .env.example .env` 复制配置。填写数据库、管理员与存储参数；开发环境将 `AUTH_URL` 设为 `http://localhost:3000`。生成 `AUTH_SECRET` 的命令见配置示例。密码哈希工具会分别输出本地开发与 Docker 所需的格式。访问 `/admin` 登录并上传照片。

Docker 部署运行 `docker compose build` 和 `docker compose up -d`，需要 Compose 2.30+。数据库须能从构建环境和容器访问；应用仅绑定宿主机回环地址，外部访问通过 HTTPS 反向代理。

详见 [部署文档](docs/deployment.md)、[版本差异](docs/server-variant.md)。

## 授权与发布状态

原项目作者为 [Sam Becker](https://github.com/sambecker)，本分支由 [Strtus](https://github.com/Strtus) 维护。本项目是非官方、社区维护的自托管版本，主要面向中国大陆网络环境，与原项目没有隶属关系。

2026-08-26，Sam Becker 同意将本仓库作为非商业自托管衍生项目公开发布，并要求保留署名。授权记录见 [issue #398](https://github.com/sambecker/exif-photo-blog/issues/398)。完整条款见 [LICENSE.md](LICENSE.md)，补充说明见 [NOTICE.md](NOTICE.md)。这是自定义授权声明，不是 OSI 认证的开源许可证。

Git 历史从当前自托管版本的初始快照开始，不包含此前的上游提交。本次整理未包含生产环境变量、数据库、私人照片及服务器专用配置。字体许可证位于 `public/fonts/OFL.txt`。

# EXIF Photo Blog

[Sam Becker / exif-photo-blog](https://github.com/sambecker/exif-photo-blog) 的非官方、社区维护自托管版本，主要面向中国大陆网络环境。基于 Next.js、React、PostgreSQL 和 S3 兼容对象存储。

**许可：** Strtus 拥有版权的新增与修改内容采用 [PolyForm Noncommercial 1.0.0](LICENSE.md)；上游代码沿用[原作者的授权](UPSTREAM_PERMISSION.md)。适用范围见 [NOTICE.md](NOTICE.md)。

[English](README.md) · [部署文档](docs/deployment.md) · [版本差异](docs/server-variant.md) · [许可与署名](NOTICE.md)

> 中文版与英文版结构一致；部署、运维和国内网络环境相关说明以中文版为准。

## 为什么做这个版本

- 不依赖 Vercel：Docker Compose + PostgreSQL + S3 兼容存储（AWS S3、Cloudflare R2、MinIO）。
- 面向中国大陆网络环境：国内 VPS、反向代理，腾讯云 COS 可通过 S3 API 接入。
- 单管理员场景加固：bcrypt、登录限流、分页边界、可见性检查。
- 中文界面、批量编辑标题/地点、About 页面保留回车与空行。

本仓库是已部署实例的快照，不是上游所有新功能的合并版本；AI Gateway 等部分上游选项未包含。

## 功能

**画廊**

- 上传照片并提取 EXIF；标签、相册、相机、镜头、胶片、预设。
- 大图/瀑布流、明暗主题、中文界面。
- RSS/JSON feed、OG 图生成、Cmd-K 搜索、可选 AI 辅助描述。

**管理**

- bcrypt 管理员认证、进程内登录限流。
- 批量编辑标题/拍摄地点、照片可见性控制。
- About 页面可编辑，保留回车与空行。

**部署**

- S3 兼容存储、自定义 endpoint、公开访问域名。
- Docker standalone 输出、仅绑定回环地址、反向代理说明。

## 环境要求

| 组件 | 要求 |
|---|---|
| Node.js | 22 或更高（本地开发） |
| pnpm | 11.0.9（`packageManager`） |
| 数据库 | PostgreSQL，建议使用独立数据库 |
| 对象存储 | S3 兼容桶（AWS S3、Cloudflare R2、MinIO）或 Vercel Blob |
| Docker | 容器部署需要 BuildKit 和 Compose 2.30+ |
| 反向代理 | 生产环境需要 HTTPS 反向代理 |

## 快速开始

```sh
corepack enable
corepack prepare pnpm@11.0.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env
node scripts/hash-password.mjs
pnpm dev
```

Windows PowerShell 用 `Copy-Item .env.example .env` 复制配置。

启动前填写 `.env`。核心变量如下：

| 变量 | 用途 |
|---|---|
| `POSTGRES_URL` | PostgreSQL 连接串；密码中的特殊字符需要 URL 编码 |
| `DISABLE_POSTGRES_SSL` | 仅可信本地数据库设为 `1` |
| `AUTH_SECRET` | 32 字节随机 hex；生成命令见 `.env.example` |
| `AUTH_URL` | 规范访问地址，如 `http://localhost:3000` |
| `AUTH_TRUST_HOST` | 在可信反向代理后设为 `true` |
| `ADMIN_EMAIL` | 管理员登录邮箱 |
| `ADMIN_PASSWORD_HASH` | `scripts/hash-password.mjs` 生成的 bcrypt 哈希 |
| `NEXT_PUBLIC_DOMAIN` | 绝对 URL 使用的公开域名 |
| `NEXT_PUBLIC_LOCALE` | `zh-cn` 或 `en-us` |
| `NEXT_PUBLIC_NAV_TITLE` | 导航标题 |

存储相关变量见 `.env.example` 和 [部署文档](docs/deployment.md)。`NEXT_PUBLIC_*` 会写入构建产物，属于公开信息，不要放密钥。

访问 `/admin` 登录并上传照片。应用会在首次查询时自动创建缺失的表，并执行支持的迁移；升级前先备份数据库。

## Docker 部署

```sh
docker compose build
docker compose up -d
```

需要 Docker BuildKit 和 Compose 2.30+。构建时通过 BuildKit secret 读取 `.env` 中的公开变量；数据库在运行时访问，不需要在构建阶段连接数据库。容器内的 `localhost` 不指向宿主机。应用只绑定 `127.0.0.1:3000`，外部通过 HTTPS 反向代理访问。详见 [部署文档](docs/deployment.md)。

## 运维

- PostgreSQL 和对象存储分别备份；镜像里不包含数据。
- 升级前保留上一版镜像，便于回滚。
- 升级前阅读 `docs/deployment.md`；迁移在查询时按需执行。
- 可见性控制只影响画廊查询，对象存储的公开 URL 仍然公开；发布前检查 EXIF/GPS。
- 登录限流是进程内的；多实例部署需要共享限流或边缘防护。

## 开发检查

```sh
pnpm typecheck
pnpm lint
pnpm build
```

构建需要 `NEXT_PUBLIC_*` 环境变量；当前快照不需要在构建阶段连接数据库。

## 贡献与安全

欢迎开 issue 和范围明确的 PR。请附上复现步骤，不要粘贴凭据、私人照片或服务器信息。贡献内容应明确作者归属，并保留适用的第三方声明。许可范围见 [NOTICE.md](NOTICE.md)。

安全问题见 [SECURITY.md](SECURITY.md)。生产环境请使用 HTTPS、独立数据库、最小权限的存储凭据，并让反向代理覆盖 `X-Real-IP`。

## 许可与署名

原项目作者为 [Sam Becker](https://github.com/sambecker)，本分支由 [Strtus](https://github.com/Strtus) 维护。本项目是非官方、社区维护的自托管版本，主要面向中国大陆网络环境，与原项目没有隶属关系。

Strtus 拥有版权的新增与修改内容采用未经改写的 [PolyForm Noncommercial License 1.0.0](LICENSE.md)，SPDX 标识为 `PolyForm-Noncommercial-1.0.0`。

上游代码继续适用 Sam Becker 在 [issue #398](https://github.com/sambecker/exif-photo-blog/issues/398) 中给出的书面授权，记录见 [UPSTREAM_PERMISSION.md](UPSTREAM_PERMISSION.md)。PolyForm 许可仅覆盖 Strtus 拥有版权的贡献，不改变上游应用的许可。使用和分发组合后的应用时，需同时满足两部分适用的条款。详见 [NOTICE.md](NOTICE.md)。

Git 历史从当前自托管版本的初始快照开始，不包含此前的上游提交。字体许可证位于 `public/fonts/OFL.txt`。

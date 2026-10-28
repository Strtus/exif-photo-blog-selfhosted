Fork 自 [Sam Becker / exif-photo-blog](https://github.com/sambecker/exif-photo-blog)

原项目依赖的部分服务在中国大陆地区访问受限，这个分支添加了 Docker 自托管支持，可以直连自己的 PostgreSQL 和国内对象存储服务（比如腾讯云 COS），大幅提升了大陆地区的访问速度与稳定性

沿用了Next,React和TypeScript技术栈，并针对中文显示、大文件处理和移动端浏览进行了优化

[English](README.md) · [部署文档](docs/deployment.md) · [分支改动](docs/server-variant.md)

## 主要改动

- 支持 Docker Compose 部署，自带 PostgreSQL 和 S3 兼容存储
- 新增自定义存储 Endpoint 和图片域名配置，方便接入国内对象存储（COS、OSS 等）
- 补全中文界面，支持批量修改照片标题和拍摄地点
- 管理员密码改用 bcrypt 哈希，登录增加限流，修复了分页及照片可见性校验的问题
- 优化了大体积照片处理与移动端浏览的缓存机制，修复了超过40张图必白屏的bug


## 本地开发


>事实上你完全可以把这个仓库交给Agent让它自己去部署，但是对于那些坚持手搓的老艺术家 这里仍然提供了验证过的部署流程
  
需要 Node.js 22+、pnpm 11.0.9，以及一个 PostgreSQL 数据库和对象存储桶

在仓库目录下执行：

```sh
corepack enable
corepack prepare pnpm@11.0.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
node scripts/hash-password.mjs
```

（Windows PowerShell 把 `cp` 那行换成 `Copy-Item .env.example .env.local`）

密码脚本会输出两种格式，本地开发复制 Next.js local development 下面那行填进 .env.local 即可。主要环境变量说明如下：


| 变量 | 说明 |
|---|---|
| `POSTGRES_URL` | PostgreSQL 连接串，密码里的特殊字符要做 URL 编码 |
| `DISABLE_POSTGRES_SSL` | 默认 `0`；连接可信本地数据库且未启用 TLS 时填 `1` |
| `AUTH_SECRET` | 随机密钥，生成命令见下方 |
| `AUTH_URL` | 本地填 `http://localhost:3000`，部署后填站点的 HTTPS 地址 |
| `AUTH_TRUST_HOST` | 通过可信反向代理访问时填 `true` |
| `ADMIN_EMAIL` | 管理员邮箱 |
| `ADMIN_PASSWORD_HASH` | 上面脚本生成的密码哈希 |
| `NEXT_PUBLIC_DOMAIN` | 站点域名，如 `photos.example.com`，不带 `https://` |
| `NEXT_PUBLIC_LOCALE` | 中文填 `zh-cn`，英文填 `en-us` |
| `NEXT_PUBLIC_NAV_TITLE` | 站点标题 |

生成 `AUTH_SECRET`：

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
对象存储配置参考 [.env.example](.env.example) 填入桶名、区域、密钥和 Endpoint。支持 AWS S3、Cloudflare R2、MinIO，腾讯云 COS 直接走 S3 兼容接口即可。自定义图片域名填在 NEXT_PUBLIC_AWS_S3_PUBLIC_DOMAIN（不带 https://）。存储桶的 CORS 和公开读权限配置详见[部署文档](docs/deployment.md#storage)

配置完成后启动开发服

```sh
pnpm dev
```
打开http://localhost:3000 访问 /admin 登录后台上传照片。数据库表会在首次查询时自动初始化，无需手动导入结构


## Docker 部署

需开启 BuildKit，Docker Compose 版本需 >= 2.30

```sh
cp .env.example .env
```
按上面的说明填好 .env。注意这里的密码哈希要用脚本输出的 Docker Compose raw env file 那一行（不带反斜杠转义）。数据库地址请确保从容器内部可以访问（注意容器内的 localhost 指向容器自身，连宿主机数据库请用宿主机内网 IP 或 host.docker.internal）

```sh
docker compose build
docker compose up -d
```


服务默认监听宿主机的 127.0.0.1:3000，外面套一层 Nginx 或 Caddy 反代 HTTPS 即可。反代请求头和缓存配置参考部署文档

注意：`NEXT_PUBLIC_*` 开头的变量会在构建阶段打包进前端代码，修改这些变量后需要重新执行 docker compose build。数据库连接则在容器运行时读取


## 更新和备份

升级前建议先备份 PostgreSQL 数据库和存储桶，并保留上一版本的 Docker 镜像。更新后数据库表结构会在首次查询时自动迁移，具体流程见[部署文档](docs/deployment.md#operations)



## 许可

新增和修改的自有部分采用 [PolyForm Noncommercial 1.0.0](LICENSE.md)，限非商业用途。上游代码按[原作者授权](UPSTREAM_PERMISSION.md)使用。两部分的适用范围和署名见 [NOTICE.md](NOTICE.md)，字体许可见 [OFL.txt](public/fonts/OFL.txt)。

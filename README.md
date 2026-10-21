# EXIF Photo Blog

An unofficial, community-maintained self-hosted variant of [Sam Becker's EXIF Photo Blog](https://github.com/sambecker/exif-photo-blog), focused on self-hosting in mainland China. Built with Next.js, React, PostgreSQL and S3-compatible object storage.

**License:** custom non-commercial permission, not an OSI open-source license. See [LICENSE.md](LICENSE.md).

[中文说明](README.zh-CN.md) · [Deployment](docs/deployment.md) · [Variant history](docs/server-variant.md) · [Permission and license](LICENSE.md)

## Why this fork

- Runs outside Vercel with Docker Compose, PostgreSQL and S3-compatible storage (AWS S3, Cloudflare R2, MinIO).
- Designed for mainland China network conditions: domestic VPS, reverse proxy, and providers such as Tencent COS through the S3 API.
- Single-admin hardening: bcrypt password hashes, login throttling, bounded pagination and visibility checks.
- Chinese UI/localization, batch title/location editing and an editable About page.

This repository is a snapshot of a deployed self-hosted instance, not a merge of every upstream feature. AI Gateway configuration and some newer upstream options are not included.

## Features

**Gallery**

- Photo uploads with EXIF extraction; tags, albums, cameras, lenses, film and recipes.
- Full-size and masonry galleries, light/dark themes and Chinese localization.
- RSS/JSON feeds, OG image generation, Cmd-K search and optional AI-assisted descriptions.

**Admin**

- bcrypt admin authentication and per-process login throttling.
- Batch title/location editing and photo visibility controls.
- Editable About page with preserved line breaks.

**Deployment**

- S3-compatible storage with custom endpoints and public domains.
- Docker/standalone output, a loopback-bound app port and reverse-proxy guidance.

## Requirements

| Component | Requirement |
|---|---|
| Node.js | 22 or later (local development) |
| pnpm | 11.0.9 (`packageManager`) |
| Database | PostgreSQL; a dedicated database is recommended |
| Storage | S3-compatible bucket (AWS S3, Cloudflare R2, MinIO) or Vercel Blob |
| Docker | BuildKit and Compose 2.30+ for container deployment |
| Proxy | HTTPS reverse proxy for production |

## Quick start

```sh
corepack enable
corepack prepare pnpm@11.0.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env
node scripts/hash-password.mjs
pnpm dev
```

Windows PowerShell: `Copy-Item .env.example .env`.

Fill in `.env` before starting. The core variables are:

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` | PostgreSQL connection string; URL-encode the password |
| `DISABLE_POSTGRES_SSL` | Set to `1` only for a trusted local database |
| `AUTH_SECRET` | Random 32-byte hex secret; generation command in `.env.example` |
| `AUTH_URL` | Canonical origin, e.g. `http://localhost:3000` |
| `AUTH_TRUST_HOST` | `true` behind a trusted reverse proxy |
| `ADMIN_EMAIL` | Single admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash from `scripts/hash-password.mjs` |
| `NEXT_PUBLIC_DOMAIN` | Public hostname used in absolute URLs |
| `NEXT_PUBLIC_LOCALE` | `zh-cn` or `en-us` |
| `NEXT_PUBLIC_NAV_TITLE` | Navigation title |

Storage variables are documented in `.env.example` and [docs/deployment.md](docs/deployment.md). `NEXT_PUBLIC_*` values are public and embedded at build time.

Visit `/admin` to sign in and upload photos. The app creates missing tables and runs supported migrations on first query; back up the database before upgrades.

## Deploy

```sh
docker compose build
docker compose up -d
```

Requires Docker with BuildKit and Compose 2.30 or later. The build reads `.env` as a BuildKit secret for public values; the database is accessed at runtime. `localhost` inside Docker does not refer to the host. The app binds `127.0.0.1:3000`; put an HTTPS reverse proxy in front of it. See [deployment instructions](docs/deployment.md).

## Operations

- Back up PostgreSQL and object storage separately; neither is bundled in the image.
- Retain the previous image for rollback.
- Read `docs/deployment.md` before upgrades; migrations run on demand.
- Visibility controls hide photos from gallery queries, but public object URLs remain public. Review EXIF/GPS before publishing.

## Development checks

```sh
pnpm typecheck
pnpm lint
pnpm build
```

The build needs the `NEXT_PUBLIC_*` build-time variables; it does not require a live database in this snapshot.

## Contributing

Issues and focused pull requests are welcome. Include reproduction steps and avoid posting credentials, private images or server details. This project is non-commercial; commercial use requires permission from the original author.

## Security

See [SECURITY.md](SECURITY.md). Use HTTPS, a dedicated database, scoped storage credentials and a reverse proxy that overwrites `X-Real-IP`. The login limiter is per-process; multi-instance deployments need shared rate limiting or edge protection.

## License and attribution

Original project by [Sam Becker](https://github.com/sambecker); this variant is maintained by [Strtus](https://github.com/Strtus). This is an unofficial, community-maintained adaptation focused on self-hosting in mainland China, and is not affiliated with the original project.

On 2026-08-26, Sam Becker granted permission to publish this repository as a derivative project for non-commercial self-hosted use, with attribution. The grant is recorded in [issue #398](https://github.com/sambecker/exif-photo-blog/issues/398). See [LICENSE.md](LICENSE.md) and [NOTICE.md](NOTICE.md). This is a custom permission notice, not an OSI-approved open-source license.

Git history starts with the self-hosted snapshot; earlier upstream commits are not included. Font licensing is retained in `public/fonts/OFL.txt`.

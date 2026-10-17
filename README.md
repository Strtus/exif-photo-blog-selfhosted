# EXIF Photo Blog

A self-hosted photography gallery built with Next.js, React, PostgreSQL and object storage. This repository contains the server variant of [Sam Becker's EXIF Photo Blog](https://github.com/sambecker/exif-photo-blog).

[中文说明](README.zh-CN.md) · [Deployment](docs/deployment.md) · [Variant history](docs/server-variant.md) · [License status](NOTICE.md)

## Features

- Photo uploads, EXIF extraction, tags, albums and camera/lens browsing.
- Full-size and masonry galleries, dark/light themes and Chinese localization.
- Admin authentication with bcrypt password hashes and per-process login throttling.
- S3-compatible endpoints, public storage domains and optional direct image loading.
- Batch title/location editing and photo visibility controls.
- Editable About page with preserved line breaks and Chinese font fallbacks.

## Run locally

Use Node.js 22 or later, pnpm 11.0.9, a dedicated PostgreSQL database and a supported object store.

```sh
corepack enable
corepack prepare pnpm@11.0.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env
node scripts/hash-password.mjs
pnpm dev
```

Fill in `.env` before starting. Generate `AUTH_SECRET`, set `ADMIN_EMAIL` and configure `ADMIN_PASSWORD_HASH` using the hash helper's instructions. For development set `AUTH_URL=http://localhost:3000`. Visit `/admin` to sign in and upload photos. Storage credentials are required for uploads. The app initializes missing tables and runs supported migrations on demand; use a dedicated database and back it up before upgrades.

## Deploy

```sh
docker compose build
docker compose up -d
```

Requires Docker with BuildKit and Compose 2.30 or later. Configure a database reachable from the build environment and container; `localhost` inside Docker does not refer to the host. Put an HTTPS reverse proxy in front of the loopback-bound application port. See [deployment instructions](docs/deployment.md).

## Development checks

```sh
pnpm typecheck
pnpm test:ci
pnpm lint
pnpm build
```

A production build requires the configured services. Unit tests use mocks and do not establish compatibility with every storage provider. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Attribution and release status

Original project by [Sam Becker](https://github.com/sambecker); this variant is maintained by [Strtus](https://github.com/Strtus). This repository starts with a self-hosted snapshot; earlier upstream commits are not included in its Git history. No application-code license was found in the imported tree: see [NOTICE.md](NOTICE.md). Font licensing is retained in `public/fonts/OFL.txt`.

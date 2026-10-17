# Configuration and deployment

## Environment files

Copy `.env.example` to `.env` and supply your own values. Never commit environment files, database dumps, authentication hashes or storage keys. `NEXT_PUBLIC_*` values are embedded in the build and public; do not put secrets in them. Rebuild after changing public settings.

Docker uses `.env` as a BuildKit secret during compilation and as the runtime environment file. Compose uses `format: raw` to preserve dollar signs in bcrypt hashes. Keep runtime values unquoted and unescaped. Next.js expands dollar signs when reading dotenv locally. The password helper prints an escaped form for `.env.local`; use that only for local development. Do not reuse the escaped file as the Compose runtime env file. Authentication at runtime uses the raw environment supplied by Compose.

The Dockerfile removes `.env` files from standalone output. Database credentials are not supplied as build arguments. Use a dedicated build/staging database when possible: rendering may initialize tables and execute supported migrations.

## Database

`POSTGRES_URL` is a PostgreSQL URL; URL-encode password characters. TLS is enabled by default. `DISABLE_POSTGRES_SSL=1` is for a trusted local connection only. Back up existing databases before updates. Migration behavior is implemented in `src/db/query.ts` and `src/db/migration.ts`.

## Storage

For S3-compatible storage, configure the bucket, region, access key and secret. Set `AWS_S3_ENDPOINT` for a custom API endpoint. Set `NEXT_PUBLIC_AWS_S3_PUBLIC_DOMAIN` to the public hostname without a scheme, and optionally `NEXT_PUBLIC_AWS_S3_KEY_PREFIX` to a directory prefix. Browser uploads require a bucket CORS policy allowing your gallery origin and required methods. The S3 adapter requests `public-read` object ACLs; verify that your bucket/provider supports this policy. Use a bucket intended for public photographs.

Vercel Blob, Cloudflare R2 and MinIO adapters are also present. Their environment names are defined in `src/app/config.ts` and `src/platforms/storage/`; the example focuses on S3-compatible storage.

## HTTPS reverse proxy

The app listens on `127.0.0.1:3000` on the host. Terminate HTTPS at your proxy, set `Host`, `X-Forwarded-Proto`, and overwrite `X-Real-IP` with the actual client address. The login limiter trusts this last header. Keep the application port private and do not forward client-supplied IP headers unchanged. For another proxy or CDN in front, configure trusted address ranges before deriving the client IP.

Do not cache `/admin`, `/api`, non-GET requests or authenticated responses. No proxy cache is needed to get started. Set `AUTH_URL` to the canonical HTTPS origin and configure trusted host handling for your deployment.

The login limiter is in memory, per process, and resets on restart. Multi-instance deployments need a shared limiter or edge protection.

## Operations

Back up PostgreSQL and object storage separately; neither is bundled in this repository or image. Retain the previous image for rollback. Keep runtime settings consistent with the build. Check `/`, `/about`, `/sign-in` and protected `/admin/photos` after deployment, then test upload/edit/delete with disposable photos in a staging bucket.

Visibility controls hide photos from gallery queries; public object URLs remain public. Review EXIF/GPS content and original files before publishing sensitive photographs.

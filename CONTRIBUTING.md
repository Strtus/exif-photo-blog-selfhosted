# Contributing

Start from a branch and use a separate development database and storage bucket. Install pinned dependencies, then run `pnpm typecheck`, `pnpm test:ci` and `pnpm lint`. For build or deployment changes, also build with non-production configuration and verify affected routes.

Describe the user-visible change and validation in pull requests. Preserve upstream attribution and bundled notices. Do not commit environment files, credentials, real user data, photo originals or database exports. Use synthetic fixtures and `example.com` domains in tests and examples.

Authentication, photo visibility, migration and upload changes should include regression tests. Document new environment variables in `.env.example` and `docs/deployment.md`. See `NOTICE.md` for application-code licensing status.

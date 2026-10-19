# Server variant

This branch imports deployed application source captured on 2026-10-17. It is a server snapshot, not a merge of every newer upstream feature. Repository history starts with this snapshot; earlier upstream commits are not included.

Included changes cover bcrypt admin authentication, login throttling and callback validation; bounded pagination and visibility checks; S3-compatible endpoints and prefix handling; image fetching and scrolling; batch title/location editing; Chinese translations; and About-page line breaks and typography.

Packaging adds environment examples, generic Docker Compose configuration, deployment documentation. Production environment files, database contents, photo objects, host-specific deployment scripts and server paths are excluded.

The snapshot uses Next.js 16.2.12 and React 19.2.6. Refer to the lockfile for exact dependencies. Some newer upstream options, including AI Gateway configuration, are not part of this snapshot. Validate future upstream merges explicitly instead of assuming feature parity.

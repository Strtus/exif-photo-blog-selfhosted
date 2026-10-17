# Security reports

Do not disclose credentials, private images or exploit details in a public issue. Use GitHub's private vulnerability reporting when enabled; otherwise arrange a private channel with the repository owner before sharing sensitive details.

Use HTTPS, a dedicated database and scoped storage credentials. The sample deployment assumes a trusted reverse proxy. The login limiter is per-process and storage uses public image URLs; see `docs/deployment.md` for these boundaries.

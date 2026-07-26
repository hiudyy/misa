# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## 1.1.0 - 2026-07-26

- Global message dispatcher with configurable concurrency and bounded backlog.
- Background media jobs that no longer block message processing slots.
- In-memory config/group caches and faster admin checks.
- Batched group activity persistence with graceful shutdown flush.

## 1.0.0 - 2026-07-26

- Stable modular command and event architecture.
- Eleven synchronized locales.
- Atomic JSON persistence and schema migrations.
- Bounded media queue, streaming downloads and FFmpeg concurrency.
- Modular YouTube providers with fallback and cooldown.
- Validated build, auto-update staging/rollback, metrics, coverage and mutation testing.

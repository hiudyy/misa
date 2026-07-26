<!-- locale: de; docs-version: 1 -->
# Architektur

Der Hauptfluss lautet WhatsApp -> `MessageHandler` -> Chat-Warteschlange -> `messageProcessor` -> Autorisierung -> Befehl. Ein Chat bleibt geordnet, verschiedene Chats laufen parallel. Schwere Aufgaben gehen durch `MediaQueue`, die Parallelität, timeout und FFmpeg begrenzt.

```mermaid
flowchart LR
 WA[WhatsApp] --> MH[MessageHandler]
 MH --> CQ[Chat-Queue]
 CQ --> MP[MessageProcessor]
 MP --> A[Autorisierung]
 A --> C[Befehl]
 C --> MQ[MediaQueue]
 MQ --> P[Providers/FFmpeg]
```

Befehle liegen in `src/commands`, Events in `src/events`, i18n-Dateien in `src/i18n`, atomare Speicherung in `src/storage`. Lifecycle entfernt Listener, leert Queues und schließt den Socket.

YouTube verwendet getrennte Provider mit Retry, Cooldown und Fallback. Downloads werden gestreamt. auto-update fixiert einen `main`-Commit, prüft Staging, erstellt Backups und führt Rollback aus. `statusbot` zeigt aggregierte Metriken.

Neue Funktionen folgen `Command`, `Event` oder `YouTubeProvider`; Übersetzungen müssen in alle 11 i18n-Dateien und Tests nach `tests/`. Vor einem PR `npm run verify` ausführen.

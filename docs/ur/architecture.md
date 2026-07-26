<!-- locale: ur; docs-version: 1 -->
# آرکیٹیکچر

مرکزی flow WhatsApp -> `MessageHandler` -> فی chat queue -> `messageProcessor` -> authorization -> command ہے۔ ایک chat کے پیغامات ترتیب میں رہتے ہیں اور مختلف chats متوازی چلتے ہیں۔ بھاری کام `MediaQueue` میں جاتے ہیں جو concurrency، timeout اور FFmpeg محدود کرتی ہے۔

```mermaid
flowchart LR
 WA[WhatsApp] --> MH[MessageHandler]
 MH --> CQ[Chat queue]
 CQ --> MP[MessageProcessor]
 MP --> A[Authorization]
 A --> C[Command]
 C --> MQ[MediaQueue]
 MQ --> P[Providers/FFmpeg]
```

Commands `src/commands`، events `src/events`، i18n dictionaries `src/i18n` اور atomic storage `src/storage` میں ہیں۔ Lifecycle listeners ہٹاتا، queues drain کرتا اور socket بند کرتا ہے۔

YouTube الگ providers، retry، cooldown اور fallback استعمال کرتا ہے۔ Downloads streaming سے ہوتے ہیں۔ auto-update `main` commit مقرر کرتا، staging validate کرتا، backup اور rollback کرتا ہے۔ `statusbot` aggregated metrics دکھاتا ہے۔

توسیع کے لیے `Command`، `Event` یا `YouTubeProvider` implement کریں، تمام 11 i18n files میں key، `tests/` میں tests شامل کریں اور `npm run verify` چلائیں۔

<!-- locale: bn; docs-version: 1 -->
# আর্কিটেকচার

মূল flow WhatsApp -> `MessageHandler` -> global dispatcher -> `messageProcessor` -> authorization -> command। Chat ক্রম ছাড়া 10 বার্তা সমান্তরালে চলে এবং 200 অপেক্ষা করতে পারে। Media `MediaQueue` দিয়ে background-এ চলে।

```mermaid
flowchart LR
 WA[WhatsApp] --> MH[MessageHandler]
 MH --> CQ[Global dispatcher]
 CQ --> MP[MessageProcessor]
 MP --> A[Authorization]
 A --> C[Command]
 C --> MQ[MediaQueue]
 MQ --> P[Providers/FFmpeg]
```

Commands `src/commands`, events `src/events`, i18n dictionaries `src/i18n` এবং atomic storage `src/storage`-এ। Lifecycle listeners সরায়, queues drain করে ও socket বন্ধ করে।

YouTube আলাদা providers, retry, cooldown ও fallback ব্যবহার করে। Downloads streaming-এর মাধ্যমে temporary file-এ যায়। auto-update নির্দিষ্ট `main` commit বেছে staging validate, backup ও rollback করে। `statusbot` aggregated metrics দেখায়।

বর্ধিত করতে `Command`, `Event` বা `YouTubeProvider` implement করুন, 11 i18n file-এ key, `tests/`-এ test যোগ করুন এবং `npm run verify` চালান।

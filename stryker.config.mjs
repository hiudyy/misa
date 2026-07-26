/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    "src/media/mediaQueue.ts",
    "src/media/downloadToTemp.ts",
    "src/media/ffmpegLimiter.ts",
    "src/helpers/youtube/providerPool.ts",
    "src/handlers/messageDispatcher.ts",
  ],
  testRunner: "command",
  commandRunner: {
    command: "node --test --import tsx tests/mediaQueue.test.ts tests/messageDispatcher.test.ts tests/downloadToTemp.test.ts tests/ffmpegLimiter.test.ts tests/youtubeProviderPool.test.ts tests/runtimeConfig.test.ts",
  },
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  coverageAnalysis: "off",
  reporters: ["clear-text", "progress", "html"],
  thresholds: {
    high: 85,
    low: 70,
    break: 70,
  },
  concurrency: 2,
  timeoutMS: 10_000,
  timeoutFactor: 2,
  tempDirName: ".stryker-tmp",
};

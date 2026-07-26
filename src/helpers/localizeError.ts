/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */

/** Códigos estáveis lançados pelos helpers; traduzidos na borda do comando. */
export const ErrorCode = {
  DOWNLOAD_NOT_FOUND: "DOWNLOAD_NOT_FOUND",
  DOWNLOAD_NO_MEDIA: "DOWNLOAD_NO_MEDIA",
  DOWNLOAD_INVALID_URL: "DOWNLOAD_INVALID_URL",
  DOWNLOAD_TIMEOUT: "DOWNLOAD_TIMEOUT",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
  DOWNLOAD_NO_DATA: "DOWNLOAD_NO_DATA",
  DOWNLOAD_PIN_ID: "DOWNLOAD_PIN_ID",
  DOWNLOAD_LINK_NOT_FOUND: "DOWNLOAD_LINK_NOT_FOUND",
  STICKER_DOWNLOAD_FAILED: "STICKER_DOWNLOAD_FAILED",
  STICKER_EMPTY_DOWNLOAD: "STICKER_EMPTY_DOWNLOAD",
  STICKER_INVALID_INPUT: "STICKER_INVALID_INPUT",
  STICKER_CONVERSION_FAILED: "STICKER_CONVERSION_FAILED",
  STICKER_INVALID_BUFFER: "STICKER_INVALID_BUFFER",
  MEDIA_DOWNLOAD_TOO_LARGE: "MEDIA_DOWNLOAD_TOO_LARGE",
  MEDIA_ABORTED: "MEDIA_ABORTED",
  INVALID_URL: "invalid_url",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

const CODE_TO_KEY: Record<string, string> = {
  [ErrorCode.DOWNLOAD_NOT_FOUND]: "errors.download.notFound",
  [ErrorCode.DOWNLOAD_NO_MEDIA]: "errors.download.noMedia",
  [ErrorCode.DOWNLOAD_INVALID_URL]: "errors.download.invalidUrl",
  [ErrorCode.DOWNLOAD_TIMEOUT]: "errors.download.timeout",
  [ErrorCode.DOWNLOAD_FAILED]: "errors.download.failed",
  [ErrorCode.DOWNLOAD_NO_DATA]: "errors.download.noData",
  [ErrorCode.DOWNLOAD_PIN_ID]: "errors.download.pinId",
  [ErrorCode.DOWNLOAD_LINK_NOT_FOUND]: "errors.download.linkNotFound",
  [ErrorCode.STICKER_DOWNLOAD_FAILED]: "errors.sticker.downloadFailed",
  [ErrorCode.STICKER_EMPTY_DOWNLOAD]: "errors.sticker.emptyDownload",
  [ErrorCode.STICKER_INVALID_INPUT]: "errors.sticker.invalidInput",
  [ErrorCode.STICKER_CONVERSION_FAILED]: "errors.sticker.conversionFailed",
  [ErrorCode.STICKER_INVALID_BUFFER]: "errors.sticker.invalidBuffer",
  [ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE]: "errors.media.tooLarge",
  [ErrorCode.MEDIA_ABORTED]: "errors.media.aborted",
  [ErrorCode.INVALID_URL]: "errors.download.invalidUrl",
};

type Translator = (key: string, vars?: Record<string, string>) => string;

/**
 * Converte erro (código estável ou mensagem) em texto localizado para o usuário.
 */
export function localizeError(
  error: unknown,
  t: Translator,
  fallbackKey = "common.unknown",
): string {
  if (!(error instanceof Error)) return t(fallbackKey);

  const code = error.message.split(":")[0]?.trim() ?? error.message;
  const key = CODE_TO_KEY[code] ?? CODE_TO_KEY[error.message];
  if (key) return t(key);

  // Provider wraps: "DOWNLOAD_FAILED: detail" already handled by split;
  // leftover Portuguese/internal should not leak — use generic failed.
  if (/^[A-Z][A-Z0-9_]+$/.test(error.message)) {
    return t("errors.download.failed");
  }

  return t(fallbackKey);
}

export function isErrorCode(error: unknown, code: ErrorCodeValue): boolean {
  return error instanceof Error && (error.message === code || error.message.startsWith(`${code}:`));
}

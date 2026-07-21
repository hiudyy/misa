/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 *
 * ATENÇÃO: RCE intencional restrito ao dono (`ownerOnly`).
 * O contexto expõe o socket `misa` de propósito para manutenção.
 * O timeout do `vm` cobre só o código síncrono; trabalho async pós-retorno
 * não é cancelado automaticamente.
 */
import { WAMessage } from "baileys";
import vm from "node:vm";
import { Command } from "../../../types/Command.js";

const MAX_CODE_LENGTH = 2000;
const EVAL_TIMEOUT_MS = 5000;

/** Globals seguros expostos ao sandbox (sem process/require/global). */
function createEvalSandbox(misa: unknown, message: unknown, args: string[]) {
  return {
    misa,
    message,
    args,
    console: {
      log: (...items: unknown[]) => console.log("[EVAL]", ...items),
      warn: (...items: unknown[]) => console.warn("[EVAL]", ...items),
      error: (...items: unknown[]) => console.error("[EVAL]", ...items),
      info: (...items: unknown[]) => console.info("[EVAL]", ...items),
    },
    Math,
    JSON,
    Date,
    Buffer,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Promise,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    encodeURIComponent,
    decodeURI,
    decodeURIComponent,
  };
}

const evalCommand: Command = {
  name: "eval",
  aliases: ["ev", "exec"],
  description: "Runs JavaScript code (DANGEROUS - owner only)",
  category: "all",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.eval.noArgs") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const code = args.join(" ");

    if (code.length > MAX_CODE_LENGTH) {
      await misa.sendMessage(
        from,
        { text: t("commands.eval.tooLong", { max: String(MAX_CODE_LENGTH) }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    try {
      const context = vm.createContext(createEvalSandbox(misa, message, args));

      const wrappedCode = `(async () => { ${code} })()`;
      const result = await vm.runInContext(wrappedCode, context, {
        timeout: EVAL_TIMEOUT_MS,
        displayErrors: true,
      });

      const output = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);

      await misa.sendMessage(
        from,
        {
          text: t("commands.eval.success", { code, output: output.split("\n").map((line) => `│ ${line}`).join("\n") }),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.eval.error", { code, error: String(error) }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default evalCommand;
export { MAX_CODE_LENGTH, EVAL_TIMEOUT_MS, createEvalSandbox };

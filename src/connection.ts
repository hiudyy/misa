/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { paths } from "./config/paths.js";
import { groupCache } from "./cache/groupCache.js";
import { log } from "./logger.js";
import { hasValidSession } from "./helpers/hasValidSession.js";

const logger = pino({ level: "silent" });

type DisconnectInfo = {
  title: string;
  description: string;
  action: string;
  shouldReconnect: boolean;
};

function getDisconnectInfo(statusCode?: number): DisconnectInfo {
  switch (statusCode) {
    case DisconnectReason.loggedOut:
      return {
        title: "Sessao desconectada",
        description: "O WhatsApp encerrou esta sessao ou ela foi removida dos aparelhos conectados.",
        action: "Vou limpar a sessao local. Inicie novamente para gerar um novo QR.",
        shouldReconnect: false,
      };
    case DisconnectReason.forbidden:
      return {
        title: "Acesso negado",
        description: "O WhatsApp recusou a conexao desta sessao.",
        action: "Confira as credenciais, aguarde alguns minutos e gere uma nova sessao se continuar falhando.",
        shouldReconnect: false,
      };
    case DisconnectReason.connectionLost:
      return {
        title: "Conexao perdida ou expirada",
        description: "A rede caiu, oscilou ou a tentativa demorou demais para responder.",
        action: "Vou tentar reconectar automaticamente.",
        shouldReconnect: true,
      };
    case DisconnectReason.multideviceMismatch:
      return {
        title: "Incompatibilidade multi-device",
        description: "A sessao nao bate com o protocolo multi-device esperado pelo WhatsApp.",
        action: "Atualize o Baileys/dependencias e gere uma nova sessao se necessario.",
        shouldReconnect: false,
      };
    case DisconnectReason.connectionClosed:
      return {
        title: "Conexao fechada",
        description: "A conexao foi fechada pelo WhatsApp ou pela rede.",
        action: "Vou tentar reconectar automaticamente.",
        shouldReconnect: true,
      };
    case DisconnectReason.connectionReplaced:
      return {
        title: "Conexao substituida",
        description: "Outra instancia conectou usando a mesma sessao.",
        action: "Feche a outra instancia antes de iniciar esta novamente.",
        shouldReconnect: false,
      };
    case DisconnectReason.badSession:
      return {
        title: "Sessao invalida",
        description: "Os arquivos de autenticacao parecem corrompidos ou invalidos.",
        action: `Apague ${paths.auth} e escaneie um novo QR code.`,
        shouldReconnect: false,
      };
    case DisconnectReason.unavailableService:
      return {
        title: "Servico indisponivel",
        description: "O WhatsApp ou a rota de conexao esta temporariamente indisponivel.",
        action: "Vou tentar reconectar automaticamente.",
        shouldReconnect: true,
      };
    case DisconnectReason.restartRequired:
      return {
        title: "Reinicio necessario",
        description: "O servidor pediu que o cliente fosse reiniciado.",
        action: "Vou reiniciar a conexao automaticamente.",
        shouldReconnect: true,
      };
    default:
      return {
        title: "Conexao encerrada",
        description: "A conexao foi fechada por um motivo nao mapeado.",
        action: "Vou tentar reconectar automaticamente.",
        shouldReconnect: true,
      };
  }
}

function logDisconnect(statusCode?: number): boolean {
  const info = getDisconnectInfo(statusCode);
  const status = statusCode ?? "desconhecido";

  log.box(
    "CONNECTION",
    "Conexao encerrada",
    [`Codigo: ${status}`, `Motivo: ${info.title}`, `Detalhe: ${info.description}`, `Acao: ${info.action}`],
    info.shouldReconnect ? "yellow" : "red",
  );

  return info.shouldReconnect;
}

async function clearAuthSession(): Promise<void> {
  try {
    await fs.rm(paths.auth, { force: true, recursive: true });
    log.success("CONNECTION", "Sessao local removida. Inicie novamente para gerar um novo QR.");
  } catch (error) {
    log.error("CONNECTION", `Nao foi possivel remover ${paths.auth}.`, error);
  }
}

export async function createConnection(authMode: "qr" | "pairing" = "qr", phoneNumber?: string): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(paths.auth);
  const { version } = await fetchLatestBaileysVersion();

  // Verifica se já existe uma sessão válida
  const hasSession = await hasValidSession();
  if (hasSession) {
    log.info("CONNECTION", "Sessao existente detectada. Conectando automaticamente...");
  }

  const misa = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.ubuntu("Misa"),
  });

  misa.ev.on("creds.update", saveCreds);
  groupCache.registerEvents(misa);

  let pairingRequested = false;

  misa.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Se já tem sessão válida, não exibe QR/Pairing
      if (hasSession) {
        return;
      }

      if (authMode === "pairing" && !pairingRequested && phoneNumber) {
        pairingRequested = true;
        misa.requestPairingCode(phoneNumber).then((code) => {
          log.box("PAIRING", "Codigo de vinculacao", [`Codigo: ${code}`, "Digite no WhatsApp: Aparelhos conectados > Vincular aparelho > Vincular com numero de telefone."], "magenta");
        }).catch((error) => {
          log.error("PAIRING", "Erro ao solicitar pairing code.", error);
        });
        return;
      }

      // Só exibe QR se o modo for QR
      if (authMode === "qr") {
        log.box("QR", "QR code recebido", ["Escaneie com o WhatsApp para conectar esta sessao."], "magenta");
        qrcode.generate(qr, { small: true });
      } else if (authMode === "pairing") {
        // Se já solicitou pairing, apenas informa que o código expirou
        if (pairingRequested) {
          log.warn("PAIRING", "Codigo de vinculacao expirado. Solicitando novo codigo...");
          if (phoneNumber) {
            misa.requestPairingCode(phoneNumber).then((code) => {
              log.box("PAIRING", "Novo codigo de vinculacao", [`Codigo: ${code}`, "Digite no WhatsApp: Aparelhos conectados > Vincular aparelho > Vincular com numero de telefone."], "magenta");
            }).catch((error) => {
              log.error("PAIRING", "Erro ao solicitar novo pairing code.", error);
            });
          }
        }
      }
    }

    if (connection === "connecting") {
      log.info("CONNECTION", "Conectando ao WhatsApp...");
    }

    if (connection === "open") {
      log.success("CONNECTION", "Conectado com sucesso.");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
      const shouldReconnect = logDisconnect(statusCode);

      if (shouldReconnect) {
        log.info("CONNECTION", "Tentando reconectar...");
      }

      if (statusCode === DisconnectReason.loggedOut) {
        void clearAuthSession();
      }
    }
  });

  return misa;
}

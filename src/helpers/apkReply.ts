/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WAMessage, WASocket } from "baileys";
import {
  buildModyoloAppInfoText,
  getModyoloAppInfo,
  getModyoloDownloadLink,
  getModyoloVersions,
  shortenUrl,
} from "./modyoloDownload.js";
import { deleteApkSession, getApkSession, setApkSession } from "./apkSession.js";
import { downloadToTemp } from "../media/downloadToTemp.js";
import { runMediaJob } from "../media/runMediaJob.js";

type Translator = (key: string, vars?: Record<string, string>) => string;

async function sendText(
  misa: WASocket,
  from: string,
  text: string,
  message?: proto.IWebMessageInfo,
): Promise<void> {
  await misa.sendMessage(from, { text }, message ? { quoted: message as WAMessage } : undefined);
}

/**
 * Processa resposta numérica de uma sessão ativa do comando apk.
 * Retorna true se a mensagem foi consumida pela sessão.
 */
export async function tryHandleApkReply(params: {
  misa: WASocket;
  from: string;
  sender: string;
  body: string;
  message: proto.IWebMessageInfo;
  t: Translator;
}): Promise<boolean> {
  const { misa, from, sender, body, message, t } = params;
  const session = getApkSession(from, sender);
  if (!session) return false;

  const input = body.trim();
  const num = Number(input);
  if (!Number.isInteger(num)) {
    await sendText(misa, from, t("commands.apk.invalidOption"), message);
    return true;
  }

  if (session.step === "select_app") {
    if (num < 1 || num > session.results.length) {
      await sendText(
        misa,
        from,
        t("commands.apk.invalidRange", { max: String(session.results.length) }),
        message,
      );
      return true;
    }

    const selected = session.results[num - 1];

    try {
      const appInfo = await getModyoloAppInfo(selected.url);
      const imgURL = appInfo.bannerURL || appInfo.imageURL;
      const infoMsg = buildModyoloAppInfoText(appInfo, t);

      if (imgURL) {
        await runMediaJob({ misa, from, sender, kind: "apk-banner", t }, async (signal) => {
          const media = await downloadToTemp({ url: imgURL, kind: "image", signal });
          try {
            await misa.sendMessage(from, { image: { url: media.path }, caption: infoMsg }, { quoted: message as WAMessage });
          } finally {
            await media.cleanup();
          }
        });
      } else {
        await sendText(misa, from, infoMsg, message);
      }

      if (!appInfo.downloadPage) {
        if (appInfo.downloadURL) {
          const shortURL = await shortenUrl(appInfo.downloadURL);
          await sendText(
            misa,
            from,
            t("commands.apk.downloadReady", { name: appInfo.name, url: shortURL }),
            message,
          );
        } else {
          await sendText(misa, from, t("commands.apk.fetchError"), message);
        }
        deleteApkSession(from, sender);
        return true;
      }

      const { versions, directDownloadID } = await getModyoloVersions(appInfo.downloadPage);

      if (directDownloadID) {
        const downloadURL = await getModyoloDownloadLink(directDownloadID, appInfo.downloadPage);
        const shortURL = await shortenUrl(downloadURL);
        await sendText(
          misa,
          from,
          t("commands.apk.downloadReady", { name: appInfo.name, url: shortURL }),
          message,
        );
        deleteApkSession(from, sender);
        return true;
      }

      if (versions.length === 0) {
        if (appInfo.downloadURL) {
          const shortURL = await shortenUrl(appInfo.downloadURL);
          await sendText(
            misa,
            from,
            t("commands.apk.downloadReady", { name: appInfo.name, url: shortURL }),
            message,
          );
        } else {
          await sendText(misa, from, t("commands.apk.downloadError"), message);
        }
        deleteApkSession(from, sender);
        return true;
      }

      let verMsg = t("commands.apk.versionsTitle", { name: appInfo.name }) + "\n\n";
      for (let i = 0; i < versions.length; i++) {
        verMsg += `*${i + 1}.* ${versions[i].version} - ${versions[i].size}\n`;
      }
      verMsg += `\n${t("commands.apk.selectVersion")}`;
      await sendText(misa, from, verMsg, message);

      setApkSession({
        ...session,
        step: "select_version",
        appInfo,
        versions,
        createdAt: Date.now(),
      });
    } catch {
      await sendText(misa, from, t("commands.apk.fetchError"), message);
      deleteApkSession(from, sender);
    }

    return true;
  }

  if (session.step === "select_version") {
    if (!session.appInfo || !session.versions) {
      deleteApkSession(from, sender);
      return false;
    }

    if (num < 1 || num > session.versions.length) {
      await sendText(
        misa,
        from,
        t("commands.apk.invalidRange", { max: String(session.versions.length) }),
        message,
      );
      return true;
    }

    const selected = session.versions[num - 1];

    try {
      const downloadURL = await getModyoloDownloadLink(selected.downloadID, session.appInfo.downloadPage);
      const shortURL = await shortenUrl(downloadURL);
      await sendText(
        misa,
        from,
        t("commands.apk.downloadReadyVersion", {
          name: session.appInfo.name,
          version: selected.version,
          size: selected.size,
          url: shortURL,
        }),
        message,
      );
    } catch {
      await sendText(misa, from, t("commands.apk.downloadError"), message);
    }

    deleteApkSession(from, sender);
    return true;
  }

  return true;
}

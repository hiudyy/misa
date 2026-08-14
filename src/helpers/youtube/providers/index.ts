import type { YouTubeProvider } from "../types.js";
import { nayanProvider } from "./nayan.js";
import { flvtoProvider } from "./flvto.js";
import { ytconvertProvider } from "./ytconvert.js";
import { nevercapProvider } from "./nevercap.js";
import { oceansaverProvider } from "./oceansaver.js";
import { savetubeProvider } from "./savetube.js";
import { lukaProvider } from "./luka.js";

export const youtubeProviders: YouTubeProvider[] = [
  savetubeProvider,
  nayanProvider,
  flvtoProvider,
  lukaProvider,
  ytconvertProvider,
  nevercapProvider,
  oceansaverProvider,
];

export {
  nayanProvider,
  flvtoProvider,
  ytconvertProvider,
  nevercapProvider,
  oceansaverProvider,
  savetubeProvider,
  lukaProvider,
};

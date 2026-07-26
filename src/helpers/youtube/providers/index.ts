import type { YouTubeProvider } from "../types.js";
import { nayanProvider } from "./nayan.js";
import { flvtoProvider } from "./flvto.js";
import { ytconvertProvider } from "./ytconvert.js";
import { nevercapProvider } from "./nevercap.js";
import { oceansaverProvider } from "./oceansaver.js";
import { savetubeProvider } from "./savetube.js";
import { bronxyshostProvider } from "./bronxyshost.js";
import { lukaProvider } from "./luka.js";

export const youtubeProviders: YouTubeProvider[] = [
  nayanProvider,
  flvtoProvider,
  ytconvertProvider,
  nevercapProvider,
  oceansaverProvider,
  savetubeProvider,
  bronxyshostProvider,
  lukaProvider,
];

export {
  nayanProvider,
  flvtoProvider,
  ytconvertProvider,
  nevercapProvider,
  oceansaverProvider,
  savetubeProvider,
  bronxyshostProvider,
  lukaProvider,
};

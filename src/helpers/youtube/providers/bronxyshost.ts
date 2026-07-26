import type { YouTubeProvider } from "../types.js";
import { BRONXYSHOST_KEY } from "../providerHttp.js";

export const bronxyshostProvider: YouTubeProvider = {
  name: "bronxyshost",
  async resolve(videoURL, format) {
    const endpoint = format === "mp4" ? "play_video" : "play";
    return {
      url: `https://api.bronxyshost.com.br/api-bronxys/${endpoint}?nome_url=${encodeURIComponent(videoURL)}&apikey=${encodeURIComponent(BRONXYSHOST_KEY)}`,
      title: videoURL,
      quality: format === "mp4" ? "video" : "audio",
      ext: format,
    };
  },
};

/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
declare module "node-webpmux" {
  const webp: {
    Image: new () => {
      exif?: Buffer;
      load(buffer: Buffer): Promise<void>;
      save(output?: string | null): Promise<Buffer>;
    };
  };

  export default webp;
}
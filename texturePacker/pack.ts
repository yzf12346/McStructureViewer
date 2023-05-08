import * as fs from "fs/promises"
import * as fss from "fs"
import * as Path from "path";

async function readJson(path: string) {//{{{
  try {
    if (!fss.existsSync(path) || !fss.statSync(path).isFile()) {
      return undefined;
    }
    return JSON.parse(
      (await fs.readFile(path)).toString()
        .replace(/\/\/.*/g, "")
        .replace(/\/\*(\s|.)*?\*\//g, ""));
  } catch (e) {
    console.error(e);
    return undefined;
  }
}//}}}

class TextureData {//{{{
  get name() {
    return Path.parse(this.path).name;
  }
  get baseName() {
    return Path.parse(this.path).base;
  }
  path: string;
  color?: number;

  constructor(path: string, color?: number) {
    this.path = path;
    this.color = color;
  }
}//}}}
class File {//{{{
  isDirectory() {
    return fss.statSync(this.path).isDirectory();
  }
  isFile() {
    return fss.statSync(this.path).isFile();
  }
  get name() {
    return Path.parse(this.path).name;
  }
  get baseName() {
    return Path.parse(this.path).base;
  }
  get ext() {
    return Path.parse(this.path).ext;
  }
  path: string;

  constructor(path: string) {
    this.path = path;
  }
}//}}}
class ResourcePack {//{{{
  readonly path: string;
  readonly uuid: string;
  readonly name: string;
  readonly version: [number, number, number];

  constructor(path: string, uuid: string, name: string, version: [number, number, number] = [0, 0, 0]) {
    this.path = path;
    this.uuid = uuid;
    this.name = name;
    this.version = version;
  }
  getBlockTextures() {
    function readDir(path: string): File[] {
      if (!fss.existsSync(path)
        || !fss.statSync(path).isDirectory()) {
        return [];
      }
      return fss.readdirSync(path)
        .flatMap(v => {
          let f = new File(Path.join(path, v));
          if (f.isFile()) {
            return f;
          }
          return readDir(f.path);
        });
    }
    const file = readDir(Path.join(this.path, "textures/blocks"));
    return file;
  }
  getTexture(relpath: string) {
    const exts = [".png", ".tga", ".jpg"];
    for (let ext of exts) {
      let p = Path.join(this.path, `${relpath}${ext}`);
      if (fss.existsSync(p)
        && fss.statSync(p).isFIFO()) {
        return p;
      }
    }
  }
  async getBlocksJson() {
    const p = Path.join(this.path, "blocks.json");
    return await readJson(p);
  }
  async getTerrainJson() {
    const p = Path.join(this.path, "textures/terrain_texture.json");
    return await readJson(p);
  }
  static async load(respackDir: string): Promise<ResourcePack | undefined> {
    const manifestP = Path.join(respackDir, "manifest.json");
    let manifest = await readJson(manifestP);
    if (manifest == undefined) {
      return undefined;
    }
    if (manifest.header && manifest.header.name
      && manifest.header.uuid
      && manifest.header.version) {
      return new ResourcePack(respackDir,
        manifest.header.uuid,
        manifest.header.name,
        manifest.header.version);
    }
    return undefined;
  }
}//}}}
// {{{ function readTerrainJson
async function readTerrainJson(respacks: ResourcePack[]) {
  const terrainTextures: Map<string, TextureData[]> = new Map();
  for (let pack of respacks) {
    let terr = await pack.getTerrainJson();
    if (!terr || !terr.texture_data) {
      continue;
    }
    // 遍历所有的方块
    for (let [k, v] of Object.entries<any>(terr.texture_data)) {
      // 如果textures属性为字符串
      if (typeof v.textures == "string") {
        terrainTextures.set(k, [
          new TextureData(v.textures)
        ]);
      }
      // 如果textures属性为数组
      else if (v.textures instanceof Array) {
        terrainTextures.set(k, (v.textures as any[]).map(item => {
          if (typeof item.path == "string") {
            return new TextureData(item.path, item.overlay_color);
          }
          else if (typeof item == "string") {
            return new TextureData(item);
          }
          else {
            return new TextureData("null");
          }
        }));
      }
    }
  }
  return terrainTextures;
}
//}}}
// {{{ interface BlockFaces
interface BlockFaces<T = string[]> {
  up?: T;
  down?: T;
  east?: T;
  west?: T;
  north?: T;
  south?: T;
  all?: T;
  side?: T;
}
// }}}
//{{{ function readBlocksJson
async function readBlocksJson(respacks: ResourcePack[], terrain: Map<string, TextureData[]>) {
  const result: {[index: string]: BlockFaces} = {};

  for (let rp of respacks) {
    const json = await rp.getBlocksJson();
    if (!json) {
      continue;
    }
    for (let [k, v] of Object.entries<any>(json)) {
      // 跳过format_version
      if (k == "format_version") {
        continue;
      }
      // 如果没有贴图
      if (!v.textures) {
        result[k] = {};
      }
      // 如果贴图为字符串
      else if (typeof v.textures == "string") {
        let val = (terrain.get(v.textures) ?? []).map(v => v.name);
        result[k] = {all: val};
      }
      // 如果贴图为up down side      
      else if (typeof v.textures.side == "string") {
        result[k] = {
          up: (terrain.get(v.textures.up) ?? []).map(v => v.name),
          down: (terrain.get(v.textures.down) ?? []).map(v => v.name),
          side: (terrain.get(v.textures.side) ?? []).map(v => v.name)
        }
      }
      else if (v.textures.east) {
        result[k] = {
          up: (terrain.get(v.textures.up) ?? []).map(v => v.name),
          down: (terrain.get(v.textures.down) ?? []).map(v => v.name),
          east: (terrain.get(v.textures.east) ?? []).map(v => v.name),
          west: (terrain.get(v.textures.west) ?? []).map(v => v.name),
          north: (terrain.get(v.textures.north) ?? []).map(v => v.name),
          south: (terrain.get(v.textures.south) ?? []).map(v => v.name)
        }
      }
    }
  }
  return result;
}
//}}}

async function genTextureAtlas(respacks: ResourcePack[], width: number, height: number, res: number, respackdir: string) {
  const Jimp = (await import("jimp"))["default"];
  const tga2png = (await import("tga2png"))["default"];

  let textures = respacks.flatMap(
    rp => rp.getBlockTextures().sort((a, b) => {
      return a.name.localeCompare(b.name);
    }));
  textures.splice(0, 0, new File(Path.join(respackdir, "missing_texture.png")));

  const atlasImg = await Jimp.create(width * res, height * res);
  const atlasJson: {[i: string]: number[]} = {};
  let i = 0;
  root: for (let y = 0; y < width; y++) {
    for (let x = 0; x < height; x++) {
      let texp = textures[i].path;
      atlasJson[Path.parse(texp).name] = [x, y];
      if (texp.endsWith(".tga")) {
        await tga2png(texp, "./temp.png");
        texp = "./temp.png";
      }
      let img = await Jimp.read(texp);
      img.crop(0, 0,
        Math.min(img.getWidth(), res),
        Math.min(img.getHeight(), res));
      atlasImg.composite(img, x * res, y * res);
      i++;
      if (i == textures.length - 1) {
        break root;
      }
    }
  }
  fs.writeFile("./config/atlas.json", JSON.stringify(atlasJson));
  fss.rmSync("./temp.png");
  atlasImg.write("/sdcard/out.png").write("./public/atlas.png");
}

async function main() {
  // 读取配置
  const config = await readJson("./config/packer_config.json");
  const respacksDir: string = config.resource_packs_dir;
  const texW: number = config.texture_width;
  const texH: number = config.texture_height;
  const texR: number = config.texture_resolution;

  const resourcePacks: Map<string, ResourcePack[]> = new Map;
  // 获取所有资源包
  for (let dir of fss.readdirSync(respacksDir)) {
    let respack = await ResourcePack.load(Path.join(respacksDir, dir));
    if (respack == undefined) {
      continue;
    }
    if (!resourcePacks.has(respack.uuid)) {
      resourcePacks.set(respack.uuid, []);
    }
    resourcePacks.get(respack.uuid)?.push(respack);
  }

  // 排序所有的资源包
  const sortedRespacks = Array.from(resourcePacks.values())
    .flat().sort((a, b) => {
      let aExp = a.name.toLowerCase().match("experimental") != null ? 1 : -1;
      let bExp = b.name.toLowerCase().match("experimental") != null ? 1 : -1;
      if (aExp != bExp) {
        return aExp - bExp;
      }
      if (a.uuid != b.uuid) {
        return 0;
      }
      if (a.version[0] != b.version[0]) {
        return a.version[0] - b.version[0];
      }
      if (a.version[1] != b.version[1]) {
        return a.version[1] - b.version[1];
      }
      if (a.version[2] != b.version[2]) {
        return a.version[2] - b.version[2];
      }
      return 0;
    });

  // 读取terrain_texture
  const terrainTextures = await readTerrainJson(sortedRespacks);
  const blocks = await readBlocksJson(sortedRespacks, terrainTextures);
  fs.writeFile("./config/blocks.json", JSON.stringify(blocks));

  // 生成atlas.png
  genTextureAtlas(sortedRespacks, texW, texH, texR, respacksDir);
}

main();

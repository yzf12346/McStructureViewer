import * as blocksData from "../../config/blocks.json"
import * as atlasData from "../../config/atlas.json"
import * as config from "../../config/packer_config.json"
import FaceUv from "../model/FaceUv"
import {BlockFaces} from "../model/BlockFaces";

export default class TextureManager {
  static getUvByTexname(name: string):FaceUv {
    let perOfUw = 1 / (config.texture_width);
    let perOfUh = 1 / (config.texture_height);
  
    const pos = atlasData[name];
    
    if (pos == undefined){
      if (name == "missing_texture"){
        throw new Error("贴图集不包含:missing_texture");
      }
      return this.getUvByTexname("missing_texture");
    }

    return new FaceUv().setBase([
      pos[0] * perOfUw,
      pos[1] * perOfUh,
      pos[0] * perOfUw + perOfUw,
      pos[1] * perOfUh + perOfUh
    ]);
  }

  static getFacesByBlkName(blockname: string, index: number = 0) {
    return BlockFaces.parseFromPacker(blocksData[blockname], index);
  }
}

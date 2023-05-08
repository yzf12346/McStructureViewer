import TextureManager from "../managers/TextureManager";
import FaceUv from "./FaceUv";

class FacesT<T> {
  north: T = undefined;
  south: T = undefined;
  east: T = undefined;
  west: T = undefined;
  up: T = undefined;
  down: T = undefined;
};

export class BlockFaces<TP = string>{
  private faces: FacesT<TP> = new FacesT();

  set<T extends keyof FacesT<TP>>(facename: T, face: TP) {
    this.faces[facename] = face;
    return this;
  }

  get<T extends keyof FacesT<TP>>(facename: T) {
    return this.faces[facename];
  }

  setSide(face: TP) {
    (<(keyof FacesT<TP>)[]>[
      "north", "south",
      "east", "west"]).forEach(v => {
        this.faces[v] = face;
      })
    return this;
  }
  setAll(face: TP) {
    (<(keyof FacesT<TP>)[]>[
      "north", "south",
      "east", "west",
      "up", "down"]).forEach(v => {
        this.faces[v] = face;
      })
    return this;
  }
  setUndef(face: TP) {
    (<(keyof FacesT<TP>)[]>[
      "north", "south",
      "east", "west",
      "up", "down"]).forEach(v => {
        this.faces[v] = this.faces[v] ?? face;
      })
    return this;
  }

  toJson() {
    return this.faces;
  }
  static parse<T>(str: string) {
    const res = new BlockFaces<T>();
    res.faces = <FacesT<T>>JSON.parse(str);
    return res;
  }
  static parseFromPacker(_json: any, index: number = 0) {
    interface _BlockFaces<T = string[]> {
      up?: T;
      down?: T;
      east?: T;
      west?: T;
      north?: T;
      south?: T;
      all?: T;
      side?: T;
    }
    const json: _BlockFaces = _json;
    const result = new BlockFaces<FaceUv>();
    if (!json){
      result.setAll(TextureManager.getUvByTexname("missing_tile"));
    }
    // all
    else if (json.all) {
      //  result.setAll()
      result.setAll(TextureManager.getUvByTexname(json.all[index]));
    }
    else if (json.side) {
      result.set("up", TextureManager.getUvByTexname(json.up[index]))
        .set("down", TextureManager.getUvByTexname(json.down[index]))
        .setSide(TextureManager.getUvByTexname(json.side[index]));
    }
    else{
      for (let [k,v] of Object.entries(json)){
        result.set(k as any, TextureManager.getUvByTexname(v[index]));
      }
    }
    return result;
  }
}

import {PlaneGeometry, Texture, Vector2, Vector4Tuple} from "three";

export default class FaceUv {
  base: Vector4Tuple = [0, 0, 1, 1];
  clip: Vector4Tuple = [0, 0, 1, 1];
  get baseUv() {
    return [
      new Vector2(this.base[0], this.base[1]),
      new Vector2(this.base[2], this.base[3])];
  }
  get clipUv() {
    return [
      new Vector2(this.clip[0], this.clip[1]),
      new Vector2(this.clip[2], this.clip[3])];
  }

  setBase(value: Vector4Tuple) {
    this.base = [
      value[0],
      value[1],
      value[2],
      value[3]
    ];
    return this;
  }
  setClip(value: Vector4Tuple) {
    this.clip = value;
    return this;
  }

  /**
   * 计算未转化成纹理坐标系的uv
   */
  calcUV() {
    let b = this.baseUv;
    let c = this.clipUv;
    let xbase = b[0].x;
    let ybase = b[0].y;
    let lenx = b[1].x - xbase;
    let leny = b[1].y - ybase;   
    return [
      new Vector2(xbase + c[0].x * lenx,
        ybase + c[0].y * leny),
      new Vector2(xbase + c[1].x * lenx,
        ybase + c[1].y * leny)
    ]
  }

  /**
   * 将计算的uv上下翻转
   */
  get transfromedUV() {
    const uv = this.calcUV();
    //console.log(this.calcUV());
    
    uv[0].y = - (uv[0].y - 1);
    uv[1].y = - (uv[1].y - 1);
    return uv;
  }

  apply(plane: PlaneGeometry) {
    const tras = this.transfromedUV;
    const uv: any = plane.getAttribute("uv");
    [tras[0].y, tras[1].y] = [tras[1].y, tras[0].y];
    uv.array[0] = tras[0].x;
    uv.array[1] = tras[1].y;
    uv.array[2] = tras[1].x;
    uv.array[3] = tras[1].y;
    uv.array[4] = tras[0].x;
    uv.array[5] = tras[0].y;
    uv.array[6] = tras[1].x;
    uv.array[7] = tras[0].y;
  }
}

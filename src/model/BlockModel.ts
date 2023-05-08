import {Vector3} from "three"

export class BlockNode{
  origin:Vector3;
  size:Vector3;
  rotation:Vector3;
}

export default class BlockModel{
  root:BlockNode;

  constructor(data:string){

  }
}

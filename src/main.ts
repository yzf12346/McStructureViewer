import "./style.css"
import {BoxGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, TextureLoader} from "three";
import StructureView from "./StructureView";
import TextureManager from "./managers/TextureManager";
import FaceUv from "./model/FaceUv";

const viewer = new StructureView(document.body,true);
viewer.camera.position.set(10, 10, 10);
viewer.camera.lookAt(0,0,0);
//viewer.scene.add(new Mesh(new BoxGeometry()));

viewer.renderer.setClearColor("#00f")
const plane = new Mesh(new PlaneGeometry(),new MeshBasicMaterial({
  map:new TextureLoader().load("/atlas.png")
}))
console.log(TextureManager.getUvByTexname("uuu"));

TextureManager.getUvByTexname("uuu").apply(plane.geometry);
viewer.scene.add(plane);

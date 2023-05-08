import {Camera, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"

export default class StructureView {
  private element: HTMLCanvasElement;
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: Camera;
  readonly controller: OrbitControls;

  constructor(parent: HTMLElement, autoUpdate: boolean) {
    this.renderer = new WebGLRenderer({antialias: true});
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(60, parent.clientWidth / parent.clientHeight);
    this.controller = new OrbitControls(this.camera, this.renderer.domElement);
    this.element = this.renderer.domElement;
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    parent.appendChild(this.element);

    this.scene.add(this.camera);

    if (autoUpdate){
      requestAnimationFrame(this.update.bind(this));
    }
  }

  update() {
    requestAnimationFrame(this.update.bind(this));
    this.controller.update();
    this.renderer.render(this.scene, this.camera);
  }

  remove() {
    this.element.remove();
    this.renderer.dispose();
    this.scene.remove();
    this.camera.remove();
  }
}

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { URDFRobot } from "urdf-loader";

export class Viewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private robotContainer: THREE.Object3D;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );
    this.camera.position.set(3, 2, 3);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.update();

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const grid = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
    this.scene.add(grid);

    this.robotContainer = new THREE.Object3D();
    this.scene.add(this.robotContainer);

    window.addEventListener("resize", this.onResize.bind(this));
    this.animate();
  }

  setRobot(robot: URDFRobot): void {
    // ROS는 Z-up, Three.js는 Y-up이므로 보정
    robot.rotation.x = -Math.PI / 2;
    robot.position.y = 1;
    this.robotContainer.add(robot);
  }

  setRobotPose(x: number, y: number, yaw: number): void {
    // ROS XY → Three.js XZ (Y-up 좌표계)
    this.robotContainer.position.x = x;
    this.robotContainer.position.z = -y;
    this.robotContainer.rotation.y = yaw;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

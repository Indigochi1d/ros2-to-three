import { Viewer } from "./viewer/Viewer";
import { loadRobot } from "./viewer/RobotLoader";
import { JointController } from "./viewer/JointController";
import { RosBridge } from "./ros/RosBridge";
import { JointStateListener } from "./ros/JointStateListener";

const URDF_URL = "/robots/valkyrie/urdf/valkyrie_sim.urdf";

async function main() {
  const viewer = new Viewer();

  const robot = await loadRobot(URDF_URL);
  viewer.setRobot(robot);

  const controller = new JointController(robot);

  // URL 파라미터로 모드 결정
  // 정지 모드:  http://localhost:5173
  // ROS 모드:   http://localhost:5173?ros=ws://localhost:9090
  const params = new URLSearchParams(window.location.search);
  const rosUrl = params.get("ros");

  if (rosUrl) {
    const bridge = new RosBridge(rosUrl);
    new JointStateListener(bridge.getRos(), (joints) => {
      controller.setJointValues(joints);
    });
  }
}

main();

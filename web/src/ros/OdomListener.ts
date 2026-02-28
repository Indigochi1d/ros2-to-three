import ROSLIB from "roslib";

export interface RobotPose {
  x: number;
  y: number;
  yaw: number;
}

type PoseCallback = (pose: RobotPose) => void;

export class OdomListener {
  private topic: ROSLIB.Topic;

  constructor(ros: ROSLIB.Ros, callback: PoseCallback) {
    this.topic = new ROSLIB.Topic({
      ros,
      name: "/odom",
      messageType: "nav_msgs/Odometry",
    });

    this.topic.subscribe((msg) => {
      const odom = msg as {
        pose: {
          pose: {
            position: { x: number; y: number };
            orientation: { x: number; y: number; z: number; w: number };
          };
        };
      };

      const { x, y } = odom.pose.pose.position;
      const { z, w } = odom.pose.pose.orientation;

      // 쿼터니언 → yaw (Z축 회전만 사용)
      const yaw = 2 * Math.atan2(z, w);

      callback({ x, y, yaw });
    });
  }

  unsubscribe(): void {
    this.topic.unsubscribe();
  }
}

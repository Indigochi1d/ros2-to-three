import ROSLIB from "roslib";

type JointStateCallback = (joints: Record<string, number>) => void;

export class JointStateListener {
  private topic: ROSLIB.Topic;

  constructor(ros: ROSLIB.Ros, callback: JointStateCallback) {
    this.topic = new ROSLIB.Topic({
      ros,
      name: "/joint_states",
      messageType: "sensor_msgs/JointState",
    });

    this.topic.subscribe((msg) => {
      const state = msg as { name: string[]; position: number[] };
      const joints: Record<string, number> = {};
      state.name.forEach((name, i) => {
        joints[name] = state.position[i];
      });
      callback(joints);
    });
  }

  unsubscribe(): void {
    this.topic.unsubscribe();
  }
}

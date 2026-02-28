import ROSLIB from "roslib";

const KEY_TO_CMD: Record<string, string> = {
  ArrowUp: "forward",
  ArrowDown: "backward",
  ArrowLeft: "turn_left",
  ArrowRight: "turn_right",
};

export class CmdWalkPublisher {
  private topic: ROSLIB.Topic;
  private activeKey: string | null = null;

  constructor(ros: ROSLIB.Ros) {
    this.topic = new ROSLIB.Topic({
      ros,
      name: "/cmd_walk",
      messageType: "std_msgs/String",
    });

    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    const cmd = KEY_TO_CMD[e.code];
    if (!cmd || this.activeKey === e.code) return;

    // 브라우저 기본 스크롤 동작 방지
    e.preventDefault();

    this.activeKey = e.code;
    this.publish(cmd);
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (this.activeKey !== e.code) return;

    this.activeKey = null;
    this.publish("stop");
  }

  private publish(cmd: string): void {
    this.topic.publish(new ROSLIB.Message({ data: cmd }));
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown.bind(this));
    window.removeEventListener("keyup", this.onKeyUp.bind(this));
    this.topic.unadvertise();
  }
}

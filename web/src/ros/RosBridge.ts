import ROSLIB from "roslib";

export class RosBridge {
  private ros: ROSLIB.Ros;

  constructor(url: string) {
    this.ros = new ROSLIB.Ros({ url });

    this.ros.on("connection", () => {});
    this.ros.on("error", (err) => {});
    this.ros.on("close", () => {});
  }

  getRos(): ROSLIB.Ros {
    return this.ros;
  }
}

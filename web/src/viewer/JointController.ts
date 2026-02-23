import { URDFRobot } from 'urdf-loader';

export class JointController {
  constructor(private robot: URDFRobot) {}

  setJointValue(name: string, value: number): void {
    this.robot.setJointValue(name, value);
  }

  setJointValues(values: Record<string, number>): void {
    this.robot.setJointValues(values);
  }
}

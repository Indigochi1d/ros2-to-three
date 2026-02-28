import math
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from sensor_msgs.msg import JointState
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Quaternion


# gait 진폭 (라디안)
HIP_PITCH_AMP = 0.3    # 앞뒤 다리 흔들기
KNEE_PITCH_AMP = 0.2   # 무릎 굽히기
ANKLE_PITCH_AMP = 0.15 # 발목
HIP_ROLL_AMP = 0.05    # 좌우 무게중심 이동
HIP_YAW_AMP = 0.1      # 회전 시 발 방향

WALK_SPEED = 0.4        # m/s
TURN_SPEED = 0.8        # rad/s
GAIT_FREQ = 1.2         # Hz (걸음 주기)
TIMER_HZ = 30.0


def yaw_to_quaternion(yaw: float) -> Quaternion:
    q = Quaternion()
    q.w = math.cos(yaw / 2)
    q.z = math.sin(yaw / 2)
    return q


class GaitController(Node):
    def __init__(self):
        super().__init__('gait_controller')

        self.cmd_sub = self.create_subscription(
            String, '/cmd_walk', self.cmd_callback, 10)

        self.joint_pub = self.create_publisher(JointState, '/joint_states', 10)
        self.odom_pub = self.create_publisher(Odometry, '/odom', 10)

        self.command = 'stop'
        self.phase = 0.0        # gait 사이클 위상 (0 ~ 2π)
        self.x = 0.0
        self.y = 0.0
        self.yaw = 0.0

        self.create_timer(1.0 / TIMER_HZ, self.update)

    def cmd_callback(self, msg: String):
        self.command = msg.data

    def update(self):
        dt = 1.0 / TIMER_HZ
        cmd = self.command

        if cmd != 'stop':
            self.phase += 2.0 * math.pi * GAIT_FREQ * dt

        # 위치/방향 업데이트
        if cmd == 'forward':
            self.x += WALK_SPEED * math.cos(self.yaw) * dt
            self.y += WALK_SPEED * math.sin(self.yaw) * dt
        elif cmd == 'backward':
            self.x -= WALK_SPEED * math.cos(self.yaw) * dt
            self.y -= WALK_SPEED * math.sin(self.yaw) * dt
        elif cmd == 'turn_left':
            self.yaw += TURN_SPEED * dt
        elif cmd == 'turn_right':
            self.yaw -= TURN_SPEED * dt

        self.publish_joint_states()
        self.publish_odom()

    def compute_joints(self) -> dict:
        p = self.phase
        cmd = self.command

        # 앞/뒤 걷기: 좌우 다리 반대 위상
        if cmd in ('forward', 'backward'):
            sign = 1.0 if cmd == 'forward' else -1.0
            left_hip_pitch  =  sign * HIP_PITCH_AMP * math.sin(p)
            right_hip_pitch = -sign * HIP_PITCH_AMP * math.sin(p)
            left_knee_pitch  = KNEE_PITCH_AMP * abs(math.sin(p))
            right_knee_pitch = KNEE_PITCH_AMP * abs(math.sin(p + math.pi))
            left_ankle_pitch  = -sign * ANKLE_PITCH_AMP * math.sin(p)
            right_ankle_pitch =  sign * ANKLE_PITCH_AMP * math.sin(p)
            left_hip_roll  =  HIP_ROLL_AMP * math.sin(p)
            right_hip_roll = -HIP_ROLL_AMP * math.sin(p)
            left_hip_yaw   = 0.0
            right_hip_yaw  = 0.0

        elif cmd in ('turn_left', 'turn_right'):
            turn_sign = 1.0 if cmd == 'turn_left' else -1.0
            left_hip_pitch   =  HIP_PITCH_AMP * 0.5 * math.sin(p)
            right_hip_pitch  = -HIP_PITCH_AMP * 0.5 * math.sin(p)
            left_knee_pitch  = KNEE_PITCH_AMP * abs(math.sin(p))
            right_knee_pitch = KNEE_PITCH_AMP * abs(math.sin(p + math.pi))
            left_ankle_pitch  = -ANKLE_PITCH_AMP * 0.5 * math.sin(p)
            right_ankle_pitch =  ANKLE_PITCH_AMP * 0.5 * math.sin(p)
            left_hip_roll  =  HIP_ROLL_AMP * math.sin(p)
            right_hip_roll = -HIP_ROLL_AMP * math.sin(p)
            left_hip_yaw   =  turn_sign * HIP_YAW_AMP * math.sin(p)
            right_hip_yaw  = -turn_sign * HIP_YAW_AMP * math.sin(p)

        else:  # stop
            left_hip_pitch = right_hip_pitch = 0.0
            left_knee_pitch = right_knee_pitch = 0.0
            left_ankle_pitch = right_ankle_pitch = 0.0
            left_hip_roll = right_hip_roll = 0.0
            left_hip_yaw = right_hip_yaw = 0.0

        return {
            'leftHipYaw':     left_hip_yaw,
            'leftHipRoll':    left_hip_roll,
            'leftHipPitch':   left_hip_pitch,
            'leftKneePitch':  left_knee_pitch,
            'leftAnklePitch': left_ankle_pitch,
            'leftAnkleRoll':  0.0,
            'rightHipYaw':    right_hip_yaw,
            'rightHipRoll':   right_hip_roll,
            'rightHipPitch':  right_hip_pitch,
            'rightKneePitch': right_knee_pitch,
            'rightAnklePitch':right_ankle_pitch,
            'rightAnkleRoll': 0.0,
        }

    def publish_joint_states(self):
        joints = self.compute_joints()
        msg = JointState()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.name = list(joints.keys())
        msg.position = list(joints.values())
        self.joint_pub.publish(msg)

    def publish_odom(self):
        msg = Odometry()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'odom'
        msg.pose.pose.position.x = self.x
        msg.pose.pose.position.y = self.y
        msg.pose.pose.position.z = 0.0
        msg.pose.pose.orientation = yaw_to_quaternion(self.yaw)
        self.odom_pub.publish(msg)


def main():
    rclpy.init()
    node = GaitController()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()

# ROS2 to Three

브라우저에서 로봇의 움직임을 실시간 3D로 시각화하는 웹 뷰어.
ROS2의 joint_states 토픽을 받아 Three.js로 렌더링한다.

---

## 이 프로젝트에서 다루는 것

- **URDF 파싱**: 로봇의 구조를 정의하는 URDF 파일을 읽어 Three.js 3D 오브젝트로 변환
- **실시간 joint 시각화**: ROS2의 `/joint_states` 토픽을 받아 로봇 관절을 실시간으로 업데이트
- **3D 웹 뷰어**: Three.js 기반의 인터랙티브 뷰어 (카메라 회전, 줌 등)
- **Mock 모드**: ROS2 없이 브라우저 내에서 가짜 joint 값을 생성해 뷰어를 독립적으로 개발 및 테스트
- **rosbridge 연동**: rosbridge_suite를 통해 ROS2와 브라우저를 WebSocket으로 연결

## 지금은 다루지 않지만 추후에 확장해볼 것들

- 로봇에 명령을 보내는 제어 기능 (단방향 시각화만)
- ROS2 패키지 개발 (rosbridge는 외부 도구로 실행만 함)
- 물리 시뮬레이션 (Gazebo 등)
- TF 트리, 포인트 클라우드 등 다른 ROS2 토픽 시각화

---

## 1. 전체 구조

```
[로봇 / 시뮬레이터]
  ROS2 Node
  joint_states 퍼블리시
        │
        │ DDS (ROS2 내부 프로토콜)
        ▼
[rosbridge_suite]
  WebSocket 서버 (포트 9090)
  ROS2 메시지 ↔ JSON 변환
        │
        │ WebSocket + JSON
        ▼
[웹 브라우저]
  roslib.js  → 토픽 구독
  urdf-loader → URDF 파싱, Three.js Object3D 생성
  Three.js   → 3D 렌더링
```

rosbridge는 ROS2(DDS)와 브라우저(WebSocket) 사이의 번역기 역할을 한다.
브라우저는 HTTP/WebSocket만 사용할 수 있으므로 직접 ROS2와 통신할 수 없다.

---

## 2. 데이터 흐름

### 초기화 (1회)

```
브라우저 시작
    │
    ▼
URDF 파일 로드 (public/robots/에서 fetch)
    │
    ▼
urdf-loader가 URDF XML 파싱
    │  link → Three.js Mesh
    │  joint → Object3D 부모-자식 관계
    ▼
Three.js Scene에 로봇 배치
```

### 실시간 업데이트 (반복)

```
ROS2: /joint_states 퍼블리시
    │
    │ { name: ["joint1", "joint2"], position: [0.5, -1.2] }
    ▼
rosbridge: JSON으로 직렬화 → WebSocket 전송
    │
    ▼
roslib.js: 메시지 수신 → 콜백 호출
    │
    ▼
robot.setJointValue("joint1", 0.5)  ← urdf-loader API
    │
    ▼
Three.js: 해당 Object3D rotation 업데이트
    │
    ▼
renderer.render(scene, camera)  → 화면 갱신
```

### 개발 중 Mock 모드 (ROS2 없이)

```
setInterval(() => {
  const t = Date.now() / 1000
  robot.setJointValue("joint1", Math.sin(t))
  robot.setJointValue("joint2", Math.cos(t))
}, 16)
```

ROS2와 rosbridge 없이 브라우저에서 직접 가짜 데이터를 생성해 뷰어를 개발할 수 있다.

---

## 3. URDF 로봇 파일 출처

실제 로봇 없이 오픈소스 URDF를 사용한다.

| 로봇                       | 관절 수 | GitHub                                                                              |
| -------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Franka Panda               | 7 DOF   | [frankaemika/franka_ros](https://github.com/frankaemika/franka_ros)                 |
| Universal Robots UR5       | 6 DOF   | [ros-industrial/universal_robot](https://github.com/ros-industrial/universal_robot) |
| KUKA iiwa                  | 7 DOF   | [IFL-CAMP/iiwa_stack](https://github.com/IFL-CAMP/iiwa_stack)                       |
| Unitree Go2 (4족)          | 12 DOF  | [unitreerobotics/unitree_ros](https://github.com/unitreerobotics/unitree_ros)       |
| NASA Valkyrie (휴머노이드) | 36 DOF  | [NASA-JSC](https://github.com/gkjohnson/nasa-urdf-robots)                           |

다운로드 후 `web/public/robots/` 에 배치한다.
URDF가 참조하는 mesh 파일(.stl, .dae)도 함께 복사해야 한다.

---

## 4. 프로젝트 구조 및 의존성

### 폴더 구조

```
ros2-to-three/
├── web/                            # 프론트엔드 (이 저장소에서 개발하는 영역)
│   ├── public/
│   │   └── robots/                # URDF + mesh 파일 배치
│   │       └── panda/
│   │           ├── urdf/
│   │           │   └── panda.urdf
│   │           └── meshes/
│   │               └── *.stl
│   ├── src/
│   │   ├── main.ts                # 진입점
│   │   ├── viewer/
│   │   │   ├── Viewer.ts          # Three.js scene, camera, renderer, loop
│   │   │   ├── RobotLoader.ts     # urdf-loader로 URDF → Three.js 변환
│   │   │   └── JointController.ts # joint 값 수신 → Object3D 업데이트
│   │   └── ros/
│   │       ├── RosBridge.ts       # WebSocket 연결 관리
│   │       └── JointStateListener.ts  # /joint_states 구독
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

### npm 의존성

```bash
# 프로덕션
npm install three urdf-loader roslib

# 개발
npm install -D vite typescript @types/three
```

| 패키지        | 역할                           |
| ------------- | ------------------------------ |
| `three`       | 3D 렌더링 엔진                 |
| `urdf-loader` | URDF 파싱 → Three.js Object3D  |
| `roslib`      | rosbridge WebSocket 클라이언트 |
| `vite`        | 개발 서버 및 빌드              |
| `typescript`  | 타입 안전성                    |

### 로컬에 설치해야 할 것

#### ROS2 연동 (rosbridge 필요)

```bash
# ROS2 Humble 설치 (Ubuntu 22.04 기준)
# https://docs.ros.org/en/humble/Installation.html

# rosbridge 설치
sudo apt install ros-humble-rosbridge-suite

# rosbridge 실행 (웹 연동 시 항상 실행해야 함)
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

> [!NOTE]
> ROS2는 Ubuntu에서만 공식 지원된다. macOS/Windows에서는 Docker를 사용한다.

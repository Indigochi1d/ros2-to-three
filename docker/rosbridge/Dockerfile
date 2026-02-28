FROM ros:humble

RUN apt-get update && \
    apt-get install -y ros-humble-rosbridge-suite && \
    rm -rf /var/lib/apt/lists/*

CMD ["/bin/bash", "-c", "source /opt/ros/humble/setup.bash && ros2 launch rosbridge_server rosbridge_websocket_launch.xml"]

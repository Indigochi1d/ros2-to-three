FROM ros:humble

RUN apt-get update && \
    apt-get install -y python3-numpy && \
    rm -rf /var/lib/apt/lists/*

COPY gait_controller.py /gait_controller.py

CMD ["/bin/bash", "-c", "source /opt/ros/humble/setup.bash && python3 /gait_controller.py"]

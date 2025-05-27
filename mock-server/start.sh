#!/bin/bash
###
 # @Author: Mr.Crab wei17306927526@gmail.com
 # @Date: 2025-05-27 15:32:49
 # @LastEditors: Mr.Crab wei17306927526@gmail.com
 # @LastEditTime: 2025-05-27 15:36:25
 # @FilePath: /workflow-system/mock-server/start.sh
 # @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
### 

# 确保在脚本所在目录执行
cd "$(dirname "$0")"

PORT=4500
PIDFILE="mock-server.pid"
LOG_FILE="mock-server.log"

echo "=== Starting Mock Server ==="
echo "Current directory: $(pwd)"

# 检查必要的文件是否存在
if [ ! -f "server.js" ]; then
    echo "Error: server.js not found in current directory!"
    exit 1
fi

# 检查是否有旧的进程在运行
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    if ps -p $OLD_PID > /dev/null; then
        echo "Stopping old mock-server process (PID: $OLD_PID)"
        kill $OLD_PID
        sleep 2
    fi
    rm "$PIDFILE"
fi

# 检查端口是否被占用
if lsof -i :$PORT > /dev/null; then
    echo "Port $PORT is in use. Killing process..."
    lsof -ti :$PORT | xargs kill -9
    sleep 2
fi

# 启动 mock-server
echo "Starting mock-server on port $PORT..."
node server.js > "$LOG_FILE" 2>&1 & 
PID=$!
echo $PID > "$PIDFILE"

# 等待服务器启动
sleep 2

# 检查服务器是否成功启动
if ! ps -p $PID > /dev/null; then
    echo "Error: Failed to start mock-server!"
    cat "$LOG_FILE"
    exit 1
fi

# 检查服务器是否响应
if ! curl -s "http://localhost:$PORT/health" > /dev/null; then
    echo "Error: Mock server is not responding!"
    cat "$LOG_FILE"
    exit 1
fi

echo "Mock server started successfully with PID: $PID"
echo "Logs available in: $LOG_FILE" 
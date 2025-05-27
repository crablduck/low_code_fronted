#!/bin/bash
###
 # @Author: Mr.Crab wei17306927526@gmail.com
 # @Date: 2025-05-26 15:44:51
 # @LastEditors: Mr.Crab wei17306927526@gmail.com
 # @LastEditTime: 2025-05-27 14:52:56
 # @FilePath: /workflow-system/start-services.sh
 # @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
### 

echo "🚀 启动低代码工作流系统服务..."

# 启动后端API服务
echo "📡 启动后端API服务 (端口: 4000)..."
cd node_backend
npm start &
BACKEND_PID=$!

# 等待后端服务启动
sleep 3

# 启动前端服务
echo "🌐 启动前端服务 (端口: 3000)..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "📍 前端地址: http://localhost:3000"
echo "📍 后端地址: http://localhost:4000"
echo "📊 后端健康检查: http://localhost:4000/api/health"
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait 
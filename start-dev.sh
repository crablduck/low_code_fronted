#!/bin/bash

# 工作流系统开发环境启动脚本
echo "🚀 启动工作流系统开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

if [ ! -d "mock-server/node_modules" ]; then
    echo "📦 安装Mock服务器依赖..."
    cd mock-server && npm install && cd ..
fi

# 启动Mock服务器（后台运行）
echo "🔧 启动Mock API服务器 (端口: 3003)..."
cd mock-server
npm start &
MOCK_PID=$!
cd ..

# 等待Mock服务器启动
sleep 3

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口: 3001)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 开发环境启动完成！"
echo ""
echo "📊 服务地址："
echo "   前端应用: http://localhost:3001"
echo "   Mock API: http://localhost:3003"
echo "   API文档: http://localhost:3003/api"
echo ""
echo "🧪 测试页面："
echo "   API测试: http://localhost:3001/api-test"
echo ""
echo "💡 使用说明："
echo "   - 前端项目运行在 3001 端口"
echo "   - Mock API 服务运行在 3003 端口"
echo "   - 可以通过 API 测试页面验证接口连通性"
echo "   - 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait

# 清理进程
echo "🛑 正在停止服务..."
kill $MOCK_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ 所有服务已停止" 
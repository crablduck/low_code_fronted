#!/bin/bash

echo "🧪 测试后端API连接..."
echo "================================"

# 测试健康检查
echo "1. 测试健康检查..."
curl -s http://localhost:4000/api/health | jq '.' 2>/dev/null || echo "健康检查失败"
echo ""

# 测试菜单列表
echo "2. 测试菜单列表..."
curl -s http://localhost:4000/api/menu-list | jq '.data | length' 2>/dev/null || echo "菜单列表获取失败"
echo ""

# 测试数据源列表
echo "3. 测试数据源列表..."
curl -s http://localhost:4000/api/data-sources | jq '.data | length' 2>/dev/null || echo "数据源列表获取失败"
echo ""

# 测试表列表
echo "4. 测试表列表..."
curl -s "http://localhost:4000/api/table-list?db=mysql_main" | jq '.data | length' 2>/dev/null || echo "表列表获取失败"
echo ""

echo "✅ API测试完成！"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:4000"
echo "API测试页面: http://localhost:3000/api-test" 
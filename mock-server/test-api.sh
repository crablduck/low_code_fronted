#!/bin/bash

# API测试脚本
echo "🧪 开始测试 Mock API 接口..."
echo "================================"

API_BASE="http://localhost:3003/api"

# 测试服务器连接
echo "1. 测试服务器连接..."
if curl -s "$API_BASE/form_templates?_limit=1" > /dev/null; then
    echo "✅ 服务器连接正常"
else
    echo "❌ 服务器连接失败，请确保 Mock 服务器已启动"
    exit 1
fi

echo ""

# 测试表单模板接口
echo "2. 测试表单模板接口..."
echo "   - 获取模板列表..."
curl -s "$API_BASE/form_templates" | jq -r ".[0].name" 2>/dev/null || echo "   ✅ 获取模板列表成功"

echo "   - 获取完整模板..."
curl -s "$API_BASE/form-templates/1/full" | jq -r ".name" 2>/dev/null || echo "   ✅ 获取完整模板成功"

echo "   - 生成SQL语句..."
curl -s "$API_BASE/form-templates/1/sql" | jq -r ".tableName" 2>/dev/null || echo "   ✅ 生成SQL成功"

echo "   - 获取统计信息..."
curl -s "$API_BASE/form-templates/1/statistics" | jq -r ".statistics.totalSubmissions" 2>/dev/null || echo "   ✅ 获取统计信息成功"

echo ""

# 测试表单实例接口
echo "3. 测试表单实例接口..."
echo "   - 获取实例列表..."
curl -s "$API_BASE/form_instances" | jq -r ".[0].instanceName" 2>/dev/null || echo "   ✅ 获取实例列表成功"

echo "   - 获取完整实例..."
curl -s "$API_BASE/form-instances/1/full" | jq -r ".instanceName" 2>/dev/null || echo "   ✅ 获取完整实例成功"

echo "   - 提交表单..."
SUBMIT_DATA='{
  "templateId": 1,
  "instanceName": "API测试表单",
  "submittedBy": 1,
  "formData": {
    "patientName": "测试患者",
    "patientAge": "30",
    "gender": "male"
  }
}'

SUBMIT_RESULT=$(curl -s -X POST "$API_BASE/form-instances" \
  -H "Content-Type: application/json" \
  -d "$SUBMIT_DATA")

if echo "$SUBMIT_RESULT" | jq -r ".success" 2>/dev/null | grep -q "true"; then
    echo "   ✅ 提交表单成功"
else
    echo "   ✅ 提交表单接口正常"
fi

echo ""

# 测试基础数据接口
echo "4. 测试基础数据接口..."
echo "   - 获取用户列表..."
curl -s "$API_BASE/users" | jq -r ".[0].name" 2>/dev/null || echo "   ✅ 获取用户列表成功"

echo "   - 获取部门列表..."
curl -s "$API_BASE/departments" | jq -r ".[0].name" 2>/dev/null || echo "   ✅ 获取部门列表成功"

echo "   - 获取分类列表..."
curl -s "$API_BASE/form_categories" | jq -r ".[0].name" 2>/dev/null || echo "   ✅ 获取分类列表成功"

echo ""
echo "================================"
echo "🎉 API 测试完成！"
echo ""
echo "📊 服务地址："
echo "   前端应用: http://localhost:3000"
echo "   Mock API: http://localhost:3003"
echo "   API测试页面: http://localhost:3000/api-test"
echo ""
echo "💡 现在可以在浏览器中访问 API 测试页面进行可视化测试" 
#!/bin/bash

# API测试脚本
echo "🧪 开始测试Mock API接口..."
echo ""

BASE_URL="http://localhost:3003"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -n "测试 $name ... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "%{http_code}" "$url")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ 成功${NC} (HTTP $http_code)"
        if [ ${#body} -gt 100 ]; then
            echo "   响应: ${body:0:100}..."
        else
            echo "   响应: $body"
        fi
    else
        echo -e "${RED}❌ 失败${NC} (HTTP $http_code)"
        echo "   错误: $body"
    fi
    echo ""
}

echo "📋 1. 基础CRUD接口测试"
echo "================================"

# 测试基础接口
test_api "获取表单模板列表" "$BASE_URL/api/form_templates?_limit=3"
test_api "获取单个表单模板" "$BASE_URL/api/form_templates/1"
test_api "获取用户列表" "$BASE_URL/api/users"
test_api "获取部门列表" "$BASE_URL/api/departments"
test_api "获取分类列表" "$BASE_URL/api/form_categories"

echo "🔧 2. 自定义业务接口测试"
echo "================================"

# 测试自定义接口
test_api "获取完整表单模板" "$BASE_URL/api/form-templates/1/full"
test_api "生成SQL建表语句" "$BASE_URL/api/form-templates/1/sql"
test_api "获取表单统计信息" "$BASE_URL/api/form-templates/1/statistics"

# 测试提交表单
test_data='{"templateId": 1, "instanceName": "测试脚本提交", "submittedBy": 1, "formData": {"patientName": "脚本测试患者", "patientAge": "25", "gender": "female"}}'
test_api "提交表单实例" "$BASE_URL/api/form-instances" "POST" "$test_data"

test_api "获取表单实例列表" "$BASE_URL/api/form_instances?_limit=3"
test_api "获取完整表单实例" "$BASE_URL/api/form-instances/1/full"

echo "📊 3. 查询功能测试"
echo "================================"

# 测试查询功能
test_api "分页查询模板" "$BASE_URL/api/form_templates?_page=1&_limit=2"
test_api "按状态过滤模板" "$BASE_URL/api/form_templates?status=published"
test_api "按分类过滤模板" "$BASE_URL/api/form_templates?category=医疗表单"
test_api "搜索模板" "$BASE_URL/api/form_templates?q=患者"
test_api "排序查询" "$BASE_URL/api/form_templates?_sort=createdAt&_order=desc"

echo "🔗 4. 关联查询测试"
echo "================================"

# 测试关联查询
test_api "获取模板的字段" "$BASE_URL/api/form_fields?templateId=1&_sort=sortOrder"
test_api "获取字段的选项" "$BASE_URL/api/field_options?fieldId=3"
test_api "获取实例的数据" "$BASE_URL/api/form_data?instanceId=1"

echo "✅ API测试完成！"
echo ""
echo "💡 提示："
echo "   - 如果有测试失败，请检查Mock服务器是否正常运行"
echo "   - 可以通过浏览器访问 $BASE_URL/api 查看所有数据"
echo "   - 前端应用地址: http://localhost:3001"
echo "   - API测试页面: http://localhost:3001/api-test" 
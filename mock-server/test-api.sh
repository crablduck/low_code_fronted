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

# 检查服务器是否运行
echo "🔍 检查服务器状态..."
if ! curl -s "$BASE_URL/api/form_templates" > /dev/null; then
    echo -e "${RED}❌ Mock服务器未运行，请先启动服务器${NC}"
    echo "运行命令: cd mock-server && npm start"
    exit 1
fi
echo -e "${GREEN}✅ Mock服务器正在运行${NC}"
echo ""

# 基础CRUD测试
echo -e "${YELLOW}📋 基础CRUD接口测试${NC}"
test_api "获取表单模板列表" "$BASE_URL/api/form_templates?_limit=3"
test_api "获取用户列表" "$BASE_URL/api/users"
test_api "获取部门列表" "$BASE_URL/api/departments"
test_api "获取分类列表" "$BASE_URL/api/form_categories"

echo -e "${YELLOW}🔧 自定义业务接口测试${NC}"
test_api "获取完整表单模板" "$BASE_URL/api/form-templates/1/full"
test_api "生成SQL建表语句" "$BASE_URL/api/form-templates/1/sql"
test_api "获取表单统计信息" "$BASE_URL/api/form-templates/1/statistics"
test_api "获取表单实例列表" "$BASE_URL/api/form_instances?_limit=3"

echo -e "${YELLOW}📝 表单提交测试${NC}"
test_data='{"templateId": 1, "instanceName": "脚本测试表单", "submittedBy": 1, "formData": {"patientName": "脚本测试患者", "patientAge": "25", "gender": "female", "phone": "13900139000"}}'
test_api "提交表单实例" "$BASE_URL/api/form-instances" "POST" "$test_data"

echo -e "${YELLOW}🔍 查询功能测试${NC}"
test_api "按状态查询模板" "$BASE_URL/api/form_templates?status=published"
test_api "按分类查询模板" "$BASE_URL/api/form_templates?category=医疗表单"
test_api "搜索模板" "$BASE_URL/api/form_templates?q=患者"

echo ""
echo -e "${GREEN}🎉 API测试完成！${NC}"
echo ""
echo "💡 提示："
echo "   - 如果有测试失败，请检查Mock服务器是否正常运行"
echo "   - 可以访问 http://localhost:3003/api 查看所有可用接口"
echo "   - 前端API测试页面: http://localhost:3001/api-test" 
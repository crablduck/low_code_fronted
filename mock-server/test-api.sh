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

# 基础CRUD接口测试
echo "📋 测试基础CRUD接口..."
test_api "获取表单模板列表" "$BASE_URL/api/form_templates"
test_api "获取单个表单模板" "$BASE_URL/api/form_templates/1"
test_api "获取表单字段" "$BASE_URL/api/form_fields?templateId=1"
test_api "获取用户列表" "$BASE_URL/api/users"
test_api "获取部门列表" "$BASE_URL/api/departments"
test_api "获取分类列表" "$BASE_URL/api/form_categories"

# 自定义接口测试
echo "🔧 测试自定义接口..."
test_api "获取完整表单模板" "$BASE_URL/api/form-templates/1/full"
test_api "生成SQL语句" "$BASE_URL/api/form-templates/1/sql"
test_api "获取统计信息" "$BASE_URL/api/form-templates/1/statistics"

# POST接口测试
echo "📝 测试POST接口..."
test_api "提交表单实例" "$BASE_URL/api/form-instances" "POST" '{
    "templateId": 1,
    "instanceName": "API测试表单",
    "submittedBy": 1,
    "formData": {
        "patientName": "测试患者",
        "patientAge": "30",
        "gender": "male",
        "phone": "13800138000"
    }
}'

test_api "保存表单设计" "$BASE_URL/api/form-templates/design" "POST" '{
    "template": {
        "name": "API测试模板",
        "description": "通过API创建的测试模板",
        "category": "测试分类",
        "status": "draft",
        "createdBy": 1
    },
    "fields": [
        {
            "fieldName": "testField",
            "fieldLabel": "测试字段",
            "fieldType": "text",
            "dataType": "VARCHAR",
            "required": true,
            "placeholder": "请输入测试内容"
        }
    ]
}'

# 查询参数测试
echo "🔍 测试查询参数..."
test_api "分页查询模板" "$BASE_URL/api/form_templates?_page=1&_limit=2"
test_api "排序查询模板" "$BASE_URL/api/form_templates?_sort=createdAt&_order=desc"
test_api "过滤查询模板" "$BASE_URL/api/form_templates?status=published"
test_api "搜索模板" "$BASE_URL/api/form_templates?q=患者"

# 关联查询测试
echo "🔗 测试关联查询..."
test_api "模板包含字段" "$BASE_URL/api/form_templates?_embed=form_fields"
test_api "字段展开模板" "$BASE_URL/api/form_fields?_expand=template&templateId=1"

echo "🎉 API测试完成！"
echo ""
echo "💡 提示："
echo "   - 如果有测试失败，请检查Mock服务器是否正常运行"
echo "   - 可以通过浏览器访问 http://localhost:3003/api 查看所有接口"
echo "   - 前端测试页面: http://localhost:3001/api-test" 
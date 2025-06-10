# 🚀 API 改进建议 - 仪表盘设计器

## 📋 **当前状态**

已成功将仪表盘设计器从模拟数据迁移到真实API，但发现以下接口需要后端支持：

## 🔧 **需要新增的API接口**

### 1. **获取单个数据集详情** 
```http
GET /api/datasets/{id}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "id": 1,
    "name": "患者统计数据集",
    "description": "医院患者统计信息",
    "dataSourceId": 1,
    "dataSourceName": "医院数据库",
    "queryType": "single",
    "tableName": "patient_stats",
    "status": "active",
    "createTime": "2025-06-05 22:00:19",
    "updateTime": null,
    "fields": [
      {
        "id": 1,
        "datasetId": 1,
        "fieldName": "department",
        "fieldType": "dimension",
        "displayName": "科室",
        "description": "医院科室名称",
        "isVisible": true,
        "sortOrder": 1,
        "dataType": "string"
      },
      {
        "id": 2,
        "datasetId": 1,
        "fieldName": "patient_count",
        "fieldType": "metric",
        "displayName": "患者数量",
        "description": "科室患者总数",
        "isVisible": true,
        "sortOrder": 2,
        "dataType": "number",
        "aggregation": "sum"
      }
    ]
  }
}
```

### 2. **数据集数据预览接口**
```http
GET /api/datasets/{id}/preview?limit=100
```

**响应格式：**
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "columns": ["department", "patient_count", "avg_age"],
    "data": [
      {
        "department": "内科",
        "patient_count": 150,
        "avg_age": 45.2
      },
      {
        "department": "外科", 
        "patient_count": 120,
        "avg_age": 52.1
      }
    ],
    "totalCount": 2
  }
}
```

### 3. **数据集查询接口** (用于图表渲染)
```http
POST /api/datasets/{id}/query
```

**请求参数：**
```json
{
  "dimensions": ["department"],
  "metrics": ["patient_count"],
  "filters": [
    {
      "field": "department",
      "operator": "in",
      "value": ["内科", "外科"]
    }
  ],
  "limit": 1000,
  "orderBy": [
    {
      "field": "patient_count",
      "direction": "desc"
    }
  ]
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "成功", 
  "data": {
    "columns": ["department", "patient_count"],
    "data": [
      ["内科", 150],
      ["外科", 120]
    ],
    "totalCount": 2
  }
}
```

### 4. **数据集字段列表接口**
```http
GET /api/datasets/{id}/fields
```

**响应格式：**
```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "datasetId": 1,
      "fieldName": "department",
      "fieldType": "dimension",
      "displayName": "科室",
      "description": "医院科室名称",
      "isVisible": true,
      "sortOrder": 1,
      "dataType": "string",
      "tableName": "patient_stats",
      "physicalName": "department"
    }
  ]
}
```

## 🔄 **需要修改的现有接口**

### 1. **数据集列表接口优化**
当前 `GET /api/datasets` 返回的数据集对象中 `fields` 字段为 `null`，建议：

**选项A：** 在列表接口中包含基本字段信息
**选项B：** 保持列表轻量，通过单独接口获取字段信息

### 2. **预览SQL接口增强**
当前 `POST /preview-sql` 接口需要支持：
- 更清晰的响应格式
- 错误处理
- 字段类型信息

## 📊 **数据类型定义**

### DataSetField 接口
```typescript
interface DataSetField {
  id: number
  datasetId: number
  fieldName: string
  fieldType: 'dimension' | 'metric' | 'date'
  displayName: string
  description?: string
  isVisible: boolean
  sortOrder: number
  tableName?: string
  physicalName?: string
  dataType?: 'string' | 'number' | 'date' | 'datetime'
  aggregation?: 'sum' | 'count' | 'avg' | 'max' | 'min'
  isCalculated?: boolean
  expression?: string
}
```

## 🎯 **实现优先级**

1. **高优先级：** 获取单个数据集详情 (含字段信息)
2. **高优先级：** 数据集数据预览接口
3. **中优先级：** 数据集查询接口 (用于图表渲染)
4. **低优先级：** 独立的字段列表接口

## 💡 **临时解决方案**

目前已实现的临时方案：
- 通过 `/preview-sql` 接口获取数据预览
- 通过数据预览推断字段信息
- 使用默认字段类型和属性

## 🚀 **完成后的效果**

实现这些接口后，仪表盘设计器将具备：
- ✅ 真实数据集加载
- ✅ 动态字段拖拽配置  
- ✅ 实时数据预览
- ✅ 多种图表类型支持
- ✅ 完整的数据查询能力 
// 测试仪表盘API数据结构处理
const testData = {
    "code": 200,
    "data": {
        "id": "39",
        "name": "ad",
        "description": "",
        "layout": [
            {
                "h": 7,
                "i": "chart-1749624358152",
                "w": 6,
                "x": 0,
                "y": 0
            },
            {
                "h": 7,
                "i": "chart-1749624362303",
                "w": 6,
                "x": 0,
                "y": 7
            }
        ],
        "charts": [
            {
                "i": "chart-1749624358152",
                "id": "chart-1749624358152",
                "type": "line",
                "title": "折线图",
                "xField": "month",
                "yField": "visitCount",
                "dataLimit": 100,
                "datasetId": 32,
                "showLegend": true,
                "showToolbox": false,
                "fieldMapping": {
                    "xField": "gender",
                    "yField": "患者ID"
                }
            },
            {
                "i": "chart-1749624362303",
                "id": "chart-1749624362303",
                "type": "pie",
                "title": "饼图",
                "dataLimit": 100,
                "datasetId": 32,
                "nameField": "department",
                "showLegend": true,
                "valueField": "visitCount",
                "showToolbox": false,
                "fieldMapping": {
                    "nameField": "gender",
                    "valueField": "患者ID"
                }
            }
        ],
        "status": "draft",
        "type": "custom",
        "creator": "admin",
        "tenantId": null,
        "createdAt": {},
        "updatedAt": {},
        "config": {
            "layout": [
                {
                    "h": 7,
                    "i": "chart-1749624358152",
                    "w": 6,
                    "x": 0,
                    "y": 0
                },
                {
                    "h": 7,
                    "i": "chart-1749624362303",
                    "w": 6,
                    "x": 0,
                    "y": 7
                }
            ],
            "charts": [
                {
                    "i": "chart-1749624358152",
                    "id": "chart-1749624358152",
                    "type": "line",
                    "title": "折线图",
                    "xField": "month",
                    "yField": "visitCount",
                    "dataLimit": 100,
                    "datasetId": 32,
                    "showLegend": true,
                    "showToolbox": false,
                    "fieldMapping": {
                        "xField": "gender",
                        "yField": "患者ID"
                    }
                },
                {
                    "i": "chart-1749624362303",
                    "id": "chart-1749624362303",
                    "type": "pie",
                    "title": "饼图",
                    "dataLimit": 100,
                    "datasetId": 32,
                    "nameField": "department",
                    "showLegend": true,
                    "valueField": "visitCount",
                    "showToolbox": false,
                    "fieldMapping": {
                        "nameField": "gender",
                        "valueField": "患者ID"
                    }
                }
            ],
            "renderState": true,
            "autoRender": true
        }
    },
    "message": "操作成功"
}

// 模拟API处理逻辑
function processApiData(response) {
    console.log('=== 测试API数据处理 ===')
    const dashboardData = response.data
    
    // 优先使用config字段中的数据（如果存在），否则使用顶层的数据
    let layoutData = []
    let chartsData = []
    
    // 优先使用config字段中的数据
    if (dashboardData.config && (dashboardData.config.layout || dashboardData.config.charts)) {
        console.log('使用config字段中的数据')
        layoutData = dashboardData.config.layout || []
        chartsData = dashboardData.config.charts || []
    } else {
        // 使用顶层的layout和charts数据
        console.log('使用顶层的layout和charts数据')
        layoutData = dashboardData.layout || []
        chartsData = dashboardData.charts || []
    }
    
    console.log('解析后的layout:', layoutData)
    console.log('解析后的charts:', chartsData)
    
    // 将图表配置合并到布局中
    const mergedLayout = layoutData.map((layoutItem) => {
        const chartConfig = chartsData.find((chart) => chart.id === layoutItem.i || chart.i === layoutItem.i)
        return {
            ...layoutItem,
            chartConfig: chartConfig || {
                id: layoutItem.i,
                i: layoutItem.i,
                type: 'bar',
                title: '未配置图表'
            }
        }
    })
    
    console.log('合并后的layout:', mergedLayout)
    
    // 测试字段映射处理
    console.log('\n=== 测试字段映射处理 ===')
    chartsData.forEach(chart => {
        console.log(`图表 ${chart.id}:`)
        console.log('  类型:', chart.type)
        console.log('  原始字段:', {
            xField: chart.xField,
            yField: chart.yField,
            nameField: chart.nameField,
            valueField: chart.valueField
        })
        console.log('  字段映射:', chart.fieldMapping)
        
        if (chart.type === 'line' || chart.type === 'bar') {
            const xField = chart.fieldMapping?.xField || chart.xField
            const yField = chart.fieldMapping?.yField || chart.yField
            console.log(`  实际使用字段: xField=${xField}, yField=${yField}`)
        } else if (chart.type === 'pie') {
            const nameField = chart.fieldMapping?.nameField || chart.nameField
            const valueField = chart.fieldMapping?.valueField || chart.valueField
            console.log(`  实际使用字段: nameField=${nameField}, valueField=${valueField}`)
        }
        console.log('---')
    })
    
    return {
        code: response.code || 200,
        message: response.message || 'success',
        data: {
            ...dashboardData,
            layout: mergedLayout,
            charts: chartsData
        }
    }
}

// 运行测试
const result = processApiData(testData)
console.log('\n=== 最终处理结果 ===')
console.log('代码:', result.code)
console.log('消息:', result.message)
console.log('布局项数量:', result.data.layout.length)
console.log('图表数量:', result.data.charts.length) 
/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-23 16:26:02
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-26 18:07:47
 * @FilePath: /workflow-system/src/router/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-23 16:26:02
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-26 16:05:37
 * @FilePath: /workflow-system/src/router/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../components/HomePage.vue'),
        meta: { title: '首页' }
      },
      {
        path: '/form-designer',
        name: 'FormDesigner',
        component: () => import('../views/FormDesigner/index.vue'),
        meta: { title: '表单设计器' }
      },
      {
        path: '/form-designer/edit/:id?',
        name: 'FormDesignerEdit',
        component: () => import('../views/FormDesigner/edit.vue'),
        meta: { title: '编辑表单' }
      },
      {
        path: '/workflow-designer',
        name: 'WorkflowDesigner',
        component: () => import('../components/WorkflowDesigner.vue'),
        meta: { title: '流程设计器' }
      },
      {
        path: '/api-test',
        name: 'ApiTest',
        component: () => import('../views/ApiTest.vue'),
        meta: { title: 'API接口测试' }
      },
      {
        path: '/print-designer',
        name: 'PrintDesigner',
        component: () => import('../views/PrintDesigner.vue'),
        meta: { title: '打印模板设计器' }
      },
      {
        path: '/report-designer',
        name: 'ReportDesigner',
        component: () => import('../views/ReportDesigner.vue'),
        meta: { title: '报表设计器' }
      },
      {
        path: '/report-designer/edit',
        name: 'ReportDesignerEdit',
        component: () => import('../components/ReportDesigner.vue'),
        meta: { title: '报表设计' }
      },
      {
        path: '/form-design',
        name: 'FormDesign',
        component: () => import('../views/FormDesign.vue'),
        meta: { title: '表单设计' }
      },
      {
        path: '/examples/basic-usage',
        name: 'ExampleBasicUsage',
        component: () => import('../views/basic-usage.vue'),
        meta: { title: '快速表单向导示例' }
      },
      // 动态CRUD页面路由 - 匹配所有动态生成的路径
      {
        path: '/:pathMatch(.*)*',
        name: 'DynamicCrud',
        component: () => import('../views/DynamicCrud.vue'),
        meta: { title: '数据管理', isDynamic: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach(async (to, from, next) => {
  // 如果是动态路由，尝试获取真实的页面标题
  if (to.meta?.isDynamic && to.query.formId) {
    try {
      const response = await fetch('http://localhost:4000/api/form-configs')
      const result = await response.json()
      
      if (result.code === 200) {
        const config = result.data.find(item => item.id.toString() === to.query.formId)
        if (config && config.config_json?.page?.pageTitle) {
          document.title = `${config.config_json.page.pageTitle} - 低代码工作流系统`
          next()
          return
        }
      }
    } catch (error) {
      console.error('获取动态页面标题失败:', error)
    }
  }
  
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 低代码工作流系统`
  } else {
    document.title = '低代码工作流系统'
  }
  next()
})

export default router 
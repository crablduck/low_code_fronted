/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-23 16:26:02
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-10 12:14:37
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
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
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
    meta: { title: '报表设计器 - 编辑', layout: 'designer' }
  },
  {
    path: '/report/design',
    name: 'ReportDesignFullscreen',
    component: () => import('../components/ReportDesigner.vue'),
    meta: { title: '报表设计器', layout: 'fullscreen' }
  },
  {
    path: '/univer-report-designer',
    name: 'UniverReportDesigner',
    component: () => import('../views/UniverReportDesigner.vue'),
    meta: { title: 'Univer报表设计器' }
  },
  {
    path: '/univer-enhanced-designer',
    name: 'UniverEnhancedDesigner',
    component: () => import('../views/UniverEnhancedDesigner.vue'),
    meta: { title: 'Univer增强图表设计器' }
  },
  {
    path: '/univer-report-designer/:id?',
    name: 'UniverReportDesignerEdit',
    component: () => import('../views/UniverReportDesigner.vue'),
    meta: { title: 'Univer报表设计器' }
  },
  {
    path: '/univer-report-manager',
    name: 'UniverReportManager',
    component: () => import('../views/UniverReportManager.vue'),
    meta: { title: 'Univer报表管理' }
  },
  {
    path: '/antv-analysis',
    name: 'AntvAnalysis',
    component: () => import('../views/AntvAnalysis.vue'),
    meta: { title: 'AntV数据分析平台' }
  },
  {
    path: '/integrated-analysis',
    name: 'IntegratedAnalysis',
    component: () => import('../views/IntegratedAnalysis.vue'),
    meta: { title: 'Univer+AntV 数据分析工作台' }
  },
  {
    path: '/form-design',
    name: 'FormDesign',
    component: () => import('../views/FormDesign.vue'),
    meta: { title: '表单设计' }
  },
  // 数据源管理路由
  {
    path: '/datasource-manage',
    name: 'DatasourceManage',
    component: () => import('@/views/DatasourceManage.vue'),
    meta: { title: '数据源管理' }
  },
  {
    path: '/dataset-manage',
    name: 'DatasetManage',
    component: () => import('../views/DatasetManage.vue'),
    meta: { title: '数据集管理' }
  },
  {
    path: '/dataset-designer/:id?',
    name: 'DatasetDesigner',
    component: () => import('../views/DatasetDesigner.vue'),
    meta: { title: '数据集设计器' }
  },
  // 仪表盘相关路由
  {
    path: '/dashboard/list',
    name: 'DashboardList',
    component: () => import('../views/dashboard/List.vue'),
    meta: { title: '仪表盘列表' }
  },
  {
    path: '/dashboard/create',
    name: 'DashboardCreate',
    component: () => import('../views/dashboard/Edit.vue'),
    meta: { title: '新建仪表盘' }
  },
  {
    path: '/dashboard/edit/:id',
    name: 'DashboardEdit',
    component: () => import('../views/dashboard/Edit.vue'),
    meta: { title: '编辑仪表盘' }
  },
  {
    path: '/dashboard/designer/:id?',
    name: 'DashboardDesigner',
    component: () => import('../views/DashboardDesigner.vue'),
    meta: { title: '仪表盘设计器', layout: 'designer' }
  },
  {
    path: '/dashboard/preview/:id',
    name: 'DashboardPreview',
    component: () => import('../views/dashboard/Preview.vue'),
    meta: { title: '仪表盘预览' }
  },
  {
    path: '/dashboard/view/:id',
    name: 'DashboardView',
    component: () => import('../views/dashboard/View.vue'),
    meta: { title: '查看仪表盘' }
  },
  // 示例页面
  {
    path: '/chart-test',
    name: 'ChartTest',
    component: () => import('../views/ChartTest.vue'),
    meta: { title: '图表测试' }
  },
  {
    path: '/examples/basic-usage',
    name: 'ExampleBasicUsage',
    component: () => import('../views/basic-usage.vue'),
    meta: { title: '快速表单向导示例' }
  },
  {
    path: '/data-source-config-demo',
    name: 'DataSourceConfigDemo',
    component: () => import('../views/DataSourceConfigDemo.vue'),
    meta: { title: '数据源配置组件演示' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 认证和页面标题
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 低代码工作流系统`
  } else {
    document.title = '低代码工作流系统'
  }

  // 处理认证
  if (to.meta?.public) {
    // 如果是公开页面且已登录，跳转到首页
    if (userStore.token && to.path === '/login') {
      next('/')
      return
    }
    next()
    return
  }

  // 检查 token
  if (!userStore.token) {
    next('/login')
    return
  }

  // 如果请求中包含 skipAuthCheck 参数，跳过用户信息检查
  if (to.query.skipAuthCheck === 'true') {
    next()
    return
  }

  // 获取用户信息
  if (!userStore.userInfo) {
    try {
      const userInfo = await userStore.getUserInfo()
      if (!userInfo) {
        throw new Error('获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果是 401 错误，清除 token 并跳转到登录页
      if (error.response?.status === 401) {
        userStore.logout()
        next('/login')
        return
      }
      // 其他错误继续尝试
      next()
      return
    }
  }

  // 如果是动态路由，尝试获取真实的页面标题
  if (to.meta?.isDynamic && to.query.formId) {
    try {
      const response = await fetch('http://localhost:4000/api/form-configs')
      const result = await response.json()
      
      if (result.code === 200) {
        const config = result.data.find(item => item.id.toString() === to.query.formId)
        if (config && config.config_json?.page?.pageTitle) {
          document.title = `${config.config_json.page.pageTitle} - 低代码工作流系统`
        }
      }
    } catch (error) {
      console.error('获取动态页面标题失败:', error)
    }
  }
  
  next()
})

export default router 
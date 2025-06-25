/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-23 16:26:02
 * @LastEditors: KrabWW wei17306927526@gmail.com
 * @LastEditTime: 2025-06-25 09:19:46
 * @FilePath: /workflow-system/src/router/index.ts
 * @Description: 路由配置
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from '@/shared/guards/auth.guard'
import { ROUTE_NAMES } from '@/app/constants'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@/features/auth/views/login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    name: ROUTE_NAMES.HOME,
    component: () => import('@/shared/components/HomePage.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/form-designer',
    name: ROUTE_NAMES.FORM_DESIGNER,
    component: () => import('@/features/form-designer/views/index.vue'),
    meta: { title: '表单设计器' }
  },
  {
    path: '/form-designer/edit/:id?',
    name: 'FormDesignerEdit',
    component: () => import('@/features/form-designer/views/edit.vue'),
    meta: { title: '编辑表单' }
  },
  {
    path: '/workflow-designer',
    name: ROUTE_NAMES.WORKFLOW_DESIGNER,
    component: () => import('@/features/workflow/components/WorkflowDesigner.vue'),
    meta: { title: '流程设计器' }
  },
  {
    path: '/print-designer',
    name: 'PrintDesigner',
    component: () => import('@/features/print-designer/views/index.vue'),
    meta: { title: '打印模板设计器' }
  },
  {
    path: '/report-designer',
    name: ROUTE_NAMES.REPORT_DESIGNER,
    component: () => import('@/features/report-designer/views/index.vue'),
    meta: { title: '报表设计器' }
  },
  {
    path: '/report-designer/edit',
    name: 'ReportDesignerEdit',
    component: () => import('@/features/report-designer/components/ReportDesigner.vue'),
    meta: { title: '报表设计器 - 编辑', layout: 'designer' }
  },
  {
    path: '/report/design',
    name: 'ReportDesignFullscreen',
    component: () => import('@/features/report-designer/components/ReportDesigner.vue'),
    meta: { title: '报表设计器', layout: 'fullscreen' }
  },
  {
    path: '/univer-report-designer',
    name: 'UniverReportDesigner',
    component: () => import('@/features/report-designer/views/designer.vue'),
    meta: { title: 'Univer报表设计器' }
  },
  {
    path: '/univer-enhanced-designer',
    name: 'UniverEnhancedDesigner',
    component: () => import('@/features/report-designer/views/enhanced-designer.vue'),
    meta: { title: 'Univer增强图表设计器' }
  },
  {
    path: '/univer-report-designer/:id?',
    name: 'UniverReportDesignerEdit',
    component: () => import('@/features/report-designer/views/designer.vue'),
    meta: { title: 'Univer报表设计器' }
  },
  {
    path: '/univer-report-manager',
    name: 'UniverReportManager',
    component: () => import('@/features/report-designer/views/manager.vue'),
    meta: { title: 'Univer报表管理' }
  },
  {
    path: '/form-design',
    name: 'FormDesign',
    component: () => import('@/features/form-designer/views/designer.vue'),
    meta: { title: '表单设计' }
  },
  // 数据源管理路由
  {
    path: '/datasource-manage',
    name: ROUTE_NAMES.DATA_SOURCE_MANAGE,
    component: () => import('@/features/data-management/views/datasource-manage.vue'),
    meta: { title: '数据源管理' }
  },
  {
    path: '/dataset-manage',
    name: ROUTE_NAMES.DATASET_MANAGE,
    component: () => import('@/features/data-management/views/dataset-manage.vue'),
    meta: { title: '数据集管理' }
  },
  {
    path: '/dataset-designer/:id?',
    name: 'DatasetDesigner',
    component: () => import('@/features/data-management/views/dataset-designer.vue'),
    meta: { title: '数据集设计器' }
  },
  // 仪表盘相关路由
  {
    path: '/dashboard/list',
    name: 'DashboardList',
    component: () => import('@/features/dashboard/views/list.vue'),
    meta: { title: '仪表盘列表' }
  },
  {
    path: '/dashboard/create',
    name: 'DashboardCreate',
    component: () => import('@/features/dashboard/views/edit.vue'),
    meta: { title: '新建仪表盘' }
  },
  {
    path: '/dashboard/edit/:id',
    name: 'DashboardEdit',
    component: () => import('@/features/dashboard/views/edit.vue'),
    meta: { title: '编辑仪表盘' }
  },
  {
    path: '/dashboard/designer/:id?',
    name: 'DashboardDesigner',
    component: () => import('@/features/dashboard/views/designer-refactored.vue'),
    meta: { title: '仪表盘设计器', layout: 'designer' }
  },
  {
    path: '/dashboard/preview/:id',
    name: 'DashboardPreview',
    component: () => import('@/features/dashboard/views/preview.vue'),
    meta: { title: '仪表盘预览' }
  },
  {
    path: '/dashboard/view/:id',
    name: 'DashboardView',
    component: () => import('@/features/dashboard/views/view.vue'),
    meta: { title: '查看仪表盘' }
  },
  {
    path: '/dashboard/traditional-filter-demo',
    name: 'TraditionalFilterDemo',
    component: () => import('@/features/dashboard/views/traditional-filter-demo.vue'),
    meta: { title: '传统样式筛选器演示' }
  },
  {
    path: '/dashboard/transformer-test',
    name: 'TransformerTest',
    component: () => import('@/features/dashboard/views/transformer-test.vue'),
    meta: { title: '数据转换器测试' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 应用路由守卫
router.beforeEach(authGuard)

export default router 
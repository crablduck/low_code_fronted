/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-23 16:26:02
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-26 10:04:08
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
        path: '/form-design',
        name: 'FormDesign',
        component: () => import('../components/FormDesigner.vue'),
        meta: { title: '表单设计器' }
      },
      {
        path: '/workflow-design',
        name: 'WorkflowDesign',
        component: () => import('../components/WorkflowDesigner.vue'),
        meta: { title: '流程设计器' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 低代码工作流系统`
  } else {
    document.title = '低代码工作流系统'
  }
  next()
})

export default router 
-- 创建菜单表
CREATE TABLE `sys_menu` (
  `id` varchar(32) NOT NULL COMMENT '菜单ID',
  `title` varchar(50) NOT NULL COMMENT '菜单名称',
  `path` varchar(200) DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `icon` varchar(50) DEFAULT NULL COMMENT '菜单图标',
  `parent_id` varchar(32) DEFAULT NULL COMMENT '父菜单ID',
  `type` varchar(10) DEFAULT 'menu' COMMENT '类型(menu,button)',
  `permission` varchar(50) DEFAULT NULL COMMENT '权限标识',
  `sort` int DEFAULT '0' COMMENT '排序号',
  `hidden` tinyint(1) DEFAULT '0' COMMENT '是否隐藏(0显示,1隐藏)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表';

-- 插入初始菜单数据
INSERT INTO `sys_menu` (`id`, `title`, `path`, `component`, `icon`, `parent_id`, `type`, `sort`, `hidden`) VALUES
-- 首页
('1', '首页', '/', 'components/HomePage.vue', 'House', NULL, 'menu', 1, 0),

-- 表单设计器
('2', '表单设计器', '/form-designer', 'views/FormDesigner/index.vue', 'Edit', NULL, 'menu', 2, 0),
('2-1', '编辑表单', '/form-designer/edit/:id?', 'views/FormDesigner/edit.vue', 'Edit', '2', 'menu', 1, 1),

-- 打印设计器
('3', '打印设计器', '/print-designer', 'views/PrintDesigner.vue', 'Printer', NULL, 'menu', 3, 0),

-- 报表设计器
('4', '报表设计器', '/report-designer', 'views/ReportDesigner.vue', 'TrendCharts', NULL, 'menu', 4, 0),

-- 仪表盘
('5', '仪表盘', '/dashboard', NULL, 'Monitor', NULL, 'menu', 5, 0),
('5-1', '仪表盘管理', '/dashboard/list', NULL, 'Document', '5', 'menu', 1, 0),
('5-2', '新建仪表盘', '/dashboard/create', NULL, 'Edit', '5', 'menu', 2, 0),
('5-3', '仪表盘设计器', '/dashboard/designer', NULL, 'TrendCharts', '5', 'menu', 3, 0),

-- 数据源管理
('6', '数据源管理', '/datasource-manage', 'views/DatasourceManage.vue', 'DataAnalysis', NULL, 'menu', 6, 0),

-- 数据集管理
('7', '数据集管理', '/dataset-manage', 'views/DatasetManage.vue', 'Grid', NULL, 'menu', 7, 0),

-- API测试工具
('8', 'API测试', '/api-test', 'views/ApiTest.vue', 'Setting', NULL, 'menu', 8, 0);

-- 创建菜单权限关联表
CREATE TABLE `sys_menu_permission` (
  `id` varchar(32) NOT NULL COMMENT '主键ID',
  `menu_id` varchar(32) NOT NULL COMMENT '菜单ID',
  `permission_id` varchar(32) NOT NULL COMMENT '权限ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_menu_permission` (`menu_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单权限关联表'; 
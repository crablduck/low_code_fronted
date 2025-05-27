const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化SQLite数据库
const db = new Database(path.join(__dirname, 'database.sqlite'));

// 创建表结构
const initDatabase = () => {
  // 菜单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      path VARCHAR(200) NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      icon VARCHAR(50) DEFAULT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES menus(id)
    )
  `);

  // 数据源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      host VARCHAR(100),
      port INTEGER,
      database_name VARCHAR(100),
      username VARCHAR(100),
      password VARCHAR(255),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 数据表信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS table_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_source_id VARCHAR(50) NOT NULL,
      table_name VARCHAR(100) NOT NULL,
      table_comment VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
    )
  `);

  // 表单配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS form_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      data_source_id VARCHAR(50) NOT NULL,
      table_name VARCHAR(100),
      config_json TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
    )
  `);

  // 报表表
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'other',
      config_json TEXT,
      status TEXT DEFAULT 'draft',
      creator TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('数据库表创建完成');
};

// 插入初始数据
const insertInitialData = () => {
  // 检查是否已有数据
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menus').get();
  
  if (menuCount.count === 0) {
    // 插入初始菜单数据
    const insertMenu = db.prepare(`
      INSERT INTO menus (name, path, parent_id, icon, sort_order) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const menus = [
      ['系统管理', '/system', null, 'Setting', 1],
      ['业务管理', '/business', null, 'Management', 2],
      ['数据管理', '/data', null, 'DataBoard', 3],
      ['报表管理', '/report', null, 'Document', 4],
      ['用户管理', '/system/users', 1, 'User', 1],
      ['角色管理', '/system/roles', 1, 'UserFilled', 2],
      ['权限管理', '/system/permissions', 1, 'Lock', 3],
      ['业务流程', '/business/workflow', 2, 'Connection', 1],
      ['表单管理', '/business/forms', 2, 'Edit', 2],
      ['数据源管理', '/data/sources', 3, 'Database', 1],
      ['数据表管理', '/data/tables', 3, 'Grid', 2]
    ];

    menus.forEach(menu => {
      insertMenu.run(...menu);
    });

    console.log('初始菜单数据插入完成');
  }

  // 检查数据源数据
  const dataSourceCount = db.prepare('SELECT COUNT(*) as count FROM data_sources').get();
  
  if (dataSourceCount.count === 0) {
    // 插入初始数据源
    const insertDataSource = db.prepare(`
      INSERT INTO data_sources (id, name, type, host, port, database_name) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const dataSources = [
      ['mysql_main', 'MySQL主库', 'mysql', 'localhost', 3306, 'main_db'],
      ['postgres_dev', 'PostgreSQL开发库', 'postgresql', 'localhost', 5432, 'dev_db'],
      ['sqlite_local', 'SQLite本地库', 'sqlite', null, null, 'local.db']
    ];

    dataSources.forEach(ds => {
      insertDataSource.run(...ds);
    });

    console.log('初始数据源数据插入完成');
  }

  // 插入模拟表信息
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM table_info').get();
  
  if (tableCount.count === 0) {
    const insertTable = db.prepare(`
      INSERT INTO table_info (data_source_id, table_name, table_comment) 
      VALUES (?, ?, ?)
    `);

    const tables = [
      ['mysql_main', 'users', '用户表'],
      ['mysql_main', 'products', '商品表'],
      ['mysql_main', 'orders', '订单表'],
      ['mysql_main', 'categories', '分类表'],
      ['postgres_dev', 'patients', '患者表'],
      ['postgres_dev', 'doctors', '医生表'],
      ['postgres_dev', 'appointments', '预约表'],
      ['sqlite_local', 'local_users', '本地用户表'],
      ['sqlite_local', 'local_logs', '本地日志表']
    ];

    tables.forEach(table => {
      insertTable.run(...table);
    });

    console.log('初始表信息数据插入完成');
  }
};

// API路由

// 获取菜单列表
app.get('/api/menu-list', (req, res) => {
  try {
    const menus = db.prepare(`
      SELECT id, name, path, parent_id, icon, sort_order 
      FROM menus 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `).all();

    res.json({
      code: 200,
      message: 'success',
      data: menus
    });
  } catch (error) {
    console.error('获取菜单列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取菜单列表失败',
      error: error.message
    });
  }
});

// 获取数据源列表
app.get('/api/data-sources', (req, res) => {
  try {
    const dataSources = db.prepare(`
      SELECT id, name, type, host, port, database_name 
      FROM data_sources 
      WHERE is_active = 1
    `).all();

    res.json({
      code: 200,
      message: 'success',
      data: dataSources
    });
  } catch (error) {
    console.error('获取数据源列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取数据源列表失败',
      error: error.message
    });
  }
});

// 根据数据源获取表列表
app.get('/api/table-list', (req, res) => {
  try {
    const { db: dataSourceId } = req.query;
    
    if (!dataSourceId) {
      return res.status(400).json({
        code: 400,
        message: '缺少数据源参数'
      });
    }

    const tables = db.prepare(`
      SELECT table_name as name, table_comment as comment 
      FROM table_info 
      WHERE data_source_id = ?
    `).all(dataSourceId);

    res.json({
      code: 200,
      message: 'success',
      data: tables
    });
  } catch (error) {
    console.error('获取表列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取表列表失败',
      error: error.message
    });
  }
});

// 创建新菜单
app.post('/api/menus', (req, res) => {
  try {
    const { name, path, parent_id, icon, sort_order } = req.body;
    
    const insertMenu = db.prepare(`
      INSERT INTO menus (name, path, parent_id, icon, sort_order) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insertMenu.run(name, path, parent_id || null, icon || null, sort_order || 0);
    
    res.json({
      code: 200,
      message: '菜单创建成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('创建菜单失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建菜单失败',
      error: error.message
    });
  }
});

// 删除菜单
app.delete('/api/menus/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteMenu = db.prepare('DELETE FROM menus WHERE id = ?');
    const result = deleteMenu.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '菜单不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '菜单删除成功'
    });
  } catch (error) {
    console.error('删除菜单失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除菜单失败',
      error: error.message
    });
  }
});

// 更新菜单
app.put('/api/menus/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, path, parent_id, icon, sort_order } = req.body;
    
    const updateMenu = db.prepare(`
      UPDATE menus 
      SET name = ?, path = ?, parent_id = ?, icon = ?, sort_order = ?
      WHERE id = ?
    `);
    
    const result = updateMenu.run(
      name, 
      path, 
      parent_id || null, 
      icon || null, 
      sort_order || 0,
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '菜单不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '菜单更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新菜单失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新菜单失败',
      error: error.message
    });
  }
});

// 保存表单配置
app.post('/api/form-configs', (req, res) => {
  try {
    const { name, description, data_source_id, table_name, config_json, status } = req.body;
    
    const insertForm = db.prepare(`
      INSERT INTO form_configs (name, description, data_source_id, table_name, config_json, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertForm.run(
      name, 
      description || null, 
      data_source_id, 
      table_name || null, 
      JSON.stringify(config_json), 
      status || 'draft'
    );
    
    res.json({
      code: 200,
      message: '表单配置保存成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('保存表单配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '保存表单配置失败',
      error: error.message
    });
  }
});

// 获取表单配置列表
app.get('/api/form-configs', (req, res) => {
  try {
    const forms = db.prepare(`
      SELECT 
        fc.*,
        ds.name as data_source_name
      FROM form_configs fc
      LEFT JOIN data_sources ds ON fc.data_source_id = ds.id
      ORDER BY fc.updated_at DESC
    `).all();

    // 解析JSON配置
    const formattedForms = forms.map(form => ({
      ...form,
      config_json: JSON.parse(form.config_json)
    }));

    res.json({
      code: 200,
      message: 'success',
      data: formattedForms
    });
  } catch (error) {
    console.error('获取表单配置列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取表单配置列表失败',
      error: error.message
    });
  }
});

// 获取单个表单配置
app.get('/api/form-configs/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const form = db.prepare(`
      SELECT 
        fc.*,
        ds.name as data_source_name
      FROM form_configs fc
      LEFT JOIN data_sources ds ON fc.data_source_id = ds.id
      WHERE fc.id = ?
    `).get(id);

    if (!form) {
      return res.status(404).json({
        code: 404,
        message: '表单配置不存在'
      });
    }

    // 解析JSON配置
    const formattedForm = {
      ...form,
      config_json: JSON.parse(form.config_json)
    };

    res.json({
      code: 200,
      message: 'success',
      data: formattedForm
    });
  } catch (error) {
    console.error('获取表单配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取表单配置失败',
      error: error.message
    });
  }
});

// 更新表单配置
app.put('/api/form-configs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, data_source_id, table_name, config_json, status } = req.body;
    
    const updateForm = db.prepare(`
      UPDATE form_configs 
      SET name = ?, description = ?, data_source_id = ?, table_name = ?, 
          config_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = updateForm.run(
      name, 
      description || null, 
      data_source_id || 1, 
      table_name || null, 
      JSON.stringify(config_json), 
      status || 'draft',
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '表单配置不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '表单配置更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新表单配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新表单配置失败',
      error: error.message
    });
  }
});

// 删除表单配置
app.delete('/api/form-configs/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteForm = db.prepare('DELETE FROM form_configs WHERE id = ?');
    const result = deleteForm.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '表单配置不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '表单配置删除成功'
    });
  } catch (error) {
    console.error('删除表单配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除表单配置失败',
      error: error.message
    });
  }
});

// 发布表单配置
app.post('/api/form-configs/:id/publish', (req, res) => {
  try {
    const { id } = req.params;
    const { parentMenuId, routePath, pageTitle } = req.body;
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 1. 更新表单状态为已发布
      const updateForm = db.prepare(`
        UPDATE form_configs 
        SET status = 'published', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      const formResult = updateForm.run(id);
      
      if (formResult.changes === 0) {
        throw new Error('表单配置不存在');
      }
      
      // 2. 获取表单配置
      const form = db.prepare('SELECT * FROM form_configs WHERE id = ?').get(id);
      const config = JSON.parse(form.config_json);
      
      // 3. 创建菜单项
      if (parentMenuId && routePath) {
        const insertMenu = db.prepare(`
          INSERT INTO menus (name, path, parent_id, icon, sort_order) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        // 获取父菜单下的最大排序号
        const maxSort = db.prepare(`
          SELECT COALESCE(MAX(sort_order), 0) as max_sort 
          FROM menus 
          WHERE parent_id = ?
        `).get(parentMenuId);
        
        const menuResult = insertMenu.run(
          pageTitle || form.name,
          `/${routePath}`,
          parentMenuId,
          'Document',
          (maxSort.max_sort || 0) + 1
        );
        
        return {
          formId: id,
          menuId: menuResult.lastInsertRowid,
          routePath,
          pageTitle: pageTitle || form.name
        };
      }
      
      return {
        formId: id,
        routePath: config.page?.routePath || 'default',
        pageTitle: config.page?.pageTitle || form.name
      };
    });
    
    const result = transaction();
    
    res.json({
      code: 200,
      message: '表单发布成功',
      data: result
    });
  } catch (error) {
    console.error('发布表单失败:', error);
    res.status(500).json({
      code: 500,
      message: '发布表单失败',
      error: error.message
    });
  }
});

// 取消发布表单配置
app.post('/api/form-configs/:id/unpublish', (req, res) => {
  try {
    const { id } = req.params;
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 1. 更新表单状态为草稿
      const updateForm = db.prepare(`
        UPDATE form_configs 
        SET status = 'draft', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      const formResult = updateForm.run(id);
      
      if (formResult.changes === 0) {
        throw new Error('表单配置不存在');
      }
      
      // 2. 获取表单配置
      const form = db.prepare('SELECT * FROM form_configs WHERE id = ?').get(id);
      const config = JSON.parse(form.config_json);
      
      // 3. 删除相关的菜单项（如果存在）
      if (config.page?.routePath) {
        const deleteMenu = db.prepare(`
          DELETE FROM menus 
          WHERE path = ? OR path = ?
        `);
        
        // 删除可能的菜单路径格式
        deleteMenu.run(`/${config.page.routePath}`, config.page.routePath);
      }
      
      return {
        formId: id,
        routePath: config.page?.routePath || 'default',
        pageTitle: config.page?.pageTitle || form.name
      };
    });
    
    const result = transaction();
    
    res.json({
      code: 200,
      message: '表单取消发布成功',
      data: result
    });
  } catch (error) {
    console.error('取消发布表单失败:', error);
    res.status(500).json({
      code: 500,
      message: '取消发布表单失败',
      error: error.message
    });
  }
});

// 保存表单配置并生成CRUD页面
app.post('/api/form-configs/create-with-page', (req, res) => {
  try {
    const { formConfig } = req.body;
    const { basic, template, page } = formConfig;
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 1. 保存表单配置
      const insertForm = db.prepare(`
        INSERT INTO form_configs (name, description, data_source_id, table_name, config_json, status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // 确保data_source_id有值，如果没有则使用字符串形式的默认值
      let dataSourceId = basic.dataSource;
      if (!dataSourceId) {
        // 获取第一个可用的数据源
        const firstDataSource = db.prepare('SELECT id FROM data_sources WHERE is_active = 1 LIMIT 1').get();
        dataSourceId = firstDataSource ? firstDataSource.id : 'mysql_main';
      }
      
      const formResult = insertForm.run(
        basic.name,
        basic.description || null,
        dataSourceId,
        basic.existingTable || null,
        JSON.stringify(formConfig),
        'published'
      );
      
      const formId = formResult.lastInsertRowid;
      
      // 2. 如果需要自动生成菜单，创建菜单项
      if (page.autoGenerateMenu && page.parentMenu) {
        const insertMenu = db.prepare(`
          INSERT INTO menus (name, path, parent_id, icon, sort_order) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        // 获取父菜单下的最大排序号
        const maxSort = db.prepare(`
          SELECT COALESCE(MAX(sort_order), 0) as max_sort 
          FROM menus 
          WHERE parent_id = ?
        `).get(page.parentMenu);
        
        const menuResult = insertMenu.run(
          page.pageTitle || basic.name,
          `/${page.routePath}`,
          page.parentMenu,
          'Document',
          (maxSort.max_sort || 0) + 1
        );
        
        return {
          formId,
          menuId: menuResult.lastInsertRowid,
          routePath: page.routePath,
          pageTitle: page.pageTitle || basic.name
        };
      }
      
      return {
        formId,
        routePath: page.routePath,
        pageTitle: page.pageTitle || basic.name
      };
    });
    
    const result = transaction();
    
    res.json({
      code: 200,
      message: '表单和页面创建成功',
      data: result
    });
  } catch (error) {
    console.error('创建表单和页面失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建表单和页面失败',
      error: error.message
    });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 报表相关API接口

// 获取报表列表
app.get('/api/reports', (req, res) => {
  try {
    const { page = 1, size = 20, keyword = '', category = '', status = '', startDate = '', endDate = '' } = req.query;
    
    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (startDate && endDate) {
      sql += ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    }
    
    // 计算总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;
    
    // 分页查询
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), (parseInt(page) - 1) * parseInt(size));
    
    const reports = db.prepare(sql).all(...params);
    
    // 解析配置JSON
    const processedReports = reports.map(report => ({
      ...report,
      config: report.config_json ? JSON.parse(report.config_json) : null
    }));
    
    res.json({
      code: 200,
      message: '获取报表列表成功',
      data: {
        list: processedReports,
        total: total,
        page: parseInt(page),
        size: parseInt(size)
      }
    });
  } catch (error) {
    console.error('获取报表列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取报表列表失败',
      error: error.message
    });
  }
});

// 获取单个报表详情
app.get('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    
    if (!report) {
      return res.status(404).json({
        code: 404,
        message: '报表不存在'
      });
    }
    
    // 解析配置JSON
    const processedReport = {
      ...report,
      config: report.config_json ? JSON.parse(report.config_json) : null
    };
    
    res.json({
      code: 200,
      message: '获取报表详情成功',
      data: processedReport
    });
  } catch (error) {
    console.error('获取报表详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取报表详情失败',
      error: error.message
    });
  }
});

// 创建报表
app.post('/api/reports', (req, res) => {
  try {
    const { name, description, category, config, status = 'draft' } = req.body;
    
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '报表名称不能为空'
      });
    }
    
    const configJson = JSON.stringify(config || {});
    
    const insertReport = db.prepare(`
      INSERT INTO reports (name, description, category, config_json, status, creator, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = insertReport.run(
      name,
      description || '',
      category || 'other',
      configJson,
      status,
      'admin' // 这里应该从认证信息中获取
    );
    
    res.json({
      code: 200,
      message: '报表创建成功',
      data: {
        id: result.lastInsertRowid,
        name,
        description,
        category,
        config,
        status
      }
    });
  } catch (error) {
    console.error('创建报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建报表失败',
      error: error.message
    });
  }
});

// 更新报表
app.put('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, config, status } = req.body;
    
    const configJson = JSON.stringify(config || {});
    
    const updateReport = db.prepare(`
      UPDATE reports 
      SET name = ?, description = ?, category = ?, config_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = updateReport.run(
      name,
      description || '',
      category || 'other',
      configJson,
      status || 'draft',
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '报表不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '报表更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新报表失败',
      error: error.message
    });
  }
});

// 删除报表
app.delete('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteReport = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = deleteReport.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '报表不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '报表删除成功'
    });
  } catch (error) {
    console.error('删除报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除报表失败',
      error: error.message
    });
  }
});

// 发布报表
app.post('/api/reports/:id/publish', (req, res) => {
  try {
    const { id } = req.params;
    
    const updateReport = db.prepare(`
      UPDATE reports 
      SET status = 'published', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = updateReport.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '报表不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '报表发布成功'
    });
  } catch (error) {
    console.error('发布报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '发布报表失败',
      error: error.message
    });
  }
});

// 取消发布报表
app.post('/api/reports/:id/unpublish', (req, res) => {
  try {
    const { id } = req.params;
    
    const updateReport = db.prepare(`
      UPDATE reports 
      SET status = 'draft', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = updateReport.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '报表不存在'
      });
    }
    
    res.json({
      code: 200,
      message: '取消发布成功'
    });
  } catch (error) {
    console.error('取消发布报表失败:', error);
    res.status(500).json({
      code: 500,
      message: '取消发布报表失败',
      error: error.message
    });
  }
});

// 表单模板相关接口
// 获取表单模板列表
app.get('/api/form_templates', (req, res) => {
  try {
    // 模拟表单模板数据
    const templates = [
      {
        id: 1,
        name: "患者入院登记表",
        description: "患者入院时需要填写的基本信息表单",
        category: "医疗表单",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      },
      {
        id: 2,
        name: "员工信息登记表",
        description: "新员工入职信息登记表单",
        category: "人事表单",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      },
      {
        id: 3,
        name: "设备维护记录表",
        description: "设备维护保养记录表单",
        category: "设备管理",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-03T00:00:00.000Z",
        updatedAt: "2024-01-03T00:00:00.000Z"
      }
    ];

    res.json({
      code: 200,
      message: 'success',
      data: templates
    });
  } catch (error) {
    console.error('获取表单模板列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取表单模板列表失败',
      error: error.message
    });
  }
});

// 获取完整表单模板（包含字段）
app.get('/api/form-templates/:id/full', (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟完整模板数据
    const templates = {
      1: {
        id: 1,
        name: "患者入院登记表",
        description: "患者入院时需要填写的基本信息表单",
        category: "医疗表单",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        fields: [
          {
            id: 1,
            fieldName: "patientName",
            fieldLabel: "患者姓名",
            fieldType: "text",
            dataType: "VARCHAR",
            required: true,
            placeholder: "请输入患者姓名",
            maxLength: 50,
            sortOrder: 1,
            validation: { required: true, message: "患者姓名不能为空" },
            options: []
          },
          {
            id: 2,
            fieldName: "patientAge",
            fieldLabel: "患者年龄",
            fieldType: "number",
            dataType: "INT",
            required: true,
            placeholder: "请输入年龄",
            sortOrder: 2,
            validation: { required: true, min: 0, max: 150, message: "请输入有效年龄" },
            options: []
          },
          {
            id: 3,
            fieldName: "gender",
            fieldLabel: "性别",
            fieldType: "radio",
            dataType: "VARCHAR",
            required: true,
            sortOrder: 3,
            validation: { required: true, message: "请选择性别" },
            options: [
              { label: "男", value: "male" },
              { label: "女", value: "female" }
            ]
          },
          {
            id: 4,
            fieldName: "admissionDate",
            fieldLabel: "入院日期",
            fieldType: "date",
            dataType: "DATE",
            required: true,
            sortOrder: 4,
            validation: { required: true, message: "请选择入院日期" },
            options: []
          }
        ]
      },
      2: {
        id: 2,
        name: "员工信息登记表",
        description: "新员工入职信息登记表单",
        category: "人事表单",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
        fields: [
          {
            id: 5,
            fieldName: "employeeName",
            fieldLabel: "员工姓名",
            fieldType: "text",
            dataType: "VARCHAR",
            required: true,
            placeholder: "请输入员工姓名",
            maxLength: 50,
            sortOrder: 1,
            validation: { required: true, message: "员工姓名不能为空" },
            options: []
          },
          {
            id: 6,
            fieldName: "department",
            fieldLabel: "部门",
            fieldType: "select",
            dataType: "VARCHAR",
            required: true,
            sortOrder: 2,
            validation: { required: true, message: "请选择部门" },
            options: [
              { label: "技术部", value: "tech" },
              { label: "人事部", value: "hr" },
              { label: "财务部", value: "finance" },
              { label: "市场部", value: "marketing" }
            ]
          },
          {
            id: 7,
            fieldName: "position",
            fieldLabel: "职位",
            fieldType: "text",
            dataType: "VARCHAR",
            required: true,
            placeholder: "请输入职位",
            sortOrder: 3,
            validation: { required: true, message: "职位不能为空" },
            options: []
          }
        ]
      },
      3: {
        id: 3,
        name: "设备维护记录表",
        description: "设备维护保养记录表单",
        category: "设备管理",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-03T00:00:00.000Z",
        updatedAt: "2024-01-03T00:00:00.000Z",
        fields: [
          {
            id: 8,
            fieldName: "equipmentName",
            fieldLabel: "设备名称",
            fieldType: "text",
            dataType: "VARCHAR",
            required: true,
            placeholder: "请输入设备名称",
            sortOrder: 1,
            validation: { required: true, message: "设备名称不能为空" },
            options: []
          },
          {
            id: 9,
            fieldName: "maintenanceType",
            fieldLabel: "维护类型",
            fieldType: "select",
            dataType: "VARCHAR",
            required: true,
            sortOrder: 2,
            validation: { required: true, message: "请选择维护类型" },
            options: [
              { label: "日常保养", value: "daily" },
              { label: "定期维护", value: "regular" },
              { label: "故障维修", value: "repair" },
              { label: "升级改造", value: "upgrade" }
            ]
          },
          {
            id: 10,
            fieldName: "maintenanceDate",
            fieldLabel: "维护日期",
            fieldType: "date",
            dataType: "DATE",
            required: true,
            sortOrder: 3,
            validation: { required: true, message: "请选择维护日期" },
            options: []
          },
          {
            id: 11,
            fieldName: "description",
            fieldLabel: "维护描述",
            fieldType: "textarea",
            dataType: "TEXT",
            required: false,
            placeholder: "请输入维护详细描述",
            sortOrder: 4,
            validation: {},
            options: []
          }
        ]
      }
    };

    const template = templates[id];
    if (!template) {
      return res.status(404).json({
        code: 404,
        message: '表单模板不存在'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: template
    });
  } catch (error) {
    console.error('获取表单模板详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取表单模板详情失败',
      error: error.message
    });
  }
});

// 获取单个表单模板
app.get('/api/form_templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const templates = {
      1: {
        id: 1,
        name: "患者入院登记表",
        description: "患者入院时需要填写的基本信息表单",
        category: "医疗表单",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      },
      2: {
        id: 2,
        name: "员工信息登记表",
        description: "新员工入职信息登记表单",
        category: "人事表单",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      },
      3: {
        id: 3,
        name: "设备维护记录表",
        description: "设备维护保养记录表单",
        category: "设备管理",
        status: "published",
        createdBy: 1,
        createdAt: "2024-01-03T00:00:00.000Z",
        updatedAt: "2024-01-03T00:00:00.000Z"
      }
    };

    const template = templates[id];
    if (!template) {
      return res.status(404).json({
        code: 404,
        message: '表单模板不存在'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: template
    });
  } catch (error) {
    console.error('获取表单模板失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取表单模板失败',
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  
  // 初始化数据库
  initDatabase();
  insertInitialData();
  
  console.log('✅ 数据库初始化完成');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  db.close();
  process.exit(0);
}); 
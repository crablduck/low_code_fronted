const cors = require('cors');

module.exports = (req, res, next) => {
  // 启用CORS
  cors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://172.16.1.57:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })(req, res, () => {
    
    // 添加自定义响应头
    res.header('X-API-Version', '1.0.0');
    res.header('X-Powered-By', 'Workflow Mock Server');
    
    // 模拟延迟（可选，用于测试加载状态）
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        next();
      }, Math.random() * 500); // 0-500ms随机延迟
    } else {
      next();
    }
  });
}; 
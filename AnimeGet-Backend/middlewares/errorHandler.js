// middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  // 在服务器控制台打印详细错误信息，方便调试
  console.error('An error occurred:');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Error Stack:', err.stack);

  // 向客户端发送一个通用的错误响应
  // 不要在生产环境中暴露详细的错误信息
  res.status(500).json({
    message: 'Internal Server Error'
  });
}

module.exports = errorHandler;

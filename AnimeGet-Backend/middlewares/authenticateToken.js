// middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // 区分token过期和无效token
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token has expired.' });
      }
      return res.status(403).json({ message: 'Token is invalid.' });
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;

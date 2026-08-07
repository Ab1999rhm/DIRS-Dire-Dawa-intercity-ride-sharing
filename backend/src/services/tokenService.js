const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set! Authentication will not work.');
}

const generateTokens = (userId) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured on the server.');

  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });

  const refreshToken = jwt.sign({ id: userId }, JWT_SECRET + '_refresh', {
    expiresIn: JWT_REFRESH_EXPIRE
  });

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured on the server.');
  return jwt.verify(token, JWT_SECRET + '_refresh');
};

module.exports = { generateTokens, verifyRefreshToken };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token invalid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }
    next();
  };
};

const verified = (req, res, next) => {
  if (req.user.role === 'driver') {
    const Driver = require('../models/Driver');
    Driver.findOne({ user: req.user._id }).then(driver => {
      if (!driver || driver.verificationStatus !== 'approved') {
        return res.status(403).json({ error: 'Driver account not verified' });
      }
      req.driver = driver;
      next();
    }).catch(err => {
      return res.status(500).json({ error: 'Error checking verification status' });
    });
  } else {
    next();
  }
};

module.exports = { protect, authorize, verified };

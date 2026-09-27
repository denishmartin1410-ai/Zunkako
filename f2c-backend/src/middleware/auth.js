const {auth, db} = require('../config/firebase');

/**
 * Middleware to verify Firebase Auth ID Token or Bearer Token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split('Bearer ')[1]
      : req.body.token || req.body.userToken || req.body.adminToken || req.body.farmerToken;

    if (!token) {
      return res.status(401).json({success: false, error: 'Authentication token required'});
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    // Attach user profile info
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    req.userProfile = userDoc.exists ? userDoc.data() : null;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({success: false, error: 'Invalid or expired token'});
  }
};

/**
 * Middleware to require Admin role
 */
const requireAdmin = async (req, res, next) => {
  if (!req.userProfile || req.userProfile.userType !== 'admin') {
    return res.status(403).json({success: false, error: 'Access denied: Admin role required'});
  }
  next();
};

/**
 * Middleware to require Farmer role
 */
const requireFarmer = async (req, res, next) => {
  if (!req.userProfile || (req.userProfile.userType !== 'farmer' && req.userProfile.userType !== 'admin')) {
    return res.status(403).json({success: false, error: 'Access denied: Farmer role required'});
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireFarmer,
};

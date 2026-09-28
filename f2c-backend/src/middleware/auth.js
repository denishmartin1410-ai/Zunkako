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

    // Attach user profile info & check for banned status
    if (db) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const profile = userDoc.exists ? userDoc.data() : null;
      req.userProfile = profile;

      if (profile && (profile.accountStatus === 'banned' || profile.accountStatus === 'suspended' || profile.isBanned === true)) {
        return res.status(403).json({ success: false, error: 'Access denied: Your account has been suspended or banned.' });
      }
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({success: false, error: 'Invalid or expired token'});
  }
};

/**
 * Middleware to require Admin role (checks custom claims or DB userType/role)
 */
const requireAdmin = async (req, res, next) => {
  const role = req.user?.role || req.userProfile?.userType || req.userProfile?.role;
  if (role !== 'admin' && role !== 'super_admin' && !req.user?.admin && !req.user?.super_admin) {
    return res.status(403).json({success: false, error: 'Access denied: Admin role required'});
  }
  next();
};

/**
 * Middleware to require Super Admin role
 */
const requireSuperAdmin = async (req, res, next) => {
  const role = req.user?.role || req.userProfile?.userType || req.userProfile?.role;
  const isSuperAdmin = req.user?.super_admin === true || role === 'super_admin';
  if (!isSuperAdmin) {
    return res.status(403).json({success: false, error: 'Access denied: Super Admin role required'});
  }
  next();
};

/**
 * Middleware to require Farmer role
 */
const requireFarmer = async (req, res, next) => {
  const role = req.user?.role || req.userProfile?.userType || req.userProfile?.role;
  if (role !== 'farmer' && role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({success: false, error: 'Access denied: Farmer role required'});
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireFarmer,
};

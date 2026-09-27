const {db} = require('../config/firebase');

/**
 * Update FCM Token for user to receive Push Notifications
 */
const updateFCMToken = async (req, res) => {
  try {
    const {userId, fcmToken} = req.body;
    const targetUid = userId || req.user?.uid;

    if (!targetUid || !fcmToken) {
      return res.status(400).json({success: false, error: 'userId and fcmToken are required'});
    }

    await db.collection('users').doc(targetUid).set(
      {
        fcmToken,
        updatedAt: new Date().toISOString(),
      },
      {merge: true},
    );

    res.json({success: true, message: 'FCM Token updated successfully'});
  } catch (error) {
    console.error('updateFCMToken Error:', error.message);
    res.status(500).json({success: false, error: error.message});
  }
};

/**
 * Get User Profile
 */
const getUserProfile = async (req, res) => {
  try {
    const uid = req.params.userId || req.user?.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({success: false, error: 'User not found'});
    }

    res.json({success: true, data: {id: userDoc.id, ...userDoc.data()}});
  } catch (error) {
    console.error('getUserProfile Error:', error.message);
    res.status(500).json({success: false, error: error.message});
  }
};

module.exports = {
  updateFCMToken,
  getUserProfile,
};

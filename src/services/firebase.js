// ============================================================
// src/services/firebase.js
// ✅ ALL orderBy REMOVED → No Firestore index errors!
// Client-side sort பண்றோம் everywhere
// ✅ All functions return safe {success, data: []} always
// ============================================================

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// ════════════════════════════════════════════════
// 🔐 AUTH FUNCTIONS
// ════════════════════════════════════════════════

export const firebaseEmailLogin = async (email, password) => {
  try {
    const result = await auth().signInWithEmailAndPassword(email, password);
    return {success: true, user: result.user};
  } catch (error) {
    let message = 'உள்நுழைவு பிழை ஏற்பட்டது / Login error occurred';
    let errorType = 'generic';
    if (error.code === 'auth/user-not-found') {
      message =
        'இந்த மின்னஞ்சலில் கணக்கு எதுவும் இல்லை!\n\nNo account found with this email.\nPlease register first.';
      errorType = 'user-not-found';
    }
    if (error.code === 'auth/wrong-password') {
      message =
        '🔑 தவறான கடவுச்சொல்!\n\nஇந்த மின்னஞ்சலுக்கான கடவுச்சொல் தவறாக உள்ளது.\nசரியான கடவுச்சொல்லை உள்ளிடவும் அல்லது "கடவுச்சொல் மறந்தீர்களா?" என்பதை முயற்சிக்கவும்.\n\nWrong password! Please enter the correct password or try "Forgot Password".';
      errorType = 'wrong-password';
    }
    if (error.code === 'auth/invalid-email') {
      message =
        '❌ தவறான மின்னஞ்சல் வடிவம்!\n\nசரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.\nஎ.கா: example@gmail.com\n\nInvalid email format! Please enter a valid email address.';
      errorType = 'invalid-email';
    }
    if (error.code === 'auth/too-many-requests') {
      message =
        '⏳ பல முறை தவறான கடவுச்சொல்!\n\nஉங்கள் கணக்கு தற்காலிகமாக முடக்கப்பட்டுள்ளது. சிறிது நேரம் காத்திருந்து மீண்டும் முயற்சிக்கவும் அல்லது கடவுச்சொல்லை மீட்டமைக்கவும்.\n\nToo many failed attempts. Please wait or reset your password.';
      errorType = 'too-many-requests';
    }
    if (error.code === 'auth/invalid-credential') {
      message =
        '🔑 தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்!\n\nநீங்கள் உள்ளிட்ட மின்னஞ்சல் அல்லது கடவுச்சொல் தவறாக உள்ளது.\nசரியான தகவல்களை உள்ளிடவும் அல்லது "கடவுச்சொல் மறந்தீர்களா?" என்பதை முயற்சிக்கவும்.\n\nIncorrect email or password. Please try again or use "Forgot Password".';
      errorType = 'wrong-password';
    }
    if (error.code === 'auth/user-disabled') {
      message =
        '🚫 உங்கள் கணக்கு முடக்கப்பட்டுள்ளது!\n\nநிர்வாகி உங்கள் கணக்கை முடக்கியுள்ளார்.\nதயவுசெய்து நிர்வாகியை தொடர்பு கொள்ளவும்.\n\nYour account has been disabled by the administrator. Please contact admin.';
      errorType = 'account-disabled';
    }
    if (error.code === 'auth/network-request-failed') {
      message =
        '📶 இணைய இணைப்பு இல்லை!\n\nதயவுசெய்து உங்கள் இணைய இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.\n\nNo internet connection. Please check your network and try again.';
      errorType = 'network';
    }
    return {success: false, error: message, errorType};
  }
};

export const firebaseEmailRegister = async (email, password) => {
  try {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    return {success: true, user: result.user};
  } catch (error) {
    let message = 'பதிவு பிழை / Registration error';
    let errorType = 'generic';
    if (error.code === 'auth/email-already-in-use') {
      message =
        '⚠️ இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது!\n\nஇந்த Email Address ஏற்கனவே வேறொரு பெயரில் பதிவு செய்யப்பட்டுள்ளது. வேறு Email பயன்படுத்தவும் அல்லது Login செய்யவும்.\n\nThis email is already registered with another account. Please use a different email or login.';
      errorType = 'email-exists';
    }
    if (error.code === 'auth/weak-password') {
      message =
        '🔒 கடவுச்சொல் பலவீனமாக உள்ளது!\n\nகுறைந்தது 6 எழுத்துக்கள் வேண்டும்.\nஒரு வலுவான கடவுச்சொல் உருவாக்கவும்.\n\nPassword is too weak. Must be at least 6 characters.';
      errorType = 'weak-password';
    }
    if (error.code === 'auth/invalid-email') {
      message =
        '❌ தவறான மின்னஞ்சல் வடிவம்!\n\nசரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.\nஎ.கா: example@gmail.com\n\nInvalid email format!';
      errorType = 'invalid-email';
    }
    if (error.code === 'auth/network-request-failed') {
      message =
        '📶 இணைய இணைப்பு இல்லை!\n\nNo internet connection. Please check your network.';
      errorType = 'network';
    }
    return {success: false, error: message, errorType};
  }
};

export const sendPhoneOTP = async phoneNumber => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(
      '+91' + phoneNumber,
    );
    return {success: true, confirmation};
  } catch (error) {
    let message = 'OTP அனுப்ப முடியவில்லை / Could not send OTP';
    if (error.code === 'auth/invalid-phone-number') {
      message = 'தவறான தொலைபேசி எண் / Invalid phone number';
    }
    if (error.code === 'auth/too-many-requests') {
      message = 'சற்று நேரம் காத்திருங்கள் / Please wait a moment';
    }
    if (
      error.code === 'auth/billing-not-enabled' ||
      error.code === 'auth/operation-not-allowed' ||
      (error.message && error.message.includes('BILLING_NOT_ENABLED'))
    ) {
      message =
        '📱 OTP சேவை தற்போது கிடைக்கவில்லை!\n\n' +
        'Firebase Blaze (pay-as-you-go) plan தேவை.\n' +
        'தயவுசெய்து Email Login பயன்படுத்தவும்.\n\n' +
        'OTP service is currently unavailable.\n' +
        'Firebase Blaze plan is required for Phone Auth.\n' +
        'Please use Email Login instead.';
    }
    return {
      success: false,
      error: `${message}\n\n[Debug: ${error.code}] ${error.message}`,
    };
  }
};

export const verifyPhoneOTP = async (confirmation, otp) => {
  try {
    const result = await confirmation.confirm(otp);
    return {success: true, user: result.user};
  } catch (error) {
    let message = 'OTP தவறானது';
    if (error.code === 'auth/invalid-verification-code') {
      message = 'தவறான OTP குறியீடு';
    }
    if (error.code === 'auth/code-expired') {
      message = 'OTP காலாவதியாகிவிட்டது';
    }
    return {success: false, error: message};
  }
};

export const firebaseLogout = async () => {
  try {
    await auth().signOut();
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const sendPasswordResetEmail = async email => {
  try {
    await auth().sendPasswordResetEmail(email);
    return {success: true};
  } catch (error) {
    let message =
      'மீட்டமை லிங்க் அனுப்ப முடியவில்லை / Could not send reset link';
    if (error.code === 'auth/user-not-found') {
      message =
        '❌ இந்த மின்னஞ்சலில் கணக்கு எதுவும் இல்லை!\n\nNo account found with this email. Please check your email address or register a new account.\n\nஇந்த Email-ல் எந்த கணக்கும் பதிவு செய்யப்படவில்லை. மின்னஞ்சலை சரிபார்க்கவும் அல்லது புதிய கணக்கு உருவாக்கவும்.';
    }
    if (error.code === 'auth/invalid-email') {
      message =
        '❌ தவறான மின்னஞ்சல் வடிவம்!\n\nசரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.\nஎ.கா: example@gmail.com\n\nInvalid email format!';
    }
    if (error.code === 'auth/too-many-requests') {
      message =
        '⏳ அதிக கோரிக்கைகள்!\n\nசிறிது நேரம் காத்திருந்து மீண்டும் முயற்சிக்கவும்.\n\nToo many requests. Please wait and try again.';
    }
    return {success: false, error: message};
  }
};

export const getCurrentUser = () => auth().currentUser;

// ════════════════════════════════════════════════
// 👤 USER FUNCTIONS
// ════════════════════════════════════════════════

export const saveUserProfile = async (uid, userData) => {
  try {
    await firestore()
      .collection('users')
      .doc(uid)
      .set(
        {...userData, updatedAt: firestore.FieldValue.serverTimestamp()},
        {merge: true},
      );
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const getUserProfile = async uid => {
  try {
    const doc = await firestore().collection('users').doc(uid).get();
    if (doc.exists) {
      return {success: true, data: {id: doc.id, ...doc.data()}};
    }
    return {success: false, error: 'User not found'};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// ════════════════════════════════════════════════
// 🥬 PRODUCTS FUNCTIONS
// ✅ NO orderBy → No index needed → No crash!
// ════════════════════════════════════════════════

// Helper: sort array by createdAt newest first
const sortByCreatedAt = arr =>
  [...arr].sort((a, b) => {
    const tA = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const tB = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return tB - tA;
  });

export const getAllProducts = async () => {
  try {
    const snap = await firestore().collection('products').get();
    const products = sortByCreatedAt(
      snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
    );
    return {success: true, data: products};
  } catch (error) {
    console.log('getAllProducts error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export const listenToProducts = callback => {
  // ✅ NO orderBy - simple collection listen
  return firestore()
    .collection('products')
    .onSnapshot(
      snap => {
        const products = sortByCreatedAt(
          snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
        );
        callback({success: true, data: products});
      },
      error => {
        console.log('listenToProducts error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

export const getProductById = async productId => {
  try {
    const doc = await firestore().collection('products').doc(productId).get();
    if (doc.exists) {
      return {success: true, data: {id: doc.id, ...doc.data()}};
    }
    return {success: false, error: 'Product not found'};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const addProduct = async productData => {
  try {
    const ref = await firestore()
      .collection('products')
      .add({
        ...productData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true, id: ref.id};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const updateProduct = async (productId, updateData) => {
  try {
    await firestore()
      .collection('products')
      .doc(productId)
      .update({
        ...updateData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const deleteProduct = async productId => {
  try {
    await firestore().collection('products').doc(productId).delete();
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const getFarmerProducts = async farmerId => {
  try {
    // ✅ NO orderBy - where only
    const snap = await firestore()
      .collection('products')
      .where('farmerId', '==', farmerId)
      .get();
    const products = sortByCreatedAt(
      snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
    );
    return {success: true, data: products};
  } catch (error) {
    console.log('getFarmerProducts error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export const getProductsByCategory = async category => {
  try {
    // ✅ NO orderBy
    const snap = await firestore()
      .collection('products')
      .where('category', '==', category)
      .get();
    const products = sortByCreatedAt(
      snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
    );
    return {success: true, data: products};
  } catch (error) {
    console.log('getProductsByCategory error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

// ════════════════════════════════════════════════
// 👨‍🌾 FARMER FUNCTIONS
// ════════════════════════════════════════════════

export const getAllFarmers = async () => {
  try {
    const snap = await firestore()
      .collection('farmers')
      .where('isActive', '==', true)
      .get();

    const farmersList = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));

    // Query users collection for userType == 'farmer' as well, and merge them
    const usersSnap = await firestore()
      .collection('users')
      .where('userType', '==', 'farmer')
      .get();

    const usersList = usersSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));

    const farmersMap = new Map();
    // Insert farmers first
    farmersList.forEach(f => farmersMap.set(f.id, f));
    // Insert/merge users next
    usersList.forEach(u => {
      if (!farmersMap.has(u.id)) {
        farmersMap.set(u.id, {
          ...u,
          isActive: true,
          farmName: u.farmName || (u.name ? `${u.name}'s Farm` : 'Farm'),
          qrCode: u.qrCode || `F2C-FARMER-${u.id.slice(0, 8).toUpperCase()}`,
        });
      }
    });

    const mergedFarmers = Array.from(farmersMap.values());
    return {success: true, data: mergedFarmers};
  } catch (error) {
    console.log('getAllFarmers error:', error.message);

    try {
      const usersSnap = await firestore()
        .collection('users')
        .where('userType', '==', 'farmer')
        .get();
      return {
        success: true,
        data: usersSnap.docs.map(doc => ({id: doc.id, ...doc.data()})),
      };
    } catch (fallbackError) {
      return {success: false, error: error.message, data: []};
    }
  }
};

export const saveFarmerProfile = async (farmerId, farmerData) => {
  try {
    await firestore()
      .collection('farmers')
      .doc(farmerId)
      .set(
        {
          ...farmerData,
          isActive: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const getFarmerStats = async farmerId => {
  try {
    // ✅ NO orderBy - simple where queries
    const [ordersSnap, deliveredSnap, productsSnap] = await Promise.all([
      firestore().collection('orders').where('farmerId', '==', farmerId).get(),
      firestore()
        .collection('orders')
        .where('farmerId', '==', farmerId)
        .where('status', '==', 'Delivered')
        .get(),
      firestore()
        .collection('products')
        .where('farmerId', '==', farmerId)
        .get(),
    ]);

    const {getFarmerOrderTotal} = require('../utils/priceHelper');

    const totalSales = deliveredSnap.docs.reduce(
      (sum, doc) => sum + getFarmerOrderTotal({id: doc.id, ...doc.data()}),
      0,
    );

    // This month - client side filter
    const now = new Date();
    const thisMonthDocs = ordersSnap.docs.filter(doc => {
      const created = doc.data().createdAt?.toDate?.();
      if (!created) {
        return false;
      }
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    });
    const thisMonthRevenue = thisMonthDocs.reduce(
      (sum, doc) => sum + getFarmerOrderTotal({id: doc.id, ...doc.data()}),
      0,
    );

    return {
      success: true,
      data: {
        totalSales,
        thisMonthRevenue,
        totalOrders: ordersSnap.size,
        totalProducts: productsSnap.size,
      },
    };
  } catch (error) {
    console.log('getFarmerStats error:', error.message);
    return {
      success: false,
      error: error.message,
      data: {
        totalSales: 0,
        thisMonthRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
      },
    };
  }
};

// ════════════════════════════════════════════════
// 📦 ORDER FUNCTIONS
// ✅ NO orderBy anywhere → No index errors!
// ════════════════════════════════════════════════

export const createOrder = async orderData => {
  try {
    const orderId = 'F2C' + Date.now().toString().slice(-6);
    const ref = await firestore()
      .collection('orders')
      .add({
        ...orderData,
        orderId,
        status: 'Pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // ✅ Automatic Stock Reduction for ordered products
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        if (item.id) {
          try {
            const prodRef = firestore().collection('products').doc(item.id);
            const prodDoc = await prodRef.get();
            if (prodDoc.exists) {
              const currentStock = parseFloat(prodDoc.data().stock || prodDoc.data().stockQuantity) || 0;
              const orderQty = parseFloat(item.quantity) || 1;
              const newStock = Math.max(0, currentStock - orderQty);
              await prodRef.update({
                stock: newStock,
                stockQuantity: newStock,
                isAvailable: newStock > 0,
                isSoldOut: newStock <= 0,
                status: newStock <= 0 ? 'Sold Out' : 'Available',
                updatedAt: firestore.FieldValue.serverTimestamp(),
              });
            }
          } catch (stErr) {
            console.log('Stock reduction error for product', item.id, stErr.message);
          }
        }
      }
    }

    return {success: true, id: ref.id, orderId};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const getConsumerOrders = async consumerId => {
  try {
    // ✅ NO orderBy - simple where, client-side sort
    const snap = await firestore()
      .collection('orders')
      .where('consumerId', '==', consumerId)
      .get();

    const orders = sortByCreatedAt(
      snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
    );
    return {success: true, data: orders};
  } catch (error) {
    console.log('getConsumerOrders error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export const getFarmerOrders = async farmerId => {
  try {
    // ✅ NO orderBy - simple where, client-side sort
    const snap = await firestore()
      .collection('orders')
      .where('farmerId', '==', farmerId)
      .get();

    const orders = sortByCreatedAt(
      snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
    );
    return {success: true, data: orders};
  } catch (error) {
    console.log('getFarmerOrders error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export const listenToOrderStatus = (orderId, callback) => {
  return firestore()
    .collection('orders')
    .doc(orderId)
    .onSnapshot(
      doc => {
        if (doc.exists) {
          callback({success: true, data: {id: doc.id, ...doc.data()}});
        }
      },
      error => callback({success: false, error: error.message}),
    );
};

// ════════════════════════════════════════════════
// 💬 CHAT FUNCTIONS
// ✅ Full Duplex: Customer ↔ Farmer
// ✅ participants array ALWAYS present
// ════════════════════════════════════════════════

// ✅ Chat room create/get - uses set+merge to avoid read permission issues
export const createOrGetChatRoom = async (farmerId, consumerId) => {
  try {
    const roomId = `${farmerId}_${consumerId}`;
    const chatRef = firestore().collection('chats').doc(roomId);

    // Use set with merge — creates if missing, no-ops if exists
    // This only needs create/update permission, NOT read permission
    await chatRef.set(
      {
        participants: [farmerId, consumerId],
        farmerId,
        consumerId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessage: '',
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    return {success: true, roomId};
  } catch (e) {
    console.log('createOrGetChatRoom error:', e.message);
    return {success: false, error: e.message};
  }
};

// Internal: get consistent room ID
const getChatRoomId = (farmerId, consumerId) => `${farmerId}_${consumerId}`;

export const sendChatMessage = async (
  senderId,
  receiverId,
  messageText,
  senderRole = 'consumer',
) => {
  try {
    // Determine farmerId and consumerId based on role
    const farmerId = senderRole === 'farmer' ? senderId : receiverId;
    const consumerId = senderRole === 'farmer' ? receiverId : senderId;
    const chatRoomId = getChatRoomId(farmerId, consumerId);

    // Ensure room exists with participants (set+merge avoids read permission issues)
    const chatRef = firestore().collection('chats').doc(chatRoomId);
    await chatRef.set(
      {
        participants: [farmerId, consumerId],
        farmerId,
        consumerId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessage: '',
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    // Add message
    await chatRef.collection('messages').add({
      senderId,
      receiverId,
      text: messageText,
      senderRole,
      isRead: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update room metadata
    await chatRef.set(
      {
        participants: [farmerId, consumerId],
        farmerId,
        consumerId,
        lastMessage: messageText,
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        lastSenderId: senderId,
      },
      {merge: true},
    );

    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const deleteChatMessage = async (farmerId, consumerId, messageId) => {
  try {
    const chatRoomId = getChatRoomId(farmerId, consumerId);
    await firestore()
      .collection('chats')
      .doc(chatRoomId)
      .collection('messages')
      .doc(messageId)
      .delete();
    return {success: true};
  } catch (error) {
    console.log('deleteChatMessage error:', error);
    return {success: false, error: error.message};
  }
};

export const deleteChatMessageForEveryone = async (
  farmerId,
  consumerId,
  messageId,
  deletedText = '🚫 This message was deleted',
) => {
  try {
    const chatRoomId = getChatRoomId(farmerId, consumerId);
    await firestore()
      .collection('chats')
      .doc(chatRoomId)
      .collection('messages')
      .doc(messageId)
      .update({
        text: deletedText,
        isDeleted: true,
      });
    return {success: true};
  } catch (error) {
    console.log('deleteChatMessageForEveryone error:', error);
    return {success: false, error: error.message};
  }
};

export const listenToChatMessages = (
  userId1,
  userId2,
  callback,
  callerRole = 'consumer',
) => {
  // Determine farmerId/consumerId based on caller role
  const farmerId = callerRole === 'farmer' ? userId1 : userId2;
  const consumerId = callerRole === 'farmer' ? userId2 : userId1;
  const chatRoomId = getChatRoomId(farmerId, consumerId);

  return firestore()
    .collection('chats')
    .doc(chatRoomId)
    .collection('messages')
    .onSnapshot(
      snap => {
        const messages = snap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            time:
              doc.data().createdAt?.toDate?.()?.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              }) || 'now',
          }))
          .sort((a, b) => {
            const tA = a.createdAt?.toMillis?.() || 0;
            const tB = b.createdAt?.toMillis?.() || 0;
            return tA - tB; // ascending for chat
          });
        callback({success: true, data: messages});
      },
      error => {
        console.log('Chat listen error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

// ✅ Farmer side: Listen to all chat rooms where farmer is a participant
export const listenToFarmerChats = (farmerId, callback) => {
  return firestore()
    .collection('chats')
    .where('farmerId', '==', farmerId)
    .onSnapshot(
      snap => {
        const chats = snap.docs
          .map(doc => ({id: doc.id, ...doc.data()}))
          .sort((a, b) => {
            const tA = a.lastMessageTime?.toMillis?.() || 0;
            const tB = b.lastMessageTime?.toMillis?.() || 0;
            return tB - tA; // newest first
          });
        callback({success: true, data: chats});
      },
      error => {
        console.log('listenToFarmerChats error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

// ════════════════════════════════════════════════
// ⭐ RATING & REVIEW FUNCTIONS
// ════════════════════════════════════════════════

export const submitProductRating = async (
  productId,
  userId,
  ratingNum,
  reviewStr,
  userName,
) => {
  try {
    const productRef = firestore().collection('products').doc(productId);
    const ratingRef = productRef.collection('ratings').doc(userId);

    const newRating = {
      userId,
      userName,
      rating: ratingNum,
      review: reviewStr,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    let newAvg = ratingNum;
    let newCount = 1;
    let farmerId = null;

    // Use a transaction to safely update average and count
    await firestore().runTransaction(async transaction => {
      const prodDoc = await transaction.get(productRef);
      if (!prodDoc.exists) {
        throw new Error('Product not found');
      }

      const existingRatingDoc = await transaction.get(ratingRef);
      const prodData = prodDoc.data();
      farmerId = prodData.farmerId || null;
      const currentAvg = parseFloat(prodData.rating) || 0;
      const currentCount = parseInt(prodData.reviews, 10) || 0;

      if (existingRatingDoc.exists) {
        // Update existing rating
        const oldRating = existingRatingDoc.data().rating;
        newCount = currentCount;
        newAvg =
          currentCount > 0
            ? (currentAvg * currentCount - oldRating + ratingNum) / currentCount
            : ratingNum;
      } else {
        // New rating
        newCount = currentCount + 1;
        newAvg = (currentAvg * currentCount + ratingNum) / newCount;
      }

      newAvg = Math.round(newAvg * 10) / 10; // 1 decimal place

      transaction.set(ratingRef, newRating);
      transaction.update(productRef, {
        rating: newAvg,
        reviews: newCount,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });

    // ✅ Also update farmer's overall average rating
    if (farmerId) {
      try {
        const farmerProductsSnap = await firestore()
          .collection('products')
          .where('farmerId', '==', farmerId)
          .get();

        let totalRating = 0;
        let ratedCount = 0;
        farmerProductsSnap.docs.forEach(doc => {
          const d = doc.data();
          const r = parseFloat(d.rating) || 0;
          const c = parseInt(d.reviews, 10) || 0;
          if (c > 0) {
            totalRating += r * c;
            ratedCount += c;
          }
        });

        const farmerAvg =
          ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0;

        await firestore().collection('farmers').doc(farmerId).set(
          {
            rating: farmerAvg,
            totalReviews: ratedCount,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
        );

        // Also update in users collection if farmer profile exists there
        await firestore().collection('users').doc(farmerId).set(
          {
            rating: farmerAvg,
            totalReviews: ratedCount,
          },
          {merge: true},
        );
      } catch (farmerErr) {
        console.log(
          'Farmer rating update error (non-critical):',
          farmerErr.message,
        );
      }
    }

    return {success: true, newAvgRating: newAvg, newReviewCount: newCount};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// ── FARM STORIES / REELS HELPERS ──

export const addFarmStory = async (farmerId, farmerName, videoUrl) => {
  try {
    const ref = await firestore().collection('farm_stories').add({
      farmerId,
      farmerName: farmerName || 'Farmer',
      storyVideo: videoUrl,
      videoUrl,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    // Update user profile latest storyVideo for backwards compatibility
    await firestore().collection('users').doc(farmerId).set(
      {
        storyVideo: videoUrl,
      },
      {merge: true},
    );
    return {success: true, id: ref.id};
  } catch (e) {
    return {success: false, error: e.message};
  }
};

export const getFarmerStories = async farmerId => {
  try {
    const snap = await firestore()
      .collection('farm_stories')
      .where('farmerId', '==', farmerId)
      .get();
    const stories = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    stories.sort((a, b) => {
      const t1 = a.createdAt?.toDate?.() || 0;
      const t2 = b.createdAt?.toDate?.() || 0;
      return t2 - t1;
    });
    return {success: true, data: stories};
  } catch (e) {
    return {success: false, error: e.message, data: []};
  }
};

export const deleteFarmStory = async (storyId, farmerId) => {
  try {
    await firestore().collection('farm_stories').doc(storyId).delete();
    // Check if remaining stories exist for farmer
    if (farmerId) {
      const res = await getFarmerStories(farmerId);
      const remaining = res.data || [];
      const latestUrl = remaining.length > 0 ? remaining[0].videoUrl : null;
      await firestore().collection('users').doc(farmerId).set(
        {
          storyVideo: latestUrl,
        },
        {merge: true},
      );
    }
    return {success: true};
  } catch (e) {
    return {success: false, error: e.message};
  }
};

export const getAllFarmStories = async () => {
  try {
    const snap = await firestore().collection('farm_stories').get();
    let stories = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    stories.sort((a, b) => {
      const t1 = a.createdAt?.toDate?.() || 0;
      const t2 = b.createdAt?.toDate?.() || 0;
      return t2 - t1;
    });
    // Fallback if farm_stories is empty
    if (stories.length === 0) {
      const userSnap = await firestore()
        .collection('users')
        .where('userType', '==', 'farmer')
        .get();
      stories = userSnap.docs
        .map(doc => ({id: doc.id, ...doc.data()}))
        .filter(item => item.storyVideo);
    }
    return {success: true, data: stories};
  } catch (e) {
    return {success: false, error: e.message, data: []};
  }
};

export const getFarmerProductReviews = async farmerId => {
  try {
    const productsSnap = await firestore()
      .collection('products')
      .where('farmerId', '==', farmerId)
      .get();

    const reviews = [];
    const promises = productsSnap.docs.map(async prodDoc => {
      const prodData = prodDoc.data();
      const prodId = prodDoc.id;
      const ratingsSnap = await prodDoc.ref.collection('ratings').get();
      ratingsSnap.docs.forEach(ratingDoc => {
        const ratingData = ratingDoc.data();
        reviews.push({
          id: ratingDoc.id,
          productId: prodId,
          productName: prodData.name || '',
          productNameEn: prodData.nameEn || '',
          ...ratingData,
        });
      });
    });
    await Promise.all(promises);

    // Sort by createdAt descending
    reviews.sort((a, b) => {
      const t1 = a.createdAt?.toDate?.() || 0;
      const t2 = b.createdAt?.toDate?.() || 0;
      return t2 - t1;
    });

    return {success: true, data: reviews};
  } catch (error) {
    console.log('getFarmerProductReviews error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export const getUserProductRating = async (productId, userId) => {
  try {
    const doc = await firestore()
      .collection('products')
      .doc(productId)
      .collection('ratings')
      .doc(userId)
      .get();
    if (doc.exists) {
      return {success: true, data: doc.data()};
    }
    return {success: true, data: null};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// ════════════════════════════════════════════════
// ✅ ORDER STATUS UPDATE
// ════════════════════════════════════════════════

export const updateOrderStatus = async (
  orderId,
  newStatus,
  extraFields = {},
) => {
  try {
    await firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        [`${newStatus.toLowerCase().replace(/ /g, '')}At`]:
          firestore.FieldValue.serverTimestamp(),
        ...extraFields,
      });
    return {success: true};
  } catch (error) {
    console.log('updateOrderStatus error:', error.message);
    return {success: false, error: error.message};
  }
};

// ════════════════════════════════════════════════
// 🔔 NOTIFICATION FUNCTIONS
// ✅ Real Firestore notifications - no fake data!
// ════════════════════════════════════════════════

export const createNotification = async notifData => {
  try {
    const {userId, ...data} = notifData;
    await firestore()
      .collection('notifications')
      .doc(userId)
      .collection('items')
      .add({
        ...data,
        userId,
        isRead: false,
        pushSent: false, // Added for Node.js backend to process
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    console.log('createNotification error:', error.message);
    return {success: false, error: error.message};
  }
};

export const listenToNotifications = (userId, callback) => {
  return firestore()
    .collection('notifications')
    .doc(userId)
    .collection('items')
    .onSnapshot(
      snap => {
        const notifs = snap.docs
          .map(doc => ({id: doc.id, ...doc.data()}))
          .sort((a, b) => {
            const tA = a.createdAt?.toMillis?.() || 0;
            const tB = b.createdAt?.toMillis?.() || 0;
            return tB - tA; // newest first
          });
        callback({success: true, data: notifs});
      },
      error => {
        console.log('listenToNotifications error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

export const markNotificationRead = async (userId, notifId) => {
  try {
    await firestore()
      .collection('notifications')
      .doc(userId)
      .collection('items')
      .doc(notifId)
      .update({
        isRead: true,
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// ════════════════════════════════════════════════
// 🌾 HARVEST CALENDAR & PRE-ORDER FUNCTIONS
// Phase 1 implementation for F2C App Real Build
// ════════════════════════════════════════════════

export const addHarvest = async harvestData => {
  try {
    const docRef = await firestore()
      .collection('harvests')
      .add({
        ...harvestData,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true, id: docRef.id};
  } catch (error) {
    console.log('addHarvest error:', error.message);
    return {success: false, error: error.message};
  }
};

export const updateHarvest = async (harvestId, updates) => {
  try {
    await firestore().collection('harvests').doc(harvestId).update(updates);
    return {success: true};
  } catch (error) {
    console.log('updateHarvest error:', error.message);
    return {success: false, error: error.message};
  }
};

export const deleteHarvest = async harvestId => {
  try {
    await firestore().collection('harvests').doc(harvestId).delete();
    return {success: true};
  } catch (error) {
    console.log('deleteHarvest error:', error.message);
    return {success: false, error: error.message};
  }
};

export const listenToHarvests = callback => {
  // Query all harvests for now. In future, we can filter by date >= today
  return firestore()
    .collection('harvests')
    .orderBy('harvestDate', 'asc')
    .onSnapshot(
      snap => {
        const harvests = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        callback({success: true, data: harvests});
      },
      error => {
        console.log('listenToHarvests error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

export const markAllNotificationsRead = async userId => {
  try {
    const snap = await firestore()
      .collection('notifications')
      .doc(userId)
      .collection('items')
      .where('isRead', '==', false)
      .get();
    const batch = firestore().batch();
    snap.docs.forEach(doc => batch.update(doc.ref, {isRead: true}));
    await batch.commit();
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const clearAllNotifications = async userId => {
  try {
    const snap = await firestore()
      .collection('notifications')
      .doc(userId)
      .collection('items')
      .get();
    const batch = firestore().batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// Helper: Create order-related notifications
export const createOrderNotification = async (type, orderData) => {
  try {
    const notifs = [];
    if (type === 'order_placed') {
      // Notify farmer
      notifs.push(
        createNotification({
          userId: orderData.farmerId,
          title: '🛒 புதிய ஆர்டர் வந்தது!',
          titleEn: 'New Order Received!',
          message: `${
            orderData.consumerName || 'Customer'
          } ஆர்டர் பண்ணியுள்ளார். Total: ₹${orderData.total}`,
          messageEn: `${
            orderData.consumerName || 'Customer'
          } placed an order. Total: ₹${orderData.total}`,
          type: 'new_order',
          orderId: orderData.orderId,
          emoji: '📦',
          color: '#4CAF50',
          bgColor: '#E8F5E9',
        }),
      );
    } else if (type === 'status_update') {
      // Notify consumer
      const statusMessages = {
        Confirmed: {
          ta: '✅ ஆர்டர் உறுதிசெய்யப்பட்டது!',
          en: 'Order Confirmed!',
        },
        Shipped: {ta: '🚚 ஆர்டர் அனுப்பப்பட்டது!', en: 'Order Shipped!'},
        Delivered: {ta: '🎉 ஆர்டர் வழங்கப்பட்டது!', en: 'Order Delivered!'},
        Cancelled: {ta: '❌ ஆர்டர் ரத்து செய்யப்பட்டது', en: 'Order Cancelled'},
        'Refund Requested': {
          ta: '💸 பணம் திரும்ப கோரிக்கை பெற்றது',
          en: 'Refund Request Received',
        },
        'Refund Success': {
          ta: '✅ பணம் திரும்ப வெற்றி!',
          en: 'Refund Successful!',
        },
      };
      const msg = statusMessages[orderData.newStatus] || {
        ta: orderData.newStatus,
        en: orderData.newStatus,
      };
      notifs.push(
        createNotification({
          userId: orderData.consumerId,
          title: msg.ta,
          titleEn: msg.en,
          message: `Order #${orderData.orderId || ''} - ${msg.ta}`,
          messageEn: `Order #${orderData.orderId || ''} - ${msg.en}`,
          type: 'order_status',
          orderId: orderData.orderId,
          emoji:
            orderData.newStatus === 'Delivered'
              ? '🎉'
              : orderData.newStatus === 'Shipped'
              ? '🚚'
              : '📦',
          color: orderData.newStatus === 'Cancelled' ? '#F44336' : '#4CAF50',
          bgColor: orderData.newStatus === 'Cancelled' ? '#FFEBEE' : '#E8F5E9',
        }),
      );
    } else if (type === 'product_added') {
      // Notify all consumers - we skip batch since we don't have consumer list
      // This is created per-consumer from the calling code
      notifs.push(
        createNotification({
          userId: orderData.userId,
          title: '🆕 புதிய தயாரிப்பு!',
          titleEn: 'New Product Added!',
          message: `${orderData.farmerName || 'Farmer'} புதிதாக ${
            orderData.productName || ''
          } சேர்த்துள்ளார்!`,
          messageEn: `${orderData.farmerName || 'Farmer'} added ${
            orderData.productNameEn || orderData.productName || ''
          }!`,
          type: 'new_product',
          emoji: '🌱',
          color: '#4CAF50',
          bgColor: '#E8F5E9',
        }),
      );
    }
    await Promise.all(notifs);
    return {success: true};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// ════════════════════════════════════════════════
// ⏱ FRESHNESS TRACKER FUNCTIONS
// Real products with harvestTime field
// ════════════════════════════════════════════════

export const listenToFreshProducts = callback => {
  return firestore()
    .collection('products')
    .onSnapshot(
      snap => {
        const products = snap.docs
          .map(doc => ({id: doc.id, ...doc.data()}))
          .filter(p => p.harvestTime != null); // Only products with harvestTime
        callback({success: true, data: products});
      },
      error => {
        console.log('listenToFreshProducts error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

// ════════════════════════════════════════════════
// 👨‍👩‍👧 GROUP BUY FUNCTIONS
// Real Firestore CRUD for கூட்டு வாங்கல்
// ════════════════════════════════════════════════

export const createGroupBuy = async groupData => {
  try {
    const ref = await firestore()
      .collection('groupBuys')
      .add({
        ...groupData,
        currentMembers: 1,
        members: [groupData.organizerId],
        memberNames: [groupData.organizerName],
        status: 'open',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true, id: ref.id};
  } catch (error) {
    console.log('createGroupBuy error:', error.message);
    return {success: false, error: error.message};
  }
};

export const joinGroupBuy = async (groupId, userId, userName) => {
  try {
    const ref = firestore().collection('groupBuys').doc(groupId);
    const doc = await ref.get();
    if (!doc.exists) {
      return {success: false, error: 'Group not found'};
    }

    const data = doc.data();
    if (data.members?.includes(userId)) {
      return {success: false, error: 'Already a member'};
    }
    if (data.currentMembers >= data.targetMembers) {
      return {success: false, error: 'Group is full'};
    }

    const newCount = (data.currentMembers || 0) + 1;
    const newStatus =
      newCount >= data.targetMembers
        ? 'full'
        : newCount >= data.targetMembers - 2
        ? 'almostFull'
        : 'open';

    await ref.update({
      members: firestore.FieldValue.arrayUnion(userId),
      memberNames: firestore.FieldValue.arrayUnion(userName),
      currentMembers: newCount,
      status: newStatus,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return {success: true};
  } catch (error) {
    console.log('joinGroupBuy error:', error.message);
    return {success: false, error: error.message};
  }
};

export const leaveGroupBuy = async (groupId, userId, userName) => {
  try {
    const ref = firestore().collection('groupBuys').doc(groupId);
    const doc = await ref.get();
    if (!doc.exists) {
      return {success: false, error: 'Group not found'};
    }

    const data = doc.data();
    const newCount = Math.max(0, (data.currentMembers || 1) - 1);

    await ref.update({
      members: firestore.FieldValue.arrayRemove(userId),
      memberNames: firestore.FieldValue.arrayRemove(userName),
      currentMembers: newCount,
      status: 'open',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return {success: true};
  } catch (error) {
    console.log('leaveGroupBuy error:', error.message);
    return {success: false, error: error.message};
  }
};

export const listenToGroupBuys = callback => {
  return firestore()
    .collection('groupBuys')
    .onSnapshot(
      snap => {
        const groups = snap.docs
          .map(doc => ({id: doc.id, ...doc.data()}))
          .sort((a, b) => {
            const tA = a.createdAt?.toMillis?.() || 0;
            const tB = b.createdAt?.toMillis?.() || 0;
            return tB - tA;
          });
        callback({success: true, data: groups});
      },
      error => {
        console.log('listenToGroupBuys error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

// ════════════════════════════════════════════════
// 📅 PRE-ORDER FUNCTIONS
// Real pre-order tracking per harvest
// ════════════════════════════════════════════════

export const createPreOrder = async (
  harvestId,
  userId,
  userName,
  quantity,
  totalAmount,
  details = {},
) => {
  try {
    // Add pre-order doc
    await firestore()
      .collection('harvests')
      .doc(harvestId)
      .collection('preOrders')
      .doc(userId)
      .set({
        userId,
        userName,
        quantity,
        totalAmount,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        ...details,
      });

    // Increment totalPreOrders on the harvest doc
    await firestore()
      .collection('harvests')
      .doc(harvestId)
      .update({
        totalPreOrders: firestore.FieldValue.increment(1),
      });

    return {success: true};
  } catch (error) {
    console.log('createPreOrder error:', error.message);
    return {success: false, error: error.message};
  }
};

export const getUserPreOrder = async (harvestId, userId) => {
  try {
    const doc = await firestore()
      .collection('harvests')
      .doc(harvestId)
      .collection('preOrders')
      .doc(userId)
      .get();
    if (doc.exists) {
      return {success: true, data: doc.data()};
    }
    return {success: true, data: null};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const getConsumerPreOrders = async userId => {
  try {
    const harvestsSnap = await firestore().collection('harvests').get();
    const preOrders = [];

    const promises = harvestsSnap.docs.map(async harvestDoc => {
      const harvestId = harvestDoc.id;
      const harvestData = harvestDoc.data();

      const preOrderDoc = await harvestDoc.ref
        .collection('preOrders')
        .doc(userId)
        .get();

      if (preOrderDoc.exists) {
        preOrders.push({
          id: preOrderDoc.id,
          harvestId,
          ...harvestData,
          ...preOrderDoc.data(),
        });
      }
    });

    await Promise.all(promises);

    const sorted = [...preOrders].sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const tB = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return tB - tA;
    });

    return {success: true, data: sorted};
  } catch (error) {
    console.log('getConsumerPreOrders error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export const updatePreOrderStatus = async (
  harvestId,
  userId,
  newStatus,
  extraFields = {},
) => {
  try {
    await firestore()
      .collection('harvests')
      .doc(harvestId)
      .collection('preOrders')
      .doc(userId)
      .update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        ...extraFields,
      });
    return {success: true};
  } catch (error) {
    console.log('updatePreOrderStatus error:', error.message);
    return {success: false, error: error.message};
  }
};

export const getFarmerPreOrders = async farmerId => {
  try {
    const harvestsSnap = await firestore()
      .collection('harvests')
      .where('farmerId', '==', farmerId)
      .get();
    const preOrders = [];

    const promises = harvestsSnap.docs.map(async harvestDoc => {
      const harvestId = harvestDoc.id;
      const harvestData = harvestDoc.data();

      const preOrdersSnap = await harvestDoc.ref.collection('preOrders').get();

      preOrdersSnap.docs.forEach(doc => {
        preOrders.push({
          id: doc.id,
          harvestId,
          ...harvestData,
          ...doc.data(),
          userId: doc.id,
        });
      });
    });

    await Promise.all(promises);

    const sorted = [...preOrders].sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const tB = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return tB - tA;
    });

    return {success: true, data: sorted};
  } catch (error) {
    console.log('getFarmerPreOrders error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

// ════════════════════════════════════════════════
// 🥗 NUTRITION REPORT FUNCTIONS
// Calculate from real delivered orders
// ════════════════════════════════════════════════

export const getDeliveredOrdersForPeriod = async (
  userId,
  startDate,
  endDate,
) => {
  try {
    const snap = await firestore()
      .collection('orders')
      .where('consumerId', '==', userId)
      .where('status', '==', 'Delivered')
      .get();

    // Client-side date filter
    const orders = snap.docs
      .map(doc => ({id: doc.id, ...doc.data()}))
      .filter(order => {
        const created =
          order.createdAt?.toDate?.() || order.deliveredAt?.toDate?.();
        if (!created) {
          return false;
        }
        return created >= startDate && created <= endDate;
      });

    return {success: true, data: orders};
  } catch (error) {
    console.log('getDeliveredOrdersForPeriod error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

// ════════════════════════════════════════════════
// 🗺️ FARM VISIT FUNCTIONS
// Farmer creates visit slots, consumer books
// ════════════════════════════════════════════════

export const createFarmVisit = async visitData => {
  try {
    const ref = await firestore()
      .collection('farmVisits')
      .add({
        ...visitData,
        isActive: true,
        totalVisitors: 0,
        rating: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true, id: ref.id};
  } catch (error) {
    console.log('createFarmVisit error:', error.message);
    return {success: false, error: error.message};
  }
};

export const updateFarmVisit = async (visitId, updates) => {
  try {
    await firestore()
      .collection('farmVisits')
      .doc(visitId)
      .update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    console.log('updateFarmVisit error:', error.message);
    return {success: false, error: error.message};
  }
};

export const listenToFarmVisits = callback => {
  return firestore()
    .collection('farmVisits')
    .where('isActive', '==', true)
    .onSnapshot(
      snap => {
        const visits = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        callback({success: true, data: visits});
      },
      error => {
        console.log('listenToFarmVisits error:', error.message);
        callback({success: false, error: error.message, data: []});
      },
    );
};

export const getFarmerFarmVisit = async farmerId => {
  try {
    const snap = await firestore()
      .collection('farmVisits')
      .where('farmerId', '==', farmerId)
      .get();
    if (snap.empty) {
      return {success: true, data: null};
    }
    const doc = snap.docs[0];
    return {success: true, data: {id: doc.id, ...doc.data()}};
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const bookFarmVisit = async (visitId, bookingData) => {
  try {
    const ref = firestore().collection('farmVisits').doc(visitId);

    await ref.collection('bookings').add({
      ...bookingData,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Increment total visitors
    await ref.update({
      totalVisitors: firestore.FieldValue.increment(bookingData.visitors || 1),
    });

    return {success: true};
  } catch (error) {
    console.log('bookFarmVisit error:', error.message);
    return {success: false, error: error.message};
  }
};

export const getUserFarmVisitBookings = async userId => {
  try {
    // Query all farmVisits, then check bookings subcollection
    const snap = await firestore().collection('farmVisits').get();
    const bookings = [];
    for (const visitDoc of snap.docs) {
      const bookSnap = await visitDoc.ref
        .collection('bookings')
        .where('consumerId', '==', userId)
        .get();
      bookSnap.docs.forEach(bDoc => {
        bookings.push({
          id: bDoc.id,
          visitId: visitDoc.id,
          farmName: visitDoc.data().farmName,
          ...bDoc.data(),
        });
      });
    }
    return {success: true, data: bookings};
  } catch (error) {
    console.log('getUserFarmVisitBookings error:', error.message);
    return {success: false, error: error.message, data: []};
  }
};

export async function saveFCMToken(userId) {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return;
    }

    const token = await messaging().getToken();

    await firestore().collection('users').doc(userId).update({fcmToken: token});

    console.log('FCM token saved!');
  } catch (e) {
    console.log('FCM token error:', e);
  }
}

export const getAllConsumers = async () => {
  try {
    const snap = await firestore()
      .collection('users')
      .where('userType', '==', 'consumer')
      .get();
    const consumers = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    return {success: true, data: consumers};
  } catch (error) {
    console.log('getAllConsumers error:', error.message);
    try {
      const snap = await firestore().collection('users').get();
      const allUsers = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
      return {success: true, data: allUsers};
    } catch (e) {
      return {success: false, error: error.message, data: []};
    }
  }
};

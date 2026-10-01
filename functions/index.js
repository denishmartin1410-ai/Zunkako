// ============================================================
// Firebase Functions - SMS + WhatsApp Notifications
// File location: functions/index.js
// (இது React Native project folder-க்கு வெளியே இருக்கும்)
// ============================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

// ── Twilio Credentials (Firebase Environment Variables) ──
// Terminal-ல் இதை run பண்ணு (one-time setup):
// firebase functions:config:set twilio.sid="YOUR_SID" twilio.token="YOUR_TOKEN" twilio.phone="+17372508034"

const getTwilioClient = () => {
  const sid = functions.config().twilio?.sid || 'YOUR_TWILIO_SID';
  const token = functions.config().twilio?.token || 'YOUR_TWILIO_TOKEN';
  return twilio(sid, token);
};

// ════════════════════════════════════════════════════════
// FUNCTION 1: Order Status மாறும்போது SMS அனுப்பு
// Trigger: Firestore orders/{orderId} document update
// ════════════════════════════════════════════════════════
exports.sendOrderStatusSMS = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const orderId = context.params.orderId;

    // Status மாறவில்லை என்றால் exit
    if (newData.status === oldData.status) {
      return null;
    }

    const client = getTwilioClient();
    const twilioPhone = functions.config().twilio?.phone || '+17372508034';

    // ── Status-க்கு ஏற்ற Tamil message ──
    const statusMessages = {
      Confirmed: {
        consumer: `Zunkako Order Confirmed!\nஉங்கள் ஆர்டர் #${orderId.slice(
          -4,
        )} உறுதி செய்யப்பட்டது.\nமொத்தம்: ₹${
          newData.total
        }\nவிரைவில் டெலிவரி வரும்!`,
        farmer: `புதிய ஆர்டர்!\nஆர்டர் #${orderId.slice(
          -4,
        )} உறுதி செய்யப்பட்டது.\nமொத்தம்: ₹${newData.total}\nZunkako App-ல் பார்க்கவும்.`,
      },
      Shipped: {
        consumer: `Zunkako Delivery On the Way!\nஉங்கள் ஆர்டர் #${orderId.slice(
          -4,
        )} அனுப்பப்பட்டது.\n30-60 நிமிடத்தில் வரும்!\nTrack: f2capp.com/track/${orderId}`,
        farmer: `ஆர்டர் அனுப்பப்பட்டது!\nஆர்டர் #${orderId.slice(
          -4,
        )} டெலிவரி நபரிடம் கொடுக்கப்பட்டது.`,
      },
      Delivered: {
        consumer: `Zunkako Delivered!\nஉங்கள் ஆர்டர் #${orderId.slice(
          -4,
        )} கிடைத்தது!\nZunkako-வில் சாப் பண்ணியதற்கு நன்றி 🌿\nவிமர்சனம் தரவும்: f2capp.com/review`,
        farmer: `Order Delivered!\nOrder #${orderId.slice(
          -4,
        )} successfully delivered!\nபணம் 2 நாட்களில் வரும்.`,
      },
      Cancelled: {
        consumer: `Zunkako Order Cancelled\nஆர்டர் #${orderId.slice(
          -4,
        )} ரத்து செய்யப்பட்டது.\nRefund: 3-5 business days.\nSupport: 9876543210`,
        farmer: `Order Cancel!\nOrder #${orderId.slice(
          -4,
        )} வாடிக்கையாளர் ரத்து செய்தார்.`,
      },
    };

    const messages = statusMessages[newData.status];
    if (!messages) {
      return null;
    }

    const smsPromises = [];

    // Consumer-க்கு SMS
    if (newData.consumerPhone) {
      smsPromises.push(
        client.messages
          .create({
            body: messages.consumer,
            from: twilioPhone,
            to: '+91' + newData.consumerPhone,
          })
          .catch(err => console.log('Consumer SMS error:', err)),
      );
    }

    // Farmer-க்கு SMS
    if (newData.farmerPhone) {
      smsPromises.push(
        client.messages
          .create({
            body: messages.farmer,
            from: twilioPhone,
            to: '+91' + newData.farmerPhone,
          })
          .catch(err => console.log('Farmer SMS error:', err)),
      );
    }

    await Promise.all(smsPromises);
    console.log(`SMS sent for Order ${orderId} - Status: ${newData.status}`);
    return null;
  });

// ════════════════════════════════════════════════════════
// FUNCTION 2: New Order-ல் Farmer-க்கு SMS
// Trigger: Firestore orders/{orderId} document create
// ════════════════════════════════════════════════════════
exports.sendNewOrderSMS = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const orderId = context.params.orderId;

    const client = getTwilioClient();
    const twilioPhone = functions.config().twilio?.phone || '+17372508034';

    // Farmer-க்கு new order SMS
    if (orderData.farmerPhone) {
      const message = `🌾 Zunkako - புதிய ஆர்டர்!\nOrder #${orderId.slice(
        -4,
      )}\nConsumer: ${orderData.consumerName}\nமொத்தம்: ₹${
        orderData.total
      }\nஉடனே App-ல் ஏற்றுக்கொள்ளவும்!`;

      await client.messages
        .create({
          body: message,
          from: twilioPhone,
          to: '+91' + orderData.farmerPhone,
        })
        .catch(err => console.log('New order SMS error:', err));
    }

    return null;
  });

// ════════════════════════════════════════════════════════
// FUNCTION 3: WhatsApp Message (Twilio WhatsApp)
// Same Twilio account - WhatsApp sandbox use பண்றோம்
// ════════════════════════════════════════════════════════
exports.sendWhatsAppUpdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const orderId = context.params.orderId;

    if (newData.status === oldData.status) {
      return null;
    }

    const client = getTwilioClient();
    const twilioWhatsApp = 'whatsapp:+14155238886'; // Twilio WhatsApp Sandbox

    // ── Refund Request Admin WhatsApp Notification ──
    if (newData.status === 'Refund Requested') {
      const adminWhatsAppNumbers = [
        'whatsapp:+919360425423',
        'whatsapp:+919585475247',
      ];
      const orderDisplayId = newData.orderId || orderId;
      const adminMessage = `*Refund Request*\n\nOrder ID: ${orderDisplayId}\nCustomer: ${
        newData.consumerName || 'Customer'
      }\nTotal Amount: ₹${newData.total}\n\nPlease process this refund.`;

      for (const num of adminWhatsAppNumbers) {
        await client.messages
          .create({
            body: adminMessage,
            from: twilioWhatsApp,
            to: num,
          })
          .catch(err =>
            console.log(`Admin Refund WhatsApp error for ${num}:`, err),
          );
      }

      return null;
    }

    // WhatsApp support பண்றவர்கள் மட்டும்
    if (!newData.consumerWhatsApp) {
      return null;
    }

    const waMessages = {
      Confirmed: `*Zunkako Order Confirmed!*\n\nOrder ID: #${orderId.slice(
        -4,
      )}\nமொத்தம்: ₹${
        newData.total
      }\n\nஉங்கள் ஆர்டர் செயல்முறை ஆகிறது...\nவிரைவில் டெலிவரி ஆகும்!\n\nTrack: f2capp.com/track/${orderId}`,
      Shipped: `*உங்கள் ஆர்டர் வருகிறது!*\n\nOrder #${orderId.slice(
        -4,
      )} on the way!\n30-60 நிமிடத்தில் கிடைக்கும்\n\nLive Track: f2capp.com/track/${orderId}`,
      Delivered: `*Delivered Successfully!*\n\nOrder #${orderId.slice(
        -4,
      )} கிடைத்தது!\n\n⭐ விமர்சனம் தரவும் - உங்கள் கருத்து எங்களுக்கு முக்கியம்!\nf2capp.com/review/${orderId}\n\n🌿Zunkako-வில் சாப் பண்ணியதற்கு நன்றி!`,
    };

    const waMessage = waMessages[newData.status];
    if (!waMessage) {
      return null;
    }

    await client.messages
      .create({
        body: waMessage,
        from: twilioWhatsApp,
        to: 'whatsapp:+91' + newData.consumerWhatsApp,
      })
      .catch(err => console.log('WhatsApp error:', err));

    return null;
  });

// ════════════════════════════════════════════════════════
// FUNCTION 4: OTP SMS (Phone Auth backup)
// Firebase Auth automatic-ஆ handle பண்ணும்
// இது extra manual OTP-க்கு மட்டும்
// ════════════════════════════════════════════════════════
exports.sendCustomOTP = functions.https.onCall(async (data, context) => {
  const {phone} = data;

  if (!phone) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Phone number required',
    );
  }

  // Random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Firestore-ல் OTP save (5 minutes valid)
  await admin
    .firestore()
    .collection('otps')
    .doc(phone)
    .set({
      otp,
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 5 * 60 * 1000),
      ),
      verified: false,
    });

  // SMS அனுப்பு
  const client = getTwilioClient();
  const twilioPhone = functions.config().twilio?.phone || '+17372508034';

  await client.messages.create({
    body: `உங்கள் Zunkako OTP: ${otp}\n5 நிமிடத்தில் காலாவதியாகும்.\nYour Zunkako OTP: ${otp}`,
    from: twilioPhone,
    to: '+91' + phone,
  });

  return {success: true, message: 'OTP sent successfully'};
});

// ════════════════════════════════════════════════════════
// FUNCTION 5: AI Image Moderation (Google Cloud Vision API)
// SafeSearch (Adult/Violence) & Product Label Verification
// ════════════════════════════════════════════════════════
exports.moderateProductImage = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name || '';
    if (!filePath.startsWith('products/')) return null;

    try {
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient();
      const gcsPath = `gs://${object.bucket}/${filePath}`;

      const [safeSearchResult] = await client.safeSearchDetection(gcsPath);
      const detections = safeSearchResult.safeSearchAnnotation || {};

      const isUnsafe =
        detections.adult === 'VERY_LIKELY' ||
        detections.adult === 'LIKELY' ||
        detections.violence === 'VERY_LIKELY' ||
        detections.violence === 'LIKELY' ||
        detections.racy === 'VERY_LIKELY';

      if (isUnsafe) {
        console.log(`AI Moderation: Unsafe image detected! ${filePath}`);
        const bucket = admin.storage().bucket(object.bucket);
        await bucket.file(filePath).delete();

        const metadata = object.metadata || {};
        if (metadata.userId) {
          await admin.firestore().collection('notifications').add({
            userId: metadata.userId,
            title: 'எச்சரிக்கை: படம் நிராகரிக்கப்பட்டது!',
            message:
              'நீங்கள் பதிவேற்றிய படம் சமூக விதிமுறைகளுக்கு முரணாக உள்ளது. தயவுசெய்து சரியான தயாரிப்பு படத்தைப் பதிவேற்றவும்.',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            type: 'security_alert',
            read: false,
          });
        }
      }
      return null;
    } catch (e) {
      console.log('AI Image Moderation error:', e.message);
      return null;
    }
  });

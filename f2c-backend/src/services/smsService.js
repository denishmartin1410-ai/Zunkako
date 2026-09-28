const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+17372508034';

let client = null;
try {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  console.warn('Twilio initialization warning:', e.message);
}

/**
 * Send SMS Notification to Farmer or Consumer
 */
const sendSMS = async (toPhone, messageBody) => {
  try {
    if (!client) {
      console.log(`[SMS Simulation] To: ${toPhone} | Message: ${messageBody}`);
      return { success: true, simulated: true };
    }

    const formattedPhone = toPhone.startsWith('+') ? toPhone : `+91${toPhone.replace(/\D/g, '')}`;
    const message = await client.messages.create({
      body: messageBody,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ SMS Sent! SID: ${message.sid} to ${formattedPhone}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio Send SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp Message Notification
 */
const sendWhatsApp = async (toPhone, messageBody) => {
  try {
    if (!client) {
      console.log(`[WhatsApp Simulation] To: ${toPhone} | Message: ${messageBody}`);
      return { success: true, simulated: true };
    }

    const cleanPhone = toPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    const message = await client.messages.create({
      body: messageBody,
      from: 'whatsapp:+14155238886', // Twilio Official WhatsApp Sandbox
      to: `whatsapp:${formattedPhone}`,
    });

    console.log(`✅ WhatsApp Sent! SID: ${message.sid} to ${formattedPhone}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio Send WhatsApp Error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSMS,
  sendWhatsApp,
};

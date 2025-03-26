import twilio from 'twilio';

// Twilio client oluştur
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// SMS gönderme fonksiyonu
export async function sendSMS(phoneNumber: string, message: string) {
  try {
    // Telefon numarasını doğru formatta olduğundan emin ol
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber}`;

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`SMS gönderildi, SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS gönderme hatası:', error);
    return { success: false, error };
  }
} 
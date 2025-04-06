import nodemailer from 'nodemailer';

// Nodemailer transport oluştur
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 465,
  secure: true, // Gmail için true
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD
  }
});

// Email gönderme fonksiyonu
export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });

    console.log(`Email gönderildi: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return { success: false, error };
  }
}

// Doğrulama e-postası gönder
export async function sendVerificationEmail(email: string, code: string) {
  const subject = "LuckyChart - Email Doğrulama Kodu";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #2C3E50; text-align: center;">LuckyChart Doğrulama Kodu</h2>
      <div style="background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="font-size: 16px; margin-bottom: 20px;">Merhaba,</p>
        <p style="font-size: 16px; margin-bottom: 20px;">LuckyChart uygulamasına kaydolmak için doğrulama kodunuz:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; color: #007bff;">${code}</p>
        <p style="font-size: 14px; color: #6c757d;">Bu kod 15 dakika boyunca geçerlidir.</p>
      </div>
      <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 30px;">Bu e-postayı siz talep etmediyseniz, lütfen dikkate almayın.</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
} 
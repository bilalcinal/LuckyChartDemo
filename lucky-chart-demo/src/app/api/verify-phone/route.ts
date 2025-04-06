import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, getOTPExpiry } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    // Telefon numarası formatlama
    const formattedPhone = phone.startsWith('+90') 
      ? phone 
      : `+90${phone.replace(/\D/g, '')}`;

    // Geçerli bir Türkiye telefon numarası mı kontrol et
    const phoneRegex = /^\+90[5][0-9]{9}$/;
    if (!phoneRegex.test(formattedPhone)) {
      return NextResponse.json(
        { error: 'Geçerli bir Türkiye telefon numarası giriniz' },
        { status: 400 }
      );
    }

    // Kullanıcıyı veritabanında ara
    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    // Kullanıcı zaten varsa, SMS doğrulaması olmadan doğrudan giriş yapmasına izin ver
    if (existingUser) {
      return NextResponse.json({
        success: true,
        requireVerification: false,
        message: 'Kullanıcı zaten kayıtlı, SMS doğrulaması gerekmiyor.'
      });
    }

    // Yeni kullanıcı için doğrulama kodu oluştur
    const verificationCode = generateOTP(5); // 5 haneli kod
    const expiresAt = getOTPExpiry();

    try {
      // Twilio API parametreleri
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const serviceSid = 'VA83b2bd2058a99c3f1aa967946aeebc0b'; // Service SID değeri
      
      // Twilio Verify API'ye direkt istek yapıyoruz
      const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
      const body = new URLSearchParams();
      body.append('To', formattedPhone);
      body.append('Channel', 'sms');
      
      // Kimlik doğrulama için Base64 kodlanmış bilgileri oluştur
      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      
      // Twilio API'ye istek gönder
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        body: body
      });
      
      const data = await response.json();
      console.log('Twilio API yanıtı:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Twilio API hatası');
      }
      
      // Doğrulama kodunu veritabanına kaydedelim
      await prisma.$executeRaw`INSERT INTO OTP (id, phone, code, createdAt, expiresAt, verified) VALUES (UUID(), ${formattedPhone}, ${verificationCode}, NOW(), ${expiresAt}, 0)`;
      
      return NextResponse.json({
        success: true,
        requireVerification: true,
        message: 'Doğrulama kodu telefonunuza gönderildi.',
        // Client tarafında kodu göstermemek için tempCode kaldırıldı
      });
      
    } catch (apiError) {
      console.error('Twilio API hatası:', apiError);
      return NextResponse.json(
        { error: 'SMS gönderilemedi, lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('SMS doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
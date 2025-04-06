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
      // ============ DOĞRUDAN SMS GÖNDERİM YÖNTEMİ =============
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
      
      // Credential bilgilerini kontrol et
      console.log("Twilio bilgileri kontrolü:");
      console.log(`Account SID: ${twilioAccountSid.substring(0, 5)}...`);
      console.log(`Auth Token: ${twilioAuthToken ? 'Mevcut' : 'Eksik'}`);
      console.log(`Telefon Numarası: ${twilioPhoneNumber || 'Eksik'}`);
      
      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        throw new Error("Twilio kimlik bilgileri eksik");
      }
      
      // Doğrudan SMS API'sini kullan
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const messageBody = `LuckyChart doğrulama kodunuz: ${verificationCode}`;
      
      const formData = new URLSearchParams();
      formData.append('To', formattedPhone);
      formData.append('From', twilioPhoneNumber);
      formData.append('Body', messageBody);
      
      console.log("SMS API çağrısı bilgileri:");
      console.log(`URL: ${url}`);
      console.log(`To: ${formattedPhone}`);
      console.log(`From: ${twilioPhoneNumber}`);
      console.log(`Body: ${messageBody}`);
      
      // Base64 ile kodlanmış yetkilendirme
      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      
      console.log('Twilio SMS API çağrısı yapılıyor...');
      
      let response, data;
      
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          },
          body: formData
        });
        
        data = await response.json();
        console.log('Twilio API yanıtı:', JSON.stringify(data, null, 2));
      } catch (error: any) {
        console.error('Fetch hatası:', error);
        throw new Error(`Fetch hatası: ${error.message || 'Bilinmeyen hata'}`);
      }
      
      if (!response.ok) {
        console.error('Twilio hata detayı:', JSON.stringify(data, null, 2));
        
        // Trial hesap için telefon doğrulama hatası mı kontrol et
        if (data.code === 21608) {
          // Doğrulama kodunu veritabanına kaydedelim
          await prisma.$executeRaw`INSERT INTO OTP (id, phone, code, createdAt, expiresAt, verified) VALUES (UUID(), ${formattedPhone}, ${verificationCode}, NOW(), ${expiresAt}, 0)`;
          
          console.log(`===== GEÇERSİZ NUMARA - TEST MODU =====`);
          console.log(`Telefon: ${formattedPhone}`);
          console.log(`Doğrulama Kodu: ${verificationCode}`);
          console.log(`Sona Erme: ${expiresAt}`);
          console.log(`=======================================`);
          
          return NextResponse.json({
            success: true,
            requireVerification: true,
            message: 'Twilio numaranızı doğrulamanız gerekiyor. Geliştirme modunda devam edebilirsiniz.',
            tempCode: verificationCode, // Geliştirme aşamasında kolaylık için
            twilioError: 'Bu numaraya SMS gönderebilmek için Twilio hesabınızda numarayı doğrulamanız veya tam sürüme geçmeniz gerekiyor: twilio.com/user/account/phone-numbers/verified'
          });
        }
        
        throw new Error(data.message || 'SMS gönderilemedi');
      }
      
      if (data && data.sid) {
        console.log(`SMS başarıyla gönderildi. SID: ${data.sid}`);
      }
      
      // Doğrulama kodunu veritabanına kaydedelim
      await prisma.$executeRaw`INSERT INTO OTP (id, phone, code, createdAt, expiresAt, verified) VALUES (UUID(), ${formattedPhone}, ${verificationCode}, NOW(), ${expiresAt}, 0)`;
      
      return NextResponse.json({
        success: true,
        requireVerification: true,
        message: 'Doğrulama kodu telefonunuza gönderildi.'
      });
      
    } catch (error: any) {
      console.error('API hatası:', error);
      
      if (error.message) {
        console.error('Hata mesajı:', error.message);
      }
      
      if (error.stack) {
        console.error('Hata stack:', error.stack);
      }
      
      // Hata durumunda test moduna geç
      console.log(`===== ACİL DURUM: TEST MODU - SMS GÖNDERİLEMEDİ =====`);
      console.log(`Telefon: ${formattedPhone}`);
      console.log(`Doğrulama Kodu: ${verificationCode}`);
      console.log(`Sona Erme: ${expiresAt}`);
      console.log(`================================================`);
      
      // Doğrulama kodunu veritabanına kaydedelim (hata durumunda da)
      try {
        await prisma.$executeRaw`INSERT INTO OTP (id, phone, code, createdAt, expiresAt, verified) VALUES (UUID(), ${formattedPhone}, ${verificationCode}, NOW(), ${expiresAt}, 0)`;
      } catch (dbError) {
        console.error('Veritabanı hatası:', dbError);
      }
      
      return NextResponse.json({
        success: true,
        requireVerification: true,
        message: 'SMS gönderilemedi, ancak test modunda devam edebilirsiniz.',
        tempCode: verificationCode // Acil durumda kodu göster
      });
    }

  } catch (error) {
    console.error('SMS doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
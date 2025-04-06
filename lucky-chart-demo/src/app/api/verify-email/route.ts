import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, getOTPExpiry } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/email';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email, phone } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email adresi gereklidir' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    // Geçerli bir email adresi mi kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }
    
    // Geçerli bir telefon numarası mı kontrol et
    const phoneRegex = /^5\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Geçerli bir telefon numarası giriniz (5XX XXX XX XX formatında)' },
        { status: 400 }
      );
    }

    // Kullanıcıyı veritabanında ara - email veya telefon ile (raw query kullanıyoruz çünkü model tipleri değişmiş olabilir)
    const existingUsers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM User WHERE email = ? OR phone = ? LIMIT 1`,
      email,
      phone
    );
    
    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    // Kullanıcı zaten varsa, email doğrulaması olmadan doğrudan giriş yapmasına izin ver
    if (existingUser) {
      return NextResponse.json({
        success: true,
        requireVerification: false,
        message: 'Kullanıcı zaten kayıtlı, email doğrulaması gerekmiyor.'
      });
    }

    // Yeni kullanıcı için doğrulama kodu oluştur
    const verificationCode = generateOTP(6); // 6 haneli kod
    const expiresAt = getOTPExpiry();

    try {
      // Email gönder
      const emailResult = await sendVerificationEmail(email, verificationCode);
      
      if (!emailResult.success) {
        throw new Error('Email gönderilemedi');
      }
      
      console.log('Email başarıyla gönderildi:', emailResult.messageId);
      
      // Doğrulama kodunu veritabanına kaydedelim (telefon numarası da dahil)
      await prisma.$executeRawUnsafe(
        `INSERT INTO OTP (id, email, phone, code, createdAt, expiresAt, verified) VALUES (UUID(), ?, ?, ?, NOW(), ?, 0)`,
        email,
        phone,
        verificationCode,
        expiresAt
      );
      
      return NextResponse.json({
        success: true,
        requireVerification: true,
        message: 'Doğrulama kodu email adresinize gönderildi.'
      });
      
    } catch (error: any) {
      console.error('Email API hatası:', error);
      
      if (error.message) {
        console.error('Hata mesajı:', error.message);
      }
      
      if (error.stack) {
        console.error('Hata stack:', error.stack);
      }
      
      // Hata durumunda test moduna geç
      console.log(`===== ACİL DURUM: TEST MODU - EMAIL GÖNDERİLEMEDİ =====`);
      console.log(`Email: ${email}`);
      console.log(`Telefon: ${phone}`);
      console.log(`Doğrulama Kodu: ${verificationCode}`);
      console.log(`Sona Erme: ${expiresAt}`);
      console.log(`================================================`);
      
      // Doğrulama kodunu veritabanına kaydedelim (hata durumunda da)
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO OTP (id, email, phone, code, createdAt, expiresAt, verified) VALUES (UUID(), ?, ?, ?, NOW(), ?, 0)`,
          email,
          phone,
          verificationCode,
          expiresAt
        );
      } catch (dbError) {
        console.error('Veritabanı hatası:', dbError);
      }
      
      return NextResponse.json({
        success: true,
        requireVerification: true,
        message: 'Email gönderilemedi, ancak test modunda devam edebilirsiniz.',
        tempCode: verificationCode // Acil durumda kodu göster
      });
    }

  } catch (error) {
    console.error('Email doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
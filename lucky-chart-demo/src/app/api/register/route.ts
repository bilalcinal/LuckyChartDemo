import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';

// Manuel olarak User tipini tanımlama
interface UserType {
  id: string;
  phone: string;
  email?: string | null;
  verificationCode?: string | null;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  lastSpinDate?: Date | null;
  spinsRemaining: number;
  isActive: boolean;
}

// Doğrulama kodu gönderme işlevi
async function sendVerificationEmail(email: string, verificationCode: string) {
  // SMTP yapılandırması
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'macbearakyazi@gmail.com',
      pass: 'tqwn mwgq dgmb qgyo'
    }
  });

  // Email içeriği
  const mailOptions = {
    from: '"MackPot" <macbearakyazi@gmail.com>',
    to: email,
    subject: 'MackPot - Hesap Doğrulama Kodu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #f59e0b; text-align: center;">MackPot - Akyazı Macbear</h2>
        <p style="text-align: center;">Akyazı Macbear'ın özel promosyon uygulamasına hoş geldiniz!</p>
        <p>Hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın: ${verificationCode}</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h3 style="font-size: 24px; color: #333; letter-spacing: 2px; margin: 0;">${verificationCode}</h3>
        </div>
        
        <p>Bu kod 24 saat boyunca geçerlidir.</p>
        <p style="color: #666; font-size: 12px; text-align: center;">Bu e-posta, MackPot uygulamasına kayıt olduğunuz için gönderilmiştir.</p>
      </div>
    `
  };

  // Email gönder
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Doğrulama kodu e-postası gönderildi: ${email}`);
    return true;
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return false;
  }
}

// 6 haneli rastgele kod oluşturur
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { phone, email } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    // Email format kontrolü
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Geçerli bir e-posta adresi giriniz' },
          { status: 400 }
        );
      }
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

    // Doğrulama kodu oluştur
    const verificationCode = generateVerificationCode();

    // Kullanıcıyı veritabanında ara, yoksa oluştur
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    }) as UserType | null;

    if (!user) {
      // Yeni kullanıcı oluştur
      const userData: any = {
        phone: formattedPhone,
        spinsRemaining: 1,
        isVerified: false
      };
      
      if (email) {
        userData.email = email;
        userData.verificationCode = verificationCode;
      }
      
      user = await prisma.user.create({
        data: userData,
      }) as UserType;
    } else {
      // Mevcut kullanıcıyı güncelle
      const updateData: any = {
        lastLogin: new Date(),
      };
      
      if (email) {
        updateData.email = email;
        updateData.verificationCode = verificationCode;
        
        // Eğer kullanıcı bir e-posta değişikliği yapıyorsa, doğrulama durumunu sıfırla
        if (user.email !== email) {
          updateData.isVerified = false;
        }
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // E-posta varsa doğrulama kodu e-postası gönder
    if (email) {
      await sendVerificationEmail(email, verificationCode);
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      phone: formattedPhone,
      email: email,
      requiresVerification: email ? true : false
    });
  } catch (error) {
    console.error('Kullanıcı kaydı hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
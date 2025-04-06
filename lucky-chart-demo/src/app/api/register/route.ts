import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';

// Email gönderme işlevi
async function sendVerificationEmail(email: string) {
  // SMTP yapılandırması
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'macbearakyazi@gmail.com',
      pass: 'tqwn mwgq dgmb qgyo'
    }
  });

  // Rastgele bir kod oluştur (örneğin: kayıt onayı için)
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Email içeriği
  const mailOptions = {
    from: '"LuckyChart" <macbearakyazi@gmail.com>',
    to: email,
    subject: 'LuckyChart - Hoş Geldiniz',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #f59e0b; text-align: center;">LuckyChart - Şanslı Çark</h2>
        <p style="text-align: center;">Kafe Şans'ın özel promosyon uygulamasına hoş geldiniz!</p>
        <p>Kayıt işleminiz başarıyla tamamlandı. Uygulamamızı kullanarak harika ödüller kazanabilirsiniz.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="#" style="background-color: #f59e0b; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Şansınızı Deneyin</a>
        </p>
        <p style="color: #666; font-size: 12px; text-align: center;">Bu e-posta, LuckyChart uygulamasına kayıt olduğunuz için gönderilmiştir.</p>
      </div>
    `
  };

  // Email gönder
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Doğrulama e-postası gönderildi: ${email}`);
    return true;
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return false;
  }
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

    // Kullanıcıyı veritabanında ara, yoksa oluştur
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (!user) {
      // Type casting ile email alanını düzeltme
      const userData: Prisma.UserCreateInput = {
        phone: formattedPhone,
        spinsRemaining: 1,
      };
      
      if (email) {
        (userData as any).email = email;
      }
      
      user = await prisma.user.create({
        data: userData,
      });
    } else {
      // Type casting ile email alanını düzeltme
      const updateData: Prisma.UserUpdateInput = {
        lastLogin: new Date(),
      };
      
      if (email) {
        (updateData as any).email = email;
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // E-posta varsa doğrulama e-postası gönder
    if (email) {
      await sendVerificationEmail(email);
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      phone: formattedPhone,
      email: email
    });
  } catch (error) {
    console.error('Kullanıcı kaydı hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
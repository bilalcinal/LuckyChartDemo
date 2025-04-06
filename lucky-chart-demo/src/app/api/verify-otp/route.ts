import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { phone, code, tempCode } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Telefon numarası ve doğrulama kodu gereklidir' },
        { status: 400 }
      );
    }

    // Telefon numarası formatlama
    const formattedPhone = phone.startsWith('+90') 
      ? phone 
      : `+90${phone.replace(/\D/g, '')}`;

    // Geçici çözüm: Client'tan gelen tempCode ile kod eşleşmesini kontrol et
    if (!tempCode || tempCode !== code) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş doğrulama kodu' },
        { status: 400 }
      );
    }

    // Kullanıcı varsa, direk başarılı dön
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    
    // Kullanıcı yoksa oluştur
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          spinsRemaining: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      phone: formattedPhone,
      message: 'Telefon numarası başarıyla doğrulandı'
    });

  } catch (error) {
    console.error('OTP doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
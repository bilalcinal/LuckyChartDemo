import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Kullanıcıyı veritabanında ara, yoksa oluştur
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          spinsRemaining: 1,
        },
      });
    } else {
      // Kullanıcı zaten varsa, giriş zamanını güncelle
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      phone: formattedPhone,
    });
  } catch (error) {
    console.error('Kullanıcı kaydı hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
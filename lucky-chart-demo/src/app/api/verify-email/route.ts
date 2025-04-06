import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-posta ve doğrulama kodu gereklidir' },
        { status: 400 }
      );
    }

    // E-posta ve verificationCode ile kullanıcıyı bul
    const user = await prisma.$queryRaw`
      SELECT * FROM User WHERE email = ${email} AND verificationCode = ${code}
    ` as UserType[] | null;

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz doğrulama kodu veya e-posta adresi' },
        { status: 400 }
      );
    }

    // Kullanıcının doğrulanma durumunu güncelle
    const updateData: any = {
      isVerified: true,
      verificationCode: null, // Kullanılan kodu temizle
    };

    await prisma.user.update({
      where: { id: user[0].id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'E-posta başarıyla doğrulandı',
    });
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
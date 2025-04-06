import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'lucky-chart-secret-key';

export async function POST(req: NextRequest) {
  try {
    // Cookie'lerden refresh token'ı al
    const refreshToken = req.cookies.get('lc_refresh_token')?.value;
    const userId = req.cookies.get('lc_user_id')?.value;

    if (!refreshToken || !userId) {
      return NextResponse.json(
        { error: 'Refresh token veya kullanıcı ID bulunamadı' },
        { status: 401 }
      );
    }

    // Refresh token'ı doğrula
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { 
        userId: string; 
        tokenType: string;
      };

      // Token tipi ve kullanıcı ID kontrolü
      if (decoded.tokenType !== 'refresh' || decoded.userId !== userId) {
        return NextResponse.json(
          { error: 'Geçersiz refresh token' },
          { status: 401 }
        );
      }

      // Kullanıcıyı veritabanından getir
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      // Yeni token oluştur
      const newToken = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          spinsRemaining: user.spinsRemaining || 1,
          role: 'USER'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Yeni refresh token oluştur (isteğe bağlı)
      const newRefreshToken = jwt.sign(
        {
          userId: user.id,
          tokenType: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Yeni tokenları cookie olarak ekle
      const response = NextResponse.json({
        success: true,
        userId: user.id,
        accessToken: newToken,
        refreshToken: newRefreshToken,
        message: 'Token başarıyla yenilendi'
      });

      response.cookies.set('lc_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax'
      });

      response.cookies.set('lc_refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax'
      });

      return response;

    } catch (tokenError) {
      console.error('Token doğrulama hatası:', tokenError);
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
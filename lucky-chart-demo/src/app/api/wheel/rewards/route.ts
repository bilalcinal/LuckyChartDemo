import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'lucky-chart-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Önce NextAuth oturumunu kontrol et
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;
    
    // NextAuth oturumu yoksa, JWT token kontrolü yap
    if (!userId) {
      // 1. Request'ten cookie'leri al
      const authToken = req.cookies.get('lc_token')?.value;
      const cookieUserId = req.cookies.get('lc_user_id')?.value;
      
      // 2. Authorization header'dan Bearer token'ı al
      let headerToken: string | undefined;
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        headerToken = authHeader.substring(7);
      }
      
      // Kullanılabilir token belirle (öncelik header token'da)
      const tokenToUse = headerToken || authToken;
      
      if (tokenToUse) {
        try {
          // JWT token'ı doğrula
          const decoded = jwt.verify(tokenToUse, JWT_SECRET) as { userId: string };
          
          if (decoded.userId) {
            userId = decoded.userId;
          }
        } catch (error) {
          console.error('Token doğrulama hatası:', error);
          
          // Token geçersiz, yetkilendirme hatası döndür
          return NextResponse.json(
            { error: 'Geçersiz token' },
            { status: 401 }
          );
        }
      } else if (cookieUserId) {
        // Token yok ama userId cookie'si var, bu durumda bile kontrol edelim
        userId = cookieUserId;
      }
    }
    
    // Kullanıcı ID'si yoksa yetkilendirme hatası döndür
    if (!userId) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    // Kullanıcının aktif ödüllerini getir
    const rewards = await prisma.reward.findMany({
      where: {
        userId: userId,
        expiresAt: {
          gt: new Date()
        },
        isUsed: false
      },
      include: {
        wheelItem: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Ödülleri daha açık bir formatta gönder
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      code: reward.code,
      item: {
        id: reward.wheelItem.id,
        title: reward.wheelItem.title,
        description: reward.wheelItem.description,
        color: reward.wheelItem.color,
      },
      expiresAt: reward.expiresAt,
    }));
    
    return NextResponse.json({ rewards: formattedRewards });
    
  } catch (error) {
    console.error('Ödüller getirme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
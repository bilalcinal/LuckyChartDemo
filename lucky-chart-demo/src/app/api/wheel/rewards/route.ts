import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Şu anki tarih
    const now = new Date();
    
    // Kullanıcının ödüllerini getir - sadece kullanılmamış ve süresi geçmemiş olanlar
    const rewards = await prisma.reward.findMany({
      where: { 
        userId: userId,
        isUsed: false,
        expiresAt: {
          gte: now, // Son kullanma tarihi şu andan büyük veya eşit olanlar
        }
      },
      include: {
        wheelItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Ödülleri formatla
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
      createdAt: reward.createdAt,
      isUsed: reward.isUsed,
    }));
    
    // En son alınan ödülü (aktivasyon tarihine göre)
    const latestReward = formattedRewards.length > 0 ? formattedRewards[0] : null;
    
    return NextResponse.json({ 
      success: true,
      rewards: formattedRewards,
      latestReward
    });
    
  } catch (error) {
    console.error('Ödül listeleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
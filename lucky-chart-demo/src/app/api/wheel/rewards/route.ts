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
    
    // Kullanıcının ödüllerini getir
    const rewards = await prisma.reward.findMany({
      where: { 
        userId: userId,
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
    }));
    
    return NextResponse.json({ 
      success: true,
      rewards: formattedRewards
    });
    
  } catch (error) {
    console.error('Ödül listeleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Tüm ödülleri getir
    const rewards = await prisma.reward.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        wheelItem: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            phone: true
          }
        }
      }
    });

    // Kullanıcı dostu formata dönüştür
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      code: reward.code,
      itemTitle: reward.wheelItem?.title || 'Bilinmeyen Ödül',
      userPhone: reward.user?.phone || 'Bilinmeyen Kullanıcı',
      createdAt: reward.createdAt.toISOString(),
      isUsed: reward.isUsed
    }));

    return NextResponse.json(formattedRewards);
    
  } catch (error) {
    console.error('Ödülleri getirme hatası:', error);
    return NextResponse.json({ error: 'Ödüller yüklenirken bir hata oluştu' }, { status: 500 });
  }
} 
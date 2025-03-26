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
    
    // Bugünün başlangıcını hesapla
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Toplam kullanıcı sayısı
    const totalUsers = await prisma.user.count();
    
    // Aktif çark öğeleri
    const activeWheelItems = await prisma.wheelItem.count({
      where: {
        isActive: true
      }
    });
    
    // Toplam çevirme sayısı (ödül sayısı kadar)
    const totalSpins = await prisma.reward.count();
    
    // Bugün yapılan çevirmeler
    const todaySpins = await prisma.reward.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    
    // Bugün giriş yapan kullanıcılar
    const todayUsers = await prisma.user.count({
      where: {
        lastSpinDate: {
          gte: today
        }
      }
    });
    
    // Son ödüller
    const latestRewards = await prisma.reward.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        wheelItem: true
      }
    });
    
    // Formatlı ödül listesi
    const formattedRewards = latestRewards.map(reward => ({
      id: reward.id,
      code: reward.code,
      itemTitle: reward.wheelItem.title,
      userPhone: reward.user.phone,
      createdAt: reward.createdAt,
      isUsed: reward.isUsed
    }));
    
    return NextResponse.json({
      totalUsers,
      activeWheelItems,
      totalSpins,
      todaySpins,
      todayUsers,
      latestRewards: formattedRewards
    });
    
  } catch (error) {
    console.error('İstatistik alma hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
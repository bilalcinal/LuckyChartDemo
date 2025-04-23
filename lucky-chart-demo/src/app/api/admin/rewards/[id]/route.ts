import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// next.config.mjs'de typescript hatalarını atlaması için ayar yapıldı

// Belirli bir ödülü getirme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const id = params.id;

    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        wheelItem: true,
        user: {
          select: {
            phone: true
          }
        }
      }
    });

    if (!reward) {
      return NextResponse.json({ error: 'Ödül bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Ödül getirme hatası:', error);
    return NextResponse.json({ error: 'Ödül yüklenirken bir hata oluştu' }, { status: 500 });
  }
}

// Ödülü güncelleme (kullanıldı olarak işaretleme vb.)
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const id = params.id;
    const data = await request.json();

    // Ödülün varlığını kontrol et
    const existingReward = await prisma.reward.findUnique({
      where: { id }
    });

    if (!existingReward) {
      return NextResponse.json({ error: 'Ödül bulunamadı' }, { status: 404 });
    }

    // Çalışan rolü sadece kullanıldı durumunu değiştirebilir
    if (session.user.role === 'EMPLOYEE') {
      // Sadece isUsed alanını güncellemeye izin ver
      const updatedReward = await prisma.reward.update({
        where: { id },
        data: { isUsed: data.isUsed }
      });
      return NextResponse.json(updatedReward);
    }

    // Admin rolü için tam erişim
    const updatedReward = await prisma.reward.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedReward);
  } catch (error) {
    console.error('Ödül güncelleme hatası:', error);
    return NextResponse.json({ error: 'Ödül güncellenirken bir hata oluştu' }, { status: 500 });
  }
}

// Ödülü silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const id = params.id;

    // Ödülün varlığını kontrol et
    const existingReward = await prisma.reward.findUnique({
      where: { id }
    });

    if (!existingReward) {
      return NextResponse.json({ error: 'Ödül bulunamadı' }, { status: 404 });
    }

    // Ödülü sil
    await prisma.reward.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ödül silme hatası:', error);
    return NextResponse.json({ error: 'Ödül silinirken bir hata oluştu' }, { status: 500 });
  }
}

// PATCH metodu ekleyelim (PUT ile aynı işlevselliğe sahip)
export async function PATCH(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const id = params.id;
    const data = await request.json();

    // Ödülün varlığını kontrol et
    const existingReward = await prisma.reward.findUnique({
      where: { id }
    });

    if (!existingReward) {
      return NextResponse.json({ error: 'Ödül bulunamadı' }, { status: 404 });
    }

    // Çalışan rolü sadece kullanıldı durumunu değiştirebilir
    if (session.user.role === 'EMPLOYEE') {
      // Sadece isUsed alanını güncellemeye izin ver
      const updatedReward = await prisma.reward.update({
        where: { id },
        data: { isUsed: data.isUsed }
      });
      return NextResponse.json(updatedReward);
    }

    // Admin rolü için tam erişim
    const updatedReward = await prisma.reward.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedReward);
  } catch (error) {
    console.error('Ödül güncelleme hatası:', error);
    return NextResponse.json({ error: 'Ödül güncellenirken bir hata oluştu' }, { status: 500 });
  }
} 
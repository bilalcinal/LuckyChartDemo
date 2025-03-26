import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

// GET - Tüm SMS zamanlamalarını listele
export async function GET() {
  try {
    const schedules = await prisma.smsSchedule.findMany({
      orderBy: {
        hour: 'asc',
      },
    });
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('SMS zamanlamaları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni SMS zamanlaması ekle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    // Admin yetki kontrolü (gerçek uygulamada genişletilmeli)
    
    const { hour, minute, isActive } = await req.json();
    
    if (hour === undefined || minute === undefined) {
      return NextResponse.json(
        { error: 'Saat ve dakika alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Saat ve dakika değerlerini doğrula
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return NextResponse.json(
        { error: 'Geçersiz saat veya dakika değeri' },
        { status: 400 }
      );
    }
    
    const smsSchedule = await prisma.smsSchedule.create({
      data: {
        id: uuidv4(),
        hour,
        minute,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    
    return NextResponse.json(smsSchedule);
  } catch (error) {
    console.error('SMS zamanlaması ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - SMS zamanlamasını güncelle
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    // Admin yetki kontrolü (gerçek uygulamada genişletilmeli)
    
    const { id, hour, minute, isActive } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID alanı zorunludur' },
        { status: 400 }
      );
    }
    
    // Güncellenecek veriyi hazırla
    const updateData: any = {};
    
    if (hour !== undefined) {
      if (hour < 0 || hour > 23) {
        return NextResponse.json(
          { error: 'Geçersiz saat değeri' },
          { status: 400 }
        );
      }
      updateData.hour = hour;
    }
    
    if (minute !== undefined) {
      if (minute < 0 || minute > 59) {
        return NextResponse.json(
          { error: 'Geçersiz dakika değeri' },
          { status: 400 }
        );
      }
      updateData.minute = minute;
    }
    
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const smsSchedule = await prisma.smsSchedule.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(smsSchedule);
  } catch (error) {
    console.error('SMS zamanlaması güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - SMS zamanlamasını sil
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    // Admin yetki kontrolü (gerçek uygulamada genişletilmeli)
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parametresi zorunludur' },
        { status: 400 }
      );
    }
    
    await prisma.smsSchedule.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SMS zamanlaması silme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
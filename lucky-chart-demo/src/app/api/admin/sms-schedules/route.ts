import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// SMS zamanlamalarını getir
export async function GET(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Tüm SMS zamanlamalarını getir
    const smsSchedules = await prisma.smsSchedule.findMany({
      orderBy: {
        scheduleTime: 'asc' // Yaklaşan zamana göre sırala
      }
    });

    return NextResponse.json(smsSchedules);
    
  } catch (error) {
    console.error('SMS zamanlamaları getirme hatası:', error);
    return NextResponse.json({ error: 'SMS zamanlamaları yüklenirken bir hata oluştu' }, { status: 500 });
  }
}

// Yeni SMS zamanlaması ekle
export async function POST(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // Request body'den veriyi al
    const body = await request.json();
    
    // Zorunlu alanları kontrol et
    if (!body.message || !body.scheduleTime) {
      return NextResponse.json({ error: 'Mesaj ve zamanlama zorunludur' }, { status: 400 });
    }
    
    // SMS zamanlaması oluştur
    const newSmsSchedule = await prisma.smsSchedule.create({
      data: {
        message: body.message,
        scheduleTime: new Date(body.scheduleTime),
        isActive: body.isActive ?? true,
      }
    });
    
    return NextResponse.json(newSmsSchedule);
    
  } catch (error) {
    console.error('SMS zamanlaması oluşturma hatası:', error);
    return NextResponse.json({ error: 'SMS zamanlaması eklenirken bir hata oluştu' }, { status: 500 });
  }
}

// SMS zamanlaması güncelle
export async function PUT(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // Request body'den veriyi al
    const body = await request.json();
    
    // ID kontrol et
    if (!body.id) {
      return NextResponse.json({ error: 'SMS zamanlaması ID\'si gereklidir' }, { status: 400 });
    }
    
    // Zorunlu alanları kontrol et
    if (!body.message || !body.scheduleTime) {
      return NextResponse.json({ error: 'Mesaj ve zamanlama zorunludur' }, { status: 400 });
    }
    
    // SMS zamanlamasını güncelle
    const updatedSmsSchedule = await prisma.smsSchedule.update({
      where: { id: body.id },
      data: {
        message: body.message,
        scheduleTime: new Date(body.scheduleTime),
        isActive: body.isActive ?? true,
      }
    });
    
    return NextResponse.json(updatedSmsSchedule);
    
  } catch (error) {
    console.error('SMS zamanlaması güncelleme hatası:', error);
    return NextResponse.json({ error: 'SMS zamanlaması güncellenirken bir hata oluştu' }, { status: 500 });
  }
}

// SMS zamanlaması sil
export async function DELETE(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // URL'den ID parametresini al
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'SMS zamanlaması ID\'si gereklidir' }, { status: 400 });
    }
    
    // SMS zamanlamasını sil
    await prisma.smsSchedule.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('SMS zamanlaması silme hatası:', error);
    return NextResponse.json({ error: 'SMS zamanlaması silinirken bir hata oluştu' }, { status: 500 });
  }
} 
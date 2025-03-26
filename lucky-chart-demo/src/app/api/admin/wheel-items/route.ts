import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

// Admin yetkisi kontrolü
async function isAdmin(userId: string) {
  const admin = await prisma.admin.findUnique({
    where: { id: userId },
  });
  return !!admin;
}

// GET - Tüm çark öğelerini listele
export async function GET() {
  try {
    const wheelItems = await prisma.wheelItem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(wheelItems);
  } catch (error) {
    console.error('Çark öğeleri getirme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni çark öğesi ekle
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
    // Bu örnekte basitleştirme amaçlı admin kontrolü yapılmamıştır
    
    const { title, description, color, probability, isActive } = await req.json();
    
    if (!title || !color) {
      return NextResponse.json(
        { error: 'Başlık ve renk alanları zorunludur' },
        { status: 400 }
      );
    }
    
    const wheelItem = await prisma.wheelItem.create({
      data: {
        id: uuidv4(),
        title,
        description: description || null,
        color,
        probability: probability || 1.0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    
    return NextResponse.json(wheelItem);
  } catch (error) {
    console.error('Çark öğesi ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Çark öğesini güncelle
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
    
    const { id, title, description, color, probability, isActive } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID alanı zorunludur' },
        { status: 400 }
      );
    }
    
    // Güncellenecek veriyi hazırla
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (probability !== undefined) updateData.probability = probability;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const wheelItem = await prisma.wheelItem.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(wheelItem);
  } catch (error) {
    console.error('Çark öğesi güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Çark öğesini sil
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
    
    await prisma.wheelItem.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Çark öğesi silme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
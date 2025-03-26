import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

// 5-6 haneli benzersiz kod üretme fonksiyonu
function generateUniqueCode(): string {
  // Alfanumerik karakterler (0-9, A-Z)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codeLength = 6;
  
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

export async function POST(req: NextRequest) {
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
    
    // Kullanıcıyı veritabanından getir
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kullanıcının çevirme hakkı kalmış mı kontrol et
    if (user.spinsRemaining <= 0) {
      return NextResponse.json(
        { error: 'Bugün için çevirme hakkınız kalmadı' },
        { status: 403 }
      );
    }
    
    // Kullanıcının bugün daha önce çevirip çevirmediğini kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastSpinDate && new Date(user.lastSpinDate) >= today) {
      return NextResponse.json(
        { error: 'Bugün için çevirme hakkınızı kullandınız' },
        { status: 403 }
      );
    }
    
    // Aktif çark öğelerini getir
    const wheelItems = await prisma.wheelItem.findMany({
      where: { isActive: true },
    });
    
    if (!wheelItems.length) {
      return NextResponse.json(
        { error: 'Çarkta gösterilecek öğe bulunamadı' },
        { status: 404 }
      );
    }
    
    // Olasılıklara göre çark öğesini seç
    let totalProbability = 0;
    for (const item of wheelItems) {
      totalProbability += item.probability;
    }
    
    const randomValue = Math.random() * totalProbability;
    let cumulativeProbability = 0;
    let selectedItem = wheelItems[0]; // Varsayılan olarak ilk öğeyi al
    
    for (const item of wheelItems) {
      cumulativeProbability += item.probability;
      if (randomValue <= cumulativeProbability) {
        selectedItem = item;
        break;
      }
    }
    
    // Benzersiz kod oluştur ve veritabanına kaydet
    const uniqueCode = generateUniqueCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 saat geçerli
    
    // Ödülü kadet
    const reward = await prisma.reward.create({
      data: {
        id: uuidv4(),
        code: uniqueCode,
        userId: user.id,
        wheelItemId: selectedItem.id,
        expiresAt,
      }
    });
    
    // Kullanıcının çevirme hakkını ve son çevirme tarihini güncelle
    await prisma.user.update({
      where: { id: user.id },
      data: {
        spinsRemaining: user.spinsRemaining - 1,
        lastSpinDate: new Date(),
      },
    });
    
    // Yanıt döndür
    return NextResponse.json({
      success: true,
      reward: {
        id: reward.id,
        code: reward.code,
        item: {
          id: selectedItem.id,
          title: selectedItem.title,
          description: selectedItem.description,
          color: selectedItem.color,
        },
        expiresAt: reward.expiresAt,
      }
    });
    
  } catch (error) {
    console.error('Çark çevirme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
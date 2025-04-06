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

// Bir sonraki günün 00:00'ını döndüren yardımcı fonksiyon
function getNextDayMidnight() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
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
    // Bu kontrolü kaldırıyoruz - spinsRemaining > 0 olduğu sürece çevirebilir
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    
    // if (user.lastSpinDate && new Date(user.lastSpinDate) >= today) {
    //   return NextResponse.json(
    //     { error: 'Bugün için çevirme hakkınızı kullandınız' },
    //     { status: 403 }
    //   );
    // }
    
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
    
    // Toplam olasılık değerini hesapla (tüm aktif öğelerin olasılıklarının toplamı)
    for (const item of wheelItems) {
      totalProbability += item.probability;
    }
    
    // Eğer toplam olasılık 1.0'dan farklıysa normalize et
    const normalizationFactor = Math.abs(totalProbability - 1.0) < 0.00001 ? 1.0 : 1.0 / totalProbability;
    
    // Rastgele bir değer üret (0-1 arasında)
    const randomValue = Math.random();
    
    // Kümülatif olasılık hesaplaması
    let cumulativeProbability = 0;
    let selectedItem = null;
    
    console.log(`Çark çevirme - Toplam olasılık: ${totalProbability}, Normalizasyon faktörü: ${normalizationFactor}`);
    
    // Ağırlıklı olasılık seçimi
    for (const item of wheelItems) {
      // Normalize edilmiş olasılık
      const normalizedProbability = item.probability * normalizationFactor;
      cumulativeProbability += normalizedProbability;
      
      console.log(`Öğe: ${item.title}, Olasılık: ${item.probability}, Normalize: ${normalizedProbability}, Kümülatif: ${cumulativeProbability}`);
      
      // Rastgele değer kümülatif olasılıktan küçük veya eşitse bu öğeyi seç
      if (randomValue <= cumulativeProbability) {
        selectedItem = item;
        console.log(`Seçilen öğe: ${item.title}, Olasılık: ${item.probability}`);
        break;
      }
    }
    
    // Eğer hala bir öğe seçilmediyse (yuvarlama hataları gibi durumlar için) son öğeyi seç
    if (!selectedItem && wheelItems.length > 0) {
      selectedItem = wheelItems[wheelItems.length - 1];
      console.log(`Öğe seçilemedi, son öğe seçildi: ${selectedItem.title}`);
    }
    
    // Eğer hala öğe seçilemezse hata döndür
    if (!selectedItem) {
      return NextResponse.json(
        { error: 'Ödül seçimi sırasında bir hata oluştu' },
        { status: 500 }
      );
    }
    
    // Benzersiz kod oluştur ve veritabanına kaydet
    const uniqueCode = generateUniqueCode();
    const expiresAt = getNextDayMidnight();
    
    // Ödülü kaydet
    const reward = await prisma.reward.create({
      data: {
        code: uniqueCode,
        userId: user.id,
        wheelItemId: selectedItem.id,
        expiresAt,
      }
    });
    
    // Ödül için wheel item bilgilerini al
    const wheelItem = await prisma.wheelItem.findUnique({
      where: {
        id: selectedItem.id
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
    
    // Yanıtta ödül ve ilgili öğenin bilgilerini gönder
    return NextResponse.json({ 
      success: true, 
      reward: {
        ...reward,
        item: wheelItem
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
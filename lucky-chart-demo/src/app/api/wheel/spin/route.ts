import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'lucky-chart-secret-key';

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
    console.log("------ SPIN API ÇAĞRILDI -------");
    
    // Önce NextAuth oturumunu kontrol et
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;
    
    console.log("Session bilgisi:", session ? { userId: session.user?.id } : "Session yok");
    
    // NextAuth oturumu yoksa, JWT token kontrolü yap
    if (!userId) {
      // 1. Request'ten cookie'leri al
      const authToken = req.cookies.get('lc_token')?.value;
      const refreshToken = req.cookies.get('lc_refresh_token')?.value;
      const cookieUserId = req.cookies.get('lc_user_id')?.value;
      
      // 2. Authorization header'dan Bearer token'ı al
      let headerToken: string | undefined;
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        headerToken = authHeader.substring(7);
        console.log("Authorization header token bulundu");
      }
      
      // Kullanılabilir token belirle (öncelik header token'da)
      const tokenToUse = headerToken || authToken;
      
      console.log("Token bilgileri:", { 
        headerToken: headerToken ? "var" : "yok",
        cookieToken: authToken ? "var" : "yok", 
        refreshToken: refreshToken ? "var" : "yok",
        cookieUserId
      });
      
      if (tokenToUse) {
        try {
          // JWT token'ı doğrula
          const decoded = jwt.verify(tokenToUse, JWT_SECRET) as { userId: string };
          userId = decoded.userId;
          console.log("Token doğrulandı, userId:", userId);
        } catch (tokenError) {
          console.error("Token doğrulama hatası:", tokenError);
          
          // Token geçersizse, refresh token'ı kontrol et
          if (refreshToken && cookieUserId) {
            try {
              const refreshDecoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string, tokenType: string };
              if (refreshDecoded.tokenType === 'refresh' && refreshDecoded.userId === cookieUserId) {
                userId = cookieUserId;
                console.log("Refresh token ile doğrulandı, userId:", userId);
              }
            } catch (refreshError) {
              console.error('Refresh token hatası:', refreshError);
            }
          }
        }
      }
    }
    
    // Kullanıcı ID'si yoksa yetkilendirme hatası döndür
    if (!userId) {
      console.log("Kullanıcı ID'si bulunamadı, yetkilendirme hatası");
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }
    
    console.log("Kullanıcı bilgisi alınıyor, userId:", userId);
    
    // Kullanıcıyı veritabanından getir
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    console.log("Veritabanı sorgusu sonucu:", user ? "Kullanıcı bulundu" : "Kullanıcı bulunamadı");
    
    if (!user) {
      console.log("Kullanıcı bulunamadı, userId:", userId);
      
      // Debug için UUID'yi kontrol et
      try {
        const allUsers = await prisma.user.findMany({
          take: 5
        });
        console.log("Veritabanındaki ilk 5 kullanıcı:", allUsers.map(u => ({ id: u.id, phone: u.phone })));
      } catch (err) {
        console.error("Tüm kullanıcıları getirme hatası:", err);
      }
      
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
    const expiresAt = getNextDayMidnight();
    
    console.log("Ödül oluşturuluyor:", {
      code: uniqueCode,
      userId: user.id,
      wheelItemId: selectedItem.id,
      expires: expiresAt
    });
    
    // Ödülü kayet
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
    
    console.log("Ödül kaydedildi ve kullanıcı güncellendi");
    
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
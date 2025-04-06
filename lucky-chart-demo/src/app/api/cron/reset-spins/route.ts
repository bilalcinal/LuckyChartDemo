import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint, gece 12:00'da veya test için dakikada bir kez çağrılabilir
export async function GET(request: Request) {
  try {
    // İstek URL'sinden isTest parametresini kontrol et
    const url = new URL(request.url);
    const isTest = url.searchParams.get('isTest') === 'true';
    
    let message = 'Çarkı çevirme hakları günlük olarak yenilendi';
    
    if (isTest) {
      message = 'Çarkı çevirme hakları test için dakikalık olarak yenilendi';
      console.log('Test modu: Dakikalık çevirme hakkı yenileniyor');
    } else {
      console.log('Normal mod: Günlük çevirme hakkı yenileniyor');
    }
    
    // Tüm aktif kullanıcıların çevirme haklarını sıfırla
    const updateResult = await prisma.user.updateMany({
      where: {
        isActive: true,
      },
      data: {
        spinsRemaining: 1, // Her kullanıcıya 1 hak ver
      },
    });
    
    console.log(`${updateResult.count} kullanıcının çarkı çevirme hakları yenilendi (${isTest ? 'Test modu' : 'Normal mod'})`);
    
    return NextResponse.json({
      success: true,
      message,
      usersUpdated: updateResult.count,
      isTest
    });
    
  } catch (error) {
    console.error('Çarkı çevirme haklarını sıfırlama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', details: error },
      { status: 500 }
    );
  }
} 
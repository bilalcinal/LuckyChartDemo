import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint, gece 12:00'da çağrılır ve tüm kullanıcıların çark haklarını yeniler
export async function GET(request: Request) {
  try {
    console.log('Günlük çevirme hakkı yenileniyor - gece 00:00');
    
    // Tüm aktif kullanıcıların çevirme haklarını sıfırla
    const updateResult = await prisma.user.updateMany({
      where: {
        isActive: true,
      },
      data: {
        spinsRemaining: 1, // Her kullanıcıya 1 hak ver
      },
    });
    
    console.log(`${updateResult.count} kullanıcının çarkı çevirme hakları yenilendi`);
    
    return NextResponse.json({
      success: true,
      message: 'Çarkı çevirme hakları günlük olarak yenilendi',
      usersUpdated: updateResult.count
    });
    
  } catch (error) {
    console.error('Çarkı çevirme haklarını sıfırlama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', details: error },
      { status: 500 }
    );
  }
} 
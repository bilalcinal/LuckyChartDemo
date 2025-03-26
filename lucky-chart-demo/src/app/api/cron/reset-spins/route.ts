import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint, cron ile günde bir kez çağrılacak (gece 12:00)
export async function GET() {
  try {
    // Tüm aktif kullanıcıların çevirme haklarını sıfırla
    const updateResult = await prisma.user.updateMany({
      where: {
        isActive: true,
      },
      data: {
        spinsRemaining: 1, // Her kullanıcıya günlük 1 hak ver
      },
    });
    
    console.log(`${updateResult.count} kullanıcının çarkı çevirme hakları yenilendi`);
    
    return NextResponse.json({
      success: true,
      message: 'Çarkı çevirme hakları yenilendi',
      usersUpdated: updateResult.count,
    });
    
  } catch (error) {
    console.error('Çarkı çevirme haklarını sıfırlama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', details: error },
      { status: 500 }
    );
  }
} 
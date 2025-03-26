import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/twilio';

// SMS hatırlatma mesajının içeriği
const REMINDER_MESSAGE = 'Bugün şansınızı denemek için çark çevirmeyi unutmayın! Kafeye uğrayın ve size özel indirimler kazanın. LuckyChart';

export async function GET() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Şu anki saat ve dakikaya uygun SMS zamanlaması var mı kontrol et
    const schedule = await prisma.smsSchedule.findFirst({
      where: {
        hour: currentHour,
        minute: currentMinute,
        isActive: true,
      },
    });
    
    if (!schedule) {
      return NextResponse.json({ 
        success: true, 
        message: 'Bu saat ve dakika için zamanlanmış SMS gönderimi yok' 
      });
    }
    
    // Bugün için çark çevirme hakkını kullanmamış olan aktif kullanıcıları bul
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { lastSpinDate: null },
          { lastSpinDate: { lt: today } },
        ],
        spinsRemaining: { gt: 0 },
      },
    });
    
    console.log(`${users.length} kullanıcıya SMS gönderilecek`);
    
    // Her kullanıcıya SMS gönder
    const results = await Promise.all(
      users.map(async (user) => {
        const result = await sendSMS(user.phone, REMINDER_MESSAGE);
        return { ...result, userId: user.id, phone: user.phone };
      })
    );
    
    // Başarılı ve başarısız sonuçları ayır
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return NextResponse.json({
      success: true,
      totalSent: successful.length,
      totalFailed: failed.length,
      schedule,
    });
    
  } catch (error) {
    console.error('SMS cron hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', details: error },
      { status: 500 }
    );
  }
} 
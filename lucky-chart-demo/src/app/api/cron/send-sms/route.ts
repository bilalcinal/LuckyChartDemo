import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/twilio';

// Sabitleri tanımla
const SEND_SMS_ENDPOINT = 'https://api.netgsm.com.tr/sms/send/get';
const NETGSM_USER = 'xxxx';
const NETGSM_PASSWORD = 'xxxxxx';
const SENDER_ID = 'xxx';
const REMINDER_MESSAGE = 'Bugün şansınızı denemek için çark çevirmeyi unutmayın! Kafeye uğrayın ve size özel indirimler kazanın. MackPot';

export async function GET() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Şu anki zamana yakın bir SMS zamanlaması var mı kontrol et
    // Güncel saate ve dakikaya göre sorgu yapılacak (aynı gün)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Şu anki zamanla eşleşen schedule'ları bul
    const schedule = await prisma.smsSchedule.findFirst({
      where: {
        isActive: true,
        scheduleTime: {
          gte: todayStart,
          lte: todayEnd
        }
      },
    });
    
    if (!schedule) {
      return NextResponse.json({ 
        success: true, 
        message: 'Bu gün için zamanlanmış SMS gönderimi yok' 
      });
    }
    
    // Zamanlamanın saati ve dakikası şu anki saat ve dakikayla eşleşiyor mu kontrol et
    const scheduleHour = new Date(schedule.scheduleTime).getHours();
    const scheduleMinute = new Date(schedule.scheduleTime).getMinutes();
    
    if (scheduleHour !== currentHour || scheduleMinute !== currentMinute) {
      return NextResponse.json({ 
        success: true, 
        message: 'Şu anki saat ve dakika için zamanlanmış SMS gönderimi yok' 
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
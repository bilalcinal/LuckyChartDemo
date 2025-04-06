import cron from 'node-cron';
import fetch from 'node-fetch';

// Ayrı bir process'de (örneğin, standalone bir Node.js server) kullanılacak olan zamanlayıcı

// Günlük gece 12:00'da çalışacak cron görevi (çevirme haklarını sıfırlar)
export function scheduleDailySpinReset() {
  // Her gün gece 00:00'da çalış (Türkiye saati)
  return cron.schedule('0 0 * * *', async () => {
    console.log('Günlük çarkı çevirme hakları sıfırlanıyor...');
    
    try {
      const response = await fetch('http://localhost:3000/api/cron/reset-spins');
      const data = await response.json();
      
      if (data.success) {
        console.log(`Başarılı! ${data.usersUpdated} kullanıcının çarkı çevirme hakları yenilendi.`);
      } else {
        console.error('Çarkı çevirme haklarını sıfırlama hatası:', data.error);
      }
    } catch (error) {
      console.error('Çarkı çevirme haklarını sıfırlama API hatası:', error);
    }
  });
}

// SMS zamanlamalarını kontrol eden cron görevi (her dakika çalışır)
export function scheduleSmsCheck() {
  // Her dakika çalış
  return cron.schedule('* * * * *', async () => {
    console.log('SMS zamanlamaları kontrol ediliyor...');
    
    try {
      const response = await fetch('http://localhost:3000/api/cron/send-sms');
      const data = await response.json();
      
      if (data.success) {
        if (data.totalSent > 0) {
          console.log(`${data.totalSent} kullanıcıya SMS gönderildi.`);
        }
      } else {
        console.error('SMS gönderme hatası:', data.error);
      }
    } catch (error) {
      console.error('SMS gönderme API hatası:', error);
    }
  });
}

// Tüm zamanlayıcıları başlat
export function startAllSchedulers() {
  const spinResetJob = scheduleDailySpinReset();
  const smsCheckJob = scheduleSmsCheck();
  
  console.log('Tüm zamanlayıcılar başlatıldı.');
  
  return {
    spinResetJob,
    smsCheckJob,
    
    // Tüm görevleri durdur
    stopAll: () => {
      spinResetJob.stop();
      smsCheckJob.stop();
      console.log('Tüm zamanlayıcılar durduruldu.');
    }
  };
} 
// CommonJS formatında zamanlayıcı modülü
const cron = require('node-cron');
const fetch = require('node-fetch');

// Günlük gece 12:00'da çalışacak cron görevi (çevirme haklarını sıfırlar)
function scheduleDailySpinReset() {
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
function scheduleSmsCheck() {
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
function startAllSchedulers() {
  const spinResetJob = scheduleDailySpinReset();
  const smsCheckJob = scheduleSmsCheck();
  
  console.log('Tüm zamanlayıcılar başlatıldı.');
  console.log('Not: Çark çevirme hakları her gün 00:00\'da yenilenecek');
  
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

module.exports = {
  scheduleDailySpinReset,
  scheduleSmsCheck,
  startAllSchedulers
}; 
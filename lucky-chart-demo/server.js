// Bu dosya çark çevirme haklarının düzenli olarak yenilenmesi için cron işlerini çalıştırır
const { startAllSchedulers } = require('./src/lib/scheduler-cjs');

// Zamanlayıcı servisi başlatılıyor
console.log('ŞanslıÇark Zamanlayıcı Servisi başlatılıyor...');

// Burada tüm zamanlanmış işleri başlatıyoruz
try {
  startAllSchedulers();
  console.log('Tüm zamanlayıcılar başarıyla başlatıldı.');
  console.log('Not: Çark çevirme hakları her gün 00:00\'da otomatik olarak yenilenecek');
} catch (error) {
  console.error('Zamanlayıcılar başlatılırken hata oluştu:', error);
}

// SMS ve zamanlanmış görevler için standalone server
const cron = require('node-cron');
const axios = require('axios');

// Start the scheduling tasks
console.log('ŞanslıÇark Zamanlayıcı Servisi başlatıldı!');
console.log('Durdurmak için CTRL+C tuşlarına basın.'); 
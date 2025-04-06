// Bu dosya çark çevirme haklarının düzenli olarak yenilenmesi için cron işlerini çalıştırır
const { startAllSchedulers } = require('./src/lib/scheduler-cjs');

// Test modu aktif: Çevirme hakları her dakika yenilenecek
console.log('TEST MODU AKTIF: Çevirme hakları her dakika yenilecek!');

// Burada tüm zamanlanmış işleri başlatıyoruz
try {
  startAllSchedulers();
  console.log('Tüm zamanlayıcılar başarıyla başlatıldı.');
  console.log('Not: TEST MODU - Çark çevirme hakları her dakika yenileniyor');
} catch (error) {
  console.error('Zamanlayıcılar başlatılırken hata oluştu:', error);
}

// SMS ve zamanlanmış görevler için standalone server
const cron = require('node-cron');
const axios = require('axios');

console.log('ŞanslıÇark Zamanlayıcı Servisi başlatılıyor...');
console.log('TEST MODU AKTIF: Çevirme hakları her dakika yenilenecek!');

let schedulers = null;

// Process sinyallerini dinle (kapatma işlemleri için)
process.on('SIGINT', () => {
  console.log('SIGINT sinyali alındı, servis kapatılıyor...');
  if (schedulers) {
    schedulers.stopAll();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı, servis kapatılıyor...');
  if (schedulers) {
    schedulers.stopAll();
  }
  process.exit(0);
});

// Ana Next.js uygulamasının başlaması için biraz bekle
setTimeout(() => {
  console.log('Zamanlayıcılar başlatılıyor...');
  try {
    schedulers = startAllSchedulers();
    console.log('Tüm zamanlayıcılar başarıyla başlatıldı!');
    console.log('Not: TEST MODU - Çark çevirme hakları her dakika yenileniyor');
  } catch (error) {
    console.error('Zamanlayıcı başlatma hatası:', error);
  }
}, 5000); // 5 saniye bekle

console.log('ŞanslıÇark Zamanlayıcı Servisi başlatıldı!');
console.log('Durdurmak için CTRL+C tuşlarına basın.'); 
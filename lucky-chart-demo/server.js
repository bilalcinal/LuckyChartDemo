// SMS ve zamanlanmış görevler için standalone server
const { startAllSchedulers } = require('./dist/lib/scheduler');
const cron = require('node-cron');
const axios = require('axios');

console.log('ŞanslıÇark Zamanlayıcı Servisi başlatılıyor...');

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
  } catch (error) {
    console.error('Zamanlayıcı başlatma hatası:', error);
  }
}, 5000); // 5 saniye bekle

console.log('ŞanslıÇark Zamanlayıcı Servisi başlatıldı!');
console.log('Durdurmak için CTRL+C tuşlarına basın.'); 
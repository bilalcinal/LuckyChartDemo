'use client';

import RegisterForm from './components/RegisterForm';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900">
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-center">
          {/* Sol taraf - Yazı içeriği */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Şansını Dene, Hemen Çevir!
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              LuckyChart ile şansını dene ve harika ödüller kazanma fırsatını
              yakala. Çarkı çevirmek için hemen kaydol ve şansını test et!
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mr-3">
                  <span className="text-black font-bold text-xl">1</span>
                </div>
                <p className="text-gray-300 text-lg">Kaydol</p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mr-3">
                  <span className="text-black font-bold text-xl">2</span>
                </div>
                <p className="text-gray-300 text-lg">Çarkı Çevir</p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mr-3">
                  <span className="text-black font-bold text-xl">3</span>
                </div>
                <p className="text-gray-300 text-lg">Ödülünü Kazan</p>
              </div>
            </div>
          </div>

          {/* Sağ taraf - Kayıt Formu */}
          <div className="w-full md:w-1/2">
            <RegisterForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center p-4 text-sm">
        <p>© 2025 LuckyChart, Tüm Hakları Saklıdır.</p>
      </footer>
    </main>
  );
}

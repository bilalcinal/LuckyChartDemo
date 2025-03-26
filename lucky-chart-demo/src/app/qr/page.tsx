'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function QRPage() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Telefon numarasını doğrula
      if (!phone) {
        setError('Lütfen telefon numaranızı girin');
        setIsLoading(false);
        return;
      }

      // Telefon numarası formatlama
      const formattedPhone = phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`;

      // Önce kayıt API'sini çağır
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerData.error || 'Bir hata oluştu');
        setIsLoading(false);
        return;
      }

      // Ardından oturum aç
      const result = await signIn('credentials', {
        phone: formattedPhone,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || 'Giriş yapılamadı');
        setIsLoading(false);
        return;
      }

      // Başarılı giriş, çark sayfasına yönlendir
      router.push('/wheel');
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 py-6">
      <div className="bg-gray-900 text-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-800">
        <div className="flex flex-col items-center justify-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-yellow-400">LuckyChart</h1>
          <h2 className="text-lg sm:text-xl text-center text-gray-300">Şanslı Çark</h2>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-gray-300">
            Çarkı çevirmek için lütfen telefon numaranızı girin:
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-300 text-sm font-bold mb-2">
              Telefon Numarası
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="5XX XXX XX XX"
              className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'İşleniyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Bu uygulama, Kafe Şans'ın özel promosyon uygulamasıdır.
          </p>
        </div>
      </div>
    </div>
  );
} 
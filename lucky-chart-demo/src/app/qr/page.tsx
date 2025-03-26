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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">LuckyChart</h1>
        <h2 className="text-xl text-center mb-6">Şanslı Çark</h2>
        
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            Çarkı çevirmek için lütfen telefon numaranızı girin:
          </p>
          
          {/* QR kodu buraya eklenecek */}
          <div className="bg-gray-200 rounded-lg p-4 mb-6 flex items-center justify-center">
            <div className="w-48 h-48 bg-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">QR Kod</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
              Telefon Numarası
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="5XX XXX XX XX"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'İşleniyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Bu uygulama, Kafe Şans'ın özel promosyon uygulamasıdır.
          </p>
        </div>
      </div>
    </div>
  );
} 
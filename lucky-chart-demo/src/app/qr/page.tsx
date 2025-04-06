'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function QRPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('register'); // 'register', 'verify', 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/wheel';

  const handleRegister = async (e: React.FormEvent) => {
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

      // Email kontrolü
      if (!email) {
        setError('Lütfen e-posta adresinizi girin');
        setIsLoading(false);
        return;
      }

      // Email format kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Lütfen geçerli bir e-posta adresi girin');
        setIsLoading(false);
        return;
      }

      // Telefon numarası formatlama
      const formattedPhone = phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`;

      // Kayıt API'sini çağır
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formattedPhone,
          email: email 
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerData.error || 'Bir hata oluştu');
        setIsLoading(false);
        return;
      }

      // Kullanıcı ID'sini sakla
      setUserId(registerData.userId);

      // E-posta doğrulaması gerekiyorsa
      if (registerData.requiresVerification) {
        setStep('verify');
        setIsLoading(false);
      } else {
        // Doğrulama gerekmiyorsa doğrudan giriş yap
        await handleLogin(formattedPhone);
      }
      
    } catch (error) {
      console.error('Kayıt hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!verificationCode) {
        setError('Lütfen doğrulama kodunu girin');
        setIsLoading(false);
        return;
      }

      // Doğrulama API'sini çağır
      const verifyResponse = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: verificationCode,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Doğrulama başarısız oldu');
        setIsLoading(false);
        return;
      }

      // Doğrulama başarılı, telefon ile giriş yap
      const formattedPhone = phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`;
      await handleLogin(formattedPhone);
      
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  const handleLogin = async (phoneNumber: string) => {
    try {
      const result = await signIn('phone-credentials', {
        phone: phoneNumber,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || 'Giriş yapılamadı');
        setIsLoading(false);
        return;
      }

      // Başarılı giriş, callbackUrl veya çark sayfasına yönlendir
      router.push(callbackUrl);
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
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
          {step === 'register' && (
            <p className="text-gray-300">
              Çarkı çevirmek için lütfen bilgilerinizi girin:
            </p>
          )}
          
          {step === 'verify' && (
            <p className="text-gray-300">
              E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin:
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        {step === 'register' ? (
          <form onSubmit={handleRegister}>
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

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
                E-posta Adresi
              </label>
              <input
                type="email"
                id="email"
                placeholder="ornek@mail.com"
                className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? 'İşleniyor...' : 'Devam Et'}
              </button>
            </div>
          </form>
        ) : step === 'verify' ? (
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label htmlFor="verificationCode" className="block text-gray-300 text-sm font-bold mb-2">
                Doğrulama Kodu
              </label>
              <input
                type="text"
                id="verificationCode"
                placeholder="6 haneli kod"
                className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
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
                {isLoading ? 'İşleniyor...' : 'Doğrula ve Giriş Yap'}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Doğrulama kodu almadınız mı?
              </p>
              <button
                type="button"
                className="text-yellow-400 hover:text-yellow-300 text-sm mt-2"
                onClick={() => setStep('register')}
              >
                Bilgileri yeniden girin
              </button>
            </div>
          </form>
        ) : null}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Bu uygulama, Kafe Şans'ın özel promosyon uygulamasıdır.
          </p>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function QRPage() {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'verification'
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/wheel';

  const handlePhoneSubmit = async (e: React.FormEvent) => {
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

      // Telefon doğrulama API'sini çağır
      const verifyResponse = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Bir hata oluştu');
        setIsLoading(false);
        return;
      }

      if (verifyData.requireVerification) {
        // Yeni kullanıcı, SMS gönderildi, doğrulama ekranına geç
        setVerificationSent(true);
        setStep('verification');
        
        // Geçici doğrulama kodunu sessionStorage'a kaydet
        if (verifyData.tempCode) {
          sessionStorage.setItem('tempVerificationCode', verifyData.tempCode);
        }
      } else {
        // Kullanıcı zaten kayıtlı, direkt giriş yap
        const result = await signIn('phone-credentials', {
          phone: formattedPhone,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error || 'Giriş yapılamadı');
          setIsLoading(false);
          return;
        }

        // Başarılı giriş, callbackUrl veya çark sayfasına yönlendir
        router.push(callbackUrl);
      }
      
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!verificationCode) {
        setError('Lütfen doğrulama kodunu girin');
        setIsLoading(false);
        return;
      }

      const formattedPhone = phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`;
      
      // Session storage'dan geçici kodu al
      const tempCode = sessionStorage.getItem('tempVerificationCode');

      // OTP doğrulama API'sini çağır
      const otpResponse = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formattedPhone,
          code: verificationCode,
          tempCode: tempCode // Geçici kod
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        setError(otpData.error || 'Doğrulama kodu geçersiz');
        setIsLoading(false);
        return;
      }

      // Doğrulama başarılı, session storage'dan geçici kodu temizle
      sessionStorage.removeItem('tempVerificationCode');

      // Doğrulama başarılı, şimdi giriş yap
      const result = await signIn('phone-credentials', {
        phone: formattedPhone,
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
      console.error('Doğrulama hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS'i yeniden gönderme işlevi
  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`;

      const verifyResponse = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'SMS gönderilemedi');
        return;
      }

      setVerificationSent(true);
      
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      setError('SMS gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 py-6">
      <div className="bg-gray-900 text-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-800">
        <div className="flex flex-col items-center justify-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-yellow-400">LuckyChart</h1>
          <h2 className="text-lg sm:text-xl text-center text-gray-300">Şanslı Çark</h2>
        </div>
        
        {step === 'phone' ? (
          <>
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
            
            <form onSubmit={handlePhoneSubmit}>
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
                  {isLoading ? 'İşleniyor...' : 'Devam Et'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-gray-300">
                Telefonunuza gönderilen doğrulama kodunu girin:
              </p>
              <p className="text-sm text-yellow-400 mt-2">
                {phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`} numaralı telefona SMS gönderildi.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4" role="alert">
                <span>{error}</span>
              </div>
            )}
            
            {verificationSent && (
              <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded mb-4" role="alert">
                <span>Doğrulama kodu gönderildi!</span>
              </div>
            )}
            
            <form onSubmit={handleVerificationSubmit}>
              <div className="mb-4">
                <label htmlFor="verificationCode" className="block text-gray-300 text-sm font-bold mb-2">
                  Doğrulama Kodu
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  placeholder="12345"
                  className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={5}
                  minLength={5}
                />
              </div>
              
              <div className="flex items-center justify-between mb-4">
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
              
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={goBackToPhone}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Telefon numarasını değiştir
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className={`text-blue-400 hover:text-blue-300 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Kodu yeniden gönder
                </button>
              </div>
            </form>
          </>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Bu uygulama, Kafe Şans'ın özel promosyon uygulamasıdır.
          </p>
        </div>
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [tempCode, setTempCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const router = useRouter();
  
  // Sayfa yüklendiğinde ve refresh token varsa kontrol et
  useEffect(() => {
    // Token kontrolü
    const authToken = Cookies.get('lc_token');
    const refreshToken = Cookies.get('lc_refresh_token');
    const userId = Cookies.get('lc_user_id');
    
    if (userId && (authToken || refreshToken)) {
      // Oturum zaten açık, doğrudan çark sayfasına yönlendir
      router.push('/wheel');
    } else {
      setIsChecking(false);
    }
  }, [router]);
  
  // Email doğrulama kodu gönderme
  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    if (!email || !phone) {
      setErrorMessage('Email ve telefon numarası zorunludur.');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Test modu için geçici doğrulama kodu
        if (data.tempCode) {
          setTempCode(data.tempCode);
        }
        
        // Email doğrulama gerektirmeyen durumlar
        if (!data.requireVerification) {
          router.push('/wheel');
          return;
        }
        
        setStep(2);
      } else {
        setErrorMessage(data.error || 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Hata:', error);
    }
    
    setIsLoading(false);
  };
  
  // Doğrulama kodunu kontrol et
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/verify-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          phone,
          code: verificationCode,
          tempCode
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Doğrulama başarılı, kullanıcıyı yönlendir
        router.push('/wheel');
      } else {
        setErrorMessage(data.error || 'Doğrulama kodu geçersiz.');
      }
    } catch (error) {
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Hata:', error);
    }
    
    setIsLoading(false);
  };
  
  // Telefon numarası formatlama
  const formatPhoneNumber = (value: string) => {
    // Sadece sayılara izin ver
    const phoneNumber = value.replace(/[^\d]/g, '');
    return phoneNumber;
  };
  
  // Yükleniyor durumu
  if (isChecking) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-black rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Oturum kontrol ediliyor...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-black rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-800">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-8">
          Çarkı Çevirmek İçin Kaydolun
        </h2>
        
        {step === 1 ? (
          <form onSubmit={handleSendVerificationCode} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-300 text-lg mb-2">
                Email Adresiniz*
              </label>
              <input
                type="email"
                id="email"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-gray-300 text-lg mb-2">
                Telefon Numaranız*
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg"
                placeholder="5XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                required
              />
              <p className="text-gray-500 text-sm mt-2">
                Başında 0 olmadan giriniz. Örn: 5XX XXX XX XX
              </p>
            </div>
            
            {errorMessage && (
              <div className="text-red-500 text-base p-3 bg-red-500/10 rounded-lg">
                {errorMessage}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg text-lg transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-gray-300 text-lg mb-2">
                Doğrulama Kodu ({email})
              </label>
              <input
                type="text"
                id="code"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg"
                placeholder="Doğrulama kodunu giriniz"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <p className="text-gray-500 text-sm mt-2">
                Email adresinize gönderilen 6 haneli kodu giriniz.
              </p>
            </div>
            
            {/* Test modu doğrulama kodu gösterimi */}
            {tempCode && (
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-yellow-500 text-base">Test Modu Doğrulama Kodu: {tempCode}</p>
              </div>
            )}
            
            {errorMessage && (
              <div className="text-red-500 text-base p-3 bg-red-500/10 rounded-lg">
                {errorMessage}
              </div>
            )}
            
            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-200"
                disabled={isLoading}
              >
                Geri
              </button>
              
              <button
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg text-lg transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Doğrulanıyor...' : 'Doğrula ve Devam Et'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 
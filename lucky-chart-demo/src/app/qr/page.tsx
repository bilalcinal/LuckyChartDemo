'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

// Oturum tipleri için yardımcı tip tanımlamaları
type UserSession = {
  id: string;
  phone?: string;
  email?: string;
  sessionType?: 'admin' | 'user' | 'employee';
  [key: string]: any;
};

// SearchParams kullanan iç bileşen
function QRContent() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('register'); // 'register', 'verify', 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [activeInput, setActiveInput] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/wheel';
  const { data: session, status } = useSession();

  // Session kontrolü ile otomatik yönlendirme
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  // Doğrulama kodu girişi için 6 ayrı input kutusu
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  
  useEffect(() => {
    // Kod girişlerini birleştirip state'e atama
    const combinedCode = codeDigits.join('');
    setVerificationCode(combinedCode);
  }, [codeDigits]);
  
  // Kopyala-yapıştır için kod yönetimi
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text') || '';
    // Sadece sayıları almak için filtreleme
    const numericText = pastedText.replace(/\D/g, '').slice(0, 6);
    
    if (numericText) {
      // Her karakter için ayrı input'a yerleştir
      const newDigits = [...codeDigits];
      for (let i = 0; i < Math.min(numericText.length, 6); i++) {
        newDigits[i] = numericText[i];
      }
      setCodeDigits(newDigits);
      
      // Son karakterden sonraki input'a odaklan veya tamamlandıysa son input'a
      const focusIndex = Math.min(numericText.length, 5);
      document.getElementById(`code-${focusIndex}`)?.focus();
    }
  };
  
  const handleCodeChange = (index: number, value: string) => {
    // Sadece rakam girişine izin ver
    if (value && !/^\d*$/.test(value)) return;
    
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    
    // Otomatik olarak sonraki input kutusuna geç
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };
  
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace tuşuna basıldığında önceki input kutusuna dön
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

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

      // Telefon numarası format kontrolü (Türkiye formatı)
      const phonePattern = /^(5\d{9})$|^(05\d{9})$|^(\+905\d{9})$/;
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Telefon numarası başında 0 veya ülke kodu yoksa 5 ile başlayan 10 haneli olmalı
      if (!phonePattern.test(phone) && !(cleanPhone.length === 10 && cleanPhone.startsWith('5'))) {
        setError('Lütfen geçerli bir Türkiye telefon numarası girin (5xx xxx xx xx)');
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
      const formattedPhone = phone.startsWith('+90') ? phone : `+90${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;

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
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Lütfen 6 haneli doğrulama kodunu girin');
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

  // Kullanıcı session varsa sayfayı gösterme
  if (status === 'authenticated') {
    return null;
  }

  // Kullanıcı tipini güvenli şekilde al
  // @ts-ignore
  const userSession = session?.user as UserSession | undefined;
  const isAdminSession = userSession?.sessionType === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center w-full px-4 py-6">
      <div className="relative w-full max-w-md mx-auto">
        {/* Arka plan efekti */}
        <div className="absolute inset-0 blur-xl bg-yellow-500 opacity-10 rounded-xl transform -rotate-6 pointer-events-none"></div>
        
        <div className="relative bg-gray-900 text-white p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm border border-gray-800 overflow-hidden z-10">
          {/* Decorative Elements - pointer-events-none eklenerek bunların input'ları engellememesi sağlanıyor */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500 rounded-full opacity-10 blur-2xl pointer-events-none"></div>
          
          {/* Admin oturumu varsa uyarı göster */}
          {/* @ts-ignore */}
          {status === 'authenticated' && isAdminSession && (
            <div className="bg-red-900/80 border-2 border-red-700 p-4 rounded-lg mb-8">
              <h2 className="text-lg font-bold text-white mb-2">Admin Oturumu Açık</h2>
              <p className="text-white mb-4">
                Çark sayfasına erişebilmek için önce admin oturumunuzdan çıkış yapmalısınız.
              </p>
              <a 
                href="/api/auth/signout?callbackUrl=/qr" 
                className="block w-full text-center bg-white text-red-900 py-2 px-4 rounded font-bold hover:bg-gray-100 transition-colors"
              >
                Çıkış Yap
              </a>
            </div>
          )}
          
          {/* Admin oturumu yoksa normal form göster */}
          {/* @ts-ignore */}
          {(status !== 'authenticated' || !isAdminSession) && (
            <>
              <div className="flex flex-col items-center justify-center mb-8 relative z-10">
                <div className="w-16 h-16 mb-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">ŞanslıÇark</h1>
                <h2 className="text-lg sm:text-xl text-center text-gray-300 font-light">Akyazı Macbear</h2>
              </div>
              
              {/* Register Form - z-index eklendi */}
              <div className={`transition-all duration-500 ease-in-out transform relative z-20 ${step === 'verify' ? 'opacity-0 scale-90 hidden' : 'opacity-100 scale-100 block'}`}>
                <div className="text-center mb-6">
                  {step === 'register' && (
                    <p className="text-gray-300">
                      Çarkı çevirmek için lütfen bilgilerinizi girin
                    </p>
                  )}
                </div>
                
                {error && step === 'register' && (
                  <div className="bg-red-900/50 backdrop-blur-sm border border-red-700/50 text-red-100 px-4 py-3 rounded-lg mb-6 animate-pulse" role="alert">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                {step === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-300 opacity-20 blur-md rounded-lg transition-opacity duration-300 pointer-events-none ${activeInput === 'phone' ? 'opacity-30' : 'opacity-0'}`}></div>
                      <label htmlFor="phone" className="block text-gray-300 text-sm font-medium mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Telefon Numarası
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        placeholder="5XX XXX XX XX"
                        className="relative z-10 shadow appearance-none border border-gray-700 bg-gray-800/70 backdrop-blur-sm rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-300"
                        value={phone}
                        onChange={(e) => {
                          // Sadece sayıları ve başında + işaretini kabul et
                          const value = e.target.value;
                          if (/^(\+)?[0-9]*$/.test(value)) {
                            // Maksimum karakter kontrolü (başında + varsa 13, yoksa 11 karakter)
                            if ((value.startsWith('+') && value.length <= 13) || (!value.startsWith('+') && value.length <= 11)) {
                              setPhone(value);
                            }
                          }
                        }}
                        onFocus={() => setActiveInput('phone')}
                        onBlur={() => setActiveInput('')}
                        maxLength={13}
                        required
                      />
                    </div>

                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-300 opacity-20 blur-md rounded-lg transition-opacity duration-300 pointer-events-none ${activeInput === 'email' ? 'opacity-30' : 'opacity-0'}`}></div>
                      <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        E-posta Adresi
                      </label>
                      <input
                        type="email"
                        id="email"
                        placeholder="ornek@mail.com"
                        className="relative z-10 shadow appearance-none border border-gray-700 bg-gray-800/70 backdrop-blur-sm rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setActiveInput('email')}
                        onBlur={() => setActiveInput('')}
                        required
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className={`relative z-10 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 w-full transform transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                          isLoading ? 'opacity-70 pointer-events-none' : ''
                        }`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            İşleniyor...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            Devam Et
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
              
              {/* Verification Form - z-index eklendi */}
              <div className={`transition-all duration-500 ease-in-out transform relative z-20 ${step === 'register' ? 'opacity-0 scale-90 hidden' : 'opacity-100 scale-100 block'}`}>
                <div className="text-center mb-6">
                  {step === 'verify' && (
                    <div>
                      <p className="text-gray-300 mb-1">
                        E-posta adresinize gönderilen doğrulama kodunu girin
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="font-medium text-yellow-500">{email}</span> adresine kod gönderildi
                      </p>
                    </div>
                  )}
                </div>
                
                {error && step === 'verify' && (
                  <div className="bg-red-900/50 backdrop-blur-sm border border-red-700/50 text-red-100 px-4 py-3 rounded-lg mb-6 animate-pulse" role="alert">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                {step === 'verify' && (
                  <form onSubmit={handleVerify} className="space-y-6">
                    <div className="relative">
                      <label className="block text-gray-300 text-sm font-medium mb-4 text-center">
                        Doğrulama Kodu
                      </label>
                      
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <input
                            key={i}
                            id={`code-${i}`}
                            type="number"
                            min="0"
                            max="9" 
                            maxLength={1}
                            value={codeDigits[i]}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                            className="relative z-10 w-10 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold bg-gray-800/70 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent text-white transition-all duration-300 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className={`relative z-10 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 w-full transform transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                          isLoading ? 'opacity-70 pointer-events-none' : ''
                        }`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            İşleniyor...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            Doğrula ve Giriş Yap
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-gray-400 text-sm">
                        Doğrulama kodu almadınız mı?
                      </p>
                      <button
                        type="button"
                        className="relative z-10 text-yellow-500 hover:text-yellow-400 text-sm mt-2 font-medium transition-colors duration-300 flex items-center justify-center mx-auto"
                        onClick={() => setStep('register')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Bilgileri yeniden girin
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
          
          <div className="mt-8 text-center relative z-10">
            <div className="inline-flex items-center">
              <div className="h-px w-8 bg-gray-700"></div>
              <p className="text-xs text-gray-500 mx-2">AKYAZI MACBEAR</p>
              <div className="h-px w-8 bg-gray-700"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Bu uygulama, Akyazı Macbear'ın özel promosyon uygulamasıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ana sayfa bileşeni - useSearchParams içeren bileşeni Suspense ile sarıyor
export default function QRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-4 border-4 border-t-yellow-500 border-r-yellow-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="text-yellow-500">Yükleniyor...</p>
        </div>
      </div>
    }>
      <QRContent />
    </Suspense>
  );
} 
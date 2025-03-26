'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sadece çok uzun olduğunda sıfırla, yoksa kod zaten belirli bir uzunlukta
      if (secretCode.length > 20) {
        setSecretCode([]);
      }
      
      // Tuş basılınca kodu ekle
      setSecretCode(prev => [...prev, e.key]);
      
      // Konamiyi kontrol et (son N karakter)
      const seq = [...secretCode, e.key];
      if (seq.length >= konamiCode.length) {
        const lastNKeys = seq.slice(seq.length - konamiCode.length);
        if (JSON.stringify(lastNKeys) === JSON.stringify(konamiCode)) {
          router.push('/admin');
        }
      }
    };
    
    // Sadece tarayıcıda çalıştığından emin ol
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [secretCode, router]);
  
  // Gizli tıklama kodunu ekle
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  const handleLogoClick = () => {
    const now = new Date().getTime();
    
    // 1 saniye içinde yapılan tıklamalar sayılsın
    if (now - lastClickTime < 1000) {
      setClickCount(clickCount + 1);
    } else {
      // Zaman aşımı olduğunda sıfırla
      setClickCount(1);
    }
    
    // Son tıklama zamanını güncelle
    setLastClickTime(now);
    
    // 5 hızlı tıklama yapılınca admin paneline git
    if (clickCount >= 4) { // 5. tıklama
      router.push('/admin');
      setClickCount(0);
    }
  };
  
  return (
    <footer className="w-full mt-auto py-3 bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600">
            © 2024 Kafe Şans
          </p>
        </div>
        <div 
          onClick={handleLogoClick}
          className="text-xs text-gray-600 cursor-default select-none"
        >
          v1.0.0
        </div>
      </div>
    </footer>
  );
} 
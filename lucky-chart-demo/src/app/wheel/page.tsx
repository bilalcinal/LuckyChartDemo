'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type WheelItem = {
  id: string;
  title: string;
  description: string | null;
  color: string;
};

type RewardDetails = {
  id: string;
  code: string;
  item: {
    id: string;
    title: string;
    description: string | null;
    color: string;
  };
  expiresAt: string;
};

export default function JackpotPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewardItems, setRewardItems] = useState<WheelItem[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<RewardDetails | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [error, setError] = useState('');
  const [existingReward, setExistingReward] = useState<RewardDetails | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [slotPosition, setSlotPosition] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  
  const slotRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Mobil/masaüstü tespiti için
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // İlk yükleme kontrolü
    checkIfMobile();
    
    // Ekran boyutu değiştiğinde kontrol et
    window.addEventListener('resize', checkIfMobile);
    
    // Temizlik
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/qr');
    }
  }, [status, router]);
  
  // Ödül öğelerini ve kullanıcının mevcut ödüllerini getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ödül öğelerini getir
        const itemsResponse = await fetch('/api/admin/wheel-items');
        if (!itemsResponse.ok) {
          throw new Error('Ödül öğeleri getirilemedi');
        }
        
        const itemsData = await itemsResponse.json();
        // Sadece aktif öğeleri al
        const activeItems = itemsData.filter((item: WheelItem & { isActive: boolean }) => item.isActive);
        
        if (!activeItems.length) {
          setError('Aktif ödül öğesi bulunamadı');
          return;
        }
        
        setRewardItems(activeItems);
        
        // Kullanıcının mevcut ödüllerini getir
        const rewardsResponse = await fetch('/api/wheel/rewards');
        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json();
          if (rewardsData.rewards && rewardsData.rewards.length > 0) {
            // Süresi geçmemiş en son ödülü al
            const latestReward = rewardsData.rewards.find((r: RewardDetails) => 
              new Date(r.expiresAt) > new Date()
            );
            
            if (latestReward) {
              setExistingReward(latestReward);
            }
          }
        }
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        setError('Veriler yüklenirken bir hata oluştu');
      }
    };
    
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);
  
  const handleSpinClick = async () => {
    if (spinning || !rewardItems.length) return;
    
    setError('');
    setSpinning(true);
    setWinnerIndex(-1);
    
    try {
      const response = await fetch('/api/wheel/spin', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Çevirme hatası');
      }
      
      const data = await response.json();
      
      // Kazanılan ödülü bul
      const winIndex = rewardItems.findIndex(item => item.id === data.reward.item.id);
      
      if (winIndex === -1) {
        throw new Error('Kazanılan ödül listede bulunamadı');
      }
      
      setReward(data.reward);
      
      // Animasyonu başlat
      startSlotAnimation(winIndex);
      
    } catch (error: any) {
      console.error('Çevirme hatası:', error);
      
      // Kullanıcının günlük hakkı bitti mesajını kontrol et
      if (error.message.includes('Bugün için çevirme hakkınız')) {
        setError('Bugünlük hakkınız bitti, lütfen yarın tekrar deneyiniz.');
        
        // Mevcut ödülü göster (varsa)
        if (existingReward) {
          setReward(existingReward);
          setShowReward(true);
        }
      } else {
        setError(error.message || 'Çevirme sırasında bir hata oluştu');
      }
      
      setSpinning(false);
    }
  };
  
  const startSlotAnimation = (winIndex: number) => {
    // Animasyon parametreleri - daha akıcı animasyon için optimizasyon
    const duration = 5000; // 5 saniye toplam süre - daha uzun ve akıcı bir animasyon
    const startTime = performance.now();
    const totalFrames = rewardItems.length * 20; // Daha fazla kare - daha akıcı görünüm
    const frameHeight = 100; // Her kare yüksekliği (px olarak)
    
    // Son pozisyonu hesapla (kazanan öğeyi ortalamak için)
    const finalPosition = (winIndex * frameHeight);
    
    // Animasyonu başlat
    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Gelişmiş easing fonksiyonu - daha gerçekçi slot makinesi efekti
      let easeProgress;
      
      if (progress < 0.7) {
        // İlk %70'lik kısımda hızlı ve sabit dönüş
        easeProgress = progress / 0.7 * 0.8; // Toplam mesafenin %80'i
      } else {
        // Son %30'luk kısımda yavaşlayarak durma
        const slowProgress = (progress - 0.7) / 0.3;
        // İyileştirilmiş yavaşlama fonksiyonu
        easeProgress = 0.8 + 0.2 * (1 - Math.pow(1 - slowProgress, 4));
      }
      
      if (progress < 1) {
        // Döngüyü devam ettir
        const currentPosition = (totalFrames * frameHeight) * easeProgress;
        setSlotPosition(-(currentPosition % (rewardItems.length * frameHeight)) + finalPosition);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animasyon bittiğinde
        setSlotPosition(-finalPosition);
        setWinnerIndex(winIndex);
        handleSpinStop();
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Kolu çekme efekti - çekildikten 500ms sonra dönme başlasın
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 500);
  };
  
  const handleSpinStop = () => {
    setSpinning(false);
    setTimeout(() => {
      setShowReward(true);
    }, 1000);
  };
  
  const closeRewardModal = () => {
    setShowReward(false);
  };
  
  // Oturum yükleniyor veya ödül öğeleri henüz yüklenmediyse
  if (status === 'loading' || !rewardItems.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Yükleniyor...</h1>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    );
  }
  
  // Kullanıcı kimliği doğrulanmadıysa
  if (status === 'unauthenticated') {
    return null; // useEffect içerisinde yönlendirme yapılacak
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black py-10">
      <div className="text-center mb-8 w-full max-w-3xl px-4">
        <h1 className="text-5xl font-bold text-yellow-400 mb-2 filter drop-shadow-lg">Şanslı Jackpot</h1>
        <p className="text-gray-300 text-lg">
          Hoş geldin, <span className="font-semibold text-yellow-200">{session?.user?.phone}</span>!
          Kolu çekerek şansını dene.
        </p>
        {error && (
          <div className="mt-6 bg-red-900/80 text-white p-4 rounded-lg border-2 border-red-600 shadow-lg">
            <p className="font-bold">{error}</p>
            {existingReward && (
              <div className="mt-3 p-3 bg-gray-800/60 rounded-lg">
                <p className="text-sm">Mevcut kodunuz:</p> 
                <span className="font-bold text-xl text-yellow-300 block my-1">{existingReward.code}</span>
                <span className="text-xs text-gray-300 block">
                  {new Date(existingReward.expiresAt).toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} tarihine kadar geçerlidir.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Jackpot Makinesi - İyileştirilmiş Tasarım */}
      <div className="relative w-full max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-center">
          {/* Gelişmiş Slot Makinesi */}
          <div 
            className="relative rounded-2xl shadow-[0_0_50px_rgba(255,204,0,0.3)] p-8 pt-10" 
            style={{ 
              width: isMobile ? '300px' : '450px',
              background: 'linear-gradient(145deg, #2a2a3a, #1a1a2a)',
              boxShadow: 'inset 0 0 25px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.7)'
            }}
          >
            {/* Süslemeler ve ışıklar - üst kısım */}
            <div className="absolute top-0 left-0 w-full flex justify-center">
              <div className="grid grid-cols-7 gap-3 -mt-4 mb-2">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full transition-all duration-300
                              ${spinning ? 'animate-pulse bg-yellow-400' : 'bg-yellow-800'}`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      boxShadow: spinning ? '0 0 10px rgba(251, 191, 36, 0.7)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Ekran - Geliştirilen Slot Ekranı */}
            <div 
              className="bg-black rounded-xl overflow-hidden mb-6" 
              style={{ 
                height: isMobile ? '160px' : '200px', 
                width: '100%',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,204,0,0.2)',
                border: '6px solid #333'
              }}
            >
              {/* Görünen alan maskesi */}
              <div className="relative h-full w-full overflow-hidden">
                {/* Işık efekti - ekran parlaması */}
                <div 
                  className="absolute inset-0 pointer-events-none z-20" 
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 100%)'
                  }}
                />
                
                {/* Spin pozisyonu göstergesi (orta çizgi) */}
                <div className="absolute top-1/2 left-0 w-full z-10 transform -translate-y-1/2 flex items-center justify-center">
                  <div className="w-full h-1 bg-yellow-500 opacity-70"></div>
                  <div className="absolute w-6 h-6 rounded-full bg-yellow-500 -left-3 shadow-[0_0_10px_#ffcc00]"></div>
                  <div className="absolute w-6 h-6 rounded-full bg-yellow-500 -right-3 shadow-[0_0_10px_#ffcc00]"></div>
                </div>
                
                {/* Slot elemanları - İyileştirilmiş Görsel */}
                <div 
                  ref={slotRef}
                  className="absolute w-full"
                  style={{ 
                    transform: `translateY(${slotPosition}px)`,
                    top: '0',
                    transition: spinning ? 'transform 150ms linear' : 'transform 500ms cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  {/* Öğeleri tekrarlayarak pürüzsüz döngü sağlama */}
                  {[...rewardItems, ...rewardItems, ...rewardItems].map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-center text-center p-3"
                      style={{ 
                        height: '100px',
                        background: item.color,
                        borderTop: '2px solid rgba(255,255,255,0.3)',
                        borderBottom: '2px solid rgba(0,0,0,0.4)',
                        transform: winnerIndex >= 0 && index % rewardItems.length === winnerIndex 
                          ? 'scale(1.05)' 
                          : 'scale(1)',
                        boxShadow: winnerIndex >= 0 && index % rewardItems.length === winnerIndex 
                          ? 'inset 0 0 20px rgba(255,255,255,0.5), 0 0 15px rgba(255,215,0,0.7)' 
                          : 'none',
                        transition: 'all 0.3s ease-out',
                        zIndex: winnerIndex >= 0 && index % rewardItems.length === winnerIndex ? 5 : 1
                      }}
                    >
                      <div className="text-white font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                        style={{ 
                          lineHeight: '1.2',
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Makine gövdesi */}
            <div className="relative flex justify-between items-center">
              <div 
                className="text-yellow-400 font-bold text-2xl" 
                style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.7)' }}
              >
                JACKPOT
              </div>
              
              {/* Işıklar */}
              <div className="flex space-x-3">
                {[1, 2, 3, 4].map(num => (
                  <div 
                    key={num} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 
                              ${spinning 
                                ? 'animate-pulse bg-red-500' 
                                : num % 2 === 0 
                                  ? 'bg-yellow-600' 
                                  : 'bg-red-800'}`}
                    style={{
                      animationDelay: `${num * 0.2}s`,
                      boxShadow: spinning ? '0 0 10px rgba(239, 68, 68, 0.7)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Para yuvası */}
            <div className="mt-6 rounded-lg p-2 mx-auto w-24 bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600">
              <div className="h-2 w-full bg-black rounded-lg"></div>
            </div>
          </div>
          
          {/* Geliştirilmiş Kol */}
          <div className="relative ml-8">
            <button
              onClick={handleSpinClick}
              disabled={spinning}
              className={`relative flex flex-col items-center transform transition-all duration-300 ${
                spinning ? 'translate-y-24 opacity-80 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110'
              }`}
              style={{ 
                width: isMobile ? '70px' : '90px',
                filter: spinning ? 'none' : 'drop-shadow(0 5px 15px rgba(0,0,0,0.4))'
              }}
            >
              {/* Kolun üst kısmı */}
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full border-4 border-gray-800 shadow-lg z-10"
                   style={{ boxShadow: '0 5px 15px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.3)' }}>
              </div>
              
              {/* Kolun gövdesi */}
              <div className="w-5 h-40 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full shadow-md transform -translate-y-2"
                   style={{ boxShadow: 'inset -1px 0 3px rgba(255,255,255,0.3)' }}>
              </div>
              
              {/* Kolun alt kısmı */}
              <div className="w-8 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-xl shadow-inner transform -translate-y-2"
                   style={{ boxShadow: 'inset 0 -2px 5px rgba(0,0,0,0.5)' }}>
              </div>
              
              {/* Metin */}
              <div className="mt-5 text-yellow-400 font-bold text-center text-xl filter drop-shadow-lg"
                   style={{ 
                     textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
                     opacity: spinning ? 0.7 : 1
                   }}>
                {spinning ? "DÖNÜYOR" : "ÇEK"}
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center w-full max-w-3xl px-4">
        <p className="text-gray-400 text-sm">
          Her gün yeni çevirme hakkı kazanırsınız.
        </p>
      </div>
      
      {/* Geliştirilmiş Ödül Modalı */}
      {showReward && reward && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div 
            className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-8 max-w-md mx-auto border-2 border-yellow-500 shadow-2xl animate-scaleIn"
            style={{ boxShadow: '0 0 50px rgba(255,204,0,0.3), inset 0 0 30px rgba(0,0,0,0.4)' }}
          >
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-24 h-24">
              <div className="w-full h-full relative animate-float">
                <div className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-20"></div>
                <div className="absolute inset-3 rounded-full bg-yellow-400 shadow-[0_0_20px_#ffcc00]"></div>
                <div className="absolute inset-0 w-full h-full flex items-center justify-center text-black text-4xl font-bold">
                  🎁
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-yellow-400 mb-5 text-center mt-4 filter drop-shadow-lg"
                style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}>
              Tebrikler!
            </h2>
            
            <div className="bg-gray-800/80 p-5 rounded-lg mb-6 shadow-inner">
              <p className="text-white mb-2">Kazandığınız ödül:</p>
              <p className="text-2xl font-bold text-yellow-300 mb-5"
                 style={{ textShadow: '0 0 5px rgba(251, 191, 36, 0.5)' }}>
                {reward.item.title}
              </p>
              
              <p className="text-white mb-2">Ödül Kodunuz:</p>
              <div className="bg-yellow-100 text-yellow-800 text-2xl font-mono font-bold p-4 rounded-lg text-center mb-4 shadow-md animate-pulse">
                {reward.code}
              </div>
              
              <div className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                <p className="mb-1">
                  Bu kodu mağazada göstererek ödülünüzü alabilirsiniz.
                </p>
                <p>
                  <span className="font-medium text-yellow-200">Son kullanma:</span>{' '}
                  <span className="font-bold">
                    {new Date(reward.expiresAt).toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={closeRewardModal}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(251,191,36,0.5)]"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Özel CSS Animasyonları */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); }
          to { transform: scale(1); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 
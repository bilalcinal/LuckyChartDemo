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
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [latestPrizeShown, setLatestPrizeShown] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(0);
  const [allRewards, setAllRewards] = useState<RewardDetails[]>([]);
  const [latestReward, setLatestReward] = useState<RewardDetails | null>(null);
  
  // Animasyon için slotRef ve animationRef
  const slotRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Mobil/masaüstü tespiti
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/qr');
    }
  }, [status, router]);
  
  // Ödül öğelerini ve mevcut ödülleri getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemsResponse = await fetch('/api/admin/wheel-items');
        if (!itemsResponse.ok) {
          throw new Error('Ödül öğeleri getirilemedi');
        }
        const itemsData = await itemsResponse.json();
        const activeItems = itemsData.filter((item: WheelItem & { isActive: boolean }) => item.isActive);
        if (!activeItems.length) {
          setError('Aktif ödül öğesi bulunamadı');
          return;
        }
        setRewardItems(activeItems);
        
        // Kullanıcı bilgilerini getir (spinsRemaining için)
        const userInfoResponse = await fetch('/api/users/me');
        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          setSpinsRemaining(userData.spinsRemaining || 0);
        }
        
        const rewardsResponse = await fetch('/api/wheel/rewards');
        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json();
          if (rewardsData.rewards && rewardsData.rewards.length > 0) {
            // Tüm ödülleri al
            setAllRewards(rewardsData.rewards);
            
            // En son alınan ödülü al
            if (rewardsData.latestReward) {
              setLatestReward(rewardsData.latestReward);
              setExistingReward(rewardsData.latestReward);
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
    
    // Çevirme hakkı kontrolü
    if (spinsRemaining <= 0) {
      setError('Bugün için çevirme hakkınız kalmadı. Yarın tekrar deneyiniz.');
      // Son kazanılan ödülü göster (varsa)
      if (latestReward) {
        setReward(latestReward);
        setShowReward(true);
      }
      return;
    }
    
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
      const winIndex = rewardItems.findIndex(item => item.id === data.reward.item.id);
      if (winIndex === -1) {
        throw new Error('Kazanılan ödül listede bulunamadı');
      }
      setReward(data.reward);
      // Çevirme hakkını güncelle
      setSpinsRemaining(prevSpins => Math.max(0, prevSpins - 1));
      
      // Yeni ödülü tüm ödüller listesine ekle ve en son ödül olarak ayarla
      setAllRewards(prev => [data.reward, ...prev]);
      setLatestReward(data.reward);
      setExistingReward(data.reward);
      
      startSlotAnimation(winIndex);
      
    } catch (error: any) {
      console.error('Çevirme hatası:', error);
      if (error.message.includes('Bugün için çevirme hakkınız')) {
        setError('Bugünlük hakkınız bitti, lütfen yarın tekrar deneyiniz.');
        setLatestPrizeShown(true);
        if (latestReward) {
          setReward(latestReward);
          setShowReward(true);
        }
      } else {
        setError(error.message || 'Çevirme sırasında bir hata oluştu');
      }
      setSpinning(false);
    }
  };
  
  const startSlotAnimation = (winIndex: number) => {
    const duration = 8000; // 8 saniye
    const startTime = performance.now();
    const totalFrames = rewardItems.length * 15; 
    const frameHeight = 100; // px cinsinden her hediyenin yüksekliği
    const randomOffset = Math.floor(Math.random() * rewardItems.length) * frameHeight;
    const finalPosition = winIndex * frameHeight;
    
    // Başlangıçta slot'u ayarla
    if (slotRef.current) {
      slotRef.current.style.transform = `translateY(${-randomOffset}px)`;
    }
    
    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      let easeProgress: number;
      if (progress < 0.15) {
        easeProgress = progress * (progress / 0.15) * 0.1;
      } else if (progress < 0.7) {
        easeProgress = 0.1 + ((progress - 0.15) / 0.55) * 0.6;
      } else {
        const slowProgress = (progress - 0.7) / 0.3;
        easeProgress = 0.7 + 0.3 * (1 - Math.pow(1 - slowProgress, 2.5));
      }
      
      if (progress < 1) {
        const totalDistance = totalFrames * frameHeight;
        const currentDistance = totalDistance * easeProgress;
        let newPosition = -randomOffset - currentDistance;
        
        // Son aşamada düzeltme yaparak kazanan hediyeye yaklaş
        if (progress > 0.8) {
          const correctionFactor = (progress - 0.8) / 0.2;
          const targetPosition = -finalPosition;
          const actualPosition = newPosition % (rewardItems.length * frameHeight);
          const correction = (targetPosition - actualPosition) * correctionFactor;
          newPosition = newPosition + correction;
          if (progress > 0.95) {
            newPosition = -finalPosition;
          }
        }
        
        // Döngüsel animasyon: Yeni pozisyonu toplam döngü yüksekliğine göre ayarla
        const totalCycle = rewardItems.length * frameHeight;
        let effectivePosition;
        if (progress < 0.95) {
          // newPosition negatif olduğundan, mod alırken pozitif değer elde etmek için:
          effectivePosition = -(( -newPosition ) % totalCycle);
        } else {
          effectivePosition = newPosition;
        }
        
        if (slotRef.current) {
          slotRef.current.style.transform = `translateY(${effectivePosition}px)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (slotRef.current) {
          slotRef.current.style.transform = `translateY(${-finalPosition}px)`;
        }
        setWinnerIndex(winIndex);
        handleSpinStop();
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
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
  
  if (status === 'unauthenticated') {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black py-10">
      <div className="text-center mb-8 w-full max-w-3xl px-4">
        <h1 className="text-5xl font-bold text-yellow-400 mb-2 filter drop-shadow-lg">MackPot</h1>
        <p className="text-gray-300 text-lg">
          Hoş geldin, <span className="font-semibold text-yellow-200">{session?.user?.phone}</span>!
          Kolu çekerek şansını dene.
        </p>
        <p className="text-white text-lg mt-2">
          Kalan hakkınız: <span className="font-bold text-yellow-400">{spinsRemaining}</span>
        </p>
        
        {error && (
          <div className="mt-6 bg-red-900/80 text-white p-4 rounded-lg border-2 border-red-600 shadow-lg">
            <p className="font-bold">{error}</p>
            {existingReward && (
              <div className="mt-3 p-3 bg-gray-800/60 rounded-lg">
                <p className="text-sm mb-1">Mevcut kodunuz:</p> 
                <div className="bg-yellow-900/30 p-2 rounded-lg mb-2">
                  <span className="font-mono text-xl text-yellow-400 font-bold tracking-wider">{existingReward.code}</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">Kazandığınız: <span className="font-medium text-yellow-200">{existingReward.item.title}</span></p>
                <div className="bg-gray-800/80 p-1 rounded-lg inline-block">
                  <span className="text-sm text-yellow-300 font-medium">
                    {"Bugün 23:59'a kadar geçerlidir"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Jackpot Makinesi */}
      <div className="relative w-full max-w-4xl mx-auto mb-12">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-center`}>
          <div 
            className="relative rounded-2xl shadow-[0_0_50px_rgba(255,204,0,0.3)] p-8 pt-10" 
            style={{ 
              width: isMobile ? '300px' : '450px',
              background: 'linear-gradient(145deg, #2a2a3a, #1a1a2a)',
              boxShadow: 'inset 0 0 25px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.7)'
            }}
          >
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
            
            <div 
              className="bg-black rounded-xl overflow-hidden mb-6" 
              style={{ 
                height: isMobile ? '160px' : '200px', 
                width: '100%',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,204,0,0.2)',
                border: '6px solid #333'
              }}
            >
              <div className="relative h-full w-full overflow-hidden">
                <div 
                  className="absolute inset-0 pointer-events-none z-20" 
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 100%)'
                  }}
                />
                
                {spinning && (
                  <div className="absolute inset-0 pointer-events-none z-10 opacity-60">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-full h-px bg-white/30"
                        style={{ 
                          top: `${i * 8}%`,
                          animationName: 'slotSpeed',
                          animationDuration: '0.15s',
                          animationTimingFunction: 'linear',
                          animationIterationCount: 'infinite'
                        }}
                      />
                    ))}
                  </div>
                )}
                
                <div className="absolute top-1/2 left-0 w-full z-10 transform -translate-y-1/2 flex items-center justify-center">
                  <div className="w-full h-1 bg-yellow-500 opacity-70"></div>
                  <div className="absolute w-6 h-6 rounded-full bg-yellow-500 -left-3 shadow-[0_0_10px_#ffcc00]"></div>
                  <div className="absolute w-6 h-6 rounded-full bg-yellow-500 -right-3 shadow-[0_0_10px_#ffcc00]"></div>
                </div>
                
                {winnerIndex >= 0 && (
                  <div 
                    className="absolute left-0 w-full z-5 transition-opacity duration-500"
                    style={{ 
                      top: '50%',
                      height: '100px',
                      transform: 'translateY(-50%)',
                      background: 'linear-gradient(to bottom, rgba(255,215,0,0) 0%, rgba(255,215,0,0.2) 50%, rgba(255,215,0,0) 100%)',
                      boxShadow: 'inset 0 0 30px rgba(255,215,0,0.3)',
                      opacity: 1,
                      animation: 'pulse 2s infinite'
                    }}
                  />
                )}
                
                {/* Slot elemanları */}
                <div 
                  ref={slotRef}
                  className="absolute w-full will-change-transform"
                  style={{ 
                    transform: 'translateY(0px)',
                    top: '0'
                  }}
                >
                  {[...rewardItems, ...rewardItems, ...rewardItems, ...rewardItems, ...rewardItems].map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-center text-center p-3 ${
                        winnerIndex >= 0 && index % rewardItems.length === winnerIndex 
                          ? 'relative z-10 transition-all duration-500' 
                          : ''
                      }`}
                      style={{ 
                        height: '100px',
                        background: item.color,
                        borderTop: '2px solid rgba(255,255,255,0.3)',
                        borderBottom: '2px solid rgba(0,0,0,0.4)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                        transform: winnerIndex >= 0 && index % rewardItems.length === winnerIndex 
                          ? 'scale(1.05)' 
                          : 'scale(1)',
                        backgroundImage: winnerIndex >= 0 && index % rewardItems.length === winnerIndex 
                          ? 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0) 70%)' 
                          : 'none',
                      }}
                    >
                      <div className="text-white font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                        style={{ 
                          lineHeight: '1.2',
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                          letterSpacing: '0.5px',
                          maxWidth: '95%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="relative flex justify-between items-center">
              <div 
                className="text-yellow-400 font-bold text-2xl" 
                style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.7)' }}
              >
              </div>
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
            
            <div className="mt-6 rounded-lg p-2 mx-auto w-24 bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600">
              <div className="h-2 w-full bg-black rounded-lg"></div>
            </div>
          </div>
          
          {/* Çekme kolu yerine yuvarlak buton */}
          <div className={`relative ${isMobile ? 'mt-8' : 'ml-8'}`}>
            <button
              onClick={handleSpinClick}
              disabled={spinning}
              className={`relative flex flex-col items-center justify-center transform transition-all duration-300 ${
                spinning ? 'cursor-not-allowed scale-95' : 'hover:scale-105'
              }`}
            >
              {/* Ana buton */}
              <div 
                className={`w-28 h-28 rounded-full shadow-lg flex items-center justify-center border-8 transition-all duration-500 ${
                  spinning ? 'bg-gradient-to-br from-green-500 to-green-700 border-green-800' : 'bg-gradient-to-br from-red-500 to-red-700 border-gray-800 hover:from-red-600 hover:to-red-800'
                }`}
                style={{ 
                  boxShadow: spinning 
                    ? '0 0 30px rgba(22, 163, 74, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.3)' 
                    : '0 0 30px rgba(220, 38, 38, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)'
                }}
              >
                {/* İç içe daireler efekti */}
                <div 
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                    spinning ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all duration-500 ${
                      spinning ? 'bg-green-700' : 'bg-red-700'
                    }`}
                    style={{
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {spinning ? (
                      // Dönerken animasyonlu nokta
                      <div className="flex space-x-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                      </div>
                    ) : (
                      // Durum metni
                      "ÇEVİR"
                    )}
                  </div>
                </div>
              </div>
              
              {/* Buton altındaki parlama efekti */}
              <div 
                className={`absolute -bottom-5 w-20 h-3 transition-all duration-300 rounded-full blur-md ${
                  spinning ? 'bg-green-500 opacity-70' : 'bg-red-500 opacity-50'
                }`}
              ></div>
              
              {/* Durum metni */}
              <div 
                className={`mt-7 font-bold text-center text-xl filter drop-shadow-lg transition-all duration-300 ${
                  spinning ? 'text-green-400' : 'text-red-400'
                }`}
                style={{ 
                  textShadow: spinning 
                    ? '0 0 10px rgba(22, 163, 74, 0.5)' 
                    : '0 0 10px rgba(220, 38, 38, 0.5)',
                }}
              >
                {spinning ? "DÖNÜYOR" : "BAŞLAT"}
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
      
      {/* Ödül popup'ı - Çark durduğunda gösterilir */}
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
              <h3 className="text-white text-lg font-semibold mb-2">Son Kazandığınız Ödül:</h3>
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
                    {"Bugün 23:59'a kadar geçerlidir."}
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
      
      {/* Kullanıcının döndürme hakkı kalmadığında gösterilecek mesaj */}
      {session && session.user && (session.user.spinsRemaining <= 0 || latestPrizeShown) && (
        <div className="bg-black/80 backdrop-blur-md border border-yellow-600/20 rounded-xl p-6 text-center mx-auto max-w-md">
          <div className="text-yellow-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl text-white font-bold mb-2">Bugünlük hakkınız bitti</h3>
          <p className="text-gray-300 mb-4">Lütfen yarın tekrar deneyiniz.</p>
          
          {existingReward && (
            <div className="mt-4 border-t border-yellow-600/20 pt-4">
              <p className="text-sm text-gray-400 mb-1">Mevcut kodunuz:</p>
              <div className="bg-yellow-900/30 p-3 rounded-lg mb-3">
                <span className="font-mono text-xl text-yellow-400 font-bold tracking-wider">{existingReward.code}</span>
              </div>
              <p className="text-base text-yellow-200 font-medium mb-3">Kazandığınız: <span className="font-semibold">{existingReward.item.title}</span></p>
              <div className="bg-gray-800/60 p-2 rounded-lg inline-block">
                <p className="text-sm text-yellow-300 font-medium">{"Bugün 23:59'a kadar geçerlidir"}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
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
        
        @keyframes pulse {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
        
        @keyframes slotSpeed {
          from { transform: translateY(0); }
          to { transform: translateY(8px); }
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

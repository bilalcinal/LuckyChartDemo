'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Wheel } from 'react-custom-roulette';

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

export default function WheelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wheelItems, setWheelItems] = useState<WheelItem[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [reward, setReward] = useState<RewardDetails | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [error, setError] = useState('');
  const [existingReward, setExistingReward] = useState<RewardDetails | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Çark öğelerini ve kullanıcının mevcut ödüllerini getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Çark öğelerini getir
        const itemsResponse = await fetch('/api/admin/wheel-items');
        if (!itemsResponse.ok) {
          throw new Error('Çark öğeleri getirilemedi');
        }
        
        const itemsData = await itemsResponse.json();
        // Sadece aktif öğeleri al
        const activeItems = itemsData.filter((item: WheelItem & { isActive: boolean }) => item.isActive);
        
        if (!activeItems.length) {
          setError('Aktif çark öğesi bulunamadı');
          return;
        }
        
        setWheelItems(activeItems);
        
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
  
  // Font boyutunu dinamik olarak hesapla
  const calculateFontSize = (itemCount: number): number => {
    // Pasta dilimi sayısına ve ekran boyutuna göre font boyutlarını belirle
    if (itemCount > 15) {
      return isMobile ? 8 : 9;
    } else if (itemCount > 12) {
      return isMobile ? 9 : 10;
    } else if (itemCount > 10) {
      return isMobile ? 10 : 11;
    } else if (itemCount > 8) {
      return isMobile ? 11 : 12;
    } else if (itemCount > 6) {
      return isMobile ? 12 : 13;
    } else {
      return isMobile ? 13 : 14;
    }
  };
  
  const handleSpinClick = async () => {
    if (spinning || !wheelItems.length) return;
    
    setError('');
    setSpinning(true);
    
    try {
      const response = await fetch('/api/wheel/spin', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Çark çevirme hatası');
      }
      
      const data = await response.json();
      
      // Kazanılan ödülü bul
      const winIndex = wheelItems.findIndex(item => item.id === data.reward.item.id);
      
      if (winIndex === -1) {
        throw new Error('Kazanılan ödül çarkta bulunamadı');
      }
      
      setPrizeNumber(winIndex);
      setReward(data.reward);
      setMustSpin(true);
      
    } catch (error: any) {
      console.error('Çark çevirme hatası:', error);
      
      // Kullanıcının günlük hakkı bitti mesajını kontrol et
      if (error.message.includes('Bugün için çevirme hakkınız')) {
        setError('Bugünlük hakkınız bitti, lütfen yarın tekrar deneyiniz.');
        
        // Mevcut ödülü göster (varsa)
        if (existingReward) {
          setReward(existingReward);
          setShowReward(true);
        }
      } else {
        setError(error.message || 'Çark çevirme sırasında bir hata oluştu');
      }
      
      setSpinning(false);
    }
  };
  
  const handleSpinStop = () => {
    setMustSpin(false);
    setSpinning(false);
    setShowReward(true);
  };
  
  const closeRewardModal = () => {
    setShowReward(false);
  };
  
  // Oturum yükleniyor veya çark öğeleri henüz yüklenmediyse
  if (status === 'loading' || !wheelItems.length) {
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
  
  // Dinamik olarak hesaplanan font boyutu
  const dynamicFontSize = calculateFontSize(wheelItems.length);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black py-10">
      <div className="text-center mb-4 w-full max-w-3xl px-4">
        <h1 className="text-4xl font-bold text-yellow-400">Şanslı Çark</h1>
        <p className="text-gray-300 mt-2">
          Hoş geldin, {session?.user?.phone}!
          Çarkı çevirerek şansını dene.
        </p>
        {error && (
          <div className="mt-4 bg-red-900 text-white p-3 rounded-lg border border-red-700">
            {error}
            {existingReward && (
              <div className="mt-2 text-sm">
                Mevcut kodunuz: <span className="font-bold text-yellow-300">{existingReward.code}</span>
                <br />
                <span className="text-xs text-gray-300">
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
      
      <div className="w-full max-w-3xl px-4 mx-auto mb-6">
        <div className="relative" style={{ 
          width: '100%', 
          paddingBottom: '100%', /* 1:1 aspect ratio */
        }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelItems.map(item => {
                const words = item.title.split(' ');
                // Çok uzun kelimeleri birden fazla satıra böl
                const formattedTitle = words.length > 1 
                  ? words.join('\n') 
                  : item.title.length > 8 
                    ? item.title.match(/.{1,8}/g)?.join('\n') || item.title 
                    : item.title;
                
                return {
                  option: formattedTitle,
                  style: { 
                    backgroundColor: item.color, 
                    textColor: '#ffffff',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px #000000'
                  }
                };
              })}
              onStopSpinning={handleSpinStop}
              spinDuration={0.5}
              backgroundColors={['#3f2a70', '#422372', '#4a1a74', '#531777', '#5c1379']}
              textColors={['#ffffff']}
              outerBorderColor="#fcd34d"
              outerBorderWidth={15}
              innerBorderColor="#30261a"
              innerBorderWidth={8}
              innerRadius={18}
              radiusLineColor="#fcd34d"
              radiusLineWidth={2}
              fontSize={dynamicFontSize}
              perpendicularText={false}
              textDistance={55}
              pointerProps={{
                src: '/triangle-pointer.svg',
                style: {
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-90deg)',
                  width: '55px',
                  height: '55px',
                  zIndex: 5,
                }
              }}
            />
            <button
              onClick={handleSpinClick}
              disabled={spinning || mustSpin}
              className={`absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-yellow-500 text-black font-bold
                flex items-center justify-center transform hover:scale-110 transition-transform 
                text-lg sm:text-xl focus:outline-none shadow-lg border-4 border-yellow-600
                ${spinning || mustSpin ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ÇEVİR
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center w-full max-w-3xl px-4">
        <p className="text-sm text-gray-400">
          Her gün yeni çevirme hakkı kazanırsınız.
        </p>
      </div>
      
      {/* Ödül Modalı */}
      {showReward && reward && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto border-2 border-yellow-500 shadow-2xl">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Tebrikler!</h2>
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <p className="text-white mb-2">Kazandığınız ödül:</p>
              <p className="text-2xl font-bold text-yellow-300 mb-4">{reward.item.title}</p>
              <p className="text-white mb-2">Ödül Kodunuz:</p>
              <div className="bg-yellow-100 text-yellow-800 text-2xl font-mono font-bold p-3 rounded-lg text-center mb-4">
                {reward.code}
              </div>
              <p className="text-sm text-gray-400">
                Bu kodu mağazada göstererek ödülünüzü alabilirsiniz. Kod şu tarihe kadar geçerlidir:
              </p>
              <p className="text-sm font-bold text-gray-300">
                {new Date(reward.expiresAt).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={closeRewardModal}
                className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
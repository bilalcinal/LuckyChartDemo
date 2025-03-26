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
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black py-10">
      <div className="text-center mb-8">
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
      
      <div className="relative mb-8" style={{ width: '350px', height: '350px' }}>
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={wheelItems.map(item => ({
            option: item.title,
            style: { backgroundColor: item.color, textColor: '#ffffff' }
          }))}
          onStopSpinning={handleSpinStop}
          spinDuration={0.5}
          backgroundColors={['#3f2a70', '#422372', '#4a1a74', '#531777', '#5c1379']}
          textColors={['#ffffff']}
          outerBorderColor="#fcd34d"
          outerBorderWidth={10}
          innerBorderColor="#30261a"
          innerBorderWidth={5}
          innerRadius={20}
          radiusLineColor="#fcd34d"
          radiusLineWidth={2}
          fontSize={20}
          perpendicularText={true}
          textDistance={70}
        />
        <button
          onClick={handleSpinClick}
          disabled={spinning || mustSpin}
          className={`absolute inset-0 m-auto w-20 h-20 rounded-full bg-yellow-500 text-black font-bold
            flex items-center justify-center transform hover:scale-110 transition-transform 
            focus:outline-none ${spinning || mustSpin ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ÇEVİR
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-400">
          Her gün yeni çevirme hakkı kazanırsınız.
        </p>
      </div>
      
      {/* Ödül Modalı */}
      {showReward && reward && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 border border-yellow-500 text-white">
            <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">Tebrikler!</h2>
            <div className="text-center mb-6">
              <div 
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl"
                style={{ backgroundColor: reward.item.color }}
              >
                🎁
              </div>
              <h3 className="text-xl font-bold text-white">{reward.item.title}</h3>
              {reward.item.description && (
                <p className="text-gray-300 mt-2">{reward.item.description}</p>
              )}
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg text-center mb-6 border border-gray-700">
              <p className="text-sm text-gray-300 mb-2">Promosyon Kodunuz:</p>
              <p className="text-3xl font-mono font-bold tracking-wider text-yellow-400">{reward.code}</p>
              <p className="text-xs text-gray-400 mt-2">
                Bu kod 
                {new Date(reward.expiresAt).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} 
                tarihine kadar geçerlidir.
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={closeRewardModal}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
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
  
  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/qr');
    }
  }, [status, router]);
  
  // Çark öğelerini getir
  useEffect(() => {
    const fetchWheelItems = async () => {
      try {
        const response = await fetch('/api/admin/wheel-items');
        if (!response.ok) {
          throw new Error('Çark öğeleri getirilemedi');
        }
        
        const data = await response.json();
        // Sadece aktif öğeleri al
        const activeItems = data.filter((item: WheelItem & { isActive: boolean }) => item.isActive);
        
        if (!activeItems.length) {
          setError('Aktif çark öğesi bulunamadı');
          return;
        }
        
        setWheelItems(activeItems);
      } catch (error) {
        console.error('Çark öğeleri getirme hatası:', error);
        setError('Çark öğeleri yüklenirken bir hata oluştu');
      }
    };
    
    fetchWheelItems();
  }, []);
  
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
      setError(error.message || 'Çark çevirme sırasında bir hata oluştu');
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
    setReward(null);
  };
  
  // Oturum yükleniyor veya çark öğeleri henüz yüklenmediyse
  if (status === 'loading' || !wheelItems.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yükleniyor...</h1>
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Şanslı Çark</h1>
        <p className="text-gray-600 mt-2">
          Hoş geldin, {session?.user?.phone}!
          Çarkı çevirerek şansını dene.
        </p>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
      
      <div className="relative mb-8">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={wheelItems.map(item => ({
            option: item.title,
            style: { backgroundColor: item.color, textColor: '#ffffff' }
          }))}
          onStopSpinning={handleSpinStop}
          spinDuration={0.5}
          backgroundColors={['#ff8f43', '#70bbe0', '#0b3351', '#f9dd50']}
          textColors={['#ffffff']}
          outerBorderColor="#eeeeee"
          outerBorderWidth={10}
          innerBorderColor="#30261a"
          innerBorderWidth={0}
          innerRadius={0}
          radiusLineColor="#eeeeee"
          radiusLineWidth={1}
          fontSize={17}
          perpendicularText={true}
          textDistance={60}
        />
        <button
          onClick={handleSpinClick}
          disabled={spinning || mustSpin}
          className={`absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600 text-white font-bold
            flex items-center justify-center transform hover:scale-110 transition-transform 
            focus:outline-none ${spinning || mustSpin ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ÇEVİR
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Her gün yeni çevirme hakkı kazanırsınız.
        </p>
      </div>
      
      {/* Ödül Modalı */}
      {showReward && reward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-center mb-4">Tebrikler!</h2>
            <div className="text-center mb-6">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl"
                style={{ backgroundColor: reward.item.color }}
              >
                🎁
              </div>
              <h3 className="text-xl font-bold">{reward.item.title}</h3>
              {reward.item.description && (
                <p className="text-gray-600 mt-2">{reward.item.description}</p>
              )}
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">Promosyon Kodunuz:</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{reward.code}</p>
              <p className="text-xs text-gray-500 mt-2">
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
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
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
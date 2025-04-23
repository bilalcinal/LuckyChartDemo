'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Reward = {
  id: string;
  code: string;
  itemTitle: string;
  userPhone: string;
  createdAt: string;
  isUsed: boolean;
};

export default function AdminRewards() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Session kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Sadece ADMIN rolüne sahip kullanıcılar erişebilir
      if (session.user.role !== 'ADMIN') {
        router.push('/admin/login');
        return;
      }
    }
  }, [status, session, router]);
  
  // Ödülleri getir
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/admin/rewards');
        
        if (!response.ok) {
          throw new Error('Ödüller getirilemedi');
        }
        
        const data = await response.json();
        setRewards(data);
      } catch (error) {
        console.error('Ödülleri getirme hatası:', error);
        setError('Ödüller yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchRewards();
    }
  }, [status, session]);
  
  // Ödülü kullanıldı olarak işaretle
  const markRewardAsUsed = async (rewardId: string, isUsed: boolean) => {
    try {
      const response = await fetch(`/api/admin/rewards/${rewardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isUsed }),
      });
      
      if (!response.ok) {
        throw new Error('Ödül güncellenemedi');
      }
      
      // UI'da güncellenemiyorsa, bu kodu kullanın
      setRewards(prev => 
        prev.map(reward => 
          reward.id === rewardId 
            ? { ...reward, isUsed } 
            : reward
        )
      );
    } catch (error) {
      console.error('Ödül işaretleme hatası:', error);
      setError('Ödül güncellenirken bir hata oluştu');
    }
  };
  
  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Yükleniyor
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Yükleniyor...</h1>
        </div>
      </div>
    );
  }
  
  // Kullanıcı kimliği doğrulanmadıysa
  if (status === 'unauthenticated') {
    return null; // useEffect içerisinde yönlendirme yapılacak
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Ödüller</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin" 
              className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
            >
              Ana Sayfa
            </Link>
            <Link 
              href="/admin/dashboard"
              className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
            >
              Gösterge Paneli
            </Link>
            <button
              onClick={() => router.push('/api/auth/signout?callbackUrl=/admin/login')}
              className="bg-red-800 hover:bg-red-700 text-white py-2 px-4 rounded-md"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 text-white px-4 py-3 rounded-lg" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="bg-gray-900 shadow border border-gray-800 overflow-hidden rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Ödül Listesi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Kod
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ödül
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {rewards.length > 0 ? (
                  rewards.map((reward) => (
                    <tr key={reward.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-yellow-400">{reward.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{reward.itemTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{reward.userPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{formatDate(reward.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reward.isUsed 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {reward.isUsed ? 'Kullanıldı' : 'Kullanılmadı'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!reward.isUsed ? (
                          <button
                            onClick={() => markRewardAsUsed(reward.id, true)}
                            className="text-green-500 hover:text-green-400"
                          >
                            Kullanıldı İşaretle
                          </button>
                        ) : (
                          <button
                            onClick={() => markRewardAsUsed(reward.id, false)}
                            className="text-yellow-500 hover:text-yellow-400"
                          >
                            Kullanılmadı İşaretle
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">
                      Henüz ödül bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
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
  userEmail: string;
  createdAt: string;
  isUsed: boolean;
};

export default function AdminRewards() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingRewardId, setUpdatingRewardId] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  
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
        setFilteredRewards(data); // Tüm ödülleri filtrelenmiş duruma da kaydet
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
  
  // Ödül kodu ile anlık arama yap
  const handleSearch = (searchValue: string) => {
    setSearchCode(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredRewards(rewards); // Arama kutusu boş ise tüm ödülleri göster
      return;
    }
    
    // Arama yaparken büyük/küçük harf duyarlılığını kaldır
    const searchTerm = searchValue.trim().toUpperCase();
    const filtered = rewards.filter(reward => 
      reward.code.toUpperCase().includes(searchTerm) ||
      reward.itemTitle.toUpperCase().includes(searchTerm) ||
      reward.userPhone.toUpperCase().includes(searchTerm) ||
      (reward.userEmail && reward.userEmail.toUpperCase().includes(searchTerm))
    );
    
    setFilteredRewards(filtered);
  };

  // Arama sıfırla
  const resetSearch = () => {
    setSearchCode('');
    setFilteredRewards(rewards);
  };
  
  // Ödülü kullanıldı olarak işaretle
  const markRewardAsUsed = async (rewardId: string, isUsed: boolean) => {
    try {
      setUpdatingRewardId(rewardId);
      
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
      
      // Başarılı bir şekilde güncellendiğinde yeni bir sunucu isteği yapmak yerine
      // yerel state'i güncelleyelim
      
      // Ana ödül listesini güncelle
      const updatedRewards = rewards.map(reward => 
        reward.id === rewardId 
          ? { ...reward, isUsed } 
          : reward
      );
      setRewards(updatedRewards);
      
      // Filtrelenmiş ödül listesini de güncelle
      const updatedFilteredRewards = filteredRewards.map(reward => 
        reward.id === rewardId 
          ? { ...reward, isUsed } 
          : reward
      );
      setFilteredRewards(updatedFilteredRewards);
      
    } catch (error) {
      console.error('Ödül işaretleme hatası:', error);
      setError('Ödül güncellenirken bir hata oluştu');
    } finally {
      // İşlem tamamlandıktan sonra loading durumunu kaldır
      setUpdatingRewardId(null);
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
        
        {/* Arama/Filtreleme Bölümü */}
        <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-800">
          <h2 className="text-lg font-bold text-yellow-400 mb-3">Ödül Ara</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Kod, ödül adı, telefon veya e-posta ile ara..."
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            {searchCode && (
              <button
                onClick={resetSearch}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
              >
                Temizle
              </button>
            )}
          </div>
          {filteredRewards.length === 0 && searchCode && (
            <div className="mt-4 text-yellow-500">
              &quot;{searchCode}&quot; aramasına uygun sonuç bulunamadı.
            </div>
          )}
          {searchCode && filteredRewards.length > 0 && (
            <div className="mt-2 text-gray-400 text-sm">
              {filteredRewards.length} sonuç bulundu
            </div>
          )}
        </div>
        
        <div className="bg-gray-900 shadow border border-gray-800 overflow-hidden rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Ödül Listesi {searchCode && <span className="text-sm font-normal text-gray-400">({filteredRewards.length}/{rewards.length})</span>}</h2>
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
                    Telefon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    E-posta
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
                {filteredRewards.length > 0 ? (
                  filteredRewards.map((reward) => (
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
                        <div className="text-sm text-gray-300">{reward.userEmail}</div>
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
                        {updatingRewardId === reward.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-300">İşleniyor...</span>
                          </div>
                        ) : !reward.isUsed ? (
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
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-400">
                      {searchCode 
                        ? `"${searchCode}" araması için sonuç bulunamadı.` 
                        : "Henüz ödül bulunmuyor."}
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
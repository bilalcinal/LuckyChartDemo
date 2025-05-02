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

export default function EmployeeRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Kullanıcının oturum durumunu ve yetkilerini kontrol et
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/admin/login');
    }
  }, [status, session, router]);

  // Ödülleri yükle
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/admin/rewards');
        
        if (!response.ok) {
          throw new Error('Ödüller yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        setRewards(data);
        setFilteredRewards(data); // Başlangıçta tüm ödülleri göster
      } catch (error) {
        console.error('Ödüller yüklenirken hata:', error);
        setError('Ödüller yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchRewards();
    }
  }, [session, status]);

  // Ödül kodu ile arama yap
  const handleSearch = () => {
    if (!searchCode.trim()) {
      setFilteredRewards(rewards); // Arama kutusu boş ise tüm ödülleri göster
      return;
    }
    
    // Arama yaparken büyük/küçük harf duyarlılığını kaldır
    const searchTerm = searchCode.trim().toUpperCase();
    const filtered = rewards.filter(reward => 
      reward.code.toUpperCase().includes(searchTerm) ||
      reward.userPhone.toUpperCase().includes(searchTerm) ||
      (reward.userEmail && reward.userEmail.toUpperCase().includes(searchTerm))
    );
    
    setFilteredRewards(filtered);
  };

  // Enter tuşuna basıldığında arama yap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Arama sıfırla
  const resetSearch = () => {
    setSearchCode('');
    setFilteredRewards(rewards);
  };

  // Ödül durumunu güncelle
  const updateRewardStatus = async (id: string, isUsed: boolean) => {
    try {
      setStatusUpdating(id);
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isUsed }),
      });

      if (!response.ok) {
        throw new Error('Ödül durumu güncellenirken bir hata oluştu');
      }

      // Ana ödül listesini güncelle
      const updatedRewards = rewards.map((reward) =>
        reward.id === id ? { ...reward, isUsed } : reward
      );
      setRewards(updatedRewards);
      
      // Filtrelenmiş ödül listesini de güncelle
      const updatedFilteredRewards = filteredRewards.map((reward) =>
        reward.id === id ? { ...reward, isUsed } : reward
      );
      setFilteredRewards(updatedFilteredRewards);
      
    } catch (error) {
      console.error('Ödül durumu güncellenirken hata:', error);
      setError('Ödül durumu güncellenirken bir hata oluştu');
    } finally {
      setStatusUpdating(null);
    }
  };

  // Yükleniyor durum göstergesi
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yükleniyor...</h1>
        </div>
      </div>
    );
  }

  // Yetkisiz giriş
  if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yetkisiz Erişim</h1>
          <p>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
          <Link href="/admin/login" className="mt-4 text-yellow-400 hover:underline">
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Hata</h1>
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">Ödül Listesi</h1>
          <button
            onClick={() => router.push('/api/auth/signout?callbackUrl=/admin/login')}
            className="bg-red-800 hover:bg-red-700 text-white py-2 px-4 rounded-md"
          >
            Çıkış Yap
          </button>
        </div>

        {/* Ödül Kodu Arama Bölümü */}
        <div className="mb-6 bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">Ödül Kodu Arama</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ödül kodu, telefon veya e-posta ile arayın..."
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-6 rounded-md"
              >
                Ara
              </button>
              {searchCode && (
                <button
                  onClick={resetSearch}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>
          {filteredRewards.length === 0 && searchCode && (
            <div className="mt-4 text-yellow-500">
              &quot;{searchCode}&quot; koduna uygun ödül bulunamadı.
            </div>
          )}
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-10 bg-gray-900 rounded-lg">
            <p className="text-xl">Kayıtlı ödül bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-yellow-400">Kod</div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">Ödül</div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">Telefon</div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">E-posta</div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">Tarih</div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">Durum</div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-300">İşlem</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRewards.map((reward) => (
                  <tr key={reward.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-yellow-400">{reward.code}</div>
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
                      <div className="text-sm text-gray-300">{new Date(reward.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reward.isUsed
                            ? 'bg-green-900 text-green-200'
                            : 'bg-blue-900 text-blue-200'
                        }`}
                      >
                        {reward.isUsed ? 'Kullanıldı' : 'Kullanılmadı'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {statusUpdating === reward.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-white">İşleniyor...</span>
                        </div>
                      ) : !reward.isUsed ? (
                        <button
                          onClick={() => updateRewardStatus(reward.id, true)}
                          className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Kullanıldı İşaretle
                        </button>
                      ) : (
                        <button
                          onClick={() => updateRewardStatus(reward.id, false)}
                          className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Kullanılmadı İşaretle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 
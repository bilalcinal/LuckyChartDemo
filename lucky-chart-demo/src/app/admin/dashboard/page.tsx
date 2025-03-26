'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Gerçek veri türleri
type DashboardStats = {
  totalUsers: number;
  totalSpins: number;
  activeWheelItems: number;
  todayUsers: number;
  todaySpins: number;
  latestRewards: {
    id: string;
    code: string;
    itemTitle: string;
    userPhone: string;
    createdAt: string;
    isUsed: boolean;
  }[];
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSpins: 0,
    activeWheelItems: 0,
    todayUsers: 0,
    todaySpins: 0,
    latestRewards: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Sadece ADMIN rolüne sahip kullanıcılar erişebilir
      if (session?.user?.role !== 'ADMIN') {
        router.push('/admin/login');
        return;
      }
    }
  }, [status, session, router]);

  // Gerçek istatistikleri getir
  useEffect(() => {
    const fetchStats = async () => {
      if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/stats');
        
        if (!response.ok) {
          throw new Error('İstatistikler alınamadı');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [status, session]);

  // Tarih formatlama yardımcı fonksiyonu
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

  // Yükleniyor kontrolü
  if (status === 'loading' || isLoading) {
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
          <h1 className="text-3xl font-bold text-yellow-400">Gösterge Paneli</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin" 
              className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
            >
              Ana Sayfa
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
          <div className="bg-red-900 border border-red-700 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-gray-300 mb-2">Toplam Kullanıcı</h2>
            <p className="text-4xl font-bold text-yellow-400">{stats.totalUsers}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-gray-300 mb-2">Toplam Çevirme</h2>
            <p className="text-4xl font-bold text-yellow-400">{stats.totalSpins}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-gray-300 mb-2">Aktif Çark Öğeleri</h2>
            <p className="text-4xl font-bold text-yellow-400">{stats.activeWheelItems}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-medium text-gray-300 mb-2">Bugünkü Kullanıcılar</h2>
            <p className="text-4xl font-bold text-yellow-400">{stats.todayUsers}</p>
          </div>
        </div>
        
        {/* Son Ödüller */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Son Kazanılan Ödüller</h2>
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
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {stats.latestRewards.length > 0 ? (
                  stats.latestRewards.map((reward) => (
                    <tr key={reward.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-400">
                        {reward.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {reward.itemTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {reward.userPhone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(reward.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reward.isUsed 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {reward.isUsed ? 'Kullanıldı' : 'Bekliyor'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-400">
                      Henüz kazanılan ödül bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Hızlı Erişim Bağlantıları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/admin/wheel-items" 
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl mb-4">🎡</span>
              <h2 className="text-xl font-semibold text-yellow-400">Çark Öğeleri</h2>
            </div>
          </Link>
          
          <Link 
            href="/admin/rewards" 
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl mb-4">🎁</span>
              <h2 className="text-xl font-semibold text-yellow-400">Ödüller</h2>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 
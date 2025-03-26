'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSpins: 0,
    activeWheelItems: 0,
    todayUsers: 0,
  });

  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Basit istatistikleri getir (gerçek uygulamada API'dan gelecek)
  useEffect(() => {
    // Mock veriler (gerçek uygulamada API çağrısıyla değiştirilecek)
    setStats({
      totalUsers: 256,
      totalSpins: 487,
      activeWheelItems: 8,
      todayUsers: 34,
    });
  }, []);

  // Yükleniyor kontrolü
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yükleniyor...</h1>
        </div>
      </div>
    );
  }

  // Kullanıcı kimliği doğrulanmadıysa
  if (status === 'unauthenticated') {
    return null; // useEffect içerisinde yönlendirme yapılacak
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">LuckyChart Admin</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Gösterge Paneli</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* İstatistik Kartları */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Kullanıcı</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Toplam Çevirme</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalSpins}</dd>
                  </dl>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Aktif Çark Öğeleri</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeWheelItems}</dd>
                  </dl>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Bugünkü Kullanıcılar</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.todayUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Yönetim Bağlantıları */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                <li>
                  <Link href="/admin/wheel-items" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-md font-medium text-indigo-600 truncate">Çark Öğelerini Yönet</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Ekle, Düzenle, Sil
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-md font-medium text-indigo-600 truncate">Kullanıcıları Yönet</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Listele, Düzenle
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/sms-schedule" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-md font-medium text-indigo-600 truncate">SMS Zamanlamalarını Yönet</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Ekle, Düzenle, Sil
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/rewards" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-md font-medium text-indigo-600 truncate">Ödülleri Yönet</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Görüntüle, Doğrula
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
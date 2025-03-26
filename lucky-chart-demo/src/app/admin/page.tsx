'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Yükleme durumunda veya oturum yoksa login sayfasına yönlendir
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);
  
  // Yükleniyor durumu
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Yükleniyor...</h1>
        </div>
      </div>
    );
  }
  
  // Oturum yoksa, null döndür (useEffect yönlendirme yapar)
  if (status === 'unauthenticated') {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">Admin Paneli</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/dashboard" className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg border border-gray-800 transition-colors">
            <h2 className="text-xl font-bold mb-2">Dashboard</h2>
            <p className="text-gray-400">Genel istatistikleri ve özet bilgileri görüntüleyin.</p>
          </Link>
          
          <Link href="/admin/wheel-items" className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg border border-gray-800 transition-colors">
            <h2 className="text-xl font-bold mb-2">Çark Öğeleri</h2>
            <p className="text-gray-400">Çark üzerindeki ödülleri ve özellikleri yönetin.</p>
          </Link>
          
          <Link href="/admin/users" className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg border border-gray-800 transition-colors">
            <h2 className="text-xl font-bold mb-2">Kullanıcılar</h2>
            <p className="text-gray-400">Sisteme kayıtlı kullanıcıları ve bilgilerini yönetin.</p>
          </Link>
          
          <Link href="/admin/rewards" className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg border border-gray-800 transition-colors">
            <h2 className="text-xl font-bold mb-2">Ödüller</h2>
            <p className="text-gray-400">Kullanıcılara verilen ödülleri görüntüleyin ve yönetin.</p>
          </Link>
          
          <Link href="/admin/sms" className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg border border-gray-800 transition-colors">
            <h2 className="text-xl font-bold mb-2">SMS Ayarları</h2>
            <p className="text-gray-400">SMS gönderim zamanlamasını ve içeriklerini yönetin.</p>
          </Link>
          
          <Link href="/admin/settings" className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg border border-gray-800 transition-colors">
            <h2 className="text-xl font-bold mb-2">Genel Ayarlar</h2>
            <p className="text-gray-400">Uygulama ayarlarını yapılandırın.</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 
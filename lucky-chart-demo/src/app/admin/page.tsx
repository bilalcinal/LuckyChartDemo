'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Yükleniyor...</h1>
        </div>
      </div>
    );
  }

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Gösterge Paneli', icon: '📊' },
    { href: '/admin/wheel-items', label: 'Çark Öğeleri', icon: '🎡' },
    { href: '/admin/rewards', label: 'Ödüller', icon: '🎁' },
    { href: '/admin/sms', label: 'SMS Zamanlamaları', icon: '📱' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="container mx-auto">
        <div className="flex justify-end mb-8">
          <button
            onClick={() => router.push('/api/auth/signout')}
            className="bg-red-800 hover:bg-red-700 text-white py-2 px-4 rounded-md"
          >
            Çıkış Yap
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">Admin Panel</h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl mb-4">{link.icon}</span>
                <h2 className="text-xl font-semibold text-yellow-400">{link.label}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Oturum durumuna göre yönlendirme
    if (status === 'authenticated') {
      router.push('/wheel');
    } else if (status === 'unauthenticated') {
      router.push('/qr');
    }
    // status === 'loading' durumunda bir şey yapma, yükleniyor durumunu bekle
  }, [status, router]);

  // Yükleniyor ekranı
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">LuckyChart</h1>
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from "next/image";
import Link from 'next/link';

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
        <div className="backdrop-blur-sm bg-black/50 p-8 rounded-xl shadow-xl border border-gray-800">
          <h1 className="text-3xl font-bold mb-4">MackPot</h1>
          <p className="mb-6">Akyazı Macbear'ın özel promosyon uygulamasına hoş geldiniz!</p>
          <Link 
            href="/qr" 
            className="block bg-yellow-500 hover:bg-yellow-600 transition-colors text-black py-3 px-6 rounded-lg font-semibold text-center"
          >
            QR Kodu Okut
          </Link>
        </div>
      </div>
    </div>
  );
}

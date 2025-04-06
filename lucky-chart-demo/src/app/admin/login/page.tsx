'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { status, data: session } = useSession();
  
  // Kullanıcı zaten giriş yapmışsa, rolüne göre yönlendir
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else if (session?.user?.role === 'EMPLOYEE') {
        router.push('/admin/employee/rewards');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Admin kimlik doğrulaması için admin-credentials sağlayıcısını kullan
      const result = await signIn('admin-credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Geçersiz kullanıcı adı veya şifre');
        setIsLoading(false);
        return;
      }

      // Başarılı giriş, kullanıcı rolüne göre yönlendir
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else if (session?.user?.role === 'EMPLOYEE') {
        router.push('/admin/employee/rewards');
      } else {
        // Oturum henüz güncellenmediyse sayfayı yenile
        window.location.reload();
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Yükleniyor
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Yükleniyor...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-800">
        <h1 className="text-2xl font-bold text-center mb-6 text-yellow-400">Yönetici Girişi</h1>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              Şifre
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
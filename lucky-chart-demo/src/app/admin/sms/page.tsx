'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SmsSchedule = {
  id: string;
  message: string;
  scheduleTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminSmsSchedules() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [smsSchedules, setSmsSchedules] = useState<SmsSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Yeni SMS zamanlaması için form durumu
  const [formData, setFormData] = useState({
    message: '',
    scheduleTime: '',
    isActive: true,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Oturum kontrolü
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
  
  // SMS zamanlamalarını getir
  useEffect(() => {
    const fetchSmsSchedules = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/sms-schedules');
        
        if (!response.ok) {
          throw new Error('SMS zamanlamaları getirilemedi');
        }
        
        const data = await response.json();
        setSmsSchedules(data);
      } catch (error) {
        console.error('SMS zamanlamaları getirme hatası:', error);
        setError('SMS zamanlamaları yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSmsSchedules();
    }
  }, [status, session]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetForm = () => {
    setFormData({
      message: '',
      scheduleTime: '',
      isActive: true,
    });
    setEditingId(null);
  };
  
  const handleEdit = (item: SmsSchedule) => {
    // Tarih-saat değerini HTML datetime-local inputuna uygun formata dönüştür
    const scheduleDateTime = new Date(item.scheduleTime);
    const scheduleDateTimeLocal = scheduleDateTime.toISOString().slice(0, 16); // "yyyy-MM-ddThh:mm" formatında
    
    setFormData({
      message: item.message,
      scheduleTime: scheduleDateTimeLocal,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu SMS zamanlamasını silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/sms-schedules?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('SMS zamanlaması silinemedi');
      }
      
      // UI'dan öğeyi kaldır
      setSmsSchedules(prev => prev.filter(schedule => schedule.id !== id));
    } catch (error) {
      console.error('SMS zamanlaması silme hatası:', error);
      setError('SMS zamanlaması silinirken bir hata oluştu');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/admin/sms-schedules';
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(editingId ? 'SMS zamanlaması güncellenemedi' : 'SMS zamanlaması eklenemedi');
      }
      
      const savedSchedule = await response.json();
      
      if (editingId) {
        // Mevcut öğeyi güncelle
        setSmsSchedules(prev => prev.map(schedule => schedule.id === editingId ? savedSchedule : schedule));
      } else {
        // Yeni öğeyi ekle
        setSmsSchedules(prev => [savedSchedule, ...prev]);
      }
      
      // Formu sıfırla
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('SMS zamanlaması kaydetme hatası:', error);
      setError(editingId ? 'SMS zamanlaması güncellenirken bir hata oluştu' : 'SMS zamanlaması eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
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
  
  // Yükleniyor kontrolü
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
          <h1 className="text-3xl font-bold text-yellow-400">SMS Zamanlamaları</h1>
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
        
        <div className="flex justify-end mb-6">
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className={`px-4 py-2 rounded-md ${
              showForm 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            {showForm ? 'İptal' : 'Yeni SMS Zamanlaması Ekle'}
          </button>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 text-white px-4 py-3 rounded-lg" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Form */}
        {showForm && (
          <div className="mb-8 bg-gray-900 shadow-lg border border-gray-800 px-4 py-5 rounded-lg">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-yellow-400">
                  {editingId ? 'SMS Zamanlamasını Düzenle' : 'Yeni SMS Zamanlaması'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Belirli zamanlarda gönderilecek SMS mesajlarını planlayın.
                </p>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-300">
                        SMS Mesajı
                      </label>
                      <textarea
                        name="message"
                        id="message"
                        rows={3}
                        required
                        value={formData.message}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-700 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="Mesaj metni"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Maksimum 160 karakter (standart SMS uzunluğu).
                      </p>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-300">
                        Gönderim Zamanı
                      </label>
                      <input
                        type="datetime-local"
                        name="scheduleTime"
                        id="scheduleTime"
                        required
                        value={formData.scheduleTime}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-700 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="isActive" className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-400 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-300">Aktif</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-400">
                        İşaretlenirse, bu SMS planlanan zamanda gönderilir.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setShowForm(false); }}
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 ${
                        submitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {submitting ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Ekle')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* SMS Zamanlamaları Listesi */}
        <div className="bg-gray-900 shadow border border-gray-800 overflow-hidden rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Mevcut SMS Zamanlamaları</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Mesaj
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Gönderim Zamanı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {smsSchedules.length > 0 ? (
                  smsSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{schedule.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{formatDate(schedule.scheduleTime)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          schedule.isActive 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {schedule.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-yellow-500 hover:text-yellow-400 mr-3"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-400">
                      Henüz SMS zamanlaması bulunmuyor.
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
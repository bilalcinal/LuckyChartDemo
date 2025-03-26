'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type WheelItem = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  probability: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminWheelItems() {
  const { status } = useSession();
  const router = useRouter();
  const [wheelItems, setWheelItems] = useState<WheelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Yeni çark öğesi için form durumu
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#ff8f43', // Varsayılan renk
    probability: 1.0,
    isActive: true,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);
  
  // Çark öğelerini getir
  useEffect(() => {
    const fetchWheelItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/wheel-items');
        
        if (!response.ok) {
          throw new Error('Çark öğeleri getirilemedi');
        }
        
        const data = await response.json();
        setWheelItems(data);
      } catch (error) {
        console.error('Çark öğeleri getirme hatası:', error);
        setError('Çark öğeleri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchWheelItems();
    }
  }, [status]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      color: '#ff8f43',
      probability: 1.0,
      isActive: true,
    });
    setEditingId(null);
  };
  
  const handleEdit = (item: WheelItem) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      color: item.color,
      probability: item.probability,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu çark öğesini silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/wheel-items?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Çark öğesi silinemedi');
      }
      
      // UI'dan öğeyi kaldır
      setWheelItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Çark öğesi silme hatası:', error);
      setError('Çark öğesi silinirken bir hata oluştu');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/admin/wheel-items';
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
        throw new Error(editingId ? 'Çark öğesi güncellenemedi' : 'Çark öğesi eklenemedi');
      }
      
      const savedItem = await response.json();
      
      if (editingId) {
        // Mevcut öğeyi güncelle
        setWheelItems(prev => prev.map(item => item.id === editingId ? savedItem : item));
      } else {
        // Yeni öğeyi ekle
        setWheelItems(prev => [savedItem, ...prev]);
      }
      
      // Formu sıfırla
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Çark öğesi kaydetme hatası:', error);
      setError(editingId ? 'Çark öğesi güncellenirken bir hata oluştu' : 'Çark öğesi eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Yükleniyor kontrolü
  if (status === 'loading' || loading) {
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Gösterge Paneli
              </Link>
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
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
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Çark Öğeleri</h1>
              <button
                onClick={() => { resetForm(); setShowForm(!showForm); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {showForm ? 'İptal' : 'Yeni Öğe Ekle'}
              </button>
            </div>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {error && (
              <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {/* Form */}
            {showForm && (
              <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {editingId ? 'Çark Öğesini Düzenle' : 'Yeni Çark Öğesi'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Çarkta görünecek öğenin detaylarını düzenleyin.
                    </p>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-6 gap-6">
                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Başlık
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                            Renk
                          </label>
                          <input
                            type="color"
                            name="color"
                            id="color"
                            value={formData.color}
                            onChange={handleInputChange}
                            className="mt-1 block w-full p-1 h-10"
                            required
                          />
                        </div>
                        
                        <div className="col-span-6">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Açıklama
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
                            Olasılık (0.1 - 10.0)
                          </label>
                          <input
                            type="number"
                            name="probability"
                            id="probability"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={formData.probability}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Daha yüksek değerler, bu öğenin çarkta daha sık çıkmasını sağlar.
                          </p>
                        </div>
                        
                        <div className="col-span-6 sm:col-span-3">
                          <div className="flex items-center h-full mt-6">
                            <input
                              type="checkbox"
                              name="isActive"
                              id="isActive"
                              checked={formData.isActive}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                              Aktif
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => { resetForm(); setShowForm(false); }}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            submitting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {submitting ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Kaydet')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            
            {/* Çark Öğeleri Listesi */}
            <div className="mt-8 flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Önizleme
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Başlık
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Açıklama
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Olasılık
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Durum
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Düzenle</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {wheelItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              Henüz çark öğesi eklenmemiş.
                            </td>
                          </tr>
                        ) : (
                          wheelItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="w-10 h-10 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {item.description || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.probability.toFixed(1)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {item.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Sil
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
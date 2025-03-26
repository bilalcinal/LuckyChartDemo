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
          <h1 className="text-3xl font-bold text-yellow-400">Çark Öğeleri</h1>
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
              onClick={() => router.push('/api/auth/signout')}
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
            {showForm ? 'İptal' : 'Yeni Öğe Ekle'}
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
                  {editingId ? 'Çark Öğesini Düzenle' : 'Yeni Çark Öğesi'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Çarkta görünecek öğenin detaylarını düzenleyin.
                </p>
                <div className="mt-4">
                  <div 
                    className="w-20 h-20 rounded-full" 
                    style={{ backgroundColor: formData.color }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                        Başlık
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-700 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="color" className="block text-sm font-medium text-gray-300">
                        Renk
                      </label>
                      <input
                        type="color"
                        name="color"
                        id="color"
                        required
                        value={formData.color}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-700 bg-gray-800 rounded-md shadow-sm h-10 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                        Açıklama
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-700 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="probability" className="block text-sm font-medium text-gray-300">
                        Olasılık Değeri (0.1 - 2.0)
                      </label>
                      <input
                        type="number"
                        name="probability"
                        id="probability"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        required
                        value={formData.probability}
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
                        İşaretlenirse, bu öğe çarkta gösterilir.
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
        
        {/* Çark Öğeleri Listesi */}
        <div className="bg-gray-900 shadow border border-gray-800 overflow-hidden rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Mevcut Çark Öğeleri</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Renk
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Başlık
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Olasılık
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
                {wheelItems.length > 0 ? (
                  wheelItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{item.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{item.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{item.probability}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.isActive 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {item.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-500 hover:text-yellow-400 mr-3"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">
                      Henüz çark öğesi bulunmuyor.
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
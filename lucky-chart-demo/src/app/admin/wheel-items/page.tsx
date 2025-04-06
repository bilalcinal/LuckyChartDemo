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
  const [totalProbability, setTotalProbability] = useState(0);
  const [hasDefaultItem, setHasDefaultItem] = useState(false);
  
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
  
  // Toplam olasılık hesapla
  useEffect(() => {
    if (wheelItems.length > 0) {
      // "Yarın Tekrar Deneyiniz" öğesi hariç toplam olasılığı hesapla
      const defaultItem = wheelItems.find(item => item.title === "Yarın Tekrar Deneyiniz");
      setHasDefaultItem(!!defaultItem);
      
      const total = wheelItems.reduce((sum, item) => {
        // "Yarın Tekrar Deneyiniz" öğesini toplama dahil etme
        if (item.title === "Yarın Tekrar Deneyiniz") return sum;
        return sum + item.probability;
      }, 0);
      
      setTotalProbability(total);
    }
  }, [wheelItems]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'probability') {
      // Olasılık değerini yüzdelik değerden ondalık değere dönüştür (örn: 5 -> 0.05)
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({ ...prev, [name]: numValue / 100 }));
      }
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
      // Ondalık olasılık değerini yüzdelik gösterim için çarp (örn: 0.05 -> 5)
      probability: item.probability * 100,
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
  
  // Öğeyi yarın tekrar deneyin olarak işaretle
  const markAsDefaultItem = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/wheel-items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          title: "Yarın Tekrar Deneyiniz",
          description: "Bugün için şansınız bitti, yarın tekrar deneyiniz.",
          isActive: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Öğe güncellenemedi');
      }
      
      const updatedItem = await response.json();
      
      // UI'ı güncelle
      setWheelItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      
    } catch (error) {
      console.error('Öğe güncelleme hatası:', error);
      setError('Öğe "Yarın Tekrar Deneyiniz" olarak ayarlanırken bir hata oluştu');
    }
  };

  // Varsayılan öğeyi oluştur
  const createDefaultItem = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/admin/wheel-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "Yarın Tekrar Deneyiniz",
          description: "Bugün için şansınız bitti, yarın tekrar deneyiniz.",
          color: "#cccccc", // Gri renk
          probability: 1.0 - totalProbability, // Geri kalan olasılık
          isActive: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Varsayılan öğe eklenemedi');
      }
      
      const newItem = await response.json();
      
      // UI'ı güncelle
      setWheelItems(prev => [newItem, ...prev]);
      setHasDefaultItem(true);
      
    } catch (error) {
      console.error('Varsayılan öğe ekleme hatası:', error);
      setError('Varsayılan "Yarın Tekrar Deneyiniz" öğesi eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Varsayılan öğeyi güncelle
  const updateDefaultItemProbability = async () => {
    try {
      const defaultItem = wheelItems.find(item => item.title === "Yarın Tekrar Deneyiniz");
      if (!defaultItem) return;
      
      // Geri kalan olasılık
      const remainingProbability = Math.max(0, 1.0 - totalProbability);
      
      const response = await fetch(`/api/admin/wheel-items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: defaultItem.id,
          probability: remainingProbability,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Varsayılan öğe olasılığı güncellenemedi');
      }
      
      const updatedItem = await response.json();
      
      // UI'ı güncelle
      setWheelItems(prev => prev.map(item => item.id === defaultItem.id ? updatedItem : item));
      
    } catch (error) {
      console.error('Varsayılan öğe güncelleme hatası:', error);
      setError('Varsayılan öğe olasılığı güncellenirken bir hata oluştu');
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
        
        <div className="flex justify-between mb-6">
          <div>
            <div className="bg-gray-900 p-4 rounded-lg mb-4">
              <h2 className="text-lg text-yellow-400 mb-2">Olasılık Bilgisi:</h2>
              <p>Toplam Atanan Olasılık: <span className="text-yellow-400 font-bold">%{(totalProbability * 100).toFixed(2)}</span></p>
              <p>Geri Kalan Olasılık: <span className="text-yellow-400 font-bold">%{((1 - totalProbability) * 100).toFixed(2)}</span></p>
              <p className="text-sm text-gray-400 mt-2">
                Not: Geri kalan olasılık "Yarın Tekrar Deneyiniz" öğesine atanacaktır.
              </p>
            </div>
            
            {!hasDefaultItem ? (
              <button
                onClick={createDefaultItem}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mr-2"
              >
                {submitting ? 'İşleniyor...' : '"Yarın Tekrar Deneyiniz" Öğesi Oluştur'}
              </button>
            ) : (
              <button
                onClick={updateDefaultItemProbability}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md mr-2"
              >
                {submitting ? 'İşleniyor...' : 'Varsayılan Öğe Olasılığını Güncelle'}
              </button>
            )}
          </div>
          
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
                        Olasılık (%)
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="number"
                          name="probability"
                          id="probability"
                          min="0.01"
                          max="100"
                          step="0.01"
                          required
                          value={formData.probability * 100}
                          onChange={handleInputChange}
                          className="block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                        />
                        <span className="ml-3 text-gray-300">%</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        Ödülün çarkta çıkma olasılığı. Örnek: %5 = 0.05 (toplam yüzdelik %100 = 1.0)
                      </p>
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
                        {item.title !== "Yarın Tekrar Deneyiniz" ? (
                          <>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-500 hover:text-red-400 mr-4"
                            >
                              Sil
                            </button>
                            <button
                              onClick={() => markAsDefaultItem(item.id)}
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              Varsayılan Olarak Ayarla
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={updateDefaultItemProbability}
                            className="text-green-400 hover:text-green-300"
                          >
                            Olasılığı Güncelle
                          </button>
                        )}
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
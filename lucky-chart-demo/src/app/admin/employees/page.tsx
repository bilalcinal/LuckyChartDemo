'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Employee = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  password?: string | null;
  position: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminEmployees() {
  const { status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Yeni çalışan için form durumu
  const [formData, setFormData] = useState<{
    id?: string;
    fullName: string;
    phone: string;
    email: string;
    password: string;
    position: string;
    isActive: boolean;
  }>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    position: '',
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
  
  // Çalışanları getir
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/employees');
        
        if (!response.ok) {
          throw new Error('Çalışanlar getirilemedi');
        }
        
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Çalışanlar getirme hatası:', error);
        setError('Çalışanlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchEmployees();
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
      fullName: '',
      phone: '',
      email: '',
      password: '',
      position: '',
      isActive: true,
    });
    setEditingId(null);
  };
  
  const handleEdit = (item: Employee) => {
    setFormData({
      id: item.id,
      fullName: item.fullName,
      phone: item.phone,
      email: item.email || '',
      password: '',
      position: item.position,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/employees?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Çalışan silinemedi');
      }
      
      // UI'dan öğeyi kaldır
      setEmployees(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Çalışan silme hatası:', error);
      setError('Çalışan silinirken bir hata oluştu');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/admin/employees';
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
        throw new Error(editingId ? 'Çalışan güncellenemedi' : 'Çalışan eklenemedi');
      }
      
      const savedItem = await response.json();
      
      if (editingId) {
        // Mevcut öğeyi güncelle
        setEmployees(prev => prev.map(item => item.id === editingId ? savedItem : item));
      } else {
        // Yeni öğeyi ekle
        setEmployees(prev => [savedItem, ...prev]);
      }
      
      // Formu sıfırla
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Çalışan kaydetme hatası:', error);
      setError(editingId ? 'Çalışan güncellenirken bir hata oluştu' : 'Çalışan eklenirken bir hata oluştu');
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
          <h1 className="text-3xl font-bold text-yellow-400">Çalışanlar</h1>
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
            {showForm ? 'İptal' : 'Yeni Çalışan Ekle'}
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
                  {editingId ? 'Çalışanı Düzenle' : 'Yeni Çalışan Ekle'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Çalışan bilgilerini giriniz.
                </p>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit}>
                  <div className="overflow-hidden shadow sm:rounded-md">
                    <div className="space-y-6 bg-gray-900 px-4 py-5 sm:p-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                            Ad Soyad
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                            Telefon
                          </label>
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            E-posta
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            Şifre {editingId && <span className="text-xs text-gray-400">(Sadece değiştirmek istiyorsanız doldurun)</span>}
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            required={!editingId}
                          />
                        </div>
                        <div>
                          <label htmlFor="position" className="block text-sm font-medium text-gray-300">
                            Pozisyon
                          </label>
                          <input
                            type="text"
                            name="position"
                            id="position"
                            value={formData.position}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            id="isActive"
                            name="isActive"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500"
                          />
                          <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-300">
                            Aktif
                          </label>
                        </div>
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
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Çalışanlar Listesi */}
        <div className="bg-gray-900 shadow border border-gray-800 overflow-hidden rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold">Mevcut Çalışanlar</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Pozisyon
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
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{employee.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{employee.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{employee.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.isActive 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {employee.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-yellow-500 hover:text-yellow-400 mr-3"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
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
                      Henüz çalışan bulunmuyor.
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
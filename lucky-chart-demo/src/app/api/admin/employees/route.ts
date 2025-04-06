import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// GET - Tüm çalışanları getir
export async function GET(request: NextRequest) {
  try {
    // Admin oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmamaktadır' }, { status: 403 });
    }

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Çalışanlar getirme hatası:', error);
    return NextResponse.json({ error: 'Çalışanlar getirilirken bir hata oluştu' }, { status: 500 });
  }
}

// POST - Yeni çalışan ekle
export async function POST(request: NextRequest) {
  try {
    // Admin oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmamaktadır' }, { status: 403 });
    }

    const { fullName, username, phone, email, position, isActive, password } = await request.json();

    // Zorunlu alanları kontrol et
    if (!fullName || !username || !phone || !position) {
      return NextResponse.json({ error: 'Ad Soyad, Kullanıcı Adı, Telefon ve Pozisyon alanları zorunludur' }, { status: 400 });
    }

    // Kullanıcı adı benzersizliğini kontrol et
    const existingUser = await prisma.employee.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 400 });
    }

    // Şifre hashleme
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Yeni çalışan oluştur
    const employee = await prisma.employee.create({
      data: {
        fullName,
        username,
        phone,
        email: email || null,
        password: hashedPassword,
        position,
        isActive: isActive === undefined ? true : isActive,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Çalışan ekleme hatası:', error);
    return NextResponse.json({ error: 'Çalışan eklenirken bir hata oluştu' }, { status: 500 });
  }
}

// PUT - Çalışan güncelle
export async function PUT(request: NextRequest) {
  try {
    // Admin oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmamaktadır' }, { status: 403 });
    }

    const { id, fullName, username, phone, email, position, isActive, password } = await request.json();

    // Zorunlu alanları kontrol et
    if (!id || !fullName || !username || !phone || !position) {
      return NextResponse.json({ error: 'ID, Ad Soyad, Kullanıcı Adı, Telefon ve Pozisyon alanları zorunludur' }, { status: 400 });
    }

    // Çalışanın varlığını kontrol et
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Çalışan bulunamadı' }, { status: 404 });
    }

    // Kullanıcı adı değiştiyse benzersizliğini kontrol et
    if (username !== existingEmployee.username) {
      const existingUser = await prisma.employee.findUnique({
        where: { username },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 400 });
      }
    }

    // Şifre hashleme - sadece şifre değiştiyse
    let hashedPassword = existingEmployee.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Çalışanı güncelle
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        fullName,
        username,
        phone,
        email: email || null,
        password: hashedPassword,
        position,
        isActive: isActive === undefined ? true : isActive,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Çalışan güncelleme hatası:', error);
    return NextResponse.json({ error: 'Çalışan güncellenirken bir hata oluştu' }, { status: 500 });
  }
}

// DELETE - Çalışan sil
export async function DELETE(request: NextRequest) {
  try {
    // Admin oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmamaktadır' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Çalışan ID\'si belirtilmemiş' }, { status: 400 });
    }

    // Çalışanın varlığını kontrol et
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Çalışan bulunamadı' }, { status: 404 });
    }

    // Çalışanı sil
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Çalışan silme hatası:', error);
    return NextResponse.json({ error: 'Çalışan silinirken bir hata oluştu' }, { status: 500 });
  }
} 
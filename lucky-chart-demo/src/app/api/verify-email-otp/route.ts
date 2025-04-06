import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, code, tempCode } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email adresi ve doğrulama kodu gereklidir' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    // Geçici çözüm: Client'tan gelen tempCode ile kod eşleşmesini kontrol et
    if (tempCode && tempCode === code) {
      console.log('Test modu: tempCode ile doğrulama yapıldı');
      
      try {
        // Kullanıcı kontrolü - SQL sorgusu ile
        const existingUserQuery = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM User WHERE email = ? OR phone = ? LIMIT 1`,
          email,
          phone
        );
        
        const existingUser = Array.isArray(existingUserQuery) && existingUserQuery.length > 0 
          ? existingUserQuery[0] 
          : null;
        
        // Kullanıcı yoksa oluştur
        let user = existingUser;
        if (!existingUser) {
          // SQL ile kullanıcı oluştur
          await prisma.$executeRawUnsafe(
            `INSERT INTO User (id, phone, email, spinsRemaining, lastLogin, createdAt, updatedAt, isActive)
            VALUES (UUID(), ?, ?, 1, NOW(), NOW(), NOW(), 1)`,
            phone,
            email
          );
          
          // Yeni oluşturulan kullanıcıyı getir
          const newUserQuery = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM User WHERE email = ? LIMIT 1`,
            email
          );
          
          user = Array.isArray(newUserQuery) && newUserQuery.length > 0 
            ? newUserQuery[0] 
            : null;
        }
        
        return NextResponse.json({
          success: true,
          userId: user?.id,
          email: email,
          phone: phone,
          message: 'Email adresi başarıyla doğrulandı'
        });
      } catch (error) {
        console.error('Kullanıcı işlemi hatası:', error);
        return NextResponse.json(
          { error: 'Kullanıcı işlemi sırasında bir hata oluştu' },
          { status: 500 }
        );
      }
    }

    // Veritabanında OTP kaydını ara
    const otpRecord = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM OTP
      WHERE email = ?
      AND code = ?
      AND verified = 0
      AND expiresAt > NOW()
      ORDER BY createdAt DESC
      LIMIT 1`,
      email,
      code
    );

    // OTP kaydı bulunamadı veya geçersiz
    if (!Array.isArray(otpRecord) || otpRecord.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş doğrulama kodu' },
        { status: 400 }
      );
    }

    // OTP kaydını doğrulandı olarak işaretle
    await prisma.$executeRawUnsafe(
      `UPDATE OTP
      SET verified = 1
      WHERE id = ?`,
      otpRecord[0].id
    );

    try {
      // Kullanıcı kontrolü - SQL sorgusu ile
      const existingUserQuery = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM User WHERE email = ? OR phone = ? LIMIT 1`,
        email,
        phone
      );
      
      const existingUser = Array.isArray(existingUserQuery) && existingUserQuery.length > 0 
        ? existingUserQuery[0] 
        : null;
      
      // Kullanıcı yoksa oluştur
      let user = existingUser;
      if (!existingUser) {
        // SQL ile kullanıcı oluştur
        await prisma.$executeRawUnsafe(
          `INSERT INTO User (id, phone, email, spinsRemaining, lastLogin, createdAt, updatedAt, isActive)
          VALUES (UUID(), ?, ?, 1, NOW(), NOW(), NOW(), 1)`,
          phone,
          email
        );
        
        // Yeni oluşturulan kullanıcıyı getir
        const newUserQuery = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM User WHERE email = ? LIMIT 1`,
          email
        );
        
        user = Array.isArray(newUserQuery) && newUserQuery.length > 0 
          ? newUserQuery[0] 
          : null;
      }
      
      return NextResponse.json({
        success: true,
        userId: user?.id,
        email: email,
        phone: phone,
        message: 'Email adresi başarıyla doğrulandı'
      });
    } catch (error) {
      console.error('Kullanıcı işlemi hatası:', error);
      return NextResponse.json(
        { error: 'Kullanıcı işlemi sırasında bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OTP doğrulama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 
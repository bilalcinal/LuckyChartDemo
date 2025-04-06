import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'lucky-chart-secret-key';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Sadece /wheel ve /api/wheel/* rotalarına uygula
  if (pathname === '/wheel' || pathname.startsWith('/api/wheel/')) {
    // Admin sayfaları ile ilgili değilse
    if (!pathname.includes('/admin/')) {
      // NextAuth token kontrolü
      const session = await getToken({ 
        req: request, 
        secret: JWT_SECRET 
      });
      
      // Eğer NextAuth session varsa izin ver
      if (session) {
        return NextResponse.next();
      }
      
      // NextAuth session yoksa Custom JWT kontrolü yap
      const authToken = request.cookies.get('lc_token')?.value;
      const refreshToken = request.cookies.get('lc_refresh_token')?.value;
      const userId = request.cookies.get('lc_user_id')?.value;
      
      // Token yok ise
      if (!authToken || !userId) {
        // API isteği ise 401 döndür
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Yetkisiz erişim' },
            { status: 401 }
          );
        }
        
        // Sayfa isteği ise ana sayfaya yönlendir
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      try {
        // JWT token doğrula
        const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string };
        
        // Kullanıcı ID ile token kullanıcı ID'si eşleşiyorsa devam et
        if (decoded.userId === userId) {
          return NextResponse.next();
        }
        
        throw new Error('Token kullanıcı ID uyuşmazlığı');
        
      } catch (error) {
        console.error('Middleware token hatası:', error);
        
        // Refresh token varsa kontrole devam et, yoksa hata döndür
        if (!refreshToken) {
          // API isteği ise 401 döndür
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Geçersiz token' },
              { status: 401 }
            );
          }
          
          // Sayfa isteği ise ana sayfaya yönlendir
          return NextResponse.redirect(new URL('/', request.url));
        }
        
        try {
          // Refresh token'ı doğrula
          const refreshDecoded = jwt.verify(refreshToken, JWT_SECRET) as { 
            userId: string; 
            tokenType: string;
          };
          
          // Refresh token kontrolü
          if (refreshDecoded.tokenType === 'refresh' && refreshDecoded.userId === userId) {
            // API isteği ise 401 döndür - Client refresh token endpoint'ine istek atarak token almalı
            if (pathname.startsWith('/api/')) {
              return NextResponse.json(
                { error: 'Token yenileme gerekli' },
                { status: 401 }
              );
            }
            
            // Sayfa isteği ise devam et - Client tarafında token yenilenecek
            return NextResponse.next();
          }
          
          throw new Error('Geçersiz refresh token');
          
        } catch (refreshError) {
          console.error('Middleware refresh token hatası:', refreshError);
          
          // API isteği ise 401 döndür
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Yeniden giriş yapmalısınız' },
              { status: 401 }
            );
          }
          
          // Sayfa isteği ise ana sayfaya yönlendir
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  }
  
  return NextResponse.next();
}

// Middleware'in uygulanacağı rotaları belirt
export const config = {
  matcher: ['/wheel', '/api/wheel/:path*']
}; 
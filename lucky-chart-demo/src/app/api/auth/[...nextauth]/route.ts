import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { AuthOptions, DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import bcrypt from 'bcrypt';

// Özel kullanıcı tipimizi tanımlıyoruz
type LuckyChartUser = {
  id: string;
  phone: string;
  spinsRemaining: number;
  role?: string;
};

// NextAuth.js'in varsayılan tiplerine özel alanlar ekliyoruz
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      phone: string;
      spinsRemaining: number;
      role?: string;
    } & DefaultSession['user'];
  }
  
  interface User {
    phone: string;
    spinsRemaining: number;
    role?: string;
  }
}

// JWT tipini genişletiyoruz
declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    phone: string;
    spinsRemaining: number;
    role?: string;
  }
}

// NextAuth.js yapılandırması
export const authOptions: AuthOptions = {
  providers: [
    // Normal kullanıcılar için telefon kimlik doğrulama
    CredentialsProvider({
      id: 'phone-credentials',
      name: 'Phone',
      credentials: {
        phone: { label: 'Telefon Numarası', type: 'text', placeholder: '5XX XXX XX XX' },
      },
      async authorize(credentials) {
        const { phone } = credentials ?? {};
        
        if (!phone) return null;
        
        // Telefon numarası formatlama (gerekirse)
        const formattedPhone = phone.startsWith('+90') ? phone : `+90${phone.replace(/\D/g, '')}`;
        
        // Kullanıcıyı veritabanında ara
        let user = await prisma.user.findUnique({
          where: { phone: formattedPhone },
        });

        // Kullanıcı yoksa oluştur
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: formattedPhone,
              spinsRemaining: 1,
            },
          });
        } else {
          // Kullanıcı varsa son giriş zamanını güncelle
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          spinsRemaining: user.spinsRemaining,
          role: 'USER'
        } as LuckyChartUser;
      },
    }),
    
    // Admin kullanıcılar için kullanıcı adı-şifre kimlik doğrulama
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        username: { label: 'Kullanıcı Adı', type: 'text' },
        password: { label: 'Şifre', type: 'password' }
      },
      async authorize(credentials) {
        const { username, password } = credentials ?? {};
        
        if (!username || !password) return null;
        
        // Admin kullanıcıyı veritabanında ara
        const admin = await prisma.admin.findUnique({
          where: { username },
        });
        
        if (!admin) return null;
        
        // Şifre kontrolü
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) return null;
        
        return {
          id: admin.id,
          phone: 'admin', // Bu alan kullanılmıyor ama tip için gerekli
          spinsRemaining: 0, // Bu alan kullanılmıyor ama tip için gerekli
          role: 'ADMIN'
        } as LuckyChartUser;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.phone = user.phone;
        token.spinsRemaining = user.spinsRemaining;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId,
          phone: token.phone,
          spinsRemaining: token.spinsRemaining,
          role: token.role
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/qr', // QR kodu okutma sayfası (normal kullanıcılar için)
  },
  session: {
    strategy: 'jwt',
    maxAge: 5 * 60, // 5 dakika (saniye olarak)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
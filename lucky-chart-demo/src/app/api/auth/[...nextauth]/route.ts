import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { AuthOptions, DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Özel kullanıcı tipimizi tanımlıyoruz
type LuckyChartUser = {
  id: string;
  phone: string;
  spinsRemaining: number;
};

// NextAuth.js'in varsayılan tiplerine özel alanlar ekliyoruz
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      phone: string;
      spinsRemaining: number;
    } & DefaultSession['user'];
  }
  
  interface User {
    phone: string;
    spinsRemaining: number;
  }
}

// JWT tipini genişletiyoruz
declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    phone: string;
    spinsRemaining: number;
  }
}

// NextAuth.js yapılandırması
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
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
        } as LuckyChartUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.phone = user.phone;
        token.spinsRemaining = user.spinsRemaining;
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
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/qr', // QR kodu okutma sayfası
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
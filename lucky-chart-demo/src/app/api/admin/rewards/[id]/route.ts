import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Oturum kontrolü
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // Request body'den veriyi al
    const body = await request.json();
    
    // Ödülü güncelle
    const updatedReward = await prisma.reward.update({
      where: { id },
      data: { 
        isUsed: body.isUsed 
      },
    });
    
    return NextResponse.json(updatedReward);
    
  } catch (error) {
    console.error('Ödül güncelleme hatası:', error);
    return NextResponse.json({ error: 'Ödül güncellenirken bir hata oluştu' }, { status: 500 });
  }
} 
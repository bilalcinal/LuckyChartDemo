const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Admin kullanıcısı oluştur
  const adminExists = await prisma.admin.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    await prisma.admin.create({
      data: {
        id: uuidv4(),
        username: 'admin',
        password: await bcrypt.hash('admin123', 10), // Gerçek ortamda güçlü şifre kullan!
      },
    });
    console.log('Admin kullanıcısı oluşturuldu');
  }

  // Örnek çark öğeleri oluştur
  const wheelItemCount = await prisma.wheelItem.count();

  if (wheelItemCount === 0) {
    await prisma.wheelItem.createMany({
      data: [
        {
          id: uuidv4(),
          title: 'Kahve İndirimi',
          description: 'Herhangi bir kahve siparişinizde %20 indirim',
          color: '#ff8f43',
          probability: 1.0,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'Tatlı İndirimi',
          description: 'Herhangi bir tatlı siparişinizde %30 indirim',
          color: '#70bbe0',
          probability: 1.0,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'Ücretsiz İçecek',
          description: 'Yanında bir içecek ücretsiz!',
          color: '#ff5252',
          probability: 0.5,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'İkinci Kahve Bedava',
          description: 'İkinci kahveniz bizden!',
          color: '#4CAF50',
          probability: 0.7,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'Pasta Dilimi İndirimi',
          description: 'Pasta dilimlerinde %25 indirim',
          color: '#9c27b0',
          probability: 1.2,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'Ücretsiz Çay',
          description: 'Bir fincan çay hediye!',
          color: '#2196F3',
          probability: 1.5,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'Sonraki Alışveriş %15 İndirim',
          description: 'Bir sonraki alışverişinizde %15 indirim',
          color: '#FFC107',
          probability: 1.0,
          isActive: true,
        },
        {
          id: uuidv4(),
          title: 'Ücretsiz Tatlı',
          description: 'Herhangi bir menü siparişinde ücretsiz tatlı',
          color: '#E91E63',
          probability: 0.3,
          isActive: true,
        },
      ],
    });
    console.log('Örnek çark öğeleri oluşturuldu');
  }

  // Örnek SMS zamanlaması oluştur
  const smsScheduleCount = await prisma.smsSchedule.count();

  if (smsScheduleCount === 0) {
    await prisma.smsSchedule.createMany({
      data: [
        {
          id: uuidv4(),
          hour: 10,
          minute: 0,
          isActive: true,
        },
        {
          id: uuidv4(),
          hour: 15,
          minute: 30,
          isActive: true,
        },
        {
          id: uuidv4(),
          hour: 19,
          minute: 0,
          isActive: true,
        },
      ],
    });
    console.log('Örnek SMS zamanlamaları oluşturuldu');
  }

  console.log('Seed işlemi tamamlandı');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
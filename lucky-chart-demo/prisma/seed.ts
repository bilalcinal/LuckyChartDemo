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

  // Örnek çalışanlar oluştur
  const employeeCount = await prisma.employee.count();

  if (employeeCount === 0) {
    await prisma.employee.createMany({
      data: [
        {
          id: uuidv4(),
          fullName: 'Ahmet Yılmaz',
          username: 'ahmet',
          password: await bcrypt.hash('ahmet123', 10),
          phone: '+905551112233',
          email: 'ahmet@example.com',
          position: 'Kasiyer',
          isActive: true,
        },
        {
          id: uuidv4(),
          fullName: 'Ayşe Demir',
          username: 'ayse',
          password: await bcrypt.hash('ayse123', 10),
          phone: '+905552223344',
          email: 'ayse@example.com',
          position: 'Barista',
          isActive: true,
        },
        {
          id: uuidv4(),
          fullName: 'Mehmet Kaya',
          username: 'mehmet',
          password: await bcrypt.hash('mehmet123', 10),
          phone: '+905553334455',
          email: 'mehmet@example.com',
          position: 'Garson',
          isActive: true,
        },
        {
          id: uuidv4(),
          fullName: 'Zeynep Çelik',
          username: 'zeynep',
          password: await bcrypt.hash('zeynep123', 10),
          phone: '+905554445566',
          email: 'zeynep@example.com',
          position: 'Mutfak Şefi',
          isActive: true,
        },
      ],
    });
    console.log('Örnek çalışanlar oluşturuldu');
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
          message: 'Bugün şansınızı denemek için çark çevirmeyi unutmayın! Kafeye uğrayın ve size özel indirimler kazanın.',
          scheduleTime: new Date(new Date().setHours(10, 0, 0, 0)),
          isActive: true,
        },
        {
          id: uuidv4(),
          message: 'Öğleden sonra kahve molası zamanı! Şanslı çarkı çevir, belki bedava kahve kazanırsın!',
          scheduleTime: new Date(new Date().setHours(15, 30, 0, 0)),
          isActive: true,
        },
        {
          id: uuidv4(),
          message: 'Akşam yemeği öncesi bir şeyler kazanmak ister misin? Şanslı çarkı çevir ve ödülünü al!',
          scheduleTime: new Date(new Date().setHours(19, 0, 0, 0)),
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
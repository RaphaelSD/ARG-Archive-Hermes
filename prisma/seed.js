const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.gameProgress.deleteMany();
  await prisma.caseAccess.deleteMany();
  await prisma.mapPoint.deleteMany();
  await prisma.call.deleteMany();
  await prisma.note.deleteMany();
  await prisma.document.deleteMany();
  await prisma.evidenceItem.deleteMany();
  await prisma.case.deleteMany();
  await prisma.season.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: 'orlov@argarchive.test',
      name: 'Operator',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'player',
    },
  });

  const season = await prisma.season.create({
    data: {
      slug: 'season-1',
      title: 'Season 1',
      description: 'Initial ARG archive season',
    },
  });

  const caseOne = await prisma.case.create({
    data: {
      slug: 'case-001',
      seasonId: season.id,
      title: 'Дело о пропавшем человеке',
      description: 'Первое дело в архиве следователя Максима Орлова.',
      status: 'unlocked',
      order: 1,
    },
  });

  const caseTwo = await prisma.case.create({
    data: {
      slug: 'case-002',
      seasonId: season.id,
      title: 'Дело о жестоком убийстве',
      description: 'Старое дело с несколькими необъяснимыми деталями.',
      status: 'locked',
      order: 2,
    },
  });

  await prisma.caseAccess.createMany({
    data: [
      {
        userId: user.id,
        caseId: caseOne.id,
        status: 'unlocked',
        startedAt: new Date(),
      },
      {
        userId: user.id,
        caseId: caseTwo.id,
        status: 'locked',
      },
    ],
  });

  await prisma.gameProgress.create({
    data: {
      userId: user.id,
      caseId: caseOne.id,
      progress: 12,
      openedAt: new Date(),
      lastSeenAt: new Date(),
    },
  });

  await prisma.document.createMany({
    data: [
      {
        caseId: caseOne.id,
        title: 'Медицинское заключение',
        kind: 'report',
        content: 'Окончательное заключение о времени исчезновения.',
      },
      {
        caseId: caseOne.id,
        title: 'Показания свидетеля',
        kind: 'statement',
        content: 'Свидетель описал странный маршрут в ночь пропажи.',
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        caseId: caseOne.id,
        author: 'Максим Орлов',
        body: 'Свидетель меняет показания каждые 12 минут.',
      },
      {
        caseId: caseOne.id,
        author: 'Максим Орлов',
        body: 'Точка встречи была выбрана психологически, а не логически.',
      },
    ],
  });

  await prisma.call.createMany({
    data: [
      {
        caseId: caseOne.id,
        timestamp: '22:14',
        caller: 'Незнакомый номер',
        summary: 'Автоответчик с фразой о «третьем свидетеле»',
        transcript: 'Третий свидетель уже уходит к воде.',
      },
      {
        caseId: caseOne.id,
        timestamp: '23:02',
        caller: 'Сергей В.',
        summary: 'Проверка маршрута',
        transcript: 'Я видел его возле канала, но не подходил.',
      },
    ],
  });

  await prisma.mapPoint.createMany({
    data: [
      {
        caseId: caseOne.id,
        label: 'Речной причал',
        x: 240,
        y: 180,
        description: 'Пункт, где была отмечена последняя активность.',
      },
      {
        caseId: caseOne.id,
        label: 'Жилой двор',
        x: 420,
        y: 310,
        description: 'Место, откуда вёлся наблюдательный маршрут.',
      },
    ],
  });

  await prisma.evidenceItem.createMany({
    data: [
      {
        caseId: caseOne.id,
        title: 'Обрывок записки',
        kind: 'artifact',
        summary: 'Запись с подозрительным текстом.',
        content: 'Письмо оставлено без подписи.',
      },
      {
        caseId: caseOne.id,
        title: 'Ключ от склада',
        kind: 'key',
        summary: 'Ключ, найденный возле канала.',
        content: 'После проверки оказался связан с арендой склада.',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

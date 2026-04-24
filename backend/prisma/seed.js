/**
 * Prisma Seed — Focus Platform Initial Data
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Focus production database...');

  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create Default User
  const password = await bcrypt.hash('Focus2026!', 12);
  const user = await prisma.user.create({
    data: {
      name: 'Focus Admin',
      email: 'admin@focus.app',
      password,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    },
  });

  // Create User requested tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Master the Focus Design',
        description: 'Perfect the Bento layout and Quiet Luxury aesthetic.',
        priority: 'HIGH',
        userId: user.id,
      },
      {
        title: 'Connect Backend Engine',
        description: 'Synchronize PostgreSQL/SQLite with the frontend bridge.',
        priority: 'MEDIUM',
        userId: user.id,
      },
      {
        title: 'Launch First Version',
        description: 'Deploy the production-ready Apple Bento interface.',
        priority: 'LOW',
        userId: user.id,
      }
    ],
  });

  console.log(`✅ Seeded successfully!`);
  console.log(`👤 Login: admin@focus.app / Focus2026!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

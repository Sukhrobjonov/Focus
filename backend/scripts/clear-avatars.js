const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAvatars() {
  try {
    console.log('🧹 Clearing all user avatars in database...');
    const result = await prisma.user.updateMany({
      data: {
        avatar: null
      }
    });
    console.log(`✅ Successfully cleared avatars for ${result.count} users.`);
  } catch (err) {
    console.error('❌ Error clearing avatars:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAvatars();

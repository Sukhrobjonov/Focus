const cron = require('node-cron');
const prisma = require('./utils/prisma');

/**
 * Task Lifecycle Management
 * 1. Move completed tasks to Trashbox after 24 hours.
 * 2. Permanently delete Trashbox items after 14 days.
 */
const initTaskLifecycle = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running Task Lifecycle Job...');

    try {
      const now = new Date();
      
      // 1. Move to Trashbox (isDeleted = true)
      // Logic: isCompleted = true AND completedAt < (now - 24h) AND isDeleted = false
      const trashThreshold = new Date(now.getTime() - (process.env.TRASHBOX_AFTER_HOURS || 24) * 60 * 60 * 1000);
      
      const movedToTrash = await prisma.task.updateMany({
        where: {
          isCompleted: true,
          completedAt: { lte: trashThreshold },
          isDeleted: false
        },
        data: {
          isDeleted: true,
          deletedAt: now
        }
      });

      if (movedToTrash.count > 0) {
        console.log(`🧹 Moved ${movedToTrash.count} tasks to Trashbox.`);
      }

      // 2. Permanent Delete
      // Logic: isDeleted = true AND deletedAt < (now - 14 days)
      const deleteThreshold = new Date(now.getTime() - (process.env.DELETE_AFTER_DAYS || 14) * 24 * 60 * 60 * 1000);

      const permanentlyDeleted = await prisma.task.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lte: deleteThreshold }
        }
      });

      if (permanentlyDeleted.count > 0) {
        console.log(`🔥 Permanently deleted ${permanentlyDeleted.count} tasks.`);
      }

    } catch (err) {
      console.error('❌ Task Lifecycle Job failed:', err.message);
    }
  });

  console.log('🚀 Task Lifecycle service initialized.');
};

module.exports = { initTaskLifecycle };

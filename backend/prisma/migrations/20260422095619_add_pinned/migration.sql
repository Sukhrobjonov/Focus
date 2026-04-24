-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("completedAt", "createdAt", "deletedAt", "description", "id", "isCompleted", "isDeleted", "priority", "title", "updatedAt", "userId") SELECT "completedAt", "createdAt", "deletedAt", "description", "id", "isCompleted", "isDeleted", "priority", "title", "updatedAt", "userId" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_userId_isCompleted_idx" ON "tasks"("userId", "isCompleted");
CREATE INDEX "tasks_userId_isDeleted_idx" ON "tasks"("userId", "isDeleted");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

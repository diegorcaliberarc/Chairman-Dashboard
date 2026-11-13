const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Task" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Task" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Task" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'None';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Task" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'To Do';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Task" ADD COLUMN IF NOT EXISTS "timeTracked" INTEGER NOT NULL DEFAULT 0;`);
    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import { prisma } from "@/lib/prisma";

/**
 * Retrieves all users with their task counts for the Admin RBAC console.
 */
export async function getAdminUsersList() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      image: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { emailVerified: "asc" },
  });
}

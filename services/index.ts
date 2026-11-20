/**
 * Server-Side Data & Domain Services (`@services`)
 * UI components must never import Prisma or raw database helpers directly;
 * all server mutations and queries flow through service modules or API routes.
 */
export { getLivingOsUserId, pgQuery, pgExec } from "@/lib/livingOsDb";
export { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getLivingOsUserId(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    const uid = (session as any)?.userId as string | undefined;
    return uid || "chairman-default";
  } catch {
    return "chairman-default";
  }
}

export function normalizePgValue(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === "bigint") return Number(val);
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object") {
    // Prisma.Decimal / decimal.js instance check
    if (typeof val.toNumber === "function") {
      return val.toNumber();
    }
    if (Array.isArray(val)) {
      return val.map(normalizePgValue);
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = normalizePgValue(v);
    }
    return out;
  }
  return val;
}

export async function pgQuery<T = any>(
  sql: string,
  ...params: any[]
): Promise<T[]> {
  const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as any[];
  return rows.map((r) => normalizePgValue(r)) as T[];
}

export async function pgExec(sql: string, ...params: any[]): Promise<number> {
  return prisma.$executeRawUnsafe(sql, ...params);
}


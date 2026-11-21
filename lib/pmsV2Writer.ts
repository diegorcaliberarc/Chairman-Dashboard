import { pgQuery } from "@/lib/livingOsDb";

export type PmsV2Priority = "urgent" | "high" | "normal" | "low" | "none";

export interface CreatePmsV2TaskInput {
  name: string;
  description?: string | null;
  priority?: PmsV2Priority;
  spaceHint?: string;
}

export interface CreatedPmsV2Task {
  id: string;
  list_id: string;
  name: string;
  priority: string;
}

/**
 * Unified server writer for Sovereign PMS v2 (`public.pms_lists_v2` & `public.pms_tasks_v2`).
 * Ensures cross-module pushes from /command, /roadmaps, /marketing-agent, and /pods
 * appear immediately inside `/pms`.
 */
export async function createTaskInPmsV2(
  input: CreatePmsV2TaskInput
): Promise<CreatedPmsV2Task | null> {
  const cleanName = input.name.trim();
  if (!cleanName) return null;

  const listRows = await pgQuery<{ id: string; space_id: string }>(
    `SELECT l.id, l.space_id
     FROM public.pms_lists_v2 l
     LEFT JOIN public.pms_spaces s ON s.id = l.space_id
     ORDER BY
       CASE WHEN $1 <> '' AND LOWER(COALESCE(s.name, '')) LIKE '%' || LOWER($1) || '%' THEN 0 ELSE 1 END ASC,
       l.name ASC
     LIMIT 1`,
    input.spaceHint?.trim() || ""
  );

  const targetList = listRows[0];
  if (!targetList?.id) return null;

  const statusRows = await pgQuery<{ id: string }>(
    `SELECT id
     FROM public.pms_statuses
     WHERE space_id = $1::uuid
     ORDER BY sort_order ASC
     LIMIT 1`,
    targetList.space_id
  );
  const statusId = statusRows[0]?.id ?? null;

  const safePriority: PmsV2Priority = input.priority ?? "normal";

  const inserted = await pgQuery<CreatedPmsV2Task>(
    `INSERT INTO public.pms_tasks_v2 (
       list_id, parent_task_id, name, description, status_id, priority, time_estimate_ms
     ) VALUES (
       $1::uuid, NULL, $2, $3, ${statusId ? "$4::uuid" : "NULL"}, ${statusId ? "$5::pms_priority_enum" : "$4::pms_priority_enum"}, 0
     )
     RETURNING id, list_id, name, priority`,
    ...(statusId
      ? [
          targetList.id,
          cleanName.slice(0, 180),
          input.description ?? null,
          statusId,
          safePriority,
        ]
      : [
          targetList.id,
          cleanName.slice(0, 180),
          input.description ?? null,
          safePriority,
        ])
  );

  return inserted[0] ?? null;
}

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export interface PmsSpaceDTO {
  id: string;
  workspace_id: string;
  name: string;
  color_hex: string;
  icon: string;
  is_private: boolean;
  folders: PmsFolderDTO[];
  lists: PmsListDTO[];
  statuses: PmsStatusDTO[];
}

export interface PmsFolderDTO {
  id: string;
  space_id: string;
  name: string;
  lists: PmsListDTO[];
}

export interface PmsListDTO {
  id: string;
  space_id: string;
  folder_id: string | null;
  name: string;
  space_name?: string;
  folder_name?: string;
}

export interface PmsStatusDTO {
  id: string;
  space_id: string;
  name: string;
  category: "not_started" | "active" | "done" | "closed";
  color_hex: string;
  sort_order: number;
}

export interface PmsChecklistDTO {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  sort_order: number;
}

export interface PmsCommentDTO {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
}

export interface PmsDependencyDTO {
  id: string;
  dependent_task_id: string;
  prerequisite_task_id: string;
  type: string;
  prerequisite_task_name?: string;
  dependent_task_name?: string;
}

export interface PmsTaskDTO {
  id: string;
  list_id: string;
  space_id: string;
  folder_id: string | null;
  parent_task_id: string | null;
  name: string;
  description: string | null;
  status_id: string;
  status_name: string;
  status_category: "not_started" | "active" | "done" | "closed";
  status_color: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  start_date: string | null;
  due_date: string | null;
  time_estimate_ms: number;
  time_estimate_minutes: number;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  space_name: string;
  list_name: string;
  folder_name: string | null;
  checklists: PmsChecklistDTO[];
  comments: PmsCommentDTO[];
  dependencies: PmsDependencyDTO[];
  subtasks?: PmsTaskDTO[];
}

// GET: Returns full PMS hierarchy: spaces (with folders, lists, statuses) and tasks
export async function GET() {
  try {
    // 1. Fetch spaces
    const spaces = await pgQuery<any>(
      `SELECT id, workspace_id, name, color_hex, icon, is_private, created_at
       FROM public.pms_spaces
       ORDER BY name ASC`
    );

    // 2. Fetch folders
    const folders = await pgQuery<any>(
      `SELECT id, space_id, name, created_at
       FROM public.pms_folders
       ORDER BY name ASC`
    );

    // 3. Fetch lists
    const lists = await pgQuery<any>(
      `SELECT l.id, l.space_id, l.folder_id, l.name,
              s.name AS space_name,
              f.name AS folder_name
       FROM public.pms_lists_v2 l
       LEFT JOIN public.pms_spaces s ON s.id = l.space_id
       LEFT JOIN public.pms_folders f ON f.id = l.folder_id
       ORDER BY l.name ASC`
    );

    // 4. Fetch statuses
    const statuses = await pgQuery<any>(
      `SELECT id, space_id, name, category, color_hex, sort_order
       FROM public.pms_statuses
       ORDER BY space_id, sort_order ASC`
    );

    // 5. Fetch tasks
    const tasks = await pgQuery<any>(
      `SELECT
         t.id, t.list_id, t.parent_task_id, t.name, t.description,
         t.status_id, t.priority, t.start_date, t.due_date,
         COALESCE(t.time_estimate_ms, 0) as time_estimate_ms,
         t.sort_order, t.created_at, t.updated_at,
         l.space_id, l.folder_id, l.name as list_name,
         s.name as space_name,
         f.name as folder_name,
         st.name as status_name,
         st.category as status_category,
         st.color_hex as status_color
       FROM public.pms_tasks_v2 t
       JOIN public.pms_lists_v2 l ON l.id = t.list_id
       LEFT JOIN public.pms_spaces s ON s.id = l.space_id
       LEFT JOIN public.pms_folders f ON f.id = l.folder_id
       LEFT JOIN public.pms_statuses st ON st.id = t.status_id
       ORDER BY
         CASE t.priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'normal' THEN 3
           WHEN 'low' THEN 4
           ELSE 5
         END ASC,
         t.sort_order ASC,
         t.created_at DESC`
    );

    // 6. Fetch checklists, comments, dependencies
    const taskIds = tasks.map((t) => t.id);
    let checklists: any[] = [];
    let comments: any[] = [];
    let dependencies: any[] = [];

    if (taskIds.length > 0) {
      checklists = await pgQuery<any>(
        `SELECT id, task_id, name, is_completed, sort_order
         FROM public.pms_task_checklists
         WHERE task_id IN (SELECT (jsonb_array_elements_text($1::jsonb))::uuid)
         ORDER BY sort_order ASC, id ASC`,
        JSON.stringify(taskIds)
      );

      comments = await pgQuery<any>(
        `SELECT id, task_id, user_id, content, created_at
         FROM public.pms_task_comments
         WHERE task_id IN (SELECT (jsonb_array_elements_text($1::jsonb))::uuid)
         ORDER BY created_at ASC`,
        JSON.stringify(taskIds)
      );

      dependencies = await pgQuery<any>(
        `SELECT d.id, d.dependent_task_id, d.prerequisite_task_id, d.type,
                tp.name as prerequisite_task_name,
                td.name as dependent_task_name
         FROM public.pms_task_dependencies d
         LEFT JOIN public.pms_tasks_v2 tp ON tp.id = d.prerequisite_task_id
         LEFT JOIN public.pms_tasks_v2 td ON td.id = d.dependent_task_id
         WHERE d.dependent_task_id IN (SELECT (jsonb_array_elements_text($1::jsonb))::uuid)
            OR d.prerequisite_task_id IN (SELECT (jsonb_array_elements_text($1::jsonb))::uuid)`,
        JSON.stringify(taskIds)
      );
    }

    const clMap = new Map<string, PmsChecklistDTO[]>();
    for (const c of checklists) {
      const arr = clMap.get(c.task_id) || [];
      arr.push(c);
      clMap.set(c.task_id, arr);
    }

    const cmMap = new Map<string, PmsCommentDTO[]>();
    for (const m of comments) {
      const arr = cmMap.get(m.task_id) || [];
      arr.push(m);
      cmMap.set(m.task_id, arr);
    }

    const depMap = new Map<string, PmsDependencyDTO[]>();
    for (const d of dependencies) {
      const arr1 = depMap.get(d.dependent_task_id) || [];
      arr1.push(d);
      depMap.set(d.dependent_task_id, arr1);

      const arr2 = depMap.get(d.prerequisite_task_id) || [];
      if (!arr2.some(x => x.id === d.id)) {
        arr2.push(d);
        depMap.set(d.prerequisite_task_id, arr2);
      }
    }

    const hydratedTasks: PmsTaskDTO[] = tasks.map((t) => {
      const timeMs = Number(t.time_estimate_ms) || 0;
      return {
        id: t.id,
        list_id: t.list_id,
        space_id: t.space_id,
        folder_id: t.folder_id,
        parent_task_id: t.parent_task_id,
        name: t.name,
        description: t.description,
        status_id: t.status_id,
        status_name: t.status_name || "TO DO",
        status_category: t.status_category || "not_started",
        status_color: t.status_color || "#3B82F6",
        priority: t.priority || "normal",
        start_date: t.start_date,
        due_date: t.due_date,
        time_estimate_ms: timeMs,
        time_estimate_minutes: Math.round(timeMs / 60000),
        tags: ["sovereign", "sprint"],
        sort_order: t.sort_order || 0,
        created_at: t.created_at,
        updated_at: t.updated_at,
        space_name: t.space_name || "",
        list_name: t.list_name || "",
        folder_name: t.folder_name,
        checklists: clMap.get(t.id) || [],
        comments: cmMap.get(t.id) || [],
        dependencies: depMap.get(t.id) || [],
      };
    });

    // Assemble Space Hierarchy
    const nestedSpaces: PmsSpaceDTO[] = spaces.map((s) => {
      const spaceFolders = folders.filter((f) => f.space_id === s.id);
      const spaceLists = lists.filter((l) => l.space_id === s.id);
      const spaceStatuses = statuses.filter((st) => st.space_id === s.id);

      const folderDTOs: PmsFolderDTO[] = spaceFolders.map((f) => ({
        id: f.id,
        space_id: f.space_id,
        name: f.name,
        lists: spaceLists.filter((l) => l.folder_id === f.id),
      }));

      const directLists = spaceLists.filter((l) => !l.folder_id);

      return {
        id: s.id,
        workspace_id: s.workspace_id,
        name: s.name,
        color_hex: s.color_hex || "#3B82F6",
        icon: s.icon || "folder",
        is_private: s.is_private || false,
        folders: folderDTOs,
        lists: directLists,
        statuses: spaceStatuses,
      };
    });

    return NextResponse.json({
      spaces: nestedSpaces,
      lists,
      statuses,
      tasks: hydratedTasks,
    });
  } catch (error: any) {
    console.error("[GET /api/pms] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load Sovereign PMS" },
      { status: 500 }
    );
  }
}

// POST: Create space, folder, list, task, subtask, checklist, comment, dependency
export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = body?.action as string;

    // 1. Create Space
    if (action === "create_space") {
      const name = String(body.name || "").trim();
      const colorHex = String(body.color_hex || "#3B82F6");
      const icon = String(body.icon || "folder");
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      // Find workspace
      const ws = await pgQuery<any>(`SELECT id FROM public.pms_workspaces LIMIT 1`);
      const workspaceId = ws[0]?.id;

      const createdSpace = await pgQuery<any>(
        `INSERT INTO public.pms_spaces (workspace_id, name, color_hex, icon, is_private)
         VALUES ($1::uuid, $2, $3, $4, false)
         RETURNING *`,
        workspaceId, name, colorHex, icon
      );
      const spaceId = createdSpace[0].id;

      // Create default statuses
      const defaultStatuses = [
        { name: "NOT STARTED", cat: "not_started", color: "#64748B", sort: 0 },
        { name: "TO DO", cat: "not_started", color: "#3B82F6", sort: 1 },
        { name: "IN PROGRESS", cat: "active", color: "#F59E0B", sort: 2 },
        { name: "REVIEW", cat: "active", color: "#A855F7", sort: 3 },
        { name: "COMPLETE", cat: "closed", color: "#10B981", sort: 4 },
      ];
      for (const st of defaultStatuses) {
        await pgExec(
          `INSERT INTO public.pms_statuses (space_id, name, category, color_hex, sort_order)
           VALUES ($1::uuid, $2, $3::pms_status_category_enum, $4, $5)`,
          spaceId, st.name, st.cat, st.color, st.sort
        );
      }

      // Create default list
      const defaultList = await pgQuery<any>(
        `INSERT INTO public.pms_lists_v2 (space_id, name)
         VALUES ($1::uuid, $2)
         RETURNING *`,
        spaceId, `${name} Tasks`
      );

      return NextResponse.json({ space: createdSpace[0], list: defaultList[0] });
    }

    // 2. Create Folder / Epic
    if (action === "create_folder") {
      const spaceId = body.space_id;
      const name = String(body.name || "").trim();
      if (!spaceId || !name) return NextResponse.json({ error: "space_id and name required" }, { status: 400 });

      const folder = await pgQuery<any>(
        `INSERT INTO public.pms_folders (space_id, name)
         VALUES ($1::uuid, $2)
         RETURNING *`,
        spaceId, name
      );

      // Create default list in this folder
      const list = await pgQuery<any>(
        `INSERT INTO public.pms_lists_v2 (space_id, folder_id, name)
         VALUES ($1::uuid, $2::uuid, $3)
         RETURNING *`,
        spaceId, folder[0].id, `${name} Backlog`
      );

      return NextResponse.json({ folder: folder[0], list: list[0] });
    }

    // 3. Create List
    if (action === "create_list") {
      const spaceId = body.space_id;
      const folderId = body.folder_id || null;
      const name = String(body.name || "").trim();
      if (!spaceId || !name) return NextResponse.json({ error: "space_id and name required" }, { status: 400 });

      const list = await pgQuery<any>(
        `INSERT INTO public.pms_lists_v2 (space_id, folder_id, name)
         VALUES ($1::uuid, ${folderId ? `$2::uuid` : `NULL`}, ${folderId ? `$3` : `$2`})
         RETURNING *`,
        ...(folderId ? [spaceId, folderId, name] : [spaceId, name])
      );
      return NextResponse.json({ list: list[0] });
    }

    // 4. Create Task
    if (action === "create_task") {
      const name = String(body.name || "").trim();
      const listId = body.list_id;
      let statusId = body.status_id;
      const parentTaskId = body.parent_task_id || null;
      const description = body.description || body.markdown_description || null;
      const priority = body.priority || "normal";
      const startDate = body.start_date || null;
      const dueDate = body.due_date || null;
      const timeMs = Number(body.time_estimate_ms) || (Number(body.time_estimate_minutes) || 0) * 60000;

      if (!name) return NextResponse.json({ error: "Task name is required" }, { status: 400 });
      if (!listId) return NextResponse.json({ error: "list_id is required" }, { status: 400 });

      // If status_id not provided, look up first active or to-do status for this space
      if (!statusId) {
        const listRow = await pgQuery<any>(`SELECT space_id FROM public.pms_lists_v2 WHERE id = $1::uuid`, listId);
        if (listRow[0]?.space_id) {
          const st = await pgQuery<any>(
            `SELECT id FROM public.pms_statuses WHERE space_id = $1::uuid ORDER BY sort_order ASC LIMIT 1`,
            listRow[0].space_id
          );
          statusId = st[0]?.id;
        }
      }

      const task = await pgQuery<any>(
        `INSERT INTO public.pms_tasks_v2 (
           list_id, parent_task_id, name, description, status_id,
           priority, start_date, due_date, time_estimate_ms
         ) VALUES (
           $1::uuid,
           ${parentTaskId ? `$2::uuid` : `NULL`},
           ${parentTaskId ? `$3` : `$2`},
           ${parentTaskId ? `$4` : `$3`},
           ${parentTaskId ? `$5::uuid` : `$4::uuid`},
           ${parentTaskId ? `$6::pms_priority_enum` : `$5::pms_priority_enum`},
           ${parentTaskId ? `$7::timestamptz` : `$6::timestamptz`},
           ${parentTaskId ? `$8::timestamptz` : `$7::timestamptz`},
           ${parentTaskId ? `$9` : `$8`}
         )
         RETURNING *`,
        ...(parentTaskId
          ? [listId, parentTaskId, name, description, statusId, priority, startDate, dueDate, timeMs]
          : [listId, name, description, statusId, priority, startDate, dueDate, timeMs])
      );

      // Add checklists if provided
      if (Array.isArray(body.checklists)) {
        let order = 0;
        for (const item of body.checklists) {
          const label = typeof item === "string" ? item : item?.name;
          if (label && label.trim()) {
            await pgExec(
              `INSERT INTO public.pms_task_checklists (task_id, name, is_completed, sort_order)
               VALUES ($1::uuid, $2, false, $3)`,
              task[0].id, label.trim(), order++
            );
          }
        }
      }

      return NextResponse.json({ task: task[0] });
    }

    // 5. Add Checklist
    if (action === "add_checklist") {
      const taskId = body.task_id;
      const name = String(body.name || "").trim();
      if (!taskId || !name) return NextResponse.json({ error: "task_id and name required" }, { status: 400 });

      const row = await pgQuery<any>(
        `INSERT INTO public.pms_task_checklists (task_id, name, is_completed, sort_order)
         VALUES ($1::uuid, $2, false, (
           SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.pms_task_checklists WHERE task_id = $1::uuid
         ))
         RETURNING *`,
        taskId, name
      );
      return NextResponse.json({ checklist: row[0] });
    }

    // 6. Add Comment
    if (action === "add_comment") {
      const taskId = body.task_id;
      const content = String(body.content || "").trim();
      if (!taskId || !content) return NextResponse.json({ error: "task_id and content required" }, { status: 400 });

      const comment = await pgQuery<any>(
        `INSERT INTO public.pms_task_comments (task_id, user_id, content)
         VALUES ($1::uuid, NULL, $2)
         RETURNING *`,
        taskId, content
      );
      return NextResponse.json({ comment: comment[0] });
    }

    // 7. Add Dependency
    if (action === "add_dependency") {
      const dependentId = body.dependent_task_id;
      const prereqId = body.prerequisite_task_id;
      const depType = body.type || "blocking";
      if (!dependentId || !prereqId) return NextResponse.json({ error: "both task IDs required" }, { status: 400 });

      const dep = await pgQuery<any>(
        `INSERT INTO public.pms_task_dependencies (dependent_task_id, prerequisite_task_id, type)
         VALUES ($1::uuid, $2::uuid, $3::pms_dependency_type_enum)
         RETURNING *`,
        dependentId, prereqId, depType
      );
      return NextResponse.json({ dependency: dep[0] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/pms] Error:", error);
    return NextResponse.json({ error: error?.message || "Operation failed" }, { status: 500 });
  }
}

// PATCH: Update task, move status, toggle checklist
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action as string;

    // 1. Move Status
    if (action === "move_status") {
      const taskId = body.task_id;
      const statusId = body.status_id;
      if (!taskId || !statusId) return NextResponse.json({ error: "task_id and status_id required" }, { status: 400 });

      await pgExec(
        `UPDATE public.pms_tasks_v2
         SET status_id = $1::uuid, updated_at = NOW()
         WHERE id = $2::uuid`,
        statusId, taskId
      );
      return NextResponse.json({ success: true });
    }

    // 2. Toggle Checklist Item
    if (action === "toggle_checklist") {
      const checklistId = body.checklist_id;
      const isCompleted = Boolean(body.is_completed);
      if (!checklistId) return NextResponse.json({ error: "checklist_id required" }, { status: 400 });

      await pgExec(
        `UPDATE public.pms_task_checklists
         SET is_completed = $1
         WHERE id = $2::uuid`,
        isCompleted, checklistId
      );
      return NextResponse.json({ success: true, is_completed: isCompleted });
    }

    // 3. Update Task Properties
    if (action === "update_task") {
      const taskId = body.task_id;
      if (!taskId) return NextResponse.json({ error: "task_id required" }, { status: 400 });

      const updates: string[] = ["updated_at = NOW()"];
      const params: any[] = [taskId];

      if (body.name !== undefined) {
        updates.push(`name = $${params.length + 1}`);
        params.push(String(body.name).trim());
      }
      if (body.description !== undefined) {
        updates.push(`description = $${params.length + 1}`);
        params.push(body.description);
      }
      if (body.status_id !== undefined) {
        updates.push(`status_id = $${params.length + 1}::uuid`);
        params.push(body.status_id);
      }
      if (body.priority !== undefined) {
        updates.push(`priority = $${params.length + 1}::pms_priority_enum`);
        params.push(body.priority);
      }
      if (body.start_date !== undefined) {
        updates.push(`start_date = $${params.length + 1}::timestamptz`);
        params.push(body.start_date);
      }
      if (body.due_date !== undefined) {
        updates.push(`due_date = $${params.length + 1}::timestamptz`);
        params.push(body.due_date);
      }
      if (body.time_estimate_ms !== undefined) {
        updates.push(`time_estimate_ms = $${params.length + 1}`);
        params.push(body.time_estimate_ms);
      } else if (body.time_estimate_minutes !== undefined) {
        updates.push(`time_estimate_ms = $${params.length + 1}`);
        params.push((Number(body.time_estimate_minutes) || 0) * 60000);
      }

      await pgExec(
        `UPDATE public.pms_tasks_v2
         SET ${updates.join(", ")}
         WHERE id = $1::uuid`,
        ...params
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown PATCH action" }, { status: 400 });
  } catch (error: any) {
    console.error("[PATCH /api/pms] Error:", error);
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  }
}

// DELETE: Delete task, checklist, comment, dependency
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const checklistId = searchParams.get("checklistId");
    const commentId = searchParams.get("commentId");
    const dependencyId = searchParams.get("dependencyId");

    if (taskId) {
      await pgExec(`DELETE FROM public.pms_task_checklists WHERE task_id = $1::uuid`, taskId);
      await pgExec(`DELETE FROM public.pms_task_comments WHERE task_id = $1::uuid`, taskId);
      await pgExec(`DELETE FROM public.pms_task_dependencies WHERE dependent_task_id = $1::uuid OR prerequisite_task_id = $1::uuid`, taskId);
      await pgExec(`DELETE FROM public.pms_tasks_v2 WHERE parent_task_id = $1::uuid`, taskId);
      await pgExec(`DELETE FROM public.pms_tasks_v2 WHERE id = $1::uuid`, taskId);
      return NextResponse.json({ success: true, deletedTaskId: taskId });
    }

    if (checklistId) {
      await pgExec(`DELETE FROM public.pms_task_checklists WHERE id = $1::uuid`, checklistId);
      return NextResponse.json({ success: true, deletedChecklistId: checklistId });
    }

    if (commentId) {
      await pgExec(`DELETE FROM public.pms_task_comments WHERE id = $1::uuid`, commentId);
      return NextResponse.json({ success: true, deletedCommentId: commentId });
    }

    if (dependencyId) {
      await pgExec(`DELETE FROM public.pms_task_dependencies WHERE id = $1::uuid`, dependencyId);
      return NextResponse.json({ success: true, deletedDependencyId: dependencyId });
    }

    return NextResponse.json({ error: "Missing ID to delete" }, { status: 400 });
  } catch (error: any) {
    console.error("[DELETE /api/pms] Error:", error);
    return NextResponse.json({ error: error?.message || "Delete failed" }, { status: 500 });
  }
}

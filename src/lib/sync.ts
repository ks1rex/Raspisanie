import { supabase } from './supabase'
import { Workplace, Employee } from '../types'

const NOT_CONFIGURED = 'Supabase не настроен'
const BOT_NOT_CONFIGURED = 'VITE_BOT_URL не настроен'

export async function sendScheduleToBot(scheduleText: string): Promise<{ success: boolean; error?: string }> {
  const botUrl = import.meta.env.VITE_BOT_URL
  if (!botUrl) return { success: false, error: BOT_NOT_CONFIGURED }
  try {
    const res = await fetch(`${botUrl.replace(/\/$/, '')}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_NOTIFY_SECRET}`,
      },
      body: JSON.stringify({ text: scheduleText }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function pushToCloud(
  workplaces: Workplace[],
  employees: Employee[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: NOT_CONFIGURED }
  try {
    // 1. workplaces по name
    const { data: wpRows, error: wpErr } = await supabase
      .from('workplaces')
      .upsert(workplaces.map(w => ({ name: w.name })), { onConflict: 'name' })
      .select()
    if (wpErr) {
      console.error('[pushToCloud] шаг 1 (workplaces) упал:', wpErr)
      throw wpErr
    }
    const wpIdByName = new Map(wpRows!.map(r => [r.name, r.id]))

    // 2. roles по (workplace_id, name)
    const roleRows = workplaces.flatMap(w =>
      w.roles.map(r => ({ workplace_id: wpIdByName.get(w.name), name: r.name, count: r.count }))
    )
    const { data: roleData, error: roleErr } = await supabase
      .from('roles')
      .upsert(roleRows, { onConflict: 'workplace_id,name' })
      .select()
    if (roleErr) {
      console.error('[pushToCloud] шаг 2 (roles) упал:', roleErr)
      throw roleErr
    }
    const roleIdByKey = new Map(roleData!.map(r => [`${r.workplace_id}|${r.name}`, r.id]))

    // локальный roleId -> (имя места, имя роли) для резолва скиллов
    const localRole = new Map<string, { wpName: string; roleName: string }>()
    workplaces.forEach(w => w.roles.forEach(r => localRole.set(r.id, { wpName: w.name, roleName: r.name })))

    // 3. employees по name
    const { data: empRows, error: empErr } = await supabase
      .from('employees')
      .upsert(employees.map(e => ({ name: e.name, priority: e.priority })), { onConflict: 'name' })
      .select()
    if (empErr) {
      console.error('[pushToCloud] шаг 3 (employees) упал:', empErr)
      throw empErr
    }
    const empIdByName = new Map(empRows!.map(r => [r.name, r.id]))

    // 4. skills по (employee_id, role_id); role_id ищем по месту+роли
    const skillRows = employees.flatMap(e =>
      e.skills.map(s => {
        const lr = localRole.get(s.roleId)
        if (!lr) return null
        const roleId = roleIdByKey.get(`${wpIdByName.get(lr.wpName)}|${lr.roleName}`)
        if (!roleId) return null
        return { employee_id: empIdByName.get(e.name), role_id: roleId, priority: s.priority }
      }).filter((x): x is NonNullable<typeof x> => x !== null)
    )
    if (skillRows.length) {
      const { error: skErr } = await supabase
        .from('skills')
        .upsert(skillRows, { onConflict: 'employee_id,role_id' })
      if (skErr) {
        console.error('[pushToCloud] шаг 4 (skills) упал:', skErr)
        throw skErr
      }
    }

    return { success: true }
  } catch (e) {
    const err = e as { message?: string; details?: string; hint?: string; code?: string }
    console.error('[pushToCloud] полная ошибка от Supabase:', {
      message: err.message,
      details: err.details,
      hint: err.hint,
      code: err.code,
      raw: e,
    })
    return { success: false, error: err.message || String(e) }
  }
}

export async function pullFromCloud(): Promise<{
  workplaces: Workplace[]
  employees: Employee[]
  error?: string
}> {
  if (!supabase) return { workplaces: [], employees: [], error: NOT_CONFIGURED }
  try {
    const { data: wps, error: e1 } = await supabase
      .from('workplaces')
      .select('id, name, roles(id, name, count)')
    if (e1) throw e1

    const { data: emps, error: e2 } = await supabase
      .from('employees')
      .select('id, name, priority, skills(role_id, priority, roles(workplace_id))')
    if (e2) throw e2

    const workplaces: Workplace[] = (wps || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      roles: (w.roles || []).map((r: any) => ({ id: r.id, name: r.name, count: r.count })),
    }))

    const employees: Employee[] = (emps || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      priority: e.priority,
      skills: (e.skills || []).map((s: any) => ({
        workplaceId: s.roles?.workplace_id,
        roleId: s.role_id,
        priority: s.priority,
      })),
    }))

    return { workplaces, employees }
  } catch (e) {
    return { workplaces: [], employees: [], error: (e as Error).message }
  }
}

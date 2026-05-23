// extend 字段在后端是原 JSON 字符串（不参与 WHERE / 不建索引），前端按需 parse
export function parseExtend<T extends Record<string, unknown> = Record<string, unknown>>(
  raw: string | null | undefined,
): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    // 静默吞掉 — 非法 JSON 视作"无扩展字段"
  }
  return null;
}

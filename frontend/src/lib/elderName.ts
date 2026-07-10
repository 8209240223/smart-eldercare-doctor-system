export interface ElderNameRecord {
  id?: number;
  name?: string;
}

export function createElderNameMap(elders: ElderNameRecord[] = []) {
  return new Map(
    elders
      .filter((elder) => elder.id != null && elder.name?.trim())
      .map((elder) => [Number(elder.id), elder.name!.trim()]),
  );
}

export function resolveElderName(
  elderName: unknown,
  elderId: unknown,
  elderNames?: Map<number, string>,
) {
  const providedName = typeof elderName === "string" ? elderName.trim() : "";
  if (providedName) return providedName;

  const normalizedId = Number(elderId);
  if (Number.isFinite(normalizedId)) {
    const mappedName = elderNames?.get(normalizedId)?.trim();
    if (mappedName) return mappedName;
  }

  return "姓名未同步";
}

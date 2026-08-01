export interface SnapshotRow {
  id: string;
  observedAt: string;
  value: number;
}

export interface ImportResult {
  accepted: boolean;
  rows: SnapshotRow[];
  errors: string[];
}

export function applyImportSnapshot(
  previous: SnapshotRow[],
  candidate: SnapshotRow[],
): ImportResult {
  const errors: string[] = [];
  const ids = new Set<string>();

  candidate.forEach((row, index) => {
    if (!row.id.trim()) errors.push(`row ${index + 1}: missing id`);
    if (ids.has(row.id))
      errors.push(`row ${index + 1}: duplicate id ${row.id}`);
    ids.add(row.id);
    if (Number.isNaN(Date.parse(row.observedAt))) {
      errors.push(`row ${index + 1}: invalid observedAt`);
    }
    if (!Number.isFinite(row.value))
      errors.push(`row ${index + 1}: invalid value`);
  });

  return errors.length > 0
    ? { accepted: false, rows: previous, errors }
    : { accepted: true, rows: candidate, errors: [] };
}

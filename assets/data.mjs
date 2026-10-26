export const STATES = { observed: 'Observed', not_measured: 'Not measured', failed: 'Failed', low_depth: 'Low depth' };
export function filterFeatures(release, { q = '', module = '', type = '', sort = 'name' } = {}) {
  const term = q.trim().toLowerCase();
  const available = new Map(), primary = new Map(release.features.map(f => [f.id, f.primary_channel_id]));
  for (const m of release.measurements) {
    if (m.channel_id === primary.get(m.feature_id) && m.state === 'observed') available.set(m.feature_id, (available.get(m.feature_id) || 0) + 1);
  }
  return release.features.filter(f => (!module || f.module_id === module) && (!type || f.type === type) &&
    (!term || [f.id, f.name, f.type, f.gene_label || ''].some(v => v.toLowerCase().includes(term))))
    .map(f => ({ ...f, available_samples: available.get(f.id) || 0 }))
    .sort((a, b) => sort === 'availability' ? b.available_samples - a.available_samples || a.id.localeCompare(b.id) : a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
export function filterSamples(release, { q = '', study = '', biofluid = '' } = {}) {
  const term = q.trim().toLowerCase();
  return release.samples.filter(s => (!study || s.study_id === study) && (!biofluid || s.biofluid === biofluid) &&
    (!term || [s.id, s.study_id, s.group].some(v => v.toLowerCase().includes(term))));
}
export function paginate(items, requestedPage = 1, pageSize = 12) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(requestedPage)) || 1)), offset = (page - 1) * pageSize;
  return { items: items.slice(offset, offset + pageSize), page, pages, total: items.length, from: items.length ? offset + 1 : 0, to: Math.min(offset + pageSize, items.length) };
}
export function channelMeasurements(release, featureId, channelId) {
  return release.measurements.filter(m => m.feature_id === featureId && m.channel_id === channelId);
}
export function summarizeMeasurements(rows) {
  const values = rows.filter(m => m.state === 'observed' && Number.isFinite(m.value)).map(m => m.value).sort((a, b) => a - b);
  const n = values.length, mid = Math.floor(n / 2);
  return { observed: n, missing: rows.length - n, zeros: values.filter(v => v === 0).length,
    median: n ? n % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2 : null,
    min: n ? values[0] : null, max: n ? values[n - 1] : null };
}
function tsvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && /^[=+@-]/.test(text)) text = "'" + text;
  return /[\t\n\r"]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}
export function toTsv(rows, fields) {
  return fields.map(tsvCell).join('\t') + '\r\n' + rows.map(row => fields.map(key => tsvCell(row[key])).join('\t')).join('\r\n') + (rows.length ? '\r\n' : '');
}
export const SAMPLE_FIELDS = ['id', 'study_id', 'group', 'biofluid', 'subject_id', 'biosample_id', 'library_id', 'sequencing_run_id', 'library_type', 'identity_status', 'data_kind'];
export const FEATURE_FIELDS = ['id', 'revision_id', 'name', 'module_id', 'type', 'gene_label', 'reference_id', 'coordinates', 'primary_channel_id', 'channel_ids', 'annotation_note', 'data_kind'];
export const MEASUREMENT_FIELDS = ['feature_id', 'feature_revision_id', 'sample_id', 'channel_id', 'unit', 'value', 'state', 'data_kind'];

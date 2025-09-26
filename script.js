(() => {
  const fileInput = document.getElementById('fileInput');
  const fileMetaEl = document.getElementById('fileMeta');
  const mappingControlsEl = document.getElementById('mappingControls');
  const weekStartInput = document.getElementById('weekStart');
  const btnAutofillWeek = document.getElementById('btnAutofillWeek');
  const btnTransform = document.getElementById('btnTransform');
  const previewTable = document.getElementById('previewTable');
  const btnDownloadCsv = document.getElementById('btnDownloadCsv');
  const btnDownloadXlsx = document.getElementById('btnDownloadXlsx');

  /**
   * App state retained in-memory
   */
  const state = {
    workbook: null,
    rawRows: [], // parsed from first sheet
    headers: [],
    mapping: {
      date: '',        // Workforce date column name
      startTime: '',   // Workforce start time
      endTime: '',     // Workforce end time
      employee: '',    // Optional: employee name/id
      project: '',     // Optional: project/task
      activity: '',    // Optional: activity/description
      hours: '',       // Optional: if file already provides durations
    },
    weekStartIso: null, // yyyy-mm-dd string (Mon)
    transformedRows: [],
  };

  function setWeekStartFromDate(date) {
    // Force Monday as start of week using ISO week handling
    const d = dayjs(date);
    if (!d.isValid()) return;
    const monday = d.isoWeekday() === 1 ? d : d.isoWeekday(1);
    weekStartInput.value = monday.format('YYYY-MM-DD');
    state.weekStartIso = weekStartInput.value;
  }

  function detectLikelyHeaders(headers) {
    // Heuristics for Workforce column names
    const lower = headers.map(h => (h || '').toString());
    function find(keys) {
      const lc = lower.map(h => h.toLowerCase().trim());
      for (const key of keys) {
        const idx = lc.findIndex(h => h === key || h.includes(key));
        if (idx >= 0) return headers[idx];
      }
      return '';
    }
    return {
      date: find(['date', 'work date', 'day']),
      startTime: find(['start', 'from', 'start time']),
      endTime: find(['end', 'to', 'end time']),
      employee: find(['employee', 'user', 'name']),
      project: find(['project', 'job', 'client', 'customer']),
      activity: find(['activity', 'task', 'description', 'work type']),
      hours: find(['hours', 'duration']),
    };
  }

  function renderMappingControls() {
    if (!state.headers.length) {
      mappingControlsEl.innerHTML = '<p class="muted">Upload a file to configure mapping.</p>';
      return;
    }
    const fields = [
      { key: 'date', label: 'Date column (required)' },
      { key: 'startTime', label: 'Start time column' },
      { key: 'endTime', label: 'End time column' },
      { key: 'hours', label: 'Duration hours column (if present)' },
      { key: 'employee', label: 'Employee column (optional)' },
      { key: 'project', label: 'Project column (optional)' },
      { key: 'activity', label: 'Activity/Description column (optional)' },
    ];

    const options = ['<option value="">— Not used —</option>']
      .concat(state.headers.map(h => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`))
      .join('');

    mappingControlsEl.innerHTML = `
      <div class="mapping-grid">
        ${fields.map(f => `
          <div class="mapping-row">
            <label for="map-${f.key}">${f.label}</label>
            <select id="map-${f.key}">${options}</select>
          </div>`).join('')}
      </div>
    `;

    // Prefill with detections
    const detected = detectLikelyHeaders(state.headers);
    for (const [k, v] of Object.entries(detected)) {
      const sel = document.getElementById(`map-${k}`);
      if (sel && v) sel.value = v;
      state.mapping[k] = sel ? sel.value : '';
      sel?.addEventListener('change', () => {
        state.mapping[k] = sel.value;
        validateReadyToTransform();
      });
    }
    validateReadyToTransform();
  }

  function validateReadyToTransform() {
    const hasDate = !!state.mapping.date;
    btnTransform.disabled = !(hasDate && state.rawRows.length);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function readFile(file) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const headers = Object.keys(json[0] || {});

    state.workbook = wb;
    state.rawRows = json;
    state.headers = headers;
    fileMetaEl.textContent = `${file.name} • ${firstSheetName} • ${json.length} rows`;
    renderMappingControls();
  }

  function parseHoursFromTimes(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const base = '1970-01-01';
    const s = dayjs(`${base} ${startStr}`);
    let e = dayjs(`${base} ${endStr}`);
    if (!s.isValid() || !e.isValid()) return 0;
    // Handle overnight spans (end past midnight)
    if (e.isBefore(s)) e = e.add(1, 'day');
    const diffHours = e.diff(s, 'minute') / 60;
    return Math.max(0, diffHours);
  }

  function parseDateCell(value) {
    // Allow excel date objects, ISO strings, or dd/mm/yyyy etc via dayjs auto parse
    if (typeof value === 'number') {
      // Excel date serial to JS date
      const jsDate = XLSX.SSF.parse_date_code(value);
      if (!jsDate) return null;
      const d = dayjs(new Date(jsDate.y, jsDate.m - 1, jsDate.d));
      return d.isValid() ? d : null;
    }
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  function filterRowsToWeek(rows, weekStartIso) {
    if (!weekStartIso) return [];
    const start = dayjs(weekStartIso);
    const end = start.add(7, 'day');
    const dateKey = state.mapping.date;
    return rows.map(r => {
      const d = parseDateCell(r[dateKey]);
      return d ? { row: r, date: d } : null;
    }).filter(Boolean).filter(({ date }) => date.isSame(start) || (date.isAfter(start) && date.isBefore(end)));
  }

  function transformToDynamics(rows) {
    const dateKey = state.mapping.date;
    const startKey = state.mapping.startTime;
    const endKey = state.mapping.endTime;
    const hoursKey = state.mapping.hours;
    const employeeKey = state.mapping.employee;
    const projectKey = state.mapping.project;
    const activityKey = state.mapping.activity;

    const grouped = new Map();
    for (const { row, date } of rows) {
      const dateStr = date.format('YYYY-MM-DD');
      const employee = employeeKey ? String(row[employeeKey] || '') : '';
      const project = projectKey ? String(row[projectKey] || '') : '';
      const activity = activityKey ? String(row[activityKey] || '') : '';

      let hours = 0;
      if (hoursKey && row[hoursKey] !== undefined && row[hoursKey] !== '') {
        const parsed = parseFloat(String(row[hoursKey]).replace(',', '.'));
        hours = Number.isFinite(parsed) ? parsed : 0;
      } else if (startKey && endKey) {
        hours = parseHoursFromTimes(String(row[startKey]), String(row[endKey]));
      }

      const key = JSON.stringify([dateStr, employee, project, activity]);
      const prev = grouped.get(key) || { date: dateStr, employee, project, activity, hours: 0 };
      prev.hours += hours;
      grouped.set(key, prev);
    }

    // Build Dynamics import shape (example minimal): Date, Employee, Project, Activity, Hours
    return Array.from(grouped.values()).map((g) => ({
      Date: g.date,
      Employee: g.employee,
      Project: g.project,
      Activity: g.activity,
      Hours: Number(g.hours.toFixed(2)),
    }));
  }

  function renderPreview(rows) {
    if (!rows.length) {
      previewTable.innerHTML = '<tbody><tr><td class="muted">No rows</td></tr></tbody>';
      btnDownloadCsv.disabled = true;
      btnDownloadXlsx.disabled = true;
      return;
    }
    const headers = Object.keys(rows[0]);
    const thead = '<thead><tr>' + headers.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + rows.map(r => '<tr>' + headers.map(h => `<td>${escapeHtml(r[h])}</td>`).join('') + '</tr>').join('') + '</tbody>';
    previewTable.innerHTML = thead + tbody;
    btnDownloadCsv.disabled = false;
    btnDownloadXlsx.disabled = false;
  }

  function exportCsv(rows) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'dynamics_import.csv');
  }

  function exportXlsx(rows) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(new Blob([out], { type: 'application/octet-stream' }), 'dynamics_import.xlsx');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Events
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await readFile(file);
    // Try to infer week from min date
    const dateKey = state.mapping.date || detectLikelyHeaders(state.headers).date;
    const dates = state.rawRows.map(r => parseDateCell(r[dateKey])).filter(Boolean);
    if (dates.length) {
      const min = dates.reduce((a, b) => (a.isBefore(b) ? a : b));
      setWeekStartFromDate(min.format('YYYY-MM-DD'));
    }
  });

  btnAutofillWeek.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.rawRows.length) return;
    const dateKey = state.mapping.date || detectLikelyHeaders(state.headers).date;
    const dates = state.rawRows.map(r => parseDateCell(r[dateKey])).filter(Boolean);
    if (!dates.length) return;
    const min = dates.reduce((a, b) => (a.isBefore(b) ? a : b));
    setWeekStartFromDate(min.format('YYYY-MM-DD'));
  });

  weekStartInput.addEventListener('change', () => {
    state.weekStartIso = weekStartInput.value || null;
  });

  btnTransform.addEventListener('click', () => {
    const filtered = filterRowsToWeek(state.rawRows, state.weekStartIso);
    const transformed = transformToDynamics(filtered);
    state.transformedRows = transformed;
    renderPreview(transformed);
  });

  btnDownloadCsv.addEventListener('click', () => {
    if (state.transformedRows.length) exportCsv(state.transformedRows);
  });
  btnDownloadXlsx.addEventListener('click', () => {
    if (state.transformedRows.length) exportXlsx(state.transformedRows);
  });
})();


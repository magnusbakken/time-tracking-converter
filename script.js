(() => {
  const fileInput = document.getElementById('fileInput');
  const fileMetaEl = document.getElementById('fileMeta');
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
    rawRows: [], // Parsed from fixed columns: I (date), N (start), T (end)
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

  // No manual mapping needed; fixed columns are used

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function parseTimeToMinutes(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed && Number.isFinite(parsed.H) && Number.isFinite(parsed.M)) {
        return parsed.H * 60 + parsed.M;
      }
      if (value >= 0 && value <= 1) {
        return Math.round(value * 1440);
      }
      return null;
    }
    const raw = String(value).trim();
    if (!raw) return null;
    const normalized = raw.replace(',', '.');
    // Match HH.MM or HH:MM
    let m = normalized.match(/^\s*(\d{1,2})[\.:](\d{2})\s*$/);
    let hours, minutes;
    if (m) {
      hours = parseInt(m[1], 10);
      minutes = parseInt(m[2], 10);
    } else {
      // Fallback: just HH
      m = normalized.match(/^\s*(\d{1,2})\s*$/);
      if (!m) return null;
      hours = parseInt(m[1], 10);
      minutes = 0;
    }
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  async function readFile(file) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    // Fixed columns: I (8), N (13), T (19). Data starts at row 13 (index 12).
    const ref = ws['!ref'] || 'A1:A1';
    const range = XLSX.utils.decode_range(ref);
    const startRow = Math.max(12, range.s.r); // 0-based index for row 13
    const COL_I = 8;  // Arbeidsdato
    const COL_N = 13; // Inntid
    const COL_T = 19; // Ut-tid
    const rows = [];
    for (let r = startRow; r <= range.e.r; r++) {
      const dCell = ws[XLSX.utils.encode_cell({ r, c: COL_I })];
      const sCell = ws[XLSX.utils.encode_cell({ r, c: COL_N })];
      const eCell = ws[XLSX.utils.encode_cell({ r, c: COL_T })];
      const dVal = dCell ? dCell.v : '';
      const sVal = sCell ? sCell.v : '';
      const eVal = eCell ? eCell.v : '';
      const isAllEmpty = (dVal === '' || dVal === null || dVal === undefined)
        && (sVal === '' || sVal === null || sVal === undefined)
        && (eVal === '' || eVal === null || eVal === undefined);
      if (isAllEmpty) continue; // Skip empty rows but do not stop scanning
      rows.push({ date: dVal, startTime: sVal, endTime: eVal });
    }

    state.workbook = wb;
    state.rawRows = rows;
    fileMetaEl.textContent = `${file.name} • ${firstSheetName} • ${rows.length} rows`;
    btnTransform.disabled = !(state.rawRows.length);
  }

  function parseHoursFromTimes(startStr, endStr) {
    const startMin = parseTimeToMinutes(startStr);
    const endMin = parseTimeToMinutes(endStr);
    if (startMin === null || endMin === null) return 0;
    let diff = endMin - startMin;
    if (diff < 0) diff += 24 * 60; // overnight shift
    return Math.max(0, diff / 60);
  }

  function parseDateCell(value) {
    // Handle Excel serial, Norwegian DD.MM.YY or DD.MM.YYYY, or generic parse
    if (typeof value === 'number') {
      const jsDate = XLSX.SSF.parse_date_code(value);
      if (!jsDate) return null;
      const d = dayjs(new Date(jsDate.y, jsDate.m - 1, jsDate.d));
      return d.isValid() ? d : null;
    }
    if (typeof value === 'string') {
      const s = value.trim();
      const m = s.match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*$/);
      if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        let year = parseInt(m[3], 10);
        if (m[3].length === 2) year = 2000 + year; // Assume 2000-2099 for two-digit year

        // Validate explicit day/month ranges to avoid Date rollover (e.g., 32.01 -> 01 Feb)
        if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
        if (month < 1 || month > 12) return null;
        if (day < 1) return null;
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const monthLengths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const maxDay = monthLengths[month - 1];
        if (day > maxDay) return null;

        const d = dayjs(new Date(year, month - 1, day));
        return d.isValid() ? d : null;
      }
    }
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  function filterRowsToWeek(rows, weekStartIso) {
    if (!weekStartIso) return [];
    const start = dayjs(weekStartIso);
    const end = start.add(7, 'day');
    return rows.map(r => {
      const d = parseDateCell(r.date);
      return d ? { row: r, date: d } : null;
    }).filter(Boolean).filter(({ date }) => date.isSame(start) || (date.isAfter(start) && date.isBefore(end)));
  }

  function transformToDynamics(rows) {
    // Build Dynamics weekly format with two rows: work and lunch
    const weekStart = dayjs(state.weekStartIso);
    const totalsByDay = new Array(7).fill(0);

    for (const { row, date } of rows) {
      // Determine index 0..6 where 0 is Monday (weekStart)
      const dayIndex = Math.max(0, Math.min(6, date.diff(weekStart, 'day')));

      let hours = 0;
      hours = parseHoursFromTimes(row.startTime, row.endTime);
      if (Number.isFinite(hours) && hours > 0) {
        totalsByDay[dayIndex] += hours;
      }
    }

    // Normalize to up to 2 decimals
    const normalize = (n) => Number(n.toFixed(2));
    for (let i = 0; i < 7; i++) {
      totalsByDay[i] = totalsByDay[i] > 0 ? normalize(totalsByDay[i]) : 0;
    }

    const HOURS_COLS = ['HOURS', 'Hours2_', 'Hours3_', 'Hours4_', 'Hours5_', 'Hours6_', 'Hours7_'];
    const COMMENT_COLS = ['EXTERNALCOMMENTS', 'ExternalComments2_', 'ExternalComments3_', 'ExternalComments4_', 'ExternalComments5_', 'ExternalComments6_', 'ExternalComments7_'];

    const BASE_META = {
      ProjectDataAreaId: '110',
      ProjId: '11011127',
    };

    // Row 1: Work time
    const row1 = {
      LineNum: '1.0000000000000000',
      ...BASE_META,
      ACTIVITYNUMBER: 'A110015929',
    };
    // Initialize all day columns as empty strings to keep column order consistent
    for (let i = 0; i < 7; i++) {
      row1[HOURS_COLS[i]] = '';
      row1[COMMENT_COLS[i]] = '';
    }
    for (let i = 0; i < 7; i++) {
      if (totalsByDay[i] > 0) {
        row1[HOURS_COLS[i]] = normalize(totalsByDay[i]);
        row1[COMMENT_COLS[i]] = 'Development';
      }
    }

    // Row 2: Lunch 0.5 if any work that day
    const row2 = {
      LineNum: '2.0000000000000000',
      ...BASE_META,
      ACTIVITYNUMBER: 'A110015932',
    };
    for (let i = 0; i < 7; i++) {
      row2[HOURS_COLS[i]] = '';
      row2[COMMENT_COLS[i]] = '';
    }
    for (let i = 0; i < 7; i++) {
      if (totalsByDay[i] > 0) {
        row2[HOURS_COLS[i]] = 0.5;
        row2[COMMENT_COLS[i]] = 'Lunsj';
      }
    }

    return [row1, row2];
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
    const dates = state.rawRows.map(r => parseDateCell(r.date)).filter(Boolean);
    if (dates.length) {
      const min = dates.reduce((a, b) => (a.isBefore(b) ? a : b));
      setWeekStartFromDate(min.format('YYYY-MM-DD'));
    }
  });

  btnAutofillWeek.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.rawRows.length) return;
    const dates = state.rawRows.map(r => parseDateCell(r.date)).filter(Boolean);
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


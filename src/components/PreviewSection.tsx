import { HOURS_COLS, DYNAMICS_HEADERS } from '../utils/transformUtils';

interface DynamicsRow {
  LineNum: string;
  ProjectDataAreaId: string;
  ProjId: string;
  ACTIVITYNUMBER: string;
  [key: string]: string | number;
}

interface SimplifiedPreviewProps {
  rows: DynamicsRow[];
}

function SimplifiedPreview({ rows }: SimplifiedPreviewProps) {
  if (!rows.length) {
    return (
      <tbody>
        <tr>
          <td className="text-muted">No rows</td>
        </tr>
      </tbody>
    );
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const workRow = rows[0];
  const lunchRow = rows[1];

  const workHours = HOURS_COLS.map((col) => Number(workRow[col]) || 0);
  const lunchHours = HOURS_COLS.map((col) => Number(lunchRow[col]) || 0);
  const dailyTotals = workHours.map((h, i) => h + lunchHours[i]);

  const weeklyWorkTotal = workHours.reduce((sum, h) => sum + h, 0);
  const weeklyLunchTotal = lunchHours.reduce((sum, h) => sum + h, 0);
  const weeklyGrandTotal = weeklyWorkTotal + weeklyLunchTotal;

  const headers = ['', ...dayLabels, 'Week Total'];

  return (
    <>
      <thead>
        <tr className="bg-[#1a2332]">
          {headers.map((h, i) => (
            <th
              key={i}
              className="text-left px-4 py-3 font-semibold text-text border-b-2 border-border"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="hover:bg-[rgba(255,255,255,0.02)]">
          <td className="px-4 py-3 font-medium text-text border-b border-border">Invoiced</td>
          {workHours.map((val, i) => (
            <td
              key={i}
              className={`px-4 py-3 text-right border-b border-border ${
                val === 0 ? 'text-muted/40' : 'text-text'
              }`}
            >
              {val > 0 ? val.toFixed(2) : '?'}
            </td>
          ))}
          <td className="px-4 py-3 text-right font-semibold border-b border-border bg-[rgba(16,185,129,0.08)] text-accent">
            {weeklyWorkTotal.toFixed(2)}
          </td>
        </tr>
        <tr className="hover:bg-[rgba(255,255,255,0.02)]">
          <td className="px-4 py-3 font-medium text-text border-b border-border">Lunch</td>
          {lunchHours.map((val, i) => (
            <td
              key={i}
              className={`px-4 py-3 text-right border-b border-border ${
                val === 0 ? 'text-muted/40' : 'text-text'
              }`}
            >
              {val > 0 ? val.toFixed(2) : '?'}
            </td>
          ))}
          <td className="px-4 py-3 text-right font-semibold border-b border-border bg-[rgba(16,185,129,0.08)] text-accent">
            {weeklyLunchTotal.toFixed(2)}
          </td>
        </tr>
        <tr className="bg-[rgba(16,185,129,0.05)] hover:bg-[rgba(16,185,129,0.08)]">
          <td className="px-4 py-3 font-bold text-text border-t-2 border-accent/30">Total</td>
          {dailyTotals.map((val, i) => (
            <td
              key={i}
              className={`px-4 py-3 text-right font-semibold border-t-2 border-accent/30 ${
                val === 0 ? 'text-muted/40' : 'text-text'
              }`}
            >
              {val > 0 ? val.toFixed(2) : '?'}
            </td>
          ))}
          <td className="px-4 py-3 text-right font-bold border-t-2 border-accent/30 bg-[rgba(16,185,129,0.15)] text-accent">
            {weeklyGrandTotal.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </>
  );
}

interface RawPreviewProps {
  rows: DynamicsRow[];
}

function RawPreview({ rows }: RawPreviewProps) {
  if (!rows.length) {
    return (
      <tbody>
        <tr>
          <td className="text-muted">No rows</td>
        </tr>
      </tbody>
    );
  }

  const headers = DYNAMICS_HEADERS.filter((h) => h in rows[0]);

  return (
    <>
      <thead>
        <tr className="bg-[#1a2332]">
          {headers.map((h) => (
            <th
              key={h}
              className="text-left px-4 py-3 font-semibold text-text border-b-2 border-border whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx} className="hover:bg-[rgba(255,255,255,0.02)]">
            {headers.map((h) => (
              <td key={h} className="px-4 py-3 text-text border-b border-border whitespace-nowrap">
                {r[h]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );
}

interface PreviewSectionProps {
  rows: DynamicsRow[];
  viewMode: 'simplified' | 'raw';
  onViewModeChange: (mode: 'simplified' | 'raw') => void;
  onDownloadCsv: () => void;
  onDownloadXlsx: () => void;
}

export default function PreviewSection({
  rows,
  viewMode,
  onViewModeChange,
  onDownloadCsv,
  onDownloadXlsx,
}: PreviewSectionProps) {
  const hasRows = rows && rows.length > 0;

  return (
    <section className="bg-panel border border-border rounded-[10px] p-4 my-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-semibold m-0">4) Preview & Export</h2>
        <div className="flex gap-0 bg-[#0f1520] border border-border rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('simplified')}
            className={`px-4 py-1.5 text-sm transition-all duration-200 ${
              viewMode === 'simplified'
                ? 'bg-blue-500 text-white opacity-100'
                : 'bg-transparent text-muted hover:bg-[rgba(59,130,246,0.1)] hover:text-text'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => onViewModeChange('raw')}
            className={`px-4 py-1.5 text-sm transition-all duration-200 ${
              viewMode === 'raw'
                ? 'bg-blue-500 text-white opacity-100'
                : 'bg-transparent text-muted hover:bg-[rgba(59,130,246,0.1)] hover:text-text'
            }`}
          >
            Raw Export
          </button>
        </div>
      </div>

      <div className="overflow-auto border border-border rounded-lg">
        <table className="w-full border-collapse">
          {viewMode === 'simplified' ? (
            <SimplifiedPreview rows={rows} />
          ) : (
            <RawPreview rows={rows} />
          )}
        </table>
      </div>

      <div className="flex gap-3 mt-3">
        <button
          onClick={onDownloadCsv}
          disabled={!hasRows}
          className="bg-blue-500 text-white border-none rounded-lg px-3.5 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 hover:disabled:bg-blue-500"
        >
          Download CSV
        </button>
        <button
          onClick={onDownloadXlsx}
          disabled={!hasRows}
          className="bg-blue-500 text-white border-none rounded-lg px-3.5 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 hover:disabled:bg-blue-500"
        >
          Download XLSX
        </button>
      </div>
    </section>
  );
}

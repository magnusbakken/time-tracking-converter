import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';

interface WeekInfo {
  weekNum: number;
  year: number;
}

interface WeekSelectorProps {
  weekStart: string | null;
  onWeekChange: (weekStart: string) => void;
  weekInfo: WeekInfo | null;
  warningMessage: string | null;
}

export default function WeekSelector({
  weekStart,
  onWeekChange,
  weekInfo,
  warningMessage,
}: WeekSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (weekStart) {
      // Synchronize internal DatePicker state with parent-controlled weekStart prop
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(dayjs(weekStart).toDate());
    }
  }, [weekStart]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const d = dayjs(date);
      const monday = d.isoWeekday() === 1 ? d : d.isoWeekday(1);
      onWeekChange(monday.format('YYYY-MM-DD'));
    }
  };

  return (
    <section className="bg-panel border border-border rounded-[10px] p-4 my-4">
      <h2 className="text-xl font-semibold mb-4">2) Select Week</h2>

      {warningMessage && (
        <div className="bg-[#78350f] text-[#fef3c7] border border-[#92400e] rounded-md px-3 py-2.5 mb-3">
          {warningMessage}
        </div>
      )}

      <div className="flex gap-3 items-center">
        <label htmlFor="weekStart">Week starting (Mon):</label>
        <DatePicker
          id="weekStart"
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          calendarStartDay={1}
          className="bg-[#0f1520] text-text border border-border rounded-lg px-2.5 py-2 w-[140px]"
        />
      </div>

      {weekInfo && (
        <div className="text-muted text-sm mt-2">
          Week {weekInfo.weekNum}, {weekInfo.year}{' '}
          <span
            className="inline-block cursor-help text-blue-500 ml-1 text-[0.95em]"
            title="Week number follows the ISO 8601 standard"
          >
            ⓘ
          </span>
        </div>
      )}
    </section>
  );
}

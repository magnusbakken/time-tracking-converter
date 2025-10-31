import { useState } from 'react'
import * as XLSX from 'xlsx'
import Header from './components/Header'
import Footer from './components/Footer'
import UploadSection from './components/UploadSection'
import WeekSelector from './components/WeekSelector'
import TransformSection from './components/TransformSection'
import PreviewSection from './components/PreviewSection'
import { readFile, exportCsv, exportXlsx, downloadBlob } from './utils/excelUtils'
import { 
  parseDateCell, 
  setWeekStartFromDate, 
  getWeekInfo, 
  getCurrentWeekMonday,
  filterRowsToWeek,
  checkCurrentWeekInFile 
} from './utils/dateUtils'
import { transformToDynamics, DYNAMICS_HEADERS } from './utils/transformUtils'

interface RawRow {
  date: unknown
  startTime: unknown
  endTime: unknown
}

interface WeekInfo {
  weekNum: number
  year: number
}

interface DynamicsRow {
  LineNum: string
  ProjectDataAreaId: string
  ProjId: string
  ACTIVITYNUMBER: string
  [key: string]: string | number
}

function App() {
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [fileMeta, setFileMeta] = useState('')
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [transformedRows, setTransformedRows] = useState<DynamicsRow[]>([])
  const [viewMode, setViewMode] = useState<'simplified' | 'raw'>('simplified')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { rawRows: rows, fileName, sheetName } = await readFile(file)
      setRawRows(rows)
      setFileMeta(`${fileName} • ${sheetName} • ${rows.length} rows`)
      
      // Check if current week exists in file
      const { hasCurrentWeek, warningMessage: warning } = checkCurrentWeekInFile(rows, XLSX)
      setWarningMessage(warning)
      
      // Auto-select week
      const dates = rows.map(r => parseDateCell(r.date, XLSX)).filter((d): d is NonNullable<typeof d> => d !== null)
      if (dates.length) {
        let initialWeek: string
        if (hasCurrentWeek) {
          // Auto-select current week's Monday
          initialWeek = getCurrentWeekMonday()
        } else {
          // Fallback to minimum date in file
          const min = dates.reduce((a, b) => (a.isBefore(b) ? a : b))
          initialWeek = setWeekStartFromDate(min.format('YYYY-MM-DD')) || ''
        }
        setWeekStart(initialWeek)
        setWeekInfo(getWeekInfo(initialWeek))
      }
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please ensure it is a valid Excel or CSV file.')
    }
  }

  const handleWeekChange = (newWeekStart: string) => {
    setWeekStart(newWeekStart)
    setWeekInfo(getWeekInfo(newWeekStart))
  }

  const handleTransform = () => {
    if (!weekStart) return
    const filtered = filterRowsToWeek(rawRows, weekStart, XLSX)
    const transformed = transformToDynamics(filtered, weekStart, XLSX)
    setTransformedRows(transformed)
  }

  const handleDownloadCsv = () => {
    if (transformedRows.length) {
      const blob = exportCsv(transformedRows, DYNAMICS_HEADERS)
      downloadBlob(blob, 'dynamics_import.csv')
    }
  }

  const handleDownloadXlsx = () => {
    if (transformedRows.length) {
      const blob = exportXlsx(transformedRows, DYNAMICS_HEADERS)
      downloadBlob(blob, 'dynamics_import.xlsx')
    }
  }

  const handleViewModeChange = (mode: 'simplified' | 'raw') => {
    setViewMode(mode)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="w-[1000px] mx-auto px-4 flex-1">
        <UploadSection onFileChange={handleFileChange} fileMeta={fileMeta} />
        
        <WeekSelector
          weekStart={weekStart}
          onWeekChange={handleWeekChange}
          weekInfo={weekInfo}
          warningMessage={warningMessage}
        />
        
        <TransformSection
          onTransform={handleTransform}
          disabled={rawRows.length === 0}
        />
        
        <PreviewSection
          rows={transformedRows}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onDownloadCsv={handleDownloadCsv}
          onDownloadXlsx={handleDownloadXlsx}
        />
      </main>
      
      <Footer />
    </div>
  )
}

export default App

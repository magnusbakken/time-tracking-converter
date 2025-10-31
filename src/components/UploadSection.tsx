interface UploadSectionProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileMeta: string;
}

export default function UploadSection({ onFileChange, fileMeta }: UploadSectionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void onFileChange(e);
  };

  return (
    <section className="bg-panel border border-border rounded-[10px] p-4 my-4">
      <h2 className="text-xl font-semibold mb-4">1) Upload Workforce Excel</h2>
      <input
        type="file"
        id="fileInput"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="bg-[#0f1520] text-text border border-border rounded-lg px-2.5 py-2"
      />
      {fileMeta && <div className="text-muted mt-2">{fileMeta}</div>}
    </section>
  );
}

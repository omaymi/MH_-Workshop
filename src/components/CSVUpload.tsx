import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface CSVUploadProps {
  title: string;
  onDataParsed: (data: unknown[]) => void;
  uploaded: boolean;
}

export function CSVUpload({ title, onDataParsed, uploaded }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const parseCSV = (text: string): unknown[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      return obj;
    });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      onDataParsed(data);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
        isDragging ? 'border-blue-500 bg-blue-50' : uploaded ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center justify-center text-center">
        {uploaded ? (
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        ) : (
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

        {uploaded ? (
          <p className="text-sm text-green-600">Fichier chargé avec succès</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">
              Glissez-déposez votre fichier CSV ici
            </p>
            <p className="text-xs text-gray-400">ou cliquez pour parcourir</p>
          </>
        )}

        <FileText className="w-6 h-6 text-gray-300 mt-3" />
      </div>
    </div>
  );
}

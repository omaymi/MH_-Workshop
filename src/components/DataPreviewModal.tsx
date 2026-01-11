import { X, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface DataPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any[];
}

export function DataPreviewModal({ isOpen, onClose, title, data }: DataPreviewModalProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(lowerTerm)
            )
        );
    }, [data, searchTerm]);

    if (!isOpen) return null;

    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col gap-4 p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Search className="w-12 h-12 mb-3 text-gray-300" />
                            <p>Aucun résultat trouvé pour "{searchTerm}"</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {headers.map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 uppercase tracking-wider whitespace-nowrap"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        {headers.map((header) => (
                                            <td key={`${idx}-${header}`} className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                {row[header]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {filteredData.length} élément{filteredData.length > 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}


import React, { useState, useEffect, useRef } from 'react';
import { VocabEntry } from './types';
import { translateAndAnnotate, extractVocabFromSource } from './services/geminiService';

const App: React.FC = () => {
  // Load data dengan proteksi parsing (Fitur Anti-Refresh)
  const [entries, setEntries] = useState<VocabEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kamus_ai_data');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Gagal load data:", e);
      return [];
    }
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simpan ke localStorage setiap ada perubahan (Fitur Anti-Refresh)
  useEffect(() => {
    localStorage.setItem('kamus_ai_data', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = async () => {
    if (!inputValue.trim() || isProcessing) return;
    const englishWord = inputValue.trim();
    const newId = crypto.randomUUID();
    
    setEntries(prev => [{
      id: newId,
      english: englishWord,
      indonesian: 'Menerjemahkan...',
      isMemorized: false,
      note: 'Memproses...',
      isLoading: true
    }, ...prev]);
    
    setInputValue('');
    setIsProcessing(true);

    try {
      const result = await translateAndAnnotate(englishWord);
      setEntries(prev => prev.map(e => e.id === newId ? { ...e, ...result, isLoading: false } : e));
    } catch (error) {
      setEntries(prev => prev.map(e => e.id === newId ? { ...e, indonesian: 'Gagal', isLoading: false } : e));
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleBulkImport = async () => {
    if (!importValue.trim() || isImporting) return;
    setIsImporting(true);

    try {
      const result = await extractVocabFromSource(importValue);
      const newEntries: VocabEntry[] = result.words.map(w => ({
        id: crypto.randomUUID(),
        english: w.english,
        indonesian: w.indonesian,
        note: w.note,
        isMemorized: false,
        isLoading: false,
        isNew: true
      }));

      setEntries(prev => [...newEntries, ...prev]);
      setShowImportModal(false);
      setImportValue('');
      
      // Hapus status 'isNew' setelah 5 detik
      setTimeout(() => {
        setEntries(prev => prev.map(e => ({ ...e, isNew: false })));
      }, 5000);
      
    } catch (error) {
      alert("Maaf, AI gagal mengambil data dari sumber tersebut. Pastikan link dapat diakses publik atau teks tidak kosong.");
    } finally {
      setIsImporting(false);
    }
  };

  const clearAll = () => {
    if (confirm('Hapus semua hafalan?')) setEntries([]);
  };

  const total = entries.length;
  const memorizedCount = entries.filter(e => e.isMemorized).length;
  const progressPercentage = total > 0 ? Math.round((memorizedCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-blue-50/30 flex flex-col font-sans">
      {/* Header - Navy Blue */}
      <nav className="bg-blue-900 border-b border-blue-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-blue-500/20 shadow-lg">
              <i className="fas fa-brain text-blue-900"></i>
            </div>
            <span className="text-xl font-black text-white tracking-tight">Kamus<span className="text-blue-300">Pintar</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 bg-blue-800/50 px-4 py-2 rounded-2xl border border-blue-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-300 uppercase">Hafalan Kamu</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{memorizedCount}/{total} Kata</span>
                <div className="w-20 h-1.5 bg-blue-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 transition-all" style={{width: `${progressPercentage}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-blue-400 text-blue-950 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-300 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-wand-magic-sparkles"></i>
            <span className="hidden sm:inline">Import dari Link</span>
          </button>
        </div>
      </nav>

      {/* Hero / Input Section - Light Blue Background */}
      <header className="bg-white border-b border-blue-100 py-12 px-4 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-blue-900 mb-4">Tambahkan Kata Baru</h2>
          <p className="text-blue-500/80 mb-8">Ketik kata Inggris yang ingin kamu pelajari, AI akan memberikan konteksnya.</p>
          
          <div className="flex gap-2 p-2 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm focus-within:ring-2 ring-blue-500/20 transition-all">
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
              placeholder="Contoh: Resilience, Sophisticated..."
              className="flex-grow bg-transparent px-4 py-3 outline-none text-lg font-medium text-blue-900 placeholder:text-blue-300"
              disabled={isProcessing}
            />
            <button 
              onClick={handleAddEntry}
              disabled={isProcessing || !inputValue.trim()}
              className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-950 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
            >
              {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : 'Simpan'}
            </button>
          </div>
        </div>
      </header>

      {/* Table Section */}
      <main className="max-w-6xl w-full mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <i className="fas fa-list text-blue-500"></i>
            Daftar Kata ({total})
          </h3>
          {total > 0 && (
            <button onClick={clearAll} className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline transition-colors">Hapus Semua</button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-900/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-50/50 border-b border-blue-100">
                  <th className="px-6 py-4 text-xs font-bold text-blue-400 uppercase tracking-wider">Bahasa Inggris</th>
                  <th className="px-6 py-4 text-xs font-bold text-blue-400 uppercase tracking-wider">Terjemahan</th>
                  <th className="px-6 py-4 text-xs font-bold text-blue-400 uppercase tracking-wider">Keterangan AI</th>
                  <th className="px-6 py-4 text-xs font-bold text-blue-400 uppercase tracking-wider text-center">Hafal?</th>
                  <th className="px-6 py-4 text-xs font-bold text-blue-400 uppercase tracking-wider text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-blue-300 italic">
                      Belum ada kata. Coba ketik di atas atau import dari link!
                    </td>
                  </tr>
                ) : (
                  entries.map(entry => (
                    <tr key={entry.id} className={`group hover:bg-blue-50/30 transition-colors ${entry.isMemorized ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${entry.isMemorized ? 'text-blue-300 line-through opacity-50' : 'text-blue-900'}`}>
                            {entry.english}
                          </span>
                          {entry.isNew && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">BARU</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-semibold ${entry.isLoading ? 'text-blue-200 animate-pulse' : 'text-blue-800'}`}>
                          {entry.indonesian}
                        </span>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <p className="text-sm text-blue-500/80 leading-relaxed italic">{entry.note}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? {...e, isMemorized: !e.isMemorized} : e))}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            entry.isMemorized ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-50 text-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))}
                          className="text-blue-200 hover:text-rose-500 transition-colors p-2"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Import - Navy Theme */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-blue-50 flex justify-between items-center bg-blue-900 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-wand-magic-sparkles text-blue-300"></i>
                Import Cerdas AI
              </h3>
              <button onClick={() => !isImporting && setShowImportModal(false)} className="text-blue-300 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-blue-600 mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <i className="fas fa-info-circle mr-2"></i>
                Tempel link berita (BBC, CNN) atau teks panjang. AI akan memilihkan kosakata terbaik untuk dipelajari.
              </p>
              <textarea 
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                placeholder="Tempel Link Artikel atau Paragraf di sini..."
                className="w-full h-40 bg-blue-50/50 rounded-2xl p-4 border border-blue-100 focus:ring-2 ring-blue-500/20 outline-none resize-none mb-4 font-medium text-blue-900 placeholder:text-blue-300"
                disabled={isImporting}
              ></textarea>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-3 font-bold text-blue-400 hover:bg-blue-50 rounded-xl transition-all"
                  disabled={isImporting}
                >
                  Batal
                </button>
                <button 
                  onClick={handleBulkImport}
                  disabled={isImporting || !importValue.trim()}
                  className="flex-1 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  {isImporting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i>
                      Menganalisis Link...
                    </>
                  ) : (
                    <>Mulai Import</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-auto text-center py-10 text-blue-300 text-xs font-medium">
        <p>Data tersimpan otomatis di penyimpanan lokal browser.</p>
        <p className="mt-1 uppercase tracking-widest text-blue-400/60 font-bold">Powered by Gemini 3 & Google Search</p>
      </footer>
    </div>
  );
};

export default App;

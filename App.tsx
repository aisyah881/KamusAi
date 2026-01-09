
import React, { useState, useEffect, useRef } from 'react';
import { VocabEntry } from './types';
import { translateAndAnnotate } from './services/geminiService';

const App: React.FC = () => {
  // Load data from localStorage on initial render
  const [entries, setEntries] = useState<VocabEntry[]>(() => {
    const saved = localStorage.getItem('kamus_ai_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save data to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('kamus_ai_data', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const newId = crypto.randomUUID();
    const englishWord = inputValue.trim();
    
    // Optimistic UI: Add placeholder row
    const newEntry: VocabEntry = {
      id: newId,
      english: englishWord,
      indonesian: 'Sedang menerjemahkan...',
      isMemorized: false,
      note: 'Menghubungi AI...',
      isLoading: true
    };

    setEntries(prev => [newEntry, ...prev]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const result = await translateAndAnnotate(englishWord);
      setEntries(prev => prev.map(entry => 
        entry.id === newId 
          ? { ...entry, indonesian: result.translation, note: result.note, isLoading: false }
          : entry
      ));
    } catch (error) {
      setEntries(prev => prev.map(entry => 
        entry.id === newId 
          ? { ...entry, indonesian: 'Gagal', note: 'Terjadi kesalahan koneksi.', isLoading: false }
          : entry
      ));
    } finally {
      setIsProcessing(false);
      // Autofocus back to input
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEntry();
    }
  };

  const toggleMemorized = (id: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, isMemorized: !entry.isMemorized } : entry
    ));
  };

  const removeEntry = (id: string) => {
    if (window.confirm('Hapus kata ini?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const clearAll = () => {
    if (window.confirm('Hapus semua daftar kata? Tindakan ini tidak bisa dibatalkan.')) {
      setEntries([]);
    }
  };

  // Stats calculation
  const total = entries.length;
  const memorizedCount = entries.filter(e => e.isMemorized).length;
  const progressPercentage = total > 0 ? Math.round((memorizedCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Navbar / Header */}
      <nav className="bg-slate-900 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2 rounded-lg shadow-inner">
              <i className="fas fa-book-alphabet text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                KAMUS<span className="text-sky-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vocabulary Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
            <div className="text-center">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Progres Hafalan</span>
              <span className="font-bold text-sky-400">{memorizedCount} / {total}</span>
            </div>
            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-1000" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="font-bold text-sm">{progressPercentage}%</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8">
        
        {/* Search/Add Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">TAMBAH KATA BARU</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-language text-slate-300 group-focus-within:text-sky-500 transition-colors"></i>
              </div>
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Ketik kata Bahasa Inggris (contoh: 'Ambitious')..." 
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none transition-all text-lg font-medium shadow-inner"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                autoFocus
              />
            </div>
            <button 
              onClick={handleAddEntry}
              disabled={isProcessing || !inputValue.trim()}
              className="bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-sky-100 transition-all flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>PROSES...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  <span>TERJEMAHKAN</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400 italic flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            Tip: Tekan "Enter" pada keyboard untuk menambah kata dengan cepat.
          </p>
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-list-ul text-sky-500"></i>
            Daftar Kata Anda
          </h2>
          {entries.length > 0 && (
            <button 
              onClick={clearAll}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors px-3 py-1 bg-rose-50 rounded-lg"
            >
              <i className="fas fa-trash-alt"></i>
              HAPUS SEMUA
            </button>
          )}
        </div>

        {/* Vocabulary Table Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-5 px-6 font-bold uppercase text-[10px] tracking-widest w-16 text-center border-r border-slate-800">No</th>
                  <th className="py-5 px-6 font-bold uppercase text-[10px] tracking-widest w-1/4">English</th>
                  <th className="py-5 px-6 font-bold uppercase text-[10px] tracking-widest w-1/4">Indonesia</th>
                  <th className="py-5 px-6 font-bold uppercase text-[10px] tracking-widest text-center">Status</th>
                  <th className="py-5 px-6 font-bold uppercase text-[10px] tracking-widest">Keterangan</th>
                  <th className="py-5 px-6 font-bold uppercase text-[10px] tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <i className="fas fa-folder-open text-6xl text-slate-300"></i>
                        <div className="text-slate-500">
                          <p className="text-xl font-bold">Belum ada data</p>
                          <p className="text-sm">Mulai ketik kata di atas untuk belajar!</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr 
                      key={entry.id} 
                      className={`group hover:bg-sky-50/50 transition-all duration-300 ${entry.isMemorized ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="py-5 px-6 text-center text-slate-400 font-bold text-sm bg-slate-50/50 group-hover:bg-sky-100/50 border-r border-slate-100">
                        {entries.length - index}
                      </td>
                      <td className="py-5 px-6">
                        <span className={`text-lg font-bold block ${entry.isMemorized ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {entry.english}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        {entry.isLoading ? (
                          <div className="flex items-center gap-2 text-sky-500 font-medium animate-pulse">
                            <i className="fas fa-sparkles"></i>
                            Menerjemahkan...
                          </div>
                        ) : (
                          <span className="text-slate-700 font-semibold">{entry.indonesian}</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <button 
                          onClick={() => toggleMemorized(entry.id)}
                          aria-label="Toggle memorized"
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
                            entry.isMemorized 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 rotate-0' 
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400 -rotate-3'
                          }`}
                        >
                          <i className={`fas ${entry.isMemorized ? 'fa-check-circle text-xl' : 'fa-circle-check'}`}></i>
                        </button>
                      </td>
                      <td className="py-5 px-6">
                        <p className={`text-sm leading-relaxed ${entry.isLoading ? 'text-slate-300 italic' : 'text-slate-600'}`}>
                          {entry.note}
                        </p>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <button 
                          onClick={() => removeEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center mx-auto"
                          title="Hapus"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend / Info */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Sudah Hafal
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-slate-200"></span>
            Belum Hafal
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></span>
            Proses AI
          </div>
        </div>
      </main>

      <footer className="py-8 bg-slate-900 text-slate-500 text-center border-t border-slate-800">
        <p className="text-sm">© 2024 KamusAI Vocabulary Assistant</p>
        <p className="text-[10px] mt-1 font-bold tracking-widest opacity-50">BUILT WITH GOOGLE GEMINI AI TECHNOLOGY</p>
      </footer>
    </div>
  );
};

export default App;

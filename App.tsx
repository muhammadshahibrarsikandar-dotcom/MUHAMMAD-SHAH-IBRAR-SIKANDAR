
import React, { useState, useEffect, useRef } from 'react';
import { TranslationResult, TranslationMode } from './types';
import { SUPPORTED_LANGUAGES, APP_NAME } from './constants';
import LanguageDropdown from './components/LanguageDropdown';
import { translateText, translateImage, generateSpeech, playPCM } from './services/geminiService';

const App: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ur');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TranslationMode>('text');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced translation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim().length > 1 && mode === 'text') {
        handleTranslate();
      } else if (sourceText.trim() === '') {
        setTargetText('');
        setResult(null);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    try {
      const res = await translateText(sourceText, sourceLang, targetLang);
      setResult(res);
      setTargetText(res.translatedText);
    } catch (error) {
      console.error(error);
      setTargetText("Error translating. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMode('image');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await translateImage(base64, targetLang);
        setResult(res);
        setTargetText(res.translatedText);
        setSourceText("[Image Text Extracted]");
      } catch (error) {
        console.error(error);
        setTargetText("Failed to translate image.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSpeak = async () => {
    if (!targetText || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || 'English';
      const audioData = await generateSpeech(targetText, langName);
      if (audioData) {
        await playPCM(audioData);
      }
    } catch (error) {
      console.error("Speech error", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-blue-100">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10 mt-4 px-4">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl shadow-xl shadow-blue-200 group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{APP_NAME}</h1>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Universal AI</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-1 bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-sm">
          <button 
            onClick={() => setMode('text')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Text
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Camera / Photo
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative px-2">
        {/* Source Section */}
        <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 flex flex-col gap-6 border border-white/80 ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <LanguageDropdown 
              label="Input Language" 
              selected={sourceLang} 
              onChange={setSourceLang} 
            />
          </div>
          <textarea
            placeholder="Type your message here..."
            className="w-full h-48 md:h-72 bg-transparent border-none focus:ring-0 text-2xl font-medium text-slate-800 placeholder:text-slate-300 resize-none transition-all scrollbar-hide"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1 border-t border-slate-100 pt-4">
            <span>{sourceText.length} / 5000</span>
            <button 
              onClick={() => setSourceText('')}
              className="hover:text-red-500 transition-colors flex items-center gap-1"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Floating Swap Button for Desktop */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button 
            onClick={swapLanguages}
            className={`group bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 hover:scale-110 active:scale-95 transition-all duration-300 ${sourceLang === 'auto' ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={sourceLang === 'auto'}
          >
            <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </button>
        </div>

        {/* Mobile Swap Button */}
        <div className="lg:hidden flex justify-center -my-4 z-10">
           <button 
            onClick={swapLanguages}
            className={`bg-white p-4 rounded-full shadow-xl border border-slate-100 transition-all active:scale-90 ${sourceLang === 'auto' ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={sourceLang === 'auto'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        {/* Target Section */}
        <section className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-blue-100/40 p-8 flex flex-col gap-6 border border-blue-50/50 ring-1 ring-black/5 relative overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between">
            <LanguageDropdown 
              label="Output Language" 
              selected={targetLang} 
              onChange={setTargetLang} 
              excludeDetect 
            />
          </div>
          
          <div className="flex-1 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-slate-400">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600/60">Processing with Gemini</p>
              </div>
            ) : (
              <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={`text-2xl font-semibold ${targetText ? 'text-slate-800' : 'text-slate-300'}`}>
                  {targetText || "Your translation will blossom here..."}
                </div>
                
                {result?.transliteration && (
                  <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl text-base text-blue-800 border border-blue-100/50 shadow-sm">
                    <div className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-wider">Pronunciation</div>
                    {result.transliteration}
                  </div>
                )}
                
                {result?.contextNotes && (
                  <div className="mt-4 flex items-start gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs text-slate-500 font-medium leading-relaxed">{result.contextNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
            <div className="flex gap-2">
              <button 
                onClick={handleSpeak}
                disabled={!targetText || isLoading || isSpeaking}
                className={`p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl transition-all disabled:opacity-30 group shadow-sm border border-slate-100`}
                title="Listen to translation"
              >
                {isSpeaking ? (
                   <div className="flex items-center gap-1 h-5">
                    <div className="w-1 bg-blue-600 h-3 animate-bounce"></div>
                    <div className="w-1 bg-blue-600 h-5 animate-bounce delay-75"></div>
                    <div className="w-1 bg-blue-600 h-4 animate-bounce delay-150"></div>
                   </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(targetText);
                }}
                disabled={!targetText || isLoading}
                className="p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl transition-all disabled:opacity-30 group shadow-sm border border-slate-100"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
            
            <button 
               onClick={handleTranslate}
               disabled={!sourceText || isLoading}
               className="group relative px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50 overflow-hidden shadow-xl shadow-blue-200"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 transition-all group-hover:scale-110"></div>
              <span className="relative">Translate</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="mt-16 mb-8 text-center animate-in fade-in zoom-in duration-1000">
        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 inline-block max-w-2xl ring-1 ring-black/5">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Designed & Developed by</p>
          <h2 className="text-xl font-black text-slate-800 mb-6 drop-shadow-sm">M.SHAH IBRAR SIKANDAR</h2>
          
          <div className="flex flex-wrap gap-4 justify-center items-center px-4">
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-white shadow-sm">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">95+ Languages</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-white shadow-sm">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">Neural Voice</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-white shadow-sm">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">Image OCR</span>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-slate-200"></div>
            <p className="text-[9px] uppercase tracking-[0.5em] font-black text-slate-300">Powered by Gemini AI 2024</p>
            <div className="h-px w-12 bg-slate-200"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

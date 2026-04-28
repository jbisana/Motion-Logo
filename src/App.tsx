import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { 
  Sparkles, Loader2, Image as ImageIcon, Box, Wand2, CircleDot, 
  Settings, Download, Undo, Redo, X, SlidersHorizontal, Palette, LayoutTemplate, 
  Info, RotateCcw 
} from 'lucide-react';

type HistoryEntry = {
  url: string;
  prompt: string;
  style: string;
  color: string;
};

export default function App() {
  // Input states
  const [prompt, setPrompt] = useState('');
  const [styleOption, setStyleOption] = useState<'minimalist' | 'vintage' | 'modern' | 'abstract'>('minimalist');
  const [primaryColor, setPrimaryColor] = useState('#F27D26');
  
  // Settings & Configuration states
  const [animSpeed, setAnimSpeed] = useState(4); // seconds
  const [aiModel, setAiModel] = useState('gemini-2.0-flash-exp');
  const [userApiKey, setUserApiKey] = useState('');
  const [isTransparentBg, setIsTransparentBg] = useState(false);
  const [exportQuality, setExportQuality] = useState<'Standard' | 'High'>('High');
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG'>('PNG');
  const [animEasing, setAnimEasing] = useState<'easeInOut' | 'linear' | 'easeOut' | 'backInOut'>('easeInOut');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Process & UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animation, setAnimation] = useState<'float' | 'breathe' | 'spin' | 'flip'>('float');
  const [showSettings, setShowSettings] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // History states for Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const currentLogo = historyIndex >= 0 ? history[historyIndex].url : null;

  const generateLogo = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    
    try {
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key missing. Please provide it in settings.');
      }

      const ai = new GoogleGenAI({ apiKey });

      const finalPrompt = `A professional, high-quality vector-style logo design. Visual Style: ${styleOption}. Primary dominating color scheme/hue: ${primaryColor} (The logo must strongly feature this color). ${isTransparentBg ? 'Isolated on a clean transparent background.' : 'Isolated on a pristine solid white background.'} No text, words or typography unless explicitly requested. Description: ${prompt}`;

      let newUrl = '';
      let foundImage = false;

      if (aiModel.startsWith('imagen')) {
        const response = await ai.models.generateImages({
          model: aiModel,
          prompt: finalPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: exportFormat === 'JPG' ? 'image/jpeg' : 'image/png',
            aspectRatio: '1:1',
          },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          newUrl = `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
          foundImage = true;
        }
      } else {
        const response = await ai.models.generateContent({
          model: aiModel,
          contents: {
            parts: [{ text: finalPrompt }],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            newUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            foundImage = true;
            break;
          }
        }
      }
      
      if (!foundImage || !newUrl) {
        throw new Error('No logo was returned by the AI. Try a different model or rephrase your description.');
      }

      // Update History
      const newEntry: HistoryEntry = { url: newUrl, prompt, style: styleOption, color: primaryColor };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newEntry);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate logo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPrompt(state.prompt);
      setStyleOption(state.style as any);
      setPrimaryColor(state.color);
    }
  };

  const resetToInitial = () => {
    setPrompt('');
    setStyleOption('minimalist');
    setPrimaryColor('#F27D26');
    setAnimSpeed(4);
    setAnimation('float');
    setHistory([]);
    setHistoryIndex(-1);
    setError('');
    setIsLoading(false);
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPrompt(state.prompt);
      setStyleOption(state.style as any);
      setPrimaryColor(state.color);
    }
  };

  const executeDownload = () => {
    if (!currentLogo) return;

    if (exportFormat === 'SVG') {
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><image href="${currentLogo}" width="100%" height="100%"/></svg>`;
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logo-${styleOption}-${exportQuality.toLowerCase()}-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowDownloadConfirm(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const multiplier = exportQuality === 'High' ? 2 : 1;
      canvas.width = img.width * multiplier;
      canvas.height = img.height * multiplier;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw white background if JPG to prevent black transparency
        if (exportFormat === 'JPG') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mimeType = exportFormat === 'JPG' ? 'image/jpeg' : 'image/png';
        const scaledUrl = canvas.toDataURL(mimeType, 0.95);
        const link = document.createElement('a');
        link.href = scaledUrl;
        link.download = `logo-${styleOption}-${exportQuality.toLowerCase()}-${Date.now()}.${exportFormat.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowDownloadConfirm(false);
      }
    };
    img.src = currentLogo;
  };

  const mainBg = theme === 'dark' ? 'bg-[#050505]' : 'bg-[#FAFAFA]';
  const panelBg = theme === 'dark' ? 'bg-[#111]' : 'bg-white';
  const controlBg = theme === 'dark' ? 'bg-[#111]' : 'bg-[#F3F4F6]';
  const overlayBg = theme === 'dark' ? 'bg-black/60' : 'bg-white/60';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-gray-800';
  const textFaint = theme === 'dark' ? 'text-white/50' : 'text-gray-600';
  const borderMuted = theme === 'dark' ? 'border-white/10' : 'border-black/10';
  const borderColor = theme === 'dark' ? 'border-white/20' : 'border-black/10';
  const rightPaneBg = theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-gray-100';
  const cardBg = theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white/40 border-black/5';

  const getAnimationVariants = () => {
    switch (animation) {
      case 'breathe':
        return {
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: animSpeed * 0.75, repeat: Infinity, ease: animEasing }
        };
      case 'spin':
        return {
          animate: { rotate: [0, 360] },
          transition: { duration: animSpeed * 2, repeat: Infinity, ease: animEasing === 'easeInOut' ? 'linear' : animEasing }
        };
      case 'flip':
        return {
          animate: { rotateY: [0, 360] },
          transition: { duration: animSpeed, repeat: Infinity, ease: animEasing }
        };
      case 'float':
      default:
        return {
          animate: { y: [0, -20, 0] },
          transition: { duration: animSpeed, repeat: Infinity, ease: animEasing }
        };
    }
  };

  return (
    <div className={`min-h-screen ${mainBg} ${textPrimary} font-sans flex flex-col md:flex-row selection:bg-[#F27D26] selection:text-white transition-colors duration-500`}>
      
      {/* --- Overlay: About Modal --- */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`${panelBg} border ${borderColor} rounded-[32px] p-8 md:p-10 max-w-lg w-full shadow-2xl relative overflow-hidden`}
            >
              <button 
                onClick={() => setShowAbout(false)} 
                className={`absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 ${textMuted} transition`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-serif tracking-tight mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F27D26]/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#F27D26]" />
                    </div>
                    Motion Logo
                  </h3>
                  <p className={`${textMuted} text-sm leading-relaxed`}>
                    An AI-driven design laboratory that bridges static iconography with procedural motion.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs uppercase tracking-widest font-bold">
                  <div className="space-y-3">
                    <h4 className="text-[#F27D26]">Features</h4>
                    <ul className={`space-y-2 ${textMuted} list-disc pl-4 opacity-90`}>
                      <li>Multi-style Synthesis</li>
                      <li>High-Res SVG & PNG Export</li>
                      <li>Real-time Motion Labs</li>
                      <li>Cloud History Engine</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[#F27D26]">Limitations</h4>
                    <ul className={`space-y-2 ${textMuted} list-disc pl-4 opacity-90`}>
                      <li>Iconography Focus (No Text)</li>
                      <li>Flat Vector Bias</li>
                      <li>Wait times vary by load</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-[10px] uppercase tracking-tighter text-[#F27D26] mb-2 font-bold">Disclaimer</h4>
                  <p className={`${textMuted} text-[10px] leading-relaxed italic opacity-80`}>
                    Generated assets are created via large-scale generative models. Quality and visual accuracy depend strictly on the complexity and clarity of user-provided descriptions.
                  </p>
                </div>

                <div className={`pt-8 flex flex-col items-center gap-1.5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                  <p className={`text-[10px] uppercase tracking-[0.25em] font-black ${textPrimary}`}>Generated using Gemini AI Studio</p>
                  <p className={`text-[12px] italic font-serif font-bold ${textMuted}`}>Jeremy Bisana 2026</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Overlay: Settings Modal --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`${panelBg} border ${borderMuted} rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-colors`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-xl font-serif tracking-tight ${textPrimary} flex items-center gap-2`}>
                  <Settings className="w-5 h-5 text-[#F27D26]"/> Preferences
                </h3>
                <button onClick={() => setShowSettings(false)} className={`p-2 rounded-full hover:bg-black/5 ${textMuted} transition`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 flex justify-between items-center`}>
                    <span>API Key (Optional Override)</span>
                  </label>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={e => setUserApiKey(e.target.value)}
                    placeholder="sk-..."
                    className={`w-full ${controlBg} border ${borderMuted} rounded-xl px-4 py-3 text-sm ${textPrimary} placeholder:opacity-20 focus:outline-none focus:border-[#F27D26]/50 transition-colors`}
                  />
                  <p className={`${textFaint} text-[10px] font-medium`}>Leave empty to use the default environment API key.</p>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 block`}>AI Model Architecture</label>
                  <select
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    className={`w-full ${controlBg} border ${borderMuted} rounded-xl px-4 py-3 text-sm ${textPrimary} focus:outline-none focus:border-[#F27D26]/50 transition-colors appearance-none`}
                  >
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Fast)</option>
                    <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Legacy)</option>
                    <option value="imagen-3.0-generate-001">Imagen 3.0 Generate (Artistic)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 block`}>Background Isolation</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsTransparentBg(false)} className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-wider rounded-xl border transition-all ${!isTransparentBg ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10' : `${borderMuted} ${textMuted} ${controlBg} hover:${borderColor}`}`}>Solid White</button>
                    <button onClick={() => setIsTransparentBg(true)} className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-wider rounded-xl border transition-all ${isTransparentBg ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10' : `${borderMuted} ${textMuted} ${controlBg} hover:${borderColor}`}`}>Transparent</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 block`}>Interface Theme</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTheme('dark')} className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-wider rounded-xl border transition-all ${theme === 'dark' ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10' : `${borderMuted} ${textMuted} ${controlBg} hover:${borderColor}`}`}>Midnight</button>
                    <button onClick={() => setTheme('light')} className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-wider rounded-xl border transition-all ${theme === 'light' ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10' : `${borderMuted} ${textMuted} ${controlBg} hover:${borderColor}`}`}>Daylight</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 block`}>Animation Dynamics</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={animEasing} onChange={e => setAnimEasing(e.target.value as any)} className={`w-full ${controlBg} border ${borderMuted} rounded-xl px-4 py-3 text-sm ${textPrimary} focus:outline-none focus:border-[#F27D26]/50 transition-colors appearance-none`}>
                      <option value="easeInOut">Ease In Out (Smooth)</option>
                      <option value="linear">Linear (Constant)</option>
                      <option value="easeOut">Ease Out (Decelerate)</option>
                      <option value="backInOut">Back In Out (Spring)</option>
                    </select>
                    <div className="relative">
                      <input type="number" min="0.1" max="20" step="0.1" value={animSpeed} onChange={e => setAnimSpeed(parseFloat(e.target.value) || 1)} className={`w-full ${controlBg} border ${borderMuted} rounded-xl px-4 py-3 text-sm ${textPrimary} placeholder:opacity-20 focus:outline-none focus:border-[#F27D26]/50 transition-colors`} />
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${textFaint} text-[10px] font-bold`}>sec</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 block`}>Animation Presets</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button onClick={() => { setAnimation('float'); setAnimSpeed(4); setAnimEasing('easeInOut'); }} className={`py-2.5 font-bold text-[10px] uppercase tracking-tight rounded-xl border ${borderMuted} ${textMuted} ${controlBg} hover:border-[#F27D26]/50 hover:text-[#F27D26] transition`}>Subtle Bounce</button>
                    <button onClick={() => { setAnimation('spin'); setAnimSpeed(1); setAnimEasing('linear'); }} className={`py-2.5 font-bold text-[10px] uppercase tracking-tight rounded-xl border ${borderMuted} ${textMuted} ${controlBg} hover:border-[#F27D26]/50 hover:text-[#F27D26] transition`}>Energetic Spin</button>
                    <button onClick={() => { setAnimation('breathe'); setAnimSpeed(6); setAnimEasing('easeInOut'); }} className={`py-2.5 font-bold text-[10px] uppercase tracking-tight rounded-xl border ${borderMuted} ${textMuted} ${controlBg} hover:border-[#F27D26]/50 hover:text-[#F27D26] transition`}>Gentle Fade</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-bold mb-1 block`}>Export Format</label>
                  <div className="flex items-center gap-3">
                    {(['PNG', 'JPG', 'SVG'] as const).map(fmt => (
                      <button key={fmt} onClick={() => setExportFormat(fmt)} className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-wider rounded-xl border transition-all ${exportFormat === fmt ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10' : `${borderMuted} ${textMuted} ${controlBg} hover:${borderColor}`}`}>{fmt}</button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Overlay: Download Confirmation Modal --- */}
      <AnimatePresence>
        {showDownloadConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-[#F27D26]/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className={`text-lg font-bold ${textPrimary} mb-2 flex items-center gap-2`}>
                <Download className="w-5 h-5 text-[#F27D26]" /> Save to Device
              </h3>
              <p className={`text-sm ${textMuted} mb-2 leading-relaxed font-medium`}>
                You are about to download the generated logo.
              </p>

              <div className="space-y-2 mb-6 mt-4">
                <label className={`text-[10px] uppercase tracking-widest ${textFaint} font-black`}>Export Quality</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setExportQuality('Standard')} className={`flex-1 py-2 text-[10px] rounded-xl border transition-all uppercase tracking-widest ${exportQuality === 'Standard' ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10 font-black' : `${borderMuted} ${textMuted} hover:text-[#F27D26] font-bold`}`}>Standard (1x)</button>
                  <button onClick={() => setExportQuality('High')} className={`flex-1 py-2 text-[10px] rounded-xl border transition-all uppercase tracking-widest ${exportQuality === 'High' ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/10 font-black' : `${borderMuted} ${textMuted} hover:text-[#F27D26] font-bold`}`}>High Res (2x)</button>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowDownloadConfirm(false)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${textMuted} hover:${textPrimary} hover:bg-white/5 transition`}>
                  Cancel
                </button>
                <button onClick={executeDownload} className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#F27D26] hover:bg-[#e06c1b] text-white transition shadow-[0_0_20px_rgba(242,125,38,0.2)]">
                  Confirm Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Left Pane: Controls --- */}
      <div className={`w-full md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-center border-b md:border-b-0 md:border-r ${borderMuted} relative z-10 ${mainBg} overflow-y-auto transition-colors duration-500`}>
        {/* Top Left About Icon */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
          <button 
            onClick={() => setShowAbout(true)}
            className={`p-2.5 rounded-full ${controlBg} border ${borderMuted} ${textMuted} hover:text-[#F27D26] hover:border-[#F27D26]/30 transition-all shadow-sm flex items-center justify-center`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-md mx-auto w-full space-y-10">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`font-serif text-5xl md:text-7xl font-light tracking-tight mb-4 flex flex-col ${textPrimary}`}>
                <span className="italic opacity-80 text-[#F27D26]">Motion</span> 
                <span>Logo</span>
              </h1>
              <p className={`${textFaint} text-xs tracking-[0.2em] uppercase font-semibold`}>
                AI-Powered Aesthetic Identity
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className={`text-[10px] font-bold ${textMuted} uppercase tracking-[0.15em] pl-1 block`}>
                Company Description
              </label>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A minimal geometric coffee shop logo... (Focuses purely on Iconography)"
                  className={`w-full ${controlBg} border ${borderMuted} rounded-2xl p-5 ${textPrimary} placeholder:opacity-30 focus:outline-none focus:border-[#F27D26]/50 transition-all min-h-[120px] resize-none text-sm hover:${borderColor} shadow-sm leading-relaxed`}
                />
              </div>
            </div>

            {/* Modifiers Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Style Dropdown */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold ${textMuted} uppercase tracking-[0.15em] pl-1 flex items-center gap-1.5`}>
                  <LayoutTemplate className="w-3 h-3" /> Style
                </label>
                <div className="relative">
                  <select
                    value={styleOption}
                    onChange={(e) => setStyleOption(e.target.value as any)}
                    className={`w-full ${controlBg} border ${borderMuted} rounded-xl px-4 py-3 text-sm ${textPrimary} focus:outline-none focus:border-[#F27D26]/50 transition-colors appearance-none shadow-sm cursor-pointer`}
                  >
                    <option value="minimalist">Minimalist</option>
                    <option value="vintage">Vintage</option>
                    <option value="modern">Modern</option>
                    <option value="abstract">Abstract</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <span className={`text-[10px] ${textFaint}`}>▼</span>
                  </div>
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold ${textMuted} uppercase tracking-[0.15em] pl-1 flex justify-between items-center`}>
                  <span className="flex items-center gap-1.5"><Palette className="w-3 h-3" /> Primary</span>
                  <span className={`${textMuted} font-mono scale-90 opacity-60`}>{primaryColor.toUpperCase()}</span>
                </label>
                <div className={`relative w-full h-[46px] rounded-xl overflow-hidden border ${borderMuted} ${controlBg} group hover:border-[#F27D26]/50 hover:shadow-[0_0_10px_rgba(242,125,38,0.1)] transition-all shadow-sm`}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute -top-4 -left-4 w-32 h-32 cursor-pointer opacity-0 z-10"
                  />
                  <div className="absolute inset-0 pointer-events-none p-1.5">
                     <div className="w-full h-full rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center border border-black/10" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={generateLogo}
                disabled={isLoading || !prompt.trim()}
                className={`flex-1 relative overflow-hidden group bg-[#F27D26] hover:bg-[#e06c1b] disabled:opacity-40 text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all border outline-none border-[#F27D26] shadow-[0_10px_30px_rgba(242,125,38,0.2)] disabled:shadow-none font-bold tracking-wider`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Wand2 className="w-5 h-5 text-white" />
                  </motion.div>
                )}
                <span className="text-sm tracking-wide uppercase">
                  {isLoading ? 'Synthesizing...' : 'Craft Logo'}
                </span>
              </button>

              <button 
                 onClick={() => setShowSettings(true)}
                 className={`px-6 ${controlBg} border ${borderMuted} hover:border-[#F27D26]/50 rounded-2xl ${textMuted} hover:text-[#F27D26] transition-all shadow-sm flex items-center justify-center`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <button 
               onClick={resetToInitial}
               className={`w-full py-3 ${controlBg} border ${borderMuted} hover:border-red-500/30 rounded-2xl ${textMuted} hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Workspace
            </button>
            
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs tracking-wide p-4 bg-red-500/5 rounded-xl border border-red-500/10 shadow-sm font-medium">
                {error}
              </motion.div>
            )}
          </div>
          
          <AnimatePresence>
            {currentLogo && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`pt-8 border-t ${borderMuted} space-y-6`}
              >
                {/* Speed Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5 border border-[#F27D26]/40 text-[#F27D26] bg-[#F27D26]/10 px-2 py-0.5 rounded-full">
                      <SlidersHorizontal className="w-3 h-3" /> Motion Speed
                    </label>
                    <span className={`text-[10px] ${textFaint} font-mono tracking-wider`}>{animSpeed.toFixed(1)}s</span>
                  </div>
                  <div className="flex items-center gap-4 px-1">
                     <span className={`text-[10px] uppercase font-black ${textFaint} scale-90`}>Fast</span>
                     <input
                       type="range"
                       min="0.5"
                       max="10"
                       step="0.5"
                       value={animSpeed}
                       onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                       className={`w-full accent-[#F27D26] h-1.5 ${theme==='dark'?'bg-white/10':'bg-black/5'} rounded-full appearance-none cursor-pointer`}
                     />
                     <span className={`text-[10px] uppercase font-black ${textFaint} scale-90`}>Slow</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={`text-[10px] font-bold ${textMuted} uppercase tracking-[0.15em] pl-1 border-l-2 border-[#F27D26] leading-none mb-1`}>
                    Animation Pattern
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['float', 'breathe', 'spin', 'flip'] as const).map((anim) => (
                      <button
                        key={anim}
                        onClick={() => setAnimation(anim)}
                        className={`px-4 py-3 rounded-xl border text-[11px] tracking-widest uppercase font-bold flex items-center gap-2 transition-all ${
                          animation === anim 
                            ? 'border-[#F27D26] bg-[#F27D26]/10 text-[#F27D26] shadow-[0_4px_12px_rgba(242,125,38,0.15)]' 
                            : `${borderMuted} ${controlBg} hover:${borderColor} ${textMuted} opacity-70`
                        }`}
                      >
                        {anim === 'float' && <Box className="w-4 h-4" />}
                        {anim === 'breathe' && <Sparkles className="w-4 h-4" />}
                        {anim === 'spin' && <Wand2 className="w-4 h-4" />}
                        {anim === 'flip' && <ImageIcon className="w-4 h-4" />}
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Right Pane: Preview --- */}
      <div className={`w-full md:w-1/2 min-h-[50vh] p-8 md:p-16 flex items-center justify-center relative overflow-hidden ${rightPaneBg} transition-colors duration-500`}>
        
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-30 flex items-center gap-3">
          <div className={`flex ${controlBg} border ${borderMuted} rounded-full p-1 shadow-sm gap-1`}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0 || isLoading}
              className={`p-2.5 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all ${textMuted} hover:${textPrimary}`}
            >
              <Undo className="w-4 h-4" />
            </button>
            <div className={`w-[1px] ${borderMuted} border-l my-1`} />
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1 || isLoading}
              className={`p-2.5 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all ${textMuted} hover:${textPrimary}`}
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => currentLogo && setShowDownloadConfirm(true)}
            disabled={!currentLogo || isLoading}
            className="flex items-center gap-2 bg-[#F27D26] hover:bg-[#e06c1b] disabled:opacity-50 text-white rounded-full px-5 py-2.5 transition-colors shadow-[0_5px_15px_rgba(242,125,38,0.2)] disabled:shadow-none font-semibold text-[11px] uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export {exportFormat}</span>
          </button>
        </div>

        {/* Background atmospheric gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#F27D26]/20 to-purple-500/10 rounded-full blur-[120px] mix-blend-screen opacity-60" />
        </div>

        <div className={`relative z-10 w-full max-w-md aspect-square flex items-center justify-center border ${borderMuted} ${cardBg} backdrop-blur-2xl rounded-[40px] shadow-2xl transition-colors duration-500`}>
          <AnimatePresence mode="wait">
            {!currentLogo && !isLoading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`${textFaint} flex flex-col items-center gap-5`}
              >
                <div className={`w-24 h-24 rounded-[32px] border border-dashed ${borderMuted} flex items-center justify-center bg-black/5`}>
                  <ImageIcon className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase opacity-50">Canvas Ready</p>
              </motion.div>
            )}

            {isLoading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="relative"
                >
                  <CircleDot className="w-16 h-16 text-[#F27D26] opacity-80" />
                  <div className="absolute inset-0 border-[3px] border-dashed border-[#F27D26]/40 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                </motion.div>
                <p className="text-[#F27D26] font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">
                  Rendering Sequence
                </p>
              </motion.div>
            )}

            {currentLogo && !isLoading && (
              <motion.div
                key={`result-${historyIndex}`} // remount or re-enter nicely if moving across history
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full h-full flex items-center justify-center p-8"
              >
                <motion.div
                  {...getAnimationVariants()}
                  className="w-full relative aspect-square"
                >
                  {/* Outer subtle glow matching color slightly */}
                  <div className={`absolute inset-0 blur-3xl rounded-[32px] m-6 opacity-30 shadow-2xl pointer-events-none`} style={{ backgroundColor: history[historyIndex]?.color || '#fff' }} />
                  
                  {/* Image Container */}
                  <div className={`w-full h-full bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex items-center justify-center border border-black/10 relative z-10 ${isTransparentBg && theme === 'dark' && '!bg-[#111]'}`}>
                    {isTransparentBg && <div className={`absolute inset-0 ${theme === 'dark' ? 'opacity-[0.05]' : 'opacity-10'}`} style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, currentcolor 1px, transparent 1px)', backgroundSize: '20px 20px' }}/>}
                    <img
                      src={currentLogo}
                      alt={`Generated ${styleOption} Logo`}
                      className="w-[85%] h-[85%] object-contain relative z-10"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

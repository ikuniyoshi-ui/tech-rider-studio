
import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BandInfo, StageItem, ItemType, BandType, ConnectionType } from './types';
import { ITEM_DEFAULTS, CONNECTION_LABELS } from './constants';

const App: React.FC = () => {
  const [bandInfo, setBandInfo] = useState<BandInfo>({
    name: '',
    members: 3,
    type: 'BAND'
  });
  const [items, setItems] = useState<StageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const exportAreaRef = useRef<HTMLDivElement>(null);

  const applyTemplate = (type: BandType, members: number) => {
    let newItems: StageItem[] = [];
    const baseId = () => Math.random().toString(36).substr(2, 9);

    if (type === 'BAND') {
      newItems.push({ id: baseId(), type: 'DRUM', label: 'Drums', x: 50, y: 75, direction: 'CENTER', isBrought: false, connection: 'UNKNOWN' });
      newItems.push({ id: baseId(), type: 'VOCAL', label: 'Vo', x: 50, y: 25, direction: 'CENTER', isBrought: false, connection: 'UNKNOWN' });
      if (members >= 2) newItems.push({ id: baseId(), type: 'GUITAR', label: 'Gt', x: 25, y: 35, direction: 'RIGHT', isBrought: true, connection: 'AMP' });
      if (members >= 3) newItems.push({ id: baseId(), type: 'BASE', label: 'Ba', x: 75, y: 35, direction: 'LEFT', isBrought: true, connection: 'AMP' });
    } else if (type === 'ELECTRONIC') {
      newItems.push({ id: baseId(), type: 'PC', label: 'Laptop', x: 50, y: 50, direction: 'CENTER', isBrought: true, connection: 'DI' });
      newItems.push({ id: baseId(), type: 'VOCAL', label: 'Vo', x: 50, y: 25, direction: 'CENTER', isBrought: false, connection: 'UNKNOWN' });
      if (members >= 2) newItems.push({ id: baseId(), type: 'SYNTH', label: 'Keys', x: 20, y: 50, direction: 'CENTER', isBrought: true, connection: 'DI' });
    } else {
      newItems.push({ id: baseId(), type: 'PC', label: 'DJ Set', x: 50, y: 55, direction: 'CENTER', isBrought: true, connection: 'DI' });
    }
    setItems(newItems);
  };

  const handleAddItem = (type: ItemType) => {
    const newItem: StageItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: ITEM_DEFAULTS[type].label,
      x: 50,
      y: 50,
      direction: 'CENTER',
      isBrought: false,
      connection: ITEM_DEFAULTS[type].connection,
    };
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<StageItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setSelectedId(null);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!stageRef.current) return;
    setSelectedId(id);
    const rect = stageRef.current.getBoundingClientRect();
    const handleMove = (moveEvent: PointerEvent) => {
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      updateItem(id, { 
        x: Math.max(5, Math.min(95, x)), 
        y: Math.max(5, Math.min(95, y)) 
      });
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const generateCanvas = async () => {
    if (!exportAreaRef.current) return null;
    return await html2canvas(exportAreaRef.current, {
      backgroundColor: '#ffffff',
      scale: 3, // 高解像度
      logging: false,
      useCORS: true,
      onclone: (clonedDoc) => {
        const clonedArea = clonedDoc.querySelector('[data-export-container]') as HTMLElement;
        if (clonedArea) {
          clonedArea.style.backgroundColor = '#ffffff';
          clonedArea.style.color = '#000000';
          clonedArea.style.padding = '40px';
          
          const stage = clonedArea.querySelector('[data-stage]') as HTMLElement;
          if (stage) {
            stage.style.backgroundColor = '#ffffff';
            stage.style.borderColor = '#000000';
            stage.style.borderWidth = '2px';
            stage.style.backgroundImage = 'radial-gradient(#aaa 1px, transparent 1px)';
          }

          clonedArea.querySelectorAll('.no-print').forEach(node => (node as HTMLElement).style.display = 'none');
          clonedArea.querySelectorAll('.print-only').forEach(node => {
            const printEl = node as HTMLElement;
            printEl.style.display = 'block';
            printEl.style.color = '#000000';
            printEl.style.fontWeight = 'bold';
          });

          // 文字色を絶対的な黒(#000000)にし、フォントを太くする
          clonedArea.querySelectorAll('table, th, td, span, h1, h2, p, div').forEach(node => {
            const el = node as HTMLElement;
            el.style.color = '#000000';
            el.style.opacity = '1';
            el.style.borderColor = '#000000';
            if (el.tagName === 'TD' || el.tagName === 'TH' || el.classList.contains('font-bold')) {
                el.style.fontWeight = '800';
            }
          });

          clonedArea.querySelectorAll('[data-item-label]').forEach(node => {
            const label = node as HTMLElement;
            label.style.backgroundColor = '#000000';
            label.style.color = '#ffffff';
            label.style.border = '1px solid #000000';
            label.style.fontWeight = '900';
          });
        }
      }
    });
  };

  const handleExportImage = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `TechRider_${bandInfo.name || 'band'}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const handleExportPDF = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2] // スケール調整
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save(`TechRider_${bandInfo.name || 'band'}.pdf`);
  };

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <header className="no-print space-y-2 border-l-4 border-blue-500 pl-6 py-4">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">
          Tech Rider <span className="text-blue-500">Studio Pro</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          norké presents.
        </p>
      </header>

      <section className="glass-panel p-6 md:p-8 space-y-6 no-print">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Band Name</label>
            <input 
              type="text" 
              placeholder="バンド名を入力..." 
              className="w-full bg-[#121419] text-xl font-bold p-4 rounded-lg border border-[#2d333b] focus:border-blue-500 outline-none transition-all"
              value={bandInfo.name}
              onChange={(e) => setBandInfo({...bandInfo, name: e.target.value})}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Members</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, '5+'].map(n => (
                <button
                  key={n}
                  onClick={() => {
                    const num = typeof n === 'string' ? 5 : n;
                    setBandInfo({...bandInfo, members: num});
                    applyTemplate(bandInfo.type, num);
                  }}
                  className={`h-12 w-12 rounded-lg font-bold transition-all border ${bandInfo.members === (typeof n === 'string' ? 5 : n) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#121419] border-[#2d333b] text-slate-500 hover:border-slate-400'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Performance Style</label>
          <div className="flex flex-wrap gap-2">
            {(['BAND', 'ELECTRONIC', 'DJ'] as BandType[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setBandInfo({...bandInfo, type: t});
                  applyTemplate(t, bandInfo.members);
                }}
                className={`px-6 h-12 rounded-lg font-bold transition-all border ${bandInfo.type === t ? 'bg-white text-black border-white' : 'bg-[#121419] border-[#2d333b] text-slate-500 hover:border-slate-400'}`}
              >
                {t === 'BAND' ? '生バンド' : t === 'ELECTRONIC' ? '宅録/Hybrid' : 'DJ/MC'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div ref={exportAreaRef} data-export-container className="bg-[#121419] rounded-2xl border border-[#2d333b] overflow-hidden">
        <section className="p-4 md:p-8 relative">
          <div className="print-only mb-8 text-black border-b-2 border-black pb-4">
            <h1 className="text-4xl font-black uppercase text-black">{bandInfo.name || 'TECH RIDER'}</h1>
            <div className="flex gap-4 mt-2 font-bold text-sm text-black">
              <span>Type: {bandInfo.type}</span>
              <span>Members: {bandInfo.members}</span>
              <span className="ml-auto text-black font-normal opacity-60">Studio Pro Export</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-20 flex md:flex-col flex-wrap gap-3 no-print">
              {(Object.keys(ITEM_DEFAULTS) as ItemType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleAddItem(type)}
                  title={ITEM_DEFAULTS[type].label}
                  className="w-full aspect-square bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-2xl hover:bg-slate-700 transition-all active:scale-95"
                >
                  {ITEM_DEFAULTS[type].icon}
                </button>
              ))}
            </div>

            <div className="flex-1">
              <div className="text-center font-bold text-slate-600 text-[10px] uppercase tracking-widest mb-2 no-print">Audience / Front</div>
              <div 
                ref={stageRef}
                data-stage
                className="aspect-video bg-[#090b0d] border border-slate-800 rounded-xl relative stage-grid touch-none overflow-hidden"
              >
                {items.map(item => (
                  <div
                    key={item.id}
                    onPointerDown={(e) => handlePointerDown(e, item.id)}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 rounded-lg transition-all flex flex-col items-center
                      ${selectedId === item.id ? 'bg-blue-500/10 border border-blue-500 shadow-lg z-10' : 'hover:bg-white/5'}`}
                  >
                    // --- 修正後（スマホで text-2xl、PCで text-4xl になります） ---
<span className={`text-2xl md:text-4xl transition-transform ${item.direction === 'LEFT' ? '-scale-x-100' : item.direction === 'RIGHT' ? 'scale-x-100' : ''}`}>
  {ITEM_DEFAULTS[item.type].icon}
</span>
                    <span 
                      data-item-label
                      className="mt-1 text-[9px] font-black whitespace-nowrap bg-white text-black px-1.5 py-0.5 rounded shadow-sm uppercase border border-slate-300"
                    >
                      {item.label}
                    </span>
                    {item.isBrought && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-black shadow-sm"></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center font-bold text-slate-600 text-[10px] uppercase tracking-widest mt-2 no-print">Artist / Back</div>
            </div>
          </div>

          {selectedItem && (
            <div className="mt-6 p-6 bg-[#1a1d23] rounded-xl border border-slate-700 no-print space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Editing: {selectedItem.label}</span>
                <button onClick={() => deleteItem(selectedItem.id)} className="text-xs text-red-400 font-bold hover:underline">Delete</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text" 
                  value={selectedItem.label} 
                  onChange={(e) => updateItem(selectedItem.id, { label: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded p-2 text-sm outline-none focus:border-blue-500 text-white"
                />
                <div className="flex gap-1 bg-slate-900 p-1 rounded border border-slate-700">
                  {(['LEFT', 'CENTER', 'RIGHT'] as const).map(d => (
                    <button 
                      key={d}
                      onClick={() => updateItem(selectedItem.id, { direction: d })}
                      className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${selectedItem.direction === d ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => updateItem(selectedItem.id, { isBrought: !selectedItem.isBrought })}
                  className={`py-1 px-4 rounded text-[10px] font-bold border transition-all ${selectedItem.isBrought ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-700 text-slate-500'}`}
                >
                  {selectedItem.isBrought ? '持込ギア' : 'ライブハウス備品'}
                </button>
              </div>
            </div>
          )}

          <div className="print-only mt-10 text-black">
            <h2 className="text-xl font-black mb-4 border-b-2 border-black uppercase tracking-tight text-black">Input List & Signal Info</h2>
            <table className="w-full border-collapse border border-black text-sm text-black">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 text-left font-black text-black">Ch</th>
                  <th className="border border-black p-2 text-left font-black text-black">Instrument</th>
                  <th className="border border-black p-2 text-left font-black text-black">Connection</th>
                  <th className="border border-black p-2 text-center font-black text-black">Gear</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="border border-black p-2 font-mono font-bold text-black">{idx + 1}</td>
                    <td className="border border-black p-2 font-black text-black">{item.label} {ITEM_DEFAULTS[item.type].icon}</td>
                    <td className="border border-black p-2 text-black font-bold">{CONNECTION_LABELS[item.connection]}</td>
                    <td className="border border-black p-2 text-center font-black text-black">{item.isBrought ? 'OWN' : 'HOUSE'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="text-center py-4 font-bold">No inputs defined.</p>}
          </div>
        </section>
      </div>

      <section className="glass-panel p-6 no-print space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-2">Signals & Connections</h3>
        <div className="grid gap-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <span className="font-bold text-xs uppercase">{item.label}</span>
              <div className="flex gap-1">
                {(['AMP', 'DI', 'PC', 'UNKNOWN'] as ConnectionType[]).map(conn => (
                  <button
                    key={conn}
                    onClick={() => updateItem(item.id, { connection: conn })}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${item.connection === conn ? 'bg-white text-black' : 'text-slate-500 border border-slate-800 hover:border-slate-700'}`}
                  >
                    {CONNECTION_LABELS[conn].split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="no-print pt-6 flex flex-col md:flex-row gap-4">
        <button 
          onClick={handleExportPDF}
          className="flex-1 bg-blue-600 text-white py-5 rounded-xl font-black text-lg hover:bg-blue-500 transition-all btn-studio shadow-lg shadow-blue-900/20 uppercase"
        >
          PDFファイルを保存
        </button>
        <button 
          onClick={handleExportImage}
          className="flex-1 bg-slate-800 text-white py-5 rounded-xl font-black text-lg hover:bg-slate-700 border border-slate-700 transition-all btn-studio uppercase"
        >
          JPG画像を保存
        </button>
      </section>

      <footer className="no-print text-center py-8 text-slate-600 font-mono text-[10px] uppercase tracking-widest">
        Quick Tech Rider Studio Pro // Rel. 2024.12
      </footer>
    </div>
  );
};

export default App;

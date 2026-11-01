import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Tv, 
  Sparkles, 
  FlaskConical,
  Activity,
  Network,
  Bot,
  Scale,
  ShieldCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { Act1GreenDashboard } from './Act1GreenDashboard';
import { Act2InvisiblePopulation } from './Act2InvisiblePopulation';
import { Act3AgentInvestigation } from './Act3AgentInvestigation';
import { Act4TheEvidence } from './Act4TheEvidence';
import { Act5TheVerdict } from './Act5TheVerdict';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose }) => {
  const { 
    scenarios, 
    activeScenario, 
    selectScenario, 
    activeInvestigation,
    isBackendConnected
  } = useScenario();

  const [currentAct, setCurrentAct] = useState<number>(1);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setCurrentAct((prev) => Math.min(5, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentAct((prev) => Math.max(1, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const acts = [
    { number: 1, title: 'The Green Dashboard', icon: Activity },
    { number: 2, title: 'Invisible Population', icon: Network },
    { number: 3, title: 'Agent Investigation', icon: Bot },
    { number: 4, title: 'The Evidence', icon: Scale },
    { number: 5, title: 'The Verdict', icon: ShieldCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B132B] text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Presentation Bar */}
      <header className="h-16 px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm tracking-widest shadow-md">
            U
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white text-sm">UNSEEN</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                Presentation Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Because an average cannot tell the whole story.
            </p>
          </div>
        </div>

        {/* Center: Act Stepper Tabs (Jumper) */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {acts.map((act) => {
            const Icon = act.icon;
            const isActive = currentAct === act.number;
            const isPassed = currentAct > act.number;

            return (
              <button
                key={act.number}
                onClick={() => setCurrentAct(act.number)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : isPassed
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>Act {act.number}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Scenario Selector & Exit */}
        <div className="flex items-center space-x-3">
          {/* Quick Scenario Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <FlaskConical className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={activeScenario.id}
              onChange={(e) => {
                selectScenario(e.target.value);
                setCurrentAct(1); // Reset to Act 1 on scenario switch
              }}
              className="bg-transparent font-medium text-slate-200 border-none outline-none cursor-pointer focus:ring-0 text-xs pr-1 font-mono"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.affectedDevices > 0 ? `${s.affectedDevices} affected` : 'Nominal'})
                </option>
              ))}
            </select>
          </div>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
            title="Exit Presentation Mode (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit (Esc)</span>
          </button>
        </div>
      </header>

      {/* Main Presentation Viewport */}
      <main className="flex-1 overflow-y-auto px-6 py-8 min-h-0">
        {currentAct === 1 && (
          <Act1GreenDashboard onNext={() => setCurrentAct(2)} />
        )}
        {currentAct === 2 && (
          <Act2InvisiblePopulation 
            onNext={() => setCurrentAct(3)} 
            onPrev={() => setCurrentAct(1)} 
          />
        )}
        {currentAct === 3 && (
          <Act3AgentInvestigation 
            onNext={() => setCurrentAct(4)} 
            onPrev={() => setCurrentAct(2)} 
          />
        )}
        {currentAct === 4 && (
          <Act4TheEvidence 
            onNext={() => setCurrentAct(5)} 
            onPrev={() => setCurrentAct(3)} 
          />
        )}
        {currentAct === 5 && (
          <Act5TheVerdict 
            onPrev={() => setCurrentAct(4)} 
            onExit={onClose} 
            onRestart={() => setCurrentAct(1)} 
          />
        )}
      </main>

      {/* Bottom Sticky Presentation Controller Bar */}
      <footer className="h-14 px-6 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0 select-none text-xs font-mono">
        {/* Left: Previous Act */}
        <div>
          {currentAct > 1 ? (
            <button
              onClick={() => setCurrentAct(prev => Math.max(1, prev - 1))}
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Act (←)</span>
            </button>
          ) : (
            <span className="text-slate-600">Beginning of Presentation</span>
          )}
        </div>

        {/* Center: Stage Indicator Dots */}
        <div className="flex items-center space-x-2">
          {acts.map((act) => (
            <button
              key={act.number}
              onClick={() => setCurrentAct(act.number)}
              className={`h-2 rounded-full transition-all ${
                currentAct === act.number 
                  ? 'w-8 bg-blue-500 shadow-glow-sm' 
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Jump to Act ${act.number}: ${act.title}`}
            />
          ))}
          <span className="text-slate-400 ml-2">Act {currentAct} of 5</span>
        </div>

        {/* Right: Next Act */}
        <div>
          {currentAct < 5 ? (
            <button
              onClick={() => setCurrentAct(prev => Math.min(5, prev + 1))}
              className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              <span>Next Act (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              <span>Finish Presentation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

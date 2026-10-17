import React from 'react';
import { Accessibility, ArrowLeft, ArrowRight, Compass, Phone, PhoneOff, SlidersHorizontal } from 'lucide-react';
import { StationData } from '../types/navigation';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderNavProps {
  stationData: StationData;
  originNodeId: string;
  destinationNodeId: string;
  isStepFree: boolean;
  isCallActive: boolean;
  isOnline: boolean;
  isOfflineSimulated?: boolean;
  onToggleOfflineSim?: () => void;
  onSelectOrigin: (id: string) => void;
  onSelectDestination: (id: string) => void;
  onToggleStepFree: () => void;
  onToggleCall: () => void;
  onOpenAdmin: () => void;
  onGoHome?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ stationData, originNodeId, destinationNodeId, isStepFree, isCallActive, isOnline, onSelectOrigin, onSelectDestination, onToggleStepFree, onToggleCall, onOpenAdmin, onGoHome }) => (
  <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl safe-top">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <button onClick={onGoHome} aria-label="Return to NAVAI home" className="group flex min-h-11 items-center gap-2.5 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-700/20 transition group-hover:bg-blue-800"><Compass className="h-5 w-5" /></span>
        <span className="hidden sm:block"><span className="block text-sm font-extrabold tracking-[0.16em] text-[#10213f]">NAVAI</span><span className="block text-[11px] font-medium text-slate-500">KSR Bengaluru · SBC</span></span>
      </button>

      <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs lg:flex">
        <label className="flex items-center gap-2 font-semibold text-slate-600">Start
          <select aria-label="Select route starting point" value={originNodeId} onChange={(e) => onSelectOrigin(e.target.value)} className="max-w-[150px] bg-transparent font-bold text-slate-900 outline-none">
            {stationData.nodes.filter((n) => n.isCheckpoint || n.type === 'entrance' || n.type === 'platform').map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </label>
        <ArrowRight className="h-4 w-4 text-slate-400" />
        <label className="flex items-center gap-2 font-semibold text-slate-600">To
          <select aria-label="Select route destination" value={destinationNodeId} onChange={(e) => onSelectDestination(e.target.value)} className="max-w-[170px] bg-transparent font-bold text-slate-900 outline-none">
            {stationData.nodes.filter((n) => n.isCheckpoint || n.type === 'platform' || n.type === 'amenity' || n.type === 'food' || n.type === 'transit_link').map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <PWAInstallButton />
        <button onClick={onToggleStepFree} aria-label="Toggle step-free route" className={`hidden min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition sm:flex ${isStepFree ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Accessibility className="h-4 w-4" /><span className="hidden md:inline">{isStepFree ? 'Step-free' : 'Accessible'}</span></button>
        <button onClick={onToggleCall} disabled={!isOnline} aria-label={isCallActive ? 'End voice call' : 'Start voice call'} className={`flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-xs font-bold shadow-sm transition active:scale-95 ${!isOnline ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400' : isCallActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>{isCallActive ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}<span className="hidden sm:inline">{isCallActive ? 'End call' : 'Talk to Rahul'}</span></button>
        <button onClick={onOpenAdmin} aria-label="Open venue admin" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"><SlidersHorizontal className="h-4 w-4" /></button>
      </div>
    </div>
  </header>
);

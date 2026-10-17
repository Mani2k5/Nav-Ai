/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  SlidersHorizontal,
  Phone,
  PhoneOff,
  Train,
  Accessibility,
  Wifi,
  WifiOff,
  ArrowRight,
} from 'lucide-react';
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

export const HeaderNav: React.FC<HeaderNavProps> = ({
  stationData,
  originNodeId,
  destinationNodeId,
  isStepFree,
  isCallActive,
  isOnline,
  isOfflineSimulated = false,
  onToggleOfflineSim,
  onSelectOrigin,
  onSelectDestination,
  onToggleStepFree,
  onToggleCall,
  onOpenAdmin,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single Brand Wordmark & Station Title with Home navigation */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to Home Screen"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                  NAVAI
                </span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-bold text-slate-700">
                  KSR Bengaluru
                </span>
              </div>
              {/* Status metadata as clean unboxed text */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span>Platforms 1–10</span>
                <span aria-hidden="true">·</span>
                <span>Blueprint Active</span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Concise Route Wayfinding Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-700">Start:</span>
            <select
              value={originNodeId}
              onChange={(e) => onSelectOrigin(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              {stationData.nodes
                .filter((n) => n.isCheckpoint || n.type === 'entrance' || n.type === 'platform')
                .map((n) => (
                  <option key={n.id} value={n.id} className="bg-white text-slate-900">
                    {n.name}
                  </option>
                ))}
            </select>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-red-700">Destination:</span>
            <select
              value={destinationNodeId}
              onChange={(e) => onSelectDestination(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {stationData.nodes
                .filter((n) => n.isCheckpoint || n.type === 'platform' || n.type === 'amenity' || n.type === 'food' || n.type === 'transit_link')
                .map((n) => (
                  <option key={n.id} value={n.id} className="bg-white text-slate-900">
                    {n.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          {/* Elevator / Step-free route toggle */}
          <button
            onClick={onToggleStepFree}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isStepFree
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Toggle Wheelchair & Elevator Step-Free Route"
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isStepFree ? 'Elevators Only' : 'Elevators'}</span>
          </button>

          {/* Talk to Concierge Rahul Button */}
          <button
            onClick={onToggleCall}
            disabled={!isOnline}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${
              !isOnline
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : isCallActive
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={!isOnline ? 'Voice intercom requires internet. Visual map works offline.' : 'Voice Concierge'}
          >
            {isCallActive ? (
              <>
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span>Talk to Rahul</span>
              </>
            )}
          </button>

          {/* Admin Operator Console Trigger */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Venue Operator Admin Console"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

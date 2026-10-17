/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Map as MapIcon,
  AlertTriangle,
  Phone,
  PhoneOff,
  Utensils,
  Sparkles,
  X,
  Volume2,
  CheckCircle2,
  Navigation,
  Compass,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { RouteResult } from '../types/navigation';

interface PhoneScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCallActive: boolean;
  isConnecting: boolean;
  speakingVolume: number;
  lastTranscript?: string;
  activeRoute: RouteResult | null;
  currentStepIndex: number;
  isMuted: boolean;
  isStepFree: boolean;
  isOnline: boolean;
  onToggleCall: () => void;
  onToggleMute: () => void;
  onOpenMap: () => void;
  onQuickQuery: (query: string) => void;
}

export const PhoneScreenModal: React.FC<PhoneScreenModalProps> = ({
  isOpen,
  onClose,
  isCallActive,
  isConnecting,
  speakingVolume,
  lastTranscript,
  activeRoute,
  currentStepIndex,
  isMuted,
  isStepFree,
  isOnline,
  onToggleCall,
  onToggleMute,
  onOpenMap,
  onQuickQuery,
}) => {
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const currentStep = activeRoute?.steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Phone Screen Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col justify-between overflow-hidden text-slate-800 my-auto">
        {/* 1. Header Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCallActive
                  ? 'bg-emerald-500 animate-pulse'
                  : isConnecting
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold tracking-wide uppercase text-slate-700">
              {isCallActive ? (
                <span className="text-emerald-700">Live Voice Call</span>
              ) : isConnecting ? (
                <span className="text-amber-700">Connecting to Rahul...</span>
              ) : (
                'Standby'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              title="Station Emergency & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Concierge Identity & Audio Reactor */}
        <div className="px-6 pt-5 pb-2 text-center flex flex-col items-center">
          <p className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
            KSR BENGALURU PERSONAL &amp; FAMILY GUIDE
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Guide Rahul
          </h2>
          <p className="text-xs font-mono font-semibold text-slate-500 mt-1 tabular-nums">
            {isCallActive ? formatTimer(callSeconds) : 'Tap Call Button to Begin'}
          </p>

          {/* Luminous Sound Reactor Orb */}
          <div className="relative flex items-center justify-center my-6">
            {/* Concentric Sonic Rings */}
            {isCallActive && (
              <>
                <div
                  className="absolute rounded-full bg-blue-100 transition-all duration-150 pointer-events-none"
                  style={{
                    width: `${140 + speakingVolume * 90}px`,
                    height: `${140 + speakingVolume * 90}px`,
                  }}
                />
                <div
                  className="absolute rounded-full bg-cyan-100 transition-all duration-200 pointer-events-none"
                  style={{
                    width: `${120 + speakingVolume * 50}px`,
                    height: `${120 + speakingVolume * 50}px`,
                  }}
                />
              </>
            )}

            {/* Glowing Center Badge */}
            <div
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-xl ring-4 ring-white border transition-all ${
                isCallActive
                  ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white border-blue-200 scale-105'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isCallActive ? (
                <div className="flex items-center gap-1">
                  <span
                    className="w-1.5 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${12 + speakingVolume * 24}px` }}
                  />
                  <span
                    className="w-1.5 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${20 + speakingVolume * 36}px` }}
                  />
                  <span
                    className="w-1.5 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${16 + speakingVolume * 28}px` }}
                  />
                  <span
                    className="w-1.5 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${10 + speakingVolume * 18}px` }}
                  />
                </div>
              ) : (
                <Phone className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>

          {/* Spoken Response Live Card */}
          <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Spoken Guidance
              </span>
              <span className="text-[11px] text-blue-600 font-semibold">
                Natural Indian English
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              "{lastTranscript || 'Namaskara! I am Rahul, your family guide here at KSR station. Tell me where you need to go—I will walk right beside you step by step!'}"
            </p>
          </div>

          {/* Active Navigation Step (if active) */}
          {activeRoute && currentStep && (
            <div className="w-full mt-3 bg-blue-50/80 border border-blue-200 rounded-2xl p-3 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800 mb-1">
                <span>
                  Step {currentStepIndex + 1} of {activeRoute.steps.length}
                </span>
                <span className="font-mono text-slate-600">
                  {currentStep.distanceMeters}m
                </span>
              </div>
              <p className="text-xs text-slate-900 font-semibold line-clamp-2">
                {currentStep.instruction}
              </p>
            </div>
          )}
        </div>

        {/* 3. Quick Transit Chips */}
        <div className="px-5 py-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onQuickQuery('Where is good food or crispy masala dosa?')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Canteen / Dosa</span>
            </button>
            <button
              onClick={() => onQuickQuery('Take me to Platforms 7 & 8 Vande Bharat')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Vande Bharat (PF 7)</span>
            </button>
            <button
              onClick={() => onQuickQuery('Where is Jan Aushadhi generic pharmacy on Platform 1?')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <span className="text-xs">💊</span>
              <span className="truncate">Jan Aushadhi (PF 1)</span>
            </button>
            <button
              onClick={() => onQuickQuery('Where can I buy Channapatna wooden toys or books?')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">Channapatna Toys</span>
            </button>
            <button
              onClick={() => onQuickQuery('How do I walk to the Metro Skywalk?')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">Metro Skywalk (T3)</span>
            </button>
            <button
              onClick={() => onQuickQuery('Take me to the nearest restroom and water cooler')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <span className="text-xs">🚻</span>
              <span className="truncate">Restroom &amp; Water</span>
            </button>
          </div>
        </div>

        {/* 4. Tactile Bottom Action Bar */}
        <div className="px-6 pt-3 pb-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-around">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            disabled={!isCallActive}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[54px] min-h-[54px] transition-all cursor-pointer ${
              !isCallActive
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : isMuted
                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 text-amber-600" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-bold mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Center Call / Hangup Trigger */}
          <button
            onClick={onToggleCall}
            disabled={!isOnline}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer ring-4 ring-white ${
              !isOnline
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : isCallActive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
            }`}
            title={isCallActive ? 'End Call' : 'Start Voice Guidance Call'}
          >
            {isCallActive ? (
              <PhoneOff className="w-7 h-7" />
            ) : (
              <Phone className="w-7 h-7" />
            )}
          </button>

          {/* Blueprint Map Switcher */}
          <button
            onClick={() => {
              onClose();
              onOpenMap();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl min-w-[54px] min-h-[54px] bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <MapIcon className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold mt-1">Map</span>
          </button>
        </div>

        {/* Station Emergency Help Modal */}
        {showHelpModal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <Shield className="w-5 h-5" />
                  <span>Station Security &amp; Help</span>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Railway Protection Force (RPF)</span>
                    <span className="text-[11px] text-red-700">Platform 1 Station Office</span>
                  </div>
                  <span className="text-base font-mono font-bold text-red-600">139</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Station Superintendent</span>
                    <span className="text-[11px] text-blue-700">Terminal 1 Concourse</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600">080-2287</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onQuickQuery('I need immediate station medical or security help');
                  setShowHelpModal(false);
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer"
              >
                Notify Concierge Rahul
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

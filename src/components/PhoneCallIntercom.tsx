/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Navigation,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Accessibility,
  Compass,
  Utensils,
  ChevronRight,
  Send,
  Volume2,
} from 'lucide-react';
import { RouteResult, RouteStep } from '../types/navigation';

interface PhoneCallIntercomProps {
  isCallActive: boolean;
  isConnecting: boolean;
  speakingVolume: number;
  lastTranscript?: string;
  activeRoute: RouteResult | null;
  currentStepIndex: number;
  isMuted: boolean;
  isStepFree: boolean;
  isOnline?: boolean;
  onToggleCall: () => void;
  onToggleMute: () => void;
  onToggleStepFree: () => void;
  onConfirmCheckpoint: () => void;
  onReportLost: (landmarkName?: string) => void;
  onRepeatStep: () => void;
  onQuickQuery: (query: string) => void;
}

export const PhoneCallIntercom: React.FC<PhoneCallIntercomProps> = ({
  isCallActive,
  isConnecting,
  speakingVolume,
  lastTranscript,
  activeRoute,
  currentStepIndex,
  isMuted,
  isStepFree,
  isOnline = true,
  onToggleCall,
  onToggleMute,
  onToggleStepFree,
  onConfirmCheckpoint,
  onReportLost,
  onRepeatStep,
  onQuickQuery,
}) => {
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [textInput, setTextInput] = useState<string>('');

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

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const currentStep: RouteStep | undefined = activeRoute?.steps[currentStepIndex];
  const totalSteps = activeRoute?.steps.length || 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onQuickQuery(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 1. Header with Call Status & Audio Waves */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isCallActive ? (
                <span className="text-emerald-700 font-mono tabular-nums">
                  Live Voice · {formatCallTime(callSeconds)}
                </span>
              ) : isConnecting ? (
                <span className="text-amber-700">Connecting to Rahul...</span>
              ) : (
                'Voice Concierge Standby'
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isCallActive && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-[11px] font-semibold text-blue-800">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Aoede (Indian)</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Bar */}
        {isCallActive && (
          <div className="flex items-center justify-center gap-1.5 h-6 mt-3 bg-white border border-slate-200/80 rounded-xl px-3">
            {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 0.7].map((factor, i) => (
              <span
                key={i}
                className="w-1 bg-blue-600 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, Math.min(20, 4 + speakingVolume * 24 * factor))}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Main Guidance Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {/* Active Step Card */}
        {activeRoute && currentStep ? (
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-700 mb-2 font-bold">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
              </span>
              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                {currentStep.distanceMeters}m · Next: {currentStep.nodeName}
              </span>
            </div>

            <p className="text-base font-extrabold text-slate-900 leading-snug">
              {currentStep.instruction}
            </p>

            {/* Landmark Tip */}
            {currentStep.landmarkTip && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                <Utensils className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {currentStep.landmarkTip}
                </p>
              </div>
            )}

            {/* Action Confirmation Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={onConfirmCheckpoint}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{isLastStep ? "I've Arrived!" : "Next Checkpoint"}</span>
              </button>

              <button
                onClick={onRepeatStep}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                title="Repeat Instruction"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <Navigation className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-900">Choose Your Destination</h4>
            <p className="text-xs text-slate-500 mt-1">
              Select a platform or service on the map, or speak to Rahul to plot the fastest walking path.
            </p>
          </div>
        )}

        {/* Live Conversation Transcript Display */}
        {lastTranscript && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Spoken By Rahul
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              "{lastTranscript}"
            </p>
          </div>
        )}

        {/* Quick Shortcut Buttons */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Inquiries
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onQuickQuery('Platforms 7 & 8 Vande Bharat')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate">PF 7 (Vande Bharat)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              onClick={() => onQuickQuery('Railway Canteen')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate">Canteen (Dosa)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              onClick={() => onQuickQuery('Jan Aushadhi Kendra')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate">Jan Aushadhi (PF 1)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              onClick={() => onQuickQuery('Channapatna Wooden Toys')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate">Channapatna Toys</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              onClick={() => onQuickQuery('Luggage Cloak Room')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate">Luggage Cloak Room</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <button
              onClick={() => onQuickQuery('Majestic Metro Skywalk')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate">Metro Skywalk Link</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Deviation / Recalculate Button */}
        <div>
          <button
            onClick={() => onReportLost()}
            className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>I Took a Wrong Turn (Recalculate Route)</span>
          </button>
        </div>
      </div>

      {/* 3. Text Message Input */}
      <form
        onSubmit={handleSendText}
        className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type e.g. 'Where is PF 7' or 'Food nearby'..."
          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          title="Send query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* 4. Action Controls Footer */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-around">
        {/* Step-Free Accessibility Toggle */}
        <button
          onClick={onToggleStepFree}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
            isStepFree
              ? 'text-cyan-800 bg-cyan-50 border border-cyan-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Wheelchair & Elevator Step-Free Route"
        >
          <Accessibility className="w-5 h-5" />
          <span>{isStepFree ? 'Elevators Only' : 'Standard Path'}</span>
        </button>

        {/* Central Call Trigger */}
        <button
          onClick={onToggleCall}
          disabled={!isOnline}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer ${
            !isOnline
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed ring-4 ring-slate-100'
              : isCallActive
              ? 'bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-100'
              : 'bg-blue-600 hover:bg-blue-700 text-white ring-4 ring-blue-100'
          }`}
          title={
            !isOnline
              ? 'Voice call requires active signal. Visual map works offline.'
              : isCallActive
              ? 'End Voice Call'
              : 'Start Voice Guidance with Rahul'
          }
        >
          {isCallActive ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
        </button>

        {/* Mic Mute */}
        <button
          onClick={onToggleMute}
          disabled={!isCallActive}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-colors ${
            !isCallActive
              ? 'text-slate-300 cursor-not-allowed'
              : isMuted
              ? 'text-amber-800 bg-amber-50 border border-amber-200 cursor-pointer'
              : 'text-slate-500 hover:text-slate-800 cursor-pointer'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-amber-600" /> : <Mic className="w-5 h-5" />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>
    </div>
  );
};

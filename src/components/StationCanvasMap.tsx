/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  StationData,
  VenueNode,
  RouteResult,
} from '../types/navigation';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Accessibility,
  Train,
  Building2,
  Compass,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface StationCanvasMapProps {
  stationData: StationData;
  activeRoute: RouteResult | null;
  currentStepIndex: number;
  originNodeId: string;
  destinationNodeId: string;
  onSelectNode: (nodeId: string, role: 'origin' | 'destination') => void;
}

export const StationCanvasMap: React.FC<StationCanvasMapProps> = ({
  stationData,
  activeRoute,
  currentStepIndex,
  originNodeId,
  destinationNodeId,
  onSelectNode,
}) => {
  const [activeLevelFilter, setActiveLevelFilter] = useState<'all' | 'ground' | 'fob'>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<VenueNode | null>(null);

  const nodeMap = useMemo(() => {
    const map = new Map<string, VenueNode>();
    stationData.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [stationData.nodes]);

  const activePathEdges = useMemo(() => {
    if (!activeRoute || activeRoute.pathNodeIds.length < 2) return new Set<string>();
    const edgeSet = new Set<string>();
    for (let i = 0; i < activeRoute.pathNodeIds.length - 1; i++) {
      const u = activeRoute.pathNodeIds[i];
      const v = activeRoute.pathNodeIds[i + 1];
      edgeSet.add(`${u}->${v}`);
      edgeSet.add(`${v}->${u}`);
    }
    return edgeSet;
  }, [activeRoute]);

  const activeNodeIds = useMemo(() => {
    return new Set(activeRoute?.pathNodeIds || []);
  }, [activeRoute]);

  const currentNodeId = useMemo(() => {
    if (!activeRoute) return originNodeId;
    return activeRoute.pathNodeIds[currentStepIndex] || originNodeId;
  }, [activeRoute, currentStepIndex, originNodeId]);

  return (
    <div className="relative w-full h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Top Map Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 z-10 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Official Blueprint
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-mono">KSR Bengaluru</span>
        </div>

        {/* Level Filters (Interactive Segmented Control) */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveLevelFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeLevelFilter === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveLevelFilter('ground')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeLevelFilter === 'ground'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ground
          </button>
          <button
            onClick={() => setActiveLevelFilter('fob')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeLevelFilter === 'fob'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bridges &amp; Subway
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-slate-600 w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative flex-1 overflow-auto bg-slate-100/70 flex items-center justify-center p-2">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-200 ease-out"
        >
          <svg
            viewBox="0 0 1120 670"
            className="w-[1060px] h-[630px] drop-shadow-md select-none rounded-2xl"
            style={{ maxWidth: '100%' }}
          >
            <defs>
              {/* Route Glow & Animation */}
              <filter id="routeGlowWhite" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Blueprint Grid Pattern */}
              <pattern id="lightGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
              </pattern>
            </defs>

            {/* Canvas Base Background */}
            <rect width="1120" height="670" fill="#F8FAFC" rx="16" />
            <rect width="1120" height="670" fill="url(#lightGrid)" rx="16" />

            {/* Official Amenities Summary Legend Table (Top Left - Exactly from Official Blueprint) */}
            <g transform="translate(10, 8)">
              <rect width="118" height="110" fill="#0F172A" rx="6" stroke="#EAB308" strokeWidth="1.2" />
              <rect x="0" y="0" width="118" height="16" fill="#EAB308" rx="5" />
              <text x="59" y="11" fill="#0F172A" fontSize="6.5" fontWeight="black" textAnchor="middle">
                AMENITIES AT KSR BENGALURU
              </text>
              <g fontSize="6" fill="#F8FAFC" fontWeight="semibold" transform="translate(6, 26)">
                <text y="0">Terminals: 03</text>
                <text x="60" y="0">Platforms: 10</text>
                <text y="10">Ticket Counters: 04</text>
                <text x="60" y="10">Catering Stalls: 56</text>
                <text y="20">Escalators: 13</text>
                <text x="60" y="20">FOB Bridges: 02</text>
                <text y="30">Lifts (Elevators): 02</text>
                <text x="60" y="30">Battery Cars: 10</text>
                <text y="40">Waiting Lounges: 03</text>
                <text x="60" y="40">General Halls: 04</text>
                <text y="50">Central Subway: 01</text>
                <text x="60" y="50">Cloak Room: 01</text>
                <text y="60">Retiring Rooms: 1st Flr</text>
                <text x="60" y="60">Toilets: All PFs</text>
                <text y="70" fill="#38BDF8">Divyangjan: Ramps &amp; Braille</text>
              </g>
            </g>

            {/* Top Official Station Signboard Banner */}
            <rect x="420" y="8" width="530" height="42" fill="#1E293B" rx="8" />
            <text x="435" y="24" fill="#F8FAFC" fontSize="10" fontWeight="bold">
              ಕ್ರಾಂತಿವೀರ ಸಂಗೊಳ್ಳಿ ರಾಯಣ್ಣ (ಬೆಂಗಳೂರು ರೈಲು ನಿಲ್ದಾಣ)
            </text>
            <text x="435" y="38" fill="#38BDF8" fontSize="11" fontWeight="extrabold" letterSpacing="0.5">
              KRANTIVIRA SANGOLLI RAYANNA (BENGALURU RAILWAY STATION)
            </text>
            <text x="795" y="32" fill="#CBD5E1" fontSize="9">
              क्रान्तिवीर संगोल्लि रायण्ण (बेंगलूरु)
            </text>

            {/* Top Right Roundel */}
            <rect x="965" y="6" width="145" height="46" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" rx="8" />
            <circle cx="1035" cy="24" r="16" fill="none" stroke="#1E40AF" strokeWidth="3" />
            <rect x="1005" y="20" width="60" height="8" fill="#DC2626" rx="2" />
            <text x="1035" y="26.5" fill="#FFFFFF" fontSize="8" fontWeight="black" textAnchor="middle">
              BENGALURU
            </text>
            <text x="1035" y="44" fill="#64748B" fontSize="6.5" textAnchor="middle" fontWeight="bold">
              KSR Bengaluru Terminus
            </text>

            {/* Top North Metro Entrance */}
            <rect x="135" y="6" width="200" height="36" fill="#7E22CE" rx="8" />
            <text x="145" y="22" fill="#FFFFFF" fontSize="9" fontWeight="bold">
              ನಮ್ಮ ಮೆಟ್ರೋ KSR METRO STATION
            </text>
            <text x="145" y="34" fill="#F3E8FF" fontSize="8">
              North Entry &amp; 2-Wheeler Parking
            </text>

            {/* TRACK BEDS & RAILS */}
            {[180, 245, 305, 365, 425].map((y, idx) => (
              <g key={`track-${idx}`}>
                <rect x="100" y={y - 8} width="780" height="16" fill="#E2E8F0" rx="3" />
                <line x1="100" y1={y - 4} x2="880" y2={y - 4} stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="100" y1={y + 4} x2="880" y2={y + 4} stroke="#94A3B8" strokeWidth="1.5" />
              </g>
            ))}

            {/* PLATFORM SLABS */}
            {/* Platforms 10 & 9 Slab */}
            <rect x="100" y="125" width="840" height="46" fill="#0F294A" rx="6" />
            <circle cx="280" cy="138" r="8" fill="#F97316" />
            <text x="280" y="141.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">10</text>
            <text x="225" y="141" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>
            <circle cx="280" cy="158" r="8" fill="#F97316" />
            <text x="280" y="161.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">9</text>
            <text x="225" y="161" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>

            <circle cx="700" cy="138" r="8" fill="#F97316" />
            <text x="700" y="141.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">10</text>
            <circle cx="700" cy="158" r="8" fill="#F97316" />
            <text x="700" y="161.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">9</text>
            <text x="640" y="151" fill="#FFFFFF" fontSize="9" fontWeight="bold">PLATFORM</text>

            {/* Platforms 8 & 7 Slab */}
            <rect x="100" y="195" width="810" height="44" fill="#0F294A" rx="6" />
            <circle cx="280" cy="217" r="8" fill="#F97316" />
            <text x="280" y="220.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">8</text>
            <text x="225" y="217" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>
            <circle cx="280" cy="231" r="8" fill="#F97316" />
            <text x="280" y="234.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">7</text>

            <circle cx="700" cy="210" r="8" fill="#F97316" />
            <text x="700" y="213.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">8</text>
            <text x="640" y="210" fill="#FFFFFF" fontSize="9" fontWeight="bold">PLATFORM</text>
            <circle cx="700" cy="231" r="8" fill="#F97316" />
            <text x="700" y="234.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">7</text>
            <text x="640" y="231" fill="#FFFFFF" fontSize="9" fontWeight="bold">PLATFORM</text>

            {/* Platforms 6 & 5 Slab */}
            <rect x="100" y="258" width="790" height="44" fill="#0F294A" rx="6" />
            <circle cx="280" cy="272" r="8" fill="#F97316" />
            <text x="280" y="275.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">6</text>
            <text x="225" y="275" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>
            <circle cx="280" cy="292" r="8" fill="#F97316" />
            <text x="280" y="295.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">5</text>

            <circle cx="738" cy="272" r="7" fill="#F97316" />
            <text x="738" y="275.5" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">6</text>
            <circle cx="738" cy="290" r="7" fill="#F97316" />
            <text x="738" y="293.5" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">5</text>

            {/* Platform 4 Slab */}
            <rect x="100" y="320" width="770" height="38" fill="#0F294A" rx="6" />
            <circle cx="280" cy="339" r="8" fill="#F97316" />
            <text x="280" y="342.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">4</text>
            <text x="225" y="342" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>
            <circle cx="600" cy="339" r="7" fill="#F97316" />
            <text x="600" y="342" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">4</text>

            {/* Platforms 3 & 2 Slab */}
            <rect x="100" y="378" width="790" height="44" fill="#0F294A" rx="6" />
            <circle cx="280" cy="392" r="8" fill="#F97316" />
            <text x="280" y="395.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">3</text>
            <text x="225" y="395" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>
            <circle cx="280" cy="412" r="8" fill="#F97316" />
            <text x="280" y="415.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">2</text>

            <circle cx="740" cy="392" r="7" fill="#F97316" />
            <text x="740" y="395.5" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">3</text>
            <circle cx="740" cy="412" r="7" fill="#F97316" />
            <text x="740" y="415.5" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">2</text>
            <text x="685" y="395" fill="#FFFFFF" fontSize="9" fontWeight="bold">PLATFORM</text>

            {/* Platform 1 Slab (Main Platform) */}
            <rect x="100" y="438" width="810" height="44" fill="#0F294A" rx="6" />
            <circle cx="280" cy="452" r="8" fill="#F97316" />
            <text x="280" y="455.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">1</text>
            <text x="225" y="455" fill="#FFFFFF" fontSize="10" fontWeight="bold">PLATFORM</text>
            <circle cx="660" cy="452" r="8" fill="#F97316" />
            <text x="660" y="455.5" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">1</text>
            <text x="605" y="455" fill="#FFFFFF" fontSize="9" fontWeight="bold">PLATFORM</text>

            {/* FOOTOVER BRIDGE (MYSURU END) - Vertical Cyan Bridge */}
            <rect
              x="400"
              y="70"
              width="20"
              height="390"
              fill="#0D9488"
              stroke="#042F2C"
              strokeWidth="1.5"
              rx="4"
            />
            <g transform="translate(414, 380) rotate(-90)">
              <text fill="#FFFFFF" fontSize="8" fontWeight="extrabold" letterSpacing="1">
                FOOTOVER BRIDGE (MYSURU END)
              </text>
            </g>
            <path d="M 410 65 L 405 75 L 415 75 Z" fill="#0D9488" />
            <text x="395" y="60" fill="#0D9488" fontSize="8" fontWeight="bold">
              Way to KSR Metro
            </text>

            {/* FOOTOVER BRIDGE (JOLARPET END / DHARMAVARAM) - Vertical Teal Bridge */}
            <rect
              x="745"
              y="120"
              width="22"
              height="350"
              fill="#047857"
              stroke="#064E3B"
              strokeWidth="1.5"
              rx="4"
            />
            <g transform="translate(760, 440) rotate(-90)">
              <text fill="#FFFFFF" fontSize="8" fontWeight="extrabold" letterSpacing="1">
                FOOTOVER BRIDGE (JOLARPET END)
              </text>
            </g>
            {[140, 205, 270, 390, 450].map((y, idx) => (
              <g key={`lift-j-${idx}`}>
                <rect x="768" y={y - 8} width="16" height="16" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1" rx="3" />
                <text x="776" y={y + 3} fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">LFT</text>
              </g>
            ))}

            {/* CENTRAL SUBWAY (Amber Tunnel) */}
            <rect
              x="670"
              y="195"
              width="18"
              height="280"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="1.5"
              rx="4"
            />
            <g transform="translate(683, 380) rotate(-90)">
              <text fill="#78350F" fontSize="8" fontWeight="black" letterSpacing="2">
                SUBWAY
              </text>
            </g>

            {/* TERMINAL-1 MAIN BUILDINGS */}
            <rect x="440" y="475" width="230" height="58" fill="#1E293B" rx="8" />
            
            {/* UTS (Ground) & PRS (1st Floor) / Concourse */}
            <rect x="445" y="480" width="85" height="24" fill="#0284C7" rx="4" />
            <text x="487" y="492" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">UTS (GROUND)</text>
            <text x="487" y="501" fill="#BAE6FD" fontSize="6.5" textAnchor="middle">PRS RESERVATION (1F)</text>

            {/* Waiting Halls & Medical */}
            <rect x="535" y="480" width="65" height="24" fill="#334155" rx="4" />
            <text x="567" y="492" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">WAITING LOUNGE</text>
            <text x="567" y="501" fill="#FDE047" fontSize="6" textAnchor="middle">LADIES · PWD · MEDICAL</text>

            {/* Jan Aushadhi & Toys */}
            <rect x="605" y="480" width="60" height="24" fill="#15803D" rx="4" />
            <text x="635" y="492" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">JAN AUSHADHI</text>
            <text x="635" y="501" fill="#BBF7D0" fontSize="6" textAnchor="middle">CHANNAPATNA TOYS</text>

            <rect x="475" y="515" width="130" height="24" fill="#E11D48" rx="12" />
            <text x="540" y="531" fill="#FFFFFF" fontSize="12" fontWeight="black" textAnchor="middle" letterSpacing="1">
              TERMINAL-1
            </text>

            {/* Flag Post Garden & Gandhi Statue */}
            <rect x="485" y="555" width="40" height="40" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1" rx="4" />
            <text x="505" y="572" fill="#166534" fontSize="7" fontWeight="bold" textAnchor="middle">FLAG POST</text>
            <text x="505" y="583" fill="#166534" fontSize="7" textAnchor="middle">GARDEN</text>

            <rect x="535" y="555" width="45" height="40" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" rx="4" />
            <text x="557" y="572" fill="#854D0E" fontSize="7" fontWeight="bold" textAnchor="middle">GANDHI</text>
            <text x="557" y="583" fill="#854D0E" fontSize="7" textAnchor="middle">STATUE</text>

            {/* Rail Coach Restaurant */}
            <rect x="585" y="555" width="60" height="32" fill="#7C2D12" stroke="#EA580C" strokeWidth="1" rx="5" />
            <text x="615" y="570" fill="#FED7AA" fontSize="6.5" fontWeight="black" textAnchor="middle">RAIL COACH</text>
            <text x="615" y="580" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">RESTAURANT</text>

            {/* Subway to Majestic Bus Station */}
            <rect x="505" y="605" width="105" height="22" fill="#F59E0B" stroke="#B45309" strokeWidth="1" rx="4" />
            <text x="557" y="620" fill="#78350F" fontSize="8" fontWeight="bold" textAnchor="middle">
              SUBWAY TO MAJESTIC BUS STAND
            </text>

            {/* T1 4-Wheeler & 2-Wheeler Parking */}
            <rect x="425" y="555" width="50" height="40" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" rx="4" />
            <text x="450" y="572" fill="#854D0E" fontSize="7" fontWeight="bold" textAnchor="middle">4W &amp; 2W</text>
            <text x="450" y="583" fill="#854D0E" fontSize="7" textAnchor="middle">PARKING</text>

            {/* Southern Bhavan Food Plaza & Nescafe */}
            <rect x="675" y="475" width="50" height="32" fill="#047857" rx="4" />
            <text x="700" y="490" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">SOUTHERN</text>
            <text x="700" y="500" fill="#A7F3D0" fontSize="6" textAnchor="middle">BHAVAN / NESCAFE</text>

            {/* Railway Canteen & RMS Office */}
            <rect x="675" y="515" width="50" height="35" fill="#0F172A" rx="4" />
            <text x="700" y="530" fill="#F8FAFC" fontSize="7" fontWeight="bold" textAnchor="middle">RAILWAY</text>
            <text x="700" y="541" fill="#38BDF8" fontSize="7" fontWeight="bold" textAnchor="middle">CANTEEN</text>

            <rect x="735" y="495" width="75" height="45" fill="#1E293B" rx="4" />
            <text x="772" y="515" fill="#E2E8F0" fontSize="7" fontWeight="bold" textAnchor="middle">DIVISIONAL RLY</text>
            <text x="772" y="526" fill="#94A3B8" fontSize="6.5" textAnchor="middle">MANAGER (DRM)</text>

            {/* TERMINAL-2 */}
            <rect x="835" y="240" width="135" height="150" fill="#1E293B" rx="8" />
            <rect x="845" y="350" width="115" height="24" fill="#D946EF" rx="12" />
            <text x="902" y="366" fill="#FFFFFF" fontSize="12" fontWeight="black" textAnchor="middle" letterSpacing="1">
              TERMINAL-2
            </text>
            <rect x="940" y="260" width="45" height="40" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" rx="4" />
            <text x="962" y="278" fill="#854D0E" fontSize="7" fontWeight="bold" textAnchor="middle">4W &amp; 2W</text>
            <text x="962" y="289" fill="#854D0E" fontSize="7" textAnchor="middle">PARKING</text>

            {/* TERMINAL-3 */}
            <rect x="110" y="495" width="180" height="90" fill="#1E293B" rx="8" />
            <rect x="135" y="535" width="125" height="24" fill="#8B5CF6" rx="12" />
            <text x="197" y="551" fill="#FFFFFF" fontSize="12" fontWeight="black" textAnchor="middle" letterSpacing="1">
              TERMINAL-3
            </text>

            {/* Purple Metro Skywalk Line to Majestic */}
            <path
              d="M 215 565 L 215 645 L 140 645"
              fill="none"
              stroke="#9333EA"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <rect x="135" y="630" width="115" height="24" fill="#7E22CE" rx="4" />
            <text x="192" y="646" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
              WAY TO METRO (MAJESTIC)
            </text>

            <rect x="175" y="505" width="36" height="25" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" rx="4" />
            <text x="193" y="520" fill="#854D0E" fontSize="6.5" fontWeight="bold" textAnchor="middle">STATUE</text>

            {/* Surrounding Roads */}
            <rect x="30" y="645" width="760" height="18" fill="#334155" rx="4" />
            <text x="380" y="657" fill="#F8FAFC" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              GUBBI THOTADAPPA ROAD
            </text>

            <g transform="translate(990, 520) rotate(-35)">
              <rect x="0" y="0" width="180" height="18" fill="#334155" rx="4" />
              <text x="90" y="12" fill="#F8FAFC" fontSize="8" fontWeight="bold" textAnchor="middle">
                OLD MYSURU ROAD
              </text>
            </g>

            {/* EDGES / PATHWAYS */}
            {stationData.edges.map((edge) => {
              const u = nodeMap.get(edge.source);
              const v = nodeMap.get(edge.target);
              if (!u || !v) return null;

              const isPathEdge =
                activePathEdges.has(`${edge.source}->${edge.target}`) ||
                activePathEdges.has(`${edge.target}->${edge.source}`);

              const isClosed = edge.isClosed || !!stationData.closures[edge.id];

              if (activeLevelFilter !== 'all') {
                if (activeLevelFilter === 'ground' && (u.level === 'fob' || v.level === 'fob')) {
                  if (!isPathEdge) return null;
                }
                if (activeLevelFilter === 'fob' && u.level === 'ground' && v.level === 'ground') {
                  if (!isPathEdge) return null;
                }
              }

              let strokeColor = '#94A3B8';
              let strokeWidth = 2.5;
              let strokeDash: string | undefined = undefined;

              if (isClosed) {
                strokeColor = '#EF4444';
                strokeDash = '4 4';
              } else if (isPathEdge) {
                strokeColor = 'url(#activeRouteGrad)';
                strokeWidth = 6;
              } else if (edge.levelChange === 'lift') {
                strokeColor = '#0284C7';
                strokeDash = '3 3';
              } else if (edge.levelChange === 'escalator') {
                strokeColor = '#D97706';
                strokeDash = '4 2';
              }

              return (
                <g key={edge.id}>
                  {isPathEdge && (
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke="#38BDF8"
                      strokeWidth={12}
                      strokeLinecap="round"
                      opacity={0.4}
                      filter="url(#routeGlowWhite)"
                    />
                  )}
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                  />
                  {isPathEdge && (
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      strokeDasharray="6 8"
                      strokeLinecap="round"
                      className="animate-dash-flow"
                    />
                  )}
                </g>
              );
            })}

            {/* NODES / WAYPOINTS */}
            {stationData.nodes.map((node) => {
              if (activeLevelFilter !== 'all' && node.level !== activeLevelFilter) {
                if (!activeNodeIds.has(node.id)) return null;
              }

              const isOrigin = node.id === originNodeId;
              const isDestination = node.id === destinationNodeId;
              const isCurrent = node.id === currentNodeId;
              const isOnActiveRoute = activeNodeIds.has(node.id);

              let fillColor = '#64748B';
              let radius = 6.5;
              let stroke = '#FFFFFF';
              let strokeW = 2;

              if (node.type === 'entrance') {
                fillColor = '#10B981';
                radius = 8.5;
              } else if (node.type === 'food') {
                fillColor = '#EA580C';
                radius = 8;
              } else if (node.type === 'lift') {
                fillColor = '#0284C7';
                radius = 8;
              } else if (node.type === 'transit_link') {
                fillColor = '#8B5CF6';
                radius = 8.5;
              } else if (node.type === 'amenity') {
                fillColor = '#D97706';
                radius = 7;
              }

              if (isOnActiveRoute) {
                radius += 2;
                stroke = '#2563EB';
                strokeW = 2.5;
              }

              if (isCurrent) {
                fillColor = '#2563EB';
                radius = 11;
                stroke = '#FFFFFF';
                strokeW = 3.5;
              } else if (isDestination) {
                fillColor = '#DC2626';
                radius = 11;
                stroke = '#FFFFFF';
                strokeW = 3.5;
              } else if (isOrigin) {
                fillColor = '#059669';
                radius = 10;
                stroke = '#FFFFFF';
                strokeW = 3.5;
              }

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => {
                    setSelectedNodeDetails(node);
                    onSelectNode(node.id, 'destination');
                  }}
                >
                  {(isCurrent || isDestination) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 8}
                      fill={isDestination ? '#DC2626' : '#2563EB'}
                      opacity={0.35}
                      className="animate-ping"
                    />
                  )}

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={fillColor}
                    stroke={stroke}
                    strokeWidth={strokeW}
                    className="drop-shadow-xs"
                  />

                  {/* Clean text label */}
                  <text
                    x={node.x}
                    y={node.y - (radius + 4)}
                    textAnchor="middle"
                    fill={isOnActiveRoute ? '#1E293B' : '#64748B'}
                    fontSize={isOnActiveRoute ? '10' : '8'}
                    fontWeight={isOnActiveRoute ? 'bold' : 'normal'}
                    className="pointer-events-none drop-shadow-xs"
                  >
                    {node.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Card */}
        {selectedNodeDetails && (
          <div className="absolute bottom-4 left-4 max-w-sm bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-20 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                  {selectedNodeDetails.code} · Level: {selectedNodeDetails.level}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedNodeDetails.name}
                </h4>
                {selectedNodeDetails.landmarkTip && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 font-medium">
                    💡 {selectedNodeDetails.landmarkTip}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedNodeDetails(null)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1 font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
              <button
                onClick={() => onSelectNode(selectedNodeDetails.id, 'origin')}
                className="flex-1 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Start Here
              </button>
              <button
                onClick={() => onSelectNode(selectedNodeDetails.id, 'destination')}
                className="flex-1 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                Route Here
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="font-semibold text-slate-700">Destination</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-700">Elevator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span className="font-semibold text-slate-700">Metro Link</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full" />
            <span className="font-semibold text-slate-700">Active Path</span>
          </div>
        </div>
        <div className="hidden sm:block text-slate-500 font-medium">
          Platforms 1–10 · Terminals 1, 2, 3
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Mic,
  Train,
  TramFront,
  Utensils,
  Briefcase,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  Home,
  Map as MapIcon,
  PhoneCall,
  Volume2,
  Navigation2,
  Accessibility,
} from 'lucide-react';
import { StationData } from '../types/navigation';

interface HomeScreenProps {
  stationData: StationData;
  onOpenVoiceCall: () => void;
  onOpenMap: () => void;
  onOpenAdmin: () => void;
  onSelectStation: (stationCode: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stationData,
  onOpenVoiceCall,
  onOpenMap,
  onOpenAdmin,
  onSelectStation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'platforms' | 'food' | 'metro'>('all');

  const quickShortcuts = [
    {
      id: 'pf7_8_center',
      title: 'Vande Bharat Express',
      subtitle: 'Platforms 7 & 8',
      type: 'platforms',
      timeEstimate: '2 min',
      distance: '140m',
      badge: 'High Priority',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
      icon: Train,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'railway_canteen',
      title: 'IRCTC Railway Canteen',
      subtitle: 'Crispy Dosa, Meals & Filter Coffee',
      type: 'food',
      timeEstimate: '1 min',
      distance: '65m',
      badge: 'Popular',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: Utensils,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 't1_rail_coach_restaurant',
      title: 'Rail Coach Restaurant',
      subtitle: 'Dine inside an authentic heritage train coach',
      type: 'food',
      timeEstimate: '2 min',
      distance: '95m',
      badge: 'Unique Dining',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: Utensils,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'metro_skywalk_t3',
      title: 'Majestic Metro Skywalk',
      subtitle: 'Direct covered bridge to Green & Purple Lines',
      type: 'metro',
      timeEstimate: '3 min',
      distance: '210m',
      badge: 'Transit Link',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      icon: TramFront,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
    {
      id: 't1_jan_aushadhi',
      title: 'Jan Aushadhi Pharmacy',
      subtitle: 'Government subsidized generic medicine store',
      type: 'services',
      timeEstimate: '1 min',
      distance: '50m',
      badge: 'Pharmacy',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 't1_battery_car_booking',
      title: '10 Battery Operated Buggies',
      subtitle: 'Electric transfer for elderly, pregnant & PWD',
      type: 'services',
      timeEstimate: '1 min',
      distance: '40m',
      badge: 'Accessibility',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
      icon: Accessibility,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 't1_cloak_room',
      title: 'Luggage Cloak Room',
      subtitle: '24/7 baggage deposit near PF 1 East',
      type: 'services',
      timeEstimate: '1 min',
      distance: '80m',
      badge: 'Service',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Briefcase,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 't1_channapatna_toys',
      title: 'Channapatna Toys (OSOP)',
      subtitle: 'GI-tagged Karnataka wooden handicrafts & souvenirs',
      type: 'services',
      timeEstimate: '1 min',
      distance: '60m',
      badge: 'Heritage Shop',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      icon: Sparkles,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
    {
      id: 't1_book_store',
      title: 'Higginbothams Book Store',
      subtitle: 'Magazines, novels, newspapers & stationery',
      type: 'services',
      timeEstimate: '1 min',
      distance: '70m',
      badge: 'Bookstore',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
      icon: Briefcase,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 't1_paid_ac_lounge',
      title: 'Paid A/C Executive Lounge',
      subtitle: 'Sofa seating, charging, WiFi & buffet on PF 1',
      type: 'services',
      timeEstimate: '1 min',
      distance: '45m',
      badge: 'Lounge',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 't3_parcel_booking',
      title: 'Railway Parcel & Bike Booking',
      subtitle: 'Two-wheeler and commercial luggage booking at T3',
      type: 'services',
      timeEstimate: '3 min',
      distance: '180m',
      badge: 'Cargo Office',
      badgeColor: 'text-slate-700 bg-slate-100 border-slate-300',
      icon: Briefcase,
      iconColor: 'text-slate-700',
      iconBg: 'bg-slate-100',
    },
  ];

  const filteredShortcuts = quickShortcuts.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  const terminals = [
    {
      id: 'terminal_1',
      code: 'T1',
      name: 'Terminal 1 · City Side Main Entry',
      location: 'Gubbi Thotadappa Road',
      amenities: 'Ticket Counters, Waiting Hall, VIP Lounge, Canteen',
      color: 'from-blue-700 to-indigo-800',
    },
    {
      id: 'terminal_2',
      code: 'T2',
      name: 'Terminal 2 · East Wing',
      location: 'Old Mysuru Road & PF 10 Access',
      amenities: 'Direct PF 10 Entry, 4W/2W Parking, Fast Exit',
      color: 'from-slate-800 to-slate-900',
    },
    {
      id: 'terminal_3',
      code: 'T3',
      name: 'Terminal 3 · Majestic West Wing',
      location: 'Metro Skywalk & Bus Terminus',
      amenities: 'Weather-Proof Skywalk to Namma Metro & BMTC',
      color: 'from-indigo-900 to-purple-900',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-blue-100 pb-28">
      {/* 1. TOP BAR (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single Brand Wordmark with Transit Compass */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                NAVAI
              </span>
              <span className="text-[11px] font-medium text-slate-500 block leading-none">
                Station Wayfinding
              </span>
            </div>
          </div>

          {/* Zone 2: Single-line Clean Station Location */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-900 font-bold">KSR Bengaluru Junction</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-500">SBC</span>
          </div>

          {/* Zone 3: Primary Action & Admin Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenVoiceCall}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-200" />
              <span>Talk to Rahul</span>
            </button>
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title="Station Operator Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* A. ATMOSPHERIC HERO CARD */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1e3d] via-[#122b52] to-[#1a3867] text-white shadow-xl border border-slate-700/60 p-6 sm:p-8">
          {/* Subtle Architectural SVG Graphic Backdrop */}
          <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none opacity-15 overflow-hidden">
            <svg viewBox="0 0 400 240" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full object-cover">
              <path d="M20 220 L380 220" />
              <path d="M40 220 L40 100 L80 100 L80 220" />
              <path d="M120 220 L120 60 L240 60 L240 220" />
              <circle cx="180" cy="90" r="18" />
              <path d="M170 140 L190 140 L190 220 L170 220 Z" />
              <path d="M280 220 L280 110 L340 110 L340 220" />
              <path d="M10 235 L390 235 M10 240 L390 240" strokeDasharray="6 4" />
            </svg>
          </div>

          <div className="relative z-10 max-w-xl">
            {/* Live Station Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Blueprint Navigation · KSR Bengaluru Terminus</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Indoor station wayfinding made effortless.
            </h1>

            <p className="text-sm sm:text-base text-blue-100/80 font-normal mt-2 leading-relaxed">
              Navigate platforms 1 through 10, footover bridges, elevators, and IRCTC canteens with spoken voice guidance from Rahul or interactive blueprint routing.
            </p>

            {/* Quick Station Stats Bar (Font-mono tabular numbers) */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-blue-400/20">
              <div>
                <span className="block text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                  10
                </span>
                <span className="block text-[11px] text-blue-200/80 font-medium">
                  Active Platforms
                </span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                  3
                </span>
                <span className="block text-[11px] text-blue-200/80 font-medium">
                  Station Terminals
                </span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                  56
                </span>
                <span className="block text-[11px] text-blue-200/80 font-medium">
                  Catering Stalls &amp; Food
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={onOpenMap}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 active:scale-95 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <MapIcon className="w-4 h-4 text-blue-600" />
                <span>Open Blueprint Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenVoiceCall}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 text-white active:scale-95 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-cyan-300" />
                <span>Start Spoken Guide</span>
              </button>
            </div>
          </div>
        </section>

        {/* OFFICIAL AMENITIES BADGE STRIP (Directly from verified blueprint) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Station Amenities
              </span>
              <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Verified SBC Blueprint
              </span>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">
              South Western Railway
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Terminals</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">03</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Platforms</span>
              <span className="text-base font-bold font-mono text-blue-600 mt-1 tabular-nums">10</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Total Landmarks</span>
              <span className="text-base font-bold font-mono text-indigo-600 mt-1 tabular-nums">75+</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Catering Stalls</span>
              <span className="text-base font-bold font-mono text-amber-600 mt-1 tabular-nums">56</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Ticket Counters</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">04 (UTS/PRS)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Escalators &amp; Lifts</span>
              <span className="text-base font-bold font-mono text-cyan-600 mt-1 tabular-nums">13 Esc · 02 Lifts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Waiting Lounges</span>
              <span className="text-base font-bold font-mono text-purple-600 mt-1 tabular-nums">07 Halls</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Battery Buggy Cars</span>
              <span className="text-base font-bold font-mono text-emerald-600 mt-1 tabular-nums">10 Buggies</span>
            </div>
          </div>
        </section>

        {/* B. SEARCH & VOICE INTERACTION BAR */}
        <section className="relative">
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100 transition">
            <Search className="w-5 h-5 text-slate-400 ml-3 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onOpenMap();
              }}
              placeholder="Where are you going? (e.g. Platform 7, Rail Coach Restaurant, Jan Aushadhi...)"
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium py-2"
            />
            <button
              onClick={onOpenVoiceCall}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs shrink-0 transition cursor-pointer"
              title="Speak with Concierge Rahul"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Rahul</span>
            </button>
          </div>
        </section>

        {/* C. POPULAR DESTINATIONS GRID */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Frequent Station Destinations
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tap to compute the shortest walking path on the station blueprint
              </p>
            </div>

            {/* Category Segmented Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('platforms')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'platforms'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Platforms
              </button>
              <button
                onClick={() => setSelectedFilter('food')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'food'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Food
              </button>
              <button
                onClick={() => setSelectedFilter('metro')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'metro'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Metro
              </button>
              <button
                onClick={() => setSelectedFilter('services' as any)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === ('services' as any)
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Services
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectStation('SBC');
                    onOpenMap();
                  }}
                  className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Icon & Walk Estimate */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{item.timeEstimate}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono tabular-nums">{item.distance}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Route on Map</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* D. STATION TERMINALS & ACCESS HUBS */}
        <section>
          <div className="mb-3.5">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Station Terminals &amp; Entries
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Three distinct entry complexes serving Bengaluru Railway Station
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {terminals.map((terminal) => (
              <div
                key={terminal.id}
                onClick={onOpenMap}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                      {terminal.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Public Concourse
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {terminal.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {terminal.location}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {terminal.amenities}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Explore Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 3. FIXED BOTTOM NAVIGATION BAR (Thumb ergonomics) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center">
          {/* Home Tab */}
          <button
            onClick={() => {}}
            className="flex flex-col items-center justify-center py-1 text-blue-600 cursor-pointer min-h-[44px]"
          >
            <Home className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold mt-1 text-blue-600">Home</span>
          </button>

          {/* Blueprint Map Tab */}
          <button
            onClick={onOpenMap}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition cursor-pointer min-h-[44px]"
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Map</span>
          </button>

          {/* Center Elevated Spoken Concierge Action */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={onOpenVoiceCall}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 ring-4 ring-white active:scale-95 transition-all cursor-pointer"
              title="Launch Live Voice Concierge (Rahul)"
            >
              <div className="flex items-center gap-1 h-5">
                <span className="w-1 bg-white rounded-full h-3 animate-pulse" />
                <span className="w-1 bg-white rounded-full h-5" />
                <span className="w-1 bg-white rounded-full h-4 animate-pulse" />
                <span className="w-1 bg-white rounded-full h-2" />
              </div>
            </button>
            <span className="text-[10px] font-bold text-slate-800 mt-1 whitespace-nowrap">
              Talk to Rahul
            </span>
          </div>

          {/* Directory Tab */}
          <button
            onClick={onOpenMap}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition cursor-pointer min-h-[44px]"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Directory</span>
          </button>

          {/* Operator / Admin */}
          <button
            onClick={onOpenAdmin}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition cursor-pointer min-h-[44px]"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Admin</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

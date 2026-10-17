/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PointOfInterest, POICategory } from '../types/navigation';
import {
  Accessibility,
  Briefcase,
  Building2,
  ChevronRight,
  Coffee,
  MapPin,
  Search,
  Shield,
  ShoppingBag,
  Ticket,
  Train,
  Utensils,
  Lightbulb,
} from 'lucide-react';

interface StationDirectoryProps {
  pois: PointOfInterest[];
  onSelectPOI: (nodeId: string) => void;
}

export const StationDirectory: React.FC<StationDirectoryProps> = ({ pois, onSelectPOI }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const platforms = useMemo(() => {
    return [
      { id: 'all', label: 'All zones' },
      { id: 'Platform 1', label: 'Platform 1' },
      { id: 'Platforms 2 & 3', label: 'Platforms 2 & 3' },
      { id: 'Platform 4', label: 'Platform 4' },
      { id: 'Platforms 5 & 6', label: 'Platforms 5 & 6' },
      { id: 'Platforms 7 & 8', label: 'Platforms 7 & 8' },
      { id: 'Platforms 9 & 10', label: 'Platforms 9 & 10' },
      { id: 'Terminal 1', label: 'Terminal 1' },
      { id: 'Terminal 2', label: 'Terminal 2' },
      { id: 'Terminal 3', label: 'Terminal 3' },
    ];
  }, []);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'shopping', label: 'Shops' },
    { id: 'food', label: 'Food' },
    { id: 'waiting', label: 'Lounges' },
    { id: 'ticketing', label: 'Tickets' },
    { id: 'amenity', label: 'Services' },
    { id: 'transit', label: 'Transit' },
    { id: 'office', label: 'Staff' },
    { id: 'platform', label: 'Platforms' },
    { id: 'exit', label: 'Terminals' },
  ];

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        poi.name.toLowerCase().includes(q) ||
        poi.aliases.some((a) => a.toLowerCase().includes(q)) ||
        poi.description.toLowerCase().includes(q) ||
        (poi.platform && poi.platform.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || poi.category === selectedCategory;

      const matchesPlatform =
        selectedPlatform === 'all' ||
        (poi.platform && poi.platform.toLowerCase().includes(selectedPlatform.toLowerCase()));

      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [pois, searchQuery, selectedCategory, selectedPlatform]);

  const categoryStyles: Record<POICategory, { icon: React.ReactNode; bg: string }> = {
    platform: { icon: <Train className="h-4 w-4 text-blue-700" />, bg: 'bg-blue-50' },
    food: { icon: <Utensils className="h-4 w-4 text-amber-700" />, bg: 'bg-amber-50' },
    shopping: { icon: <ShoppingBag className="h-4 w-4 text-cyan-700" />, bg: 'bg-cyan-50' },
    amenity: { icon: <Briefcase className="h-4 w-4 text-emerald-700" />, bg: 'bg-emerald-50' },
    ticketing: { icon: <Ticket className="h-4 w-4 text-blue-700" />, bg: 'bg-blue-50' },
    transit: { icon: <Train className="h-4 w-4 text-cyan-700" />, bg: 'bg-cyan-50' },
    waiting: { icon: <Coffee className="h-4 w-4 text-amber-700" />, bg: 'bg-amber-50' },
    office: { icon: <Shield className="h-4 w-4 text-slate-700" />, bg: 'bg-slate-100' },
    exit: { icon: <Building2 className="h-4 w-4 text-rose-700" />, bg: 'bg-rose-50' },
  };

  const getCategoryStyle = (category: POICategory) =>
    categoryStyles[category] ?? { icon: <MapPin className="h-4 w-4 text-slate-600" />, bg: 'bg-slate-100' };

  return (
    <div className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 text-[#10213f] shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Station directory</p>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-[#10213f]">KSR landmarks</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {filteredPois.length} of {pois.length} verified landmarks shown
          </p>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search station landmarks"
          placeholder="Search shops, food, services..."
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-2">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            aria-pressed={selectedPlatform === p.id}
            className={`min-h-9 whitespace-nowrap rounded-full px-3 text-[11px] font-bold transition ${
              selectedPlatform === p.id
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            aria-pressed={selectedCategory === cat.id}
            className={`min-h-9 whitespace-nowrap rounded-full px-3 text-[11px] font-bold transition ${
              selectedCategory === cat.id
                ? 'bg-[#10213f] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredPois.map((poi) => {
          const style = getCategoryStyle(poi.category);
          return (
            <button
              key={poi.id}
              onClick={() => onSelectPOI(poi.nodeId)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:shadow-md"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                {style.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-[#10213f] group-hover:text-blue-700">{poi.name}</span>
                  {poi.platform && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                      {poi.platform}
                    </span>
                  )}
                  {poi.accessible && (
                    <Accessibility className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Step-free access" />
                  )}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className="capitalize">{poi.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{poi.description}</span>
                </span>
                {poi.specialTip && (
                  <span className="mt-1.5 flex items-start gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                    {poi.specialTip}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-blue-700">
                <span className="hidden sm:inline">Route</span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}

        {filteredPois.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
            <MapPin className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              No landmarks match “{searchQuery}” with the current filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPlatform('all');
              }}
              className="mt-3 min-h-11 rounded-xl bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

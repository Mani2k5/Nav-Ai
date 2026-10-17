/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PointOfInterest, POICategory } from '../types/navigation';
import {
  Search,
  Train,
  Utensils,
  Briefcase,
  Ticket,
  MapPin,
  ChevronRight,
  Accessibility,
  Building2,
  ShoppingBag,
  Shield,
  Coffee,
  Cross,
  Filter,
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
      { id: 'all', label: 'All Platforms & Zones' },
      { id: 'Platform 1', label: 'Platform 1' },
      { id: 'Platforms 2 & 3', label: 'Platforms 2 & 3' },
      { id: 'Platform 4', label: 'Platform 4' },
      { id: 'Platforms 5 & 6', label: 'Platforms 5 & 6' },
      { id: 'Platforms 7 & 8', label: 'Platforms 7 & 8 (Vande Bharat)' },
      { id: 'Platforms 9 & 10', label: 'Platforms 9 & 10 (Metro Link)' },
      { id: 'Terminal 1', label: 'Terminal 1' },
      { id: 'Terminal 2', label: 'Terminal 2' },
      { id: 'Terminal 3', label: 'Terminal 3' },
    ];
  }, []);

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

  const getCategoryIcon = (category: POICategory) => {
    switch (category) {
      case 'platform':
        return <Train className="w-4 h-4 text-blue-600" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case 'amenity':
        return <Briefcase className="w-4 h-4 text-cyan-600" />;
      case 'ticketing':
        return <Ticket className="w-4 h-4 text-emerald-600" />;
      case 'transit':
        return <Train className="w-4 h-4 text-indigo-600" />;
      case 'waiting':
        return <Coffee className="w-4 h-4 text-amber-700" />;
      case 'office':
        return <Shield className="w-4 h-4 text-slate-700" />;
      case 'exit':
        return <Building2 className="w-4 h-4 text-rose-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full text-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              KSR Station Landmark Directory
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredPois.length} Found
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Over 75 verified landmarks: shops, stalls, waiting halls, offices, and amenities
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, platform, shop or item (e.g. 'Jan Aushadhi', 'PF 1', 'Nandini', 'Dosa', 'Toy')..."
          className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-xs"
        />
      </div>

      {/* Platform Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedPlatform === p.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category Filter Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {[
          { id: 'all', label: 'All Categories' },
          { id: 'shopping', label: '🛍️ Shops & Retail' },
          { id: 'food', label: '🍛 Food & Dining' },
          { id: 'waiting', label: '🛋️ Lounges & Waiting' },
          { id: 'ticketing', label: '🎟️ Tickets & Booking' },
          { id: 'amenity', label: '🧳 Medical & Services' },
          { id: 'transit', label: '🚇 Transit & Parking' },
          { id: 'office', label: '👮 Staff & Police' },
          { id: 'platform', label: '🚆 Platforms' },
          { id: 'exit', label: '🏛️ Terminals' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* POI List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredPois.map((poi) => (
          <div
            key={poi.id}
            onClick={() => onSelectPOI(poi.nodeId)}
            className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0 mt-0.5">
                {getCategoryIcon(poi.category)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                    {poi.name}
                  </h4>
                  {poi.platform && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                      {poi.platform}
                    </span>
                  )}
                  {poi.accessible && (
                    <span title="Step-free wheelchair accessible">
                      <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  )}
                </div>

                {/* Clean unboxed metadata with typographic separators */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="capitalize">{poi.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{poi.description}</span>
                </div>

                {poi.specialTip && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 rounded-lg px-2 py-1 font-medium mt-1.5 inline-block">
                    💡 {poi.specialTip}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-xs text-blue-600 font-bold">
              <span className="hidden sm:inline">Route</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {filteredPois.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-500 font-medium">
            No matching landmarks found for "{searchQuery}" under the selected platform/category.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Accessibility, ArrowRight, BriefcaseBusiness, Building2, ChevronRight, Clock3, Compass, Home, Map as MapIcon, MapPin, Menu, Mic, Navigation, PhoneCall, Search, ShieldCheck, SlidersHorizontal, Train, TramFront, Utensils, Volume2 } from 'lucide-react';
import { StationData } from '../types/navigation';

interface HomeScreenProps {
  stationData: StationData;
  onOpenVoiceCall: () => void;
  onOpenMap: () => void;
  onOpenAdmin: () => void;
  onSelectStation: (stationCode: string) => void;
}

type FilterId = 'all' | 'platforms' | 'food' | 'metro' | 'services';

export const HomeScreen: React.FC<HomeScreenProps> = ({ stationData, onOpenVoiceCall, onOpenMap, onOpenAdmin, onSelectStation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('all');

  const quickShortcuts = [
    { id: 'pf7_8_center', title: 'Vande Bharat Express', subtitle: 'Platforms 7 & 8', type: 'platforms', timeEstimate: '2 min', distance: '140m', icon: Train, iconColor: 'text-blue-700', iconBg: 'bg-blue-50' },
    { id: 'railway_canteen', title: 'IRCTC Railway Canteen', subtitle: 'Dosa, meals & filter coffee', type: 'food', timeEstimate: '1 min', distance: '65m', icon: Utensils, iconColor: 'text-amber-700', iconBg: 'bg-amber-50' },
    { id: 't1_rail_coach_restaurant', title: 'Rail Coach Restaurant', subtitle: 'Dine inside a heritage train coach', type: 'food', timeEstimate: '2 min', distance: '95m', icon: Utensils, iconColor: 'text-amber-700', iconBg: 'bg-amber-50' },
    { id: 'metro_skywalk_t3', title: 'Majestic Metro Skywalk', subtitle: 'Covered link to Green & Purple lines', type: 'metro', timeEstimate: '3 min', distance: '210m', icon: TramFront, iconColor: 'text-cyan-700', iconBg: 'bg-cyan-50' },
    { id: 't1_jan_aushadhi', title: 'Jan Aushadhi Pharmacy', subtitle: 'Government generic medicine store', type: 'services', timeEstimate: '1 min', distance: '50m', icon: ShieldCheck, iconColor: 'text-emerald-700', iconBg: 'bg-emerald-50' },
    { id: 't1_battery_car_booking', title: 'Battery Operated Buggies', subtitle: 'Assistance for elders and passengers with luggage', type: 'services', timeEstimate: '1 min', distance: '40m', icon: Accessibility, iconColor: 'text-blue-700', iconBg: 'bg-blue-50' },
    { id: 't1_cloak_room', title: 'Luggage Cloak Room', subtitle: '24/7 baggage deposit near Platform 1', type: 'services', timeEstimate: '1 min', distance: '80m', icon: BriefcaseBusiness, iconColor: 'text-emerald-700', iconBg: 'bg-emerald-50' },
    { id: 't1_book_store', title: 'Higginbothams Book Store', subtitle: 'Books, newspapers and stationery', type: 'services', timeEstimate: '1 min', distance: '70m', icon: BriefcaseBusiness, iconColor: 'text-blue-700', iconBg: 'bg-blue-50' },
  ];

  const filteredShortcuts = useMemo(() => quickShortcuts.filter((item) => {
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || `${item.title} ${item.subtitle}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [selectedFilter, searchQuery]);

  const amenities = stationData.officialAmenities;
  const stats = [
    ['Platforms', String(amenities?.platforms ?? 10), 'text-blue-700'],
    ['Landmarks', '75+', 'text-blue-700'],
    ['Food points', String(amenities?.cateringStalls ?? 56), 'text-amber-700'],
    ['Lifts & escalators', `${amenities?.lifts ?? 2} / ${amenities?.escalators ?? 13}`, 'text-cyan-700'],
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fc] pb-28 text-[#10213f]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl safe-top sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-700/20"><Compass className="h-5 w-5" /></div><div><span className="block text-sm font-extrabold tracking-[0.16em]">NAVAI</span><span className="block text-[11px] font-medium text-slate-500">Station wayfinding</span></div></div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 sm:flex"><MapPin className="h-4 w-4 text-blue-700" /> KSR Bengaluru <span className="font-mono text-slate-400">SBC</span></div>
          <div className="flex items-center gap-2"><button onClick={onOpenVoiceCall} aria-label="Talk to Rahul" className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-3.5 text-xs font-bold text-white shadow-md shadow-blue-700/15 transition hover:bg-blue-800 active:scale-95"><PhoneCall className="h-4 w-4" /><span className="hidden sm:inline">Talk to Rahul</span></button><button onClick={onOpenAdmin} aria-label="Open station admin" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /></button></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 pt-6 sm:px-6 sm:pt-8">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#fafdff] via-[#eef6ff] to-[#e4f1ff] p-6 shadow-sm sm:p-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[24px] border-white/50" /><div className="absolute -bottom-20 right-20 h-52 w-52 rounded-full border border-blue-200/70" />
          <div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Verified station guide</span><h1 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#10213f] sm:text-5xl">Good afternoon.<br /><span className="text-blue-700">Where to today?</span></h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">Find platforms, amenities, food, and the fastest route through KSR Bengaluru with Rahul’s calm spoken guidance.</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={onOpenMap} className="flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 active:scale-[0.98]"><MapIcon className="h-4 w-4" /> Open blueprint <ArrowRight className="h-4 w-4" /></button><button onClick={onOpenVoiceCall} className="flex min-h-12 items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-5 text-sm font-bold text-blue-800 transition hover:bg-white active:scale-[0.98]"><Volume2 className="h-4 w-4" /> Start voice guide</button></div></div>
        </motion.section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span><span className={`mt-2 block font-mono text-2xl font-bold ${color}`}>{value}</span></div>)}</section>

        <section className="space-y-4"><div className="relative flex items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"><Search className="ml-3 mr-2 h-5 w-5 shrink-0 text-slate-400" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onOpenMap(); }} aria-label="Search station destinations" placeholder="Search platform, station service, food..." className="min-h-11 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400" /><button onClick={onOpenVoiceCall} aria-label="Ask Rahul by voice" className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-3.5 text-xs font-bold text-white transition hover:bg-blue-800"><Mic className="h-4 w-4" /><span className="hidden sm:inline">Ask Rahul</span></button></div></section>

        <section><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Move through</p><h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Popular destinations</h2></div><span className="hidden text-xs font-semibold text-slate-400 sm:block">Tap any card to route</span></div><div className="flex gap-3 overflow-x-auto pb-2">{[['platforms', Train, 'Railway', 'bg-blue-50 text-blue-700'], ['food', Utensils, 'Food', 'bg-amber-50 text-amber-700'], ['metro', TramFront, 'Metro', 'bg-cyan-50 text-cyan-700'], ['services', ShieldCheck, 'Services', 'bg-emerald-50 text-emerald-700']].map(([id, Icon, label, style]) => <button key={String(id)} onClick={() => setSelectedFilter(String(id) as FilterId)} className={`flex min-w-[112px] flex-1 flex-col items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-bold transition ${selectedFilter === id ? 'border-blue-200 bg-white text-[#10213f] shadow-md' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-blue-200'}`}><span className={`flex h-12 w-12 items-center justify-center rounded-full ${style}`}><Icon className="h-6 w-6" /></span>{label}</button>)}</div></section>

        <section><div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Featured near you</p><h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">KSR Bengaluru Junction</h2></div><button onClick={onOpenMap} className="flex min-h-11 items-center gap-1 text-sm font-bold text-blue-700">See map <ChevronRight className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2">{filteredShortcuts.slice(0, 6).map((item, index) => { const Icon = item.icon; return <motion.button key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={() => { onSelectStation('SBC'); onOpenMap(); }} className="group flex min-h-[164px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}><Icon className={`h-5 w-5 ${item.iconColor}`} /></span><span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Clock3 className="h-3.5 w-3.5" /> {item.timeEstimate} <span className="text-slate-300">·</span> {item.distance}</span></div><div><h3 className="mt-5 text-base font-extrabold text-[#10213f] group-hover:text-blue-700">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.subtitle}</p></div><span className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-700">Route here <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></motion.button>; })}</div>{filteredShortcuts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No matching station destinations. Try a platform, food point, or service.</div>}</section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Station profile</p><h2 className="mt-1 text-lg font-extrabold">Official KSR blueprint</h2></div><Building2 className="h-6 w-6 text-blue-700" /></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{['3 terminals', '10 platforms', '56 food points', '24/7 cloak room'].map((label) => <div key={label} className="rounded-xl bg-slate-50 px-3 py-3 font-bold text-slate-700">{label}</div>)}</div></section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl safe-bottom"><div className="mx-auto grid max-w-md grid-cols-5 items-end"><button aria-label="Home" className="flex min-h-14 flex-col items-center justify-center gap-1 text-blue-700"><Home className="h-5 w-5" /><span className="text-[10px] font-bold">Home</span></button><button onClick={onOpenMap} aria-label="Open map" className="flex min-h-14 flex-col items-center justify-center gap-1 text-slate-500 transition hover:text-slate-900"><Navigation className="h-5 w-5" /><span className="text-[10px] font-semibold">Explore</span></button><button onClick={onOpenVoiceCall} aria-label="Open voice guide" className="relative -top-5 flex flex-col items-center gap-1"><span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#f5f8fc] bg-blue-700 text-white shadow-xl shadow-blue-700/30 transition hover:bg-blue-800 active:scale-95"><Volume2 className="h-7 w-7" /></span><span className="text-[10px] font-bold text-[#10213f]">Voice guide</span></button><button onClick={onOpenMap} aria-label="Open directory" className="flex min-h-14 flex-col items-center justify-center gap-1 text-slate-500 transition hover:text-slate-900"><Menu className="h-5 w-5" /><span className="text-[10px] font-semibold">Directory</span></button><button onClick={onOpenAdmin} aria-label="Open profile and settings" className="flex min-h-14 flex-col items-center justify-center gap-1 text-slate-500 transition hover:text-slate-900"><SlidersHorizontal className="h-5 w-5" /><span className="text-[10px] font-semibold">Admin</span></button></div></nav>
    </div>
  );
};

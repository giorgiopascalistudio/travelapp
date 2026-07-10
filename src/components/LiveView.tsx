import React, { useState, useEffect, useMemo } from "react";
import { Trip, Activity, DayPlan } from "../types";
import { 
  Clock, Navigation, HelpCircle, ArrowRight, ShieldAlert, CheckCircle, 
  Play, Pause, ChevronRight, Gauge, AlertTriangle, Coffee, MapPin, 
  Train, Bus, Footprints, Flame, Sparkles
} from "lucide-react";

interface LiveViewProps {
  trip: Trip;
  userLocation?: { lat: number; lng: number } | null;
}

export default function LiveView({ trip, userLocation }: LiveViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Local simulated coordinates state for testing positioning suggestions
  const [simulatedGPS, setSimulatedGPS] = useState<{ lat: number; lng: number } | null>(null);

  // Fallback to real userLocation first, then simulatedGPS, then null
  const currentGPS = userLocation || simulatedGPS;
  
  // Simulated Time: represent as minutes from midnight (0 to 1439). Default to 09:00 AM (540 mins)
  const [simulatedMinutes, setSimulatedMinutes] = useState(540); 
  const [isLiveClock, setIsLiveClock] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedDay = trip.days[selectedDayIndex] || trip.days[0];

  // Map real clock to simulated minutes when "Live Clock" is active
  useEffect(() => {
    if (!isLiveClock) return;

    const updateToRealTime = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      setSimulatedMinutes(mins);
    };

    updateToRealTime();
    const interval = setInterval(updateToRealTime, 15000); // update every 15s
    return () => clearInterval(interval);
  }, [isLiveClock]);

  // Simple play-simulation (ticks forward 2 minutes every second when active)
  useEffect(() => {
    if (!isPlaying || isLiveClock) return;

    const interval = setInterval(() => {
      setSimulatedMinutes((prev) => {
        const next = prev + 2;
        return next >= 1440 ? 480 : next; // cycle back to 08:00 AM if we hit midnight
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isLiveClock]);

  // Helper to convert minutes from midnight to HH:MM string
  const minutesToTimeString = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Helper to convert "HH:MM" to minutes from midnight
  const timeStringToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Convert current day's activity times to minutes for calculations
  const activitiesWithMinutes = useMemo(() => {
    if (!selectedDay) return [];
    return selectedDay.activities.map(act => ({
      ...act,
      startMins: timeStringToMinutes(act.startTime),
      endMins: timeStringToMinutes(act.endTime)
    }));
  }, [selectedDay]);

  // Calculate current active activity and next activity
  const activeStatus = useMemo(() => {
    const mins = simulatedMinutes;
    const list = activitiesWithMinutes;

    if (list.length === 0) return { active: null, next: null, type: 'empty' };

    // Find if there is an active activity right now
    const active = list.find(act => mins >= act.startMins && mins < act.endMins);

    if (active) {
      const activeIndex = list.findIndex(act => act.id === active.id);
      const next = list[activeIndex + 1] || null;
      return { active, next, type: 'active' };
    }

    // If no active, are we before the first activity?
    const first = list[0];
    if (first && mins < first.startMins) {
      return { active: null, next: first, type: 'before_trip' };
    }

    // Are we after the last activity?
    const last = list[list.length - 1];
    if (last && mins >= last.endMins) {
      return { active: null, next: null, type: 'after_trip' };
    }

    // Gap between activities (resting or unscheduled buffer)
    const next = list.find(act => act.startMins > mins) || null;
    return { active: null, next, type: 'gap' };

  }, [activitiesWithMinutes, simulatedMinutes]);

  // Total fatigue scoring sum up to simulated hour
  const accumulatedFatigue = useMemo(() => {
    let score = 25; // default energy starting at 100%, fatigue = 100 - energy
    const mins = simulatedMinutes;

    activitiesWithMinutes.forEach(act => {
      if (act.endMins <= mins) {
        if (act.averageFatigue === 'high') score += 20;
        else if (act.averageFatigue === 'medium') score += 10;
        else if (act.type === 'buffer' || act.type === 'meal') score -= 15; // resting recovers fatigue
      }
    });

    return Math.max(10, Math.min(95, score)); // clamp between 10% and 95%
  }, [activitiesWithMinutes, simulatedMinutes]);

  // Haversine distance calculator
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Recommended transport mode based on live/simulated distance
  const currentTransitRecommendation = useMemo(() => {
    if (!currentGPS) return null;
    
    // Find coordinates of target activity
    const targetActivity = activeStatus.active || activeStatus.next;
    if (!targetActivity || !targetActivity.lat || !targetActivity.lng) {
      return {
        distanceKm: 0,
        mode: 'walk',
        label: "Destinazione vicina",
        instruction: "Procedi a piedi per la meta desiderata."
      };
    }

    const dist = getDistanceInKm(currentGPS.lat, currentGPS.lng, targetActivity.lat, targetActivity.lng);

    if (dist < 0.8) {
      return {
        distanceKm: dist,
        mode: 'walk',
        label: "🚶 A Piedi",
        instruction: `La destinazione dista solo ${(dist * 1000).toFixed(0)}m. Una passeggiata di circa ${(dist * 12).toFixed(0)} min è l'opzione più veloce ed ecologica.`
      };
    } else if (dist < 4.0) {
      return {
        distanceKm: dist,
        mode: 'metro',
        label: "🚇 Metropolitana o Bus",
        instruction: `Distanza di ${dist.toFixed(1)} km. Prendi la linea della metro o autobus consigliata sotto per saltare il traffico urbano.`
      };
    } else {
      return {
        distanceKm: dist,
        mode: 'taxi',
        label: "🚖 Taxi o Treno veloce",
        instruction: `La meta dista ${dist.toFixed(1)} km. Per risparmiare tempo ed evitare affaticamenti, ti suggeriamo un taxi o treno espresso.`
      };
    }
  }, [currentGPS, activeStatus]);

  const snapToActivity = (startTime: string) => {
    setIsLiveClock(false);
    setIsPlaying(false);
    setSimulatedMinutes(timeStringToMinutes(startTime) + 2); // snap to 2 mins after start
  };

  const getMobilityIcon = (mode?: string) => {
    if (mode === 'metro') return <Train className="w-5 h-5 text-purple-600 shrink-0" />;
    if (mode === 'bus') return <Bus className="w-5 h-5 text-blue-600 shrink-0" />;
    if (mode === 'walk') return <Footprints className="w-5 h-5 text-slate-500 shrink-0" />;
    return <Navigation className="w-5 h-5 text-amber-500 shrink-0" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-4 font-sans text-slate-700" id="live-copilot-root">
      
      {/* Selector and Simulation Panel */}
      <div className="bg-white border border-zinc-150 rounded-xl p-5 mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[8px] font-bold font-mono tracking-widest text-zinc-650 uppercase bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded">
              ASSISTENTE DI BORDO LIVE
            </span>
            <h2 className="text-base font-bold font-display text-slate-900 mt-1">
              Simulatore di Cabina Operativa
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Sposta il cursore o attiva la riproduzione per simulare l'andamento del co-pilot durante l'itinerario.
            </p>
          </div>

          {/* Toggle between Live clock and Simulation slider */}
          <div className="flex gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200/60 self-start md:self-auto">
            <button
              onClick={() => { setIsLiveClock(false); setIsPlaying(false); }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                !isLiveClock ? 'bg-white text-black font-bold border border-zinc-250/70 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Simulatore
            </button>
            <button
              onClick={() => setIsLiveClock(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                isLiveClock ? 'bg-white text-black font-bold border border-zinc-250/70 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ora Reale 🕒
            </button>
          </div>
        </div>

        {/* Day Selector for Simulation */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {trip.days.map((day, idx) => (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                selectedDayIndex === idx
                  ? 'bg-zinc-50 border-zinc-300 text-black font-bold'
                  : 'bg-white border-zinc-200 text-slate-500 hover:bg-zinc-50'
              }`}
            >
              Giorno {day.dayNumber}
            </button>
          ))}
        </div>

        {/* Timeline Slider and Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold font-mono text-slate-400 uppercase">
            <span>Inizio Giorno (08:00)</span>
            <span className="text-xs font-extrabold font-mono text-black bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-200 tracking-wider">
              {minutesToTimeString(simulatedMinutes)}
            </span>
            <span>Fine Giorno (22:00)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (!isLiveClock) setIsPlaying(!isPlaying); }}
              disabled={isLiveClock}
              className={`p-2 rounded-full border transition shrink-0 cursor-pointer ${
                isLiveClock 
                  ? 'bg-zinc-50 text-slate-350 border-zinc-200' 
                  : isPlaying 
                  ? 'bg-black text-white border-black hover:bg-zinc-900' 
                  : 'bg-white text-black border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <input
              type="range"
              min={480} // 08:00 AM
              max={1320} // 10:00 PM
              value={simulatedMinutes}
              disabled={isLiveClock}
              onChange={(e) => setSimulatedMinutes(Number(e.target.value))}
              className="flex-1 h-1 bg-zinc-100 rounded-md appearance-none cursor-pointer accent-black focus:outline-none disabled:opacity-50 border border-zinc-200"
            />
          </div>

          {/* Quick jump snap-to buttons for testing */}
          <div className="pt-3 border-t border-zinc-150">
            <p className="text-[9px] font-bold font-mono text-slate-400 uppercase mb-1.5">Simula l'istante di arrivo di una tappa:</p>
            <div className="flex flex-wrap gap-1">
              {selectedDay.activities.map((act) => (
                <button
                  key={act.id}
                  onClick={() => snapToActivity(act.startTime)}
                  className="px-2 py-0.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-[9px] font-mono text-slate-500 hover:text-black transition cursor-pointer"
                >
                  {act.startTime} • {act.title.substring(0, 15)}...
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Copilot Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Copilot Screen (Left 2/3) */}
        <div className="md:col-span-2 space-y-6">
          
          {activeStatus.type === 'active' && activeStatus.active ? (
            /* ACTIVE ACTIVITY ELEMENT */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden space-y-5">
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-black"></div>

              {/* Header block */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-800 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                    ADESSO IN CORSO
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg">
                  {activeStatus.active.startTime} – {activeStatus.active.endTime}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 leading-snug">
                  {activeStatus.active.title}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {activeStatus.active.locationName}
                </p>
                <p className="text-xs text-slate-600 font-medium font-sans mt-3 leading-relaxed">
                  {activeStatus.active.description}
                </p>
              </div>

              {/* Progress and countdown timers */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Tempo Rimanente</p>
                  <p className="text-2xl font-extrabold font-display text-slate-900 mt-1">
                    {activeStatus.active.endMins - simulatedMinutes} <span className="text-xs font-sans font-normal text-slate-500">minuti</span>
                  </p>
                </div>
                
                {/* Visual clock progress */}
                <div className="w-14 h-14 rounded-full border-4 border-zinc-300 flex items-center justify-center font-mono text-xs font-bold text-black relative">
                  <Clock className="w-4 h-4 absolute text-zinc-300" />
                  <span>-{activeStatus.active.endMins - simulatedMinutes}m</span>
                </div>
              </div>

              {/* Specialize display if Transit active */}
              {activeStatus.active.type === 'transit' && activeStatus.active.transitDetails && (
                <div className="bg-zinc-100 border border-zinc-350 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-black font-display">
                    <span className="flex items-center gap-1.5 uppercase">
                      {getMobilityIcon(activeStatus.active.transitDetails.mode)}
                      CO-PILOT DI TRATTA URBANA
                    </span>
                    {activeStatus.active.transitDetails.line && (
                      <span className="px-2.5 py-0.5 bg-white border border-zinc-350 text-black rounded-lg font-mono text-[10px]">
                        {activeStatus.active.transitDetails.line}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-600 space-y-2">
                    <div className="flex items-center gap-2 pl-1">
                      <span className="font-bold text-slate-400">DA:</span> 
                      <span className="font-bold text-slate-800">{activeStatus.active.transitDetails.fromStop || "Partenza"}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <span className="font-bold text-slate-400">A:</span> 
                      <span className="font-bold text-slate-800">{activeStatus.active.transitDetails.toStop || "Destinazione"}</span>
                    </div>
                    {activeStatus.active.transitDetails.direction && (
                      <p className="text-[10px] text-slate-500 leading-normal pl-1">
                        👉 Sali a bordo del vettore direzione <strong>{activeStatus.active.transitDetails.direction}</strong>.
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* EMPTY/GAP STATE RENDERS */
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
              <Coffee className="w-12 h-12 text-slate-350 mx-auto animate-pulse" />
              <div>
                <h3 className="font-bold font-display text-slate-900 uppercase tracking-wide text-sm">
                  {activeStatus.type === 'before_trip' ? "Nessuna attività in corso" : 
                   activeStatus.type === 'after_trip' ? "Operazioni Giornaliere Concluse" : "Pausa Strategica"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {activeStatus.type === 'before_trip' ? "La giornata deve ancora iniziare. Fai una buona colazione e premi Play per simulare!" : 
                   activeStatus.type === 'after_trip' ? "Tutte le tappe previste sono state eseguite con successo. Rientra in hotel per riposare." : 
                   "Nessuna tappa schedulata per questo preciso istante. Tempo libero per esplorare o rilassarsi prima della prossima tappa."}
                </p>
              </div>
            </div>
          )}

          {/* NEXT UP SUB-PANEL */}
          {activeStatus.next && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 shrink-0 shadow-xs">
                  {getMobilityIcon(activeStatus.next.type === 'transit' ? activeStatus.next.transitDetails?.mode : activeStatus.next.type)}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold font-mono text-zinc-800 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">
                    PROSSIMA TAPPA ({activeStatus.next.startTime})
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{activeStatus.next.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{activeStatus.next.locationName}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </div>
          )}

        </div>

        {/* Telemetry Panel Side widgets (Right 1/3) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6">
            <h3 className="text-[10px] font-extrabold font-display tracking-widest text-slate-400 uppercase">
              BIOMETRIA & FATICA IN TEMPO REALE
            </h3>

            {/* Fatigue gauge dial */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <Gauge className="w-4 h-4 text-black" />
                  Affaticamento Accumulato
                </span>
                <span className={`font-mono font-bold ${accumulatedFatigue >= 70 ? 'text-red-600' : accumulatedFatigue >= 45 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {accumulatedFatigue}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    accumulatedFatigue >= 70 ? 'bg-red-500' : accumulatedFatigue >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${accumulatedFatigue}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                {accumulatedFatigue >= 75 ? "🔴 Livello di fatica critico. Si consiglia vivamente una pausa in hotel o un trasferimento in taxi." : 
                 accumulatedFatigue >= 45 ? "🟡 Affaticamento moderato. Ideale sedersi per un pasto o fare una pausa caffè." : 
                 "🟢 Livello di fatica ideale. Ottima autonomia biologica per camminare e visitare monumenti!"}
              </p>
            </div>

            {/* Simulated Energy percentage */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  Autonomia Energetica Residua
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {100 - accumulatedFatigue}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className="h-full bg-black rounded-full transition-all duration-500"
                  style={{ width: `${100 - accumulatedFatigue}%` }}
                ></div>
              </div>
            </div>

            {/* Operative checklist warnings */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block">ALERT DI VIAGGIO</span>
              
              {accumulatedFatigue >= 60 ? (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px] text-red-700 leading-normal font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Soglia biologica superata:</strong> Prevedi una tratta taxi al posto della metro per la prossima fermata.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-[10px] text-emerald-700 leading-normal font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Logistica Stabile:</strong> Transiti urbani regolari. Margini di orario perfettamente allineati.
                  </div>
                </div>
              )}
            </div>

            {/* GPS POSITIONING & NAVIGATION INTELLIGENCE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold font-display tracking-widest text-slate-400 uppercase">
                  POSIZIONAMENTO GPS & NAVIGAZIONE
                </span>
                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                  userLocation 
                    ? 'bg-emerald-50 text-emerald-700 animate-pulse' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${userLocation ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                  {userLocation ? "LIVE GPS" : "SIMULATO"}
                </span>
              </div>

              {currentGPS ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl text-[10px] font-mono text-slate-600">
                    <div>
                      <span className="block text-slate-400 text-[8px] font-bold">LATITUDE</span>
                      <span className="font-bold text-slate-800">{currentGPS.lat.toFixed(5)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-400 text-[8px] font-bold">LONGITUDE</span>
                      <span className="font-bold text-slate-800">{currentGPS.lng.toFixed(5)}</span>
                    </div>
                  </div>

                  {currentTransitRecommendation && (
                    <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-xl space-y-2 animate-[fadeIn_0.15s_ease-out]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-black uppercase tracking-wide">
                          {currentTransitRecommendation.label}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-black bg-white border border-zinc-300 px-1.5 py-0.5 rounded-md">
                          Distanza: {currentTransitRecommendation.distanceKm.toFixed(2)} km
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        {currentTransitRecommendation.instruction}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 text-center">
                  <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                    GPS non attivo o bloccato dal browser. Seleziona un punto sulla mappa o clicca sotto per simulare la tua posizione di partenza:
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button
                      type="button"
                      onClick={() => setSimulatedGPS({ lat: activeStatus.active?.lat || activeStatus.next?.lat || 41.8902, lng: activeStatus.active?.lng || activeStatus.next?.lng || 12.4922 })}
                      className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-[9px] font-bold text-amber-800 rounded-lg transition cursor-pointer"
                    >
                      📍 Simula qui vicino
                    </button>
                  </div>
                </div>
              )}

              {currentGPS && !userLocation && (
                <button
                  type="button"
                  onClick={() => setSimulatedGPS(null)}
                  className="w-full py-1.5 border border-dashed border-slate-200 hover:border-slate-300 text-[9px] font-bold text-slate-500 hover:text-slate-700 rounded-xl transition cursor-pointer text-center"
                >
                  Spegni Posizione Simulata
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useMemo } from "react";
import { Trip, DayPlan, Activity } from "../types";
import { MapPin, Navigation, Compass, Calendar, Info, Clock, Route, Train, Bus, Footprints, ChevronRight } from "lucide-react";

interface SmartMapViewProps {
  trip: Trip;
  userLocation?: { lat: number; lng: number } | null;
}

export default function SmartMapView({ trip, userLocation }: SmartMapViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

  const selectedDay = trip.days[selectedDayIndex] || trip.days[0];

  // Filter activities to only those that have lat/lng (typically non-transit, or transit with coords)
  const mapNodes = useMemo(() => {
    if (!selectedDay) return [];
    return selectedDay.activities.filter(a => a.lat !== undefined && a.lng !== undefined);
  }, [selectedDay]);

  // Compute projection bounds based on ALL mapNodes AND the optional userLocation
  const bounds = useMemo(() => {
    if (mapNodes.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    mapNodes.forEach(node => {
      if (node.lat! < minLat) minLat = node.lat!;
      if (node.lat! > maxLat) maxLat = node.lat!;
      if (node.lng! < minLng) minLng = node.lng!;
      if (node.lng! > maxLng) maxLng = node.lng!;
    });

    if (userLocation) {
      if (userLocation.lat < minLat) minLat = userLocation.lat;
      if (userLocation.lat > maxLat) maxLat = userLocation.lat;
      if (userLocation.lng < minLng) minLng = userLocation.lng;
      if (userLocation.lng > maxLng) maxLng = userLocation.lng;
    }

    const latRange = maxLat - minLat === 0 ? 0.01 : maxLat - minLat;
    const lngRange = maxLng - minLng === 0 ? 0.01 : maxLng - minLng;

    return { minLat, maxLat, minLng, maxLng, latRange, lngRange };
  }, [mapNodes, userLocation]);

  // Compute SVG coordinates using custom projection
  const projectedNodes = useMemo(() => {
    if (!bounds || mapNodes.length === 0) return [];

    const margin = 50;
    const width = 600;
    const height = 400;

    return mapNodes.map(node => {
      const y = margin + ((bounds.maxLat - node.lat!) / bounds.latRange) * (height - margin * 2);
      const x = margin + ((node.lng! - bounds.minLng) / bounds.lngRange) * (width - margin * 2);

      return {
        ...node,
        x,
        y
      };
    });
  }, [mapNodes, bounds]);

  // Project the user's location if it exists
  const projectedUserLocation = useMemo(() => {
    if (!bounds || !userLocation) return null;

    const margin = 50;
    const width = 600;
    const height = 400;

    const y = margin + ((bounds.maxLat - userLocation.lat) / bounds.latRange) * (height - margin * 2);
    const x = margin + ((userLocation.lng - bounds.minLng) / bounds.lngRange) * (width - bounds.minLng === 0 ? 0.01 : bounds.lngRange) * (width - margin * 2);

    return { x, y };
  }, [userLocation, bounds]);

  const activeActivity = useMemo(() => {
    return selectedDay?.activities.find(a => a.id === activeActivityId);
  }, [selectedDay, activeActivityId]);

  // Find the color and style according to activity type (Monochrome / Black & White)
  const getNodeColor = (type: string, isActive: boolean) => {
    if (isActive) return "fill-black stroke-slate-350";
    if (type === 'checkin' || type === 'checkout') return "fill-zinc-800 stroke-white";
    if (type === 'meal') return "fill-zinc-500 stroke-white";
    if (type === 'buffer') return "fill-zinc-300 stroke-white";
    if (type === 'flight_train') return "fill-zinc-900 stroke-white";
    return "fill-zinc-700 stroke-white";
  };

  return (
    <div className="max-w-6xl mx-auto py-4" id="smart-map-root">
      
      {/* Selector and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-black" />
            Mappa Sequenziale Percorsi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Proiezione schematica vettoriale delle tappe giornaliere e vettori di mobilità urbana.
          </p>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2">
          {trip.days.map((day, idx) => (
            <button
              key={day.dayNumber}
              onClick={() => { setSelectedDayIndex(idx); setActiveActivityId(null); }}
              className={`px-3 py-1.5 text-xs font-bold font-display rounded-xl border transition cursor-pointer ${
                selectedDayIndex === idx
                  ? 'bg-black text-white border-black shadow-sm font-bold'
                  : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Giorno {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Vector Map Grid (Left 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[440px]">
            
            {/* Map Canvas Header Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 border border-slate-200/80 px-3 py-1.5 rounded-xl text-[9px] font-bold font-mono text-slate-500 flex items-center gap-2 shadow-xs">
              <Route className="w-3.5 h-3.5 text-black" />
              <span>DIAGRAMMA VETTORIALE: {trip.constraints.destination.toUpperCase()}</span>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="w-full flex-1 p-6 flex items-center justify-center">
              {projectedNodes.length === 0 ? (
                <div className="text-slate-400 text-xs text-center font-mono py-20">
                  Nessuna coordinata GPS disponibile per questo giorno.
                </div>
              ) : (
                <svg viewBox="0 0 600 400" className="w-full h-full max-h-[380px] select-none">
                  
                  {/* Grid Lines background */}
                  <defs>
                    <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="0.75" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#map-grid)" />

                  {/* Draw connecting route paths between nodes */}
                  {projectedNodes.map((node, idx) => {
                    if (idx === projectedNodes.length - 1) return null;
                    const nextNode = projectedNodes[idx + 1];
                    const isTransitNext = selectedDay.activities[idx + 1]?.type === 'transit';
                    
                    return (
                      <g key={`path-${node.id}-${nextNode.id}`}>
                        {/* Shadow path */}
                        <line
                          x1={node.x}
                          y1={node.y}
                          x2={nextNode.x}
                          y2={nextNode.y}
                          stroke="rgba(15, 23, 42, 0.05)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Actual connecting vector path */}
                        <line
                          x1={node.x}
                          y1={node.y}
                          x2={nextNode.x}
                          y2={nextNode.y}
                          stroke={isTransitNext ? "#a1a1aa" : "#18181b"}
                          strokeWidth="3.5"
                          strokeDasharray={isTransitNext ? "6, 4" : "none"}
                          strokeLinecap="round"
                        />
                        {/* Center arrow indicator */}
                        <circle
                          cx={(node.x + nextNode.x) / 2}
                          cy={(node.y + nextNode.y) / 2}
                          r="3.5"
                          className={isTransitNext ? "fill-zinc-300" : "fill-zinc-200"}
                        />
                      </g>
                    );
                  })}

                  {/* Render node visual pins */}
                  {projectedNodes.map((node, idx) => {
                    const isActive = activeActivityId === node.id;
                    
                    return (
                      <g 
                        key={`node-${node.id}`} 
                        className="cursor-pointer"
                        onClick={() => setActiveActivityId(node.id)}
                      >
                        {/* Ambient outer halo glow for active node */}
                        {isActive && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            className="fill-black/10 stroke-black/20 animate-pulse"
                          />
                        )}

                        {/* Interactive trigger circle */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isActive ? "13" : "10"}
                          className="fill-white stroke-slate-300 shadow-sm transition-all duration-300"
                          strokeWidth="1.5"
                        />

                        {/* Solid colored core marker */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isActive ? "7" : "5"}
                          className={`${getNodeColor(node.type, isActive)} transition-colors duration-300`}
                          strokeWidth="1.5"
                        />

                        {/* Small number badge inside SVG */}
                        <text
                          x={node.x}
                          y={node.y + 19}
                          className="fill-slate-500 font-mono text-[9px] font-bold text-center"
                          textAnchor="middle"
                        >
                          {idx + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Real-time User Location Pulsing Marker */}
                  {projectedUserLocation && (
                    <g>
                      <circle
                        cx={projectedUserLocation.x}
                        cy={projectedUserLocation.y}
                        r="14"
                        className="fill-zinc-500/25 stroke-zinc-500/10"
                        style={{ transformOrigin: `${projectedUserLocation.x}px ${projectedUserLocation.y}px`, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                      />
                      <circle
                        cx={projectedUserLocation.x}
                        cy={projectedUserLocation.y}
                        r="8"
                        className="fill-zinc-500/30"
                      />
                      <circle
                        cx={projectedUserLocation.x}
                        cy={projectedUserLocation.y}
                        r="4.5"
                        className="fill-zinc-900 stroke-white"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* Map Legend Overlay */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between flex-wrap gap-3 text-[10px] font-bold font-mono">
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-zinc-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span> Hotel Base
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span> Visita
                </span>
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-500"></span> Ristorazione
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-450 border-dashed border"></span> Linea Mezzi
                </span>
                {userLocation && (
                  <span className="flex items-center gap-1.5 text-black animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-black"></span> La tua posizione (GPS)
                  </span>
                )}
              </div>
              <span className="text-slate-400 font-semibold text-[9px]">Clicca sui nodi per i dettagli</span>
            </div>

          </div>

          {/* Active Node Detail Card Overlay */}
          {activeActivity ? (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 shadow-sm animate-[fadeIn_0.15s_ease-out]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold font-mono bg-white border border-zinc-250 text-zinc-800 px-2.5 py-0.5 rounded-lg w-fit">
                    <Clock className="w-3.5 h-3.5" />
                    {activeActivity.startTime} – {activeActivity.endTime}
                  </div>
                  <h4 className="text-sm font-bold font-display text-slate-950 mt-1.5">{activeActivity.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {activeActivity.locationName}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveActivityId(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  Chiudi
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">{activeActivity.description}</p>
            </div>
          ) : (
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-semibold">
              💡 Seleziona un punto numerato sulla mappa per visualizzarne i dettagli logistici.
            </div>
          )}
        </div>

        {/* Step-by-Step Navigation List Sidebar (Right 1/3) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-full flex flex-col">
            <h3 className="text-[10px] font-extrabold font-display tracking-widest text-slate-400 uppercase mb-3">
              SEQUENZA OPERATIVA ({mapNodes.length} TAPPE)
            </h3>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {projectedNodes.map((node, index) => {
                const isActive = activeActivityId === node.id;
                
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveActivityId(node.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3.5 cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-100/85 border-zinc-350 text-zinc-950 shadow-xs font-bold' 
                        : 'bg-slate-50/50 hover:bg-slate-100 border-slate-100 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {/* Badge number */}
                    <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                      isActive ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-zinc-800">{node.startTime}</span>
                        <span className="text-[9px] font-bold font-mono uppercase bg-white border border-slate-200 px-1.5 rounded text-slate-400">
                          {node.type === 'checkin' ? 'Hotel' : node.type === 'meal' ? 'Cibo' : 'Visita'}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold font-display truncate mt-0.5 ${isActive ? 'text-black' : 'text-slate-800'}`}>
                        {node.title}
                      </h4>
                      <p className="text-[10px] text-slate-450 truncate mt-0.5 font-semibold">
                        {node.locationName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

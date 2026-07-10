import React, { useState } from "react";
import { Trip, DayPlan, Activity, TransitDetails } from "../types";
import { 
  Calendar, MapPin, Clock, Trash2, Edit2, Plus, Check, X,
  Footprints, Train, Bus, Plane, Coffee, ShieldAlert,
  Utensils, Sparkles, Navigation, Info, ArrowRight, Gauge
} from "lucide-react";

interface TimelineViewProps {
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

export default function TimelineView({ trip, onTripUpdated }: TimelineViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  
  // Edit Form States
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFatigue, setEditFatigue] = useState<'low' | 'medium' | 'high'>('medium');
  const [editType, setEditType] = useState<Activity['type']>('visit');

  // Transit details editing
  const [editTransitMode, setEditTransitMode] = useState<TransitDetails['mode']>('walk');
  const [editTransitLine, setEditTransitLine] = useState("");
  const [editTransitDir, setEditTransitDir] = useState("");
  const [editTransitFrom, setEditTransitFrom] = useState("");
  const [editTransitTo, setEditTransitTo] = useState("");

  // Add New Activity States
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("11:00");
  const [newDesc, setNewDesc] = useState("");
  const [newFatigue, setNewFatigue] = useState<'low' | 'medium' | 'high'>('medium');
  const [newType, setNewType] = useState<Activity['type']>('visit');

  const selectedDay = trip.days[selectedDayIndex] || trip.days[0];

  if (!selectedDay) {
    return <div className="text-center py-10 text-slate-450 font-medium">Nessun piano disponibile per questo viaggio.</div>;
  }

  // Get icons according to type with correct color
  const getActivityIcon = (type: Activity['type'], transitMode?: TransitDetails['mode']) => {
    switch (type) {
      case 'checkin':
      case 'checkout':
        return <Coffee className="w-3 h-3 text-zinc-950 shrink-0" />;
      case 'transit':
        if (transitMode === 'metro') return <Train className="w-3 h-3 text-zinc-800 shrink-0" />;
        if (transitMode === 'bus') return <Bus className="w-3 h-3 text-zinc-700 shrink-0" />;
        if (transitMode === 'taxi') return <Navigation className="w-3 h-3 text-zinc-600 shrink-0" />;
        return <Footprints className="w-3 h-3 text-zinc-500 shrink-0" />;
      case 'visit':
        return <Sparkles className="w-3 h-3 text-zinc-950 shrink-0" />;
      case 'meal':
        return <Utensils className="w-3 h-3 text-zinc-800 shrink-0" />;
      case 'buffer':
        return <Coffee className="w-3 h-3 text-zinc-400 shrink-0" />;
      case 'flight_train':
        return <Plane className="w-3 h-3 text-zinc-950 shrink-0" />;
      default:
        return <Info className="w-3 h-3 text-zinc-500 shrink-0" />;
    }
  };

  // Get background color class (Monochrome high-contrast design)
  const getActivityBg = (type: Activity['type']) => {
    switch (type) {
      case 'checkin':
      case 'checkout':
        return 'bg-white border-zinc-200 text-slate-900';
      case 'transit':
        return 'bg-zinc-50 border-zinc-150 text-slate-650';
      case 'visit':
        return 'bg-white border-zinc-200 text-slate-900';
      case 'meal':
        return 'bg-white border-zinc-200 text-slate-900';
      case 'buffer':
        return 'bg-white border-zinc-200 text-slate-900';
      case 'flight_train':
        return 'bg-zinc-50 border-zinc-200 text-slate-900';
      default:
        return 'bg-white border-zinc-200 text-slate-850';
    }
  };

  const startEdit = (act: Activity) => {
    setEditingActivityId(act.id);
    setEditTitle(act.title);
    setEditLocation(act.locationName);
    setEditStartTime(act.startTime);
    setEditEndTime(act.endTime);
    setEditDesc(act.description);
    setEditFatigue(act.averageFatigue);
    setEditType(act.type);
    
    if (act.transitDetails) {
      setEditTransitMode(act.transitDetails.mode);
      setEditTransitLine(act.transitDetails.line || "");
      setEditTransitDir(act.transitDetails.direction || "");
      setEditTransitFrom(act.transitDetails.fromStop || "");
      setEditTransitTo(act.transitDetails.toStop || "");
    } else {
      setEditTransitMode('walk');
      setEditTransitLine("");
      setEditTransitDir("");
      setEditTransitFrom("");
      setEditTransitTo("");
    }
  };

  const cancelEdit = () => {
    setEditingActivityId(null);
  };

  const saveEdit = (actId: string) => {
    const updatedDays = trip.days.map((day) => {
      const updatedActivities = day.activities.map((act) => {
        if (act.id === actId) {
          const updatedAct: Activity = {
            ...act,
            type: editType,
            title: editTitle,
            locationName: editLocation,
            startTime: editStartTime,
            endTime: editEndTime,
            description: editDesc,
            averageFatigue: editFatigue,
            durationMinutes: calculateDuration(editStartTime, editEndTime)
          };

          if (editType === 'transit') {
            updatedAct.transitDetails = {
              mode: editTransitMode,
              line: editTransitLine || undefined,
              direction: editTransitDir || undefined,
              fromStop: editTransitFrom || undefined,
              toStop: editTransitTo || undefined
            };
          } else {
            delete updatedAct.transitDetails;
          }

          return updatedAct;
        }
        return act;
      });

      // Sort activities chronologically by startTime
      updatedActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        ...day,
        activities: updatedActivities
      };
    });

    onTripUpdated({
      ...trip,
      days: updatedDays
    });

    setEditingActivityId(null);
  };

  const deleteActivity = (actId: string) => {
    const updatedDays = trip.days.map((day) => {
      if (day.dayNumber === selectedDay.dayNumber) {
        return {
          ...day,
          activities: day.activities.filter(a => a.id !== actId)
        };
      }
      return day;
    });

    onTripUpdated({
      ...trip,
      days: updatedDays
    });
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocation.trim()) return;

    const newAct: Activity = {
      id: "custom-" + Date.now(),
      type: newType,
      title: newTitle,
      locationName: newLocation,
      startTime: newStartTime,
      endTime: newEndTime,
      description: newDesc || "Attività inserita manualmente nel TravelOS.",
      averageFatigue: newFatigue,
      durationMinutes: calculateDuration(newStartTime, newEndTime),
      lat: selectedDay.activities[0]?.lat || 41.9028,
      lng: selectedDay.activities[0]?.lng || 12.4964
    };

    const updatedDays = trip.days.map((day) => {
      if (day.dayNumber === selectedDay.dayNumber) {
        const sortedActs = [...day.activities, newAct].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return {
          ...day,
          activities: sortedActs
        };
      }
      return day;
    });

    onTripUpdated({
      ...trip,
      days: updatedDays
    });

    // Reset Form
    setNewTitle("");
    setNewLocation("");
    setNewStartTime("12:00");
    setNewEndTime("13:00");
    setNewDesc("");
    setNewFatigue("medium");
    setNewType("visit");
    setIsAdding(false);
  };

  const calculateDuration = (start: string, end: string): number => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm);
      return diffMins > 0 ? diffMins : 30;
    } catch {
      return 60;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4" id="timeline-view-root">
      
      {/* Day Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-zinc-150">
        <div className="flex flex-wrap gap-1.5">
          {trip.days.map((day, idx) => (
            <button
              key={day.dayNumber}
              onClick={() => { setSelectedDayIndex(idx); setIsAdding(false); cancelEdit(); }}
              className={`px-3 py-1.5 text-xs font-semibold font-display rounded-lg border transition cursor-pointer ${
                selectedDayIndex === idx
                  ? 'bg-zinc-50 border-zinc-350 text-black font-semibold'
                  : 'bg-white text-slate-500 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              Giorno {day.dayNumber}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-medium font-mono transition cursor-pointer self-start sm:self-auto"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? "Annulla" : "Aggiungi Tappa"}
        </button>
      </div>

      {/* Day Header Info */}
      <div className="bg-white border border-zinc-150 rounded-xl p-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[8px] font-bold font-mono tracking-widest text-zinc-600 uppercase bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded">
            PIANO OPERATIVO • GIORNO {selectedDay.dayNumber}
          </span>
          <h2 className="text-xl font-bold font-display text-slate-900 mt-1.5">
            {selectedDay.title}
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {selectedDay.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {selectedDay.activities.length} Tappe Configurate
            </span>
          </div>
        </div>

        {/* Rapid stats banner */}
        <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-150 flex items-center gap-5 text-[11px] text-slate-500 font-mono">
          <div>
            <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">RITMO</p>
            <p className="font-bold text-slate-800 capitalize mt-0.5">{trip.profile.pace}</p>
          </div>
          <div className="border-l border-zinc-200 h-6"></div>
          <div>
            <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">FOCUS</p>
            <p className="font-bold text-slate-800 capitalize mt-0.5">{trip.profile.focus}</p>
          </div>
        </div>
      </div>

      {/* Add New Activity Section */}
      {isAdding && (
        <form onSubmit={handleAddActivity} className="bg-white border border-zinc-200 rounded-xl p-5 mb-5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-100">
            <Plus className="w-3.5 h-3.5 text-black" />
            <h3 className="font-bold text-slate-900 font-display text-[10px] uppercase tracking-wider">Aggiungi Nuova Tappa Manuale</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Titolo Attività</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="E.g., Aperitivo a Trastevere"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nome Location</label>
              <input
                type="text"
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="E.g., Freni e Frizioni"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Ora Inizio</label>
              <input
                type="time"
                required
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Ora Fine</label>
              <input
                type="time"
                required
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Affaticamento</label>
              <select
                value={newFatigue}
                onChange={(e) => setNewFatigue(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="low">Basso (Relax)</option>
                <option value="medium">Medio (Camminata)</option>
                <option value="high">Alto (Frenetico)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tipo Attività</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="visit">Visita Monumento</option>
                <option value="meal">Pasto / Ristorante</option>
                <option value="transit">Spostamento / Transit</option>
                <option value="leisure">Tempo Libero</option>
                <option value="buffer">Pausa Riposo</option>
                <option value="checkin">Check-in</option>
                <option value="checkout">Check-out</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Descrizione / Note operative</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="E.g., Ideale ordinare un cocktail della casa"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black hover:bg-zinc-800 text-white font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            Aggiungi ad Itinerario
          </button>
        </form>
      )}

      {/* Main Activity Timeline Stack */}
      <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-5">
        {selectedDay.activities.map((act) => {
          const isEditing = editingActivityId === act.id;
          
          return (
            <div key={act.id} className="relative group">
              
              {/* Timeline Bullet Anchor */}
              <div className="absolute -left-[35px] top-4.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-xs">
                {getActivityIcon(act.type, act.transitDetails?.mode)}
              </div>

              {/* TIMELINE CARD */}
              <div className={`p-4 rounded-2xl border transition ${getActivityBg(act.type)}`}>
                
                {isEditing ? (
                  /* EDITING SUB-FORM IN-PLACE */
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="font-bold text-slate-800">Modifica Tappa</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => saveEdit(act.id)} className="p-1 bg-emerald-500 text-white rounded-lg cursor-pointer"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="p-1 bg-slate-350 text-slate-700 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Titolo</label>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Location</label>
                        <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Inizio</label>
                        <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Fine</label>
                        <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Affaticamento</label>
                        <select value={editFatigue} onChange={(e) => setEditFatigue(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded">
                          <option value="low">Basso</option>
                          <option value="medium">Medio</option>
                          <option value="high">Alto</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Descrizione</label>
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded h-16" />
                    </div>

                    {/* Additional Transit fields if transit type is chosen */}
                    {editType === 'transit' && (
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Dettagli di Transito</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-slate-400">Mezzo</label>
                            <select value={editTransitMode} onChange={(e) => setEditTransitMode(e.target.value as any)} className="w-full p-1.5 bg-white border border-slate-200 rounded">
                              <option value="walk">Pedonale</option>
                              <option value="metro">Metro</option>
                              <option value="bus">Autobus</option>
                              <option value="taxi">Taxi</option>
                              <option value="train">Treno locale</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400">Linea (Num/Nome)</label>
                            <input type="text" value={editTransitLine} onChange={(e) => setEditTransitLine(e.target.value)} placeholder="E.g., Linea A" className="w-full p-1.5 bg-white border border-slate-200 rounded" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="block text-[8px] text-slate-400">Direzione</label>
                            <input type="text" value={editTransitDir} onChange={(e) => setEditTransitDir(e.target.value)} placeholder="E.g., Battistini" className="w-full p-1.5 bg-white border border-slate-200 rounded" />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400">Da Stazione</label>
                            <input type="text" value={editTransitFrom} onChange={(e) => setEditTransitFrom(e.target.value)} placeholder="Termini" className="w-full p-1.5 bg-white border border-slate-200 rounded" />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400">A Stazione</label>
                            <input type="text" value={editTransitTo} onChange={(e) => setEditTransitTo(e.target.value)} placeholder="Ottaviano" className="w-full p-1.5 bg-white border border-slate-200 rounded" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* STANDARD RENDER MODE */
                  <div>
                    
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4">
                      
                      {/* Time and Title info */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-mono font-bold text-slate-800 bg-black/5 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-black" />
                          {act.startTime} - {act.endTime}
                        </span>
                        
                        <h4 className="font-bold text-slate-900 font-display text-sm">
                          {act.title}
                        </h4>
                        
                        {act.type !== 'transit' && (
                          <span className="text-[10px] text-slate-400 font-medium font-sans">
                            • @ {act.locationName}
                          </span>
                        )}
                      </div>

                      {/* Timeline Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition shrink-0">
                        <button
                          onClick={() => startEdit(act)}
                          className="p-1.5 hover:bg-black/5 text-slate-400 hover:text-black rounded-lg cursor-pointer transition"
                          title="Modifica tappa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteActivity(act.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition"
                          title="Elimina tappa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                    {/* Body Info */}
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans font-medium">
                      {act.description}
                    </p>

                    {/* Specific Transit Segment Details */}
                    {act.type === 'transit' && act.transitDetails && (
                      <div className="mt-2.5 p-3 bg-white/60 border border-slate-200/50 rounded-xl space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded bg-black/5`}>
                            {act.transitDetails.mode === 'metro' && <Train className="w-3.5 h-3.5 text-zinc-850" />}
                            {act.transitDetails.mode === 'bus' && <Bus className="w-3.5 h-3.5 text-zinc-700" />}
                            {act.transitDetails.mode === 'taxi' && <Navigation className="w-3.5 h-3.5 text-zinc-600" />}
                            {act.transitDetails.mode === 'walk' && <Footprints className="w-3.5 h-3.5 text-zinc-500" />}
                          </div>
                          <div>
                            <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wide">METODO TRANSIT:</span>{" "}
                            <span className="capitalize font-bold text-slate-800">{act.transitDetails.mode === 'walk' ? 'Camminata' : act.transitDetails.mode}</span>
                            {act.transitDetails.line && (
                              <span className="ml-2 font-mono font-bold bg-zinc-100 border border-zinc-200 text-zinc-800 px-1.5 py-0.2 rounded text-[10px]">
                                {act.transitDetails.line}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Station details */}
                        {(act.transitDetails.fromStop || act.transitDetails.toStop) && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 font-mono pl-7">
                            <span>{act.transitDetails.fromStop || "Partenza"}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-800">{act.transitDetails.toStop || "Arrivo"}</span>
                            {act.transitDetails.direction && (
                              <span className="text-[10px] text-slate-400">
                                (Dir. {act.transitDetails.direction})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fatigue and Duration Indicators */}
                    <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-black/5 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 uppercase tracking-wider">
                        <Gauge className="w-3 h-3" />
                        Affaticamento: <strong className={`font-bold ${act.averageFatigue === 'high' ? 'text-red-500' : act.averageFatigue === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{act.averageFatigue}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        Durata: <strong className="font-bold text-slate-600">{act.durationMinutes} min</strong>
                      </span>
                    </div>

                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

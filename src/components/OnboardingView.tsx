import React, { useState } from "react";
import { TravelConstraints, ExperienceProfile, Trip } from "../types";
import { 
  MapPin, Calendar, Hotel, Plane, Users, Compass, Sliders, Flame, 
  Coins, Sun, ArrowRight, ArrowLeft, Loader2, Sparkles, Navigation,
  Heart, Smile, Moon, BookOpen, Scale, CreditCard, Gem, Eye, Coffee, ChevronRight,
  User, Utensils, CheckCircle
} from "lucide-react";
import { demoTrips } from "../utils/demoTrips";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingViewProps {
  onTripCreated: (trip: Trip) => void;
}

export default function OnboardingView({ onTripCreated }: OnboardingViewProps) {
  // Current Step (1 to 5)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

  // Organization preference
  const [alreadyOrganized, setAlreadyOrganized] = useState<boolean>(true);

  // Unified Calendar Month navigation state (defaulting to July 2026)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(2026, 6, 1));

  // Collapsible state for calendar widget to save vertical space
  const [showCalendar, setShowCalendar] = useState(true);

  // Constraints
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("2026-07-15");
  const [endDate, setEndDate] = useState("2026-07-16");
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  
  const [hasArrival, setHasArrival] = useState(false);
  const [arrivalType, setArrivalType] = useState<'flight' | 'train' | 'car' | 'other'>('flight');
  const [arrivalNumber, setArrivalNumber] = useState("");
  const [arrivalTime, setArrivalTime] = useState("09:00");

  const [hasDeparture, setHasDeparture] = useState(false);
  const [departureType, setDepartureType] = useState<'flight' | 'train' | 'car' | 'other'>('flight');
  const [departureNumber, setDepartureNumber] = useState("");
  const [departureTime, setDepartureTime] = useState("18:00");

  const [companions, setCompanions] = useState<'solo' | 'couple' | 'friends' | 'family'>('couple');

  // Profile preferences
  const [pace, setPace] = useState<'relaxed' | 'moderate' | 'frantic'>('moderate');
  const [focus, setFocus] = useState<'culture' | 'balanced' | 'fun'>('balanced');
  const [style, setStyle] = useState<'experiential' | 'sightseeing'>('experiential');
  const [rhythm, setRhythm] = useState<'early_bird' | 'standard' | 'night_owl'>('standard');
  const [budget, setBudget] = useState<'budget' | 'moderate' | 'luxury'>('moderate');
  const [foodPreference, setFoodPreference] = useState<'local' | 'street_food' | 'fine_dining' | 'vegetarian' | 'anything'>('anything');

  // Generation loading state
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");

  const loadingMessages = [
    "Analizzando la rete di trasporto urbano della città...",
    "Ottimizzando la sequenza temporale per minimizzare l'affaticamento...",
    "Selezionando le linee di autobus e metropolitana più veloci...",
    "Calcolando i tempi medi di permanenza e i margini di sicurezza...",
    "Configurando l'assistente operativo 'Adesso' per il tuo viaggio...",
    "Quasi pronto! Configurazione del sistema operativo in corso..."
  ];

  const handleDemoSelect = (demoId: string) => {
    const selected = demoTrips.find(t => t.id === demoId);
    if (selected) {
      onTripCreated(JSON.parse(JSON.stringify(selected))); // deep copy
    }
  };

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!destination.trim()) {
        setError("Inserisci una destinazione!");
        return false;
      }
      if (!startDate || !endDate) {
        setError("Seleziona le date del viaggio!");
        return false;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError("La data di fine non può essere precedente alla data di inizio!");
        return false;
      }
    }
    if (step === 3 && alreadyOrganized) {
      if (!hotelName.trim()) {
        setError("Inserisci il nome del tuo hotel o alloggio!");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setDirection(1);
      if (step === 2 && !alreadyOrganized) {
        setStep(4); // Skip Step 3 (hotel and transit details)
      } else {
        setStep((prev) => Math.min(prev + 1, 5));
      }
    }
  };

  const prevStep = () => {
    setError("");
    setDirection(-1);
    if (step === 4 && !alreadyOrganized) {
      setStep(2); // Skip Step 3
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError("");
    let msgIndex = 0;
    setLoadingMessage(loadingMessages[0]);

    // Interval to cycle through status messages
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIndex]);
    }, 4000);

    const constraints: TravelConstraints = {
      destination,
      startDate,
      endDate,
      hotelName: alreadyOrganized ? hotelName : "Hotel Consigliato",
      hotelAddress: alreadyOrganized ? (hotelAddress || hotelName) : `${destination} (Centro)`,
      alreadyOrganized,
      companions,
      arrivalTransport: (alreadyOrganized && hasArrival) ? { type: arrivalType, number: arrivalNumber || undefined, time: arrivalTime } : undefined,
      departureTransport: (alreadyOrganized && hasDeparture) ? { type: departureType, number: departureNumber || undefined, time: departureTime } : undefined
    };

    const profile: ExperienceProfile = {
      pace,
      focus,
      style,
      rhythm,
      budget,
      foodPreference
    };

    try {
      const response = await fetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constraints, profile })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nella generazione dell'itinerario.");
      }

      const data = await response.json();
      
      const newTrip: Trip = {
        id: "trip-" + Date.now(),
        constraints,
        profile,
        days: data.days,
        createdAt: new Date().toISOString()
      };

      onTripCreated(newTrip);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossibile contattare l'AI Server. Verifica la tua chiave API nei Secret.");
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  };

  // Variants for step transitions
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0
    })
  };

  const getDisplayStepAndTotal = () => {
    if (alreadyOrganized) {
      return { current: step, total: 5 };
    } else {
      const stepMap: Record<number, number> = { 1: 1, 2: 2, 4: 3, 5: 4 };
      return { current: stepMap[step] || step, total: 4 };
    }
  };

  const formatItalianDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    const monthIndex = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${months[monthIndex] || ""} ${y}`;
  };

  const renderCalendarWidget = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    const weekDays = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];

    const firstDay = new Date(year, month, 1);
    const firstDayIndex = (firstDay.getDay() + 6) % 7; // Map so 0 = Monday

    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push(new Date(year, month, d));
    }

    const formatDateString = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const isSelected = (date: Date) => {
      const str = formatDateString(date);
      return str === startDate || str === endDate;
    };

    const isInRange = (date: Date) => {
      if (!startDate || !endDate) return false;
      const str = formatDateString(date);
      return str > startDate && str < endDate;
    };

    const handleCellClick = (date: Date) => {
      const str = formatDateString(date);
      if (!startDate || (startDate && endDate)) {
        setStartDate(str);
        setEndDate("");
      } else {
        if (new Date(str) < new Date(startDate)) {
          setStartDate(str);
        } else {
          setEndDate(str);
        }
      }
    };

    const handlePrevMonth = () => {
      setCalendarMonth(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
      setCalendarMonth(new Date(year, month + 1, 1));
    };

    return (
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 mt-1 shadow-xs max-w-[250px] mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white border border-slate-200/10 hover:border-slate-200/80 rounded-md text-slate-600 transition cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-black font-display text-slate-800 uppercase tracking-wide">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-white border border-slate-200/10 hover:border-slate-200/80 rounded-md text-slate-600 transition cursor-pointer"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center mb-1 justify-items-center">
          {weekDays.map(d => (
            <span key={d} className="w-6 text-[8px] font-extrabold text-slate-400 uppercase font-mono">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 justify-items-center">
          {cells.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="w-6 h-6"></div>;
            }

            const active = isSelected(date);
            const inRange = isInRange(date);
            const isStart = formatDateString(date) === startDate;
            const isEnd = formatDateString(date) === endDate;

            return (
              <button
                key={date.getTime()}
                type="button"
                onClick={() => handleCellClick(date)}
                className={`w-6 h-6 rounded-md flex flex-col items-center justify-center text-[9px] font-bold transition cursor-pointer relative ${
                  active 
                    ? 'bg-black text-white font-black shadow-xs' 
                    : inRange 
                      ? 'bg-zinc-100 text-zinc-950 border border-zinc-200' 
                      : 'bg-white hover:bg-slate-50 border border-slate-200/30 text-slate-600 font-semibold'
                }`}
              >
                {date.getDate()}
                {isStart && <span className="absolute bottom-0.5 w-0.5 h-0.5 bg-white rounded-full"></span>}
                {isEnd && <span className="absolute bottom-0.5 w-0.5 h-0.5 bg-white rounded-full"></span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const { current: displayStep, total: displayTotal } = getDisplayStepAndTotal();
  const progressPercent = (displayStep / displayTotal) * 100;

  return (
    <div className="max-w-xl mx-auto py-3 px-4 flex flex-col justify-center h-full min-h-[calc(100vh-64px)]" id="onboarding-root">
      
      {/* Dynamic Header */}
      {!loading && (
        <div className="text-center mb-4 shrink-0">
          <div className="inline-flex items-center justify-center p-2.5 bg-zinc-100 border border-zinc-200 text-black rounded-xl mb-1 shadow-xs">
            <Navigation className="w-6 h-6 stroke-[2] rotate-45" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-slate-900 uppercase">
            TRAVEL<span className="text-black font-black">OS</span>
          </h1>
          <p className="text-slate-400 font-sans text-xs max-w-xs mx-auto">
            Configurazione guidata dell'itinerario esecutivo ottimizzato dall'AI.
          </p>
        </div>
      )}

      {/* Main Container */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-md min-h-[360px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-zinc-400/5 blur-[40px] rounded-full"></div>
          <div className="relative mb-5">
            <Loader2 className="w-12 h-12 text-black animate-spin stroke-[1.5]" />
            <Sparkles className="w-5 h-5 text-black absolute -top-1 -right-1 animate-bounce" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900 mb-1.5 uppercase tracking-wide">Compilazione dell'itinerario</h3>
          <p className="text-slate-500 font-mono text-xs max-w-sm px-4 min-h-[40px] flex items-center justify-center animate-pulse">
            {loadingMessage}
          </p>
          <div className="w-48 bg-slate-100 h-1 mt-6 overflow-hidden rounded-full">
            <div className="bg-zinc-800 h-full animate-[loading_15s_ease-in-out_infinite] rounded-full w-4/5 shadow-sm"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-150 rounded-xl flex flex-col overflow-hidden relative">
          
          {/* Progress bar */}
          <div className="w-full bg-zinc-100 h-0.5 absolute top-0 left-0 right-0">
            <motion.div 
              className="bg-black h-full"
              initial={{ width: "20%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            />
          </div>

          <form onSubmit={handleGenerateAI} className="p-5 md:p-6 flex flex-col justify-between flex-1 min-h-[380px]">
            
            {/* Step Counter Indicator */}
            <div className="flex items-center justify-between mb-4 pt-1 text-[8px] font-extrabold font-mono text-slate-400 tracking-wider uppercase">
              <span>CONFIGURAZIONE VIAGGIO</span>
              <span className="bg-zinc-50 border border-zinc-150 text-zinc-500 px-2 py-0.5 rounded font-bold">MODULO {displayStep} DI {displayTotal}</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                {error}
              </div>
            )}

            {/* Steps Visual Form inside Animated Workspace */}
            <div className="flex-1 overflow-hidden relative mb-6 min-h-[250px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-full h-full flex flex-col justify-center"
                >
                  
                  {/* STEP 1: DESTINAZIONE & DATE */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Dove andiamo?</h2>
                        <p className="text-xs text-slate-450 mt-0.5">Imposta la destinazione e le date del tuo viaggio intelligente.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Città di Destinazione</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={destination}
                              onChange={(e) => setDestination(e.target.value)}
                              placeholder="Roma, Parigi, Londra, Barcellona..."
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-black text-slate-800 font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Calendario Unico Periodo di Viaggio</label>
                            <button
                              type="button"
                              onClick={() => setShowCalendar(!showCalendar)}
                              className="text-[9px] font-bold text-zinc-700 hover:text-black transition cursor-pointer"
                            >
                              {showCalendar ? "Nascondi calendario" : "Mostra calendario"}
                            </button>
                          </div>
                          <div 
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="flex items-center justify-between gap-2 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/50 rounded-xl mb-2 text-xs font-semibold text-slate-700 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-black shrink-0" />
                              {startDate && endDate ? (
                                <span className="text-slate-800">
                                  Dal <strong className="text-zinc-900">{formatItalianDate(startDate)}</strong> al <strong className="text-zinc-900">{formatItalianDate(endDate)}</strong>
                                </span>
                              ) : startDate ? (
                                <span className="text-slate-600">Seleziona la data di fine sul calendario...</span>
                              ) : (
                                <span className="text-slate-500">Seleziona il periodo desiderato...</span>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showCalendar ? 'rotate-90' : ''}`} />
                          </div>
                          {showCalendar && renderCalendarWidget()}
                        </div>
                      </div>

                      {/* Demo Quickstarts inside Step 1 as beautiful shortcuts */}
                      <div className="pt-3 border-t border-slate-100">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Oppure prova un Itinerario Demo:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleDemoSelect("rome-os-demo")}
                            className="flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-zinc-50 border border-slate-200/80 hover:border-zinc-300 rounded-xl transition cursor-pointer text-left"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">Roma Express</p>
                              <p className="text-[10px] text-slate-450">2 Giorni • Coppia</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDemoSelect("paris-os-demo")}
                            className="flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-zinc-50 border border-slate-200/80 hover:border-zinc-300 rounded-xl transition cursor-pointer text-left"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">Parigi Intensa</p>
                              <p className="text-[10px] text-slate-450">1 Giorno • Solo</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* STEP 2: STATO ORGANIZZAZIONE & COMPAGNI */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Stato Organizzazione & Compagni</h2>
                        <p className="text-xs text-slate-450 mt-0.5">La pianificazione dell'itinerario si adatterà a queste preferenze.</p>
                      </div>

                      <div className="space-y-4">
                        {/* Ask if already organized */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Il viaggio è già organizzato?</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAlreadyOrganized(true)}
                              className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                alreadyOrganized 
                                  ? 'bg-zinc-100 border-zinc-400 shadow-xs ring-1 ring-zinc-300 font-bold' 
                                  : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 mb-1.5 ${alreadyOrganized ? 'bg-black text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <span className={`text-xs font-bold leading-none ${alreadyOrganized ? 'text-black font-extrabold' : 'text-slate-800'}`}>Sì, già prenotato</span>
                              <span className="text-[9px] text-slate-400 mt-1">Ho già hotel/voli</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAlreadyOrganized(false)}
                              className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                !alreadyOrganized 
                                  ? 'bg-zinc-100 border-zinc-400 shadow-xs ring-1 ring-zinc-300 font-bold' 
                                  : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 mb-1.5 ${!alreadyOrganized ? 'bg-black text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <span className={`text-xs font-bold leading-none ${!alreadyOrganized ? 'text-black font-extrabold' : 'text-slate-800'}`}>No, consigliami tutto</span>
                              <span className="text-[9px] text-slate-400 mt-1">L'AI proporrà hotel e voli</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Compagni di Viaggio</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "solo", icon: User, title: "Solo", desc: "Esploratore singolo" },
                              { id: "couple", icon: Heart, title: "Coppia", desc: "Viaggio romantico" },
                              { id: "friends", icon: Users, title: "Amici", desc: "Divertimento in gruppo" },
                              { id: "family", icon: Smile, title: "Famiglia", desc: "Soggiorno confortevole" }
                            ].map((c) => {
                              const CompIcon = c.icon;
                              const isSelected = companions === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setCompanions(c.id as any)}
                                  className={`p-2.5 border rounded-xl flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-zinc-100 border-zinc-400 shadow-xs ring-1 ring-zinc-300' 
                                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-black text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                    <CompIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-xs font-bold leading-none ${isSelected ? 'text-black' : 'text-slate-800'}`}>{c.title}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">{c.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ALLOGGIO & LOGISTICA PRENOTATA */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Alloggio & Logistica Prenotata</h2>
                        <p className="text-xs text-slate-450 mt-0.5">La logistica si adatterà alla posizione dell'hotel e ai dettagli di viaggio inseriti.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[250px] pr-1">
                        
                        {/* Hotel Details Block */}
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                            <Hotel className="w-4 h-4 text-black" />
                            <span>Dettagli Alloggio</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Nome Alloggio (Base)</label>
                              <input
                                type="text"
                                required={alreadyOrganized}
                                value={hotelName}
                                onChange={(e) => setHotelName(e.target.value)}
                                placeholder="Hotel, Ostello o Appartamento"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Indirizzo Alloggio</label>
                              <input
                                type="text"
                                value={hotelAddress}
                                onChange={(e) => setHotelAddress(e.target.value)}
                                placeholder="E.g., Via dei Condotti 10"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Arrival Transport Block */}
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <Plane className="w-4 h-4 text-slate-500" />
                              <span>Tratta d'Arrivo</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hasArrival}
                                onChange={(e) => setHasArrival(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-black"></div>
                            </label>
                          </div>

                          {hasArrival && (
                            <div className="space-y-3 mt-2 animate-[fadeIn_0.15s_ease-out]">
                              <div className="flex gap-1.5">
                                {(['flight', 'train', 'car', 'other'] as const).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setArrivalType(t)}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition ${
                                      arrivalType === t
                                        ? 'bg-black text-white border-black shadow-xs font-bold'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t === 'flight' ? 'Volo' : t === 'train' ? 'Treno' : t === 'car' ? 'Auto' : 'Altro'}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Codice Tratta</label>
                                  <input
                                    type="text"
                                    value={arrivalNumber}
                                    onChange={(e) => setArrivalNumber(e.target.value)}
                                    placeholder="E.g., AZ 128"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Ora Arrivo</label>
                                  <input
                                    type="time"
                                    value={arrivalTime}
                                    onChange={(e) => setArrivalTime(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Departure Transport Block */}
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <Plane className="w-4 h-4 text-slate-500 rotate-90" />
                              <span>Tratta di Ritorno</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hasDeparture}
                                onChange={(e) => setHasDeparture(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-black"></div>
                            </label>
                          </div>

                          {hasDeparture && (
                            <div className="space-y-3 mt-2 animate-[fadeIn_0.15s_ease-out]">
                              <div className="flex gap-1.5">
                                {(['flight', 'train', 'car', 'other'] as const).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setDepartureType(t)}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition ${
                                      departureType === t
                                        ? 'bg-black text-white border-black shadow-xs font-bold'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {t === 'flight' ? 'Volo' : t === 'train' ? 'Treno' : t === 'car' ? 'Auto' : 'Altro'}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Codice Tratta</label>
                                  <input
                                    type="text"
                                    value={departureNumber}
                                    onChange={(e) => setDepartureNumber(e.target.value)}
                                    placeholder="E.g., FR 4022"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Ora Partenza</label>
                                  <input
                                    type="time"
                                    value={departureTime}
                                    onChange={(e) => setDepartureTime(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                  {/* STEP 4: RITMO & BUDGET */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Ritmo & Budget</h2>
                        <p className="text-xs text-slate-450 mt-0.5">Flessibilità biologica, budget allocato e orari del sonno.</p>
                      </div>

                      <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                        {/* Ritmo / Pace */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            Ritmo dell'itinerario
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'relaxed', label: 'Relax', desc: 'Lento' },
                              { id: 'moderate', label: 'Medio', desc: 'Bilanciato' },
                              { id: 'frantic', label: 'Intenso', desc: 'Vedi Tutto' }
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setPace(p.id as any)}
                                className={`py-1.5 px-1 rounded-lg border cursor-pointer text-center transition ${
                                  pace === p.id
                                    ? 'bg-zinc-100 border-zinc-400 text-black font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 text-xs'
                                }`}
                              >
                                <span className="block text-xs font-bold leading-none">{p.label}</span>
                                <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{p.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rhythm / Sveglia */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            Sveglia Giornaliera
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'early_bird', label: 'Presto', desc: 'Dalle 8:00' },
                              { id: 'standard', label: 'Standard', desc: 'Dalle 9:30' },
                              { id: 'night_owl', label: 'Gufi', desc: 'Dalle 11:00' }
                            ].map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setRhythm(r.id as any)}
                                className={`py-1.5 px-1 rounded-lg border cursor-pointer text-center transition ${
                                  rhythm === r.id
                                    ? 'bg-zinc-100 border-zinc-400 text-black font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="block text-xs font-bold leading-none">{r.label}</span>
                                <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{r.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Budget */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-yellow-600" />
                            Budget Allocato
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'budget', label: 'Low Cost', desc: 'Economico' },
                              { id: 'moderate', label: 'Standard', desc: 'Medio' },
                              { id: 'luxury', label: 'Premium', desc: 'Esperienza' }
                            ].map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setBudget(b.id as any)}
                                className={`py-1.5 px-1 rounded-lg border cursor-pointer text-center transition ${
                                  budget === b.id
                                    ? 'bg-zinc-100 border-zinc-400 text-black font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="block text-xs font-bold leading-none">{b.label}</span>
                                <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{b.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* STEP 5: FOCUS & STILE */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Focus & Stile</h2>
                        <p className="text-xs text-slate-450 mt-0.5">Le tue ultime preferenze d'esplorazione prima del decollo.</p>
                      </div>

                      <div className="space-y-3">
                        {/* Focus */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-emerald-500" />
                            Tipologia Attività (Focus)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'culture', label: 'Arte/Musei', desc: 'Cultura' },
                              { id: 'balanced', label: 'Bilanciato', desc: 'Mix Perfetto' },
                              { id: 'fun', label: 'Svago', desc: 'Locali/Social' }
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setFocus(f.id as any)}
                                className={`py-1.5 px-1 rounded-lg border cursor-pointer text-center transition ${
                                  focus === f.id
                                    ? 'bg-zinc-100 border-zinc-400 text-black font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="block text-xs font-bold leading-none">{f.label}</span>
                                <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{f.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Style */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                            Stile d'Esplorazione
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'experiential', label: 'Come un Locale', desc: 'In mezzo ai residenti' },
                              { id: 'sightseeing', label: 'Turistico Classico', desc: 'Monumenti Iconici' }
                            ].map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setStyle(s.id as any)}
                                className={`py-1.5 px-1 rounded-xl border cursor-pointer text-center transition ${
                                  style === s.id
                                    ? 'bg-zinc-100 border-zinc-400 text-black font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="block text-xs font-bold leading-none">{s.label}</span>
                                <span className="text-[8px] text-slate-400 font-medium block mt-0.5">{s.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Food Preference */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-rose-500" />
                            Preferenza Cibo
                          </label>
                          <div className="grid grid-cols-5 gap-1">
                            {[
                              { id: 'local', label: 'Tipico', desc: 'Locale' },
                              { id: 'street_food', label: 'Street', desc: 'Mercati' },
                              { id: 'fine_dining', label: 'Gourmet', desc: 'Elegante' },
                              { id: 'vegetarian', label: 'Veg', desc: 'Vegetale' },
                              { id: 'anything', label: 'Tutto', desc: 'Nessun limite' }
                            ].map((fd) => (
                              <button
                                key={fd.id}
                                type="button"
                                onClick={() => setFoodPreference(fd.id as any)}
                                className={`py-1 px-0.5 border rounded-lg cursor-pointer text-center transition ${
                                  foodPreference === fd.id
                                    ? 'bg-zinc-100 border-zinc-450 text-black font-bold ring-1 ring-zinc-300'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="block text-[10px] font-bold leading-none">{fd.label}</span>
                                <span className="text-[7px] text-slate-400 font-medium block mt-0.5">{fd.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dynamic Buttons Footer */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 shrink-0">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1 px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 transition cursor-pointer text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Indietro
                </button>
              )}
              
              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-1 bg-black hover:bg-zinc-800 text-white py-3 rounded-2xl cursor-pointer shadow-sm font-bold text-xs font-display uppercase tracking-wider transition"
                >
                  Avanti
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1 bg-black hover:bg-zinc-800 text-white py-3 rounded-2xl cursor-pointer shadow-md hover:shadow-lg font-bold text-xs font-display uppercase tracking-widest transition"
                >
                  <Sparkles className="w-4 h-4 fill-white/15 animate-pulse" />
                  Genera con AI
                </button>
              )}
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

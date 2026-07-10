import React, { useState, useMemo } from "react";
import { 
  Plane, Train, Bus, Clock, ArrowRight, Search, ExternalLink, 
  Check, SlidersHorizontal, AlertCircle, Sparkles, CheckCircle2, 
  MapPin, HelpCircle, ChevronRight, Filter, ShoppingBag, Landmark
} from "lucide-react";
import { Trip, Activity } from "../types";

interface LogisticsHubProps {
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

interface TravelOption {
  id: string;
  type: "flight" | "train";
  provider: string;
  logoColor: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopsDetail?: string;
  price: number;
  classType: string;
  baggageIncluded: boolean;
  score: number; // 1-10 rating
  officialUrl: string;
}

export default function LogisticsHub({ trip, onTripUpdated }: LogisticsHubProps) {
  const { destination, startDate, endDate, companions } = trip.constraints;
  const budget = trip.profile.budget;

  // Search parameters (pre-filled from trip)
  const [origin, setOrigin] = useState("Milano (MXP/LIN)");
  const [searchDestination, setSearchDestination] = useState(destination);
  const [activeSubTab, setActiveSubTab] = useState<"flights" | "trains" | "local">("flights");
  
  // Filtering & Sorting
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    if (budget === "budget") return 150;
    if (budget === "moderate") return 350;
    return 800;
  });
  const [directOnly, setDirectOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest" | "best">("best");

  // Selection state
  const [selectedArrival, setSelectedArrival] = useState<TravelOption | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<TravelOption | null>(null);
  const [bookingProgress, setBookingProgress] = useState<{ [key: string]: boolean }>({});

  // Recommended transport mode based on typical routes
  const isTrainFeasible = useMemo(() => {
    // Basic heuristics: if destination is in Italy/Central Europe, train is a great choice
    const destLower = destination.toLowerCase();
    const italianCities = ["roma", "milano", "firenze", "venezia", "napoli", "bologna", "torino", "pisa", "amalfi", "bari", "verona"];
    return italianCities.some(city => destLower.includes(city));
  }, [destination]);

  // Generate deterministic options based on destination, dates and budget
  const flightOptions = useMemo<TravelOption[]>(() => {
    const destLower = destination.toLowerCase();
    const seed = destination.length + startDate.length;
    
    // Scale prices based on budget profile
    const multiplier = budget === "budget" ? 0.7 : budget === "moderate" ? 1.2 : 2.5;
    
    const providers = [
      { name: "ITA Airways", color: "bg-blue-600", url: "https://www.ita-airways.com" },
      { name: "Ryanair", color: "bg-yellow-500", url: "https://www.ryanair.com" },
      { name: "EasyJet", color: "bg-orange-500", url: "https://www.easyjet.com" },
      { name: "Wizz Air", color: "bg-pink-500", url: "https://www.wizzair.com" },
      { name: "Lufthansa", color: "bg-slate-800", url: "https://www.lufthansa.com" }
    ];

    return [
      {
        id: "f-1",
        type: "flight",
        provider: providers[seed % providers.length].name,
        logoColor: providers[seed % providers.length].color,
        departureTime: "08:15",
        arrivalTime: "09:45",
        duration: "1h 30m",
        stops: 0,
        price: Math.round(59 * multiplier),
        classType: "Economy Standard",
        baggageIncluded: multiplier > 1,
        score: 8.9,
        officialUrl: providers[seed % providers.length].url
      },
      {
        id: "f-2",
        type: "flight",
        provider: providers[(seed + 1) % providers.length].name,
        logoColor: providers[(seed + 1) % providers.length].color,
        departureTime: "11:30",
        arrivalTime: "15:10",
        duration: "3h 40m",
        stops: 1,
        stopsDetail: "1 scalo a Monaco (MUC)",
        price: Math.round(112 * multiplier),
        classType: "Economy Light",
        baggageIncluded: false,
        score: 7.4,
        officialUrl: providers[(seed + 1) % providers.length].url
      },
      {
        id: "f-3",
        type: "flight",
        provider: providers[(seed + 2) % providers.length].name,
        logoColor: providers[(seed + 2) % providers.length].color,
        departureTime: "14:20",
        arrivalTime: "15:50",
        duration: "1h 30m",
        stops: 0,
        price: Math.round(45 * multiplier),
        classType: "Basic",
        baggageIncluded: false,
        score: 8.2,
        officialUrl: providers[(seed + 2) % providers.length].url
      },
      {
        id: "f-4",
        type: "flight",
        provider: providers[(seed + 3) % providers.length].name,
        logoColor: providers[(seed + 3) % providers.length].color,
        departureTime: "18:45",
        arrivalTime: "20:15",
        duration: "1h 30m",
        stops: 0,
        price: Math.round(135 * multiplier),
        classType: "Flex Classic",
        baggageIncluded: true,
        score: 9.3,
        officialUrl: providers[(seed + 3) % providers.length].url
      }
    ];
  }, [destination, budget, startDate]);

  const trainOptions = useMemo<TravelOption[]>(() => {
    const seed = destination.length + endDate.length;
    const multiplier = budget === "budget" ? 0.8 : budget === "moderate" ? 1.1 : 1.8;

    return [
      {
        id: "t-1",
        type: "train",
        provider: "Frecciarossa (Trenitalia)",
        logoColor: "bg-red-650",
        departureTime: "07:10",
        arrivalTime: "10:25",
        duration: "3h 15m",
        stops: 0,
        price: Math.round(39 * multiplier),
        classType: "Standard / Smart",
        baggageIncluded: true,
        score: 9.5,
        officialUrl: "https://www.trenitalia.com"
      },
      {
        id: "t-2",
        type: "train",
        provider: "Italo Treno",
        logoColor: "bg-red-500",
        departureTime: "09:40",
        arrivalTime: "12:55",
        duration: "3h 15m",
        stops: 0,
        price: Math.round(34 * multiplier),
        classType: "Smart",
        baggageIncluded: true,
        score: 9.1,
        officialUrl: "https://www.italotreno.it"
      },
      {
        id: "t-3",
        type: "train",
        provider: "Intercity Giorno",
        logoColor: "bg-blue-800",
        departureTime: "11:05",
        arrivalTime: "16:40",
        duration: "5h 35m",
        stops: 4,
        stopsDetail: "4 fermate intermedie",
        price: Math.round(19 * multiplier),
        classType: "Seconda Classe",
        baggageIncluded: true,
        score: 6.8,
        officialUrl: "https://www.trenitalia.com"
      }
    ];
  }, [destination, budget, endDate]);

  const filteredOptions = useMemo(() => {
    const rawOptions = activeSubTab === "flights" ? flightOptions : trainOptions;
    
    let filtered = rawOptions.filter(opt => opt.price <= maxPrice);
    if (directOnly) {
      filtered = filtered.filter(opt => opt.stops === 0);
    }

    if (sortBy === "cheapest") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "fastest") {
      const getMins = (d: string) => {
        const parts = d.split(" ");
        let mins = 0;
        parts.forEach(p => {
          if (p.includes("h")) mins += parseInt(p) * 60;
          if (p.includes("m")) mins += parseInt(p);
        });
        return mins;
      };
      filtered.sort((a, b) => getMins(a.duration) - getMins(b.duration));
    } else {
      // best (sorted by score descending)
      filtered.sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [activeSubTab, flightOptions, trainOptions, maxPrice, directOnly, sortBy]);

  const handleSelectArrival = (option: TravelOption) => {
    setSelectedArrival(option);

    // Dynamic schedule updates
    const updatedConstraints = {
      ...trip.constraints,
      arrivalTransport: {
        type: option.type,
        number: `${option.provider.substring(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
        time: option.departureTime
      }
    };

    // Modify the Day 1 activities list to have the flight_train activity
    const updatedDays = trip.days.map((day, dIdx) => {
      if (dIdx === 0) {
        // Look for existing flight_train activity or prepend a new one
        const activities = [...day.activities];
        const existingIdx = activities.findIndex(a => a.type === "flight_train");
        
        const newTransitActivity: Activity = {
          id: `arrival-transit-${option.id}`,
          type: "flight_train",
          title: `Viaggio di Arrivo: ${option.provider}`,
          locationName: `${origin} ➔ ${destination}`,
          startTime: option.departureTime,
          endTime: option.arrivalTime,
          durationMinutes: 90, // mock
          description: `Volo o Treno programmato con ${option.provider}. Classe: ${option.classType}. Bagaglio incluso: ${option.baggageIncluded ? 'Sì' : 'No'}.`,
          averageFatigue: "medium",
          lat: option.type === "flight" ? 41.8003 : 41.8902, // Roma-Fiumicino or generic center
          lng: option.type === "flight" ? 12.2389 : 12.4922
        };

        if (existingIdx !== -1) {
          activities[existingIdx] = newTransitActivity;
        } else {
          activities.unshift(newTransitActivity);
        }
        return { ...day, activities };
      }
      return day;
    });

    onTripUpdated({
      ...trip,
      constraints: updatedConstraints,
      days: updatedDays
    });
  };

  const handleSelectDeparture = (option: TravelOption) => {
    setSelectedDeparture(option);

    const updatedConstraints = {
      ...trip.constraints,
      departureTransport: {
        type: option.type,
        number: `${option.provider.substring(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
        time: option.departureTime
      }
    };

    const updatedDays = trip.days.map((day, dIdx) => {
      if (dIdx === trip.days.length - 1) {
        const activities = [...day.activities];
        const existingIdx = activities.findIndex(a => a.type === "flight_train");

        const newTransitActivity: Activity = {
          id: `departure-transit-${option.id}`,
          type: "flight_train",
          title: `Viaggio di Ritorno: ${option.provider}`,
          locationName: `${destination} ➔ ${origin}`,
          startTime: option.departureTime,
          endTime: option.arrivalTime,
          durationMinutes: 90,
          description: `Tratta di ritorno prenotata con ${option.provider}. Arrivo stimato per le ${option.arrivalTime}.`,
          averageFatigue: "medium",
          lat: 41.8902,
          lng: 12.4922
        };

        if (existingIdx !== -1) {
          activities[existingIdx] = newTransitActivity;
        } else {
          activities.push(newTransitActivity);
        }
        return { ...day, activities };
      }
      return day;
    });

    onTripUpdated({
      ...trip,
      constraints: updatedConstraints,
      days: updatedDays
    });
  };

  const simulateBookingRedirect = (option: TravelOption) => {
    setBookingProgress(prev => ({ ...prev, [option.id]: true }));
    setTimeout(() => {
      setBookingProgress(prev => ({ ...prev, [option.id]: false }));
      // Open official provider booking page in a safe, standard external link
      window.open(option.officialUrl, "_blank", "noopener,noreferrer");
    }, 1200);
  };

  return (
    <div className="space-y-6" id="logistics-hub-root">
      
      {/* HEADER SEARCH BAR */}
      <div className="bg-white border border-zinc-150 rounded-xl p-5 text-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-150 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-zinc-50 border border-zinc-150 text-zinc-600 rounded text-[8px] font-extrabold uppercase tracking-widest font-mono">
                SKYSCANNER + MEZZI
              </span>
              <span className="text-[8px] text-zinc-500 font-bold font-mono bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded uppercase">
                CO-PILOTA ATTIVO
              </span>
            </div>
            <h3 className="text-base font-bold font-display tracking-tight text-slate-950">
              Hub Logistica & Ricerca Tratte
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-xl">
              Dal momento che il viaggio non è ancora organizzato, usa questa sezione per confrontare le migliori tariffe, scegliere l'itinerario perfetto e programmarlo all'istante.
            </p>
          </div>
        </div>

        {/* Search simulation interface */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50/50 p-3 rounded-lg border border-zinc-150">
          <div>
            <label className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">PARTENZA DA</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input 
                type="text" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-zinc-200 focus:border-black focus:outline-none rounded-md text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">DESTINAZIONE</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input 
                type="text" 
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-zinc-200 focus:border-black focus:outline-none rounded-md text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">ANDATA</label>
            <div className="p-2 bg-white border border-zinc-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1.5 h-[34px]">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{startDate}</span>
            </div>
          </div>

          <div>
            <label className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">RITORNO</label>
            <div className="p-2 bg-white border border-zinc-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1.5 h-[34px]">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{endDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER FOR CURRENT CHOICES */}
      {(selectedArrival || selectedDeparture) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-[fadeIn_0.2s_ease-out]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">Programmazione Salvata!</span>
            </div>
            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
              Hai aggiunto questi trasporti al tuo itinerario. Saranno usati come tappa iniziale e finale delle giornate di viaggio:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedArrival && (
                <span className="text-[9px] bg-white border border-emerald-200 px-2 py-1 rounded-lg font-bold text-emerald-700 flex items-center gap-1">
                  ✈️ Andata: {selectedArrival.provider} ({selectedArrival.departureTime})
                </span>
              )}
              {selectedDeparture && (
                <span className="text-[9px] bg-white border border-emerald-200 px-2 py-1 rounded-lg font-bold text-emerald-700 flex items-center gap-1">
                  ✈️ Ritorno: {selectedDeparture.provider} ({selectedDeparture.departureTime})
                </span>
              )}
            </div>
          </div>

          <div className="text-[9px] bg-white border border-emerald-300 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider shrink-0">
            Itinerario Sincronizzato
          </div>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-2">
        <div className="flex p-1 bg-zinc-50 rounded-lg border border-zinc-200 max-w-max">
          <button
            onClick={() => setActiveSubTab("flights")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition cursor-pointer ${
              activeSubTab === "flights" 
                ? "bg-white text-black font-bold shadow-xs border border-zinc-250/70" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-black" />
            Voli (Skyscanner)
          </button>

          <button
            onClick={() => setActiveSubTab("trains")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition cursor-pointer ${
              activeSubTab === "trains" 
                ? "bg-white text-black font-bold shadow-xs border border-zinc-250/70" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Train className="w-3.5 h-3.5 text-black" />
            Treni Alta Velocità
          </button>

          <button
            onClick={() => setActiveSubTab("local")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition cursor-pointer ${
              activeSubTab === "local" 
                ? "bg-white text-black font-bold shadow-xs border border-zinc-250/70" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-black" />
            Mezzi Locali Urbani
          </button>
        </div>

        {/* Sort & Filters indicators */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-bold text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Ordina per:</span>
          <select 
            value={sortBy} 
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-white border border-zinc-200 rounded p-1 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="best">Migliore (Punteggio)</option>
            <option value="cheapest">Più Economico</option>
            <option value="fastest">Più Veloce</option>
          </select>
        </div>
      </div>

      {/* FILTER PANEL */}
      {activeSubTab !== "local" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Prezzo Massimo</span>
              <span className="text-black font-extrabold">€{maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="1000" 
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-black"
            />
          </div>

          <div className="flex items-center gap-2 self-end pb-1.5">
            <input 
              type="checkbox" 
              id="direct" 
              checked={directOnly}
              onChange={(e) => setDirectOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer"
            />
            <label htmlFor="direct" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              Solo voli/treni diretti (senza scali)
            </label>
          </div>
        </div>
      )}

      {/* RENDER CONTENT BASED ON TAB */}
      {activeSubTab === "local" ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Bus className="w-4 h-4 text-black" />
              Guida ai Collegamenti per {destination}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ecco come raggiungere l'hotel di destinazione dai principali snodi di arrivo aeroportuali o ferroviari.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Arrival route card */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-zinc-150 text-black border border-zinc-300 px-2 py-0.5 rounded-full uppercase">
                  Dall'Aeroporto Principale
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">~40 MIN • €8 - €14</span>
              </div>
              <h5 className="text-xs font-bold text-slate-800">Servizio Express Navetta / Treno Regionale</h5>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Consigliamo di prendere il treno navetta diretto o il bus espresso che parte ogni 15 minuti fuori dall'area arrivi. Ti porterà direttamente alla stazione ferroviaria centrale o in prossimità del centro.
              </p>
              <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-400">Frequenza: Ogni 15 min</span>
                <a 
                  href="https://www.google.com/maps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-800 hover:text-black font-extrabold transition"
                >
                  Mappa del percorso <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Metro/Bus route card */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-zinc-150 text-black border border-zinc-300 px-2 py-0.5 rounded-full uppercase">
                  Dalla Stazione Centrale
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">~15 MIN • €1.50</span>
              </div>
              <h5 className="text-xs font-bold text-slate-800">Metropolitana (Linea Principale) o Bus </h5>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                La rete metropolitana cittadina è l'opzione migliore per aggirare il traffico. Acquista un biglietto standard contactless direttamente ai tornelli e segui le indicazioni per scendere vicino a {destination}.
              </p>
              <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-400">Frequenza: Ogni 3-5 min</span>
                <a 
                  href="https://www.google.com/maps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-800 hover:text-black font-extrabold transition"
                >
                  Mappa Metro <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

          </div>

          <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl text-[10px] text-amber-800 font-semibold flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Consiglio di viaggio:</strong> Puoi utilizzare la carta di credito contactless o il telefono direttamente ai tornelli della metropolitana e della maggior parte dei bus urbani di {destination} per evitare lunghe code alle macchinette dei biglietti!
            </span>
          </div>
        </div>
      ) : filteredOptions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800 uppercase">Nessuna opzione corrisponde ai filtri</h4>
          <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            Prova ad aumentare il prezzo massimo impostato o disattiva l'opzione "Solo diretti" per vedere tutti i risultati disponibili.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredOptions.map((opt) => {
            const isBooked = bookingProgress[opt.id];
            
            return (
              <div 
                key={opt.id} 
                className="bg-white border border-slate-200/80 hover:border-zinc-400 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition shadow-xs hover:shadow-md animate-[fadeIn_0.15s_ease-out]"
              >
                
                {/* Left block: provider brand, duration, times */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                  
                  {/* Brand logo & score */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm font-mono ${opt.logoColor}`}>
                      {opt.provider.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 tracking-wide">{opt.provider}</h5>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-extrabold font-mono">
                          ⭐ {opt.score.toFixed(1)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">Qualità</span>
                      </div>
                    </div>
                  </div>

                  {/* Flight Timeline */}
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <div className="text-center sm:text-left">
                      <span className="block text-xs font-black text-slate-800">{opt.departureTime}</span>
                      <span className="block text-[8px] font-mono text-slate-400 tracking-wide font-semibold uppercase">PARTENZA</span>
                    </div>
                    
                    {/* Visual connection timeline */}
                    <div className="flex-1 flex flex-col items-center justify-center min-w-[50px] relative">
                      <span className="text-[8px] font-mono text-slate-400 font-bold mb-1">{opt.duration}</span>
                      <div className="w-full h-[1.5px] bg-slate-200 relative flex items-center justify-center">
                        <div className={`absolute w-1.5 h-1.5 rounded-full ${opt.stops > 0 ? 'bg-amber-400' : 'bg-black'}`}></div>
                      </div>
                      <span className={`text-[8px] font-bold mt-1 ${opt.stops > 0 ? 'text-amber-600' : 'text-black'}`}>
                        {opt.stops === 0 ? "Diretto" : `${opt.stops} scalo`}
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="block text-xs font-black text-slate-800">{opt.arrivalTime}</span>
                      <span className="block text-[8px] font-mono text-slate-400 tracking-wide font-semibold uppercase">ARRIVO</span>
                    </div>
                  </div>

                  {/* Flight class & details */}
                  <div className="text-center sm:text-right pr-2 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {opt.classType}
                    </span>
                    <span className="block text-[8px] text-slate-400 font-semibold">
                      Bagaglio incluso: {opt.baggageIncluded ? "🎒 15kg Registrato" : "🎒 Solo borsa piccola"}
                    </span>
                    {opt.stopsDetail && (
                      <span className="block text-[8px] font-bold text-amber-600">
                        ⚠️ {opt.stopsDetail}
                      </span>
                    )}
                  </div>

                </div>

                {/* Right block: actions & pricing */}
                <div className="border-t md:border-t-0 md:border-l border-slate-200/80 pt-3.5 md:pt-0 md:pl-5 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 shrink-0">
                  <div className="text-left md:text-center">
                    <span className="block text-xs text-slate-400 font-semibold uppercase font-mono tracking-widest">A PERSONA</span>
                    <span className="text-lg font-black font-display text-slate-950">€{opt.price}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[130px]">
                    
                    {/* Add to current TravelOS itinerary */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectArrival(opt)}
                        className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 hover:text-black text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition border border-zinc-300 cursor-pointer text-center"
                      >
                        Andata
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDeparture(opt)}
                        className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 hover:text-black text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition border border-zinc-300 cursor-pointer text-center"
                      >
                        Ritorno
                      </button>
                    </div>

                    {/* Official purchase redirect */}
                    <button
                      type="button"
                      onClick={() => simulateBookingRedirect(opt)}
                      disabled={isBooked}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] uppercase tracking-wide px-3 py-2 rounded-lg flex items-center justify-center gap-1 shadow-xs hover:shadow-md cursor-pointer transition"
                    >
                      {isBooked ? (
                        <>Reindirizzamento...</>
                      ) : (
                        <>
                          <ShoppingBag className="w-2.5 h-2.5" />
                          Acquista su {opt.provider.split(" ")[0]} <ExternalLink className="w-2 h-2" />
                        </>
                      )}
                    </button>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

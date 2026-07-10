import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { Trip } from "./types";
import OnboardingView from "./components/OnboardingView";
import TimelineView from "./components/TimelineView";
import SmartMapView from "./components/SmartMapView";
import LiveView from "./components/LiveView";
import LogisticsHub from "./components/LogisticsHub";
import { 
  auth, 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  fetchUserTrips, 
  saveTripToFirestore,
  deleteTripFromFirestore
} from "./utils/firebase";
import { 
  Calendar, Map, Clock, Navigation, Plus, Compass, Plane,
  MapPin, LogOut, Layers, Sparkles, User as UserIcon, Trash2, Menu, X, ArrowRight, Loader2
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // App states
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'timeline' | 'map' | 'logistics'>('live');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Live User Location Tracker
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.warn("Geolocation watch error:", error);
          setLocationError(error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Geolocalizzazione non supportata nel browser");
    }
  }, []);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        setTripsLoading(true);
        const userTrips = await fetchUserTrips(currentUser.uid);
        setTrips(userTrips);
        
        // Auto-select the first trip if available, default tab to 'live'
        if (userTrips.length > 0) {
          setActiveTrip(userTrips[0]);
          setActiveTab('live');
        } else {
          setActiveTrip(null);
        }
        setTripsLoading(false);
      } else {
        setTrips([]);
        setActiveTrip(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle User Logins
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        setAuthError("Il popup d'accesso è stato bloccato. Prova ad abilitare i popup nel tuo browser o usa l'Accesso Rapido Demo qui sotto.");
      } else {
        setAuthError("Accesso fallito: " + (err.message || "Errore sconosciuto."));
      }
    }
  };

  const handleGuestLogin = async () => {
    setAuthError(null);
    try {
      await loginAsGuest();
    } catch (err: any) {
      console.error(err);
      setAuthError("Impossibile accedere come ospite: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // Create & Save Trip
  const handleTripCreated = async (newTrip: Trip) => {
    if (!user) return;
    try {
      await saveTripToFirestore(user.uid, newTrip);
      
      // Update local states
      const updatedTrips = [newTrip, ...trips];
      setTrips(updatedTrips);
      setActiveTrip(newTrip);
      setActiveTab(newTrip.constraints.alreadyOrganized === false ? 'logistics' : 'live');
    } catch (error) {
      console.error("Failed to save trip", error);
      alert("Impossibile salvare il viaggio su Cloud Firestore. L'itinerario è comunque disponibile per la sessione corrente.");
      // Fallback local update
      setTrips([newTrip, ...trips]);
      setActiveTrip(newTrip);
      setActiveTab(newTrip.constraints.alreadyOrganized === false ? 'logistics' : 'live');
    }
  };

  // Update Trip
  const handleTripUpdated = async (updatedTrip: Trip) => {
    if (!user) return;
    try {
      await saveTripToFirestore(user.uid, updatedTrip);
      
      // Update local list
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      setActiveTrip(updatedTrip);
    } catch (error) {
      console.error("Failed to update trip", error);
      // Fallback local update
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      setActiveTrip(updatedTrip);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting the trip
    if (!user) return;
    
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questo viaggio? L'operazione non è reversibile.")) {
      try {
        await deleteTripFromFirestore(tripId);
        const filtered = trips.filter(t => t.id !== tripId);
        setTrips(filtered);
        
        if (activeTrip?.id === tripId) {
          setActiveTrip(filtered.length > 0 ? filtered[0] : null);
          setActiveTab('live');
        }
      } catch (error) {
        console.error("Failed to delete trip", error);
        alert("Errore nell'eliminazione del viaggio.");
      }
    }
  };

  // Enter Onboarding flow to create new trip
  const handleCreateNewTripClick = () => {
    setActiveTrip(null);
    setIsSidebarOpen(false);
  };

  // Login Screen if not authenticated
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-slate-850 font-sans">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
        <span className="mt-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Inizializzazione TravelOS...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-white px-4 py-8 font-sans" id="auth-screen">
        <div className="max-w-md w-full bg-white border border-zinc-150 rounded-xl p-8 space-y-8 relative">
          
          {/* Title Branding */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-2.5 bg-zinc-50 text-black rounded-lg border border-zinc-200/60">
              <Navigation className="w-5 h-5 rotate-45" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 uppercase">
              TRAVEL<span className="text-black font-normal">OS</span>
            </h1>
            <p className="text-[9px] font-mono text-zinc-600 bg-zinc-50 border border-zinc-200/60 px-2 py-0.5 rounded uppercase tracking-wider">
              Sistema Operativo di Viaggio
            </p>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed pt-1 font-mono">
              Pianifica i tuoi itinerari con logistica urbana integrata, sequenza tappe e assistente di bordo in tempo reale.
            </p>
          </div>

          {/* Auth Action Cards */}
          <div className="space-y-3 pt-2">
            
            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs leading-relaxed font-mono">
                ⚠️ {authError}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-black text-white hover:bg-zinc-900 px-5 py-3 rounded-lg font-bold flex items-center justify-center gap-2.5 transition cursor-pointer text-xs font-mono tracking-wide uppercase"
            >
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.24.61 4.45 1.64l2.42-2.42C17.3 1.65 14.93 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.77 0 9.595-4.053 9.595-9.76 0-.663-.06-1.3-.17-1.954H12.24z"/>
              </svg>
              Accedi con Google
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-150"></div>
              </div>
              <span className="relative px-3 bg-white text-[9px] font-mono text-slate-400 uppercase tracking-widest">Oppure</span>
            </div>

            <button
              onClick={handleGuestLogin}
              className="w-full bg-zinc-50 hover:bg-zinc-100 text-slate-700 border border-zinc-200/85 px-5 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs font-mono uppercase tracking-wider"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              Entra come Ospite (Accesso Rapido)
            </button>
          </div>

          {/* Informational footer */}
          <div className="text-center text-[9px] text-slate-400 font-mono pt-4 border-t border-zinc-150 leading-relaxed uppercase tracking-wider">
            SALVATO SU CLOUD FIRESTORE
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-white text-slate-800 font-sans" id="app-viewport">
      
      {/* MOBILE HEADER BAR */}
      <header className="md:hidden h-14 bg-white border-b border-zinc-100 flex items-center justify-between px-4 shrink-0 z-30">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-zinc-50 rounded-lg cursor-pointer transition"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
 
        <div className="flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-black rotate-45" />
          <span className="font-bold tracking-tight font-display text-slate-900 text-sm">
            TRAVEL<span className="text-black">OS</span>
          </span>
        </div>
 
        <button
          onClick={handleCreateNewTripClick}
          className="p-1.5 text-black hover:bg-zinc-50 rounded-lg cursor-pointer transition"
          title="Nuovo Viaggio"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* LEFT SIDEBAR (Trip History & Profile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-zinc-150 flex flex-col h-full transform transition-transform duration-300 ease-in-out shrink-0
        md:relative md:transform-none md:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Brand Header */}
        <div className="hidden md:flex items-center gap-2 p-5 border-b border-zinc-100">
          <div className="p-2 bg-black text-white rounded-lg">
            <Navigation className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <span className="font-bold tracking-tight font-display text-slate-900 text-xs uppercase">
              TRAVEL<span className="text-black">OS</span>
            </span>
            <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
              LIVE FLIGHT CO-PILOT
            </span>
          </div>
        </div>

        {/* User Account Bar */}
        <div className="p-4 bg-zinc-50/30 border-b border-zinc-100 flex items-center gap-3">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "Profilo"} 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-zinc-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-150 text-black flex items-center justify-center text-xs font-bold">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {user.displayName || (user.isAnonymous ? "Utente Demo Guest" : "Utente Verificato")}
            </h4>
            <p className="text-[9px] text-slate-400 truncate font-mono">
              {user.email || "Accesso Anonimo"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-450 hover:text-black hover:bg-zinc-50 rounded-lg transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Create Trip Action Button */}
        <div className="p-4 border-b border-zinc-100">
          <button
            onClick={handleCreateNewTripClick}
            className="w-full bg-black hover:bg-zinc-800 text-white py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuovo Viaggio
          </button>
        </div>

        {/* Trip History Title */}
        <div className="px-4 pt-4 pb-1">
          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block font-display">
            Storico Viaggi ({trips.length})
          </span>
        </div>

        {/* Trip History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
          {tripsLoading ? (
            <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-black animate-spin" />
              <span>Caricamento viaggi...</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <Compass className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nessun viaggio in archivio.</p>
              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">Genera il tuo primo itinerario esecutivo.</p>
            </div>
          ) : (
            trips.map((t) => {
              const isSelected = activeTrip?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTrip(t);
                    setIsSidebarOpen(false);
                  }}
                  className={`group relative p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-950 font-bold'
                      : 'bg-white border-transparent hover:bg-zinc-50/50 text-slate-750'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold truncate flex items-center gap-1.5">
                      <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-black' : 'text-slate-400'}`} />
                      {t.constraints.destination}
                    </h5>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5 truncate">
                      {t.constraints.startDate} – {t.constraints.endDate}
                    </p>
                    <p className="text-[8px] uppercase tracking-wide font-medium text-slate-400 mt-1">
                      {t.days.length} {t.days.length === 1 ? 'giorno' : 'giorni'} • {t.profile.pace}
                    </p>
                  </div>
                  
                  {/* Delete trip button */}
                  <button
                    onClick={(e) => handleDeleteTrip(t.id, e)}
                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition shrink-0 cursor-pointer"
                    title="Elimina viaggio"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Subtle Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/20 text-[8px] font-mono text-slate-450 text-center uppercase tracking-wider">
          TravelOS v1.1 • Cloud Synced
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY BACKGROUND */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        ></div>
      )}

      {/* MAIN CONTENT WORKSPACE AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-white relative">
        
        {!activeTrip ? (
          // ONBOARDING/PLANNER VIEW (Inside a perfectly scrollable app container)
          <div className="flex-1 overflow-y-auto bg-zinc-50/20">
            <OnboardingView onTripCreated={handleTripCreated} />
          </div>
        ) : (
          // ACTIVE TRIP DASHBOARD WORKSPACE (Completely self-contained, no body scrolling!)
          <div className="flex-1 flex flex-col h-full overflow-hidden" id="workspace">
            
            {/* Top Workspace Bar (Fixed & Compact on mobile) */}
            <div className="bg-white border-b border-zinc-150 px-4 md:px-6 py-2.5 md:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 shrink-0">
              
              {/* Destination metadata info */}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] md:text-[9px] font-extrabold font-mono tracking-widest text-zinc-800 bg-zinc-50 px-1.5 md:px-2 py-0.5 rounded uppercase border border-zinc-100">
                    ITINERARIO ATTIVO
                  </span>
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-medium font-mono">
                    {new Date(activeTrip.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <h2 className="text-sm md:text-lg font-bold font-display text-slate-900 flex items-center gap-1.5 mt-0.5">
                  {activeTrip.constraints.destination}
                  <span className="text-[10px] md:text-xs font-normal text-slate-505 font-sans font-mono">
                    • {activeTrip.constraints.hotelName}
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] md:text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {activeTrip.constraints.startDate} – {activeTrip.constraints.endDate}
                  </span>
                  <span>•</span>
                  <span>RITMO: <strong>{activeTrip.profile.pace.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>FOCUS: <strong>{activeTrip.profile.focus.toUpperCase()}</strong></span>
                </div>
              </div>

              {/* In-app Subtab Selector (The core layout controller - Hidden on Mobile) */}
              <div className="hidden md:flex p-0.5 bg-zinc-50 rounded-lg border border-zinc-200/60 shrink-0 self-start lg:self-auto">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold font-display rounded-md transition cursor-pointer ${
                    activeTab === 'live' 
                      ? 'bg-white text-black font-extrabold border border-zinc-200 shadow-xs' 
                      : 'text-slate-550 hover:text-black'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-black" />
                  Vista Adesso
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold font-display rounded-md transition cursor-pointer ${
                    activeTab === 'timeline' 
                      ? 'bg-white text-black font-extrabold border border-zinc-200 shadow-xs' 
                      : 'text-slate-550 hover:text-black'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  Piano Giorno
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold font-display rounded-md transition cursor-pointer ${
                    activeTab === 'map' 
                      ? 'bg-white text-black font-extrabold border border-zinc-200 shadow-xs' 
                      : 'text-slate-550 hover:text-black'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-black" />
                  Mappa Sequenziale
                </button>

                <button
                  onClick={() => setActiveTab('logistics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold font-display rounded-md transition cursor-pointer relative ${
                    activeTab === 'logistics' 
                      ? 'bg-white text-black font-extrabold border border-zinc-200 shadow-xs' 
                      : 'text-slate-550 hover:text-black'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5 text-black" />
                  Voli & Trasporti
                  {activeTrip.constraints.alreadyOrganized === false && !activeTrip.constraints.arrivalTransport && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              </div>

            </div>

            {/* TAB CONTAINER (Occupies exactly 100% of the remaining workspace height, completely scrolls internally) */}
            <div className="flex-1 overflow-hidden relative bg-zinc-50/20">
              <div className="absolute inset-0 overflow-y-auto">
                <div className="p-4 md:p-6 max-w-6xl mx-auto h-full">
                  {activeTab === 'live' && (
                    <LiveView trip={activeTrip} userLocation={userLocation} />
                  )}
                  {activeTab === 'timeline' && (
                    <TimelineView trip={activeTrip} onTripUpdated={handleTripUpdated} />
                  )}
                  {activeTab === 'map' && (
                    <SmartMapView trip={activeTrip} userLocation={userLocation} />
                  )}
                  {activeTab === 'logistics' && (
                    <LogisticsHub trip={activeTrip} onTripUpdated={handleTripUpdated} />
                  )}
                </div>
              </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom only on active trip and mobile layout) */}
            <nav className="md:hidden h-14 bg-white border-t border-zinc-150 flex items-center justify-around px-2 shrink-0 z-30">
              <button
                onClick={() => setActiveTab('live')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition cursor-pointer ${
                  activeTab === 'live' ? 'text-black font-extrabold' : 'text-slate-400 font-semibold'
                }`}
              >
                <Clock className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] tracking-tight font-mono">ADESSO</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition cursor-pointer ${
                  activeTab === 'timeline' ? 'text-black font-extrabold' : 'text-slate-400 font-semibold'
                }`}
              >
                <Calendar className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] tracking-tight font-mono">PIANO</span>
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition cursor-pointer ${
                  activeTab === 'map' ? 'text-black font-extrabold' : 'text-slate-400 font-semibold'
                }`}
              >
                <Map className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] tracking-tight font-mono">MAPPA</span>
              </button>

              <button
                onClick={() => setActiveTab('logistics')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition cursor-pointer relative ${
                  activeTab === 'logistics' ? 'text-black font-extrabold' : 'text-slate-400 font-semibold'
                }`}
              >
                <Plane className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] tracking-tight font-mono">LOGISTICA</span>
                {activeTrip.constraints.alreadyOrganized === false && !activeTrip.constraints.arrivalTransport && (
                  <span className="absolute top-2 right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 transition text-slate-400 font-semibold cursor-pointer"
              >
                <Menu className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] tracking-tight font-mono">VIAGGI</span>
              </button>
            </nav>

          </div>
        )}

      </main>

    </div>
  );
}

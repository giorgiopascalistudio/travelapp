export interface ExperienceProfile {
  pace: 'relaxed' | 'moderate' | 'frantic'; // relaxed, moderate, frantic
  focus: 'culture' | 'balanced' | 'fun'; // culture (monuments/history), balanced, fun (nightlife/leisure)
  style: 'experiential' | 'sightseeing'; // experiences vs monuments
  rhythm: 'early_bird' | 'standard' | 'night_owl'; // preferred waking hour & schedule
  budget: 'budget' | 'moderate' | 'luxury';
  foodPreference?: 'local' | 'street_food' | 'fine_dining' | 'vegetarian' | 'anything';
}

export interface TransitDetails {
  mode: 'walk' | 'metro' | 'bus' | 'train' | 'taxi' | 'other';
  line?: string;           // e.g., "Line A", "Bus 85"
  direction?: string;      // e.g., "Anagnina" or "Termini"
  fromStop?: string;       // e.g., "Ottaviano"
  toStop?: string;         // e.g., "Flaminio"
  headsign?: string;       // e.g., "Dir. Laurentina"
  walkingBeforeMinutes?: number;
  walkingAfterMinutes?: number;
}

export interface Activity {
  id: string;
  type: 'transit' | 'checkin' | 'checkout' | 'visit' | 'meal' | 'leisure' | 'flight_train' | 'buffer';
  title: string;
  locationName: string;
  startTime: string;      // "HH:MM" format
  endTime: string;        // "HH:MM" format
  durationMinutes: number;
  description: string;
  transitDetails?: TransitDetails;
  lat?: number;
  lng?: number;
  averageFatigue: 'low' | 'medium' | 'high';
  averageDurationMinutes?: number;
}

export interface DayPlan {
  dayNumber: number;
  date: string;          // YYYY-MM-DD
  title: string;         // e.g., "Ancient Rome & Taste of Trastevere"
  activities: Activity[];
}

export interface TravelConstraints {
  destination: string;
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  hotelName: string;
  hotelAddress: string;
  alreadyOrganized?: boolean;
  arrivalTransport?: {
    type: 'flight' | 'train' | 'car' | 'other';
    number?: string;     // Flight number or Train number
    time: string;        // "HH:MM"
  };
  departureTransport?: {
    type: 'flight' | 'train' | 'car' | 'other';
    number?: string;
    time: string;        // "HH:MM"
  };
  companions: 'solo' | 'couple' | 'friends' | 'family';
}

export interface Trip {
  id: string;
  constraints: TravelConstraints;
  profile: ExperienceProfile;
  days: DayPlan[];
  createdAt: string;
}

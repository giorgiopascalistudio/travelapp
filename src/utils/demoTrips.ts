import { Trip } from "../types";

export const demoTrips: Trip[] = [
  {
    id: "rome-os-demo",
    constraints: {
      destination: "Roma, Italia",
      startDate: "2026-07-15",
      endDate: "2026-07-16",
      hotelName: "Elizabeth Unique Hotel",
      hotelAddress: "Via di Frezza 70, 00186 Roma RM, Italia",
      arrivalTransport: {
        type: "train",
        number: "FR 9611",
        time: "08:30"
      },
      departureTransport: {
        type: "flight",
        number: "AZ 204",
        time: "19:30"
      },
      companions: "couple"
    },
    profile: {
      pace: "moderate",
      focus: "culture",
      style: "experiential",
      rhythm: "standard",
      budget: "luxury"
    },
    createdAt: new Date().toISOString(),
    days: [
      {
        dayNumber: 1,
        date: "2026-07-15",
        title: "Vatican Splendors & Twilight Borghese",
        activities: [
          {
            id: "act-1-1",
            type: "checkin",
            title: "Check-in & Luggage Drop",
            locationName: "Elizabeth Unique Hotel",
            startTime: "09:00",
            endTime: "09:30",
            durationMinutes: 30,
            description: "Drop off travel bags, freshen up, and synchronize mobile OS devices with the local time zone.",
            lat: 41.9061,
            lng: 12.4786,
            averageFatigue: "low",
            averageDurationMinutes: 15
          },
          {
            id: "act-1-2",
            type: "transit",
            title: "Transit: Flaminio to Ottaviano",
            locationName: "Metro Line A (Dir. Battistini)",
            startTime: "09:30",
            endTime: "09:55",
            durationMinutes: 25,
            description: "Walk 6 mins to Flaminio Station. Board Metro Line A toward Battistini. Travel 3 stops. Get off at Ottaviano.",
            lat: 41.9092,
            lng: 12.4764,
            averageFatigue: "low",
            transitDetails: {
              mode: "metro",
              line: "Metro Line A",
              direction: "Battistini",
              fromStop: "Flaminio",
              toStop: "Ottaviano",
              headsign: "Dir. Battistini",
              walkingBeforeMinutes: 6,
              walkingAfterMinutes: 4
            }
          },
          {
            id: "act-1-3",
            type: "visit",
            title: "Vatican Museums & Sistine Chapel",
            locationName: "Vatican Museums (Viale Vaticano)",
            startTime: "09:55",
            endTime: "12:30",
            durationMinutes: 155,
            description: "Pre-booked fast-track entry. Focus on the Gallery of Maps and Raphael Rooms, finishing inside Michelangelo’s Sistine Chapel.",
            lat: 41.9070,
            lng: 12.4535,
            averageFatigue: "high",
            averageDurationMinutes: 180
          },
          {
            id: "act-1-4",
            type: "transit",
            title: "Transit: Walk to Prati Lunch",
            locationName: "Via Leone IV Walking Path",
            startTime: "12:30",
            endTime: "12:45",
            durationMinutes: 15,
            description: "Exit Musei Vaticani and walk north along Via Leone IV to Pizzarium. Flat walk of about 750 meters.",
            lat: 41.9075,
            lng: 12.4510,
            averageFatigue: "medium",
            transitDetails: {
              mode: "walk",
              walkingBeforeMinutes: 15,
              walkingAfterMinutes: 0
            }
          },
          {
            id: "act-1-5",
            type: "meal",
            title: "Gourmet Slice Pizza",
            locationName: "Bonci Pizzarium (Prati)",
            startTime: "12:45",
            endTime: "13:30",
            durationMinutes: 45,
            description: "World-famous Roman pizza al taglio (by the slice) with legendary dough. Try the potato-mozzarella and seasonal selections.",
            lat: 41.9077,
            lng: 12.4475,
            averageFatigue: "low",
            averageDurationMinutes: 40
          },
          {
            id: "act-1-6",
            type: "transit",
            title: "Transit: Return Metro to Spagna",
            locationName: "Metro Line A (Dir. Anagnina)",
            startTime: "13:30",
            endTime: "14:00",
            durationMinutes: 30,
            description: "Walk 2 mins to Cipro Station. Take Metro Line A towards Anagnina for 4 stops. Exit at Spagna.",
            lat: 41.9070,
            lng: 12.4470,
            averageFatigue: "low",
            transitDetails: {
              mode: "metro",
              line: "Metro Line A",
              direction: "Anagnina",
              fromStop: "Cipro",
              toStop: "Spagna",
              headsign: "Dir. Anagnina",
              walkingBeforeMinutes: 2,
              walkingAfterMinutes: 5
            }
          },
          {
            id: "act-1-7",
            type: "buffer",
            title: "Mid-Day Espresso & Hotel Rest",
            locationName: "Antico Caffè Greco / Hotel",
            startTime: "14:00",
            endTime: "15:30",
            durationMinutes: 90,
            description: "Decompress at Rome’s oldest active café on Via Condotti, then take a short lie-down to offset museum fatigue.",
            lat: 41.9060,
            lng: 12.4815,
            averageFatigue: "low"
          },
          {
            id: "act-1-8",
            type: "transit",
            title: "Transit: Walk to Borghese Gardens",
            locationName: "Pincio Promenade Climbing Path",
            startTime: "15:30",
            endTime: "15:50",
            durationMinutes: 20,
            description: "Stroll up the Pincio steps from Piazza del Popolo into the tree-lined avenues of Villa Borghese. Moderate uphill incline.",
            lat: 41.9100,
            lng: 12.4790,
            averageFatigue: "medium",
            transitDetails: {
              mode: "walk",
              walkingBeforeMinutes: 20,
              walkingAfterMinutes: 0
            }
          },
          {
            id: "act-1-9",
            type: "visit",
            title: "Galleria Borghese Masterpieces",
            locationName: "Galleria Borghese (Piazzale Scipione Borghese)",
            startTime: "15:50",
            endTime: "18:00",
            durationMinutes: 130,
            description: "Rigid 2-hour timed entry slot. Marvel at Bernini’s Pluto & Proserpina, Apollo & Daphne, and Caravaggio’s dark canvases.",
            lat: 41.9141,
            lng: 12.4921,
            averageFatigue: "medium",
            averageDurationMinutes: 120
          },
          {
            id: "act-1-10",
            type: "transit",
            title: "Transit: Walk to Hotel / Dinner Path",
            locationName: "Trinità dei Monti Walkway",
            startTime: "18:00",
            endTime: "18:30",
            durationMinutes: 30,
            description: "Leisurely downhill walk via Viale delle Belle Arti and Via del Corso back to the hotel. Drop off souvenirs.",
            lat: 41.9120,
            lng: 12.4850,
            averageFatigue: "low",
            transitDetails: {
              mode: "walk",
              walkingBeforeMinutes: 30,
              walkingAfterMinutes: 0
            }
          },
          {
            id: "act-1-11",
            type: "meal",
            title: "Tasting Menu Dinner",
            locationName: "Ristorante Ad Hoc (Via di Ripetta)",
            startTime: "19:30",
            endTime: "21:30",
            durationMinutes: 120,
            description: "Elegant fine-dining featuring Roman classic recipes paired with premium Italian truffles and wines. Only 5 mins walk from hotel.",
            lat: 41.9069,
            lng: 12.4761,
            averageFatigue: "low",
            averageDurationMinutes: 120
          }
        ]
      },
      {
        dayNumber: 2,
        date: "2026-07-16",
        title: "Colosseum Icons & Bohemian Trastevere",
        activities: [
          {
            id: "act-2-1",
            type: "transit",
            title: "Transit: Hotel to Colosseum",
            locationName: "Spagna to Colosseo via Termini",
            startTime: "08:15",
            endTime: "08:45",
            durationMinutes: 30,
            description: "Walk 6 mins to Spagna. Board Metro Line A to Termini (3 stops). Transfer inside Termini to Metro Line B. Ride 2 stops to Colosseo.",
            lat: 41.9061,
            lng: 12.4786,
            averageFatigue: "medium",
            transitDetails: {
              mode: "metro",
              line: "Metro Line B",
              direction: "Laurentina",
              fromStop: "Spagna",
              toStop: "Colosseo",
              headsign: "Dir. Laurentina",
              walkingBeforeMinutes: 6,
              walkingAfterMinutes: 3
            }
          },
          {
            id: "act-2-2",
            type: "visit",
            title: "Colosseum & Roman Forum",
            locationName: "Piazza del Colosseo",
            startTime: "08:45",
            endTime: "11:15",
            durationMinutes: 150,
            description: "Guided arena floor tour of the Flavian Amphitheatre, followed by a walk through the arches of the ancient Roman political hub.",
            lat: 41.8902,
            lng: 12.4922,
            averageFatigue: "high",
            averageDurationMinutes: 150
          },
          {
            id: "act-2-3",
            type: "transit",
            title: "Transit: Bus 85 to Trastevere Gate",
            locationName: "ATAC Bus 85 (Dir. Termini / Walk)",
            startTime: "11:15",
            endTime: "11:45",
            durationMinutes: 30,
            description: "Walk to Celio Vibenna stop. Board Bus 85. Get off at Piazza Venezia. Cross Tiber Island on foot into Trastevere. Beautiful river views.",
            lat: 41.8900,
            lng: 12.4900,
            averageFatigue: "medium",
            transitDetails: {
              mode: "bus",
              line: "Bus 85",
              direction: "Piazza Venezia",
              fromStop: "Celio Vibenna",
              toStop: "Piazza Venezia",
              headsign: "85 Termini",
              walkingBeforeMinutes: 4,
              walkingAfterMinutes: 12
            }
          },
          {
            id: "act-2-4",
            type: "meal",
            title: "Traditional Roman Osteria",
            locationName: "Da Enzo al 29 (Trastevere)",
            startTime: "11:45",
            endTime: "13:00",
            durationMinutes: 75,
            description: "Inimitable Cacio e Pepe and Carbonara in a cozy local spot. Arrive early before opening to secure a prime table without huge lines.",
            lat: 41.8893,
            lng: 12.4777,
            averageFatigue: "low",
            averageDurationMinutes: 80
          },
          {
            id: "act-2-5",
            type: "visit",
            title: "Trastevere Alleyways & Santa Maria Basilica",
            locationName: "Piazza di Santa Maria in Trastevere",
            startTime: "13:00",
            endTime: "14:15",
            durationMinutes: 75,
            description: "Explore the labyrinth of ivy-draped side alleys. Step inside the 12th-century basilica to view Cavallini's stunning golden mosaics.",
            lat: 41.8899,
            lng: 12.4704,
            averageFatigue: "medium",
            averageDurationMinutes: 60
          },
          {
            id: "act-2-6",
            type: "transit",
            title: "Transit: Walk across Tiber to Pantheon",
            locationName: "Ponte Sisto Historical Footpath",
            startTime: "14:15",
            endTime: "14:45",
            durationMinutes: 30,
            description: "Cross the historic Ponte Sisto stone bridge, walk past Campo de' Fiori's open market to the Pantheon.",
            lat: 41.8930,
            lng: 12.4710,
            averageFatigue: "medium",
            transitDetails: {
              mode: "walk",
              walkingBeforeMinutes: 30,
              walkingAfterMinutes: 0
            }
          },
          {
            id: "act-2-7",
            type: "visit",
            title: "The Pantheon & Trevi Coins",
            locationName: "Piazza della Rotonda & Piazza di Trevi",
            startTime: "14:45",
            endTime: "16:00",
            durationMinutes: 75,
            description: "Stand under the grand concrete oculus dome (entry with timed voucher), then walk 8 mins to throw a coin into the Trevi Fountain.",
            lat: 41.8986,
            lng: 12.4769,
            averageFatigue: "medium",
            averageDurationMinutes: 65
          },
          {
            id: "act-2-8",
            type: "checkout",
            title: "Hotel Check-out & Taxi to Station",
            locationName: "Elizabeth Unique Hotel",
            startTime: "16:30",
            endTime: "17:15",
            durationMinutes: 45,
            description: "Walk back to hotel from Trevi (10 mins). Finalize checkout. Hotel concierge summons a white city taxi to Termini Station.",
            lat: 41.9061,
            lng: 12.4786,
            averageFatigue: "low",
            averageDurationMinutes: 30
          },
          {
            id: "act-2-9",
            type: "flight_train",
            title: "Departure: Termini Eurostar",
            locationName: "Roma Termini Railway Station",
            startTime: "17:15",
            endTime: "18:00",
            durationMinutes: 45,
            description: "Arrive at station platforms. Secure tickets, stock up on water/snacks for the journey, and board the high-speed departure rail.",
            lat: 41.9014,
            lng: 12.5020,
            averageFatigue: "medium"
          }
        ]
      }
    ]
  },
  {
    id: "paris-os-demo",
    constraints: {
      destination: "Paris, France",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
      hotelName: "Hotel Regina Louvre",
      hotelAddress: "2 Place des Pyramides, 75001 Paris, France",
      companions: "solo"
    },
    profile: {
      pace: "frantic",
      focus: "balanced",
      style: "sightseeing",
      rhythm: "early_bird",
      budget: "moderate"
    },
    createdAt: new Date().toISOString(),
    days: [
      {
        dayNumber: 1,
        date: "2026-08-01",
        title: "Iconic Masterpieces & Marais Walk",
        activities: [
          {
            id: "act-p-1",
            type: "checkin",
            title: "Early Check-in",
            locationName: "Hotel Regina Louvre",
            startTime: "08:30",
            endTime: "09:00",
            durationMinutes: 30,
            description: "Drop bags at the Louvre-adjacent hotel and get the Paris Metro Carnet ticket card.",
            lat: 48.8631,
            lng: 2.3315,
            averageFatigue: "low"
          },
          {
            id: "act-p-2",
            type: "visit",
            title: "Louvre Museum Fast-Track",
            locationName: "Louvre Museum (Pyramide du Louvre)",
            startTime: "09:00",
            endTime: "12:00",
            durationMinutes: 180,
            description: "Enter at first slot. Direct path to Mona Lisa, Winged Victory, and Venus de Milo before crowds maximize.",
            lat: 48.8606,
            lng: 2.3376,
            averageFatigue: "high"
          },
          {
            id: "act-p-3",
            type: "transit",
            title: "Transit: Metro Line 1 to Marais",
            locationName: "Palais Royal - Louvre to Saint-Paul",
            startTime: "12:00",
            endTime: "12:20",
            durationMinutes: 20,
            description: "Board Metro Line 1 at Palais Royal towards Château de Vincennes. Travel 4 stops. Get off at Saint-Paul.",
            lat: 48.8624,
            lng: 2.3364,
            averageFatigue: "low",
            transitDetails: {
              mode: "metro",
              line: "Metro Line 1",
              direction: "Château de Vincennes",
              fromStop: "Palais Royal - Musée du Louvre",
              toStop: "Saint-Paul",
              headsign: "Vincennes"
            }
          },
          {
            id: "act-p-4",
            type: "meal",
            title: "L'As du Fallafel",
            locationName: "Rue des Rosiers (Le Marais)",
            startTime: "12:20",
            endTime: "13:00",
            durationMinutes: 40,
            description: "Indulge in Paris's most famous, legendary falafel pitas in the Jewish Quarter.",
            lat: 48.8576,
            lng: 2.3592,
            averageFatigue: "low"
          }
        ]
      }
    ]
  }
];

export interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY: string;
}

const SYSTEM_PROMPT = `You are the core route optimizer and scheduler for "Travel OS", a high-end Travel Operating System that acts as an operational co-pilot for travelers.
Instead of a simple, thin list of generic tourist spots, you must build a deeply detailed, dense, and fully comprehensive day-by-day itinerary. A sparse itinerary with few activities is a critical failure.

You MUST adhere to these strict execution rules:
1. DAILY DENSITY: Each full exploration day MUST contain at least 6 to 9 distinct, sequenced activities or transit segments (e.g. morning neighborhood stroll, primary landmark exploration, coffee/sweet break, second cultural site/landmark, lunch, afternoon experience, late afternoon rest/panoramic viewpoint, dinner, and a relaxed evening walk/activity).
2. STEP-BY-STEP REALISM: Do not skip chunks of the day. Map the schedule continuously from the morning start (e.g., 08:30 or 09:00 depending on rhythm) through afternoon transit, down to the evening/dinner and bedtime (e.g., 22:30 or 23:00).
3. EXTREMELY RICH DESCRIPTIONS: The 'description' field for every activity MUST be a detailed, engaging paragraph of 3 to 5 complete, informative sentences. Include specific historical context, local anecdotes, architectural details, expert tips to beat crowds, what to photograph, and unique sensory descriptions.
4. FOOD & GASTRONOMY SENSORY EXPERIENCES: For every 'meal' activity, recommend an exact named restaurant, typical osteria, market stall, or bistrot matching the budget and food preference. In the description, recommend 2-3 specific authentic local dishes/drinks by their regional names and describe why they are delicious.
5. TRANSIT REALISM: Integrate realistic public transit (metro, bus, local train) details, specifying the exact line names, directions, headsigns, and specific stop names for the target city (e.g., Rome Metro Line A from Termini to Spagna, Paris Metro Line 1 from Châtelet to Louvre-Rivoli, London Underground Piccadilly Line, etc.).
6. GEOLOCATION PRECISION: Set accurate approximate latitude (lat) and longitude (lng) values for every activity location to allow mapping.
7. COMPANIONS ADAPTATION: Adapt the activity descriptions and pace to the travel companions (e.g., families with children need playground stops and kid-friendly explanations; couples need romantic viewpoints; friends need social hubs/pubs).
8. PROFILE ALIGNMENT:
   - Pace: 'relaxed' (more breaks, fewer stops, later starts), 'moderate', 'frantic' (heavy exploration, tight transitions, early starts).
   - Focus: 'culture' (monuments/history), 'balanced', 'fun' (shopping, leisure, viewpoints, nightlife).
   - Style: 'experiential' (hands-on activities, walking tours, neighborhoods) vs 'sightseeing' (iconic landmarks, photo stops).
   - Rhythm: 'early_bird' (start day at 8:00 AM), 'standard' (start at 9:00 or 9:30 AM), 'night_owl' (start later at 11:00 AM, schedule late dinners/night activities).
   - Budget: 'budget' (frequent cheap eats, walking, public transit), 'moderate' (mix of public transit and taxis, cozy bistros), 'luxury' (fine dining, private transfers, high-end tours).
   - Food Preference (foodPreference):
     - 'local': prioritize authentic regional specialties, typical local trattorias, taverns, and historic eateries of the destination.
     - 'street_food': prioritize food markets, kiosks, street food stalls, and casual bites on-the-go.
     - 'fine_dining': prioritize high-end gourmet restaurants, Michelin-starred spots, elegant dining, and wine pairing experiences.
     - 'vegetarian': prioritize vegetarian or vegan restaurants and ensure all meal options have excellent meat-free selections.
     - 'anything': no restriction, suggest a rich mix of standard dining spots matching the budget.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    days: {
      type: "ARRAY",
      description: "List of day plans making up the complete travel itinerary.",
      items: {
        type: "OBJECT",
        properties: {
          dayNumber: { type: "INTEGER" },
          date: { type: "STRING", description: "Date of the day in YYYY-MM-DD" },
          title: { type: "STRING", description: "EXPLORATION THEME, e.g. 'Trastevere Charms & Ancient Icons' or 'Louvre Masterpieces & Seine Views'" },
          activities: {
            type: "ARRAY",
            description: "Array of sequenced activities.",
            items: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  enum: ["transit", "checkin", "checkout", "visit", "meal", "leisure", "flight_train", "buffer"]
                },
                title: { type: "STRING", description: "Action name, e.g. 'Visit the Colosseum', 'Take Metro Line B', 'Lunch at Trattoria Luzzi', 'Walk to Trevi Fountain'" },
                locationName: { type: "STRING", description: "Specific landmark, venue, transit stop, or restaurant name" },
                startTime: { type: "STRING", description: "Start time in HH:MM format" },
                endTime: { type: "STRING", description: "End time in HH:MM format" },
                durationMinutes: { type: "INTEGER", description: "Duration of this activity in minutes" },
                description: { type: "STRING", description: "Contextual advice, line direction, or what to look out for" },
                averageFatigue: {
                  type: "STRING",
                  enum: ["low", "medium", "high"]
                },
                averageDurationMinutes: { type: "INTEGER", description: "Typical duration of this activity if applicable" },
                lat: { type: "NUMBER", description: "Approximate latitude of the location" },
                lng: { type: "NUMBER", description: "Approximate longitude of the location" },
                transitDetails: {
                  type: "OBJECT",
                  description: "Mandatory details only if type is 'transit'. Must specify realistic city lines, stops, or walking.",
                  properties: {
                    mode: {
                      type: "STRING",
                      enum: ["walk", "metro", "bus", "train", "taxi", "other"]
                    },
                    line: { type: "STRING", description: "Line name, e.g. 'Line A', 'Bus 85', 'Piccadilly Line', 'RER A'" },
                    direction: { type: "STRING", description: "Line terminus or direction, e.g. 'Battistini', 'Marne-la-Vallée'" },
                    fromStop: { type: "STRING", description: "Departure stop/station name, e.g. 'Ottaviano', 'Termini'" },
                    toStop: { type: "STRING", description: "Arrival stop/station name, e.g. 'Flaminio', 'Colosseo'" },
                    headsign: { type: "STRING", description: "Train headsign text if available" },
                    walkingBeforeMinutes: { type: "INTEGER", description: "Estimated walk duration before boarding, in minutes" },
                    walkingAfterMinutes: { type: "INTEGER", description: "Estimated walk duration after disembarking, in minutes" }
                  }
                }
              },
              required: ["type", "title", "locationName", "startTime", "endTime", "durationMinutes", "description", "averageFatigue"]
            }
          }
        },
        required: ["dayNumber", "date", "title", "activities"]
      }
    }
  },
  required: ["days"]
};

function buildUserPrompt(constraints: any, profile: any): string {
  const isOrganized = constraints.alreadyOrganized !== false;
  let organizationGuidance = "";
  if (!isOrganized) {
    organizationGuidance = `
CRITICAL INSTRUCTION: The user's trip is NOT already organized! You MUST:
1. Recommend and select a suitable highly-rated hotel (including name, address, and coordinates) that fits the user's budget and style, and place a 'checkin' and 'visit' activity at this hotel on Day 1, using this hotel as the base for the entire trip.
2. Recommend realistic flight or train transport options (with transport mode, suggested flight/train route, times, and mock flight/train codes) for their arrival on Day 1 and departure on the final day, presenting these explicitly as 'flight_train' activities in the schedule.
3. Suggest the most efficient local transport mode (e.g. airport shuttle, metro line, taxi) to get from their arrival location to the recommended hotel, and from the hotel to their departure location.
`;
  } else {
    organizationGuidance = `The user's trip is already organized. The pre-booked hotel is ${constraints.hotelName} at ${constraints.hotelAddress}. The pre-booked arrival is ${constraints.arrivalTransport ? `${constraints.arrivalTransport.type} at ${constraints.arrivalTransport.time}` : 'Not specified'}, and departure is ${constraints.departureTransport ? `${constraints.departureTransport.type} at ${constraints.departureTransport.time}` : 'Not specified'}. Use these details as the starting and ending points of the trip.`;
  }

  return `Generate a realistic travel schedule for a trip to: ${constraints.destination}
Dates: from ${constraints.startDate} to ${constraints.endDate}.
Companions: ${constraints.companions}.

LOGISTICS & ORGANIZATIONAL STATUS:
${organizationGuidance}

User experience preferences:
- Pace: ${profile.pace}
- Focus: ${profile.focus}
- Style: ${profile.style}
- Daily Rhythm: ${profile.rhythm}
- Budget: ${profile.budget}
- Food Preference: ${profile.foodPreference || 'anything'}

Please construct an extremely rich, fully comprehensive, moment-by-moment travel itinerary where every day feels like an expert local curated experience.
DO NOT make a thin or sparse schedule; each day must have 6 to 9 distinct, sequential steps (exploration, food, viewpoints, transitions, rests).
Provide accurate lat/lng coordinates for each activity so that we can render them on an interactive map.
Keep transit segments as separate activities of type "transit" that link the preceding and succeeding activity locations.
For each and every activity (including transits, lunches, visits), write a deeply descriptive, engaging, and advice-filled 'description' of 3 to 5 full sentences. Provide local trivia, historical insights, what specific traditional food item to order (by its local name, like 'Cacio e Pepe' in Rome or 'Croque Monsieur' in Paris), and pro-tips for beating tourist crowds. Make sure the first activity on Day 1 starts with the arrival or hotel check-in, and the last activity on the final day handles checking out and traveling to departure.`;
}

async function callGemini(model: string, apiKey: string, userPrompt: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: RESPONSE_SCHEMA,
        temperature: 1.0,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err: any = new Error(`Gemini API error (${res.status}): ${errText}`);
    err.status = res.status;
    throw err;
  }

  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response received from Gemini.");
  }
  return JSON.parse(text.trim());
}

async function generateWithRetry(model: string, apiKey: string, userPrompt: string, retriesLeft = 2, delayMs = 1500): Promise<any> {
  try {
    return await callGemini(model, apiKey, userPrompt);
  } catch (error: any) {
    const isTransient = error.status === 503 || error.status === 429 ||
      error.message?.includes("503") || error.message?.includes("429") ||
      error.message?.includes("temporary") || error.message?.includes("demand");
    if (isTransient && retriesLeft > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return generateWithRetry(model, apiKey, userPrompt, retriesLeft - 1, delayMs * 2);
    }
    throw error;
  }
}

async function handleGenerateItinerary(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const { constraints, profile } = body;

    if (!constraints || !constraints.destination) {
      return Response.json({ error: "Missing required constraints, particularly destination." }, { status: 400 });
    }

    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const userPrompt = buildUserPrompt(constraints, profile);

    let result;
    try {
      result = await generateWithRetry("gemini-3.5-flash", env.GEMINI_API_KEY, userPrompt);
    } catch (primaryError) {
      try {
        result = await generateWithRetry("gemini-flash-latest", env.GEMINI_API_KEY, userPrompt, 1);
      } catch (fallbackError) {
        result = await generateWithRetry("gemini-3.1-flash-lite", env.GEMINI_API_KEY, userPrompt, 0);
      }
    }

    return Response.json(result);
  } catch (error: any) {
    console.error("Itinerary generation error:", error);
    return Response.json({ error: error.message || "Failed to generate travel operating system itinerary." }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/itinerary/generate" && request.method === "POST") {
      return handleGenerateItinerary(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please add it in the Settings > Secrets panel of AI Studio.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API endpoint to generate travel operating system itinerary
app.post("/api/itinerary/generate", async (req, res) => {
  try {
    const { constraints, profile } = req.body;

    if (!constraints || !constraints.destination) {
      return res.status(400).json({ error: "Missing required constraints, particularly destination." });
    }

    const ai = getGeminiClient();

    // Create prompt for the Travel OS
    const systemPrompt = `You are the core route optimizer and scheduler for "Travel OS", a high-end Travel Operating System that acts as an operational co-pilot for travelers.
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

    const userPrompt = `Generate a realistic travel schedule for a trip to: ${constraints.destination}
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

    // Define the structured JSON schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.ARRAY,
          description: "List of day plans making up the complete travel itinerary.",
          items: {
            type: Type.OBJECT,
            properties: {
              dayNumber: { type: Type.INTEGER },
              date: { type: Type.STRING, description: "Date of the day in YYYY-MM-DD" },
              title: { type: Type.STRING, description: "EXPLORATION THEME, e.g. 'Trastevere Charms & Ancient Icons' or 'Louvre Masterpieces & Seine Views'" },
              activities: {
                type: Type.ARRAY,
                description: "Array of sequenced activities.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      enum: ["transit", "checkin", "checkout", "visit", "meal", "leisure", "flight_train", "buffer"]
                    },
                    title: { type: Type.STRING, description: "Action name, e.g. 'Visit the Colosseum', 'Take Metro Line B', 'Lunch at Trattoria Luzzi', 'Walk to Trevi Fountain'" },
                    locationName: { type: Type.STRING, description: "Specific landmark, venue, transit stop, or restaurant name" },
                    startTime: { type: Type.STRING, description: "Start time in HH:MM format" },
                    endTime: { type: Type.STRING, description: "End time in HH:MM format" },
                    durationMinutes: { type: Type.INTEGER, description: "Duration of this activity in minutes" },
                    description: { type: Type.STRING, description: "Contextual advice, line direction, or what to look out for" },
                    averageFatigue: {
                      type: Type.STRING,
                      enum: ["low", "medium", "high"]
                    },
                    averageDurationMinutes: { type: Type.INTEGER, description: "Typical duration of this activity if applicable" },
                    lat: { type: Type.NUMBER, description: "Approximate latitude of the location" },
                    lng: { type: Type.NUMBER, description: "Approximate longitude of the location" },
                    transitDetails: {
                      type: Type.OBJECT,
                      description: "Mandatory details only if type is 'transit'. Must specify realistic city lines, stops, or walking.",
                      properties: {
                        mode: {
                          type: Type.STRING,
                          enum: ["walk", "metro", "bus", "train", "taxi", "other"]
                        },
                        line: { type: Type.STRING, description: "Line name, e.g. 'Line A', 'Bus 85', 'Piccadilly Line', 'RER A'" },
                        direction: { type: Type.STRING, description: "Line terminus or direction, e.g. 'Battistini', 'Marne-la-Vallée'" },
                        fromStop: { type: Type.STRING, description: "Departure stop/station name, e.g. 'Ottaviano', 'Termini'" },
                        toStop: { type: Type.STRING, description: "Arrival stop/station name, e.g. 'Flaminio', 'Colosseo'" },
                        headsign: { type: Type.STRING, description: "Train headsign text if available" },
                        walkingBeforeMinutes: { type: Type.INTEGER, description: "Estimated walk duration before boarding, in minutes" },
                        walkingAfterMinutes: { type: Type.INTEGER, description: "Estimated walk duration after disembarking, in minutes" }
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

    // Helper function for generation with retry on transient errors
    const generateWithRetry = async (modelName: string, retriesLeft = 2, delayMs = 1500): Promise<any> => {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 1.0,
          }
        });
        if (!response.text) {
          throw new Error("Empty response received from Gemini.");
        }
        return response;
      } catch (error: any) {
        // Retry if transient (503, temporary demand spikes, etc.)
        const isTransient = error.message?.includes("503") || 
                            error.message?.includes("temporary") || 
                            error.message?.includes("demand") ||
                            error.status === 503 || 
                            error.message?.includes("429") ||
                            error.status === 429;
        if (isTransient && retriesLeft > 0) {
          console.warn(`[Gemini API Warning] Model ${modelName} returned transient error. Retrying in ${delayMs}ms... (Retries left: ${retriesLeft})`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return generateWithRetry(modelName, retriesLeft - 1, delayMs * 2);
        }
        throw error;
      }
    };

    let response;
    try {
      response = await generateWithRetry("gemini-3.5-flash");
    } catch (primaryError: any) {
      console.warn("Primary model 'gemini-3.5-flash' failed due to demand spikes. Falling back to 'gemini-flash-latest'...", primaryError);
      try {
        response = await generateWithRetry("gemini-flash-latest", 1);
      } catch (fallbackError: any) {
        console.warn("Fallback model 'gemini-flash-latest' failed too. Trying 'gemini-3.1-flash-lite' as final fallback...", fallbackError);
        response = await generateWithRetry("gemini-3.1-flash-lite", 0);
      }
    }

    const result = JSON.parse(response.text!.trim());
    return res.json(result);

  } catch (error: any) {
    console.error("Itinerary generation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate travel operating system itinerary."
    });
  }
});

// Setup Vite Dev server or Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Travel OS Server running on http://localhost:${PORT}`);
  });
}

startServer();

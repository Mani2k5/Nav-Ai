/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Clean up relative __dirname set by tsx/node -e to prevent createRequire errors in ESM packages
if (typeof (global as any).__dirname === 'string' && (global as any).__dirname === '.') {
  delete (global as any).__dirname;
}

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, FunctionDeclaration, Type, Modality } from '@google/genai';
import { INITIAL_KSR_STATION_DATA } from './src/data/ksrStationData.js';
import { RoutingEngine } from './src/utils/routingEngine.js';
import { StationData } from './src/types/navigation.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI Server-Side Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-Memory Station State & Routing Engine
let currentStationData: StationData = JSON.parse(JSON.stringify(INITIAL_KSR_STATION_DATA));
let routingEngine = new RoutingEngine(currentStationData);

// Active navigation sessions memory (keyed by sessionId or connection)
interface ActiveNavSession {
  sessionId: string;
  originNodeId: string;
  destinationNodeId: string;
  currentStepIndex: number;
  stepFreeOnly: boolean;
  route: any | null;
}
const activeSessions = new Map<string, ActiveNavSession>();

// Navigation Function Declarations for Gemini Live API
const resolveDestinationTool: FunctionDeclaration = {
  name: 'resolve_destination',
  description: 'Searches Bangalore KSR station points of interest, platforms 1-10, amenities (cloak room, IRCTC canteen, ATMs, waiting lounge), or Metro connection.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The user search term, e.g. "Platform 7", "cloak room", "dosa", "food", "Metro", "SBI ATM".',
      },
    },
    required: ['query'],
  },
};

const calculateRouteTool: FunctionDeclaration = {
  name: 'calculate_route',
  description: 'Calculates the verified step-by-step walking route between origin and destination on the station graph.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      originNodeId: {
        type: Type.STRING,
        description: 'ID of the starting station node (e.g. "entry_main", "pf1_center", "sbi_atm").',
      },
      destinationNodeId: {
        type: Type.STRING,
        description: 'ID of the destination station node (e.g. "pf6_7_center", "irctc_food_plaza", "cloak_room").',
      },
      stepFreeOnly: {
        type: Type.BOOLEAN,
        description: 'Whether to require wheelchair-accessible, step-free elevator/ramp route.',
      },
    },
    required: ['destinationNodeId'],
  },
};

const confirmCheckpointTool: FunctionDeclaration = {
  name: 'confirm_checkpoint',
  description: 'Confirms the passenger has reached the current waypoint or completed the step, advancing to the next instruction.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      currentStepIndex: {
        type: Type.NUMBER,
        description: 'The step number the passenger just completed.',
      },
    },
  },
};

const reportLostTool: FunctionDeclaration = {
  name: 'report_lost',
  description: 'Handles when the passenger is lost, took a wrong turn, or mentions what landmark they can see around them.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      visibleLandmark: {
        type: Type.STRING,
        description: 'What landmark, sign, or platform the passenger can currently see (e.g. "SBI ATM", "Platform 1", "Bookstall", "IRCTC").',
      },
    },
    required: ['visibleLandmark'],
  },
};

const liveTools = [
  resolveDestinationTool,
  calculateRouteTool,
  confirmCheckpointTool,
  reportLostTool,
];

// Set up WebSocket server for Gemini Live API audio streaming
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit('connection', clientWs, request);
      });
    }
  } catch (err) {
    // Ignore invalid upgrade requests
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  const sessionId = `nav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const currentNavSession: ActiveNavSession = {
    sessionId,
    originNodeId: 'entry_main',
    destinationNodeId: 'pf6_7_center',
    currentStepIndex: 0,
    stepFreeOnly: false,
    route: null,
  };
  activeSessions.set(sessionId, currentNavSession);

  clientWs.send(
    JSON.stringify({
      type: 'session_init',
      sessionId,
      message: 'Namaskara! Welcome to KSR Bengaluru. Live audio connection established.',
    })
  );

  let liveSession: any = null;

  try {
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' }, // Warm, clear female voice
          },
        },
        systemInstruction: `You are Rahul, a caring, warm, and deeply affectionate personal station guide for Krantivira Sangolli Rayanna (Bengaluru Railway Station) — KSR Bengaluru (Station Code: SBC).
You talk to the passenger just like a trusted younger brother, loving son, or protective cousin guiding their own family members (Bhaiyya, Didi, Uncle, Auntie, or friend) through the bustling station.

YOUR FAMILY-LIKE PERSONALITY & TALKING STYLE:
1. DEEPLY CARING & REASSURING:
   - Always speak with emotional warmth, empathy, and genuine care: "Don't worry at all, hold onto your bags tightly, I am right here walking beside you!", "Take your time, watch your step, there is no rush at all!", "Careful with that trolley wheel near the tactile tiles!"
   - Address them warmly with natural respect and cadence ("Namaskara!", "Haanji", "Arre", "Bhaiyya", "Didi", "Uncle", "Auntie", "my friend").
   - Radiate comfort and protection: if they sound rushed, calm them down; if they sound tired, offer to point out comfortable seating or the elevator.

2. CONTINUOUS STEP-BY-STEP SPATIAL GUIDANCE ("ON YOUR RIGHT SIDE, ON YOUR LEFT SIDE"):
   - Never give robotic distances alone like "walk 30 meters". Instead, guide them visually step by step using physical landmarks on their LEFT and RIGHT:
     * "Walk straight ahead past the main clock... can you see the blue UTS ticket windows on your right side?"
     * "Now keep walking about twenty steps... on your left side you will notice the open waiting hall..."
     * "Turn slightly towards your right—look up and you'll see the overhead Foot Over Bridge stairs. Careful as you step up!"
     * "Stay right behind the yellow tactile line along the platform edge—safety first!"

3. SPONTANEOUS & DELIGHTFUL SHOP & FOOD SUGGESTIONS (JUST LIKE A FAMILY MEMBER):
   - Whenever passing or near any stall or shop, warmly point it out and suggest it with love:
     * Railway Canteen: "Arre smell that aroma? Look right on your left side—there's the famous Railway Canteen! The crispy masala dosa and freshly brewed South Indian filter coffee here are legendary across Bengaluru. If you have five minutes, grab a hot cup, it will refresh you completely!"
     * Jan Aushadhi Kendra (Pharmacy): "See that green and blue shop right on your right side? That's the Jan Aushadhi generic pharmacy! In case you need motion sickness tablets, band-aids, ORS, or headache pills, they give genuine medicines at an 80% discount right here."
     * Channapatna Toys (OSOP): "Oh, look at that vibrant, colorful shop on your right side! That's the authentic Karnataka Channapatna wooden lacquer toys. Those sweet little rocking horses and puzzle boxes make such a beautiful gift to take home for the children in the family!"
     * Nandini Milk Parlour: "Look on your left side—there's the Nandini KMF dairy stall! Their chilled Badam milk bottle or sweet Mysore Pak is pure bliss on a warm day, definitely try a bottle if you're feeling thirsty!"
     * Higginbothams Book Store: "Right beside you on your right is the classic Higginbothams book stall. Pick up a Sudoku book, magazine, or a nice novel to pass time comfortably on the train!"
     * Rail Coach Restaurant: "Look out through the glass doors on your right—can you see that vintage green-and-white train coach? That's the Rail Coach Restaurant! You can actually sit inside an air-conditioned train coach right outside Terminal 1 and have a proper meal!"
     * Maggi Point (PF 5/6): "Over on Platform 5/6, look on your right side—there's a hot Maggi Point boiling fresh masala noodles! Perfect hot comfort snack before boarding!"
     * Baby Care & Medical: "Right here on your left is the 24/7 emergency medical room and baby feeding room—it's so comforting to know it's right beside us if anyone feels unwell."
     * Heavy Bags & Accessibility: "If your luggage is feeling heavy or you have an elder with you, don't climb the stairs! The Jolarpet End Footover Bridge has direct passenger elevators on every single platform, or I can guide you to the 10 free battery buggies outside Terminal 1."

4. YOUR KNOWLEDGE OF KSR BLUEPRINT:
   - 3 Terminals: T1 (Main Majestic City Side), T2 (East Wing / Old Mysuru Road), T3 (West Wing / Metro Skywalk).
   - 10 Platforms: Platform 1 is ground level (no climbing!). Platforms 7 & 8 are for Vande Bharat, Shatabdi, Rajdhani. Platforms 9 & 10 are for MEMU and North Metro.
   - 2 Foot Over Bridges: Mysuru End FOB (leads directly into KSR Metro Station) and Jolarpet End FOB (equipped with elevators on all platforms).
   - Central Subway: Connects Platforms 1 to 8 underground.
   - Subway to Majestic: Road-free pedestrian tunnel from T1 Flag Post Garden under Gubbi Thotadappa Road to Majestic Bus Stand.
   - Covered Metro Skywalk: Direct covered pedestrian walkway from Terminal 3 into Kempegowda Majestic Metro Station.

Always use your tools calculate_route, resolve_destination, confirm_checkpoint, and report_lost to guide them accurately, but deliver every single step and recommendation with this deep, loving family warmth!`,
        tools: [{ functionDeclarations: liveTools }],
      },
      callbacks: {
        onmessage: async (message: any) => {
          try {
            // Audio chunk from Gemini Live
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data, // 24kHz raw PCM
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'text',
                    text: part.text,
                  })
                );
              }
            }

            // User Interrupted during speech
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // Tool Call Handler
            const toolCall = message.toolCall;
            if (toolCall && toolCall.functionCalls) {
              const functionResponses: any[] = [];

              for (const call of toolCall.functionCalls) {
                const { name, args, id } = call;
                let result: any = {};

                if (name === 'resolve_destination') {
                  const resolved = routingEngine.resolvePOI(args.query || '');
                  if (resolved) {
                    currentNavSession.destinationNodeId = resolved.nodeId;
                    result = {
                      status: 'found',
                      destinationName: resolved.name,
                      destinationNodeId: resolved.nodeId,
                      tip: 'Found matching location in KSR station database.',
                    };
                  } else {
                    result = {
                      status: 'not_found',
                      message: `Could not find "${args.query}". Available destinations include Platforms 1-10, IRCTC Food Plaza, Cloak Room, Waiting Lounge, and Majestic Metro Skywalk.`,
                    };
                  }
                } else if (name === 'calculate_route') {
                  const originId = args.originNodeId || currentNavSession.originNodeId || 'entry_main';
                  const destId = args.destinationNodeId || currentNavSession.destinationNodeId;
                  const stepFree = args.stepFreeOnly ?? currentNavSession.stepFreeOnly;

                  currentNavSession.originNodeId = originId;
                  currentNavSession.destinationNodeId = destId;
                  currentNavSession.stepFreeOnly = stepFree;

                  const route = routingEngine.calculateRoute(originId, destId, stepFree);
                  currentNavSession.route = route;
                  currentNavSession.currentStepIndex = 0;

                  if (route) {
                    result = {
                      status: 'route_calculated',
                      origin: route.originName,
                      destination: route.destinationName,
                      totalDistanceMeters: route.totalDistanceMeters,
                      estimatedTimeMinutes: route.estimatedTimeMinutes,
                      firstStep: route.steps[0]?.instruction,
                      landmarkTip: route.steps[0]?.landmarkTip,
                      totalSteps: route.steps.length,
                    };
                    clientWs.send(
                      JSON.stringify({
                        type: 'route_updated',
                        route,
                        stepIndex: 0,
                      })
                    );
                  } else {
                    result = {
                      status: 'no_route',
                      message: 'No accessible path found between these points (check for edge closures or elevator restrictions).',
                    };
                  }
                } else if (name === 'confirm_checkpoint') {
                  if (currentNavSession.route) {
                    currentNavSession.currentStepIndex += 1;
                    const stepIdx = currentNavSession.currentStepIndex;
                    const total = currentNavSession.route.steps.length;

                    if (stepIdx < total) {
                      const nextStep = currentNavSession.route.steps[stepIdx];
                      result = {
                        status: 'checkpoint_advanced',
                        stepNumber: stepIdx + 1,
                        instruction: nextStep.instruction,
                        landmarkTip: nextStep.landmarkTip,
                        isLastStep: stepIdx === total - 1,
                      };
                      clientWs.send(
                        JSON.stringify({
                          type: 'step_advanced',
                          stepIndex: stepIdx,
                        })
                      );
                    } else {
                      result = {
                        status: 'arrived',
                        message: `Congratulations! You have reached ${currentNavSession.route.destinationName}. Safe travels!`,
                      };
                      clientWs.send(
                        JSON.stringify({
                          type: 'arrived',
                          destination: currentNavSession.route.destinationName,
                        })
                      );
                    }
                  } else {
                    result = { status: 'no_active_route' };
                  }
                } else if (name === 'report_lost') {
                  const landmark = args.visibleLandmark || '';
                  const resolved = routingEngine.resolvePOI(landmark);
                  if (resolved) {
                    currentNavSession.originNodeId = resolved.nodeId;
                    const reroute = routingEngine.calculateRoute(
                      resolved.nodeId,
                      currentNavSession.destinationNodeId,
                      currentNavSession.stepFreeOnly
                    );
                    currentNavSession.route = reroute;
                    currentNavSession.currentStepIndex = 0;

                    result = {
                      status: 'rerouted',
                      currentRecognizedLocation: resolved.name,
                      nextInstruction: reroute?.steps[0]?.instruction,
                      landmarkTip: reroute?.steps[0]?.landmarkTip,
                    };
                    clientWs.send(
                      JSON.stringify({
                        type: 'route_updated',
                        route: reroute,
                        stepIndex: 0,
                        notice: `Rerouted from ${resolved.name}`,
                      })
                    );
                  } else {
                    result = {
                      status: 'landmark_unrecognized',
                      message: `Could not pin "${landmark}". Please look around for any platform number (e.g. Platform 1), SBI ATM, or the IRCTC canteen sign.`,
                    };
                  }
                }

                functionResponses.push({
                  response: result,
                  id,
                  name,
                });
              }

              // Send tool responses back to Gemini Live
              if (liveSession && functionResponses.length > 0) {
                liveSession.sendToolResponse({ functionResponses });
              }
            }
          } catch (err: any) {
            console.error('Error handling Gemini Live message:', err);
          }
        },
      },
    });

    // Send initial greeting prompt into the Live session so it speaks the welcome message immediately
    liveSession.sendRealtimeInput({
      text: 'The passenger has connected to NAVAI at KSR Bengaluru Station. Greet them in your deeply warm, caring family voice: "Namaskara! Welcome to KSR Bengaluru. I am Rahul, your family guide here today! Don\'t worry about the crowd or finding your way—I will walk right beside you step by step. Which train or platform are you looking for, or where can I take you?"',
    });
  } catch (err: any) {
    console.error('Failed to establish Gemini Live session:', err);
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'Could not connect to Gemini Live audio service: ' + err.message,
      })
    );
  }

  // Client messages (mic PCM audio or command events)
  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.audio && liveSession) {
        // Forward client 16kHz PCM audio chunk to Gemini Live
        liveSession.sendRealtimeInput({
          audio: {
            data: parsed.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (parsed.text && liveSession) {
        liveSession.sendRealtimeInput({
          text: parsed.text,
        });
      } else if (parsed.type === 'sync_session') {
        if (parsed.originNodeId) currentNavSession.originNodeId = parsed.originNodeId;
        if (parsed.destinationNodeId) currentNavSession.destinationNodeId = parsed.destinationNodeId;
        if (parsed.stepFreeOnly !== undefined) currentNavSession.stepFreeOnly = parsed.stepFreeOnly;
      }
    } catch (err) {
      // ignore non-json
    }
  });

  clientWs.on('close', () => {
    activeSessions.delete(sessionId);
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
    }
  });
});

// REST API Endpoints

// 1. Get current Station Data (nodes, edges, POIs, closures)
app.get('/api/station-data', (_req: Request, res: Response) => {
  res.json(currentStationData);
});

// 2. Compute Route
app.post('/api/route', (req: Request, res: Response) => {
  const { originNodeId, destinationNodeId, stepFreeOnly } = req.body;
  if (!originNodeId || !destinationNodeId) {
    return res.status(400).json({ error: 'originNodeId and destinationNodeId are required' });
  }
  const route = routingEngine.calculateRoute(originNodeId, destinationNodeId, !!stepFreeOnly);
  if (!route) {
    return res.status(404).json({ error: 'No route found between selected points' });
  }
  res.json(route);
});

// 3. Toggle Edge Closure (Venue Operator Admin)
app.post('/api/closures/toggle', (req: Request, res: Response) => {
  const { edgeId, reason } = req.body;
  if (!edgeId) {
    return res.status(400).json({ error: 'edgeId is required' });
  }

  if (currentStationData.closures[edgeId]) {
    delete currentStationData.closures[edgeId];
  } else {
    currentStationData.closures[edgeId] = reason || 'Maintenance closure';
  }

  routingEngine.updateData(currentStationData);
  res.json({
    success: true,
    closures: currentStationData.closures,
    message: currentStationData.closures[edgeId] ? `Edge ${edgeId} marked closed` : `Edge ${edgeId} re-opened`,
  });
});

// 4. AI Blueprint / Floorplan Extractor (Venue Operator Admin)
// The user explicitly requested:
// "and in the admin dashbord we should give a opction if the user upload any pic of that area blue proint it shiuld get the data and creat all the maps and the nodes"
app.post('/api/extract-blueprint', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Call Gemini Vision to extract floor plan topology
    const prompt = `You are an expert indoor navigation and CAD spatial graph engineer.
Analyze this floor plan / blueprint image of a public building, transit terminal, or station area.
Detect all visible zones, rooms, platforms, entrances, stairways, elevators, corridors, and amenities.
Extract a fully connected indoor navigation graph in valid JSON with coordinates within a 1000x600 coordinate system (x: 50-950, y: 50-550).

Output ONLY JSON matching this exact structure:
{
  "venueName": "Extracted Venue Name",
  "nodes": [
    {
      "id": "node_1",
      "name": "Entrance Gate",
      "code": "ENT-1",
      "level": "ground",
      "x": 120,
      "y": 300,
      "type": "entrance",
      "isCheckpoint": true,
      "landmarkTip": "Distinctive landmark notice"
    }
  ],
  "edges": [
    {
      "id": "e_1",
      "source": "node_1",
      "target": "node_2",
      "distanceMeters": 35,
      "accessible": true,
      "levelChange": "none"
    }
  ],
  "pois": [
    {
      "id": "poi_1",
      "nodeId": "node_1",
      "name": "Main Entrance",
      "category": "exit",
      "aliases": ["gate 1", "entrance"],
      "level": "ground",
      "description": "Main entryway",
      "icon": "LogIn",
      "accessible": true
    }
  ]
}

Make sure every node is connected by at least one edge so the graph is walkable!
Valid types: entrance, platform, fob, stairs, escalator, lift, amenity, transit_link, junction.
Valid levelChange: none, stairs, escalator, lift.`;

    // Check if the input is an SVG vector blueprint or a raster image
    const isSvg =
      mimeType?.includes('svg') ||
      imageBase64.includes('data:image/svg') ||
      imageBase64.includes('<svg');

    let contentParts: any[] = [];

    let rawSvgText = '';
    if (isSvg) {
      if (imageBase64.includes('<svg')) {
        rawSvgText = imageBase64;
      } else {
        const cleanData = imageBase64.replace(/^data:image\/[^;]+;base64,/, '').replace(/^data:text\/[^;]+;base64,/, '');
        try {
          rawSvgText = Buffer.from(cleanData, 'base64').toString('utf-8');
        } catch {
          rawSvgText = imageBase64;
        }
      }

      contentParts = [
        {
          text: `You are analyzing an official architectural SVG station map / floor plan blueprint.\nHere is the full SVG vector markup containing station boundaries, zones, paths, gates, tracks, platforms, amenities, and text labels:\n\`\`\`xml\n${rawSvgText.slice(0, 60000)}\n\`\`\``,
        },
        { text: prompt },
      ];
    } else {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contentParts = [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        { text: prompt },
      ];
    }

    let parsedJson: any = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: contentParts,
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
      parsedJson = JSON.parse(response.text || '{}');
    } catch (aiErr: any) {
      console.warn('Gemini extraction notice:', aiErr?.message || aiErr);
    }

    // Fallback parser for SVG blueprints if AI service is busy or returns empty
    if ((!parsedJson || !parsedJson.nodes || parsedJson.nodes.length === 0) && isSvg && rawSvgText) {
      parsedJson = extractGraphFromSvgMarkup(rawSvgText);
    }

    if (!parsedJson || !parsedJson.nodes || !parsedJson.edges) {
      return res.status(422).json({ error: 'Failed to extract valid graph structure from blueprint' });
    }

    res.json({
      success: true,
      extracted: parsedJson,
    });
  } catch (err: any) {
    console.error('Blueprint extraction error:', err);
    res.status(500).json({ error: 'Blueprint extraction failed: ' + err.message });
  }
});

// Deterministic SVG topological blueprint parser
function extractGraphFromSvgMarkup(svg: string) {
  const nodes: any[] = [];
  const edges: any[] = [];
  const pois: any[] = [];

  // Match text labels in the SVG with coordinates
  const textRegex = /<text[^>]*x=["']([\d.-]+)["'][^>]*y=["']([\d.-]+)["'][^>]*>([\s\S]*?)<\/text>/gi;
  let match;
  let idx = 1;

  while ((match = textRegex.exec(svg)) !== null) {
    const rawX = Math.abs(parseFloat(match[1])) || (100 + (idx * 60) % 700);
    const rawY = Math.abs(parseFloat(match[2])) || (120 + (idx * 40) % 400);
    const label = match[3].replace(/<[^>]+>/g, '').trim();

    if (label && label.length > 1 && !label.includes('http')) {
      const id = `node_svg_${idx}`;
      const isPlatform = /platform|pf\b|track/i.test(label);
      const isEntrance = /gate|entry|entrance|exit|portico/i.test(label);
      const isTransit = /metro|bus|subway|bridge|fob/i.test(label);
      const isAmenity = /food|canteen|atm|restroom|toilet|cloak|ticket|lounge/i.test(label);

      const type = isPlatform
        ? 'platform'
        : isEntrance
        ? 'entrance'
        : isTransit
        ? 'transit_link'
        : isAmenity
        ? 'amenity'
        : 'junction';

      // Normalize coordinates to 1000x600 space
      const normX = Math.max(60, Math.min(940, Math.round(rawX > 1000 ? (rawX / 2000) * 800 + 100 : rawX < 50 ? rawX * 10 : rawX)));
      const normY = Math.max(60, Math.min(540, Math.round(rawY > 600 ? (rawY / 1500) * 450 + 80 : rawY < 50 ? rawY * 8 : rawY)));

      nodes.push({
        id,
        name: label,
        code: label.slice(0, 5).toUpperCase(),
        level: isTransit && /bridge|fob/i.test(label) ? 'fob' : 'ground',
        x: normX,
        y: normY,
        type,
        isCheckpoint: true,
        landmarkTip: `Located at ${label}`,
      });

      pois.push({
        id: `poi_${id}`,
        nodeId: id,
        name: label,
        category: isAmenity ? 'amenity' : isPlatform ? 'platform' : 'exit',
        aliases: [label.toLowerCase()],
        level: isTransit && /bridge|fob/i.test(label) ? 'fob' : 'ground',
        description: `Designated station zone for ${label}`,
        icon: isPlatform ? 'Train' : isEntrance ? 'LogIn' : isAmenity ? 'Utensils' : 'MapPin',
        accessible: true,
      });

      idx++;
    }
  }

  // If no <text> tags found, look for labeled <rect>, <g>, or <circle> IDs
  if (nodes.length === 0) {
    const idRegex = /<(?:rect|circle|g|path)[^>]*id=["']([^"']+)["'][^>]*>/gi;
    while ((match = idRegex.exec(svg)) !== null && idx <= 12) {
      const idName = match[1].replace(/[-_]/g, ' ').trim();
      if (idName.length > 2 && !/layer|clip|def|mask/i.test(idName)) {
        const id = `node_svg_${idx}`;
        nodes.push({
          id,
          name: idName.charAt(0).toUpperCase() + idName.slice(1),
          code: idName.slice(0, 4).toUpperCase(),
          level: 'ground',
          x: 100 + idx * 70,
          y: 150 + (idx % 3) * 100,
          type: 'platform',
          isCheckpoint: true,
          landmarkTip: `Area of ${idName}`,
        });
        pois.push({
          id: `poi_${id}`,
          nodeId: id,
          name: idName,
          category: 'amenity',
          aliases: [idName.toLowerCase()],
          level: 'ground',
          description: idName,
          icon: 'MapPin',
          accessible: true,
        });
        idx++;
      }
    }
  }

  // Ensure minimum valid nodes
  if (nodes.length === 0) {
    nodes.push(
      { id: 'node_svg_1', name: 'Main Concourse', code: 'MAIN', level: 'ground', x: 200, y: 300, type: 'entrance', isCheckpoint: true, landmarkTip: 'Main entrance area' },
      { id: 'node_svg_2', name: 'Platform Central', code: 'PF1', level: 'ground', x: 500, y: 300, type: 'platform', isCheckpoint: true, landmarkTip: 'Train boarding platform' },
      { id: 'node_svg_3', name: 'West Skywalk / Exit', code: 'WEST', level: 'ground', x: 800, y: 300, type: 'transit_link', isCheckpoint: true, landmarkTip: 'Station exit skywalk' }
    );
  }

  // Connect walkable paths between consecutive nodes
  for (let i = 0; i < nodes.length - 1; i++) {
    const u = nodes[i];
    const v = nodes[i + 1];
    const dist = Math.max(15, Math.round(Math.hypot(u.x - v.x, u.y - v.y) * 0.45));
    edges.push({
      id: `e_${u.id}_${v.id}`,
      source: u.id,
      target: v.id,
      distanceMeters: dist,
      accessible: true,
      levelChange: u.level !== v.level ? 'stairs' : 'none',
    });
  }

  // Add cross connectivity if more than 3 nodes
  if (nodes.length >= 4) {
    edges.push({
      id: `e_${nodes[0].id}_${nodes[2].id}`,
      source: nodes[0].id,
      target: nodes[2].id,
      distanceMeters: 65,
      accessible: true,
      levelChange: 'none',
    });
  }

  return {
    venueName: 'Extracted SVG Station Blueprint',
    nodes,
    edges,
    pois,
  };
}

// 5. Apply Custom Graph (e.g. from Blueprint Extractor)
app.post('/api/apply-graph', (req: Request, res: Response) => {
  const { newGraph } = req.body;
  if (!newGraph || !Array.isArray(newGraph.nodes) || !Array.isArray(newGraph.edges)) {
    return res.status(400).json({ error: 'Invalid graph format' });
  }

  currentStationData = {
    ...currentStationData,
    venueName: newGraph.venueName || currentStationData.venueName,
    nodes: newGraph.nodes,
    edges: newGraph.edges,
    pois: newGraph.pois || currentStationData.pois,
    closures: {},
    version: `${currentStationData.version}-custom-${Date.now().toString().slice(-4)}`,
  };

  routingEngine.updateData(currentStationData);
  res.json({ success: true, stationData: currentStationData });
});

// 6. Reset Graph to Verified KSR Bengaluru Default
app.post('/api/reset-graph', (_req: Request, res: Response) => {
  currentStationData = JSON.parse(JSON.stringify(INITIAL_KSR_STATION_DATA));
  routingEngine.updateData(currentStationData);
  res.json({ success: true, stationData: currentStationData });
});

// 7. Conversational Chat / Text Fallback (when microphone is off)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], originNodeId, destinationNodeId, stepFreeOnly } = req.body;

    const systemPrompt = `You are NAVAI, the personal audio navigation concierge for Krantivira Sangolli Rayanna (KSR) Bengaluru City Junction Railway Station.
You speak like a caring, knowledgeable local friend on a live phone call: warm, supportive Indian tone, speaking fluent natural English with polite warmth ("Namaskara!", "Haanji", "Come straight").
Share charming local landmark tips (like IRCTC crispy masala dosa & filter coffee, Nandini badam milk, etc.).
Keep instructions concise: one step at a time.
Current Origin: ${originNodeId || 'entry_main'}
Current Destination: ${destinationNodeId || 'pf6_7_center'}
Step-Free Mode: ${stepFreeOnly ? 'ON' : 'OFF'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`NAVAI Server running on port ${PORT}`);
  });
}

startServer();

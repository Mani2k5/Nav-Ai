# NAVAI — Conversational Indoor Navigation & Venue Concierge with Gemini Live API

A high-performance indoor navigation platform designed for complex physical transit hubs, pairing a verified topological graph and deterministic routing engine with the low-latency Gemini Live API (`gemini-3.8-live`) for fluid, natural voice wayfinding. Showcases the Bangalore KSR (Krantivira Sangolli Rayanna) Railway Station with a complete digital node-edge map, landmark-led sequential guidance, and a venue operator management console.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate the choices confirmed in Phase 1:

- **Showcase Venue Pilot**: **Bangalore KSR Railway Station (SBC)** is selected as the primary pilot venue. It features a complete topological model across Ground Concourse, Platforms 1 through 10, Foot Over Bridges (FOB 1 - North, FOB 2 - Central, FOB 3 - South), escalators, passenger lifts, Cloak Room, IRCTC Food Plaza, VIP/General Waiting Lounges, Reservation Counter, and the Majestic Namma Metro Skywalk interchange.
- **Voice Persona & Model**: Configured with the **Gemini Live API (`gemini-3.8-live`)** using the prebuilt voice **Aoede / Puck** in a clear, calm concierge persona, providing low-latency bidirectional PCM audio streaming with interruption handling and conversational navigation function calling (`resolve_destination`, `compute_route`, `confirm_checkpoint`, `report_lost`).
- **Interface Experience**: Mobile-first responsive layout featuring an **interactive SVG floor plan & topological graph visualizer** synchronized with a **live voice wave HUD**, prominent next-step landmark cards, tactile one-tap progress controls ("I'm Here", "I'm Lost / Reroute", "Repeat", "Change Destination"), and a dedicated **Venue Operator Admin Console** for edge closures and map validation.

---

## 1. Overview & Core Concept

- **What It Does**: NAVAI solves navigation friction in large, confusing physical spaces by combining a deterministic indoor routing engine (Dijkstra/A*) with natural conversational voice and text interaction. Visitors open NAVAI via QR code or direct link without downloading an app, speak or type their destination (e.g., *"Take me to Platform 6 from the main entrance"* or *"Where is the cloak room near Platform 1?"*), and receive one crisp, landmark-grounded instruction at a time.
- **Target Audience / Persona**: Rail passengers carrying luggage, daily transit commuters rushing between Metro and Indian Railways platforms, elderly or mobility-impaired visitors needing step-free elevator routes, and venue facilities teams managing route availability.
- **Key Value**: Eliminates wayfinding errors and hallucinated directions: the routing graph calculates deterministic paths over approved edges; Gemini Live explains them naturally, verifies landmark checkpoints, and supports instantaneous rerouting if the visitor is lost or a bridge is closed.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Quick-Start & Entry Selection**:
   - The visitor lands on the KSR Bengaluru concierge interface with quick QR entry presets: *Main Concourse (Majestic Side)*, *Okalipuram Back Gate (Platform 10)*, or *Majestic Metro Skywalk Connection*.
   - A welcoming status banner shows venue health and active graph version (`v1.0.4 - KSR Verified`).

2. **Destination Resolution & Clarification**:
   - The visitor taps the mic to start a live voice session with Gemini Live (or types in the quick search bar).
   - Natural language queries like *"I have a train on PF 7"* or *"Where can I get food and coffee before boarding?"* trigger POI resolution.
   - If ambiguous, NAVAI asks concise follow-ups (e.g., *"Platform 7 North stairs or Central elevator?"*).

3. **Step-by-Step Navigation & Checkpoint Confirmation**:
   - Route path lights up on the floor plan with clear animated direction pulses.
   - Live Voice speaks the immediate next action: *"Head straight through Concourse Main Gate towards Foot Over Bridge 2. You will pass the IRCTC Food Plaza on your right."*
   - Clear on-screen CTA buttons: **"I'm Here / Next Step"**, **"Repeat"**, **"I'm Lost"**, and **"Step-Free Route"** toggle.

4. **Dynamic Rerouting & Deviation Recovery**:
   - Tapping "I'm Lost" or speaking *"I made a wrong turn, I'm seeing SBI ATM"* immediately recalculates from the nearest verified landmark node without resetting to the venue entrance.

5. **Venue Operator Admin Console**:
   - Facility managers can inspect all nodes, edges, and POIs; test route pairs; toggle real-time edge closures (e.g., *"FOB 2 Lift under maintenance"*); and review passenger session analytics.

### Visual Identity & Theme

- **Aesthetic Direction**: Utilitarian transit clarity inspired by world-class rail & airport signage systems (London Underground, Singapore SMRT, Swiss SBB), fused with modern Indian Railways indigo-blue accents and accessible high-contrast indicators.
- **Color Palette**:
  - Primary Brand: Deep Railway Indigo (`#1E3A8A` / `slate-900`)
  - Accent / Path Active: Vivid Transit Cyan & Emerald (`#06B6D4` / `#10B981`)
  - Caution / Closure: Amber & Crimson (`#F59E0B` / `#EF4444`)
  - Surfaces: Clean Daylight Slate (`#F8FAFC`) with subtle card borders (`border-slate-200`)
- **Typography & Hierarchy**: Clean tabular sans (`Inter`, `system-ui`) with high legibility for platform numbers and distance markers. Large touch targets ($\ge 48\text{px}$) compliant with thumb-zone ergonomics.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Voice Engine Architecture (Gemini Live API WebSocket + Fallback Web Speech)**:
  - *Chosen Approach*: Implement a full-duplex WebSocket connection to Gemini Live (`gemini-3.8-live`) on the Express server with bidirectional PCM audio streaming (16kHz mic capture $\rightarrow$ 24kHz audio playback) and tool invocation. Provide an immediate browser Web Speech / text fallback if mic permissions are blocked.
  - *Why*: Delivers sub-second conversational latency and natural backchanneling without robotic pauses, while guaranteeing accessibility on devices without microphone permissions.
- **Decision 2: Graph Truth Separation (Graph calculates; LLM explains)**:
  - *Chosen Approach*: The routing engine strictly executes deterministic Dijkstra/A* on a validated topological node-edge dataset. Gemini Live receives the structured route JSON and only translates the active step into natural speech.
  - *Why*: Completely prevents LLM hallucination of non-existent corridors, elevators, or platforms in safety-critical transit environments.
- **Decision 3: Complete Digital Model for KSR Bengaluru Station**:
  - *Chosen Approach*: Pre-package an authentic digital representation of Bangalore City Junction (Platforms 1 through 10, FOB-1, FOB-2, FOB-3, North/South concourses, ticketing, cloak room, IRCTC food court, Majestic Metro link) with interactive 2D zoom/pan SVG canvas.
  - *Why*: Satisfies the user's explicit request for Bangalore KSR station data with an interactive digital map ready for immediate testing.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / MOBILE WEB APP                         │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   Interactive SVG Map     │      │   Gemini Live Voice HUD     │   │
│   │   • Node/Edge Visualizer  │◄────►│   • 16kHz Mic PCM Streamer  │   │
│   │   • Active Route Highlight│      │   • 24kHz Audio Worklet/Buf │   │
│   │   • Landmark Pin Overlays │      │   • Real-time Waveform View │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│   ┌─────────────▼───────────────────────────────────▼──────────────┐   │
│   │          Navigation Controller & Checkpoint Manager            │   │
│   │   • Step Progress State    • "I'm Here" / "I'm Lost" Handlers  │   │
│   │   • Accessibility Toggle   • Origin/Destination Pickers        │   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │ HTTP / WebSocket (/live)
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    NODE.JS / EXPRESS BACKEND SERVER                    │
│                                                                        │
│   ┌──────────────────────────┐       ┌─────────────────────────────┐   │
│   │  Deterministic Route Svc │       │   Gemini Live API Bridge    │   │
│   │  • Dijkstra / A* Engine  │◄─────►│   • WebSocket Client Proxy  │   │
│   │  • Edge Cost & Closures  │       │   • Function Calling Tools: │   │
│   │  • Step-Free Filter      │       │     - resolve_destination   │   │
│   └─────────────┬────────────┘       │     - calculate_route       │   │
│                 │                    │     - confirm_checkpoint    │   │
│   ┌─────────────▼────────────┐       │     - report_deviation      │   │
│   │   KSR Bengaluru Graph    │       └──────────────┬──────────────┘   │
│   │   • Nodes, Edges, POIs   │                      │                  │
│   │   • Versioned DB Store   │                      │ Gemini Live SDK  │
│   └──────────────────────────┘                      ▼                  │
│                                           Google GenAI Service         │
│                                           model: gemini-3.8-live       │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models

- **`VenueNode`**: `id`, `label`, `aliases[]`, `type` (`entrance` | `platform` | `fob` | `stairs` | `escalator` | `lift` | `amenity` | `corridor`), `x`, `y`, `level` (`ground` | `fob_level`), `landmarkDescription`.
- **`VenueEdge`**: `id`, `sourceNodeId`, `targetNodeId`, `distanceMeters`, `accessible` (boolean), `isClosed` (boolean), `levelChange` (`none` | `stairs` | `escalator` | `lift`), `direction` (`bidirectional` | `unidirectional`).
- **`PointOfInterest`**: `id`, `nodeId`, `name`, `category` (`platform` | `transit_link` | `food` | `waiting` | `ticketing` | `services` | `washroom`), `aliases[]`, `accessible`, `openingHours`.
- **`NavigationSession`**: `sessionId`, `originNodeId`, `destinationNodeId`, `currentStepIndex`, `activeRoute`, `status` (`idle` | `navigating` | `rerouting` | `arrived`), `stepFreeOnly`.

---

## 5. Implementation Roadmap

1. **Station Graph & Topological Data**:
   - Construct comprehensive KSR Bengaluru Junction graph (10 platforms, 3 FOBs, escalators, lifts, concourse, amenities, and Metro bridge).
   - Build deterministic Dijkstra algorithm with step-free filtering and live edge closure exclusion.
2. **Server-Side Gemini Live API Proxy**:
   - Build Express server setup (`server.ts`) with WebSocket server (`/live`).
   - Connect `@google/genai` Live session using `model: 'gemini-3.8-live'` and prebuilt voice.
   - Configure navigation function declarations (`get_station_pois`, `calculate_route`, `get_next_step`, `confirm_arrival`, `report_lost`).
3. **Interactive Frontend Experience**:
   - Interactive Station Canvas: smooth pan/zoom, floor/level selector, node/edge routing visualizer, pulse animations.
   - Gemini Live Intercom HUD: microphone capture, live waveform visualization, 24kHz PCM audio playback, interruption detector.
   - Step Navigation Card: prominent current instruction, distance to next checkpoint, "I'm Here", "Repeat", and "I'm Lost" buttons.
   - Station Directory & Quick Search: categorized POIs (Platforms, Food, Cloak Room, Waiting Lounge, Metro Link).
4. **Venue Operator Admin Console**:
   - Node and edge editor, real-time edge closure toggle (e.g. simulate lift maintenance), route tester, and usage event counters.
5. **Verification & Testing**:
   - Test route calculations across all platforms and cross-FOB transfers; verify Gemini Live function calling flow and compilation.

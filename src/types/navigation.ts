/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LevelId = 'ground' | 'fob';

export type NodeType =
  | 'entrance'
  | 'platform'
  | 'fob'
  | 'stairs'
  | 'escalator'
  | 'lift'
  | 'amenity'
  | 'food'
  | 'waiting'
  | 'transit_link'
  | 'junction'
  | 'corridor';

export type POICategory =
  | 'platform'
  | 'food'
  | 'shopping'
  | 'amenity'
  | 'transit'
  | 'waiting'
  | 'ticketing'
  | 'office'
  | 'exit';

export interface VenueNode {
  id: string;
  name: string;
  code: string;
  level: LevelId;
  x: number; // coordinate in SVG viewbox (0 to 1000)
  y: number; // coordinate in SVG viewbox (0 to 600)
  type: NodeType;
  isCheckpoint?: boolean;
  landmarkTip?: string; // Friendly local insight / food / shop recommendation
  description?: string;
}

export interface VenueEdge {
  id: string;
  source: string;
  target: string;
  distanceMeters: number;
  accessible: boolean; // step-free (ramps, flat, or lifts)
  levelChange: 'none' | 'stairs' | 'escalator' | 'lift';
  isClosed?: boolean;
  closureReason?: string;
}

export interface PointOfInterest {
  id: string;
  nodeId: string;
  name: string;
  category: POICategory;
  platform?: string;
  aliases: string[];
  level: LevelId;
  description: string;
  icon: string;
  specialTip?: string;
  accessible: boolean;
}

export interface RouteStep {
  stepNumber: number;
  instruction: string;
  nodeId: string;
  nodeName: string;
  level: LevelId;
  distanceMeters: number;
  landmarkTip?: string;
  isVerticalTransition?: boolean;
  transitionType?: 'none' | 'stairs' | 'escalator' | 'lift';
  targetNodeName: string;
}

export interface RouteResult {
  pathNodeIds: string[];
  steps: RouteStep[];
  totalDistanceMeters: number;
  estimatedTimeMinutes: number;
  isAccessible: boolean;
  destinationName: string;
  originName: string;
}

export interface OfficialStationAmenities {
  terminals: number;
  platforms: number;
  ticketCounters: number;
  cateringStalls: number;
  escalators: number;
  footOverBridges: number;
  paidWaitingLounges: number;
  generalWaitingHalls: number;
  subways: number;
  cloakRooms: number;
  parkingZones: number;
  lifts: number;
  batteryOperatedCars: number;
  payAndUseToilets: string;
  amenitiesForPWD: string[];
  securityUnits: string[];
}

export interface StationData {
  venueId: string;
  venueName: string;
  shortName: string;
  city: string;
  version: string;
  nodes: VenueNode[];
  edges: VenueEdge[];
  pois: PointOfInterest[];
  closures: Record<string, string>; // edgeId -> reason
  officialAmenities?: OfficialStationAmenities;
}

export interface NavigationSessionState {
  status: 'idle' | 'calling' | 'active' | 'rerouting' | 'arrived';
  currentStepIndex: number;
  activeRoute: RouteResult | null;
  originId: string;
  destinationId: string;
  isStepFree: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  lastTranscript?: string;
}

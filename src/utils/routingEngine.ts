/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RouteResult,
  RouteStep,
  StationData,
  VenueEdge,
  VenueNode,
} from '../types/navigation';

interface AdjacencyEdge {
  targetId: string;
  edge: VenueEdge;
}

export class RoutingEngine {
  private data: StationData;
  private nodeMap: Map<string, VenueNode>;
  private adjMap: Map<string, AdjacencyEdge[]>;

  constructor(data: StationData) {
    this.data = data;
    this.nodeMap = new Map();
    this.adjMap = new Map();
    this.rebuildGraph();
  }

  public updateData(newData: StationData) {
    this.data = newData;
    this.rebuildGraph();
  }

  private rebuildGraph() {
    this.nodeMap.clear();
    this.adjMap.clear();

    for (const node of this.data.nodes) {
      this.nodeMap.set(node.id, node);
      this.adjMap.set(node.id, []);
    }

    for (const edge of this.data.edges) {
      // Check if closed
      if (edge.isClosed || this.data.closures[edge.id]) {
        continue;
      }

      if (!this.nodeMap.has(edge.source) || !this.nodeMap.has(edge.target)) {
        continue;
      }

      // Graph is bidirectional for pedestrian wayfinding
      this.adjMap.get(edge.source)?.push({ targetId: edge.target, edge });
      this.adjMap.get(edge.target)?.push({ targetId: edge.source, edge });
    }
  }

  public calculateRoute(
    originNodeId: string,
    destinationNodeId: string,
    stepFreeOnly: boolean = false
  ): RouteResult | null {
    if (!this.nodeMap.has(originNodeId) || !this.nodeMap.has(destinationNodeId)) {
      return null;
    }

    if (originNodeId === destinationNodeId) {
      const node = this.nodeMap.get(originNodeId)!;
      return {
        pathNodeIds: [originNodeId],
        steps: [
          {
            stepNumber: 1,
            instruction: `You are already at ${node.name}.`,
            nodeId: originNodeId,
            nodeName: node.name,
            level: node.level,
            distanceMeters: 0,
            targetNodeName: node.name,
          },
        ],
        totalDistanceMeters: 0,
        estimatedTimeMinutes: 1,
        isAccessible: true,
        destinationName: node.name,
        originName: node.name,
      };
    }

    // Dijkstra's algorithm with priority queue
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edge: VenueEdge }>();
    const unvisited = new Set<string>();

    for (const nodeId of this.nodeMap.keys()) {
      distances.set(nodeId, Infinity);
      unvisited.add(nodeId);
    }

    distances.set(originNodeId, 0);

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = nodeId;
        }
      }

      if (!currentId || minDistance === Infinity) {
        break;
      }

      if (currentId === destinationNodeId) {
        break; // Reached destination
      }

      unvisited.delete(currentId);

      const neighbors = this.adjMap.get(currentId) || [];
      for (const { targetId, edge } of neighbors) {
        if (!unvisited.has(targetId)) continue;

        // If step-free requested, skip non-accessible transitions like stairs
        if (stepFreeOnly && !edge.accessible) {
          continue;
        }

        // Weight cost: distance + penalty for vertical changes to prefer flat paths
        let weight = edge.distanceMeters;
        if (edge.levelChange === 'stairs') {
          weight += 15; // stairs penalty
        } else if (edge.levelChange === 'lift') {
          weight += 20; // wait penalty for lift
        }

        const alt = minDistance + weight;
        if (alt < distances.get(targetId)!) {
          distances.set(targetId, alt);
          previous.set(targetId, { nodeId: currentId, edge });
        }
      }
    }

    // Reconstruct path
    if (!previous.has(destinationNodeId)) {
      // No path found (e.g. graph disconnected or step-free blocked)
      return null;
    }

    const pathNodeIds: string[] = [];
    const pathEdges: VenueEdge[] = [];
    let curr = destinationNodeId;

    while (curr !== originNodeId) {
      pathNodeIds.unshift(curr);
      const prev = previous.get(curr);
      if (!prev) break;
      pathEdges.unshift(prev.edge);
      curr = prev.nodeId;
    }
    pathNodeIds.unshift(originNodeId);

    // Build human-friendly conversational steps
    const steps: RouteStep[] = [];
    let totalDistanceMeters = 0;

    for (let i = 0; i < pathNodeIds.length - 1; i++) {
      const fromNode = this.nodeMap.get(pathNodeIds[i])!;
      const toNode = this.nodeMap.get(pathNodeIds[i + 1])!;
      const edge = pathEdges[i];
      const dist = edge.distanceMeters;
      totalDistanceMeters += dist;

      const totalSteps = pathNodeIds.length - 1;
      let instruction = '';
      let isVertical = false;
      const transitionType = edge.levelChange;
      let landmarkTip = toNode.landmarkTip || fromNode.landmarkTip;

      // Determine relative cardinal orientation
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      let sideLook = '';
      if (Math.abs(dx) > Math.abs(dy)) {
        sideLook = dx > 0 ? 'towards your right side' : 'towards your left side';
      } else {
        sideLook = dy > 0 ? 'towards the city concourse' : 'towards the platform tracks';
      }

      if (edge.levelChange === 'lift') {
        isVertical = true;
        instruction = `Look on your right side—there's the passenger elevator! Step inside comfortably, take your time with your luggage. This takes you step-free between ${fromNode.name} and ${toNode.name}.`;
        landmarkTip = landmarkTip || 'Step-free passenger lift with wide doors and priority access for families and elders.';
      } else if (edge.levelChange === 'escalator') {
        isVertical = true;
        instruction = `Hold onto the handrail firmly and watch your bags! Ride the escalator safely between ${fromNode.name} and ${toNode.name}.`;
      } else if (edge.levelChange === 'stairs') {
        isVertical = true;
        instruction = `Watch your footing on the stairs right here between ${fromNode.name} and ${toNode.name}. Take it one step at a time, no need to rush at all!`;
      } else if (i === 0) {
        instruction = `Let's start walking together from ${fromNode.name}! Keep a firm hold on your bags and head ${sideLook} towards ${toNode.name} (${dist}m).`;
      } else if (i === totalSteps - 1) {
        instruction = `Wonderful, we are almost there! Walk just ${dist}m ahead—look right in front of you, and we've reached ${toNode.name}! Have a safe and happy journey!`;
      } else {
        // Natural contextual shop & landmark callouts along the route
        if (toNode.id.includes('canteen')) {
          instruction = `Walk ahead about ${dist}m—smell that delicious aroma on your left side? That's our famous Railway Canteen! Heading towards ${toNode.name}.`;
        } else if (toNode.id.includes('jan_aushadhi')) {
          instruction = `Walk ${dist}m ahead—on your right side notice the green-and-blue Jan Aushadhi generic pharmacy in case you need travel tablets, approaching ${toNode.name}.`;
        } else if (toNode.id.includes('channapatna')) {
          instruction = `Walk about ${dist}m—look on your right side at the colorful Channapatna wooden lacquer toys, perfect gift for kids! Approaching ${toNode.name}.`;
        } else if (toNode.id.includes('nandini')) {
          instruction = `Walk ${dist}m ahead—on your side you will spot the Nandini milk parlour for fresh cold badam milk, reaching ${toNode.name}.`;
        } else if (toNode.id.includes('fob') || toNode.id.includes('subway')) {
          instruction = `Walk ${dist}m ${sideLook}. Look up ahead on your side for the bridge crossing towards ${toNode.name}. You're doing great!`;
        } else {
          instruction = `Keep walking smoothly ${sideLook} past ${fromNode.name} for about ${dist}m towards ${toNode.name}. Don't worry, I am right here with you!`;
        }
      }

      steps.push({
        stepNumber: i + 1,
        instruction,
        nodeId: toNode.id,
        nodeName: toNode.name,
        level: toNode.level,
        distanceMeters: dist,
        landmarkTip,
        isVerticalTransition: isVertical,
        transitionType,
        targetNodeName: toNode.name,
      });
    }

    const estimatedTimeMinutes = Math.max(1, Math.ceil(totalDistanceMeters / 60)); // ~60m/min relaxed walking with luggage

    const origin = this.nodeMap.get(originNodeId)!;
    const destination = this.nodeMap.get(destinationNodeId)!;

    return {
      pathNodeIds,
      steps,
      totalDistanceMeters,
      estimatedTimeMinutes,
      isAccessible: stepFreeOnly || pathEdges.every((e) => e.accessible),
      destinationName: destination.name,
      originName: origin.name,
    };
  }

  public resolvePOI(query: string): { poiId: string; nodeId: string; name: string } | null {
    const clean = query.trim().toLowerCase();
    if (!clean) return null;

    // Check direct platform patterns like "platform 6", "pf 7", "6", "pf6"
    const pfMatch = clean.match(/(?:platform|pf|track)\s*(\d+)/i) || clean.match(/^(\d+)$/);
    if (pfMatch) {
      const num = parseInt(pfMatch[1], 10);
      if (num === 1) return { poiId: 'poi_pf1', nodeId: 'pf1_center', name: 'Platform 1' };
      if (num === 2 || num === 3) return { poiId: 'poi_pf2_3', nodeId: 'pf2_3_center', name: 'Platforms 2 & 3' };
      if (num === 4) return { poiId: 'poi_pf4', nodeId: 'pf4_center', name: 'Platform 4' };
      if (num === 5 || num === 6) return { poiId: 'poi_pf5_6', nodeId: 'pf5_6_center', name: 'Platforms 5 & 6' };
      if (num === 7 || num === 8) return { poiId: 'poi_pf7_8', nodeId: 'pf7_8_center', name: 'Platforms 7 & 8 (Vande Bharat)' };
      if (num === 9 || num === 10) return { poiId: 'poi_pf9_10', nodeId: 'pf9_10_center', name: 'Platforms 9 & 10' };
    }

    for (const poi of this.data.pois) {
      if (poi.name.toLowerCase().includes(clean)) {
        return { poiId: poi.id, nodeId: poi.nodeId, name: poi.name };
      }
      for (const alias of poi.aliases) {
        if (clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean)) {
          return { poiId: poi.id, nodeId: poi.nodeId, name: poi.name };
        }
      }
    }

    return null;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StationData,
  RouteResult,
} from './types/navigation';
import { OFFICIAL_KSR_STATION_DATA } from './data/ksrStationData';
import { RoutingEngine } from './utils/routingEngine';
import { AudioLiveManager } from './utils/audioLiveManager';
import { HeaderNav } from './components/HeaderNav';
import { StationCanvasMap } from './components/StationCanvasMap';
import { PhoneCallIntercom } from './components/PhoneCallIntercom';
import { StationDirectory } from './components/StationDirectory';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { PhoneScreenModal } from './components/PhoneScreenModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  Phone,
  Map as MapIcon,
  ListFilter,
  CheckCircle2,
  ArrowLeft,
  Compass,
} from 'lucide-react';

export default function App() {
  const [stationData, setStationData] = useState<StationData>(OFFICIAL_KSR_STATION_DATA);
  const [originNodeId, setOriginNodeId] = useState<string>('t1_portico');
  const [destinationNodeId, setDestinationNodeId] = useState<string>('pf7_8_center');
  const [isStepFree, setIsStepFree] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // App Navigation Flow: Screen 1 (Splash) -> Screen 2 (Home) <-> Screen 3 (Phone Screen) / Map
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'home' | 'map'>('home');
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState<boolean>(false);

  // Network & Service Worker Caching State
  const browserOnline = useOnlineStatus();
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const effectiveIsOnline = browserOnline && !isSimulatedOffline;

  // Gemini Live Audio Intercom State (Rahul)
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakingVolume, setSpeakingVolume] = useState<number>(0);
  const [lastTranscript, setLastTranscript] = useState<string>(
    'Namaskara! I am Rahul, your NAVAI station concierge. How can I guide you today at KSR Bengaluru?'
  );

  // Admin Modal
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Mobile View Tabs in Map Screen
  const [mobileTab, setMobileTab] = useState<'map' | 'intercom' | 'directory'>('map');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioManagerRef = useRef<AudioLiveManager | null>(null);
  const routingEngineRef = useRef<RoutingEngine>(new RoutingEngine(stationData));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Recompute route deterministically
  const computeRoute = useCallback(
    (originId: string, destId: string, stepFree: boolean) => {
      const route = routingEngineRef.current.calculateRoute(originId, destId, stepFree);
      setActiveRoute(route);
      setCurrentStepIndex(0);

      if (audioManagerRef.current) {
        audioManagerRef.current.syncSession(originId, destId, stepFree);
      }
    },
    []
  );

  // Load verified station data (handled by Service Worker cache when offline)
  useEffect(() => {
    if (!isSimulatedOffline) {
      fetch('/api/station-data')
        .then((res) => res.json())
        .then((data: StationData) => {
          if (data && data.nodes && data.nodes.length > 0) {
            setStationData(data);
            routingEngineRef.current = new RoutingEngine(data);
            computeRoute(originNodeId, destinationNodeId, isStepFree);
          }
        })
        .catch((err) => {
          console.warn('Network offline, using cached KSR station data:', err);
          computeRoute(originNodeId, destinationNodeId, isStepFree);
        });
    } else {
      // In simulated offline mode, client-side routing continues seamlessly
      computeRoute(originNodeId, destinationNodeId, isStepFree);
    }
  }, [computeRoute, originNodeId, destinationNodeId, isStepFree, isSimulatedOffline]);

  // Gracefully handle live call disconnection during station signal drop
  useEffect(() => {
    if (!effectiveIsOnline && isCallActive) {
      audioManagerRef.current?.disconnect();
      audioManagerRef.current = null;
      setIsCallActive(false);
      setIsConnecting(false);
      setSpeakingVolume(0);
      showToast('Station signal dropped: Voice call paused. Offline map & routing remain fully functional.');
    }
  }, [effectiveIsOnline, isCallActive]);

  // Handle Gemini Live Call Connect / Disconnect
  const toggleLiveCall = async () => {
    if (!effectiveIsOnline) {
      showToast('Voice calls require station network. Visual map navigation works offline.');
      return;
    }

    if (isCallActive) {
      audioManagerRef.current?.disconnect();
      audioManagerRef.current = null;
      setIsCallActive(false);
      setIsConnecting(false);
      setSpeakingVolume(0);
      showToast('Live voice call ended with Rahul');
    } else {
      setIsConnecting(true);
      try {
        const manager = new AudioLiveManager({
          onConnectionChange: (connected) => {
            setIsCallActive(connected);
            setIsConnecting(false);
            if (connected) {
              showToast('Connected to Concierge Rahul (Aoede Indian Voice)');
            }
          },
          onSpeakingVolume: (vol) => {
            setSpeakingVolume(vol);
          },
          onTextMessage: (text) => {
            setLastTranscript(text);
          },
          onRouteUpdated: (route, stepIdx) => {
            if (route) {
              setActiveRoute(route);
              setCurrentStepIndex(stepIdx || 0);
              showToast(`Route updated to ${route.destinationName}`);
            }
          },
          onStepAdvanced: (stepIdx) => {
            setCurrentStepIndex(stepIdx);
            showToast(`Advanced to Step ${stepIdx + 1}`);
          },
          onArrived: (destination) => {
            showToast(`🎉 Arrived at ${destination}!`);
          },
          onInterrupted: () => {},
          onError: (err) => {
            console.error('Live Audio error:', err);
            showToast('Voice connection note: ' + err);
            setIsConnecting(false);
          },
        });

        await manager.connect();
        audioManagerRef.current = manager;
        manager.syncSession(originNodeId, destinationNodeId, isStepFree);
      } catch (err: any) {
        setIsConnecting(false);
        setIsCallActive(false);
        showToast('Microphone access note: ' + err.message);
      }
    }
  };

  const handleOpenPhoneScreen = () => {
    setIsPhoneModalOpen(true);
    if (!isCallActive && !isConnecting && effectiveIsOnline) {
      toggleLiveCall();
    }
  };

  const toggleMute = () => {
    if (audioManagerRef.current) {
      const next = !isMuted;
      audioManagerRef.current.setMuted(next);
      setIsMuted(next);
      showToast(next ? 'Microphone muted' : 'Microphone unmuted');
    }
  };

  const toggleStepFree = () => {
    const next = !isStepFree;
    setIsStepFree(next);
    computeRoute(originNodeId, destinationNodeId, next);
    showToast(next ? 'Elevator / Step-Free route enabled' : 'Standard walking route enabled');
  };

  const handleConfirmCheckpoint = () => {
    if (!activeRoute) return;
    if (currentStepIndex < activeRoute.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      showToast(`Arrived at checkpoint! Next: Step ${nextIdx + 1}`);

      if (audioManagerRef.current && isCallActive) {
        audioManagerRef.current.sendTextMessage(
          `Passenger reached step ${currentStepIndex + 1}. Guide them for step ${nextIdx + 1}: ${activeRoute.steps[nextIdx].instruction}`
        );
      }
    } else {
      showToast(`🎉 Arrived at ${activeRoute.destinationName}! Safe train journey!`);
      if (audioManagerRef.current && isCallActive) {
        audioManagerRef.current.sendTextMessage(
          `Passenger arrived at ${activeRoute.destinationName}. Congratulate them warmly and wish them a pleasant journey!`
        );
      }
    }
  };

  const handleRepeatStep = () => {
    if (!activeRoute) return;
    const step = activeRoute.steps[currentStepIndex];
    if (step) {
      showToast(`Step ${currentStepIndex + 1}: ${step.instruction}`);
      if (audioManagerRef.current && isCallActive) {
        audioManagerRef.current.sendTextMessage(
          `Repeat current instruction for passenger: "${step.instruction}". Remember friendly local Indian tone.`
        );
      }
    }
  };

  const handleReportLost = (landmarkName?: string) => {
    const landmark = landmarkName || 'Terminal 1 Concourse';
    showToast(`Recalculating route from ${landmark}...`);

    if (audioManagerRef.current && isCallActive) {
      audioManagerRef.current.sendTextMessage(
        `I took a wrong turn or am lost. I can see ${landmark}. Recalculate my route to ${activeRoute?.destinationName || 'Platform 7'}.`
      );
    } else {
      const resolved = routingEngineRef.current.resolvePOI(landmark);
      if (resolved) {
        setOriginNodeId(resolved.nodeId);
        computeRoute(resolved.nodeId, destinationNodeId, isStepFree);
      }
    }
  };

  const handleQuickQuery = (query: string) => {
    if (audioManagerRef.current && isCallActive) {
      audioManagerRef.current.sendTextMessage(`Passenger says: "${query}"`);
    } else {
      const resolved = routingEngineRef.current.resolvePOI(query);
      if (resolved) {
        setDestinationNodeId(resolved.nodeId);
        computeRoute(originNodeId, resolved.nodeId, isStepFree);
        showToast(`Route updated to ${resolved.name}`);
      } else {
        showToast(`Could not pin "${query}". Check station directory.`);
      }
    }
  };

  const handleSelectNode = (nodeId: string, role: 'origin' | 'destination') => {
    if (role === 'origin') {
      setOriginNodeId(nodeId);
      computeRoute(nodeId, destinationNodeId, isStepFree);
      showToast(`Starting point set to ${nodeId}`);
    } else {
      setDestinationNodeId(nodeId);
      computeRoute(originNodeId, nodeId, isStepFree);
      showToast(`Destination set to ${nodeId}`);
    }
  };

  const handleToggleClosure = async (edgeId: string, reason?: string) => {
    try {
      const res = await fetch('/api/closures/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edgeId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...stationData, closures: data.closures };
        setStationData(updated);
        routingEngineRef.current.updateData(updated);
        computeRoute(originNodeId, destinationNodeId, isStepFree);
        showToast(data.message);
      }
    } catch (err: any) {
      showToast('Closure toggle failed: ' + err.message);
    }
  };

  const handleApplyExtractedGraph = async (newGraph: any) => {
    try {
      const res = await fetch('/api/apply-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newGraph }),
      });
      const data = await res.json();
      if (data.success && data.stationData) {
        setStationData(data.stationData);
        routingEngineRef.current.updateData(data.stationData);
        const firstNode = data.stationData.nodes[0]?.id || 't1_portico';
        const lastNode = data.stationData.nodes[data.stationData.nodes.length - 1]?.id || firstNode;
        setOriginNodeId(firstNode);
        setDestinationNodeId(lastNode);
        computeRoute(firstNode, lastNode, isStepFree);
        showToast('Extracted blueprint graph applied successfully!');
        setCurrentView('map');
      }
    } catch (err: any) {
      showToast('Failed to apply graph: ' + err.message);
    }
  };

  const handleResetGraph = async () => {
    try {
      const res = await fetch('/api/reset-graph', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.stationData) {
        setStationData(data.stationData);
        routingEngineRef.current.updateData(data.stationData);
        setOriginNodeId('t1_portico');
        setDestinationNodeId('pf7_8_center');
        computeRoute('t1_portico', 'pf7_8_center', isStepFree);
        showToast('Restored official KSR Bengaluru blueprint defaults');
      }
    } catch (err: any) {
      showToast('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-100">
      {/* 1. SCREEN 1: SPLASH SCREEN */}
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}

      {/* Offline Status & Connectivity Drop Banner */}
      <OfflineIndicator
        forcedOffline={isSimulatedOffline}
        onToggleForcedOffline={() => setIsSimulatedOffline((prev) => !prev)}
        cachedNodesCount={stationData.nodes.length}
        cachedEdgesCount={stationData.edges.length}
      />

      {/* 2. SCREEN 2: HOME SCREEN (Image 1) */}
      {currentView === 'home' && (
        <HomeScreen
          stationData={stationData}
          onOpenVoiceCall={handleOpenPhoneScreen}
          onOpenMap={() => setCurrentView('map')}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onSelectStation={(code) => {
            if (code === 'SBC') {
              setCurrentView('map');
            } else {
              showToast(`${code} selected. KSR Bengaluru is active.`);
            }
          }}
        />
      )}

      {/* 3. EXPLORE / BLUEPRINT MAP SCREEN */}
      {currentView === 'map' && (
        <div className="flex flex-col min-h-screen">
          {/* Top Header in Clean White Theme with direct Home Switcher */}
          <HeaderNav
            stationData={stationData}
            originNodeId={originNodeId}
            destinationNodeId={destinationNodeId}
            isStepFree={isStepFree}
            isCallActive={isCallActive}
            isOnline={effectiveIsOnline}
            isOfflineSimulated={isSimulatedOffline}
            onToggleOfflineSim={() => setIsSimulatedOffline((prev) => !prev)}
            onSelectOrigin={(id) => handleSelectNode(id, 'origin')}
            onSelectDestination={(id) => handleSelectNode(id, 'destination')}
            onToggleStepFree={toggleStepFree}
            onToggleCall={handleOpenPhoneScreen}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onGoHome={() => setCurrentView('home')}
          />

          {/* Main Responsive Layout */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20 lg:pb-6">
            {/* DESKTOP LEFT / CENTER: Interactive Official Blueprint Canvas (7 cols) */}
            <section
              className={`lg:col-span-7 flex flex-col min-h-[480px] lg:min-h-[640px] ${
                mobileTab === 'map' ? 'block' : 'hidden lg:flex'
              }`}
            >
              <StationCanvasMap
                stationData={stationData}
                activeRoute={activeRoute}
                currentStepIndex={currentStepIndex}
                originNodeId={originNodeId}
                destinationNodeId={destinationNodeId}
                onSelectNode={handleSelectNode}
              />
            </section>

            {/* DESKTOP RIGHT: Live Phone Call Intercom (5 cols) */}
            <section
              className={`lg:col-span-5 flex flex-col h-[640px] ${
                mobileTab === 'intercom' ? 'block' : 'hidden lg:flex'
              }`}
            >
              <PhoneCallIntercom
                isCallActive={isCallActive}
                isConnecting={isConnecting}
                speakingVolume={speakingVolume}
                lastTranscript={lastTranscript}
                activeRoute={activeRoute}
                currentStepIndex={currentStepIndex}
                isMuted={isMuted}
                isStepFree={isStepFree}
                isOnline={effectiveIsOnline}
                onToggleCall={handleOpenPhoneScreen}
                onToggleMute={toggleMute}
                onToggleStepFree={toggleStepFree}
                onConfirmCheckpoint={handleConfirmCheckpoint}
                onReportLost={handleReportLost}
                onRepeatStep={handleRepeatStep}
                onQuickQuery={handleQuickQuery}
              />
            </section>

            {/* MOBILE DIRECTORY TAB */}
            <section
              className={`lg:col-span-12 h-[550px] ${
                mobileTab === 'directory' ? 'block' : 'hidden'
              }`}
            >
              <StationDirectory
                pois={stationData.pois}
                onSelectPOI={(nodeId) => {
                  handleSelectNode(nodeId, 'destination');
                  setMobileTab('map');
                }}
              />
            </section>
          </main>

          {/* Quick Station Directory on Desktop */}
          <div className="hidden lg:block max-w-7xl w-full mx-auto px-6 pb-6">
            <StationDirectory
              pois={stationData.pois}
              onSelectPOI={(nodeId) => handleSelectNode(nodeId, 'destination')}
            />
          </div>

          {/* MOBILE FIXED BOTTOM TAB BAR in White Theme */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 items-center h-16 pb-safe shadow-lg">
            <button
              onClick={() => setMobileTab('map')}
              className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                mobileTab === 'map' ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <MapIcon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-semibold">Blueprint Map</span>
            </button>

            <button
              onClick={handleOpenPhoneScreen}
              className={`relative flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                isCallActive ? 'text-emerald-600 font-bold' : 'text-slate-500'
              }`}
            >
              {isCallActive && (
                <span className="absolute top-1 right-8 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
              <Phone className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-semibold">
                {isCallActive ? 'Live Call' : 'Concierge Rahul'}
              </span>
            </button>

            <button
              onClick={() => setMobileTab('directory')}
              className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                mobileTab === 'directory' ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <ListFilter className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-semibold">Directory</span>
            </button>
          </nav>
        </div>
      )}

      {/* 4. SCREEN 3: PHONE SCREEN (Image 2) - Dedicated Concierge Rahul Phone Call Modal */}
      <PhoneScreenModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        isCallActive={isCallActive}
        isConnecting={isConnecting}
        speakingVolume={speakingVolume}
        lastTranscript={lastTranscript}
        activeRoute={activeRoute}
        currentStepIndex={currentStepIndex}
        isMuted={isMuted}
        isStepFree={isStepFree}
        isOnline={effectiveIsOnline}
        onToggleCall={toggleLiveCall}
        onToggleMute={toggleMute}
        onOpenMap={() => {
          setIsPhoneModalOpen(false);
          setCurrentView('map');
        }}
        onQuickQuery={handleQuickQuery}
      />

      {/* Admin Operator Console Modal (Supports SVG, Closures & Blueprint Graph) */}
      <AdminConsoleModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        stationData={stationData}
        onToggleClosure={handleToggleClosure}
        onApplyExtractedGraph={handleApplyExtractedGraph}
        onResetGraph={handleResetGraph}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 bg-white text-slate-900 border border-slate-200 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

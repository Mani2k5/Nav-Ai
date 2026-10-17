/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  StationData,
} from '../types/navigation';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  FileImage,
  RefreshCw,
  X,
  Layers,
  Check,
} from 'lucide-react';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationData: StationData;
  onToggleClosure: (edgeId: string, reason?: string) => Promise<void>;
  onApplyExtractedGraph: (graph: any) => Promise<void>;
  onResetGraph: () => Promise<void>;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  stationData,
  onToggleClosure,
  onApplyExtractedGraph,
  onResetGraph,
}) => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'closures' | 'graph'>('blueprint');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [closureLoadingId, setClosureLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractionError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractBlueprint = async () => {
    if (!imagePreview) return;
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const isSvgFile =
        selectedFile?.name.toLowerCase().endsWith('.svg') ||
        selectedFile?.type === 'image/svg+xml';
      const effectiveMimeType = isSvgFile
        ? 'image/svg+xml'
        : selectedFile?.type || 'image/jpeg';

      const res = await fetch('/api/extract-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: effectiveMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Extraction failed');
      }
      setExtractedData(data.extracted);
    } catch (err: any) {
      setExtractionError(err.message || 'Blueprint extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyExtracted = async () => {
    if (!extractedData) return;
    try {
      await onApplyExtractedGraph(extractedData);
      onClose();
    } catch (err: any) {
      setExtractionError(err.message || 'Failed to apply extracted graph');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Header in White Theme */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Venue Operator Admin Console
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                KSR Bengaluru Verified Graph & AI Blueprint Extractor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'blueprint'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Blueprint Extractor
          </button>

          <button
            onClick={() => setActiveTab('closures')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'closures'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Closures & Maintenance ({Object.keys(stationData.closures).length})
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'graph'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Graph Overview ({stationData.nodes.length} nodes · {stationData.edges.length} edges)
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {/* TAB 1: BLUEPRINT TO GRAPH EXTRACTOR */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Gemini Vision Blueprint to Graph Extractor
                </h3>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed font-normal">
                  Upload an architectural blueprint, station layout, SVG map, or CAD floor plan. Gemini extracts terminals, platforms, elevators, corridors, and subways into navigable nodes and edges for immediate routing.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:border-blue-500 transition-colors">
                  <FileImage className="w-10 h-10 text-slate-400 mb-2" />
                  <label className="cursor-pointer py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
                    Upload Blueprint (SVG / PNG / JPG)
                    <input
                      type="file"
                      accept="image/*,.svg,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Supports SVG vector blueprints, PNG, JPG, and station CAD diagrams
                  </p>
                </div>

                {/* Preview Box */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center justify-center min-h-[180px]">
                  {imagePreview ? (
                    <div className="w-full flex flex-col items-center">
                      <img
                        src={imagePreview}
                        alt="Blueprint Preview"
                        className="max-h-40 object-contain rounded border border-slate-200 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 mt-2 font-mono font-semibold">
                        {selectedFile?.name || 'blueprint.png'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Select or drop a blueprint image to preview
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExtractBlueprint}
                  disabled={!imagePreview || isExtracting}
                  className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                    !imagePreview || isExtracting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                  }`}
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Analyzing Blueprint with Gemini Vision...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      Extract Navigation Graph
                    </>
                  )}
                </button>

                {extractionError && (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    {extractionError}
                  </span>
                )}
              </div>

              {/* Extracted Graph Preview */}
              {extractedData && (
                <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Extracted Graph: {extractedData.venueName || 'Detected Floor Plan'}
                        </h4>
                        <p className="text-xs text-emerald-700 font-semibold">
                          {extractedData.nodes?.length || 0} nodes · {extractedData.edges?.length || 0} edges · {extractedData.pois?.length || 0} POIs
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleApplyExtracted}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Apply to Live Map
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                    <div className="text-blue-600 mb-1 font-bold">Sample Detected Nodes:</div>
                    {extractedData.nodes?.slice(0, 6).map((n: any) => (
                      <div key={n.id} className="text-slate-600">
                        • [{n.code || n.id}] {n.name} ({n.level}, {n.type})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLOSURES & MAINTENANCE */}
          {activeTab === 'closures' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed font-medium">
                Toggle edge closures (e.g., simulating lift maintenance on Jolarpet FOB, escalator repair, or corridor painting). The routing engine will immediately reroute passengers.
              </div>

              <div className="space-y-2">
                {stationData.edges
                  .filter((e) => e.levelChange !== 'none' || e.distanceMeters > 35)
                  .map((edge) => {
                    const isClosed = edge.isClosed || !!stationData.closures[edge.id];
                    const closureReason = stationData.closures[edge.id];

                    return (
                      <div
                        key={edge.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isClosed
                            ? 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700">
                              {edge.id}
                            </span>
                            <span className="text-xs font-bold">
                              {edge.source} ↔ {edge.target}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-semibold">
                              {edge.distanceMeters}m · {edge.levelChange}
                            </span>
                          </div>
                          {isClosed && (
                            <div className="text-[11px] text-red-700 mt-1 font-semibold">
                              ⚠️ Closure notice: {closureReason || 'Under maintenance'}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            setClosureLoadingId(edge.id);
                            await onToggleClosure(edge.id, 'Routine safety maintenance');
                            setClosureLoadingId(null);
                          }}
                          disabled={closureLoadingId === edge.id}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                            isClosed
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-red-600 hover:bg-red-500 text-white'
                          }`}
                        >
                          {closureLoadingId === edge.id
                            ? 'Updating...'
                            : isClosed
                            ? 'Re-Open Corridor'
                            : 'Mark Closed'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: GRAPH OVERVIEW & RESET */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-semibold">Total Nodes</div>
                  <div className="text-2xl font-black text-slate-900">{stationData.nodes.length}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-semibold">Total Edges</div>
                  <div className="text-2xl font-black text-slate-900">{stationData.edges.length}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-semibold">Verified POIs</div>
                  <div className="text-2xl font-black text-slate-900">{stationData.pois.length}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Reset Station Graph
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Restores official blueprint defaults for Krantivira Sangolli Rayanna (Bengaluru) Station
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await onResetGraph();
                    onClose();
                  }}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Blueprint Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

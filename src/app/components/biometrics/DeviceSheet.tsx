"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Camera, AlertCircle, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeviceSheetProps {
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  modelsReady: boolean;
  cameraReady: boolean;
  onDeviceChange: (deviceId: string) => void;
  onRetry: () => void;
}

export function DeviceSheet({
  videoDevices,
  selectedDeviceId,
  modelsReady,
  cameraReady,
  onDeviceChange,
  onRetry,
}: DeviceSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDevice = videoDevices.find((d) => d.deviceId === selectedDeviceId);
  const deviceLabel = selectedDevice?.label || "Camera";

  return (
    <>
      {/* Mobile: Floating status chips (top-right) */}
      <div className="absolute top-40 right-4 z-30 flex flex-col items-end gap-2 lg:hidden">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] backdrop-blur-md ${
            modelsReady
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-gray-700 bg-gray-800/60 text-gray-300"
          }`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${modelsReady ? "bg-emerald-400" : "bg-gray-500"}`} />
          Models
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] backdrop-blur-md ${
            cameraReady
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-gray-700 bg-gray-800/60 text-gray-300"
          }`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${cameraReady ? "bg-emerald-400" : "bg-gray-500"}`} />
          Camera
        </div>
        
        {/* Settings button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="rounded-full border border-gray-700 bg-gray-800/60 backdrop-blur-md p-2 hover:bg-gray-700/60 transition-colors">
              <Settings className="h-4 w-4 text-gray-300" />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-gray-950 border-gray-800 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Camera Settings</DialogTitle>
              <DialogDescription className="text-white/60">
                Select a camera device and retry if needed
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Device selector */}
              {videoDevices.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-white/50">
                    Select Camera
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => onDeviceChange(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-black/60 px-3 py-2.5 text-sm text-white/90 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
              )}

              {/* Retry button */}
              <Button
                onClick={() => {
                  onRetry();
                  setIsOpen(false);
                }}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                {cameraReady ? "Retry Camera" : "Enable Camera"}
              </Button>

              {/* Troubleshooting tips */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-1 text-xs text-amber-100/80">
                    <p className="font-medium text-amber-200">Camera not working?</p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-100/70">
                      <li>Check browser permissions</li>
                      <li>Close other apps using camera</li>
                      <li>Ensure you're using HTTPS or localhost</li>
                      <li>Try a different camera if available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop: Normal layout */}
      <div className="hidden lg:flex items-center gap-3 rounded-lg border border-gray-800 bg-black/40 px-4 py-3">
        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              modelsReady
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                : "border-gray-700 bg-gray-800/40 text-gray-400"
            }`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${modelsReady ? "bg-emerald-400" : "bg-gray-500"}`} />
            Models {modelsReady ? "Ready" : "Not Loaded"}
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              cameraReady
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                : "border-gray-700 bg-gray-800/40 text-gray-400"
            }`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${cameraReady ? "bg-emerald-400" : "bg-gray-500"}`} />
            Camera {cameraReady ? "Ready" : "Not Started"}
          </div>
        </div>

        {/* Camera selector trigger */}
        {videoDevices.length > 0 ? (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-white/60 hover:text-white/90"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                {deviceLabel.length > 20 ? deviceLabel.slice(0, 20) + "..." : deviceLabel}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-950 border-gray-800 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Camera Settings</DialogTitle>
                <DialogDescription className="text-white/60">
                  Select a camera device and retry if needed
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Device selector */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-white/50">
                    Select Camera
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => onDeviceChange(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-black/60 px-3 py-2.5 text-sm text-white/90 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                {/* Retry button */}
                <Button
                  onClick={() => {
                    onRetry();
                    setIsOpen(false);
                  }}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Retry with Selected Camera
                </Button>

                {/* Troubleshooting tips */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-1 text-xs text-amber-100/80">
                      <p className="font-medium text-amber-200">Camera not working?</p>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-100/70">
                        <li>Check browser permissions</li>
                        <li>Close other apps using camera (Zoom, Meet, etc.)</li>
                        <li>Ensure you're using HTTPS or localhost</li>
                        <li>Try a different camera if available</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-auto py-1.5 px-3 text-xs"
          >
            Enable Camera
          </Button>
        )}
      </div>
    </>
  );
}

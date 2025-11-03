"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Lesson } from '@/types';

interface VideoPlayerProps {
  lesson: Lesson;
  onProgressUpdate: (watchedSeconds: number) => void;
  onComplete: () => void;
  initialWatchedSeconds: number;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const VideoPlayer = ({ lesson, onProgressUpdate, onComplete, initialWatchedSeconds }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialWatchedSeconds);
  const [duration, setDuration] = useState(0);
  const lastUpdateTime = useRef(initialWatchedSeconds);
  const [error, setError] = useState<string | null>(null);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentVideoTime = video.currentTime;
    setCurrentTime(currentVideoTime);

    // Only update backend if there's a significant change to avoid excessive API calls
    if (Math.abs(currentVideoTime - lastUpdateTime.current) > 5) {
      onProgressUpdate(currentVideoTime);
      lastUpdateTime.current = currentVideoTime;
    }
  }, [onProgressUpdate]);

  const handleEnded = useCallback(() => {
    onComplete();
    setIsPlaying(false);
  }, [onComplete]);

  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      // Prevent seeking forward beyond a small buffer
      const allowedSeekTime = lastUpdateTime.current + 1; // Allow 1 second buffer
      if (video.currentTime > allowedSeekTime && video.currentTime > lastUpdateTime.current) {
          video.currentTime = lastUpdateTime.current; // Reset to last known good time
      }
    }
  }, []);

  const handleError = useCallback(() => {
    console.error("Video error:", videoRef.current?.error);
    setError("Could not load video. Please check the video source.");
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      // Ensure video starts at initialWatchedSeconds, but not beyond duration
      video.currentTime = Math.min(initialWatchedSeconds, video.duration);
      lastUpdateTime.current = video.currentTime;
    }
  }, [initialWatchedSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null); // Reset error when lesson changes
    setCurrentTime(initialWatchedSeconds); // Reset current time for new lesson
    lastUpdateTime.current = initialWatchedSeconds;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Set initial time on source change if metadata is already loaded
    if (video.readyState >= 1) { // HAVE_METADATA
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [lesson, handleTimeUpdate, handleEnded, handleSeeking, handleError, handleLoadedMetadata, initialWatchedSeconds]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="aspect-video bg-red-900/50 text-red-300 rounded-lg flex items-center justify-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={lesson.videoUrl}
        width="100%"
        height="100%"
        onClick={togglePlay}
        controls={false} // Disable native controls to prevent seeking
      />
       <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!isPlaying && (
          <div className="bg-black/50 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Custom Controls */} 
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 flex items-center gap-3 text-white text-sm">
        <button onClick={togglePlay} className="flex-shrink-0">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <div className="flex-grow h-1 bg-gray-700 rounded-full relative">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercentage}%` }} />
        </div>
        <span className="tabular-nums flex-shrink-0">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default VideoPlayer;

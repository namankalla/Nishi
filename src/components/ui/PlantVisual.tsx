import React, { useRef, useEffect, useState } from 'react';

type Species = 'lemon' | 'snake' | 'cactus' | 'monstera';

interface PlantVisualProps {
  species: Species;
  growthDays: number;
  injured: boolean;
  dead: boolean;
  burstKey?: number; // change this to retrigger watering animation
  onTransplant?: () => void;
  isTransplanted?: boolean; // new prop to identify transplanted plants
}

const PlantVisual: React.FC<PlantVisualProps> = ({ 
  species, 
  growthDays, 
  injured, 
  dead, 
  burstKey,
  onTransplant,
  isTransplanted = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState<number>(4); // seconds, default fallback
  const plantClass = dead ? 'plant-dead' : injured ? 'plant-injured plant-anim' : 'plant-anim';
  
  // For transplanted plants, always show as fully grown
  const effectiveGrowthDays = isTransplanted ? 28 : growthDays;
  const isFullyGrown = effectiveGrowthDays >= 28;
  const MIN_START_SEC = 0.6; // start video from 0.6s
  const END_TRIM_SEC = 0.7;  // trim last 0.7s from the end
  
  // Control video playback time based on growth days, proportionally to actual duration, starting at 0.6s
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setTimeForDay = () => {
      const day = Math.max(1, Math.min(effectiveGrowthDays, 28));
      const total = video.duration || videoDuration;
      const endCap = Math.max(MIN_START_SEC, total - END_TRIM_SEC);
      const usable = Math.max(endCap - MIN_START_SEC, 0);
      const fraction = (day - 1) / 27; // day 1 -> 0, day 28 -> 1
      const targetTime = Math.min(endCap, MIN_START_SEC + fraction * usable);
      try {
        video.currentTime = Math.max(0, targetTime);
      } catch {}
      video.pause();
    };

    const onLoadedMeta = () => {
      const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : videoDuration;
      setVideoDuration(dur);
      setTimeForDay();
    };

    if (video.readyState >= 1) {
      if (isFinite(video.duration) && video.duration > 0) setVideoDuration(video.duration);
      setTimeForDay();
    } else {
      video.addEventListener('loadedmetadata', onLoadedMeta);
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMeta);
    };
  }, [effectiveGrowthDays, videoDuration]);
  
  return (
    <div style={{ position: 'relative', width: 250, height: 280 }}>
      {!!burstKey && (
        <div className="watering-overlay" key={burstKey} style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <img 
            src="/assets/watering.gif" 
            alt="Watering" 
            style={{
              position: 'absolute',
              top: '35%',
              left: '70%', // slight shift to the right
              transform: 'translate(-50%, -50%)',
              width: '50%',
              height: '50%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      {isFullyGrown && !dead && !isTransplanted && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#059669',
            textAlign: 'center'
          }}>
            🌱 Ready to Transplant!
          </div>
        </div>
      )}

      <div className={plantClass} style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <video 
          ref={videoRef}
          src="/assets/plant1video.mp4" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: dead ? 'grayscale(98%) brightness(3)' : 'contrast(1.05) saturate(2) brightness(1)'
          }}
          muted
          playsInline
        />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '5px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        Day {Math.max(1, Math.min(effectiveGrowthDays, 28))}/28
      </div>
    </div>
  );
};

export default PlantVisual;



import React, { useRef, useEffect, useState } from 'react';
import { YOLOv8Detector, Detection } from '@/utils/yolov8';

interface VideoAnalyzerProps {
  videoSrc: string;
  isPlaying: boolean;
  model: YOLOv8Detector | null;
  onDetectionUpdate?: (detections: Detection[]) => void;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({
  videoSrc,
  isPlaying,
  model,
  onDetectionUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [currentDetections, setCurrentDetections] = useState<Detection[]>([]);

  // Vehicle type colors for different classes
  const vehicleColors: Record<string, string> = {
    car: '#00ff00',
    truck: '#ff6b00',
    bus: '#0066ff',
    motorcycle: '#ff00ff',
    bicycle: '#ffff00',
    person: '#ff0000',
    ambulance: '#ff3333',
    default: '#00ff00'
  };

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each detection
    detections.forEach((detection) => {
      const { box, label, score } = detection;
      const color = vehicleColors[label] || vehicleColors.default;
      
      // Calculate box dimensions
      const x = Math.max(0, box.xmin);
      const y = Math.max(0, box.ymin);
      const width = Math.min(canvas.width - x, box.xmax - box.xmin);
      const height = Math.min(canvas.height - y, box.ymax - box.ymin);
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Prepare label text
      const labelText = `${label} ${(score * 100).toFixed(0)}%`;
      ctx.font = 'bold 14px Arial';
      const textMetrics = ctx.measureText(labelText);
      const textHeight = 20;
      
      // Position label
      const labelY = y > textHeight ? y - 5 : y + height + textHeight;
      
      // Draw label background
      ctx.fillStyle = color;
      ctx.fillRect(x, labelY - textHeight, textMetrics.width + 10, textHeight);
      
      // Draw label text
      ctx.fillStyle = '#000000';
      ctx.fillText(labelText, x + 5, labelY - 6);
    });
  };

  const performDetection = async () => {
    if (!model || !videoRef.current || !isPlaying) return;

    const video = videoRef.current;
    
    // Skip if video not ready
    if (!video.videoWidth || !video.videoHeight || video.paused || video.ended) {
      if (isPlaying && !video.paused && !video.ended) {
        animationFrameRef.current = requestAnimationFrame(performDetection);
      }
      return;
    }

    try {
      // Run YOLOv8 detection on current frame
      const detections = await model.detect(video);
      
      // Update state and draw results
      setCurrentDetections(detections);
      drawDetections(detections);
      
      // Notify parent component
      onDetectionUpdate?.(detections);
      
      console.log(`Frame detection: ${detections.length} vehicles detected`);
    } catch (error) {
      console.error('Detection error:', error);
    }

    // Continue detection loop
    if (isPlaying && videoRef.current && !videoRef.current.paused) {
      animationFrameRef.current = requestAnimationFrame(performDetection);
    }
  };

  // Start/stop detection based on play state
  useEffect(() => {
    if (isPlaying && model) {
      performDetection();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, model]);

  // Clear canvas when video stops
  useEffect(() => {
    if (!isPlaying && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setCurrentDetections([]);
    }
  }, [isPlaying]);

  return (
    <div className="relative aspect-video bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl overflow-hidden border border-border/50">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        onLoadedMetadata={() => {
          console.log('Video metadata loaded:', {
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight,
            duration: videoRef.current?.duration
          });
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{ 
          mixBlendMode: 'normal',
          pointerEvents: 'none'
        }}
      />
      {currentDetections.length > 0 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentDetections.length} vehicles detected
        </div>
      )}
    </div>
  );
};
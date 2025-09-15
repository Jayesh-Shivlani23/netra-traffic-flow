import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Play, Pause, Square, Activity, FileVideo, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { pipeline } from "@huggingface/transformers";

const UploadAnalyze = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [model, setModel] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<{
    totalFrames: number;
    avgVehicles: number;
    avgDensity: number;
    detections: Array<{ frame: number; vehicles: number; density: number; boxes: any[] }>;
  } | null>(null);
  const [liveDetections, setLiveDetections] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();

  // Initialize the Hugging Face model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsModelLoading(true);
        toast({
          title: "Loading AI model",
          description: "Initializing vehicle detection model...",
        });
        
        // Use a supported, browser-friendly DETR model with device fallback
        const detector = await pipeline(
          "object-detection",
          "Xenova/detr-resnet-50",
          { device: (navigator as any)?.gpu ? "webgpu" : "wasm" }
        );
        setModel(detector);
        
        toast({
          title: "Model loaded successfully",
          description: "Ready for vehicle detection",
        });
      } catch (error) {
        console.error('Error loading model:', error);
        toast({
          title: "Model loading failed",
          description: "Please refresh the page to try again",
          variant: "destructive",
        });
      } finally {
        setIsModelLoading(false);
      }
    };

    initializeModel();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      toast({
        title: "Video uploaded successfully",
        description: "Ready for analysis",
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const drawBoundingBoxes = (detections: any[], frameWidth: number, frameHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.font = '16px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;

    detections.forEach((detection) => {
      const box = detection.box;
      const x = box.xmin;
      const y = box.ymin;
      const width = box.xmax - box.xmin;
      const height = box.ymax - box.ymin;
      const confidence = detection.score || 0;
      const label = detection.label || 'vehicle';
      
      // Draw bounding box
      ctx.strokeRect(x, y, width, height);
      
      // Draw label background
      const labelText = `${label} (${(confidence * 100).toFixed(1)}%)`;
      const textMetrics = ctx.measureText(labelText);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillRect(x, y - 25, textMetrics.width + 10, 25);
      
      // Draw label text
      ctx.fillStyle = '#000000';
      ctx.fillText(labelText, x + 5, y - 8);
      ctx.fillStyle = '#00ff00';
    });
  };

  // Live detection during video playback
  const performLiveDetection = async () => {
    if (!model || !videoRef.current || !isPlaying) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    try {
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const detections = await model(imageDataUrl);
      
      // Filter for vehicles only
      const vehicleDetections = detections.filter((detection: any) => 
        detection.label && ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person', 'vehicle'].includes(detection.label.toLowerCase())
      );
      
      setLiveDetections(vehicleDetections);
      drawBoundingBoxes(vehicleDetections, video.videoWidth, video.videoHeight);
    } catch (error) {
      console.error('Live detection error:', error);
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(performLiveDetection);
    }
  };

  // Start/stop live detection when video play state changes
  useEffect(() => {
    if (isPlaying && model) {
      performLiveDetection();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, model]);

  const startAnalysis = async () => {
    if (!selectedFile || !videoRef.current || !model) {
      toast({
        title: !model ? "Model not loaded" : "No video selected",
        description: !model ? "Please wait for the AI model to load" : "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResults(null);
    
    toast({
      title: "Analysis started",
      description: "Extracting frames and processing with AI model...",
    });

    try {
      const video = videoRef.current;
      const duration = video.duration;
      const frameRate = 30; // Assume 30 FPS
      const frameInterval = 5; // Extract every 5th frame
      const totalFramesToAnalyze = Math.floor((duration * frameRate) / frameInterval);
      
      const detections: Array<{ frame: number; vehicles: number; density: number; boxes: any[] }> = [];
      const maxCapacity = 20;

      for (let i = 0; i < totalFramesToAnalyze; i++) {
        const timeInSeconds = (i * frameInterval) / frameRate;
        
        // Extract frame as canvas image
        video.currentTime = timeInSeconds;
        await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Process with Hugging Face model
        const modelResults = await model(imageDataUrl);
        
        // Filter for vehicles only
        const vehicleDetections = modelResults.filter((detection: any) => 
          detection.label && ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person', 'vehicle'].includes(detection.label.toLowerCase())
        );
        
        const vehicleCount = vehicleDetections.length;
        const density = vehicleCount / maxCapacity;

        // Convert Hugging Face format to our format for storage
        const formattedBoxes = vehicleDetections.map((detection: any) => ({
          class: detection.label,
          confidence: detection.score,
          x: detection.box.xmin + (detection.box.xmax - detection.box.xmin) / 2,
          y: detection.box.ymin + (detection.box.ymax - detection.box.ymin) / 2,
          width: detection.box.xmax - detection.box.xmin,
          height: detection.box.ymax - detection.box.ymin
        }));

        // Store in Supabase
        const { error } = await supabase
          .from('detections')
          .insert({
            junction_id: 'junction_1', // Default junction ID
            frame_number: i,
            class: 'mixed_traffic',
            bbox_json: formattedBoxes,
            vehicles_count: vehicleCount,
            density: density
          });

        if (error) {
          console.error('Error storing detection:', error);
        }

        detections.push({
          frame: i,
          vehicles: vehicleCount,
          density: density,
          boxes: vehicleDetections
        });

        // Draw bounding boxes on the last frame
        if (i === totalFramesToAnalyze - 1) {
          drawBoundingBoxes(vehicleDetections, video.videoWidth, video.videoHeight);
        }

        // Update progress
        setAnalysisProgress(((i + 1) / totalFramesToAnalyze) * 100);
      }

      // Calculate summary statistics
      const avgVehicles = detections.reduce((sum, d) => sum + d.vehicles, 0) / detections.length;
      const avgDensity = detections.reduce((sum, d) => sum + d.density, 0) / detections.length;

      // Store junction stats
      await supabase
        .from('junction_stats')
        .upsert({
          junction_id: 'junction_1',
          avg_density: avgDensity,
          recommended_green_time: Math.max(30, Math.min(120, Math.round(avgDensity * 180)))
        });

      setAnalysisResults({
        totalFrames: totalFramesToAnalyze,
        avgVehicles: avgVehicles,
        avgDensity: avgDensity,
        detections: detections
      });

      toast({
        title: "Analysis complete",
        description: `Processed ${totalFramesToAnalyze} frames with ${avgVehicles.toFixed(1)} avg vehicles per frame`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "An error occurred during video analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <motion.div 
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Upload & Analyze
          </h1>
          <p className="text-muted-foreground text-lg">Upload traffic videos for AI-powered analysis and optimization</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <motion.div
                    className="p-2 gradient-primary rounded-lg"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Upload className="h-5 w-5 text-primary-foreground" />
                  </motion.div>
                  <span>Video Upload</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all duration-300 hover:bg-primary/5 group"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="mx-auto mb-4"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <FileVideo className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.div>
                  <p className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                    {selectedFile ? selectedFile.name : "Choose video file"}
                  </p>
                  <p className="text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </motion.div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile && (
                  <motion.div 
                    className="mt-6 space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={togglePlayPause}
                          variant="outline"
                          size="sm"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={stopVideo}
                          variant="outline"
                          size="sm"
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={startAnalysis} 
                        className="w-full gradient-primary shadow-[var(--shadow-soft)]" 
                        disabled={isAnalyzing || isModelLoading || !model}
                      >
                        <motion.div
                          animate={(isAnalyzing || isModelLoading) ? { rotate: 360 } : {}}
                          transition={(isAnalyzing || isModelLoading) ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                        </motion.div>
                        {isModelLoading ? "Loading AI Model..." : isAnalyzing ? "Analyzing..." : !model ? "Model Loading..." : "Start AI Analysis"}
                      </Button>
                    </motion.div>

                    {/* Progress Bar */}
                    {isAnalyzing && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex justify-between text-sm">
                          <span>Processing frames...</span>
                          <span>{Math.round(analysisProgress)}%</span>
                        </div>
                        <Progress value={analysisProgress} className="w-full" />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Video Player Section */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all duration-300">
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl overflow-hidden border border-border/50">
                  {videoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 pointer-events-none"
                        style={{ mixBlendMode: 'normal' }}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-center"
                      >
                        <FileVideo className="h-16 w-16 mx-auto mb-4" />
                        <p>No video selected</p>
                      </motion.div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analysis Results */}
        {analysisResults && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="mt-8 shadow-[var(--shadow-card)] border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <motion.div
                    className="p-2 gradient-accent rounded-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="h-5 w-5 text-accent-foreground" />
                  </motion.div>
                  <span>Analysis Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div 
                    className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    <motion.div 
                      className="text-3xl font-bold text-primary mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                    >
                      {analysisResults.totalFrames}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Total Frames Analyzed</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20"
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    <motion.div 
                      className="text-3xl font-bold text-accent mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                    >
                      {analysisResults.avgVehicles.toFixed(1)}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Avg Vehicles per Frame</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-6 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20"
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    <motion.div 
                      className="text-3xl font-bold text-success mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
                    >
                      {(analysisResults.avgDensity * 100).toFixed(1)}%
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Average Traffic Density</div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UploadAnalyze;
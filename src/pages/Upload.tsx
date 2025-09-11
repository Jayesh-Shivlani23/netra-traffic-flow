import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Play, Pause, Square, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";

const UploadAnalyze = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<{
    totalFrames: number;
    avgVehicles: number;
    avgDensity: number;
    detections: Array<{ frame: number; vehicles: number; density: number; boxes: any[] }>;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const extractFrameAsBase64 = (video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.currentTime = time;
      video.addEventListener('seeked', function onSeeked() {
        video.removeEventListener('seeked', onSeeked);
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        resolve(base64);
      });
    });
  };

  const drawBoundingBoxes = (boxes: any[], frameWidth: number, frameHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';
    ctx.fillStyle = '#00ff00';

    boxes.forEach((box) => {
      const [x1, y1, x2, y2] = box.bbox;
      const width = x2 - x1;
      const height = y2 - y1;
      
      ctx.strokeRect(x1, y1, width, height);
      ctx.fillText(`${box.class} (${(box.confidence * 100).toFixed(1)}%)`, x1, y1 - 5);
    });
  };

  const startAnalysis = async () => {
    if (!selectedFile || !videoRef.current) {
      toast({
        title: "No video selected",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResults(null);
    
    toast({
      title: "Analysis started",
      description: "Extracting frames and processing...",
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
        
        // Extract frame as base64
        const frameBase64 = await extractFrameAsBase64(video, timeInSeconds);
        
        // Send to Hugging Face Space
        const response = await fetch('https://jayesh111206-netra.hf.space/api/predict/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [`data:image/jpeg;base64,${frameBase64}`]
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        const boxes = result.data || [];
        
        // Count vehicles (filter for vehicle classes)
        const vehicleClasses = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle'];
        const vehicleBoxes = boxes.filter((box: any) => 
          vehicleClasses.some(cls => box.class?.toLowerCase().includes(cls))
        );
        
        const vehicleCount = vehicleBoxes.length;
        const density = vehicleCount / maxCapacity;

        // Store in Supabase
        const { error } = await supabase
          .from('detections')
          .insert({
            junction_id: 'junction_1', // Default junction ID
            frame_number: i,
            class: 'mixed_traffic',
            bbox_json: vehicleBoxes,
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
          boxes: vehicleBoxes
        });

        // Draw bounding boxes on the last frame
        if (i === totalFramesToAnalyze - 1) {
          drawBoundingBoxes(vehicleBoxes, video.videoWidth, video.videoHeight);
        }

        // Update progress
        setAnalysisProgress(((i + 1) / totalFramesToAnalyze) * 100);
      }

      // Calculate summary statistics
      const avgVehicles = detections.reduce((sum, d) => sum + d.vehicles, 0) / detections.length;
      const avgDensity = detections.reduce((sum, d) => sum + d.density, 0) / detections.length;

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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload & Analyze</h1>
          <p className="text-muted-foreground">Upload traffic videos for AI-powered analysis</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Video Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {selectedFile ? selectedFile.name : "Choose video file"}
                </p>
                <p className="text-muted-foreground">
                  Click to upload or drag and drop
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={togglePlayPause}
                      variant="outline"
                      size="sm"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={stopVideo}
                      variant="outline"
                      size="sm"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={startAnalysis} 
                    className="w-full" 
                    disabled={isAnalyzing}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {isAnalyzing ? "Analyzing..." : "Start AI Analysis"}
                  </Button>

                  {/* Progress Bar */}
                  {isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing frames...</span>
                        <span>{Math.round(analysisProgress)}%</span>
                      </div>
                      <Progress value={analysisProgress} className="w-full" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Player Section */}
          <Card>
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
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
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No video selected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysisResults && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Analysis Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysisResults.totalFrames}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Frames Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {analysisResults.avgVehicles.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Vehicles per Frame</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {(analysisResults.avgDensity * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Traffic Density</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadAnalyze;
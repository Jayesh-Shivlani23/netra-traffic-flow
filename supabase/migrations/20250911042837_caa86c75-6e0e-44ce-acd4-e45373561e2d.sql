-- Create detections table for AI traffic analysis
CREATE TABLE public.detections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    junction_id TEXT NOT NULL,
    frame_number INTEGER NOT NULL,
    class TEXT NOT NULL,
    bbox_json JSONB NOT NULL,
    vehicles_count INTEGER NOT NULL DEFAULT 0,
    density DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction_stats table for traffic optimization data
CREATE TABLE public.junction_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    junction_id TEXT NOT NULL,
    avg_density DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    recommended_green_time INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.junction_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a traffic management system)
CREATE POLICY "Public read access for detections" 
ON public.detections FOR SELECT USING (true);

CREATE POLICY "Public insert access for detections" 
ON public.detections FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for junction_stats" 
ON public.junction_stats FOR SELECT USING (true);

CREATE POLICY "Public insert access for junction_stats" 
ON public.junction_stats FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for junction_stats" 
ON public.junction_stats FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_junction_stats_updated_at
    BEFORE UPDATE ON public.junction_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_detections_junction_id ON public.detections(junction_id);
CREATE INDEX idx_detections_timestamp ON public.detections(timestamp);
CREATE INDEX idx_junction_stats_junction_id ON public.junction_stats(junction_id);
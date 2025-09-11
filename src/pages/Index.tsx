import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Upload, BarChart3, Zap, Car, Brain, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/hero-traffic.jpg";

const Index = () => {
  const features = [
    {
      icon: Upload,
      title: "Video Analysis",
      description: "Upload traffic videos for AI-powered vehicle detection and analysis",
      link: "/upload",
    },
    {
      icon: BarChart3,
      title: "Real-time Dashboard",
      description: "Monitor traffic patterns, density, and optimization metrics",
      link: "/dashboard",
    },
    {
      icon: Zap,
      title: "Traffic Simulation",
      description: "Interactive traffic light control and vehicle flow simulation",
      link: "/simulation",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Smart city traffic control center" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/70"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              AI-Powered Traffic 
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Optimization</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform urban mobility with intelligent traffic analysis. Netra uses advanced AI to detect vehicles, 
              analyze traffic patterns, and optimize signal timing for reduced congestion and improved flow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/upload">Start Analysis</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Intelligent Traffic Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for traffic analysis, monitoring, and optimization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-6">
                      {feature.description}
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={feature.link}>Explore</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center mb-4">
                <Car className="h-8 w-8 text-primary mr-2" />
              </div>
              <div className="text-4xl font-bold text-foreground">99.2%</div>
              <div className="text-muted-foreground">Vehicle Detection Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-success mr-2" />
              </div>
              <div className="text-4xl font-bold text-foreground">35%</div>
              <div className="text-muted-foreground">Average Congestion Reduction</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-accent mr-2" />
              </div>
              <div className="text-4xl font-bold text-foreground">Real-time</div>
              <div className="text-muted-foreground">AI Processing & Analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Optimize Your Traffic?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join cities worldwide using AI to improve traffic flow and reduce urban congestion
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/upload">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;

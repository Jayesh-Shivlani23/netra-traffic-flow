import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Upload, BarChart3, Car, Brain, TrendingUp, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
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
      icon: Brain,
      title: "AI Optimization", 
      description: "Intelligent signal timing and traffic flow optimization algorithms",
      link: "/dashboard",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <motion.section 
        className="relative py-24 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Smart city traffic control center" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <motion.div 
            className="max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              className="text-6xl font-bold text-foreground mb-6 leading-tight"
              variants={itemVariants}
            >
              AI-Powered Traffic 
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block mt-2">
                Optimization
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Transform urban mobility with intelligent traffic analysis. Netra uses advanced AI to detect vehicles, 
              analyze traffic patterns, and optimize signal timing for reduced congestion and improved flow.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={itemVariants}
            >
              <Button asChild variant="gradient" size="lg" className="text-lg px-8 shadow-[var(--shadow-elegant)]">
                <Link to="/upload" className="flex items-center gap-2">
                  Start Analysis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">Intelligent Traffic Solutions</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for traffic analysis, monitoring, and optimization
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full hover:shadow-[var(--shadow-elegant)] transition-all duration-500 border-0 bg-card/90 backdrop-blur-sm group hover:-translate-y-2">
                    <CardHeader className="text-center pb-4">
                      <motion.div 
                        className="mx-auto mb-4 p-4 gradient-primary rounded-xl w-fit shadow-[var(--shadow-soft)]"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </motion.div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <Button asChild variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                        <Link to={feature.link} className="flex items-center justify-center gap-2">
                          Explore
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid md:grid-cols-3 gap-8 text-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="space-y-4" variants={itemVariants}>
              <motion.div 
                className="flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="p-3 gradient-primary rounded-xl shadow-[var(--shadow-soft)]">
                  <Car className="h-8 w-8 text-primary-foreground" />
                </div>
              </motion.div>
              <motion.div 
                className="text-5xl font-bold text-foreground"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                99.2%
              </motion.div>
              <div className="text-muted-foreground">Vehicle Detection Accuracy</div>
            </motion.div>
            <motion.div className="space-y-4" variants={itemVariants}>
              <motion.div 
                className="flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="p-3 bg-success/20 text-success rounded-xl shadow-[var(--shadow-soft)]">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </motion.div>
              <motion.div 
                className="text-5xl font-bold text-foreground"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
              >
                35%
              </motion.div>
              <div className="text-muted-foreground">Average Congestion Reduction</div>
            </motion.div>
            <motion.div className="space-y-4" variants={itemVariants}>
              <motion.div 
                className="flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="p-3 gradient-accent rounded-xl shadow-[var(--shadow-soft)]">
                  <Brain className="h-8 w-8 text-accent-foreground" />
                </div>
              </motion.div>
              <motion.div 
                className="text-5xl font-bold text-foreground"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
              >
                Real-time
              </motion.div>
              <div className="text-muted-foreground">AI Processing & Analysis</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="py-24 gradient-subtle"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Optimize Your Traffic?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join cities worldwide using AI to improve traffic flow and reduce urban congestion
          </p>
          <Button asChild variant="gradient" size="lg" className="text-lg px-8 shadow-[var(--shadow-elegant)]">
            <Link to="/upload" className="flex items-center gap-2">
              Get Started Today
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default Index;

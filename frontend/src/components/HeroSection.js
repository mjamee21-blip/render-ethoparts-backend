import { ChevronDown, MapPin, Phone, Truck, Shield, Clock } from "lucide-react";
import { Button } from "./ui/button";

export default function HeroSection() {
  const scrollToProducts = () => {
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20" data-testid="hero-section">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1483671174579-bab2a5293389?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-full">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-300 text-sm">Addis Ababa, Ethiopia</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
              Quality Auto Parts
              <span className="block gradient-text">For Every Car</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
              Ethiopia's trusted marketplace for genuine and affordable auto parts. 
              Connect with verified sellers across Addis Ababa and get the parts you need.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={scrollToProducts}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-bold btn-glow"
                data-testid="browse-parts-btn"
              >
                Browse Parts
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800 px-8 py-6 text-lg"
                onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="learn-more-btn"
              >
                Learn More
              </Button>
            </div>

            {/* Contact Info */}
            <div className="flex items-center space-x-4 pt-4">
              <Phone className="h-5 w-5 text-emerald-400" />
              <span className="text-white font-semibold">0777770757</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">24/7 Support</span>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="col-span-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-xl card-hover animate-fade-in-up stagger-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Nationwide Delivery</h3>
                  <p className="text-slate-400 text-sm">Fast shipping across Ethiopia</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-xl card-hover animate-fade-in-up stagger-2">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-white font-bold">Verified Sellers</h3>
              <p className="text-slate-400 text-sm">Trusted merchants only</p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-xl card-hover animate-fade-in-up stagger-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-white font-bold">Order Tracking</h3>
              <p className="text-slate-400 text-sm">Real-time updates</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-slate-500" />
        </div>
      </div>
    </section>
  );
}

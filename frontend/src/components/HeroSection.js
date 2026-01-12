import { ArrowRight, Zap, Shield, Truck } from "lucide-react";
import { Button } from "./ui/button";

export default function HeroSection() {
  const scrollToProducts = () => {
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-[85vh] flex items-center pt-16" data-testid="hero-section">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="max-w-3xl">
          {/* Smart Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8 animate-in">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium tracking-wide">Ethiopia's #1 Auto Parts Marketplace</span>
          </div>

          {/* Headline - Clean & Bold */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6 animate-in">
            Find the right part.
            <br />
            <span className="text-zinc-500">Every time.</span>
          </h1>

          {/* Subtext - Minimal */}
          <p className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed animate-in">
            Connect with verified sellers across Addis Ababa. Quality parts, transparent pricing, fast delivery.
          </p>

          {/* CTA Buttons - Flat Design */}
          <div className="flex flex-wrap gap-3 mb-16 animate-in">
            <Button
              onClick={scrollToProducts}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 h-12 text-sm font-medium rounded-xl transition-all"
              data-testid="browse-parts-btn"
            >
              Browse Parts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/[0.06] px-6 h-12 text-sm font-medium rounded-xl"
              onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="learn-more-btn"
            >
              Learn More
            </Button>
          </div>

          {/* Smart Stats Row */}
          <div className="flex flex-wrap gap-8 pt-8 border-t border-white/[0.06] animate-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center">
                <Truck className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Express Delivery</p>
                <p className="text-zinc-500 text-xs">24-48 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Verified Sellers</p>
                <p className="text-zinc-500 text-xs">100% trusted</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Smart Match</p>
                <p className="text-zinc-500 text-xs">99% compatibility</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { MapPin, Phone, Mail, Clock, Check } from "lucide-react";

export default function AboutSection() {
  const features = [
    "Genuine auto parts",
    "Verified sellers",
    "Competitive pricing",
    "Fast delivery",
    "24/7 support",
    "Secure payments",
  ];

  return (
    <section id="about" className="py-20 px-6 bg-white/[0.01]" data-testid="about-section">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image with Stats */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/[0.02]">
              <img
                src="https://images.unsplash.com/photo-1604560842632-bd795d8f1275?w=800&q=80"
                alt="Addis Ababa"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Stats Cards - Minimal */}
            <div className="absolute -bottom-6 left-6 right-6 flex gap-3">
              <div className="flex-1 bg-[#111113]/95 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">500+</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Products</p>
              </div>
              <div className="flex-1 bg-[#111113]/95 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Sellers</p>
              </div>
              <div className="flex-1 bg-[#111113]/95 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">1K+</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Orders</p>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="space-y-8 lg:pl-8">
            <div>
              <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-3">About</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Ethiopia's Trusted<br />Auto Parts Marketplace
              </h2>
            </div>

            <p className="text-zinc-400 leading-relaxed">
              Etho Parts connects car owners with verified merchants offering genuine parts at competitive prices. Based in Addis Ababa, we're building the future of auto parts commerce in Ethiopia.
            </p>

            {/* Features - Minimal Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-400" strokeWidth={2} />
                  </div>
                  <span className="text-zinc-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Contact - Clean Cards */}
            <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-4">
              <p className="text-white font-semibold text-sm">Contact</p>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-zinc-400 text-sm">Addis Ababa, Ethiopia</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Phone className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-zinc-400 text-sm">0777770757</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Clock className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-zinc-400 text-sm">Mon - Sat: 8AM - 6PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

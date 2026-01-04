import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";

export default function AboutSection() {
  const features = [
    "Wide selection of genuine auto parts",
    "Verified and trusted sellers",
    "Competitive pricing in ETB",
    "Fast delivery across Ethiopia",
    "24/7 customer support",
    "Secure payment via Telebirr",
  ];

  return (
    <section id="about" className="py-20 bg-slate-900" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image & Stats */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1604560842632-bd795d8f1275?w=800&q=80"
                alt="Addis Ababa"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-4">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-400">500+</div>
                <div className="text-xs text-slate-400">Products</div>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-amber-400">50+</div>
                <div className="text-xs text-slate-400">Sellers</div>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-red-400">1000+</div>
                <div className="text-xs text-slate-400">Orders</div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="space-y-8">
            <div>
              <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
                About Us
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-2 tracking-tight">
                Ethiopia's Trusted Auto Parts Marketplace
              </h2>
            </div>

            <p className="text-slate-400 text-lg leading-relaxed">
              Etho Parts is your one-stop destination for quality auto parts in Ethiopia. 
              Based in Addis Ababa, we connect car owners with verified merchants offering 
              genuine parts at competitive prices. Whether you need engine components, 
              brake systems, or electrical parts, we've got you covered.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
              <h3 className="text-white font-bold text-lg">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300">Addis Ababa, Ethiopia</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300">0777770757</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300">info@ethoparts.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300">Mon - Sat: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

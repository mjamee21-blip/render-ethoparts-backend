import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0b]" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <div>
              <p className="text-white font-semibold">Etho Parts</p>
              <p className="text-zinc-500 text-xs">Quality auto parts for Ethiopia</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a href="#products" className="text-zinc-400 hover:text-white transition-colors">Products</a>
            <Link to="/track" className="text-zinc-400 hover:text-white transition-colors">Track Order</Link>
            <a href="#about" className="text-zinc-400 hover:text-white transition-colors">About</a>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Addis Ababa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>0777770757</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">© 2024 Etho Parts. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

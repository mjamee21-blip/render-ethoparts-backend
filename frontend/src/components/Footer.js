import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xl">EP</span>
              </div>
              <span className="text-xl font-bold text-white">Etho Parts</span>
            </div>
            <p className="text-slate-400 text-sm">
              Ethiopia's trusted marketplace for quality auto parts. 
              Connecting car owners with verified sellers since 2024.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="#categories" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Categories
                </a>
              </li>
              <li>
                <a href="#products" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Products
                </a>
              </li>
              <li>
                <a href="#about" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <Link to="/track" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="#products" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Engine Parts
                </a>
              </li>
              <li>
                <a href="#products" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Brakes
                </a>
              </li>
              <li>
                <a href="#products" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Electrical
                </a>
              </li>
              <li>
                <a href="#products" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Body Parts
                </a>
              </li>
              <li>
                <a href="#products" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                  Tires & Wheels
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">0777770757</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">info@ethoparts.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ethiopian Flag Stripe */}
        <div className="ethio-stripe my-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-slate-500">
            © 2024 Etho Parts. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

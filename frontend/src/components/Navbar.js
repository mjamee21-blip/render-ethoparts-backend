import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X, LogOut, LayoutDashboard, Command } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ onAuthClick, onCartClick, onSearchFocus }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin": return "/admin";
      case "seller": return "/seller";
      default: return "/dashboard";
    }
  };

  const handleNavClick = (href) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.06]" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Minimal */}
          <Link to="/" className="flex items-center gap-2.5" data-testid="logo">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight hidden sm:block">Etho Parts</span>
          </Link>

          {/* Center - Command Search (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <button
              onClick={onSearchFocus}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-zinc-500 text-sm transition-all"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search parts...</span>
              <kbd className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-white/[0.06] rounded-md text-[10px] font-medium text-zinc-400">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Nav Links - Minimal */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              {["Products", "Track"].map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavClick(item === "Products" ? "#products" : "/track")}
                  className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
              onClick={onCartClick}
              data-testid="cart-button"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-emerald-500 text-[10px] font-semibold text-white rounded-full">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
                    data-testid="user-menu-button"
                  >
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-400 text-xs font-semibold">{user.name.charAt(0)}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#141416] border-white/[0.06] rounded-xl">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem 
                    onClick={() => navigate(getDashboardLink())}
                    className="text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer rounded-lg mx-1"
                    data-testid="dashboard-link"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer rounded-lg mx-1"
                    data-testid="logout-button"
                  >
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onAuthClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 h-9 rounded-xl"
                data-testid="login-button"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Minimal */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111113] border-t border-white/[0.06]" data-testid="mobile-menu">
          <div className="px-6 py-4 space-y-1">
            {[
              { name: "Products", href: "#products" },
              { name: "Track Order", href: "/track" },
            ].map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="block w-full text-left text-zinc-400 hover:text-white py-2.5 text-sm"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
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

export default function Navbar({ onAuthClick, onCartClick }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Categories", href: "#categories" },
    { name: "Products", href: "#products" },
    { name: "About", href: "#about" },
    { name: "Track Order", href: "/track" },
  ];

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
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className="ethio-stripe fixed top-0 left-0 right-0 z-50" />
      <nav className="fixed top-1 left-0 right-0 z-40 glass" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" data-testid="logo">
              <div className="w-10 h-10 bg-emerald-500 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xl">EP</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">Etho Parts</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="text-slate-300 hover:text-emerald-400 transition-colors text-sm font-medium"
                  data-testid={`nav-${link.name.toLowerCase().replace(" ", "-")}`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-300 hover:text-emerald-400"
                onClick={onCartClick}
                data-testid="cart-button"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-500 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-300 hover:text-emerald-400"
                      data-testid="user-menu-button"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem 
                      onClick={() => navigate(getDashboardLink())}
                      className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      data-testid="dashboard-link"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      data-testid="logout-button"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={onAuthClick}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white btn-glow"
                  data-testid="login-button"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800" data-testid="mobile-menu">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="block w-full text-left text-slate-300 hover:text-emerald-400 py-2"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

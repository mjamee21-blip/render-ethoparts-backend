import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AuthModal({ open, onClose }) {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "buyer",
    business_name: "",
    address: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      toast.success(`Welcome back, ${user.name}!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(registerForm);
      toast.success(`Welcome to Etho Parts, ${user.name}!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">Welcome to Etho Parts</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="login" className="data-[state=active]:bg-emerald-500" data-testid="login-tab">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-emerald-500" data-testid="register-tab">
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="your@email.com"
                  required
                  data-testid="login-email"
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
              
              <div className="text-center text-sm text-slate-400">
                <p>Demo accounts:</p>
                <p className="text-xs">Admin: admin@ethoparts.com / admin123</p>
                <p className="text-xs">Seller: seller@ethoparts.com / seller123</p>
              </div>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-name" className="text-slate-300">Full Name</Label>
                  <Input
                    id="register-name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    required
                    data-testid="register-name"
                  />
                </div>
                <div>
                  <Label htmlFor="register-phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="register-phone"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="0912345678"
                    required
                    data-testid="register-phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-email" className="text-slate-300">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  required
                  data-testid="register-email"
                />
              </div>

              <div>
                <Label htmlFor="register-password" className="text-slate-300">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  minLength={6}
                  required
                  data-testid="register-password"
                />
              </div>

              <div>
                <Label htmlFor="register-role" className="text-slate-300">I want to</Label>
                <Select
                  value={registerForm.role}
                  onValueChange={(value) => setRegisterForm({ ...registerForm, role: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1" data-testid="register-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="buyer">Buy auto parts</SelectItem>
                    <SelectItem value="seller">Sell auto parts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {registerForm.role === "seller" && (
                <>
                  <div>
                    <Label htmlFor="register-business" className="text-slate-300">Business Name</Label>
                    <Input
                      id="register-business"
                      value={registerForm.business_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, business_name: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      data-testid="register-business"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-address" className="text-slate-300">Business Address</Label>
                    <Input
                      id="register-address"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      data-testid="register-address"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={loading}
                data-testid="register-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

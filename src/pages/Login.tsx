import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Captcha State
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
  const [userCaptcha, setUserCaptcha] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Generate new math captcha
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, answer: (n1 + n2).toString() });
    setUserCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Force Light Mode for this page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const originalBackground = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'white';
    return () => {
      document.body.style.backgroundColor = originalBackground;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      generateCaptcha();
      return;
    }
    if (userCaptcha !== captcha.answer) {
      toast.error('Incorrect captcha answer');
      generateCaptcha();
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
        generateCaptcha();
      } else {
        toast.success('Access Granted - Welcome to Lab Guardian');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative font-sans overflow-hidden !bg-white">
      {/* Background Branding Image - Fills Screen */}
      <div
        className="absolute inset-0 z-0 animate-in fade-in duration-1000"
        style={{
          backgroundImage: "url('/logo_loign_backgorund.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Floating Login Card Panel */}
      <div className="absolute right-[5%] lg:right-[8%] xl:right-[12%] top-1/2 -translate-y-1/2 z-10 w-full max-w-[360px] animate-in fade-in zoom-in-95 duration-700">
        <div className="w-full space-y-4 p-8 rounded-[3rem] !bg-white/95 backdrop-blur-sm border border-black/[0.05] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)]">

          {/* Compressed Header Logos */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 rounded-full !bg-white flex items-center justify-center p-3 shadow-lg border border-gray-50">
              <img
                src="/panjab_logo.png"
                alt="Government of Punjab"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-16 h-16 rounded-full !bg-white flex items-center justify-center p-3 shadow-lg border border-gray-50">
              <img
                src="/cm_panjab.png"
                alt="Chief Minister Punjab"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-lg font-black tracking-[0.1em] uppercase font-display text-slate-900">
              LAB <span className="text-[#F59E0B]">MONITORING</span>
            </h1>
            <div className="h-[2px] w-12 bg-slate-900 mx-auto rounded-full opacity-20" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#F59E0B] transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter authorized email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="!bg-white border border-slate-200 pl-11 h-11 transition-all focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/5 rounded-xl font-medium text-slate-900 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                Security Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#F59E0B] transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="!bg-white border border-slate-200 pl-11 pr-11 h-11 transition-all focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/5 rounded-xl font-medium text-slate-900 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F59E0B] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Compressed Verification Section */}
            <div className="space-y-3 p-4 rounded-[2rem] bg-slate-50 border border-slate-200 group">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Verification Required
                </Label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-slate-300 hover:text-[#F59E0B] transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-center h-10 rounded-xl !bg-white border border-slate-200 text-xl font-bold tracking-widest font-mono shadow-sm">
                  <span className="text-[#F59E0B]">{captcha.num1}</span>
                  <span className="mx-2 text-slate-300">+</span>
                  <span className="text-[#F59E0B]">{captcha.num2}</span>
                </div>
                <Input
                  type="number"
                  placeholder="?"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="w-16 h-10 !bg-white border border-slate-200 text-center font-bold text-lg rounded-xl text-slate-900 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/5"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#F59E0B] hover:bg-[#E69300] text-white font-bold text-xs tracking-[0.2em] shadow-lg shadow-orange-500/20 transition-all rounded-xl uppercase active:scale-95 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {isLoading ? "Validating..." : "Get Login"}
            </Button>
          </form>

          {/* Compressed Footer */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              © 2026 Punjab Pk <br /> Secure Terminal
            </div>
            <div className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
              Powered by ITU
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
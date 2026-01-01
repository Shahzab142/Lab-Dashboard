import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Monitor, Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      generateCaptcha();
      return;
    }

    // Captcha Validation
    if (userCaptcha !== captcha.answer) {
      toast.error('Incorrect captcha answer');
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        generateCaptcha(); // Regenerate on failure
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 overflow-hidden relative">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-success/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <Card className="w-full max-w-md border border-white/10 bg-black/40 backdrop-blur-3xl relative z-10 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-700">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-in zoom-in-50 duration-700">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tight text-white italic">
              LAB <span className="text-primary">GUARDIAN</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80 font-medium">
              Secure Administration Portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@labguardian.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10 h-12 transition-all focus:bg-white/10 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">
                Security Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10 pr-12 h-12 transition-all focus:bg-white/10 focus:ring-primary/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Modern Math Captcha */}
            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5 group">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Human Verification
                </Label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-muted-foreground hover:text-primary transition-all hover:rotate-180 duration-500"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center justify-center h-12 rounded-lg bg-black/40 border border-white/10 text-xl font-black text-primary italic tracking-widest select-none">
                  {captcha.num1} + {captcha.num2} = ?
                </div>
                <Input
                  type="number"
                  placeholder="Ans"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="w-24 h-12 bg-white/5 border-white/10 text-center font-bold text-lg"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-md shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-5 h-5 mr-2" />
              )}
              AUTHENTICATE
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium opacity-50">
            Authorized Personnel Only • Encryption Active
          </p>
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-muted-foreground/30 text-xs font-mono">
        SYSTEM_ID: LG_V2_PRO
      </div>
    </div>
  );
}
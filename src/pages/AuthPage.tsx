import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import GlassCard from '../components/ui/GlassCard';

const DEFAULT_BG = '/assets/pixel-sunset.gif';

const LoginForm: React.FC<{ onSwitch: () => void; isLoading: boolean; error: string | null; signIn: (email: string, password: string) => Promise<void>; navigateBack: () => void }> = ({ onSwitch, isLoading, error, signIn, navigateBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <GlassCard className="max-w-md w-full space-y-5 text-text">
      <Button
        onClick={navigateBack}
        variant="ghost"
        size="sm"
        className="p-2 mb-2 self-start"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold">Sign In</h2>
        <p className="mt-2 text-center text-sm text-textSecondary">
          Don't have an account?{' '}
          <button type="button" className="font-medium text-primary hover:text-primary/90" onClick={onSwitch}>
            Sign up
          </button>
        </p>
      </div>
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4 w-full text-center">{error}</div>
      )}
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full appearance-none rounded-t-md border border-border bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full appearance-none rounded-b-md border border-border bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
};

const SignupForm: React.FC<{ onSwitch: () => void; isLoading: boolean; error: string | null; signUp: (email: string, password: string, displayName: string) => Promise<void>; navigateBack: () => void }> = ({ onSwitch, isLoading, error, signUp, navigateBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, password, displayName);
  };

  return (
    <GlassCard className="max-w-md w-full space-y-8 text-text">
      <Button
        onClick={navigateBack}
        variant="ghost"
        size="sm"
        className="p-2 mb-2 self-start"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold">Sign Up</h2>
        <p className="mt-2 text-center text-sm text-textSecondary">
          Already have an account?{' '}
          <button type="button" className="font-medium text-primary hover:text-primary/90" onClick={onSwitch}>
            Sign in
          </button>
        </p>
      </div>
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4 w-full text-center">{error}</div>
      )}
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="display-name" className="sr-only">Display Name</label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              required
              className="relative block w-full appearance-none rounded-t-md border border-border bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full appearance-none border border-border bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="relative block w-full appearance-none rounded-b-md border border-border bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
};

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, error, isLoading } = useAuthStore();
  const { getThemeClasses } = useThemeStore();
  const { text, accent, font } = getThemeClasses();
  const [backgroundUrl, setBackgroundUrl] = useState<string>(DEFAULT_BG);
  const [isLogin, setIsLogin] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setBackgroundUrl(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center ${font}`}
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and drop overlay (only before login) */}
      {isLogin && dragActive && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 pointer-events-none select-none">
          <div className="bg-white/80 text-lg font-semibold px-8 py-6 rounded-2xl shadow-xl border border-white/40 backdrop-blur-lg">
            Drop an image here to set as background
          </div>
        </div>
      )}
      <div className="relative z-20 w-full max-w-md flex flex-col items-center">
        {isLogin ? (
          <LoginForm
            onSwitch={() => setIsLogin(false)}
            isLoading={isLoading}
            error={error}
            signIn={signIn}
            navigateBack={() => navigate('/')}
          />
        ) : (
          <SignupForm
            onSwitch={() => setIsLogin(true)}
            isLoading={isLoading}
            error={error}
            signUp={signUp}
            navigateBack={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
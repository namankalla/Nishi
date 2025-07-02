import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import Button from '../components/ui/Button';
import { 
  BookOpen, 
  PenTool, 
  Calendar, 
  Search, 
  Palette, 
  Shield,
  ArrowRight,
  Star,
  Users,
  Heart
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import VariableProximity from '../components/ui/VariableProximity';

const DEFAULT_BG = '/assets/pixel-sunset.gif';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const containerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: PenTool,
      title: 'Expressive Writing',
      description: 'Rich text formatting, highlighting, and media embedding for truly creative journaling'
    },
    {
      icon: Palette,
      title: 'Beautiful Themes',
      description: 'Choose from 6 unique themes and custom wallpapers to personalize your journal'
    },
    {
      icon: Calendar,
      title: 'Calendar View',
      description: 'Navigate through your entries by date and track your journaling journey'
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find any entry instantly with powerful search across all your content'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your thoughts are protected with authentication and encryption'
    },
    {
      icon: BookOpen,
      title: 'Export & Share',
      description: 'Export your entries as PDF or share selected moments with others'
    }
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${DEFAULT_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s',
      }}
    >
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              
              <span className="text-2xl font-bold text-slate-900">NISHI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/auth')}
                variant="ghost"
                size="sm"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                variant="primary"
                size="sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-1 w-full flex flex-col items-center justify-center py-12 gap-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-12 px-4">
          {/* Hero Section - Centerpiece */}
          <div className="flex justify-center items-center w-full" style={{ minHeight: '40vh' }}>
            <GlassCard className="w-full max-w-7xl mx-auto py-12 px-6 md:px-12 flex flex-col items-center relative shadow-2xl">
              <section className="relative w-full">
                <div className="text-center" ref={containerRef} style={{ position: 'relative' }}>
                  <div className="mb-6">
                  
                  </div>
                  <div className="mb-6">
                    <VariableProximity
                      label={"NISHI"}
                      className="text-5xl md:text-6xl font-bold text-slate-900"
                      fromFontVariationSettings="'wght' 400, 'opsz' 9"
                      toFontVariationSettings="'wght' 1000, 'opsz' 40"
                      containerRef={containerRef}
                      radius={100}
                      falloff="linear"
                    />
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                    Your Digital
                    <span className="block" style={{ color: colors.primary }}>
                      Journal Awaits
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-900 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Experience the freedom of journaling like never before. Write, draw, highlight, and express yourself on a beautiful digital canvas that feels just like your favorite notebook.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <Button onClick={() => navigate('/auth')} variant="primary" size="lg" className="text-lg px-8 py-4">
                      Start Journaling Free
                      <ArrowRight size={20} className="ml-2" />
                    </Button>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-8 left-0 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-24 right-0 w-12 h-12 bg-orange-200 rounded-full opacity-30 animate-pulse delay-1000"></div>
                <div className="absolute bottom-8 left-8 w-20 h-20 bg-pink-200 rounded-full opacity-25 animate-pulse delay-2000"></div>
              </section>
            </GlassCard>
          </div>
          {/* Main Features & Main CTA Section - Side by Side */}
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 items-center">
            {/* Main Features Section */}
            <GlassCard className="w-full py-12 px-6 md:px-12 flex flex-col items-center relative shadow-2xl">
              <section className="relative w-full">
                <div className="text-center mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Features</h2>
                  <p className="text-lg md:text-xl text-slate-900 max-w-2xl mx-auto mb-8">NISHI combines the best of traditional journaling with modern digital tools to give you a beautiful, expressive, and secure journaling experience.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center text-center p-4">
                      <feature.icon size={40} className="mb-3" style={{ color: colors.primary }} />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-slate-900 text-base">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </GlassCard>
          </div>
        </div>
        {/* Footer */}
        <GlassCard className="w-full max-w-2xl mx-auto flex flex-col items-center py-6 px-4 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center w-full">
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
              <BookOpen size={24} style={{ color: colors.primary }} />
              <span className="text-xl font-bold">NISHI</span>
            </div>
            <div className="text-slate-900 text-sm text-center w-full md:w-auto">
              © 2025 NISHI. Made with 💙 for journalers everywhere.
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LandingPage;
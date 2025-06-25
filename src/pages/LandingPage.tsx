import React from 'react';
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

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();

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
      description: 'Your thoughts are protected with Firebase authentication and encryption'
    },
    {
      icon: BookOpen,
      title: 'Export & Share',
      description: 'Export your entries as PDF or share selected moments with others'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Creative Writer',
      content: 'NISHI feels like writing in a real diary. The freedom to express myself without constraints is incredible.',
      rating: 5
    },
    {
      name: 'Marcus Johnson',
      role: 'Student',
      content: 'Perfect for daily reflection. The themes and customization options make journaling enjoyable.',
      rating: 5
    },
    {
      name: 'Elena Rodriguez',
      role: 'Therapist',
      content: 'I recommend NISHI to my clients. The interface encourages authentic self-expression.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen size={32} style={{ color: colors.primary }} />
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mb-8">
              <BookOpen size={80} className="mx-auto mb-6" style={{ color: colors.primary }} />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
              Your Digital
              <span className="block" style={{ color: colors.primary }}>
                Journal Awaits
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-900 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the freedom of journaling like never before. Write, draw, highlight, and express yourself 
              on a beautiful digital canvas that feels just like your favorite notebook.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                onClick={() => navigate('/auth')}
                variant="primary"
                size="lg"
                className="text-lg px-8 py-4"
              >
                Start Journaling Free
                <ArrowRight size={20} className="ml-2" />
              </Button>
              
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4"
              >
                Try Demo Account
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-900">
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                10,000+ users
              </div>
              <div className="flex items-center">
                <Heart size={16} className="mr-2" />
                100% free
              </div>
              <div className="flex items-center">
                <Shield size={16} className="mr-2" />
                Secure & private
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-orange-200 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-200 rounded-full opacity-25 animate-pulse delay-2000"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Journal
            </h2>
            <p className="text-xl text-slate-900 max-w-2xl mx-auto">
              NISHI combines the best of traditional journaling with modern digital tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="mb-6">
                  <feature.icon 
                    size={48} 
                    className="group-hover:scale-110 transition-transform duration-300"
                    style={{ color: colors.primary }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-900 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Loved by Journalers Everywhere
            </h2>
            <p className="text-xl text-slate-900">
              See what our community has to say about their NISHI experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-slate-900 mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-semibold text-slate-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-slate-900">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join thousands of people who have made journaling a beautiful part of their daily routine
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              variant="secondary"
              size="lg"
              className="text-lg px-8 py-4 bg-white text-slate-900 hover:bg-slate-100"
            >
              Create Your Account
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
          
          <p className="text-white/80 text-sm mt-6">
            No credit card required • Free forever • Start in 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <BookOpen size={24} style={{ color: colors.primary }} />
              <span className="text-xl font-bold">NISHI</span>
            </div>
            
            <div className="text-slate-900 text-sm">
              © 2024 NISHI. Made with ❤️ for journalers everywhere.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTimeCapsuleStore } from '../store/useTimeCapsuleStore';
import { useThemeStore } from '../store/useThemeStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';
import {
  BookOpen,
  Plus,
  Search,
  Settings,
  LogOut,
  Clock,
  Lock,
  Unlock,
  Calendar as CalendarIcon,
  List,
  ArrowLeft
} from 'lucide-react';
import { format, isBefore, isAfter, differenceInDays } from 'date-fns';

const TimeCapsuleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuthStore();
  const { 
    capsules, 
    loadCapsules, 
    searchQuery, 
    setSearchQuery, 
    getFilteredCapsules,
    setCurrentCapsule,
    markAsOpened
  } = useTimeCapsuleStore();
  const { 
    customWallpaper,
    getThemeColors 
  } = useThemeStore();
  
  const [viewMode, setViewMode] = useState<'all' | 'locked' | 'unlocked'>('all');
  
  const colors = getThemeColors();
  const filteredCapsules = getFilteredCapsules();
  
  // Filter by lock status
  const displayCapsules = filteredCapsules.filter(capsule => {
    const isLocked = isBefore(new Date(), new Date(capsule.openDate));
    if (viewMode === 'locked') return isLocked;
    if (viewMode === 'unlocked') return !isLocked;
    return true;
  });
  
  useEffect(() => {
    console.log('[TIME CAPSULE LIST] User:', user);
    console.log('[TIME CAPSULE LIST] Capsules:', capsules);
    if (user && capsules.length === 0) {
      loadCapsules(user.uid);
    }
  }, [user, capsules.length]);
  
  const handleCreateCapsule = () => {
    setCurrentCapsule(null);
    navigate('/time-capsule');
  };
  
  const handleEditCapsule = async (capsule: any) => {
    const isLocked = isBefore(new Date(), new Date(capsule.openDate));
    
    if (!isLocked && !capsule.isOpened) {
      // Mark as opened when first accessed after open date
      await markAsOpened(capsule.id);
    }
    
    setCurrentCapsule(capsule);
    navigate('/time-capsule');
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const getCapsuleStatus = (capsule: any) => {
    const now = new Date();
    const openDate = new Date(capsule.openDate);
    const isLocked = isBefore(now, openDate);
    
    if (isLocked) {
      const daysLeft = differenceInDays(openDate, now);
      return {
        icon: Lock,
        text: daysLeft === 0 ? 'Opens today' : `${daysLeft} days left`,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50'
      };
    } else {
      return {
        icon: Unlock,
        text: capsule.isOpened ? 'Opened' : 'Ready to open',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
  };
  
  // Loading guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-900">Loading...</div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: customWallpaper ? `url(${customWallpaper})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className={`min-h-screen ${!customWallpaper ? colors.background : 'bg-black bg-opacity-40'}`}>
        {/* Header */}
        <div className="py-6 px-2 max-w-6xl mx-auto">
          <GlassCard className="w-full p-0">
            <div className="px-4 py-4 flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => navigate('/home')}
                  variant="ghost"
                  size="sm"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Journal
                </Button>
                <Clock size={32} style={{ color: colors.primary }} />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Time Capsules</h1>
                  <p className="text-sm text-slate-600">Messages to your future self</p>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button onClick={handleCreateCapsule} variant="primary">
                  <Plus size={16} className="mr-2" />
                  New Time Capsule
                </Button>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut size={20} className="text-slate-900" />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Search and View Controls */}
            <div className="lg:col-span-1">
              <GlassCard className="p-6 mb-6">
                <Input
                  type="text"
                  placeholder="Search your time capsules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="search"
                  fullWidth
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-900">
                    {displayCapsules.length} {displayCapsules.length === 1 ? 'capsule' : 'capsules'}
                  </span>
                </div>
                
                {/* Filter buttons */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      viewMode === 'all' 
                        ? 'text-white shadow-sm' 
                        : 'hover:bg-slate-100 text-slate-900'
                    }`}
                    style={viewMode === 'all' ? { backgroundColor: colors.primary, color: colors.accent } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <span>All Capsules</span>
                      <span className="text-sm opacity-75">{filteredCapsules.length}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('locked')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      viewMode === 'locked' 
                        ? 'text-white shadow-sm' 
                        : 'hover:bg-slate-100 text-slate-900'
                    }`}
                    style={viewMode === 'locked' ? { backgroundColor: colors.primary, color: colors.accent } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock size={16} />
                        <span>Sealed</span>
                      </div>
                      <span className="text-sm opacity-75">
                        {filteredCapsules.filter(c => isBefore(new Date(), new Date(c.openDate))).length}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('unlocked')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      viewMode === 'unlocked' 
                        ? 'text-white shadow-sm' 
                        : 'hover:bg-slate-100 text-slate-900'
                    }`}
                    style={viewMode === 'unlocked' ? { backgroundColor: colors.primary, color: colors.accent } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Unlock size={16} />
                        <span>Ready to Open</span>
                      </div>
                      <span className="text-sm opacity-75">
                        {filteredCapsules.filter(c => !isBefore(new Date(), new Date(c.openDate))).length}
                      </span>
                    </div>
                  </button>
                </div>
              </GlassCard>
            </div>
            
            {/* Right Panel - Time Capsules */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {displayCapsules.length === 0 ? (
                  <GlassCard className="p-12 text-center">
                    <Clock size={48} className="mx-auto mb-4 text-slate-900" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      {searchQuery ? 'No capsules found' : 'No time capsules yet'}
                    </h3>
                    <p className="text-slate-900 mb-6">
                      {searchQuery 
                        ? 'Try adjusting your search terms' 
                        : 'Create your first time capsule to send a message to your future self'
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={handleCreateCapsule} variant="primary">
                        <Plus size={16} className="mr-2" />
                        Create First Time Capsule
                      </Button>
                    )}
                  </GlassCard>
                ) : (
                  displayCapsules.map((capsule) => {
                    const status = getCapsuleStatus(capsule);
                    const StatusIcon = status.icon;
                    
                    return (
                      <GlassCard
                        key={capsule.id}
                        className="p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        <div onClick={() => handleEditCapsule(capsule)}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 mb-1">
                                {capsule.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <span>Opens: {format(new Date(capsule.openDate), 'MMM d, yyyy')}</span>
                                <span>Created: {format(new Date(capsule.createdAt), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${status.bgColor}`}>
                              <StatusIcon size={14} className={status.color} />
                              <span className={`text-xs font-medium ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-slate-900 line-clamp-3 mb-4">
                            {isBefore(new Date(), new Date(capsule.openDate)) 
                              ? 'This time capsule is sealed until its opening date...'
                              : capsule.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                            }
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              {capsule.mood && (
                                <span>Mood: {capsule.mood}</span>
                              )}
                              {capsule.weather && (
                                <span>Weather: {capsule.weather}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                              {capsule.mediaElements && capsule.mediaElements.length > 0 && (
                                <span>{capsule.mediaElements.length} media</span>
                              )}
                              {capsule.stickies && capsule.stickies.length > 0 && (
                                <span>{capsule.stickies.length} notes</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeCapsuleListPage; 
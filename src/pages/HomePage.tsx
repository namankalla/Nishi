import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useJournalStore } from '../store/useJournalStore';
import { useTimeCapsuleStore } from '../store/useTimeCapsuleStore';
import { useThemeStore } from '../store/useThemeStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Calendar from '../components/ui/Calendar';
import Modal from '../components/ui/Modal';
import GlassCard from '../components/ui/GlassCard';
import {
  BookOpen,
  Plus,
  Search,
  Settings,
  LogOut,
  Upload,
  Calendar as CalendarIcon,
  List,
  Palette,
  Clock,
  Lock,
  Unlock,
  ArrowRight,
  User,
  Leaf
} from 'lucide-react';
import { format, isBefore } from 'date-fns';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading, updateDisplayName, error: authError } = useAuthStore();
  const { 
    entries, 
    loadEntries, 
    searchQuery, 
    setSearchQuery, 
    getFilteredEntries,
    selectedDate,
    setSelectedDate,
    setCurrentEntry
  } = useJournalStore();
  const {
    capsules,
    loadCapsules
  } = useTimeCapsuleStore();
  const { 
    currentTheme, 
    setTheme, 
    customWallpaper, 
    setCustomWallpaper,
    customJournalWallpaper,
    setCustomJournalWallpaper,
    getThemeColors 
  } = useThemeStore();
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showSettings, setShowSettings] = useState(false);
  
  const colors = getThemeColors();
  const filteredEntries = getFilteredEntries();
  
  // Get recent time capsules for quick access
  const recentCapsules = capsules.slice(0, 3);
  const readyToOpenCapsules = capsules.filter(c => !isBefore(new Date(), new Date(c.openDate)) && !c.isOpened);
  
  // Preset HomePage backgrounds (GIFs) - use local assets
  const HOMEPAGE_BACKGROUNDS = [
    {
      url: '/assets/HBG1.gif',
      type: 'gif',
      label: 'Valley Sunset (Default)'
    },
    {
      url: '/assets/HBG2.gif',
      type: 'gif',
      label: 'Cat in the Rain'
    },
    {
      url: '/assets/HBG3.gif',
      type: 'gif',
      label: 'Bonfire'
    }
  ];
  
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [displayNameStatus, setDisplayNameStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('[NISHI DEBUG] User:', user);
    console.log('[NISHI DEBUG] Entries:', entries);
    if (user && entries.length === 0) {
      loadEntries(user.uid);
    }
    if (user && capsules.length === 0) {
      loadCapsules(user.uid);
    }
    setDisplayNameInput(user?.displayName || '');
  }, [user, entries.length, capsules.length]);
  
  // Set default homepage background if not set
  useEffect(() => {
    if (!customWallpaper) {
      setCustomWallpaper(HOMEPAGE_BACKGROUNDS[0].url);
    }
    // eslint-disable-next-line
  }, []);
  
  const handleCreateEntry = () => {
    setCurrentEntry(null);
    navigate('/journal');
  };
  
  const handleEditEntry = (entry: any) => {
    setCurrentEntry(entry);
    navigate('/journal');
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const handleSelectHomepageBg = (url: string) => {
    setCustomWallpaper(url);
  };
  
  const handleJournalWallpaperUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomJournalWallpaper(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const themes = [
    { id: 'sunset', name: 'Sunset', color: '#FFE16D' },
    { id: 'ocean', name: 'Ocean', color: '#6EABC6' },
    { id: 'forest', name: 'Forest', color: '#4ADE80' },
    { id: 'lavender', name: 'Lavender', color: '#C084FC' },
    { id: 'autumn', name: 'Autumn', color: '#FB923C' },
    { id: 'midnight', name: 'Midnight', color: '#253E4C' }
  ];
  
  useEffect(() => {
    setDisplayNameInput(user?.displayName || '');
  }, [user?.displayName, showSettings]);
  
  const handleDisplayNameSave = async () => {
    if (!displayNameInput.trim()) {
      setDisplayNameError('Display name cannot be empty.');
      return;
    }
    setDisplayNameStatus('saving');
    setDisplayNameError(null);
    try {
      await updateDisplayName(displayNameInput.trim());
      setDisplayNameStatus('success');
      setTimeout(() => setDisplayNameStatus('idle'), 1500);
    } catch (err: any) {
      setDisplayNameStatus('error');
      setDisplayNameError(err.message || 'Failed to update display name.');
    }
  };
  
  // Loading guard: don't render HomePage until auth is ready
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
                <BookOpen size={32} style={{ color: colors.primary }} />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.displayName || 'User'}</h1>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button onClick={handleCreateEntry} variant="primary">
                  <Plus size={16} className="mr-2" />
                  New Entry
                </Button>
                <Button onClick={() => navigate('/time-capsules')} variant="secondary">
                  <Clock size={16} className="mr-2" />
                  Time Capsules
                </Button>
                <Button onClick={() => navigate('/garden')} variant="outline">
                  <Leaf size={16} className="mr-2" />
                  My Garden
                </Button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Settings size={20} className="text-slate-900" />
                </button>
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

        {/* Time Capsule Notifications */}
        {readyToOpenCapsules.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mb-6">
            <GlassCard className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Unlock size={24} className="text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-800">
                      {readyToOpenCapsules.length} Time Capsule{readyToOpenCapsules.length > 1 ? 's' : ''} Ready to Open!
                    </h3>
                    <p className="text-sm text-amber-700">
                      Your messages from the past are waiting for you.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/time-capsules')}
                  variant="primary"
                  size="sm"
                >
                  Open Now
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
        
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Search and View Controls */}
            <div className="lg:col-span-1">
              <GlassCard className="p-6 mb-6">
                <Input
                  type="text"
                  placeholder="Search your entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="search"
                  fullWidth
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-900">
                    {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' 
                          ? 'text-white shadow-sm' 
                          : 'hover:bg-slate-100 text-slate-900'
                      }`}
                      style={viewMode === 'list' ? { backgroundColor: colors.primary, color: colors.accent } : {}}
                    >
                      <List size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'calendar' 
                          ? 'text-white shadow-sm' 
                          : 'hover:bg-slate-100 text-slate-900'
                      }`}
                      style={viewMode === 'calendar' ? { backgroundColor: colors.primary, color: colors.accent } : {}}
                    >
                      <CalendarIcon size={16} />
                    </button>
                  </div>
                </div>
              </GlassCard>

              {/* Time Capsule Introduction Card */}
              <GlassCard className="p-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Clock size={32} className="text-black-000" />
                  </div>
                  <h3 className="text-lg font-semibold text-black-000 mb-2">
                    Introducing Time Capsule Journals
                  </h3>
                  <p className="text-sm text-black-000 mb-4">
                    Write journal entries to your future self and set them to open on a specific date and time.
                  </p>
                  <Button 
                    onClick={() => navigate('/time-capsules')}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    <Clock size={16} className="mr-2" />
                    Create Time Capsule
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </GlassCard>

              {/* Time Capsules Quick Access */}
              {recentCapsules.length > 0 && (
                <GlassCard className="p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center">
                      <Clock size={16} className="mr-2" />
                      Time Capsules
                    </h3>
                    <Button
                      onClick={() => navigate('/time-capsules')}
                      variant="ghost"
                      size="sm"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentCapsules.map(capsule => {
                      const isLocked = isBefore(new Date(), new Date(capsule.openDate));
                      return (
                        <div
                          key={capsule.id}
                          className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate('/time-capsules')}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-slate-900 truncate">
                                {capsule.title}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {format(new Date(capsule.openDate), 'MMM d, yyyy \'at\' h:mm a')}
                              </p>
                            </div>
                            {isLocked ? (
                              <Lock size={14} className="text-amber-500" />
                            ) : (
                              <Unlock size={14} className="text-green-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
              
              {/* Calendar Widget */}
              {viewMode === 'calendar' && (
                <GlassCard className="p-4">
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    entryDates={entries.map(entry => entry.date)}
                  />
                </GlassCard>
              )}
            </div>
            
            {/* Right Panel - Entries */}
            <div className="lg:col-span-2">
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  {filteredEntries.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                      <BookOpen size={48} className="mx-auto mb-4 text-slate-900" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        {searchQuery ? 'No entries found' : 'No entries yet'}
                      </h3>
                      <p className="text-slate-900 mb-6">
                        {searchQuery 
                          ? 'Try adjusting your search terms' 
                          : 'Start journaling by creating your first entry'
                        }
                      </p>
                      {!searchQuery && (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button onClick={handleCreateEntry} variant="primary">
                            <Plus size={16} className="mr-2" />
                            Create First Entry
                          </Button>
                          <Button onClick={() => navigate('/time-capsules')} variant="outline">
                            <Clock size={16} className="mr-2" />
                            Create Time Capsule
                          </Button>
                        </div>
                      )}
                    </GlassCard>
                  ) : (
                    filteredEntries.map((entry) => (
                      <GlassCard
                        key={entry.id}
                        className="p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        <div onClick={() => handleEditEntry(entry)}>
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                              {entry.title}
                            </h3>
                            <span className="text-sm text-slate-900">
                              {format(entry.date, 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-slate-900 line-clamp-3 mb-4">
                            {(() => {
                              const plain = entry.content.replace(/<[^>]*>/g, '');
                              const firstLine = plain.split(/\r?\n|\./)[0];
                              return firstLine;
                            })()}
                          </p>
                          {entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {entry.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs rounded-full"
                                  style={{ 
                                    backgroundColor: `${colors.primary}20`, 
                                    color: colors.accent 
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              ) : (
                // Calendar view with selected date entry
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  {(() => {
                    const entryForDate = entries.find(entry => 
                      entry.date.toDateString() === selectedDate.toDateString()
                    );
                    return entryForDate ? (
                      <div
                        onClick={() => handleEditEntry(entryForDate)}
                        className="cursor-pointer group"
                      >
                        <h4 className="font-medium text-slate-900 group-hover:text-slate-700 mb-2">
                          {entryForDate.title}
                        </h4>
                        <p className="text-slate-900 line-clamp-4">
                          {(() => {
                            const plain = entryForDate.content.replace(/<[^>]*>/g, '');
                            const firstLine = plain.split(/\r?\n|\./)[0];
                            return firstLine;
                          })()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-900 mb-4">No entry for this date</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button onClick={handleCreateEntry} variant="outline">
                            <Plus size={16} className="mr-2" />
                            Create Entry
                          </Button>
                          <Button onClick={() => navigate('/time-capsules')} variant="ghost">
                            <Clock size={16} className="mr-2" />
                            Create Time Capsule
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </GlassCard>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="py-6 px-4 bg-slate-900 text-white text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} NISHI Journaling App. All rights reserved.
          </p>
        </div>
        {/* Settings Modal */}
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Settings"
          size="lg"
        >
          <div className="space-y-6">
            {/* Display Name Update Section */}
            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Display Name
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Input
                  type="text"
                  value={displayNameInput}
                  onChange={e => setDisplayNameInput(e.target.value)}
                  placeholder="Enter your display name"
                  className="flex-1"
                />
                <Button
                  onClick={handleDisplayNameSave}
                  variant="primary"
                  disabled={displayNameStatus === 'saving' || displayNameInput.trim() === user?.displayName}
                >
                  {displayNameStatus === 'saving' ? 'Saving...' : 'Save'}
                </Button>
              </div>
              {displayNameStatus === 'success' && (
                <div className="text-green-600 text-sm mt-2">Display name updated!</div>
              )}
              {displayNameError && (
                <div className="text-red-600 text-sm mt-2">{displayNameError}</div>
              )}
            </GlassCard>
            
            {/* Theme Selection */}
            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Palette size={20} className="mr-2" />
                Theme
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id as any)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      ${currentTheme === theme.id 
                        ? 'border-slate-900 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </GlassCard>
            
            {/* Custom Wallpaper (Preset GIFs) */}
            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Upload size={20} className="mr-2" />
                Homepage Background
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {HOMEPAGE_BACKGROUNDS.map(bg => (
                  <button
                    key={bg.url}
                    onClick={() => handleSelectHomepageBg(bg.url)}
                    className={`rounded-lg border-2 overflow-hidden transition-all duration-200 focus:outline-none ${customWallpaper === bg.url ? 'border-blue-600 shadow-lg' : 'border-slate-200 hover:border-slate-400'}`}
                    style={{ padding: 0 }}
                    aria-label={bg.label}
                    disabled={!!(customWallpaper && !HOMEPAGE_BACKGROUNDS.some(p => p.url === customWallpaper))}
                  >
                    <img
                      src={bg.url}
                      alt={bg.label}
                      className="w-full h-28 object-cover"
                    />
                    <div className={`text-xs text-center py-1 ${customWallpaper === bg.url ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>{bg.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mb-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCustomWallpaper(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors cursor-pointer">
                    <Upload size={20} className="mx-auto mb-1 text-slate-900" />
                    <span className="text-xs text-slate-900">Upload Custom</span>
                  </div>
                </label>
                {customWallpaper && !HOMEPAGE_BACKGROUNDS.some(bg => bg.url === customWallpaper) && (
                  <div className="flex flex-col items-center">
                    <img src={customWallpaper} alt="Custom" className="w-24 h-16 object-cover rounded mb-1 border border-slate-300" />
                    <Button
                      onClick={() => setCustomWallpaper(null)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Choose an animated or custom background for your HomePage.
              </div>
            </GlassCard>
            
            {/* Journal Wallpaper Section */}
            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Upload size={20} className="mr-2" />
                Journal Wallpaper
              </h4>
              <div className="flex items-center space-x-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleJournalWallpaperUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
                    <Upload size={24} className="mx-auto mb-2 text-slate-900" />
                    <p className="text-sm text-slate-900">
                      Click to upload a journal background image
                    </p>
                  </div>
                </label>
              </div>
              {customJournalWallpaper && (
                <div className="mt-4">
                  <Button
                    onClick={() => setCustomJournalWallpaper(null)}
                    variant="outline"
                    size="sm"
                  >
                    Remove Journal Wallpaper
                  </Button>
                </div>
              )}
            </GlassCard>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default HomePage;
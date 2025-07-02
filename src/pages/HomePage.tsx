import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useJournalStore } from '../store/useJournalStore';
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
  Palette
} from 'lucide-react';
import { format } from 'date-fns';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuthStore();
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
  
  useEffect(() => {
    console.log('[NISHI DEBUG] User:', user);
    console.log('[NISHI DEBUG] Entries:', entries);
    if (user && entries.length === 0) {
      loadEntries(user.uid);
    }
  }, [user, entries.length]);
  
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
  
  const handleWallpaperUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomWallpaper(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
                        <Button onClick={handleCreateEntry} variant="primary">
                          <Plus size={16} className="mr-2" />
                          Create First Entry
                        </Button>
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
                            {entry.content.replace(/<[^>]*>/g, '')}
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
                          {entryForDate.content.replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-900 mb-4">No entry for this date</p>
                        <Button onClick={handleCreateEntry} variant="outline">
                          <Plus size={16} className="mr-2" />
                          Create Entry
                        </Button>
                      </div>
                    );
                  })()}
                </GlassCard>
              )}
            </div>
          </div>
        </div>
        {/* Settings Modal */}
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Settings"
          size="lg"
        >
          <div className="space-y-6">
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
            {/* Custom Wallpaper */}
            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Upload size={20} className="mr-2" />
                Custom Wallpaper
              </h4>
              <div className="flex items-center space-x-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWallpaperUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
                    <Upload size={24} className="mx-auto mb-2 text-slate-900" />
                    <p className="text-sm text-slate-900">
                      Click to upload a background image
                    </p>
                  </div>
                </label>
              </div>
              {customWallpaper && (
                <div className="mt-4">
                  <Button
                    onClick={() => setCustomWallpaper(null)}
                    variant="outline"
                    size="sm"
                  >
                    Remove Wallpaper
                  </Button>
                </div>
              )}
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
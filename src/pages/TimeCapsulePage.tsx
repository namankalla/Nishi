import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTimeCapsuleStore } from '../store/useTimeCapsuleStore';
import { useThemeStore } from '../store/useThemeStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  ArrowLeft,
  Save,
  Trash2,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Image,
  Video,
  Smile,
  Calendar,
  Cloud,
  Clock,
  Lock,
  Unlock
} from 'lucide-react';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import GlassCard from '../components/ui/GlassCard';

const PAGE_COLORS = [
  { name: 'White', value: '#fff' },
  { name: 'Skin', value: '#fbeee6' },
  { name: 'Brown', value: '#bfa074' },
  { name: 'Black', value: '#222' }
];
const PAGE_STYLES = [
  { name: 'Blank', value: 'blank' },
  { name: 'Lined', value: 'lined' }
];
const STICKY_COLORS = [
  { name: 'Green', value: '#b9fbc0' },
  { name: 'Yellow', value: '#fff9b0' },
  { name: 'Pink', value: '#ffb3c6' }
];
const LINE_COLORS = [
  { name: 'Black', value: '#222' },
  { name: 'White', value: '#fff' },
  { name: 'Brown', value: '#bfa074' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#ffe066' }
];

const TimeCapsulePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentCapsule, 
    createCapsule, 
    updateCapsule, 
    deleteCapsule,
    isLoading
  } = useTimeCapsuleStore();
  const { getThemeColors, customJournalWallpaper } = useThemeStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openDate, setOpenDate] = useState(() => {
    const tomorrow = addDays(new Date(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });
  const [openTime, setOpenTime] = useState('09:00');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const colors = getThemeColors();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [pageColor, setPageColor] = useState(PAGE_COLORS[0].value);
  const [pageStyle, setPageStyle] = useState(PAGE_STYLES[1].value);
  const [stickies, setStickies] = useState<any[]>([]);
  const [mediaElements, setMediaElements] = useState<any[]>([]);
  const stickyId = useRef(0);
  const mediaId = useRef(0);
  const [lineColor, setLineColor] = useState(
    pageColor === '#fff' ? '#222' : LINE_COLORS[0].value
  );

  // Check if the capsule can be opened
  const canOpen = currentCapsule ? !isBefore(new Date(), new Date(currentCapsule.openDate)) : true;
  
  useEffect(() => {
    if (currentCapsule) {
      console.log('Loading existing time capsule:', currentCapsule);
      setTitle(currentCapsule.title);
      setContent(currentCapsule.content);
      
      const openDateTime = new Date(currentCapsule.openDate);
      setOpenDate(format(openDateTime, 'yyyy-MM-dd'));
      setOpenTime(format(openDateTime, 'HH:mm'));
      
      setMood(currentCapsule.mood || '');
      setWeather(currentCapsule.weather || '');
      setIsLocked(!canOpen);
      
      if (currentCapsule.mediaElements) {
        setMediaElements(currentCapsule.mediaElements);
        const maxMediaId = Math.max(...currentCapsule.mediaElements.map((m: any) => m.id), 0);
        mediaId.current = maxMediaId + 1;
      } else {
        setMediaElements([]);
      }
      
      if (currentCapsule.stickies) {
        setStickies(currentCapsule.stickies);
        const maxStickyId = Math.max(...currentCapsule.stickies.map((s: any) => s.id), 0);
        stickyId.current = maxStickyId + 1;
      } else {
        setStickies([]);
      }
      
      if (contentRef.current && canOpen) {
        contentRef.current.innerHTML = currentCapsule.content;
      }
    } else {
      // New time capsule
      const tomorrow = addDays(new Date(), 1);
      setTitle(`Time Capsule for ${format(tomorrow, 'MMMM d, yyyy')}`);
      setContent('');
      setOpenDate(format(tomorrow, 'yyyy-MM-dd'));
      setOpenTime('09:00');
      setMood('');
      setWeather('');
      setMediaElements([]);
      setStickies([]);
      setIsLocked(false);
      
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
    }
    setIsModified(false);
  }, [currentCapsule, canOpen]);
  
  useEffect(() => {
    if (pageColor === '#fff') setLineColor('#222');
  }, [pageColor]);
  
  const handleContentChange = () => {
    if (contentRef.current && !isLocked) {
      const newContent = contentRef.current.innerHTML;
      setContent(newContent);
      setIsModified(true);
    }
  };
  
  const applyFormat = (command: string, value?: string) => {
    if (isLocked) return;
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    handleContentChange();
  };
  
  const applyHighlight = (color: string) => {
    if (isLocked) return;
    document.execCommand('hiliteColor', false, color);
    contentRef.current?.focus();
    handleContentChange();
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Combine date and time into a single Date object
    const openDateTime = new Date(`${openDate}T${openTime}`);
    
    const capsuleData = {
      title: title.trim() || 'Untitled Time Capsule',
      content,
      openDate: openDateTime,
      mood,
      weather,
      mediaElements: mediaElements,
      stickies: stickies
    };
    
    try {
      if (currentCapsule) {
        await updateCapsule(currentCapsule.id, capsuleData);
      } else {
        await createCapsule(user.uid, capsuleData);
      }
      setIsModified(false);
      navigate('/time-capsules');
    } catch (error) {
      console.error('Failed to save time capsule:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!currentCapsule) return;
    
    if (window.confirm('Are you sure you want to delete this time capsule?')) {
      try {
        await deleteCapsule(currentCapsule.id);
        navigate('/time-capsules');
      } catch (error) {
        console.error('Failed to delete time capsule:', error);
      }
    }
  };
  
  const moods = [
    { emoji: '😊', name: 'Happy' },
    { emoji: '😢', name: 'Sad' },
    { emoji: '😡', name: 'Angry' },
    { emoji: '😴', name: 'Tired' },
    { emoji: '🤔', name: 'Thoughtful' },
    { emoji: '😌', name: 'Peaceful' },
    { emoji: '😤', name: 'Frustrated' },
    { emoji: '🥰', name: 'Loved' },
    { emoji: '🤗', name: 'Hopeful' },
    { emoji: '✨', name: 'Excited' }
  ];
  
  const weatherOptions = [
    { emoji: '☀️', name: 'Sunny' },
    { emoji: '⛅', name: 'Partly Cloudy' },
    { emoji: '☁️', name: 'Cloudy' },
    { emoji: '🌧️', name: 'Rainy' },
    { emoji: '⛈️', name: 'Stormy' },
    { emoji: '❄️', name: 'Snowy' },
    { emoji: '🌫️', name: 'Foggy' },
    { emoji: '🌪️', name: 'Windy' }
  ];

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (isLocked) return;
    
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      if (!storage) {
        throw new Error('Storage service not available. Please refresh the page and try again.');
      }
      
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size too large. Maximum size is 50MB. Current file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
      
      if (type === 'image' && !allowedImageTypes.includes(file.type)) {
        throw new Error(`Invalid image format. Allowed formats: ${allowedImageTypes.join(', ')}`);
      }
      
      if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
        throw new Error(`Invalid video format. Allowed formats: ${allowedVideoTypes.join(', ')}`);
      }
      
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
      const storageRef = ref(storage, `time_capsule_uploads/${user.uid}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        },
        async () => {
          setUploadProgress(100);
          try {
            const url = await getDownloadURL(storageRef);
            
            const newMediaElement = {
              id: mediaId.current++,
              type: type,
              url: url,
              x: 100 + Math.random() * 200,
              y: 100 + Math.random() * 200,
              width: type === 'image' ? 200 : 300,
              height: type === 'image' ? 150 : 169,
              rotation: 0,
              aspectRatio: type === 'image' ? null : 16/9
            };
            
            setMediaElements(prev => [...prev, newMediaElement]);
            setIsModified(true);
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            throw new Error('Failed to get download URL after upload');
          }
        }
      );
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, () => resolve());
      });
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      
      let errorMessage = 'Failed to upload file.';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'Upload unauthorized. Please check your permissions.';
      } else if (err.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please try a smaller file.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  const addSticky = (color: string) => {
    if (isLocked) return;
    setStickies([
      ...stickies,
      {
        id: stickyId.current++,
        color,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        text: ''
      }
    ]);
  };

  const updateSticky = (id: number, updates: any) => {
    if (isLocked) return;
    setStickies(stickies.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSticky = (id: number) => {
    if (isLocked) return;
    setStickies(stickies.filter(s => s.id !== id));
  };
  
  const updateMediaElement = (id: number, updates: any) => {
    if (isLocked) return;
    setMediaElements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    setIsModified(true);
  };
  
  const removeMediaElement = (id: number) => {
    if (isLocked) return;
    setMediaElements(prev => prev.filter(m => m.id !== id));
    setIsModified(true);
  };

  const daysUntilOpen = currentCapsule ? Math.ceil((new Date(currentCapsule.openDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  return (
    <div
      className={`min-h-screen ${!customJournalWallpaper ? colors.background : ''}`}
      style={customJournalWallpaper
        ? {
            backgroundImage: `url(${customJournalWallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }
        : {}}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/time-capsules')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              
              <div className="flex items-center space-x-2">
                {isLocked ? (
                  <Lock size={16} className="text-amber-500" />
                ) : (
                  <Unlock size={16} className="text-green-500" />
                )}
                <div className="text-sm text-black">
                  {currentCapsule ? (isLocked ? `Locked until ${format(new Date(currentCapsule.openDate), 'MMM d, yyyy \'at\' h:mm a')}` : 'Time capsule opened!') : 'New time capsule'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentCapsule && !isLocked && (
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  size="sm"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              )}
              
              {!isLocked && (
                <Button
                  onClick={handleSave}
                  variant="primary"
                  isLoading={isLoading}
                  disabled={!isModified && !currentCapsule}
                >
                  <Save size={16} className="mr-2" />
                  {currentCapsule ? 'Update' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Locked State Banner */}
      {isLocked && (
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Lock size={24} className="text-amber-600" />
                <Clock size={24} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-amber-800 mb-1">
                Time Capsule Sealed
              </h3>
              <p className="text-amber-700">
                This time capsule will open on {format(new Date(currentCapsule!.openDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </p>
              <p className="text-sm text-black mt-1">
                {daysUntilOpen > 0 ? `${daysUntilOpen} days remaining` : 'Opening today!'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Editor */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!isLocked && (
          <GlassCard className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-black">Page Color:</span>
              {PAGE_COLORS.map(opt => (
                <button
                  key={opt.value}
                  className={`w-6 h-6 rounded-full border-2 ${pageColor === opt.value ? 'border-slate-900' : 'border-slate-300'}`}
                  style={{ background: opt.value }}
                  onClick={() => setPageColor(opt.value)}
                  aria-label={opt.name}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-2 ml-6">
              <span className="text-sm text-black">Page Style:</span>
              {PAGE_STYLES.map(opt => (
                <button
                  key={opt.value}
                  className={`px-2 py-1 rounded border ${pageStyle === opt.value ? 'border-slate-900 bg-slate-100' : 'border-slate-300'}`}
                  onClick={() => setPageStyle(opt.value)}
                >
                  {opt.name}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 ml-6">
              <span className="text-sm text-black">Add Sticky Note:</span>
              {STICKY_COLORS.map(opt => (
                <button
                  key={opt.value}
                  className="w-6 h-6 rounded border border-slate-300"
                  style={{ background: opt.value }}
                  onClick={() => addSticky(opt.value)}
                  aria-label={opt.name}
                />
              ))}
            </div>
            
            {pageStyle === 'lined' && (
              <div className="flex items-center gap-2 ml-6">
                <span className="text-sm text-black">Line Color:</span>
                {LINE_COLORS.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-6 h-6 rounded-full border-2 ${lineColor === opt.value ? 'border-slate-900' : 'border-slate-300'}`}
                    style={{ background: opt.value }}
                    onClick={() => setLineColor(opt.value)}
                    aria-label={opt.name}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Entry Header */}
          <div className="p-6 border-b border-slate-200">
            <Input
              type="text"
              value={title}
              onChange={(e) => {
                if (!isLocked) {
                  setTitle(e.target.value);
                  setIsModified(true);
                }
              }}
              placeholder="Time capsule title..."
              fullWidth
              disabled={isLocked}
              className="text-xl font-semibold border-none bg-transparent px-0 focus:ring-0"
            />
            
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-slate-500" />
                <input
                  type="date"
                  value={openDate}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (!isLocked) {
                      setOpenDate(e.target.value);
                      setIsModified(true);
                    }
                  }}
                  disabled={isLocked}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none disabled:opacity-50"
                />
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => {
                    if (!isLocked) {
                      setOpenTime(e.target.value);
                      setIsModified(true);
                    }
                  }}
                  disabled={isLocked}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none disabled:opacity-50"
                />
                <span className="text-xs text-black">Open Date & Time</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Smile size={16} className="text-slate-500" />
                <select
                  value={mood}
                  onChange={(e) => {
                    if (!isLocked) {
                      setMood(e.target.value);
                      setIsModified(true);
                    }
                  }}
                  disabled={isLocked}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select mood</option>
                  {moods.map((moodOption) => (
                    <option key={moodOption.name} value={moodOption.name}>
                      {moodOption.emoji} {moodOption.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Cloud size={16} className="text-slate-500" />
                <select
                  value={weather}
                  onChange={(e) => {
                    if (!isLocked) {
                      setWeather(e.target.value);
                      setIsModified(true);
                    }
                  }}
                  disabled={isLocked}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select weather</option>
                  {weatherOptions.map((weatherOption) => (
                    <option key={weatherOption.name} value={weatherOption.name}>
                      {weatherOption.emoji} {weatherOption.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Toolbar */}
          {!isLocked && (
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => applyFormat('bold')}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                
                <button
                  onClick={() => applyFormat('italic')}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                
                <button
                  onClick={() => applyFormat('underline')}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
                
                <div className="w-px h-6 bg-slate-300 mx-2" />
                
                <div className="flex items-center space-x-1">
                  <Highlighter size={16} className="text-slate-500" />
                  <button
                    onClick={() => applyHighlight('#FFE16D')}
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: '#FFE16D' }}
                    title="Yellow Highlight"
                  />
                  <button
                    onClick={() => applyHighlight('#6EABC6')}
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: '#6EABC6' }}
                    title="Blue Highlight"
                  />
                  <button
                    onClick={() => applyHighlight('#4ADE80')}
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: '#4ADE80' }}
                    title="Green Highlight"
                  />
                  <button
                    onClick={() => applyHighlight('#FB923C')}
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: '#FB923C' }}
                    title="Orange Highlight"
                  />
                </div>
                
                <div className="w-px h-6 bg-slate-300 mx-2" />
                
                <button
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                  title="Add Image"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Image size={16} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'image');
                    e.target.value = '';
                  }}
                />
                <button
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                  title="Add Video"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Video size={16} />
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'video');
                    e.target.value = '';
                  }}
                />
                {uploading && (
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="text-xs text-blue-600">Uploading...</span>
                    <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-black">{uploadProgress.toFixed(0)}%</span>
                  </div>
                )}
                {uploadError && (
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="text-xs text-red-600">{uploadError}</span>
                    <button
                      onClick={() => setUploadError(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                      title="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Content Editor */}
          <div className="relative" style={{ background: pageColor, minHeight: 600 }}>
            {/* Media elements */}
            {mediaElements.map(media => (
              <div
                key={media.id}
                style={{
                  position: 'absolute',
                  left: media.x,
                  top: media.y,
                  width: media.width,
                  height: media.height,
                  zIndex: 20,
                  cursor: isLocked ? 'default' : 'move',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  borderRadius: 8,
                  background: '#fff',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  transform: `rotate(${media.rotation}deg)`,
                  transformOrigin: 'center center',
                  pointerEvents: isLocked ? 'none' : 'auto'
                }}
                draggable={!isLocked}
                onDragEnd={e => {
                  if (isLocked) return;
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    updateMediaElement(media.id, {
                      x: e.clientX - rect.left - media.width/2,
                      y: e.clientY - rect.top - media.height/2
                    });
                  }
                }}
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt="media"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain', 
                      borderRadius: 8,
                      transform: `rotate(-${media.rotation}deg)`
                    }}
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    muted={false}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: 8,
                      transform: `rotate(-${media.rotation}deg)`
                    }}
                  />
                )}
                
                {!isLocked && (
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      className="text-xs text-slate-500 hover:text-red-500 bg-white bg-opacity-80 rounded px-1"
                      style={{ border: 'none', cursor: 'pointer', zIndex: 30 }}
                      onClick={() => removeMediaElement(media.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Page styling */}
            {pageStyle === 'lined' && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 30px,
                    ${lineColor} 30px,
                    ${lineColor} 32px
                  )`,
                  backgroundPosition: '0 20px',
                  zIndex: 1,
                  opacity: 0.7
                }}
              />
            )}
            
            {/* Sticky notes */}
            {stickies.map(sticky => (
              <div
                key={sticky.id}
                style={{
                  position: 'absolute',
                  left: sticky.x,
                  top: sticky.y,
                  background: sticky.color,
                  minWidth: 120,
                  minHeight: 80,
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  borderRadius: 8,
                  padding: 8,
                  cursor: isLocked ? 'default' : 'move',
                  userSelect: 'none',
                  pointerEvents: isLocked ? 'none' : 'auto'
                }}
                draggable={!isLocked}
                onDragEnd={e => {
                  if (isLocked) return;
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    updateSticky(sticky.id, {
                      x: e.clientX - rect.left - 60,
                      y: e.clientY - rect.top - 20
                    });
                  }
                }}
              >
                <textarea
                  value={sticky.text}
                  onChange={e => updateSticky(sticky.id, { text: e.target.value })}
                  className="w-full h-full bg-transparent resize-none outline-none text-sm"
                  style={{ minHeight: 60 }}
                  placeholder="Sticky note..."
                  disabled={isLocked}
                />
                {!isLocked && (
                  <button
                    className="absolute top-1 right-1 text-xs text-slate-500 hover:text-red-500"
                    onClick={() => removeSticky(sticky.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Remove sticky"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {/* Content area */}
            {isLocked ? (
              <div className="min-h-[500px] p-6 flex items-center justify-center">
                <div className="text-center">
                  <Lock size={48} className="mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    Time Capsule Sealed
                  </h3>
                  <p className="text-slate-500">
                    This content will be revealed on {format(new Date(currentCapsule!.openDate), 'MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {content === '' && (
                  <span className="absolute left-6 top-6 text-slate-400 pointer-events-none select-none" style={{fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '32px', zIndex: 2}}>
                    Write a message to your future self...
                  </span>
                )}
                <div
                  ref={contentRef}
                  contentEditable
                  onInput={handleContentChange}
                  onPaste={handleContentChange}
                  className="min-h-[500px] p-6 outline-none text-slate-800 leading-relaxed"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '16px',
                    lineHeight: '32px',
                    position: 'relative',
                    zIndex: 2,
                    background: 'none'
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeCapsulePage; 
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
  Cloud,
  Clock,
  Lock,
  Unlock,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import GlassCard from '../components/ui/GlassCard';
import JournalDrawingOverlay from '../components/ui/JournalDrawingOverlay';

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
  const contentAreaRef = useRef<HTMLDivElement>(null);
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
  const [plantStickers, setPlantStickers] = useState<any[]>([]);
  const stickyId = useRef(0);
  const mediaId = useRef(0);
  const plantId = useRef(0);
  const [lineColor, setLineColor] = useState(
    pageColor === '#fff' ? '#222' : LINE_COLORS[0].value
  );

  // Drawing state
  const [drawingMode, setDrawingMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastMode = localStorage.getItem('timecapsule-last-mode');
      return lastMode === 'drawing';
    }
    return false;
  });
  const [drawingData, setDrawingData] = useState<any>(null);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawSize, setDrawSize] = useState(4);
  const [drawLines, setDrawLines] = useState<any[]>(drawingData || []);
  const [drawHistory, setDrawHistory] = useState<any[]>([]);
  const [drawOpacity, setDrawOpacity] = useState(1);
  const [quickColors, setQuickColors] = useState([
    '#000000',
    '#3b82f6',
    '#ef4444',
    '#22c55e',
    '#f59e42'
  ]);
  const setQuickColor = (idx: number, color: string) => {
    setQuickColors(qcs => qcs.map((c, i) => i === idx ? color : c));
  };
  const [drawingCardPos, setDrawingCardPos] = useState({ x: 32, y: 120 });
  const [drawingCardDragging, setDrawingCardDragging] = useState(false);
  const [drawingCardOffset, setDrawingCardOffset] = useState({ x: 0, y: 0 });
  const [drawingCardMinimized, setDrawingCardMinimized] = useState(false);
  const handleDrawingCardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDrawingCardDragging(true);
    setDrawingCardOffset({ x: e.clientX - drawingCardPos.x, y: e.clientY - drawingCardPos.y });
  };
  useEffect(() => {
    if (!drawingCardDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setDrawingCardPos({ x: e.clientX - drawingCardOffset.x, y: e.clientY - drawingCardOffset.y });
    };
    const handleMouseUp = () => setDrawingCardDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawingCardDragging, drawingCardOffset]);

  const handleDrawUndo = () => {
    if (drawLines.length === 0) return;
    setDrawHistory([drawLines[drawLines.length - 1], ...drawHistory]);
    setDrawLines(drawLines.slice(0, -1));
  };
  const handleDrawRedo = () => {
    if (drawHistory.length === 0) return;
    setDrawLines([...drawLines, drawHistory[0]]);
    setDrawHistory(drawHistory.slice(1));
  };
  const handleDrawClear = () => {
    setDrawLines([]);
    setDrawHistory([]);
  };
  const handleDrawSave = () => {
    setDrawingData(drawLines);
    setDrawingMode(false);
  };

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
      setDrawingData(currentCapsule.drawingData || []);
      setDrawLines(currentCapsule.drawingData || []);
      
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
      if ((currentCapsule as any).plantStickers) {
        const ps = (currentCapsule as any).plantStickers as any[];
        setPlantStickers(ps);
        const maxPlantId = Math.max(...ps.map((p: any) => p.id), 0);
        plantId.current = (isFinite(maxPlantId) ? maxPlantId : 0) + 1;
      } else {
        setPlantStickers([]);
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
      setPlantStickers([]);
      setIsLocked(false);
      setDrawingData([]);
      setDrawLines([]);
      
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

  // Media manipulation helpers
  const resizeMedia = (id: number, newWidth: number, newHeight: number) => {
    if (isLocked) return;
    setMediaElements(prev => prev.map(m => m.id === id ? { ...m, width: newWidth, height: newHeight } : m));
    setIsModified(true);
  };
  const rotateMedia = (id: number, angle: number) => {
    if (isLocked) return;
    setMediaElements(prev => prev.map(m => m.id === id ? { ...m, rotation: (m.rotation + angle) % 360 } : m));
    setIsModified(true);
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
      stickies: stickies,
      plantStickers: plantStickers,
      drawingData: drawingData
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
        <div className="max-w-4xl mx-auto px-4 py-8" style={{ position: 'relative' }}>
          {!isLocked && drawingMode && (
            <div
              style={{
                position: 'fixed',
                left: drawingCardPos.x,
                top: drawingCardPos.y,
                zIndex: 1100,
                cursor: drawingCardDragging ? 'grabbing' : 'grab',
                minWidth: drawingCardMinimized ? 120 : 224,
                minHeight: drawingCardMinimized ? 40 : undefined,
                transition: 'box-shadow 0.2s',
                userSelect: 'none',
              }}
              onMouseDown={handleDrawingCardMouseDown}
            >
              <GlassCard
                className={`flex flex-col gap-4 items-center p-4 shadow-xl backdrop-blur-lg border border-white/30 ${drawingCardMinimized ? 'py-2 px-3' : ''}`}
                style={{ pointerEvents: 'auto', background: 'transparent' }}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="font-bold text-sm">Drawing Tools</div>
                  <button
                    className="ml-2 text-lg text-slate-700 hover:text-blue-600 focus:outline-none"
                    onClick={e => { e.stopPropagation(); setDrawingCardMinimized(m => !m); }}
                    title={drawingCardMinimized ? 'Expand' : 'Minimize'}
                    type="button"
                  >
                    {drawingCardMinimized ? '▣' : '—'}
                  </button>
                </div>
                {!drawingCardMinimized && <>
                  <div className="flex gap-2 mb-2">
                    <button
                      className={`p-2 rounded-full border ${drawTool === 'pen' ? 'bg-blue-200 border-blue-500' : 'bg-white border-slate-300'}`}
                      onClick={() => setDrawTool('pen')}
                      title="Pen"
                    >
                      ✏️
                    </button>
                    <button
                      className={`p-2 rounded-full border ${drawTool === 'eraser' ? 'bg-blue-200 border-blue-500' : 'bg-white border-slate-300'}`}
                      onClick={() => setDrawTool('eraser')}
                      title="Eraser"
                    >
                      🧽
                    </button>
                  </div>
                  <div className="mb-2 w-full">
                    <div className="text-xs mb-1">Color</div>
                    <div className="flex gap-2 items-center justify-center">
                      {quickColors.map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <button
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${drawColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-300'}`}
                            style={{ background: color }}
                            onClick={() => setDrawColor(color)}
                            disabled={drawTool === 'eraser'}
                            title={idx === 0 ? 'Current Color' : `Quick Color ${idx}`}
                          />
                          <input
                            type="color"
                            value={color}
                            onChange={e => idx === 0 ? setDrawColor(e.target.value) : setQuickColor(idx, e.target.value)}
                            className="w-6 h-6 mt-1 border border-slate-300 rounded cursor-pointer"
                            style={{ padding: 0 }}
                            title={idx === 0 ? 'Set Current Color' : `Set Quick Color ${idx}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2 w-full">
                    <div className="text-xs mb-1">Brush Size</div>
                    <input
                      type="range"
                      min={2}
                      max={32}
                      step={2}
                      value={drawSize}
                      onChange={e => setDrawSize(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-center">{drawSize}px</div>
                  </div>
                  <div className="mb-2 w-full">
                    <div className="text-xs mb-1">Opacity</div>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.01}
                      value={drawOpacity}
                      onChange={e => setDrawOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-center">{Math.round(drawOpacity * 100)}%</div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={handleDrawUndo}
                      disabled={drawLines.length === 0}
                      title="Undo"
                      className="p-2 rounded-full bg-slate-100 hover:bg-blue-100 border border-slate-300 disabled:opacity-50 transition"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <RotateCcw size={20} className="text-blue-600" />
                    </button>
                    <button
                      onClick={handleDrawRedo}
                      disabled={drawHistory.length === 0}
                      title="Redo"
                      className="p-2 rounded-full bg-slate-100 hover:bg-green-100 border border-slate-300 disabled:opacity-50 transition"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <RotateCw size={20} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear your drawing? This cannot be undone.')) {
                          handleDrawClear();
                        }
                      }}
                      title="Clear"
                      className="p-2 rounded-full bg-slate-100 hover:bg-red-100 border border-slate-300 transition"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                      <Trash2 size={20} className="text-red-600" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleDrawSave} className="px-3 py-1 rounded bg-blue-500 text-white font-bold">Save</button>
                    <button onClick={() => setDrawingMode(false)} className="px-3 py-1 rounded bg-slate-200">Close</button>
                  </div>
                </>}
              </GlassCard>
            </div>
          )}
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
                  <button
                    onClick={() => applyHighlight('#F472B6')}
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: '#F472B6' }}
                    title="Pink Highlight"
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
                {/* Plant Animations (emoji-based, animated) */}
                <div className="ml-4 flex items-center space-x-1">
                  <span className="text-xs text-slate-600">Plants:</span>
                  {['🌱','🌿','🌵','🌷','🌼','🌴'].map((p) => (
                    <button
                      key={p}
                      className="px-1 py-0.5 rounded hover:bg-slate-200"
                      title={`Add ${p}`}
                      onClick={() => {
                        if (isLocked) return;
                        const newSticker = {
                          id: plantId.current++,
                          type: 'plant',
                          emoji: p,
                          x: 120 + Math.random() * 200,
                          y: 120 + Math.random() * 200,
                          size: 48,
                          rotation: 0,
                          animated: true
                        };
                        setPlantStickers(prev => [...prev, newSticker]);
                        setIsModified(true);
                      }}
                    >
                      <span className="text-lg">{p}</span>
                    </button>
                  ))}
                </div>
                <div className="ml-4 flex items-center rounded overflow-hidden border border-slate-300">
                  <button
                    className={`px-3 py-1 text-sm font-medium focus:outline-none transition-colors ${!drawingMode ? 'bg-blue-500 text-white' : 'bg-white text-slate-900'}`}
                    onClick={() => {
                      setDrawingMode(false);
                      localStorage.setItem('timecapsule-last-mode', 'writing');
                    }}
                    type="button"
                    style={{ minWidth: 70 }}
                  >
                    ✍️ Writing
                  </button>
                  <button
                    className={`px-3 py-1 text-sm font-medium focus:outline-none transition-colors ${drawingMode ? 'bg-blue-500 text-white' : 'bg-white text-slate-900'}`}
                    onClick={() => {
                      setDrawingMode(true);
                      localStorage.setItem('timecapsule-last-mode', 'drawing');
                    }}
                    type="button"
                    style={{ minWidth: 70 }}
                  >
                    🖊️ Drawing
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Content Editor */}
          <div className="relative" style={{ background: pageColor, minHeight: 600 }} ref={contentAreaRef}>
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
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.naturalWidth && img.naturalHeight) {
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        updateMediaElement(media.id, { aspectRatio });
                      }
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
                      className="text-xs text-black hover:text-blue-500 bg-white bg-opacity-80 rounded px-1"
                      style={{ border: 'none', cursor: 'pointer', zIndex: 30 }}
                      onClick={() => rotateMedia(media.id, 90)}
                      title="Rotate 90°"
                    >
                      🔄
                    </button>
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

                {!isLocked && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    style={{ zIndex: 30 }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startWidth = media.width;
                      const startHeight = media.height;
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        let newWidth = startWidth + deltaX;
                        let newHeight = startHeight + deltaY;
                        if (media.aspectRatio) {
                          if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            newHeight = newWidth / media.aspectRatio;
                          } else {
                            newWidth = newHeight * media.aspectRatio;
                          }
                        }
                        newWidth = Math.max(50, newWidth);
                        newHeight = Math.max(50, newHeight);
                        resizeMedia(media.id, newWidth, newHeight);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <div className="w-full h-full bg-blue-500 bg-opacity-50 rounded-bl"></div>
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
            
            {/* Plant Stickers Layer */}
            {plantStickers.map(st => (
              <div
                key={st.id}
                style={{
                  position: 'absolute',
                  left: st.x,
                  top: st.y,
                  zIndex: 15,
                  userSelect: 'none',
                  cursor: isLocked ? 'default' : 'move',
                  transform: `rotate(${st.rotation}deg)`
                }}
                draggable={!isLocked}
                onDragEnd={e => {
                  if (isLocked) return;
                  const rect = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect();
                  if (rect) {
                    setPlantStickers(prev => prev.map(s => s.id === st.id ? { ...s, x: e.clientX - rect.left - st.size/2, y: e.clientY - rect.top - st.size/2 } : s));
                    setIsModified(true);
                  }
                }}
              >
                <div
                  style={{
                    width: st.size,
                    height: st.size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: st.size * 0.8,
                    transform: `rotate(-${st.rotation}deg)`
                  }}
                >
                  <span className={st.animated ? 'plant-anim' : ''}>{st.emoji}</span>
                </div>
                {!isLocked && (
                  <div className="absolute top-0 right-0 flex gap-1" style={{ transform: `rotate(-${st.rotation}deg)` }}>
                    <button
                      className="text-xs bg-white bg-opacity-80 rounded px-1 hover:text-blue-600"
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Rotate 90°"
                      onClick={() => {
                        setPlantStickers(prev => prev.map(s => s.id === st.id ? { ...s, rotation: (s.rotation + 90) % 360 } : s));
                        setIsModified(true);
                      }}
                    >
                      🔄
                    </button>
                    <button
                      className="text-xs bg-white bg-opacity-80 rounded px-1 hover:text-red-600"
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Remove"
                      onClick={() => {
                        setPlantStickers(prev => prev.filter(s => s.id !== st.id));
                        setIsModified(true);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {!isLocked && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startSize = st.size;
                      const handleMouseMove = (me: MouseEvent) => {
                        const delta = Math.max(me.clientX - startX, me.clientY - startY);
                        const newSize = Math.max(24, startSize + delta);
                        setPlantStickers(prev => prev.map(s => s.id === st.id ? { ...s, size: newSize } : s));
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        setIsModified(true);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <div className="w-full h-full bg-green-500 bg-opacity-50 rounded-bl"></div>
                  </div>
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
                  contentEditable={!drawingMode}
                  onInput={handleContentChange}
                  onPaste={handleContentChange}
                  className="min-h-[500px] p-6 outline-none text-slate-800 leading-relaxed"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '16px',
                    lineHeight: '32px',
                    position: 'relative',
                    zIndex: 2,
                    background: 'none',
                    pointerEvents: drawingMode ? 'none' : 'auto',
                    opacity: drawingMode ? 0.7 : 1
                  }}
                />
                {drawingMode && (
                  <JournalDrawingOverlay
                    visible={drawingMode}
                    width={contentAreaRef.current?.offsetWidth || 800}
                    height={contentAreaRef.current?.offsetHeight || 600}
                    tool={drawTool}
                    color={drawColor}
                    size={drawSize}
                    opacity={drawOpacity}
                    lines={drawLines}
                    setLines={setDrawLines}
                    onUndo={handleDrawUndo}
                    onRedo={handleDrawRedo}
                    onClear={handleDrawClear}
                    canUndo={drawLines.length > 0}
                    canRedo={drawHistory.length > 0}
                    onClose={() => setDrawingMode(false)}
                    onSave={setDrawingData}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeCapsulePage; 
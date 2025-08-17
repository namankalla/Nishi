import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useJournalStore } from '../store/useJournalStore';
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
  FileText,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { format } from 'date-fns';
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

const DRAW_SIZES = [2, 4, 8, 16, 32];

const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentEntry, 
    createEntry, 
    updateEntry, 
    deleteEntry,
    isLoading,
    saveDraft,
    loadDraft,
    deleteDraft
  } = useJournalStore();
  const { getThemeColors, customJournalWallpaper } = useThemeStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [isModified, setIsModified] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const colors = getThemeColors();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [pageColor, setPageColor] = useState(PAGE_COLORS[0].value);
  const [pageStyle, setPageStyle] = useState(PAGE_STYLES[1].value); // default to lined
  const [stickies, setStickies] = useState<any[]>([]);
  const [mediaElements, setMediaElements] = useState<any[]>([]);
  const stickyId = useRef(0);
  const mediaId = useRef(0);
  const [lineColor, setLineColor] = useState(
    pageColor === '#fff' ? '#222' : LINE_COLORS[0].value
  );
  
  const [availableDraft, setAvailableDraft] = useState<{data: any, source: string} | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  
  // Debug: Show current state and contentRef
  const [contentRefHtml, setContentRefHtml] = useState('');
  useEffect(() => {
    if (contentRef.current) {
      setContentRefHtml(contentRef.current.innerHTML);
    }
  }, [content]);
  
  useEffect(() => {
    if (currentEntry) {
      console.log('Loading existing entry:', currentEntry);
      console.log('Entry content:', currentEntry.content);
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setSelectedDate(currentEntry.date);
      setMood(currentEntry.mood || '');
      setWeather(currentEntry.weather || '');
      
      // Restore media elements and stickies
      if (currentEntry.mediaElements) {
        console.log('Loading media elements:', currentEntry.mediaElements);
        setMediaElements(currentEntry.mediaElements);
        // Update media ID counter to avoid conflicts
        const maxMediaId = Math.max(...currentEntry.mediaElements.map((m: any) => m.id), 0);
        mediaId.current = maxMediaId + 1;
      } else {
        console.log('No media elements found in entry');
      }
      
      if (currentEntry.stickies) {
        console.log('Loading stickies:', currentEntry.stickies);
        setStickies(currentEntry.stickies);
        // Update sticky ID counter to avoid conflicts
        const maxStickyId = Math.max(...currentEntry.stickies.map((s: any) => s.id), 0);
        stickyId.current = maxStickyId + 1;
      } else {
        console.log('No stickies found in entry');
      }
      
      if (contentRef.current) {
        contentRef.current.innerHTML = currentEntry.content;
        console.log('[DRAFT RESTORE] Set contentRef.current.innerHTML to:', currentEntry.content);
        setContentRefHtml(currentEntry.content);
      }
    } else {
      // New entry
      const today = new Date();
      setTitle(`Entry for ${format(today, 'MMMM d, yyyy')}`);
      setContent('');
      setSelectedDate(today);
      setMood('');
      setWeather('');
      setMediaElements([]);
      setStickies([]);
      
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
        setContentRefHtml(contentRef.current.innerHTML);
      }
    }
    setIsModified(false);
  }, [currentEntry]);
  
  useEffect(() => {
    if (pageColor === '#fff') setLineColor('#222');
  }, [pageColor]);
  
  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML;
      console.log('Content changed:', newContent);
      setContent(newContent);
      setIsModified(true);
    }
  };
  
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    handleContentChange();
  };
  
  const applyHighlight = (color: string) => {
    document.execCommand('hiliteColor', false, color);
    contentRef.current?.focus();
    handleContentChange();
  };
  
  // AUTOSAVE DRAFTS: Unique key for localStorage and Firestore
  type DraftKey = { local: string, remote: string };
  const getDraftKey = (): DraftKey | null => {
    if (!user) return null;
    const id = currentEntry ? `${user.uid}-${currentEntry.id}` : `${user.uid}-new`;
    return { local: `journal-draft-${id}`, remote: id };
  };

  // On mount, check for available draft in localStorage and Firestore (but do not restore automatically)
  useEffect(() => {
    if (!user) return;
    const draftKey = getDraftKey();
    if (!draftKey) return;
    let found = false;
    // Check localStorage first
    const draft = localStorage.getItem(draftKey.local);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setAvailableDraft({data, source: 'local'});
        found = true;
      } catch (e) {}
    }
    // If not found in localStorage, check Firestore
    if (!found) {
      loadDraft(user.uid, draftKey.remote).then(data => {
        if (data) {
          setAvailableDraft({data, source: 'firestore'});
        } else {
          setAvailableDraft(null);
        }
      });
    }
  }, [user, currentEntry]);

  // Manual restore handler
  const handleManualRestore = () => {
    if (!availableDraft) return;
    const data = availableDraft.data;
    setTitle(data.title || '');
    setContent(data.content || '');
    setSelectedDate(data.selectedDate ? new Date(data.selectedDate) : new Date());
    setMood(data.mood || '');
    setWeather(data.weather || '');
    setMediaElements(data.mediaElements || []);
    setStickies(data.stickies || []);
    if (contentRef.current) {
      contentRef.current.innerHTML = data.content || '';
      setContentRefHtml(contentRef.current.innerHTML);
    }
    setDraftRestored(true);
    setRestoreMessage(`Draft restored from ${availableDraft.source === 'local' ? 'local storage' : 'cloud draft'}`);
    setTimeout(() => setRestoreMessage(''), 4000);
  };

  // Only load entry data if no draft is restored
  useEffect(() => {
    if (draftRestored) return;
    if (currentEntry) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setSelectedDate(currentEntry.date);
      setMood(currentEntry.mood || '');
      setWeather(currentEntry.weather || '');
      if (currentEntry.mediaElements) {
        setMediaElements(currentEntry.mediaElements);
        const maxMediaId = Math.max(...currentEntry.mediaElements.map((m: any) => m.id), 0);
        mediaId.current = maxMediaId + 1;
      } else {
        setMediaElements([]);
      }
      if (currentEntry.stickies) {
        setStickies(currentEntry.stickies);
        const maxStickyId = Math.max(...currentEntry.stickies.map((s: any) => s.id), 0);
        stickyId.current = maxStickyId + 1;
      } else {
        setStickies([]);
      }
      if (contentRef.current) {
        contentRef.current.innerHTML = currentEntry.content;
        setContentRefHtml(currentEntry.content);
      }
    } else {
      // New entry
      const today = new Date();
      setTitle(`Entry for ${format(today, 'MMMM d, yyyy')}`);
      setContent('');
      setSelectedDate(today);
      setMood('');
      setWeather('');
      setMediaElements([]);
      setStickies([]);
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
        setContentRefHtml(contentRef.current.innerHTML);
      }
    }
    setIsModified(false);
  }, [currentEntry, draftRestored]);

  // Autosave draft every 1 second if modified (both localStorage and Firestore)
  useEffect(() => {
    if (!user) return;
    const draftKey = getDraftKey();
    if (!draftKey) return;
    if (!isModified) return;
    const interval = setInterval(() => {
      const draft = {
        title,
        content,
        selectedDate,
        mood,
        weather,
        mediaElements,
        stickies
      };
      // Save to localStorage
      localStorage.setItem(draftKey.local, JSON.stringify(draft));
      // Save to Firestore
      saveDraft(user.uid, draftKey.remote, draft);
    }, 1000);
    return () => clearInterval(interval);
  }, [user, currentEntry, title, content, selectedDate, mood, weather, mediaElements, stickies, isModified]);
  
  const handleSave = async () => {
    if (!user) return;
    
    console.log('Saving entry with content:', content);
    console.log('Content length:', content.length);
    console.log('Saving media elements:', mediaElements);
    console.log('Saving stickies:', stickies);
    
    const entryData = {
      title: title.trim() || 'Untitled Entry',
      content,
      date: selectedDate,
      mood,
      weather,
      tags: [], // Could extract from content or add UI for tags
      attachments: [],
      mediaElements: mediaElements,
      stickies: stickies,
      drawingData: drawingData
    };
    
    try {
      if (currentEntry) {
        await updateEntry(currentEntry.id, entryData);
      } else {
        await createEntry(user.uid, entryData);
      }
      setIsModified(false);
      // Clear draft
      const draftKey = getDraftKey();
      if (draftKey) {
        localStorage.removeItem(draftKey.local);
        await deleteDraft(user.uid, draftKey.remote);
      }
      navigate('/home');
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!currentEntry) return;
    
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(currentEntry.id);
        navigate('/home');
      } catch (error) {
        console.error('Failed to delete entry:', error);
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
    { emoji: '🥰', name: 'Loved' }
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
  
  // Insert HTML at cursor position in contentEditable
  const insertAtCursor = (html: string) => {
    console.log('Inserting HTML:', html);
    
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      console.log('No selection found, inserting at end');
      // If no selection, insert at the end of the content
      if (contentRef.current) {
        contentRef.current.innerHTML += html;
        handleContentChange();
        return;
      }
      return;
    }
    
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const el = document.createElement('div');
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node, lastNode;
    while ((node = el.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);
    // Move cursor after inserted node
    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    
    console.log('Content after insertion:', contentRef.current?.innerHTML);
    handleContentChange();
  };

  // Handle file upload
  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      // Check if Firebase storage is available
      if (!storage) {
        throw new Error('Storage service not available. Please refresh the page and try again.');
      }
      
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error(`File size too large. Maximum size is 50MB. Current file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Validate file type
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
      
      if (type === 'image' && !allowedImageTypes.includes(file.type)) {
        throw new Error(`Invalid image format. Allowed formats: ${allowedImageTypes.join(', ')}`);
      }
      
      if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
        throw new Error(`Invalid video format. Allowed formats: ${allowedVideoTypes.join(', ')}`);
      }
      
      // Check if user is authenticated
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }
      
      console.log('Starting upload for file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
      const storageRef = ref(storage, `journal_uploads/${user.uid}/${fileName}`);
      
      console.log('Storage reference created:', storageRef.fullPath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Monitor upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(2) + '%');
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        },
        async () => {
          console.log('Upload completed successfully');
          setUploadProgress(100);
          try {
            const url = await getDownloadURL(storageRef);
            console.log('Download URL obtained:', url);
            
            // Add media element to the page instead of inserting into contentEditable
            const newMediaElement = {
              id: mediaId.current++,
              type: type,
              url: url,
              x: 100 + Math.random() * 200,
              y: 100 + Math.random() * 200,
              width: type === 'image' ? 200 : 300,
              height: type === 'image' ? 150 : 169, // 16:9 ratio for videos
              rotation: 0,
              aspectRatio: type === 'image' ? null : 16/9 // null for images (maintain original), 16/9 for videos
            };
            
            setMediaElements(prev => [...prev, newMediaElement]);
            setIsModified(true);
            
            console.log('Added media element:', newMediaElement);
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            throw new Error('Failed to get download URL after upload');
          }
        }
      );
      
      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, () => resolve());
      });
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file.';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'Upload unauthorized. Please check your permissions.';
      } else if (err.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please try a smaller file.';
      } else if (err.code === 'storage/retry-limit-exceeded') {
        errorMessage = 'Upload failed due to network issues. Please try again.';
      } else if (err.code === 'storage/object-not-found') {
        errorMessage = 'Storage object not found. Please try uploading again.';
      } else if (err.code === 'storage/bucket-not-found') {
        errorMessage = 'Storage bucket not found. Please check your Firebase configuration.';
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
    setStickies(stickies.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSticky = (id: number) => {
    setStickies(stickies.filter(s => s.id !== id));
  };
  
  // Media manipulation functions
  const updateMediaElement = (id: number, updates: any) => {
    setMediaElements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    setIsModified(true);
  };
  
  const removeMediaElement = (id: number) => {
    setMediaElements(prev => prev.filter(m => m.id !== id));
    setIsModified(true);
  };
  
  const resizeMedia = (id: number, newWidth: number, newHeight: number) => {
    setMediaElements(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, width: newWidth, height: newHeight };
      }
      return m;
    }));
    setIsModified(true);
  };
  
  const rotateMedia = (id: number, angle: number) => {
    setMediaElements(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, rotation: (m.rotation + angle) % 360 };
      }
      return m;
    }));
    setIsModified(true);
  };
  
  // Test Firebase Storage connectivity
  const testStorageConnection = async () => {
    try {
      console.log('Testing Firebase Storage connection...');
      console.log('Storage object:', storage);
      console.log('User:', user);
      
      if (!storage) {
        console.error('Storage is not initialized');
        return false;
      }
      
      if (!user) {
        console.error('User is not authenticated');
        return false;
      }
      
      // Try to create a test reference
      const testRef = ref(storage, `test/${user.uid}/test.txt`);
      console.log('Test reference created:', testRef.fullPath);
      
      return true;
    } catch (error) {
      console.error('Storage test failed:', error);
      return false;
    }
  };
  
  // Test storage on component mount
  useEffect(() => {
    testStorageConnection();
  }, [user]);
  
  // Test image insertion
  const testImageInsertion = () => {
    const testImageUrl = 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Test+Image';
    
    // Add test media element to the page
    const newMediaElement = {
      id: mediaId.current++,
      type: 'image',
      url: testImageUrl,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 200,
      height: 150,
      rotation: 0,
      aspectRatio: null
    };
    
    setMediaElements(prev => [...prev, newMediaElement]);
    setIsModified(true);
    
    console.log('Added test media element:', newMediaElement);
  };

  const [drawingMode, setDrawingMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastMode = localStorage.getItem('journal-last-mode');
      return lastMode === 'drawing';
    }
    return false;
  });
  const [drawingData, setDrawingData] = useState<any>(currentEntry?.drawingData || []);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawSize, setDrawSize] = useState(4);
  const [drawLines, setDrawLines] = useState<any[]>(drawingData || []);
  const [drawHistory, setDrawHistory] = useState<any[]>([]);
  const [drawOpacity, setDrawOpacity] = useState(1);

  // Drawing actions
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

  // Replace quickColor1/2 with an array of quick colors
  const [quickColors, setQuickColors] = useState([
    '#000000', // black (main, always reflects drawColor)
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#f59e42'  // orange
  ]);

  // Helper to update a quick color slot
  const setQuickColor = (idx: number, color: string) => {
    setQuickColors(qcs => qcs.map((c, i) => i === idx ? color : c));
  };

  // Drawing actions
  const [drawingCardPos, setDrawingCardPos] = useState({ x: 32, y: 120 });
  const [drawingCardDragging, setDrawingCardDragging] = useState(false);
  const [drawingCardOffset, setDrawingCardOffset] = useState({ x: 0, y: 0 });
  const [drawingCardMinimized, setDrawingCardMinimized] = useState(false);

  const handleDrawingCardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDrawingCardDragging(true);
    setDrawingCardOffset({
      x: e.clientX - drawingCardPos.x,
      y: e.clientY - drawingCardPos.y
    });
  };
  useEffect(() => {
    if (!drawingCardDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setDrawingCardPos({
        x: e.clientX - drawingCardOffset.x,
        y: e.clientY - drawingCardOffset.y
      });
    };
    const handleMouseUp = () => setDrawingCardDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawingCardDragging, drawingCardOffset]);

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
                onClick={() => navigate('/home')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              
              <div className="text-sm text-black">
                {currentEntry ? 'Editing entry' : 'New entry'}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentEntry && (
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  size="sm"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              )}
              
              <Button
                onClick={handleSave}
                variant="primary"
                isLoading={isLoading}
                disabled={!isModified && !currentEntry}
              >
                <Save size={16} className="mr-2" />
                {currentEntry ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Editor */}
      <div className="max-w-4xl mx-auto px-4 py-8" style={{ position: 'relative' }}>
        {drawingMode && (
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
              <div
                className="w-full flex items-center justify-between mb-2"
              >
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
        <div>
          <GlassCard className="mb-6 flex flex-wrap gap-4 items-center">
            {/* Page color options */}
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
            {/* Page style options */}
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
            {/* Sticky note options */}
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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Entry Header */}
            <div className="p-6 border-b border-slate-200">
              <Input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsModified(true);
                }}
                placeholder="Entry title..."
                fullWidth
                className="text-xl font-semibold border-none bg-transparent px-0 focus:ring-0"
              />
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-black" />
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value));
                      setIsModified(true);
                    }}
                    className="text-sm text-black bg-transparent border-none focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Smile size={16} className="text-black" />
                  <select
                    value={mood}
                    onChange={(e) => {
                      setMood(e.target.value);
                      setIsModified(true);
                    }}
                    className="text-sm text-black bg-transparent border-none focus:outline-none"
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
                  <Cloud size={16} className="text-black" />
                  <select
                    value={weather}
                    onChange={(e) => {
                      setWeather(e.target.value);
                      setIsModified(true);
                    }}
                    className="text-sm text-black bg-transparent border-none focus:outline-none"
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
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-1">
                {/* Text Formatting */}
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
                
                {/* Highlighters */}
                <div className="flex items-center space-x-1">
                  <Highlighter size={16} className="text-black" />
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
                
                {/* Media */}
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
                    <span className="text-xs text-black">Uploading...</span>
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
                      className="text-xs text-black hover:text-black"
                      title="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}
                {/* Place the toggle switch at the end of the toolbar */}
                <div className="ml-4 flex items-center rounded overflow-hidden border border-slate-300">
                  <button
                    className={`px-3 py-1 text-sm font-medium focus:outline-none transition-colors ${!drawingMode ? 'bg-blue-500 text-white' : 'bg-white text-slate-900'}`}
                    onClick={() => {
                      setDrawingMode(false);
                      localStorage.setItem('journal-last-mode', 'writing');
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
                      localStorage.setItem('journal-last-mode', 'drawing');
                    }}
                    type="button"
                    style={{ minWidth: 70 }}
                  >
                    🖊️ Drawing
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content Editor */}
            <div className="relative" style={{ background: pageColor, minHeight: 600 }} ref={contentAreaRef}>
              {/* Render freely placed media elements */}
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
                    cursor: 'move',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    borderRadius: 8,
                    background: '#fff',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                    transform: `rotate(${media.rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('media-id', media.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setDragImage(e.currentTarget, media.width/2, media.height/2);
                  }}
                  onDragEnd={e => {
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
                        transform: `rotate(-${media.rotation}deg)` // Counter-rotate the image to keep it upright
                      }}
                      onLoad={(e) => {
                        // Set aspect ratio based on actual image dimensions
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
                        transform: `rotate(-${media.rotation}deg)` // Counter-rotate the video to keep it upright
                      }}
                    />
                  )}
                  
                  {/* Control buttons */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    {/* Rotate button */}
                    <button
                      className="text-xs text-black hover:text-blue-500 bg-white bg-opacity-80 rounded px-1"
                      style={{ border: 'none', cursor: 'pointer', zIndex: 30 }}
                      onClick={() => rotateMedia(media.id, 90)}
                      title="Rotate 90°"
                    >
                      🔄
                    </button>
                    
                    {/* Remove button */}
                    <button
                      className="text-xs text-black hover:text-red-500 bg-white bg-opacity-80 rounded px-1"
                      style={{ border: 'none', cursor: 'pointer', zIndex: 30 }}
                      onClick={() => removeMediaElement(media.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Resize handles */}
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
                        
                        // Maintain aspect ratio if it exists
                        if (media.aspectRatio) {
                          if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            newHeight = newWidth / media.aspectRatio;
                          } else {
                            newWidth = newHeight * media.aspectRatio;
                          }
                        }
                        
                        // Minimum size
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
                </div>
              ))}
              {/* Lined or blank background */}
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
                    cursor: 'move',
                    userSelect: 'none'
                  }}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', sticky.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setDragImage(e.currentTarget, 60, 40);
                  }}
                  onDragEnd={e => {
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
                  />
                  <button
                    className="absolute top-1 right-1 text-black hover:text-red-500"
                    onClick={() => removeSticky(sticky.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Remove sticky"
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* Custom placeholder for contentEditable */}
              {content === '' && (
                <span className="absolute left-6 top-6 text-black pointer-events-none select-none" style={{fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '32px', zIndex: 2}}>
                  Start writing your thoughts...
                </span>
              )}
              <div
                ref={contentRef}
                contentEditable={!drawingMode}
                onInput={handleContentChange}
                onPaste={handleContentChange}
                className="min-h-[500px] p-6 outline-none text-black leading-relaxed"
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
            </div>
          </div>
        </div>
      </div>
      {availableDraft && !draftRestored && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-100 text-yellow-900 px-4 py-2 rounded shadow flex items-center space-x-4">
          <span>Draft available from {availableDraft.source === 'local' ? 'local storage' : 'cloud draft'}</span>
          <button className="bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded ml-4 hover:bg-yellow-300" onClick={handleManualRestore}>
            Restore
          </button>
        </div>
      )}
      {restoreMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-900 px-4 py-2 rounded shadow">
          {restoreMessage}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
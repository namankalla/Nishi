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
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

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

const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentEntry, 
    createEntry, 
    updateEntry, 
    deleteEntry,
    isLoading 
  } = useJournalStore();
  const { getThemeColors } = useThemeStore();
  
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
  
  const [pageColor, setPageColor] = useState(PAGE_COLORS[0].value);
  const [pageStyle, setPageStyle] = useState(PAGE_STYLES[1].value); // default to lined
  const [stickies, setStickies] = useState<any[]>([]);
  const stickyId = useRef(0);
  const [lineColor, setLineColor] = useState(
    pageColor === '#fff' ? '#222' : LINE_COLORS[0].value
  );
  
  useEffect(() => {
    if (currentEntry) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setSelectedDate(currentEntry.date);
      setMood(currentEntry.mood || '');
      setWeather(currentEntry.weather || '');
      
      if (contentRef.current) {
        contentRef.current.innerHTML = currentEntry.content;
      }
    } else {
      // New entry
      const today = new Date();
      setTitle(`Entry for ${format(today, 'MMMM d, yyyy')}`);
      setContent('');
      setSelectedDate(today);
      setMood('');
      setWeather('');
      
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
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
  
  const handleSave = async () => {
    if (!user) return;
    
    const entryData = {
      title: title.trim() || 'Untitled Entry',
      content,
      date: selectedDate,
      mood,
      weather,
      tags: [], // Could extract from content or add UI for tags
      attachments: []
    };
    
    try {
      if (currentEntry) {
        await updateEntry(currentEntry.id, entryData);
      } else {
        await createEntry(user.uid, entryData);
      }
      setIsModified(false);
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
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
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
    handleContentChange();
  };

  // Handle file upload
  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setUploading(true);
    setUploadError(null);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `journal_uploads/${user?.uid || 'anon'}/${Date.now()}.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, () => resolve());
      });
      const url = await getDownloadURL(storageRef);
      if (type === 'image') {
        insertAtCursor(`<img src="${url}" alt="uploaded" style="max-width:100%;border-radius:8px;margin:12px 0;" />`);
      } else {
        insertAtCursor(`<video controls src="${url}" style="max-width:100%;border-radius:8px;margin:12px 0;"></video>`);
      }
    } catch (err: any) {
      setUploadError('Failed to upload file.');
    } finally {
      setUploading(false);
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
  
  return (
    <div className={`min-h-screen ${colors.background}`}>
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
              
              <div className="text-sm text-slate-500">
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap gap-4 items-center">
          {/* Page color options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Page Color:</span>
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
            <span className="text-sm text-slate-600">Page Style:</span>
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
            <span className="text-sm text-slate-600">Add Sticky Note:</span>
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
              <span className="text-sm text-slate-600">Line Color:</span>
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
        </div>
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
                <Calendar size={16} className="text-slate-500" />
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    setSelectedDate(new Date(e.target.value));
                    setIsModified(true);
                  }}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Smile size={16} className="text-slate-500" />
                <select
                  value={mood}
                  onChange={(e) => {
                    setMood(e.target.value);
                    setIsModified(true);
                  }}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none"
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
                    setWeather(e.target.value);
                    setIsModified(true);
                  }}
                  className="text-sm text-slate-600 bg-transparent border-none focus:outline-none"
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
                <span className="ml-4 text-xs text-blue-600">Uploading...</span>
              )}
              {uploadError && (
                <span className="ml-4 text-xs text-red-600">{uploadError}</span>
              )}
            </div>
          </div>
          
          {/* Content Editor */}
          <div className="relative" style={{ background: pageColor }}>
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
                  className="absolute top-1 right-1 text-xs text-slate-500 hover:text-red-500"
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
              <span className="absolute left-6 top-6 text-slate-400 pointer-events-none select-none" style={{fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '32px', zIndex: 2}}>
                Start writing your thoughts...
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
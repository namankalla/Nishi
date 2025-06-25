import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  entryDates?: Date[];
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  entryDates = []
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const hasEntry = (date: Date) => {
    return entryDates.some(entryDate => isSameDay(entryDate, date));
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasEntryForDay = hasEntry(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          const buttonStyle = isSelected ? {
            backgroundColor: colors.primary,
            color: colors.accent
          } : {};
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                p-2 text-sm rounded-lg transition-all duration-200 relative
                ${isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                ${isSelected 
                  ? 'shadow-sm' 
                  : 'hover:bg-slate-100'
                }
                ${isTodayDate && !isSelected ? 'ring-1 ring-blue-500' : ''}
              `}
              style={buttonStyle}
            >
              {format(day, 'd')}
              {hasEntryForDay && (
                <div 
                  className={`
                    absolute bottom-1 left-1/2 transform -translate-x-1/2
                    w-1 h-1 rounded-full
                    ${isSelected ? 'bg-slate-700' : ''}
                  `}
                  style={!isSelected ? { backgroundColor: colors.secondary } : {}}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
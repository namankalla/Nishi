import React from 'react';

interface GardenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface GardenConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'secondary';
}

const GardenModal: React.FC<GardenModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-teal-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-teal-100 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export const GardenConfirmationModal: React.FC<GardenConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary'
}) => {
  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700';
      case 'primary':
        return 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 hover:border-teal-700';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700';
      default:
        return 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 hover:border-teal-700';
    }
  };

  return (
    <GardenModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-teal-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-teal-400 hover:text-teal-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-teal-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-teal-700 bg-white border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 border rounded-lg transition-colors ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </GardenModal>
  );
};

export default GardenModal;

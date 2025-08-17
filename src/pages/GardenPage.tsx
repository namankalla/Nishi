import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { usePlantStore } from '../store/usePlantStore';
import GardenGlassCard from '../components/ui/GardenGlassCard';
import GardenButton from '../components/ui/GardenButton';
import { GardenConfirmationModal } from '../components/ui/GardenModal';

type Species = 'lemon' | 'snake' | 'cactus' | 'monstera';

const SPECIES_OPTIONS: { id: Species; name: string; preview: string }[] = [
  { id: 'lemon', name: 'Lemon Plant', preview: '🍋' },
  { id: 'snake', name: 'Snake Plant', preview: '🌿' },
  { id: 'cactus', name: 'Cactus Plant', preview: '🌵' },
  { id: 'monstera', name: 'Monstera BrokenHeart Plant', preview: '🪴' }
];

const GardenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { plants, loadPlants, createPlant, getStatus, deletePlant } = usePlantStore();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Species>('lemon');
  const [plantName, setPlantName] = useState('My Plant');
  const [disposingPlantId, setDisposingPlantId] = useState<string | null>(null);
  const [showDisposeConfirm, setShowDisposeConfirm] = useState(false);
  const [plantToDispose, setPlantToDispose] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadPlants(user.uid);
  }, [user]);

  const currentPlants = plants.filter(plant => !plant.isTransplanted);
  const transplantedPlants = plants.filter(plant => plant.isTransplanted);

  const getPlantGrowthDays = (plant: any) => {
    const now = new Date();
    const base = differenceInCalendarDays(now, new Date(plant.createdAt)) + 1;
    return Math.max(1, Math.min(28, base));
  };

  const handleCreatePlant = async () => {
    if (!user) return;
    try {
      await createPlant(user.uid, selectedSpecies, plantName);
      setIsCreating(false);
      setPlantName('My Plant');
    } catch (e: any) {
      console.error('Failed to create plant:', e);
    }
  };

  const handlePlantClick = (plantId: string) => {
    console.log('[GardenPage] Plant clicked:', plantId);
    console.log('[GardenPage] Navigating to:', `/plant/${plantId}`);
    navigate(`/plant/${plantId}`);
  };

  const handleDisposePlant = async (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return;
    
    setPlantToDispose({ id: plantId, name: plant.name });
    setShowDisposeConfirm(true);
  };

  const confirmDisposePlant = async () => {
    if (!plantToDispose) return;
    
    setDisposingPlantId(plantToDispose.id);
    try {
      await deletePlant(plantToDispose.id);
    } catch (e: any) {
      console.error('Failed to dispose of plant:', e);
      alert('Failed to dispose of plant. Please try again.');
    } finally {
      setDisposingPlantId(null);
      setPlantToDispose(null);
    }
  };

  return (
    <div className="min-h-screen bg-teal-500">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GardenGlassCard className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GardenButton
                onClick={() => navigate('/home')}
                variant="outline"
                className="bg-white/80 hover:bg-teal-50 border-teal-200 hover:border-teal-300 text-teal-600 hover:text-teal-700 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">←</span>
                  <span>Back</span>
                </div>
              </GardenButton>
          <div>
                <h1 className="text-3xl font-bold text-teal-800">My Garden (BETA) </h1>
                <p className="text-teal-600 mt-1">Nurture your plants and watch them grow</p>
              </div>
          </div>
            <GardenButton onClick={() => setIsCreating(true)} variant="primary">
            🌱 New Plant+
            </GardenButton>
        </div>
        </GardenGlassCard>

        {isCreating && (
          <GardenGlassCard className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-teal-800">Create New Plant</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-teal-700">Plant Name</label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full px-3 py-2 border border-teal-200 rounded-md focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-teal-700">Species</label>
                <div className="flex gap-2 flex-wrap">
                  {SPECIES_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedSpecies(opt.id)}
                      className={`px-3 py-2 rounded border text-sm transition-colors ${
                        selectedSpecies === opt.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-teal-200 text-teal-600 hover:bg-teal-50'
                      }`}
                    >
                      {opt.preview} {opt.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <GardenButton onClick={handleCreatePlant} variant="primary">Create Plant</GardenButton>
                <GardenButton onClick={() => setIsCreating(false)} variant="secondary">Cancel</GardenButton>
              </div>
            </div>
          </GardenGlassCard>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Current Plants</h2>
          {currentPlants.length === 0 ? (
            <GardenGlassCard className="p-8 text-center">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-xl font-medium mb-2 text-teal-800">No plants yet</h3>
              <p className="text-teal-600 mb-4">Start your garden by creating your plant!</p>
              <GardenButton onClick={() => setIsCreating(true)} variant="primary">
                Create Your Plant
              </GardenButton>
            </GardenGlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPlants.map((plant) => {
                const growthDays = getPlantGrowthDays(plant);
                const status = getStatus(plant);
                
                return (
                  <GardenGlassCard 
                    key={plant.id} 
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow relative"
                    onClick={() => handlePlantClick(plant.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">
                        {SPECIES_OPTIONS.find(s => s.id === plant.species)?.preview}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-teal-500">Day {growthDays}/28</div>
                        {status.isDead && <div className="text-red-500 text-sm">Dead</div>}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-teal-800">{plant.name}</h3>
                    <p className="text-teal-600 text-sm">
                      {SPECIES_OPTIONS.find(s => s.id === plant.species)?.name}
                    </p>
                    {status.missedDays > 0 && !status.isDead && (
                      <div className="text-orange-600 text-sm mt-2">
                        ⚠️ {status.missedDays} day(s) missed
                      </div>
                    )}
                    {growthDays >= 28 && !status.isDead && (
                      <div className="text-green-600 text-sm mt-2">
                        🌱 Ready to transplant!
                      </div>
                    )}
                    
                    {/* Dispose Button */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisposePlant(plant.id);
                        }}
                        disabled={disposingPlantId === plant.id}
                        className="group relative bg-white/80 hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        title="Dispose of plant"
                      >
                        {disposingPlantId === plant.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <div className="flex items-center justify-center w-4 h-4">
                            <span className="text-sm group-hover:scale-110 transition-transform duration-200">🗑️</span>
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 animate-pulse"></div>
                      </button>
                    </div>
                  </GardenGlassCard>
                );
              })}
            </div>
          )}
        </div>

        {transplantedPlants.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-white">Transplanted Plants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transplantedPlants.map((plant) => {
                const growthDays = getPlantGrowthDays(plant);
                
                return (
                  <GardenGlassCard 
                    key={plant.id} 
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow relative opacity-75"
                    onClick={() => handlePlantClick(plant.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">
                        {SPECIES_OPTIONS.find(s => s.id === plant.species)?.preview}
                      </div>
                      <div className="text-right">
                        
                        <div className="text-green-500 text-sm">Transplanted</div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-teal-800">{plant.name}</h3>
                    <p className="text-teal-600 text-sm">
                      {SPECIES_OPTIONS.find(s => s.id === plant.species)?.name}
                    </p>
                    
                    {/* Dispose Button */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisposePlant(plant.id);
                        }}
                        disabled={disposingPlantId === plant.id}
                        className="group relative bg-white/80 hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        title="Dispose of plant"
                      >
                        {disposingPlantId === plant.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <div className="flex items-center justify-center w-4 h-4">
                            <span className="text-sm group-hover:scale-110 transition-transform duration-200">🗑️</span>
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 animate-pulse"></div>
                      </button>
                    </div>
                  </GardenGlassCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      <GardenConfirmationModal
        isOpen={showDisposeConfirm}
        onClose={() => setShowDisposeConfirm(false)}
        onConfirm={confirmDisposePlant}
        title="Confirm Disposal"
        message={`Are you sure you want to dispose of "${plantToDispose?.name}"? This action cannot be undone.`}
        confirmText="Dispose"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
};

export default GardenPage;

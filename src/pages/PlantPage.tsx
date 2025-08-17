import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { usePlantStore } from '../store/usePlantStore';
import GardenGlassCard from '../components/ui/GardenGlassCard';
import GardenButton from '../components/ui/GardenButton';
import PlantVisual from '../components/ui/PlantVisual';


type Species = 'lemon' | 'snake' | 'cactus' | 'monstera';
const SPECIES_OPTIONS: { id: Species; name: string; preview: string }[] = [
  { id: 'lemon', name: 'Lemon Plant', preview: '🍋' },
  { id: 'snake', name: 'Snake Plant', preview: '🌿' },
  { id: 'cactus', name: 'Cactus Plant', preview: '🌵' },
  { id: 'monstera', name: 'Monstera BrokenHeart Plant', preview: '🪴' }
];

const growthStageEmoji = (species: Species, days: number) => {
  switch (species) {
    case 'cactus':
      if (days >= 16) return '🌵';
      if (days >= 10) return '🌵';
      if (days >= 5) return '🌵';
      return '🌵';
    case 'lemon':
      if (days >= 20) return '🍋';
      if (days >= 14) return '🍋';
      if (days >= 8) return '🌿';
      if (days >= 4) return '🌱';
      return '🌱';
    case 'snake':
      if (days >= 20) return '🌿';
      if (days >= 14) return '🌿';
      if (days >= 8) return '🌿';
      if (days >= 4) return '🌱';
      return '🌱';
    case 'monstera':
    default:
      if (days >= 20) return '🪴';
      if (days >= 14) return '🪴';
      if (days >= 8) return '🌿';
      if (days >= 4) return '🌱';
      return '🌱';
  }
};

const PlantPage: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, loadUser, retroactivePointsNotification, clearRetroactiveNotification } = useUserStore();
  const { currentPlant, loadPlant, getStatus, recoverMissedDays, waterToday, transplantPlant, updatePlantName } = usePlantStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [wateringBurst, setWateringBurst] = useState<number | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [isEditingName, setIsEditingName] = useState(false);
  const [plantName, setPlantName] = useState('My Plant');

  console.log('[PlantPage] Component rendered with plantId:', plantId);
  console.log('[PlantPage] User authenticated:', !!user);

  // Auto-clear retroactive points notification after 5 seconds
  useEffect(() => {
    if (retroactivePointsNotification) {
      const timer = setTimeout(() => {
        clearRetroactiveNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [retroactivePointsNotification, clearRetroactiveNotification]);

  useEffect(() => {
    console.log('[PlantPage] useEffect triggered - user:', !!user, 'plantId:', plantId);
    if (!user || !plantId) return;
    loadUser(user.uid);
    loadPlant(plantId);
  }, [user, plantId]);

  useEffect(() => {
    if (currentPlant?.name) {
      setPlantName(currentPlant.name);
    }
  }, [currentPlant?.name]);

  // Re-render at local midnight so on-screen day updates with real calendar day
  useEffect(() => {
    const nowLocal = new Date();
    const nextMidnight = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1, 0, 0, 1, 0);
    const msUntilMidnight = nextMidnight.getTime() - nowLocal.getTime();
    const timeout = setTimeout(() => setNow(new Date()), msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [now]);

  const status = currentPlant ? getStatus(currentPlant) : { missedDays: 0, canWater: false, isDead: false };

  const visualGrowthDays = useMemo(() => {
    if (!currentPlant?.createdAt) return 1;
    const base = differenceInCalendarDays(now, new Date(currentPlant.createdAt)) + 1;
    return Math.max(1, Math.min(28, base));
  }, [currentPlant?.createdAt, now]);

  const stageEmoji = useMemo(() => {
    if (!currentPlant) return '🌱';
    if (status.isDead) return '🪦';
    const s = (currentPlant.species as Species) || 'monstera';
    return SPECIES_OPTIONS.find(opt => opt.id === s)?.preview || '🌱';
  }, [currentPlant, status.isDead]);

  const canRecover = !!profile && !status.isDead && status.missedDays > 0 && (profile.points >= status.missedDays);
  const canWater = !status.isDead && status.canWater;

  const onRecover = async () => {
    if (!plantId) return;
    setActionError(null);
    try {
      await recoverMissedDays(plantId);
    } catch (e: any) {
      setActionError(e.message || 'Failed to recover');
    }
  };

  const onWater = async () => {
    if (!plantId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await waterToday(plantId, visualGrowthDays);
      setActionSuccess('The plant has been watered.');
      setTimeout(() => setActionSuccess(null), 3000);
      setWateringBurst(Date.now());
      setTimeout(() => setWateringBurst(null), 900);
    } catch (e: any) {
      setActionError(e.message || 'Failed to water');
    }
  };

  const onTransplant = async () => {
    if (!plantId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await transplantPlant(plantId);
      setActionSuccess('Plant transplanted! Starting fresh growth cycle.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to transplant');
    }
  };

  const onSaveName = async () => {
    if (!plantId) return;
    setActionError(null);
    try {
      await updatePlantName(plantId, plantName);
      setIsEditingName(false);
      setActionSuccess('Plant name updated!');
      setTimeout(() => setActionSuccess(null), 2000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to update name');
    }
  };

  const onCancelNameEdit = () => {
    setPlantName(currentPlant?.name || 'My Plant');
    setIsEditingName(false);
  };

  return (
    <div className="min-h-screen bg-teal-500">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <GardenGlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveName();
                      if (e.key === 'Escape') onCancelNameEdit();
                    }}
                    className="text-xl font-semibold bg-transparent border-b border-teal-500 focus:outline-none focus:border-teal-700 px-1"
                    autoFocus
                    maxLength={30}
                  />
                  <button
                    onClick={onSaveName}
                    className="text-green-600 hover:text-green-700 text-sm"
                    title="Save name"
                  >
                    ✓
                  </button>
                  <button
                    onClick={onCancelNameEdit}
                    className="text-red-600 hover:text-red-700 text-sm"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xl font-semibold cursor-pointer hover:text-teal-600 text-teal-800" onClick={() => setIsEditingName(true)}>
                    {currentPlant?.name || 'My Plant'}
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-teal-500 hover:text-teal-700 text-sm"
                    title="Edit name"
                  >
                    
                  </button>
                </div>
              )}
            </div>
            <div className="text-sm text-teal-700">Points: <span className="font-bold">{profile?.points ?? 0}</span></div>
          </div>
          
          {/* Back Button - Left Side */}
          <div className="flex items-center mt-4">
            <GardenButton
              onClick={() => navigate('/garden')}
              variant="secondary"
              className="group bg-white/80 hover:bg-teal-50 border border-teal-200 hover:border-teal-300 text-teal-600 hover:text-teal-700 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span className="font-medium">Back</span>
              </div>
            </GardenButton>
          </div>
          {currentPlant && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2 text-teal-700">Species</div>
              <div className="text-lg text-teal-800">
                {SPECIES_OPTIONS.find(s => s.id === currentPlant.species)?.preview} {SPECIES_OPTIONS.find(s => s.id === currentPlant.species)?.name}
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-col items-center">
            <div className="relative select-none">
              <div className="brightness-95">
                <PlantVisual
                  species={(currentPlant?.species as Species) || 'monstera'}
                  growthDays={visualGrowthDays}
                  injured={!status.isDead && status.missedDays > 0}
                  dead={!!status.isDead}
                  burstKey={wateringBurst ?? undefined}
                  onTransplant={onTransplant}
                  isTransplanted={currentPlant?.isTransplanted || false}
                />
              </div>
            </div>
                          <div className="text-sm text-teal-600">
                Day {currentPlant?.isTransplanted ? 28 : visualGrowthDays}/28
              </div>
            <div className="mt-3 text-teal-600 text-sm">
              {currentPlant ? (
                status.isDead ? 'Your plant has died after 10 missed days.' :
                status.missedDays > 0 ? `${status.missedDays} day(s) missed` : 'Healthy'
              ) : 'Loading plant...'}
            </div>
            <div className="mt-6 flex gap-3">
              {currentPlant && !status.isDead && status.missedDays > 0 && !currentPlant.isTransplanted && (
                <GardenButton onClick={onRecover} variant="primary" disabled={!canRecover}>
                  Recover {status.missedDays} day(s) (-{status.missedDays} pt)
                </GardenButton>
              )}
              {currentPlant && !status.isDead && visualGrowthDays < 28 && !currentPlant.isTransplanted && (
                <GardenButton onClick={onWater} variant="secondary">Water</GardenButton>
              )}
              {currentPlant && !status.isDead && visualGrowthDays >= 28 && !currentPlant.isTransplanted && (
                <GardenButton onClick={onTransplant} variant="primary" className="bg-green-600 hover:bg-green-700">
                  Transplant
                </GardenButton>
              )}
              {currentPlant?.isTransplanted && (
                <div className="text-teal-600 text-sm font-medium">
                  🌱 This plant has been transplanted and is now fully grown!
                </div>
              )}
            </div>
            {actionError && (
              <div className="mt-3 text-red-600 text-sm">{actionError}</div>
            )}
            {actionSuccess && (
              <div className="mt-3 text-green-600 text-sm">{actionSuccess}</div>
            )}
            {retroactivePointsNotification && (
              <div className="mt-3 text-teal-600 text-sm bg-teal-50 border border-teal-200 rounded-lg p-3">
                {retroactivePointsNotification}
              </div>
            )}
          </div>
                              {/* Beta Version Notice */}
          <div className="mt-8 text-center text-sm text-gray-700 bg-white/70 border border-gray-300 rounded-xl p-4 shadow-sm">
            <p className="font-medium text-gray-800">
              🚧 Beta Version Notice
            </p>
            <p className="mt-1">
              This is the <span className="font-semibold">beta version</span> of the update. 
              We are actively improving it, and <span className="font-semibold text-teal-700">your contributions are highly appreciated.</span>
            </p>
            <p className="mt-2">
              At the moment, we are still <span className="italic">working on the visual designs for each plant species</span>. 
              If you have creative ideas or would like to share your own designs, we’d love to collaborate!
            </p>
            <p className="mt-2">
              Please feel free to contact us at: 
              <a href="mailto:naman.d.kalla@gmail.com" className="text-teal-600 hover:underline ml-1">
                naman.d.kalla@gmail.com
              </a>
            </p>
          </div>

        </GardenGlassCard>
      </div>
      
      {/* Confirmation Modal */}
      {/* Removed ConfirmationModal as per edit hint */}
    </div>
  );
};

export default PlantPage;



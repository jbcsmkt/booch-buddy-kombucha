import React, { useState, Suspense } from 'react';
import { Beaker, Plus, User, Settings, LogOut, MessageSquare, BarChart3, Wrench, BookOpen, TrendingUp } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { ChatProvider } from './contexts/ChatContext';
import { BrewEntryForm } from './components/BrewEntryForm';
import { FermentationTracking } from './components/FermentationTracking';
import { FlavoringFilteringModule } from './components/FlavoringFilteringModule';
import { CarbonationModule } from './components/CarbonationModule';
import { IntervalDataEntry } from './components/IntervalDataEntry';
import { BrewHistoryTable } from './components/BrewHistoryTable';
import { PhotoUpload } from './components/PhotoUpload';
import { ReminderSystem } from './components/ReminderSystem';
import { AIBrewingTips } from './components/AIBrewingTips';
import { IncrementalDataEntry, IncrementalData } from './components/IncrementalDataEntry';

// Lazy load heavy components
const SettingsModal = React.lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const AIChat = React.lazy(() => import('./components/AIChat').then(m => ({ default: m.AIChat })));
const AdvancedAnalytics = React.lazy(() => import('./components/AdvancedAnalyticsPlaceholder').then(m => ({ default: m.AdvancedAnalytics })));
const EquipmentManagement = React.lazy(() => import('./components/EquipmentManagement').then(m => ({ default: m.EquipmentManagement })));
const RecipeTemplates = React.lazy(() => import('./components/RecipeTemplates').then(m => ({ default: m.RecipeTemplates })));
const AITroubleshooter = React.lazy(() => import('./components/AITroubleshooter').then(m => ({ default: m.AITroubleshooter })));
const ProgressHistory = React.lazy(() => import('./components/ProgressHistory').then(m => ({ default: m.ProgressHistory })));
import { batchService, userSettingsService } from './services/batchServiceWrapper';
import { BatchData, UserSettings } from './types/brewing';
import { generateReminders, getActiveReminders } from './utils/reminders';
import { calculateProgressPercentage, getBatchStatus } from './utils/calculations';

// Loading component for Suspense fallback
const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brewing-amber mr-3"></div>
    <span className="text-gray-600">{text}</span>
  </div>
);

// Simple test component to verify React is working
const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <Beaker className="mx-auto text-brewing-amber mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🍵 Kombucha Brew Tracker
          </h1>
          <p className="text-gray-600 mb-6">
            Professional Brewing Management System
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">✅ React is working!</p>
            <p className="text-green-700 text-sm mt-2">
              The application is loading successfully.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main app content component that uses auth context
const AppContent: React.FC = () => {
  const { user, logout, isLoading, error } = useAuth();
  const [showTest, setShowTest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAITroubleshooter, setShowAITroubleshooter] = useState(false);
  const [troubleshootBatch, setTroubleshootBatch] = useState<BatchData | null>(null);
  const [showIncrementalData, setShowIncrementalData] = useState(false);
  const [incrementalDataBatch, setIncrementalDataBatch] = useState<BatchData | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'new-batch' | 'history' | 'progress' | 'analytics' | 'equipment' | 'templates'>('dashboard');
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [currentBatch, setCurrentBatch] = useState<BatchData | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load data on component mount
  React.useEffect(() => {
    if (user) {
      loadBatches();
      loadUserSettings();
    }
  }, [user]);

  const loadBatches = async () => {
    try {
      const data = await batchService.getAll();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setBatches([]); // Ensure batches is always an array
    }
  };

  const loadUserSettings = async () => {
    try {
      const settings = await userSettingsService.get();
      setUserSettings(settings || {});
    } catch (error) {
      console.error('Failed to load user settings:', error);
      setUserSettings({}); // Provide default empty settings
    }
  };

  const handleCreateBatch = () => {
    const newBatch: Partial<BatchData> = {
      batchNumber: `KB-${Date.now().toString().slice(-6)}`,
      startDate: new Date().toISOString().split('T')[0],
      brewSize: 1,
      teaType: '',
      sugarType: '',
      startPH: 0,
      startBrix: 0,
      starterVolume: 16,
      teaWeight: 2,
      waterVolume: 1,
      sugarAmount: 1,
      lastEntryDate: new Date().toISOString(),
      progressPercentage: 0,
      status: 'needs-attention'
    };
    setCurrentBatch(newBatch as BatchData);
    setIsEditMode(true);
    setActiveView('new-batch');
  };

  const handleSaveBatch = async (batchData: Partial<BatchData>) => {
    console.log('=== SAVE BATCH DEBUG ===');
    console.log('handleSaveBatch called with:', JSON.stringify(batchData, null, 2));
    console.log('currentBatch:', JSON.stringify(currentBatch, null, 2));
    console.log('currentBatch has ID?:', !!currentBatch?.id);
    
    try {
      if (currentBatch?.id) {
        // Update existing batch
        console.log('FLOW: Updating existing batch with ID:', currentBatch.id);
        console.log('Calling batchService.update...');
        const updatedBatch = await batchService.update(currentBatch.id, batchData);
        console.log('SUCCESS: Updated batch received:', updatedBatch);
        setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
        setCurrentBatch(updatedBatch);
        console.log('SUCCESS: Batch saved successfully');
      } else {
        // Create new batch
        console.log('FLOW: Creating new batch');
        const { id, ...createData } = batchData;
        console.log('Data to create (after removing id):', JSON.stringify(createData, null, 2));
        console.log('Calling batchService.create...');
        const newBatch = await batchService.create(createData as Omit<BatchData, 'id'>);
        console.log('SUCCESS: Created batch received:', newBatch);
        setBatches(prev => [newBatch, ...prev]);
        setCurrentBatch(newBatch);
        console.log('SUCCESS: Batch created successfully');
      }
      setIsEditMode(false);
      console.log('=== SAVE BATCH SUCCESS ===');
    } catch (error) {
      console.error('=== SAVE BATCH ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Failed to save batch: ${error.message}`);
    }
  };

  const handleUpdateBatch = (updates: Partial<BatchData>) => {
    console.log('handleUpdateBatch called with:', updates);
    if (!currentBatch) return;
    
    const updatedBatch = { 
      ...currentBatch, 
      ...updates,
      progressPercentage: calculateProgressPercentage({ ...currentBatch, ...updates }),
      status: getBatchStatus({ ...currentBatch, ...updates })
    };
    setCurrentBatch(updatedBatch);
    
    // Remove auto-save behavior - only save when explicitly requested via buttons
    // This prevents unwanted saves when loading existing batches for editing
  };

  const handleEditBatch = (batch: BatchData) => {
    setCurrentBatch(batch);
    setIsEditMode(true);
    setActiveView('new-batch');
  };

  const handleViewBatch = (batch: BatchData) => {
    setCurrentBatch(batch);
    setIsEditMode(false);
    setActiveView('new-batch');
  };

  const handleTroubleshootBatch = (batch: BatchData) => {
    setTroubleshootBatch(batch);
    setShowAITroubleshooter(true);
  };

  const handleAddIncrementalData = (batch: BatchData) => {
    setIncrementalDataBatch(batch);
    setShowIncrementalData(true);
  };

  const handleSaveIncrementalData = async (data: IncrementalData) => {
    if (!incrementalDataBatch) {
      console.error('No batch selected for incremental data');
      return;
    }
    
    try {
      console.log('=== SAVING INCREMENTAL DATA ===');
      console.log('Batch:', incrementalDataBatch.id, incrementalDataBatch.batchNumber);
      console.log('Data to save:', JSON.stringify(data, null, 2));
      
      // Save incremental data to intervals
      console.log('Step 1: Saving to intervals...');
      const intervalPayload = {
        batch_id: incrementalDataBatch.id,
        ...data
      };
      console.log('Interval payload:', JSON.stringify(intervalPayload, null, 2));
      
      const response = await fetch(`http://localhost:5000/api/intervals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(intervalPayload)
      });
      
      console.log('Intervals response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Intervals response error:', errorText);
        throw new Error(`Failed to save incremental data: ${response.status} ${errorText}`);
      }
      
      const savedInterval = await response.json();
      console.log('SUCCESS: Interval saved:', savedInterval);
      
      // Trigger AI analysis
      console.log('Step 2: Triggering AI analysis...');
      const analysisResponse = await fetch(`http://localhost:5000/api/ai/analyze-progress/${incrementalDataBatch.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      console.log('AI analysis response status:', analysisResponse.status);
      
      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        console.log('SUCCESS: AI Analysis result:', analysis);
        
        // Show success message with AI insights
        alert(`Data saved successfully! AI Analysis: ${analysis.insights || 'Analysis complete - check batch details for recommendations.'}`);
      } else {
        const analysisError = await analysisResponse.text();
        console.error('AI analysis error:', analysisError);
        alert(`Data saved but AI analysis failed: ${analysisError}`);
      }
      
      console.log('=== INCREMENTAL DATA SAVE COMPLETE ===');
      
    } catch (error) {
      console.error('=== INCREMENTAL DATA SAVE ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Failed to save incremental data: ${error.message}`);
    }
  };

  const handleDeleteBatch = async (batchId: string | number) => {
    try {
      await batchService.delete(batchId);
      setBatches(prev => prev.filter(b => b.id !== batchId));
      if (currentBatch?.id === batchId) {
        setCurrentBatch(null);
        setActiveView('dashboard');
      }
    } catch (error) {
      console.error('Failed to delete batch:', error);
      alert('Failed to delete batch');
    }
  };

  const activeReminders = (currentBatch && typeof currentBatch === 'object') ? getActiveReminders(generateReminders(currentBatch)) : [];
  
  // Show test component first to verify React is working
  if (showTest) {
    return (
      <div>
        <TestComponent />
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowTest(false)}
            className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }
  
  // Show error state if context failed
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
          <p className="text-red-700 text-sm">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brewing-amber mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Main app interface
  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 sm:gap-4">
                <Beaker className="text-brewing-amber" size={24} />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Kombucha Brew Tracker</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Professional Brewing Management System</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{user.username}</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-brewing-success text-white">
                    {user.role}
                  </span>
                </div>
                
                <button 
                  onClick={() => setShowChat(true)}
                  className="text-gray-600 hover:text-brewing-amber transition-colors p-1 sm:p-2"
                  title="AI Chat Assistant"
                >
                  <MessageSquare size={18} />
                </button>
                
                <button 
                  onClick={() => setShowSettings(true)}
                  className="text-gray-600 hover:text-brewing-amber transition-colors p-1 sm:p-2"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                
                <button 
                  onClick={logout}
                  className="text-gray-600 hover:text-red-600 transition-colors p-1 sm:p-2"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
                
                <button 
                  onClick={handleCreateBatch}
                  className="bg-brewing-amber hover:bg-brewing-copper text-white px-2 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors text-sm sm:text-base"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">New Batch</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeView === 'dashboard'
                    ? 'border-brewing-amber text-brewing-amber'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Beaker size={16} className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Home</span>
              </button>
              <button
                onClick={() => setActiveView('progress')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeView === 'progress'
                    ? 'border-brewing-amber text-brewing-amber'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp size={16} className="inline mr-1 sm:mr-2" />
                Progress
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <>
                {/* Active Reminders */}
                {activeReminders.length > 0 && (
                  <ReminderSystem 
                    reminders={activeReminders}
                    onDismiss={(id) => console.log('Dismiss reminder:', id)}
                    onComplete={(id) => console.log('Complete reminder:', id)}
                  />
                )}

                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Beaker className="mx-auto text-brewing-amber mb-4" size={64} />
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Welcome to Kombucha Brew Tracker!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your professional brewing management system is ready.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-brewing-amber bg-opacity-10 p-4 rounded-lg">
                      <h3 className="font-semibold text-brewing-copper mb-2">Track Batches</h3>
                      <p className="text-sm text-gray-600">Monitor fermentation progress</p>
                    </div>
                    <div className="bg-brewing-success bg-opacity-10 p-4 rounded-lg">
                      <h3 className="font-semibold text-brewing-darkGreen mb-2">AI Analysis</h3>
                      <p className="text-sm text-gray-600">Get intelligent brewing advice</p>
                    </div>
                    <div className="bg-brewing-gold bg-opacity-10 p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                      <h3 className="font-semibold text-brewing-copper mb-2">Analytics</h3>
                      <p className="text-sm text-gray-600">Analyze brewing performance</p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <button
                      onClick={handleCreateBatch}
                      className="bg-brewing-amber hover:bg-brewing-copper text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                    >
                      <Plus size={20} />
                      Start Your First Batch
                    </button>
                  </div>
                </div>

                {/* Brew History on Dashboard */}
                <BrewHistoryTable 
                  batches={batches}
                  onEdit={handleEditBatch}
                  onView={handleViewBatch}
                  onDelete={handleDeleteBatch}
                  onAddData={handleAddIncrementalData}
                />

              </>
            )}

            {/* New/Edit Batch View */}
            {activeView === 'new-batch' && currentBatch && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Edit' : 'View'} Batch {currentBatch.batchNumber}
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                    {!isEditMode && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Edit Batch
                      </button>
                    )}
                    {isEditMode && currentBatch.id && (
                      <button
                        onClick={async () => {
                          try {
                            await handleSaveBatch(currentBatch);
                            setIsEditMode(false);
                          } catch (error) {
                            // Error already handled in handleSaveBatch
                            console.error('Save & View error:', error);
                          }
                        }}
                        className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Save & View
                      </button>
                    )}
                    {isEditMode && !currentBatch.id && (
                      <button
                        onClick={() => {
                          const { id, ...batchData } = currentBatch;
                          handleSaveBatch(batchData);
                        }}
                        className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Save Batch
                      </button>
                    )}
                  </div>
                </div>

                <BrewEntryForm 
                  batch={currentBatch} 
                  onUpdate={handleUpdateBatch}
                  readOnly={!isEditMode}
                />
                
                <FermentationTracking 
                  batch={currentBatch} 
                  onUpdate={handleUpdateBatch}
                  apiKey={userSettings?.openai_api_key}
                  readOnly={!isEditMode}
                />

                <AIBrewingTips 
                  batch={currentBatch}
                  className="mb-6"
                />
                
                <FlavoringFilteringModule 
                  batch={currentBatch} 
                  onUpdate={handleUpdateBatch}
                  apiKey={userSettings?.openai_api_key}
                  readOnly={!isEditMode}
                />
                
                <CarbonationModule 
                  batch={currentBatch} 
                  onUpdate={handleUpdateBatch}
                  readOnly={!isEditMode}
                />
                
                <IntervalDataEntry 
                  batch={currentBatch}
                  apiKey={userSettings?.openai_api_key}
                  readOnly={!isEditMode}
                />
                
                <PhotoUpload 
                  batch={currentBatch}
                  readOnly={!isEditMode}
                />
              </>
            )}

            {/* History View */}
            {activeView === 'history' && (
              <BrewHistoryTable 
                batches={batches}
                onEdit={handleEditBatch}
                onView={handleViewBatch}
                onDelete={handleDeleteBatch}
                onAddData={handleAddIncrementalData}
              />
            )}

            {/* Progress History View */}
            {activeView === 'progress' && (
              <Suspense fallback={<LoadingSpinner text="Loading progress history..." />}>
                <ProgressHistory 
                  batches={batches}
                  showAllBatches={true}
                />
              </Suspense>
            )}

            {/* Analytics View */}
            {activeView === 'analytics' && (
              <AdvancedAnalytics batches={batches} />
            )}

            {/* Equipment View */}
            {activeView === 'equipment' && (
              <EquipmentManagement />
            )}

            {/* Templates View */}
            {activeView === 'templates' && (
              <RecipeTemplates 
                onApplyTemplate={(template) => {
                  const newBatch: Partial<BatchData> = {
                    batchNumber: `KB-${Date.now().toString().slice(-6)}`,
                    startDate: new Date().toISOString().split('T')[0],
                    ...(template as any).recipe_data,
                    lastEntryDate: new Date().toISOString(),
                    progressPercentage: 0,
                    status: 'needs-attention'
                  };
                  setCurrentBatch(newBatch as BatchData);
                  setIsEditMode(true);
                  setActiveView('new-batch');
                }}
                currentBatch={currentBatch === null ? undefined : currentBatch}
              />
            )}
          </div>
        </div>
        
        {/* Modals */}
        <Suspense fallback={<LoadingSpinner text="Loading settings..." />}>
          <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
          />
        </Suspense>
        
        <Suspense fallback={<LoadingSpinner text="Loading AI chat..." />}>
          <AIChat 
            isOpen={showChat} 
            onClose={() => setShowChat(false)}
          />
        </Suspense>

        {showAITroubleshooter && troubleshootBatch && (
          <Suspense fallback={<LoadingSpinner text="Loading AI troubleshooter..." />}>
            <AITroubleshooter
              batch={troubleshootBatch}
              onClose={() => {
                setShowAITroubleshooter(false);
                setTroubleshootBatch(null);
              }}
            />
          </Suspense>
        )}

        <IncrementalDataEntry
          isOpen={showIncrementalData}
          batch={incrementalDataBatch}
          onClose={() => {
            setShowIncrementalData(false);
            setIncrementalDataBatch(null);
          }}
          onSave={handleSaveIncrementalData}
        />
      </div>
    </ChatProvider>
  );
};

// Root App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
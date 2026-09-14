import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  NavTab,
  Header,
  DashboardView,
  ResearchAssistant,
  StudiesView,
  DocumentManager,
  DocumentViewer,
  LoginView,
  LandingPage,
} from './components';
import { checkHealth } from './services/api';
import { useAuth, UserRole } from './context/AuthContext';
import { RefreshCw } from 'lucide-react';

interface ActiveDocViewerState {
  documentName: string;
  initialPage?: number;
  highlightText?: string;
  section?: string;
}

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [prefilledStudyId, setPrefilledStudyId] = useState<string>('');
  const [prefilledDocName, setPrefilledDocName] = useState<string>('');
  const [prefilledQuestion, setPrefilledQuestion] = useState<string>('');
  const [activeDocViewer, setActiveDocViewer] = useState<ActiveDocViewerState | null>(null);
  const [authRoleToOpen, setAuthRoleToOpen] = useState<UserRole | null>(null);

  const checkHealthStatus = async () => {
    const healthy = await checkHealth();
    setIsHealthy(healthy);
  };

  useEffect(() => {
    checkHealthStatus();
    const interval = setInterval(checkHealthStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (tab: NavTab) => {
    if (activeDocViewer) {
      return `Document Viewer · ${activeDocViewer.documentName}`;
    }
    switch (tab) {
      case 'dashboard':
        return 'Clinical Research Dashboard';
      case 'assistant':
        return 'Research Assistant';
      case 'studies':
        return 'Clinical Studies Registry';
      case 'documents':
        return 'Document Library';
    }
  };

  const handleOpenDocViewer = (
    docName: string,
    page: number = 1,
    highlightText?: string,
    section?: string
  ) => {
    setActiveDocViewer({
      documentName: docName,
      initialPage: page,
      highlightText,
      section,
    });
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveDocViewer(null);
    setActiveTab(tab);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium">Initializing PharmaLens workspace...</p>
      </div>
    );
  }

  if (!user) {
    if (authRoleToOpen) {
      return (
        <LoginView
          initialRole={authRoleToOpen}
          onBackToLanding={() => setAuthRoleToOpen(null)}
          onSuccess={() => setAuthRoleToOpen(null)}
        />
      );
    }
    return <LandingPage onOpenLogin={(role) => setAuthRoleToOpen(role)} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Primary Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={handleTabChange} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header isHealthy={isHealthy} activeTabLabel={getPageTitle(activeTab)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeDocViewer ? (
            <div className="h-[calc(100vh-7rem)]">
              <DocumentViewer
                documentName={activeDocViewer.documentName}
                initialPage={activeDocViewer.initialPage}
                highlightText={activeDocViewer.highlightText}
                section={activeDocViewer.section}
                onClose={() => setActiveDocViewer(null)}
                onAskAboutDocument={(docName) => {
                  setActiveDocViewer(null);
                  setPrefilledDocName(docName);
                  setActiveTab('assistant');
                }}
                onAskAboutStudy={(studyId) => {
                  setActiveDocViewer(null);
                  setPrefilledStudyId(studyId);
                  setActiveTab('assistant');
                }}
              />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onNavigateTab={(tab) => {
                    handleTabChange(tab);
                  }}
                  onSelectQuery={(q) => {
                    setPrefilledQuestion(q);
                    handleTabChange('assistant');
                  }}
                />
              )}
              {activeTab === 'assistant' && (
                <ResearchAssistant
                  prefilledStudyId={prefilledStudyId}
                  prefilledDocName={prefilledDocName}
                  prefilledQuestion={prefilledQuestion}
                  onClearPrefilledStudy={() => setPrefilledStudyId('')}
                  onClearPrefilledDoc={() => setPrefilledDocName('')}
                  onClearPrefilledQuestion={() => setPrefilledQuestion('')}
                  onOpenDocument={handleOpenDocViewer}
                />
              )}
              {activeTab === 'studies' && (
                <StudiesView
                  onAskAboutStudy={(studyId) => {
                    setPrefilledStudyId(studyId);
                    setActiveTab('assistant');
                  }}
                  onOpenDocument={handleOpenDocViewer}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentManager
                  onOpenDocument={handleOpenDocViewer}
                  onAskAboutStudy={(studyId) => {
                    setPrefilledStudyId(studyId);
                    setActiveTab('assistant');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  NavTab,
  Header,
  ResearchAssistant,
  StudiesView,
  DocumentManager,
  DocumentViewer,
} from './components';
import { checkHealth } from './services/api';

interface ActiveDocViewerState {
  documentName: string;
  initialPage?: number;
  highlightText?: string;
  section?: string;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('assistant');
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [prefilledStudyId, setPrefilledStudyId] = useState<string>('');
  const [prefilledDocName, setPrefilledDocName] = useState<string>('');
  const [activeDocViewer, setActiveDocViewer] = useState<ActiveDocViewerState | null>(null);

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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Primary Sidebar Navigation (Keep exactly: Research Assistant, Studies, Documents) */}
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
              {activeTab === 'assistant' && (
                <ResearchAssistant
                  prefilledStudyId={prefilledStudyId}
                  prefilledDocName={prefilledDocName}
                  onClearPrefilledStudy={() => setPrefilledStudyId('')}
                  onClearPrefilledDoc={() => setPrefilledDocName('')}
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


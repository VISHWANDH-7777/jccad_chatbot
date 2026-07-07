import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import pages using default imports
import ChatWorkspace from './pages/ChatWorkspace';
import DocumentDashboard from './pages/DocumentDashboard';
import UploadWizard from './pages/UploadWizard';
import ApprovalQueue from './pages/ApprovalQueue';
import DocumentApprovalQueue from './pages/DocumentApprovalQueue';
import KnowledgeDashboard from './pages/KnowledgeDashboard';
import KnowledgeReviewQueue from './pages/KnowledgeReviewQueue';
import EditKnowledge from './pages/EditKnowledge';
import PipelineDashboard from './pages/PipelineDashboard';
import VectorDashboard from './pages/VectorDashboard';
import RetrievalDiagnostics from './pages/RetrievalDiagnostics';
import SearchDiagnostics from './pages/SearchDiagnostics';
import ProfileDashboard from './pages/ProfileDashboard';
import EditProfile from './pages/EditProfile';
import VersionHistory from './pages/VersionHistory';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Core Chat and Admin/Doc Pages (All Public/Direct) */}
        <Route path="/" element={<ChatWorkspace />} />
        <Route path="/documents" element={<DocumentDashboard />} />
        <Route path="/upload" element={<UploadWizard />} />
        <Route path="/approvals" element={<ApprovalQueue />} />
        <Route path="/document-approvals" element={<DocumentApprovalQueue />} />
        <Route path="/knowledge" element={<KnowledgeDashboard />} />
        <Route path="/knowledge/review" element={<KnowledgeReviewQueue />} />
        <Route path="/knowledge/edit/:id" element={<EditKnowledge />} />
        <Route path="/pipelines" element={<PipelineDashboard />} />
        <Route path="/vector" element={<VectorDashboard />} />
        <Route path="/diagnostics/retrieval" element={<RetrievalDiagnostics />} />
        <Route path="/diagnostics/search" element={<SearchDiagnostics />} />
        <Route path="/profile" element={<ProfileDashboard />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/documents/:id/history" element={<VersionHistory />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

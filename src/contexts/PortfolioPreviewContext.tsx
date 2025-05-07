import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface PortfolioPreviewContextType {
  isPreviewOpen: boolean;
  studentId: string | null;
  openPreview: (studentId: string) => void;
  closePreview: () => void;
}

const PortfolioPreviewContext = createContext<PortfolioPreviewContextType | undefined>(undefined);

export function PortfolioPreviewProvider({ children }: { children: ReactNode }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Memoize callbacks to prevent unnecessary re-renders
  const openPreview = useCallback((studentId: string) => {
    setStudentId(studentId);
    setIsPreviewOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    document.body.style.overflow = '';
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isPreviewOpen,
    studentId,
    openPreview,
    closePreview
  }), [isPreviewOpen, studentId, openPreview, closePreview]);

  return (
    <PortfolioPreviewContext.Provider value={contextValue}>
      {children}
    </PortfolioPreviewContext.Provider>
  );
}

export function usePortfolioPreview() {
  const context = useContext(PortfolioPreviewContext);
  if (context === undefined) {
    throw new Error('usePortfolioPreview must be used within a PortfolioPreviewProvider');
  }
  return context;
} 
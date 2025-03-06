export interface ErrorProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
  retry?: () => void;
  className?: string;
  containerClassName?: string;
  showHomeButton?: boolean;
  variant?: 'default' | 'subtle' | 'destructive';
  icon?: React.ReactNode;
  retryButtonText?: string;
  homeButtonText?: string;
  onHome?: () => void;
} 
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './card';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    toast.error('Something went wrong');
    
    // Enhanced error logging for assignment form issues
    console.error('ErrorBoundary: Error details', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }

  private handleRetry = () => {
    console.log('ErrorBoundary: Try Again clicked - attempting to restore state');
    
    // ENHANCED: Try to preserve current form data and existing backup
    try {
      // First, check if there's already a backup
      const existingBackup = localStorage.getItem('assignmentFormBackup');
      
      // Try to capture current form state from DOM
      const formElements = document.querySelectorAll('input, textarea, select');
      const currentFormData: Record<string, any> = {};
      
      formElements.forEach((element: any) => {
        if (element.name && element.value) {
          currentFormData[element.name] = element.value;
        }
      });
      
      // Get assignment ID from URL
      const urlMatch = window.location.href.match(/\/assignment\/([^\/\?]+)/);
      const assignmentId = urlMatch ? urlMatch[1] : null;
      
      if (existingBackup) {
        console.log('ErrorBoundary: Found existing backup data, preserving it');
        const parsed = JSON.parse(existingBackup);
        
        // Merge current form data with existing backup
        const mergedData = {
          ...parsed,
          ...currentFormData,
          id: assignmentId || parsed.id,
          backupTimestamp: Date.now(),
          backupReason: 'error-recovery-try-again',
          lastError: this.state.error?.message
        };
        
        localStorage.setItem('assignmentFormBackup', JSON.stringify(mergedData));
        console.log('ErrorBoundary: Enhanced backup created with current form data');
        toast.success('Preserving your form data...');
      } else if (Object.keys(currentFormData).length > 0 && assignmentId) {
        // Create new backup from current form data
        const backupData = {
          ...currentFormData,
          id: assignmentId,
          backupTimestamp: Date.now(),
          backupReason: 'error-recovery-new-backup',
          lastError: this.state.error?.message
        };
        
        localStorage.setItem('assignmentFormBackup', JSON.stringify(backupData));
        console.log('ErrorBoundary: New backup created from current form state');
        toast.success('Your data has been saved before retry');
      } else {
        console.log('ErrorBoundary: No form data to preserve');
        toast.info('Retrying...');
      }
    } catch (restoreError) {
      console.error('ErrorBoundary: Failed to preserve form data:', restoreError);
      toast.warning('Retrying, but could not preserve form data');
    }
    
    this.setState({ hasError: false, error: null });
  };

  private handleRefresh = () => {
    console.log('ErrorBoundary: Refresh clicked - preserving form data');
    
    // Try to preserve any current form data before refresh
    try {
      const currentUrl = window.location.href;
      if (currentUrl.includes('/assignment/')) {
        // We're in an assignment form, try to preserve data
        const formElements = document.querySelectorAll('input, textarea, select');
        const formData: Record<string, any> = {};
        
        formElements.forEach((element: any) => {
          if (element.name && element.value) {
            formData[element.name] = element.value;
          }
        });
        
        if (Object.keys(formData).length > 0) {
          localStorage.setItem('emergencyFormBackup', JSON.stringify({
            ...formData,
            timestamp: Date.now(),
            url: currentUrl
          }));
          console.log('ErrorBoundary: Emergency form data backed up');
        }
      }
    } catch (backupError) {
      console.error('ErrorBoundary: Failed to create emergency backup:', backupError);
    }
    
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-gray-600">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <p className="text-sm text-gray-500">
                Your form data has been automatically saved and will be restored when you try again.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRefresh}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
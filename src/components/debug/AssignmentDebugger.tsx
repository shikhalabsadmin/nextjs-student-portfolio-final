import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getAllLogs } from '@/lib/debug';

interface DebugLog {
  type: string;
  data: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SubmissionLogs {
  [submissionId: string]: DebugLog[];
}

export function AssignmentDebugger() {
  const [logs, setLogs] = useState<SubmissionLogs>({});

  useEffect(() => {
    // Function to update logs
    const updateLogs = () => {
      const allLogs = getAllLogs();
      setLogs(allLogs);
    };

    // Initial load
    updateLogs();

    // Set up interval to refresh logs
    const interval = setInterval(updateLogs, 1000);

    return () => clearInterval(interval);
  }, []);

  if (Object.keys(logs).length === 0) return null;

  return (
    <Card className="p-4 mt-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Assignment Debug Logs</h3>
      <div className="space-y-8">
        {Object.entries(logs).map(([submissionId, events]) => (
          <div key={submissionId} className="border rounded-lg p-4 bg-white">
            <h4 className="text-md font-medium mb-2">Submission ID: {submissionId}</h4>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                    <span className="font-medium">{event.type}</span>
                  </div>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                  {event.metadata && (
                    <pre className="mt-1 p-2 bg-gray-50 rounded text-sm overflow-x-auto text-gray-500">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 
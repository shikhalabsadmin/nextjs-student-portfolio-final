interface PreviewSectionProps {
  title: string;
  children: React.ReactNode;
}

export const PreviewSection = ({ title, children }: PreviewSectionProps) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-4 py-2 border-b">
      <h3 className="font-medium text-gray-900">{title}</h3>
    </div>
    <div className="p-4 space-y-4">
      {children}
    </div>
  </div>
);

export const PreviewField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <dt className="text-lg font-medium text-gray-500">{label}</dt>
    <dd className="text-lg text-gray-900">{value}</dd>
  </div>
); 
interface AuthHeaderProps {
  title: string;
  subtitle?: string;  // Make subtitle optional
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
  );
};
interface WordCountProps {
  text?: string;
  limit?: number;
}

export const WordCount = ({ text = "", limit = 200 }: WordCountProps) => {
  const wordCount = text.trim().split(/\s+/).length;
  return (
    <div className="mt-1.5 flex justify-end">
      <span className={`text-xs ${wordCount > limit ? 'text-red-500' : 'text-gray-400'}`}>
        {wordCount}/{limit} words
      </span>
    </div>
  );
}; 
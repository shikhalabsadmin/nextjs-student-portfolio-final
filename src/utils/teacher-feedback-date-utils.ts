export const formatDate = (date?: string | Date): string => {
    if (!date) return "Invalid date";
  
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "Invalid date";
  
    const today = new Date();
    const inputDate = new Date(parsedDate);
    
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
  
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((today.getTime() - inputDate.getTime()) / msPerDay);
    const absDiffDays = Math.abs(diffDays);
  
    const numericDate = inputDate.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  
    if (diffDays === 0) return `${numericDate} (Today)`;
  
    // Define thresholds with consistent typing (all functions)
    const thresholds = [
      { 
        limit: 1, 
        past: () => "Yesterday", 
        future: () => "Tomorrow" 
      },
      { 
        limit: 7, 
        past: (d: number) => `${d} day${d > 1 ? "s" : ""} ago`, 
        future: (d: number) => `in ${d} day${d > 1 ? "s" : ""}` 
      },
      { 
        limit: 30, 
        past: (d: number) => `${Math.round(d/7)} week${Math.round(d/7) > 1 ? "s" : ""} ago`, 
        future: (d: number) => `in ${Math.round(d/7)} week${Math.round(d/7) > 1 ? "s" : ""}` 
      },
      { 
        limit: 365, 
        past: (d: number) => `${Math.round(d/30)} month${Math.round(d/30) > 1 ? "s" : ""} ago`, 
        future: (d: number) => `in ${Math.round(d/30)} month${Math.round(d/30) > 1 ? "s" : ""}` 
      },
      { 
        past: (d: number) => `${Math.round(d/365)} year${Math.round(d/365) > 1 ? "s" : ""} ago`, 
        future: (d: number) => `in ${Math.round(d/365)} year${Math.round(d/365) > 1 ? "s" : ""}` 
      }
    ];
  
    for (const threshold of thresholds) {
      if (absDiffDays < (threshold.limit || Infinity)) {
        const text = diffDays > 0 ? threshold.past(absDiffDays) : threshold.future(absDiffDays);
        return `${numericDate} (${text})`;
      }
    }
  
    return numericDate;
  };


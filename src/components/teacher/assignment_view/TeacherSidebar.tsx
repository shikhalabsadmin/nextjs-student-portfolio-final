import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export const TeacherSidebar = () => {

  return (
    <Card className="shadow-sm h-max w-full md:max-w-64 border border-slate-200 mx-auto rounded">
      <CardHeader className="border-b border-slate-200 p-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-slate-900 px-4 sm:px-6 py-3 sm:py-4">
          Work
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-normal text-slate-900 px-3 sm:px-4 py-2 sm:py-3 bg-indigo-200 rounded">
          Work details
        </h3>
      </CardContent>
    </Card>
  );
};
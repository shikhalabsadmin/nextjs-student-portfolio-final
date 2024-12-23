import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, List, Grid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuestionManager } from "@/components/template/QuestionManager";
import { toast } from "sonner";

const AssignmentTemplates = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    description: "",
    grade: 1,
  });

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['assignmentTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_templates')
        .select(`
          *,
          template_questions (*)
        `)
        .order('grade', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreateTemplate = async () => {
    try {
      const { error } = await supabase
        .from('assignment_templates')
        .insert([newTemplate]);

      if (error) throw error;

      toast.success("Template created successfully");
      setIsCreateOpen(false);
      setNewTemplate({ title: "", description: "", grade: 1 });
      refetch();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const grades = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Assignment Templates</h1>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#62C59F] hover:bg-[#62C59F]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grades.map((grade) => (
          <Card key={grade}>
            <CardHeader>
              <CardTitle>Grade {grade}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <p>Loading templates...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates?.filter(t => t.grade === grade).map((template) => (
                    <div 
                      key={template.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <h3 className="font-medium">{template.title}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {(!templates || templates.filter(t => t.grade === grade).length === 0) && (
                    <p className="text-gray-500 text-sm">No templates yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      >
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  placeholder="Enter template title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label>Grade</Label>
                <select
                  value={newTemplate.grade}
                  onChange={(e) => setNewTemplate({ ...newTemplate, grade: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                >
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                className="bg-[#62C59F] hover:bg-[#62C59F]/90"
              >
                Create Template
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit Template Questions Dialog */}
      <Dialog 
        open={!!selectedTemplate} 
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Template Questions</h2>
            {selectedTemplate && (
              <QuestionManager
                templateId={selectedTemplate}
                existingQuestions={
                  templates
                    ?.find(t => t.id === selectedTemplate)
                    ?.template_questions || []
                }
                onSave={() => {
                  setSelectedTemplate(null);
                  refetch();
                }}
              />
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AssignmentTemplates;
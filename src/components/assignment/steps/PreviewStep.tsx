import { useMemo, useState } from "react";
import { PreviewStepProps } from "@/lib/types/preview";
import { Maximize2 } from "lucide-react";
import { SKILLS } from "@/constants";
import { Button } from "@/components/ui/button";
import { AssignmentPreview } from "@/components/preview";

export function PreviewStep({ form }: PreviewStepProps) {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const values = useMemo(() => form.getValues(), [form]);

  const selectedSkills = useMemo(
    () =>
      (values?.selected_skills
        ?.map((id) => SKILLS.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[]) || [],
    [values?.selected_skills]
  );

  // Get the latest image file to use as banner
  const mainImage = useMemo(() => {
    if (!values?.files?.length) return null;

    // Find the latest image file
    const imageFile = [...(values.files || [])].reverse().find((file) => {
      const fileUrl = typeof file === "string" ? file : file?.file_url;
      return fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
    });

    return typeof imageFile === "string"
      ? imageFile
      : imageFile?.file_url || null;
  }, [values?.files]);

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="relative">
      <div className="flex flex-row justify-between items-center mb-4">
        <h2 className="text-sm md:text-base font-semibold text-slate-900">
          Your Assignment
        </h2>
        <Button
          variant="outline"
          onClick={handleToggleFullScreen}
          className="px-2 py-1 md:px-4 md:py-2 flex items-center gap-2.5 text-sm text-slate-800 font-medium"
          size="sm"
        >
          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Full screen</span>
        </Button>
      </div>

      <AssignmentPreview
        values={values}
        selectedSkills={selectedSkills}
        mainImage={mainImage}
        isFullScreen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
      />
    </div>
  );
}
import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface AccordionSection {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface CustomClassNames {
  root?: string;
  item?: string;
  trigger?: string;
  content?: string;
  title?: string;
}

interface FormViewAccordionProps {
  sections: AccordionSection[];
  defaultValue?: string;
  customClassName?: CustomClassNames;
}

export const FormViewAccordion = ({ 
  sections, 
  defaultValue,
  customClassName = {}
}: FormViewAccordionProps) => {
  const { 
    root, 
    item, 
    trigger, 
    content, 
    title 
  } = customClassName;
  
  return (
    <Accordion 
      type="single" 
      collapsible 
      className={cn("w-full border rounded-md", root)}
      defaultValue={defaultValue}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className={cn("border-b last:border-b-0", item)}
        >
          <AccordionTrigger className={cn("py-4 px-6 [&[data-state=open]]:border-b [&[data-state=open]]:border-gray-200", trigger)}>
            <div className="flex items-center">
              {section.icon && <div className="mr-2">{section.icon}</div>}
              <h2 className={cn("text-lg font-medium", title)}>{section.title}</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className={cn("px-6 py-4", content)}>
            {section.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}; 
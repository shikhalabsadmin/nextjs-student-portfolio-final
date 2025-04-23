import { LucideIcon } from "lucide-react";
import { NavVariant } from "@/enums/navigation.enum";

export interface NavLink {
  to: string;
  label: string;
}

export interface NavbarProps {
  variant?: NavVariant;
  title?: string;
  logo?: React.ReactNode;
  signOut?: () => Promise<void>;
  steps?: Array<{
    title: string;
    icon: LucideIcon;
    isActive?: boolean;
    isCompleted?: boolean;
    onClick?: () => void;
  }>;
}

export interface StepConfig {
  title: string;
  icon: LucideIcon;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}

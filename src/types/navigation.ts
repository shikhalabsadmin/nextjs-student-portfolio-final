import { LucideIcon } from "lucide-react";
import { NavVariant } from "@/enums/navigation.enum";
import { UserRole } from "@/enums";

export interface NavLink {
  to: string;
  label: string;
}

export interface NavbarProps {
  variant?: NavVariant;
  title?: string;
  logo?: React.ReactNode;
  signOut?: () => Promise<void>;
  role?: UserRole;
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

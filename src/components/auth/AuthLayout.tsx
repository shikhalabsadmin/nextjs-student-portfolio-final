import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  toggleLabel?: string;
  toggleText?: string;
  onToggle?: (e: React.MouseEvent) => void;
}

export function AuthLayout({
  children,
  title,
  description,
  toggleLabel,
  toggleText,
  onToggle
}: AuthLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {children}

        {toggleLabel && toggleText && onToggle && (
          <p className="px-8 text-center text-sm text-muted-foreground">
            {toggleLabel}
            <button
              onClick={onToggle}
              className="underline hover:text-brand ml-1"
            >
              {toggleText}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

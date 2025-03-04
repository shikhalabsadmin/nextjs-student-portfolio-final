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
  toggleText: string;
  toggleLabel: string;
  onToggle: (e: React.MouseEvent) => void;
}

export function AuthLayout({
  children,
  title,
  description,
  toggleText,
  toggleLabel,
  onToggle,
}: AuthLayoutProps) {
  return (
    <div className="w-full max-w-md" id="auth-form">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-secondary-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children}

          <div className="mt-6 text-center text-sm text-secondary-foreground">
            {toggleLabel}
            <Button
              onClick={onToggle}
              type="button"
              variant="link"
              className="text-primary p-0 h-auto font-normal"
            >
              {toggleText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

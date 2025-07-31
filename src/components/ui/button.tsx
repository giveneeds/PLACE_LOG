import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-elevated disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary - Spotify 스타일 그린 버튼
        default: "bg-primary text-white hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98] rounded-pill",
        
        // Secondary - 테두리 버튼
        secondary: "bg-transparent text-gray-200 border border-gray-700 hover:bg-dark-surface hover:border-gray-600 rounded-pill",
        
        // Ghost - 배경 없는 버튼
        ghost: "bg-transparent text-gray-400 hover:bg-dark-surface hover:text-white rounded-md",
        
        // Destructive - 삭제/위험 액션
        destructive: "bg-error text-white hover:bg-red-700 rounded-pill",
        
        // Outline - 얇은 테두리
        outline: "bg-transparent text-gray-300 border border-gray-800 hover:bg-dark-elevated2 rounded-md",
        
        // Link - 링크 스타일
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

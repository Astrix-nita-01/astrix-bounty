import * as React from "react";
import { cn } from "@/lib/utils";

// Generic Card Component with animations & modern styling
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-xl border border-transparent bg-white/70 backdrop-blur-lg dark:bg-gray-900/70 shadow-md hover:shadow-lg transition-all duration-300 hover:border-violet-500 hover:scale-105",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

// Card Header with sleek padding
const CardHeader = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2 p-5", className)} {...props} />
  ))
);
CardHeader.displayName = "CardHeader";

// Card Title with bold font and tracking for readability
const CardTitle = React.memo(
  React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-3xl font-extrabold leading-tight tracking-wide text-gray-800 dark:text-white", className)} {...props} />
  ))
);
CardTitle.displayName = "CardTitle";

// Card Description with better contrast & readability
const CardDescription = React.memo(
  React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-base text-gray-600 dark:text-gray-300", className)} {...props} />
  ))
);
CardDescription.displayName = "CardDescription";

// Card Content with clean spacing
const CardContent = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  ))
);
CardContent.displayName = "CardContent";

// Card Footer with better alignment and spacing
const CardFooter = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700", className)} {...props} />
  ))
);
CardFooter.displayName = "CardFooter";

// Export Components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

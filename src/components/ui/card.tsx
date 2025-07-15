import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-soft transition-all duration-200 hover-lift",
  {
    variants: {
      variant: {
        default: "border-border bg-card hover:shadow-medium",
        elevated: "border-border bg-card shadow-medium hover:shadow-strong",
        outline: "border-border bg-transparent shadow-none",
        ghost: "border-transparent shadow-none hover:bg-accent/50",
        purple: "border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 shadow-purple hover:shadow-purple",
        blue: "border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 shadow-brand hover:shadow-brand",
        success: "border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50 shadow-soft hover:shadow-medium",
      },
      context: {
        default: "",
        cowork: "hover:border-brand-blue",
        "super-admin": "hover:border-brand-purple",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      context: "default",
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, context, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, context, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean;
  }
>(({ className, noPadding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      !noPadding && "p-6",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    size?: "sm" | "md" | "lg";
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight text-foreground",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean;
  }
>(({ className, noPadding, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && "p-6 pt-0",
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean;
  }
>(({ className, noPadding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      !noPadding && "p-6 pt-0",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Additional Card Components for specific use cases

const CardImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string;
    alt?: string;
    aspectRatio?: "square" | "video" | "wide";
  }
>(({ className, src, alt, aspectRatio = "video", ...props }, ref) => {
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-t-xl bg-muted",
        aspectRatioClasses[aspectRatio],
        className
      )}
      {...props}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      )}
    </div>
  );
});
CardImage.displayName = "CardImage";

const CardBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "success" | "warning" | "error" | "info";
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  }
>(({ className, variant = "default", position = "top-right", children, ...props }, ref) => {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-destructive/10 text-destructive",
    info: "bg-brand-blue/10 text-brand-blue",
  };

  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-10 rounded-full px-2 py-1 text-xs font-medium",
        variantClasses[variant],
        positionClasses[position],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CardBadge.displayName = "CardBadge";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  CardBadge,
};
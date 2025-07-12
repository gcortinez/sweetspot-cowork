import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white hover:shadow-md dark:border-gray-700 dark:bg-gray-800",
        elevated: "border-gray-200 bg-white shadow-md hover:shadow-lg dark:border-gray-700 dark:bg-gray-800",
        outline: "border-gray-300 bg-transparent shadow-none dark:border-gray-600",
        ghost: "border-transparent shadow-none hover:bg-gray-50 dark:hover:bg-gray-800/50",
      },
      context: {
        default: "",
        cowork: "hover:border-blue-200 dark:hover:border-blue-800",
        "super-admin": "hover:border-purple-200 dark:hover:border-purple-800",
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
        "font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
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
      "text-sm text-gray-500 dark:text-gray-400",
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
        "relative overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800",
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
    default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
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
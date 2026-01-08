import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "gold-gradient text-primary-foreground shadow-premium hover:shadow-premium-lg hover:scale-[1.02] active:scale-[0.98]":
              variant === "default",
            "bg-destructive text-destructive-foreground shadow-soft hover:shadow-premium hover:bg-destructive/90":
              variant === "destructive",
            "border-2 border-primary/20 bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 shadow-soft":
              variant === "outline",
            "bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:bg-secondary shadow-soft":
              variant === "secondary",
            "text-foreground/80 hover:bg-primary/10 hover:text-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline font-medium": variant === "link",
          },
          {
            "h-11 px-6 py-2": size === "default",
            "h-9 rounded-lg px-4 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

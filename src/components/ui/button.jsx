import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
        "vf-btn",
        {
          variants: {
            variant: {
              default: "vf-btn-primary",
              primary: "vf-btn-primary",
              secondary: "vf-btn-secondary",
              destructive: "vf-btn-destructive",
              outline: "vf-btn-outline",
              ghost: "vf-btn-ghost",
              gradient: "vf-btn-gradient",
              accent: "vf-btn-accent",
              link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
              default: "vf-btn-md",
              sm: "vf-btn-sm",
              md: "vf-btn-md",
              lg: "vf-btn-lg",
              icon: "vf-btn-icon vf-btn-md",
            },
          },
          defaultVariants: {
            variant: "default",
            size: "default",
          },
        }
      )

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
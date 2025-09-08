import * as React from "react"
import { VisuallyHidden as RadixVisuallyHidden } from "@radix-ui/react-visually-hidden"

const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof RadixVisuallyHidden>,
  React.ComponentPropsWithoutRef<typeof RadixVisuallyHidden>
>(({ ...props }, ref) => (
  <RadixVisuallyHidden ref={ref} {...props} />
))

VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }

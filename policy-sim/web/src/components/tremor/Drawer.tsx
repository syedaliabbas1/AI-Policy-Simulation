// Tremor Drawer [v1.0.0]
import * as React from "react"
import * as DialogPrimitives from "@radix-ui/react-dialog"
import { RiCloseLine } from "@remixicon/react"

import { cx } from "../../lib/tremor/cx"
import { focusRing } from "../../lib/tremor/focusRing"

const Drawer = (
  props: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Root>,
) => {
  return <DialogPrimitives.Root tremor-id="tremor-raw" {...props} />
}
Drawer.displayName = "Drawer"

const DrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Trigger>
>(({ className, ...props }, ref) => (
  <DialogPrimitives.Trigger ref={ref} className={cx(className)} {...props} />
))
DrawerTrigger.displayName = "Drawer.Trigger"

const DrawerClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Close>
>(({ className, ...props }, ref) => (
  <DialogPrimitives.Close ref={ref} className={cx(className)} {...props} />
))
DrawerClose.displayName = "Drawer.Close"

const DrawerPortal = DialogPrimitives.Portal
DrawerPortal.displayName = "DrawerPortal"

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Overlay>
>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitives.Overlay
    ref={forwardedRef}
    className={cx(
      "fixed inset-0 z-50 overflow-y-auto",
      "bg-black/30",
      "data-[state=closed]:animate-hide data-[state=open]:animate-dialog-overlay-show",
      className,
    )}
    style={{ animationDuration: "400ms", animationFillMode: "backwards" }}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content>
>(({ className, children, ...props }, forwardedRef) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitives.Content
      ref={forwardedRef}
      className={cx(
        "fixed inset-y-2 z-50 mx-auto flex w-[95vw] flex-1 flex-col rounded-md border p-4 shadow-lg max-sm:inset-x-2 sm:inset-y-2 sm:right-2 sm:max-w-lg sm:p-6",
        "border-gray-200 dark:border-gray-900",
        "bg-white dark:bg-[#090E1A]",
        "data-[state=closed]:animate-drawer-slide-right-and-fade data-[state=open]:animate-drawer-slide-left-and-fade",
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitives.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx(
      "flex items-start justify-between gap-x-4 border-b border-gray-200 pb-4 dark:border-gray-900",
      className,
    )}
    {...props}
  >
    <div className="mt-1 flex flex-col gap-y-1">{children}</div>
    <DialogPrimitives.Close asChild>
      <button className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-400/10">
        <RiCloseLine className="size-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
      </button>
    </DialogPrimitives.Close>
  </div>
))
DrawerHeader.displayName = "Drawer.Header"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Title>
>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitives.Title
    ref={forwardedRef}
    className={cx("text-base font-semibold text-gray-900 dark:text-gray-50", className)}
    {...props}
  />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerBody = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx("flex-1 py-4", className)} {...props} />
))
DrawerBody.displayName = "Drawer.Body"

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
}

import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** Hairline grid from the dashboard template: cells separated by 1px of border colour. */
export function CellGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-12 gap-px border bg-border", className)}
      {...props}
    />
  )
}

interface CellProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title?: React.ReactNode
  icon?: LucideIcon
  action?: React.ReactNode
  contentClassName?: string
}

/** The template's DashboardCard: square, flat, black, with an optional icon header. */
export function Cell({
  title,
  icon: Icon,
  action,
  className,
  contentClassName,
  children,
  ...props
}: CellProps) {
  return (
    <Card
      className={cn(
        "col-span-12 gap-0 rounded-none bg-background py-0 shadow-none ring-0",
        className
      )}
      {...props}
    >
      {title && (
        <CardHeader className="flex h-10 items-center gap-2 border-b px-4 py-0!">
          <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {Icon && <Icon className="size-3.5" />}
            {title}
          </CardTitle>
          {action && (
            <CardAction className="ml-auto self-center">{action}</CardAction>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("flex-1 p-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

/** Big number + tiny caption, the template's stat tile. */
export function Stat({
  value,
  label,
  className,
}: {
  value: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-2xl tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

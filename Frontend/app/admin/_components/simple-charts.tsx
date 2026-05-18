export function SimpleBarChart({ data }: { data: { name: string; value: number }[] }) {
  const maxValue = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium text-foreground">{item.value.toLocaleString("vi-VN")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SimpleLineChart({ data }: { data: { month: string; revenue: number; users: number }[] }) {
  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue))

  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="relative w-full overflow-hidden rounded-t bg-primary/20"
            style={{ height: `${(item.revenue / maxRevenue) * 150}px` }}
          >
            <div
              className="absolute bottom-0 w-full rounded-t bg-primary transition-all"
              style={{ height: `${(item.users / maxRevenue) * 150}px` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.month}</span>
        </div>
      ))}
    </div>
  )
}

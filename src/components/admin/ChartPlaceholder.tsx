interface ChartPlaceholderProps {
  title: string;
  height?: string;
}

export function ChartPlaceholder({ title, height = "h-64" }: ChartPlaceholderProps) {
  return (
    <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className={`${height} bg-muted/50 rounded-md flex items-center justify-center`}>
        <p className="text-muted-foreground">Chart: {title}</p>
      </div>
    </div>
  );
} 
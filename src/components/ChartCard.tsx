import { type ReactNode } from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <Card elevation={0} sx={{ minWidth: 0 }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: subtitle ? 0.25 : 2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
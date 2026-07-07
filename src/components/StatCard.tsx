import { type ElementType, type ReactNode } from "react";
import { Card, CardContent, Stack, Typography, Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface StatCardProps {
  icon: ElementType;
  label: string;
  hint?: string;
  color?: "primary" | "info" | "error" | "success" | "warning" | "secondary";
  value: ReactNode;
}

export default function StatCard({ icon: Icon, label, hint, color = "primary", value }: StatCardProps) {
  return (
    <Card elevation={0} sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 28,
              height: 28,
              bgcolor: (theme) => alpha(theme.palette[color].main, theme.palette.mode === "dark" ? 0.24 : 0.14),
              color: (theme) => theme.palette[color].main,
            }}
          >
            <Icon fontSize="small" />
          </Avatar>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: "text.secondary" }}
            noWrap
          >
            {label}
          </Typography>
        </Stack>
        <Typography component="div" sx={{ fontFamily: "monospace", pl: 0.5 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: "text.secondary", pl: 0.5, lineHeight: 1.3 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
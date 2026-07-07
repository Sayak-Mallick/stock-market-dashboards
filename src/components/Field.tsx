import { type ChangeEvent } from "react";
import { TextField, InputAdornment } from "@mui/material";

interface FieldProps {
  label: string;
  id: string;
  suffix: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  step: string;
  min?: string;
  placeholder?: string;
}

export default function Field({ label, id, suffix, value, onChange, step, min, placeholder }: FieldProps) {
  return (
    <TextField
      id={id}
      label={label}
      type="number"
      fullWidth
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputMode="decimal"
      slotProps={{
        htmlInput: { step, min: min ?? "0" },
        input: {
          endAdornment: <InputAdornment position="end">{suffix}</InputAdornment>,
        },
      }}
      sx={{
        "& input": { fontFamily: "monospace" },
      }}
    />
  );
}
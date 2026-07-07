import {
  createTheme,
  type ThemeOptions,
  type PaletteMode,
} from "@mui/material/styles";

// Shared design tokens. Call/put/gamma/vega charts map onto the standard
// MUI semantic palette slots (info/error/success/warning) so they stay
// theme-aware without needing a custom palette augmentation.
const shape: ThemeOptions["shape"] = { borderRadius: 12 };

const typography: ThemeOptions["typography"] = {
  fontFamily: [
    '"Inter"',
    '"Roboto"',
    '"Helvetica"',
    "Arial",
    "sans-serif",
  ].join(","),
  h5: { fontWeight: 700, letterSpacing: "-0.01em" },
  subtitle2: { fontWeight: 600 },
  button: { textTransform: "none", fontWeight: 600 },
};

function buildTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? "#0f172a" : "#f4f5f7",
        paper: isDark ? "#151d31" : "#ffffff",
      },
      primary: { main: isDark ? "#60a5fa" : "#2563eb" },
      secondary: { main: isDark ? "#c4b5fd" : "#7c3aed" },
      info: { main: isDark ? "#60a5fa" : "#2563eb" }, // call
      error: { main: isDark ? "#fb7185" : "#e11d48" }, // put
      success: { main: isDark ? "#34d399" : "#059669" }, // gamma
      warning: { main: isDark ? "#fbbf24" : "#d97706" }, // vega
      divider: isDark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.08)",
    },
    shape,
    typography,
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? "rgba(148,163,184,0.14)" : "rgba(15,23,42,0.08)"}`,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: "small",
        },
      },
    },
  });
}

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");

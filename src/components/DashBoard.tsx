import { useState, useMemo, useCallback, type ChangeEvent } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  ThemeProvider,
  CssBaseline,
  type PaletteMode,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDownOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SpeedIcon from "@mui/icons-material/Speed";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BarChartIcon from "@mui/icons-material/BarChart";
import PercentIcon from "@mui/icons-material/Percent";
import CalculateIcon from "@mui/icons-material/Calculate";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  type OptionParams,
  callOptionPrice,
  putOptionPrice,
  callDelta,
  putDelta,
  gamma as computeGamma,
  vega as computeVega,
  callTheta,
  putTheta,
  callRho,
  putRho,
  impliedCallVolatility,
  impliedPutVolatility,
} from "../lib/blackScholesGreeks";
import Field from "./Field";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import { lightTheme, darkTheme } from "../lib/theme";

interface RawInputs {
  underlying: string;
  strike: string;
  days: string;
  rate: string;
  vol: string;
  div: string;
}

type Currency = "₹" | "$";
type OptionType = "call" | "put";

const DEFAULTS: RawInputs = { underlying: "24800", strike: "24800", days: "7", rate: "6.5", vol: "14", div: "0" };

function DashboardContent() {
  const theme = useTheme();
  const call = theme.palette.info.main;
  const put = theme.palette.error.main;
  const gammaColor = theme.palette.success.main;
  const vegaColor = theme.palette.warning.main;
  const gridColor = theme.palette.divider;
  const tickFill = theme.palette.text.secondary;

  const tooltipStyle = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    fontSize: 12,
  };
  const axisTick = { fill: tickFill, fontSize: 11 };
  const axisLine = { stroke: gridColor };
  const legendStyle = { fontSize: 12, color: tickFill };

  const [currency, setCurrency] = useState<Currency>("₹");
  const [inputs, setInputs] = useState<RawInputs>(DEFAULTS);
  const [ivInputs, setIvInputs] = useState<{ marketPrice: string; type: OptionType }>({
    marketPrice: "",
    type: "call",
  });

  const handleChange = useCallback(
    (field: keyof RawInputs) => (e: ChangeEvent<HTMLInputElement>) =>
      setInputs((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );
  const handleReset = useCallback(() => {
    setInputs(DEFAULTS);
    setIvInputs({ marketPrice: "", type: "call" });
  }, []);

  const params: OptionParams = useMemo(
    () => ({
      underlyingPrice: parseFloat(inputs.underlying),
      exercisePrice: parseFloat(inputs.strike),
      time: parseFloat(inputs.days) / 365,
      interest: parseFloat(inputs.rate) / 100,
      volatility: parseFloat(inputs.vol) / 100,
      dividend: parseFloat(inputs.div) / 100,
    }),
    [inputs]
  );

  const validationError = useMemo(() => {
    if (!Number.isFinite(params.underlyingPrice) || params.underlyingPrice <= 0)
      return "Underlying price must be greater than 0.";
    if (!Number.isFinite(params.exercisePrice) || params.exercisePrice <= 0)
      return "Strike price must be greater than 0.";
    if (!Number.isFinite(params.time) || params.time <= 0) return "Days to expiry must be at least 1.";
    if (!Number.isFinite(params.volatility) || params.volatility <= 0) return "Volatility must be greater than 0.";
    if (!Number.isFinite(params.interest)) return "Enter a valid interest rate.";
    return null;
  }, [params]);

  const isValid = !validationError;

  const greeks = useMemo(() => {
    if (!isValid) return null;
    return {
      call: {
        price: callOptionPrice(params),
        delta: callDelta(params),
        theta: callTheta(params),
        rho: callRho(params),
      },
      put: {
        price: putOptionPrice(params),
        delta: putDelta(params),
        theta: putTheta(params),
        rho: putRho(params),
      },
      gamma: computeGamma(params),
      vega: computeVega(params),
    };
  }, [params, isValid]);

  const strikeSeries = useMemo(() => {
    if (!isValid) return [];
    const points = 25;
    const minK = params.exercisePrice * 0.7;
    const maxK = params.exercisePrice * 1.3;
    const step = (maxK - minK) / (points - 1);
    return Array.from({ length: points }, (_, i) => {
      const exercisePrice = minK + i * step;
      const p: OptionParams = { ...params, exercisePrice };
      return {
        strike: Math.round(exercisePrice),
        callDelta: Number(callDelta(p).toFixed(4)),
        putDelta: Number(putDelta(p).toFixed(4)),
        gamma: Number(computeGamma(p).toFixed(5)),
        vega: Number(computeVega(p).toFixed(4)),
        callTheta: Number(callTheta(p).toFixed(4)),
        putTheta: Number(putTheta(p).toFixed(4)),
      };
    });
  }, [params, isValid]);

  const priceSeries = useMemo(() => {
    if (!isValid) return [];
    const points = 25;
    const minS = params.underlyingPrice * 0.7;
    const maxS = params.underlyingPrice * 1.3;
    const step = (maxS - minS) / (points - 1);
    return Array.from({ length: points }, (_, i) => {
      const underlyingPrice = minS + i * step;
      const p: OptionParams = { ...params, underlyingPrice };
      return {
        underlying: Math.round(underlyingPrice),
        callPrice: Number(callOptionPrice(p).toFixed(2)),
        putPrice: Number(putOptionPrice(p).toFixed(2)),
      };
    });
  }, [params, isValid]);

  const comparisonData = greeks
    ? [
      { metric: "Delta", Call: Number(greeks.call.delta.toFixed(4)), Put: Number(greeks.put.delta.toFixed(4)) },
      { metric: "Theta/day", Call: Number(greeks.call.theta.toFixed(4)), Put: Number(greeks.put.theta.toFixed(4)) },
      { metric: "Rho (1%)", Call: Number(greeks.call.rho.toFixed(4)), Put: Number(greeks.put.rho.toFixed(4)) },
    ]
    : [];

  const ivResult = useMemo(() => {
    const target = parseFloat(ivInputs.marketPrice);
    if (!isValid || !Number.isFinite(target) || target <= 0) return null;
    const solve = ivInputs.type === "call" ? impliedCallVolatility : impliedPutVolatility;
    return solve(params, target);
  }, [ivInputs, params, isValid]);

  const fmt = (n: number | undefined, d = 2) =>
    Number.isFinite(n)
      ? (n as number).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d })
      : "—";

  return (
    <Box sx={{ minHeight: "100%", width: "100%", bgcolor: "background.default", p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1280, mx: "auto" }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
            py: 2,
          }}
        >
          <Box>
            <Typography variant="h5">Options Greeks Calculator</Typography>
            <Typography variant="body2" color="text.secondary">
              Black-Scholes pricing, greeks &amp; implied volatility
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              value={currency}
              exclusive
              size="small"
              onChange={(_, v: Currency | null) => v && setCurrency(v)}
              aria-label="Currency"
            >
              <ToggleButton value="₹">₹</ToggleButton>
              <ToggleButton value="$">$</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" size="small" startIcon={<RestartAltIcon />} onClick={handleReset}>
              Reset
            </Button>
          </Stack>
        </Paper>

        {/* Main layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <Stack
            spacing={2}
            sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}
          >
            <Card elevation={0}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">Parameters</Typography>
                  {validationError && (
                    <Typography variant="caption" color="error">
                      Error
                    </Typography>
                  )}
                </Stack>

                {validationError && (
                  <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />}>
                    {validationError}
                  </Alert>
                )}

                <Stack spacing={2}>
                  <Field label="Underlying Price" id="underlying" suffix={currency} value={inputs.underlying} onChange={handleChange("underlying")} step="0.05" placeholder="e.g. 24800" />
                  <Field label="Strike Price" id="strike" suffix={currency} value={inputs.strike} onChange={handleChange("strike")} step="0.05" placeholder="e.g. 24800" />
                  <Field label="Days to Expiry" id="days" suffix="days" value={inputs.days} onChange={handleChange("days")} step="1" min="1" placeholder="e.g. 7" />
                  <Field label="Interest Rate" id="rate" suffix="%" value={inputs.rate} onChange={handleChange("rate")} step="0.1" placeholder="e.g. 6.5" />
                  <Field label="Volatility (IV)" id="vol" suffix="%" value={inputs.vol} onChange={handleChange("vol")} step="0.1" placeholder="e.g. 14" />
                  <Field label="Dividend Yield" id="div" suffix="%" value={inputs.div} onChange={handleChange("div")} step="0.1" placeholder="0" />
                </Stack>
              </CardContent>
            </Card>

            <Accordion elevation={0} disableGutters sx={{ "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InfoOutlinedIcon fontSize="small" color="disabled" />
                  <Typography variant="body2" color="text.secondary">
                    Model assumptions
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  European-style exercise, lognormal price distribution, constant volatility &amp; rates over the
                  option&apos;s life, continuous dividend yield. Theta is per calendar day; vega and rho are scaled
                  to a 1% change in volatility and interest rate respectively.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>

          {/* Right column */}
          <Stack spacing={3} sx={{ minWidth: 0 }}>
            {/* Stats */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              <StatCard
                icon={TrendingUpIcon}
                label="Call Price"
                color="info"
                value={
                  <Typography variant="subtitle1" fontWeight={700}>
                    {currency + fmt(greeks?.call.price)}
                  </Typography>
                }
              />
              <StatCard
                icon={TrendingDownIcon}
                label="Put Price"
                color="error"
                value={
                  <Typography variant="subtitle1" fontWeight={700}>
                    {currency + fmt(greeks?.put.price)}
                  </Typography>
                }
              />
              <StatCard
                icon={ShowChartIcon}
                label="Delta"
                color="secondary"
                hint="Change per 1pt move"
                value={
                  <Stack direction="row" spacing={2} sx={{ fontSize: 14, fontWeight: 700 }}>
                    <Box component="span" sx={{ color: "info.main" }}>
                      C {fmt(greeks?.call.delta, 4)}
                    </Box>
                    <Box component="span" sx={{ color: "error.main" }}>
                      P {fmt(greeks?.put.delta, 4)}
                    </Box>
                  </Stack>
                }
              />
              <StatCard
                icon={SpeedIcon}
                label="Gamma"
                color="success"
                hint="Same for call & put"
                value={
                  <Typography variant="body2" fontWeight={700}>
                    {fmt(greeks?.gamma, 5)}
                  </Typography>
                }
              />
              <StatCard
                icon={AccessTimeIcon}
                label="Theta"
                color="warning"
                hint="Decay per day"
                value={
                  <Stack direction="row" spacing={2} sx={{ fontSize: 14, fontWeight: 700 }}>
                    <Box component="span" sx={{ color: "info.main" }}>
                      C {fmt(greeks?.call.theta, 4)}
                    </Box>
                    <Box component="span" sx={{ color: "error.main" }}>
                      P {fmt(greeks?.put.theta, 4)}
                    </Box>
                  </Stack>
                }
              />
              <StatCard
                icon={BarChartIcon}
                label="Vega"
                color="warning"
                hint="Per 1% change in IV"
                value={
                  <Typography variant="body2" fontWeight={700}>
                    {fmt(greeks?.vega, 4)}
                  </Typography>
                }
              />
              <StatCard
                icon={PercentIcon}
                label="Rho"
                color="secondary"
                hint="Per 1% change in rate"
                value={
                  <Stack direction="row" spacing={2} sx={{ fontSize: 14, fontWeight: 700 }}>
                    <Box component="span" sx={{ color: "info.main" }}>
                      C {fmt(greeks?.call.rho, 4)}
                    </Box>
                    <Box component="span" sx={{ color: "error.main" }}>
                      P {fmt(greeks?.put.rho, 4)}
                    </Box>
                  </Stack>
                }
              />
            </Box>

            {/* Charts */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 2.5 }}>
              <ChartCard title="Delta vs Strike Price" subtitle="Delta across nearby strikes">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={strikeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="strike" tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine x={Math.round(params.exercisePrice)} stroke={gridColor} strokeDasharray="4 4" label="ATM" />
                    <Line type="monotone" dataKey="callDelta" name="Call Delta" stroke={call} strokeWidth={2} dot={false} animationDuration={300} />
                    <Line type="monotone" dataKey="putDelta" name="Put Delta" stroke={put} strokeWidth={2} dot={false} animationDuration={300} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Gamma & Vega vs Strike" subtitle="Peak near the money">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={strikeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="strike" tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <YAxis yAxisId="left" tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <YAxis yAxisId="right" orientation="right" tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine x={Math.round(params.exercisePrice)} stroke={gridColor} strokeDasharray="4 4" label="ATM" />
                    <Line yAxisId="left" type="monotone" dataKey="gamma" name="Gamma" stroke={gammaColor} strokeWidth={2} dot={false} animationDuration={300} />
                    <Line yAxisId="right" type="monotone" dataKey="vega" name="Vega" stroke={vegaColor} strokeWidth={2} dot={false} animationDuration={300} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Theta vs Strike Price" subtitle="Time decay steepest at-the-money">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={strikeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="strike" tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine x={Math.round(params.exercisePrice)} stroke={gridColor} strokeDasharray="4 4" label="ATM" />
                    <Line type="monotone" dataKey="callTheta" name="Call Theta" stroke={call} strokeWidth={2} dot={false} animationDuration={300} />
                    <Line type="monotone" dataKey="putTheta" name="Put Theta" stroke={put} strokeWidth={2} dot={false} animationDuration={300} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Option Price vs Underlying" subtitle="Theoretical call & put value">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={priceSeries} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="underlying" tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={axisLine} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine x={Math.round(params.underlyingPrice)} stroke={gridColor} strokeDasharray="4 4" label="Spot" />
                    <Line type="monotone" dataKey="callPrice" name="Call Price" stroke={call} strokeWidth={2} dot={false} animationDuration={300} />
                    <Line type="monotone" dataKey="putPrice" name="Put Price" stroke={put} strokeWidth={2} dot={false} animationDuration={300} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Box>

            {/* Comparison */}
            <ChartCard title="Greek Comparison" subtitle="Call vs Put side-by-side">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="metric" tick={axisTick} tickLine={false} axisLine={axisLine} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={axisLine} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="Call" fill={call} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Put" fill={put} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* IV solver */}
            <Card elevation={0}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                      opacity: 0.9,
                    }}
                  >
                    <CalculateIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle2">Implied Volatility Solver</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Enter a traded market price to back out the volatility the market is pricing in.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-end" }} sx={{ mt: 1 }}>
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <Field
                      label={`Market Price (${currency})`}
                      id="ivPrice"
                      suffix={currency}
                      value={ivInputs.marketPrice}
                      onChange={(e) => setIvInputs((s) => ({ ...s, marketPrice: e.target.value }))}
                      step="0.05"
                      min="0"
                      placeholder="e.g. 145.50"
                    />
                  </Box>
                  <ToggleButtonGroup
                    value={ivInputs.type}
                    exclusive
                    size="small"
                    onChange={(_, v: OptionType | null) => v && setIvInputs((s) => ({ ...s, type: v }))}
                    aria-label="Option Type"
                  >
                    <ToggleButton value="call" sx={{ color: "info.main", "&.Mui-selected": { bgcolor: "info.main", color: "info.contrastText" } }}>
                      Call
                    </ToggleButton>
                    <ToggleButton value="put" sx={{ color: "error.main", "&.Mui-selected": { bgcolor: "error.main", color: "error.contrastText" } }}>
                      Put
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                {ivResult !== null && (
                  <Box
                    sx={{
                      mt: 3,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "action.hover",
                      p: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Implied Volatility
                      </Typography>
                      <Typography variant="h6" fontFamily="monospace" color="secondary.main">
                        {fmt(ivResult * 100, 2)}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Your Input Volatility
                      </Typography>
                      <Typography variant="h6" fontFamily="monospace">
                        {fmt(params.volatility * 100, 2)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export default function OptionsGreeksDashboard() {
  const [mode, setMode] = useState<PaletteMode>("dark");
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
          aria-label="Toggle light and dark mode"
          sx={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 10,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
        <DashboardContent />
      </Box>
    </ThemeProvider>
  );
}
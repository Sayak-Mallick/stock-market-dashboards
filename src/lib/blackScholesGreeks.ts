export interface OptionParams {
  underlyingPrice: number;
  exercisePrice: number;
  time: number; // years
  interest: number; // decimal, e.g. 0.065
  volatility: number; // decimal, e.g. 0.14
  dividend: number; // decimal
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

const ncdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
const npdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

function d1d2(p: OptionParams): [number, number] {
  const {
    underlyingPrice: S,
    exercisePrice: K,
    time: T,
    interest: r,
    volatility: v,
    dividend: q,
  } = p;
  const d1 = (Math.log(S / K) + (r - q + 0.5 * v * v) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);
  return [d1, d2];
}

export const callOptionPrice = (p: OptionParams): number => {
  const [d1, d2] = d1d2(p);
  const {
    underlyingPrice: S,
    exercisePrice: K,
    time: T,
    interest: r,
    dividend: q,
  } = p;
  return S * Math.exp(-q * T) * ncdf(d1) - K * Math.exp(-r * T) * ncdf(d2);
};

export const putOptionPrice = (p: OptionParams): number => {
  const [d1, d2] = d1d2(p);
  const {
    underlyingPrice: S,
    exercisePrice: K,
    time: T,
    interest: r,
    dividend: q,
  } = p;
  return K * Math.exp(-r * T) * ncdf(-d2) - S * Math.exp(-q * T) * ncdf(-d1);
};

export const callDelta = (p: OptionParams): number =>
  Math.exp(-p.dividend * p.time) * ncdf(d1d2(p)[0]);

export const putDelta = (p: OptionParams): number =>
  -Math.exp(-p.dividend * p.time) * ncdf(-d1d2(p)[0]);

export const gamma = (p: OptionParams): number => {
  const [d1] = d1d2(p);
  return (
    (Math.exp(-p.dividend * p.time) * npdf(d1)) /
    (p.underlyingPrice * p.volatility * Math.sqrt(p.time))
  );
};

export const vega = (p: OptionParams): number => {
  const [d1] = d1d2(p);
  return (
    (p.underlyingPrice *
      Math.exp(-p.dividend * p.time) *
      npdf(d1) *
      Math.sqrt(p.time)) /
    100
  );
};

export const callTheta = (p: OptionParams): number => {
  const [d1, d2] = d1d2(p);
  const {
    underlyingPrice: S,
    exercisePrice: K,
    time: T,
    interest: r,
    volatility: v,
    dividend: q,
  } = p;
  const term1 = (-S * Math.exp(-q * T) * npdf(d1) * v) / (2 * Math.sqrt(T));
  const term2 = -r * K * Math.exp(-r * T) * ncdf(d2);
  const term3 = q * S * Math.exp(-q * T) * ncdf(d1);
  return (term1 + term2 + term3) / 365;
};

export const putTheta = (p: OptionParams): number => {
  const [d1, d2] = d1d2(p);
  const {
    underlyingPrice: S,
    exercisePrice: K,
    time: T,
    interest: r,
    volatility: v,
    dividend: q,
  } = p;
  const term1 = (-S * Math.exp(-q * T) * npdf(d1) * v) / (2 * Math.sqrt(T));
  const term2 = r * K * Math.exp(-r * T) * ncdf(-d2);
  const term3 = -q * S * Math.exp(-q * T) * ncdf(-d1);
  return (term1 + term2 + term3) / 365;
};

export const callRho = (p: OptionParams): number => {
  const [, d2] = d1d2(p);
  return (
    (p.exercisePrice * p.time * Math.exp(-p.interest * p.time) * ncdf(d2)) / 100
  );
};

export const putRho = (p: OptionParams): number => {
  const [, d2] = d1d2(p);
  return (
    (-p.exercisePrice * p.time * Math.exp(-p.interest * p.time) * ncdf(-d2)) /
    100
  );
};

function impliedVol(
  p: OptionParams,
  target: number,
  priceFn: (p: OptionParams) => number,
): number {
  let lo = 0.001;
  let hi = 5;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const price = priceFn({ ...p, volatility: mid });
    if (Math.abs(price - target) < 1e-6) return mid;
    if (price > target) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export const impliedCallVolatility = (
  p: OptionParams,
  target: number,
): number => impliedVol(p, target, callOptionPrice);

export const impliedPutVolatility = (p: OptionParams, target: number): number =>
  impliedVol(p, target, putOptionPrice);

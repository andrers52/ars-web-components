// Canonical chart type definitions for ars-web-components data visualization components.

/** Color palette shared across all chart types. */
export interface ChartColorPalette {
  lineColor?: string;
  backgroundColor?: string;
  gridColor?: string;
  axisColor?: string;
  labelColor?: string;
}

/** A single OHLCV candlestick data point. */
export interface CandleDataPoint {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Millisecond timestamp. */
  time: number;
}

/** An order overlay on a candlestick chart. */
export interface CandleOrder {
  side: string;
  amount: number;
  price: number;
}

/** Renderer-specific options for candlestick charts. */
export interface CandleRendererOptions {
  upColor?: string;
  downColor?: string;
  volumeOpacity?: number;
  volumeHeightRatio?: number;
  candleGap?: number;
  priceTickCount?: number;
  dateTickCount?: number;
  orderLabelPosition?: "left" | "right";
}

/** Uniform padding for chart plot areas. */
export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

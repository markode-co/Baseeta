"use client";

import * as iconv from "iconv-lite";
import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

export type PrinterId = "cashier_printer" | "kitchen_printer" | "hall_printer";
export type PrinterType = "browser" | "bluetooth" | "usb" | "network";
export type ConnectionType = "browser" | "bluetooth" | "usb" | "network";
export type PrinterCodePage = "cp864" | "windows-1256" | "utf8";
export type PaperWidth = 58 | 80;
export type PrinterProtocol = "escpos" | "tspl";
export type PrinterMode = "none";

export interface PrinterDefaults {
  codePage: PrinterCodePage;
  density: number;
  direction: 0 | 1;
  printerMode: PrinterMode;
  paperWidth: PaperWidth;
  fontScale: number;
  retryAttempts: number;
}

export interface PrinterDeviceConfig extends PrinterDefaults {
  id: PrinterId;
  label: string;
  enabled: boolean;
  connectionType: ConnectionType;
  deviceName?: string;
  deviceAddress?: string;
  bluetoothDeviceId?: string;
  usbVendorId?: number;
  usbProductId?: number;
  usbSerialNumber?: string;
  networkIp?: string;
  networkPort?: number;
  lastConnected?: string;
}

export interface PrinterManagerConfig {
  cashier_printer: PrinterDeviceConfig;
  kitchen_printer: PrinterDeviceConfig;
  hall_printer: PrinterDeviceConfig;
}

export interface PrinterRuntimeStatus {
  id: PrinterId;
  deviceName?: string;
  deviceAddress?: string;
  connectionType: ConnectionType;
  isConnected: boolean;
  lastConnected?: string;
  queueLength: number;
  signalStrength?: string;
}

export interface PrintQueueJob {
  printerId: PrinterId;
  data: Uint8Array;
  description: string;
}

export interface ReceiptLineItem {
  name: string;
  nameAr: string | null;
  qty: number;
  price?: number;
  notes?: string | null;
  modifiers?: Array<{ name: string; nameAr?: string | null; qty?: number }>;
}

export interface CashierReceiptData {
  orgName: string;
  orgAddress?: string;
  orgWebsite?: string;
  logoUrl?: string;
  logoText?: string;
  receiptHeader?: string;
  orderNumber: string | number;
  createdAt?: Date | string;
  customerName?: string;
  customerPhone?: string;
  tableInfo?: string;
  items: ReceiptLineItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  paymentMethod: string;
  footer?: string;
  qrData?: string;
}

export interface KitchenTicketData {
  orderNumber: string | number;
  createdAt?: Date | string;
  tableInfo?: string;
  orderType?: string;
  items: ReceiptLineItem[];
  notes?: string;
}

export interface HallTicketData {
  orderNumber: string | number;
  tableInfo?: string;
  createdAt?: Date | string;
  items: ReceiptLineItem[];
  notes?: string;
}

export interface ClosingReportPrintData {
  orgName: string;
  periodLabel: string;
  range: string;
  ordersCount: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  avgOrder: number;
  byPayment: Array<{ label: string; total: number; count: number; percentage?: number }>;
}

export interface SalesReportPrintData {
  orgName: string;
  printedAt: string;
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  allTimeRevenue: number;
  allTimeOrdersCount: number;
  avgOrderValue: number;
  topItems: Array<{ name: string; nameAr: string | null; quantity: number; total: number }>;
  ordersByType: Array<{ label: string; count: number; total: number }>;
}

export interface PrinterConfig {
  type: PrinterType;
  networkIp?: string;
  networkPort?: number;
  bluetoothName?: string;
  bluetoothDeviceId?: string;
  protocol?: PrinterProtocol;
  codePage?: PrinterCodePage;
  paperWidth?: PaperWidth;
  fontScale?: number;
  enableRetry?: boolean;
  retryAttempts?: number;
}

type BluetoothWriteCharacteristic = BluetoothRemoteGATTCharacteristic;
type BluetoothSession = {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothWriteCharacteristic;
};

interface UsbEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
}

interface UsbAlternate {
  interfaceClass?: number;
  endpoints: UsbEndpoint[];
}

interface UsbInterface {
  interfaceNumber: number;
  alternates: UsbAlternate[];
}

interface UsbDevice {
  productName?: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  opened: boolean;
  configuration?: { interfaces: UsbInterface[] };
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<unknown>;
}

interface UsbNavigator {
  getDevices(): Promise<UsbDevice[]>;
  requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<UsbDevice>;
}

type UsbSession = {
  device: UsbDevice;
  endpointNumber: number;
  interfaceNumber: number;
};

const STORAGE_KEY = "printer-manager-config-v1";
const LEGACY_STORAGE_KEY = "printer-config";
const RECEIPT_SETTINGS_KEY = "receipt-settings";
const ARABIC_PRINTER_CODE_PAGE: PrinterCodePage = "cp864";

export const DEFAULT_PRINTER_SETTINGS: PrinterDefaults = {
  codePage: ARABIC_PRINTER_CODE_PAGE,
  density: 8,
  direction: 0,
  printerMode: "none",
  paperWidth: 80,
  fontScale: 1,
  retryAttempts: 3,
};

const DEFAULT_MANAGER_CONFIG: PrinterManagerConfig = {
  cashier_printer: {
    ...DEFAULT_PRINTER_SETTINGS,
    id: "cashier_printer",
    label: "طابعة الكاشير",
    enabled: true,
    connectionType: "bluetooth",
  },
  kitchen_printer: {
    ...DEFAULT_PRINTER_SETTINGS,
    id: "kitchen_printer",
    label: "طابعة المطبخ",
    enabled: false,
    connectionType: "bluetooth",
  },
  hall_printer: {
    ...DEFAULT_PRINTER_SETTINGS,
    id: "hall_printer",
    label: "طابعة الصالة",
    enabled: false,
    connectionType: "bluetooth",
  },
};

const ESC_POS_CODE_PAGE_NUMBERS: Record<PrinterCodePage, number> = {
  cp864: 0x16,
  "windows-1256": 0x11,
  utf8: 0xff,
};

const BLUETOOTH_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
];

const BLUETOOTH_WRITE_CHARACTERISTICS = [
  "00002af1-0000-1000-8000-00805f9b34fb",
  "49535343-8841-43f4-a8d4-ecbe34729bb3",
  "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
];

const USB_THERMAL_PRINTER_FILTERS = [
  { vendorId: 0x0483 },
  { vendorId: 0x0403 },
  { vendorId: 0x1208 },
  { vendorId: 0x0493 },
  { vendorId: 0x04b8 },
  { vendorId: 0x0fe6 },
  { vendorId: 0x067b },
  { vendorId: 0x1a86 },
];

function cloneConfig(config: PrinterManagerConfig): PrinterManagerConfig {
  return JSON.parse(JSON.stringify(config)) as PrinterManagerConfig;
}

function mergeConfig(saved: Partial<PrinterManagerConfig> | null): PrinterManagerConfig {
  const base = cloneConfig(DEFAULT_MANAGER_CONFIG);
  if (!saved) return base;
  return {
    cashier_printer: { ...base.cashier_printer, ...saved.cashier_printer, codePage: ARABIC_PRINTER_CODE_PAGE },
    kitchen_printer: { ...base.kitchen_printer, ...saved.kitchen_printer, codePage: ARABIC_PRINTER_CODE_PAGE },
    hall_printer: { ...base.hall_printer, ...saved.hall_printer, codePage: ARABIC_PRINTER_CODE_PAGE },
  };
}

export function loadPrinterManagerConfig(): PrinterManagerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeConfig(JSON.parse(raw) as Partial<PrinterManagerConfig>);
  } catch {}

  const legacy = loadLegacyPrinterConfig();
  if (legacy) {
    return mergeConfig({
      cashier_printer: {
        id: "cashier_printer",
        label: "طابعة الكاشير",
        enabled: true,
        connectionType: legacy.type,
        deviceName: legacy.bluetoothName,
        bluetoothDeviceId: legacy.bluetoothDeviceId,
        networkIp: legacy.networkIp,
        networkPort: legacy.networkPort,
        codePage: legacy.codePage || "cp864",
        paperWidth: legacy.paperWidth || 80,
        fontScale: legacy.fontScale || 1,
        retryAttempts: legacy.retryAttempts || 3,
        density: 8,
        direction: 0,
        printerMode: "none",
      },
    });
  }

  return cloneConfig(DEFAULT_MANAGER_CONFIG);
}

export function savePrinterManagerConfig(config: PrinterManagerConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeConfig(config)));
  } catch {}
}

function loadLegacyPrinterConfig(): PrinterConfig | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) as PrinterConfig : null;
  } catch {
    return null;
  }
}

export function loadPrinterConfig(): PrinterConfig {
  const cashier = loadPrinterManagerConfig().cashier_printer;
  return {
    type: cashier.connectionType,
    bluetoothName: cashier.deviceName,
    bluetoothDeviceId: cashier.bluetoothDeviceId,
    networkIp: cashier.networkIp,
    networkPort: cashier.networkPort,
    codePage: ARABIC_PRINTER_CODE_PAGE,
    paperWidth: cashier.paperWidth,
    fontScale: cashier.fontScale,
    retryAttempts: cashier.retryAttempts,
  };
}

export function savePrinterConfig(cfg: PrinterConfig) {
  const managerConfig = loadPrinterManagerConfig();
  managerConfig.cashier_printer = {
    ...managerConfig.cashier_printer,
    connectionType: cfg.type,
    deviceName: cfg.bluetoothName,
    bluetoothDeviceId: cfg.bluetoothDeviceId,
    networkIp: cfg.networkIp,
    networkPort: cfg.networkPort,
    codePage: ARABIC_PRINTER_CODE_PAGE,
    paperWidth: cfg.paperWidth || 80,
    fontScale: cfg.fontScale || 1,
    retryAttempts: cfg.retryAttempts || 3,
  };
  savePrinterManagerConfig(managerConfig);
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

export function loadReceiptSettings(): { address: string; website: string; header: string } {
  try {
    const raw = localStorage.getItem(RECEIPT_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as { address: string; website: string; header: string };
  } catch {}
  return { address: "", website: "", header: "" };
}

export function saveReceiptSettings(settings: { address: string; website: string; header: string }) {
  try {
    localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function escBytes(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function reshapeArabicText(value: string): string {
  try {
    return ArabicShaper.convertArabic(value);
  } catch {
    return value;
  }
}

function reorderArabicText(value: string): string {
  try {
    const levels = bidi.getEmbeddingLevels(value, "rtl");
    const chars = Array.from(value);
    const mirror = bidi.getMirroredCharactersMap(value, levels);
    if (mirror instanceof Map) {
      mirror.forEach((replacement, idx) => {
        if (replacement) chars[idx] = replacement;
      });
    }
    const segments = bidi.getReorderSegments(value, levels);
    for (const [start, end] of segments) {
      const reversed = chars.slice(start, end + 1).reverse();
      chars.splice(start, end - start + 1, ...reversed);
    }
    return chars.join("");
  } catch {
    return value;
  }
}

function encodeText(value: string, codePage: PrinterCodePage): Uint8Array {
  const normalized = value.replace(/\r?\n/g, "\n").replace(/[^\S\n]+/g, " ");
  if (codePage === "utf8") return new TextEncoder().encode(normalized);
  const shaped = reshapeArabicText(normalized);
  const reordered = reorderArabicText(shaped);
  return iconv.encode(reordered, codePage);
}

function escText(value: string, codePage: PrinterCodePage): Uint8Array {
  return encodeText(value, codePage);
}

function codePageCommand(codePage: PrinterCodePage): Uint8Array {
  if (codePage === "utf8") return new Uint8Array();
  return escBytes(0x1b, 0x74, ESC_POS_CODE_PAGE_NUMBERS[codePage]);
}

function lineWidth(paperWidth: PaperWidth): number {
  return paperWidth === 80 ? 48 : 32;
}

function paperPixels(paperWidth: PaperWidth): number {
  return paperWidth === 80 ? 576 : 384;
}

function formatDateTime(value?: Date | string): string {
  const d = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function money(value: number): string {
  return value.toFixed(2);
}

function clampText(value: string, max: number): string {
  const chars = Array.from(value);
  return chars.length > max ? chars.slice(0, Math.max(0, max - 1)).join("") + "…" : value;
}

type RasterItem =
  | { type: "text"; text: string; align?: "left" | "center" | "right"; size?: "small" | "normal" | "large"; bold?: boolean }
  | { type: "row"; label: string; value: string; size?: "small" | "normal" | "large"; bold?: boolean }
  | { type: "separator"; char?: string }
  | { type: "space"; height?: number };

function canRenderRaster() {
  return typeof document !== "undefined" && typeof document.createElement === "function";
}

function clampFontScale(value?: number) {
  return Math.max(0.8, Math.min(1.35, value || 1));
}

function printScale(settings: Pick<PrinterDeviceConfig, "paperWidth" | "fontScale">, mode: "receipt" | "report" = "receipt") {
  const scale = clampFontScale(settings.fontScale);
  if (mode === "report") {
    return settings.paperWidth === 80 ? Math.min(scale, 1) : Math.min(scale, 0.88);
  }
  return scale;
}

function fontFor(item: { size?: "small" | "normal" | "large"; bold?: boolean }, scale = 1) {
  const base = item.size === "large" ? 27 : item.size === "small" ? 16 : 20;
  const px = Math.round(base * clampFontScale(scale));
  const weight = item.bold ? 700 : 500;
  return `${weight} ${px}px Arial, Tahoma, sans-serif`;
}

function lineHeightFor(size?: "small" | "normal" | "large", scale = 1) {
  const base = size === "large" ? 34 : size === "small" ? 21 : 26;
  return Math.round(base * clampFontScale(scale));
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words.length ? words : [""]) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (ctx.measureText(word).width <= maxWidth) {
      current = word;
      continue;
    }
    let chunk = "";
    for (const char of Array.from(word)) {
      const next = chunk + char;
      if (ctx.measureText(next).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = next;
      }
    }
    current = chunk;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function rasterizeItems(items: RasterItem[], paperWidth: PaperWidth, fontScale = 1): Uint8Array {
  if (!canRenderRaster()) return new Uint8Array();

  const width = paperPixels(paperWidth);
  const scale = clampFontScale(fontScale);
  const padding = paperWidth === 80 ? 18 : 10;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 5000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array();

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";
  ctx.direction = "rtl";

  let y = paperWidth === 80 ? 8 : 6;
  const contentWidth = width - padding * 2;

  for (const item of items) {
    if (item.type === "space") {
      y += item.height || 8;
      continue;
    }
    if (item.type === "separator") {
      ctx.direction = "ltr";
      ctx.textAlign = "center";
      ctx.font = `${Math.round(14 * scale)}px Arial, Tahoma, sans-serif`;
      ctx.fillText((item.char || "-").repeat(paperWidth === 80 ? 58 : 40), width / 2, y);
      y += Math.round((paperWidth === 80 ? 18 : 16) * scale);
      continue;
    }
    if (item.type === "row") {
      ctx.font = fontFor(item, fontScale);
      const lineHeight = lineHeightFor(item.size, fontScale);
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      const labelLines = wrapCanvasText(ctx, item.label, contentWidth * (paperWidth === 80 ? 0.6 : 0.56));
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      const valueLines = wrapCanvasText(ctx, item.value, contentWidth * (paperWidth === 80 ? 0.36 : 0.4));
      const rows = Math.max(labelLines.length, valueLines.length);
      for (let i = 0; i < rows; i += 1) {
        ctx.direction = "rtl";
        ctx.textAlign = "right";
        if (labelLines[i]) ctx.fillText(labelLines[i], width - padding, y);
        ctx.direction = "ltr";
        ctx.textAlign = "left";
        if (valueLines[i]) ctx.fillText(valueLines[i], padding, y);
        y += lineHeight;
      }
      continue;
    }

    ctx.font = fontFor(item, fontScale);
    ctx.direction = "rtl";
    ctx.textAlign = item.align === "left" ? "left" : item.align === "center" ? "center" : "right";
    const x = item.align === "left" ? padding : item.align === "center" ? width / 2 : width - padding;
    const lines = wrapCanvasText(ctx, item.text, contentWidth);
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += lineHeightFor(item.size, fontScale);
    }
  }

  y += 8;
  const height = Math.max(1, Math.min(y, canvas.height));
  const image = ctx.getImageData(0, 0, width, height);
  const bytesPerRow = Math.ceil(width / 8);
  const raster = new Uint8Array(bytesPerRow * height);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const idx = (row * width + col) * 4;
      const r = image.data[idx];
      const g = image.data[idx + 1];
      const b = image.data[idx + 2];
      const a = image.data[idx + 3];
      const dark = a > 80 && (r * 0.299 + g * 0.587 + b * 0.114) < 180;
      if (dark) raster[row * bytesPerRow + (col >> 3)] |= 0x80 >> (col & 7);
    }
  }

  return concatBytes([
    escBytes(0x1d, 0x76, 0x30, 0x00, bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff),
    raster,
    escBytes(0x0a),
  ]);
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo image failed to load"));
    image.src = src;
  });
}

async function rasterizeImageUrl(src: string, paperWidth: PaperWidth): Promise<Uint8Array> {
  if (!canRenderRaster()) return new Uint8Array();
  try {
    const image = await loadImageElement(src);
    const width = paperPixels(paperWidth);
    const maxLogoWidth = paperWidth === 80 ? 150 : 112;
    const maxLogoHeight = paperWidth === 80 ? 100 : 78;
    const scale = Math.min(maxLogoWidth / image.naturalWidth, maxLogoHeight / image.naturalHeight, 1);
    const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
    const height = drawHeight + 18;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new Uint8Array();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, Math.round((width - drawWidth) / 2), 8, drawWidth, drawHeight);

    const imageData = ctx.getImageData(0, 0, width, height);
    const bytesPerRow = Math.ceil(width / 8);
    const raster = new Uint8Array(bytesPerRow * height);
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const idx = (row * width + col) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];
        const dark = a > 80 && (r * 0.299 + g * 0.587 + b * 0.114) < 188;
        if (dark) raster[row * bytesPerRow + (col >> 3)] |= 0x80 >> (col & 7);
      }
    }

    return concatBytes([
      escBytes(0x1d, 0x76, 0x30, 0x00, bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff),
      raster,
      escBytes(0x0a),
    ]);
  } catch {
    return new Uint8Array();
  }
}

function qrEscPos(data: string): Uint8Array[] {
  const bytes = new TextEncoder().encode(data);
  const storeLength = bytes.length + 3;
  const pL = storeLength % 256;
  const pH = Math.floor(storeLength / 256);
  return [
    escBytes(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00),
    escBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x05),
    escBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30),
    concatBytes([escBytes(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30), bytes]),
    escBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30),
  ];
}

class EscPosBuilder {
  private parts: Uint8Array[] = [];
  private readonly codePage: PrinterCodePage;
  private readonly paperWidth: PaperWidth;
  private readonly fontScale: number;
  readonly width: number;

  constructor(settings: Pick<PrinterDeviceConfig, "codePage" | "paperWidth" | "density" | "fontScale">) {
    this.codePage = ARABIC_PRINTER_CODE_PAGE;
    this.paperWidth = settings.paperWidth || 80;
    this.fontScale = clampFontScale(settings.fontScale);
    this.width = lineWidth(this.paperWidth);
    this.raw(escBytes(0x1b, 0x40));
    this.raw(codePageCommand(this.codePage));
    this.raw(escBytes(0x1b, 0x32));
    this.raw(escBytes(0x1d, 0x45, Math.max(0, Math.min(8, settings.density ?? 8))));
  }

  raw(bytes: Uint8Array) {
    this.parts.push(bytes);
    return this;
  }

  text(value: string) {
    this.parts.push(escText(value, this.codePage));
    return this;
  }

  line(value = "") {
    if (value) this.text(value);
    this.raw(escBytes(0x0a));
    return this;
  }

  separator(char = "-") {
    return this.line(char.repeat(this.width));
  }

  align(value: "left" | "center" | "right") {
    this.raw(escBytes(0x1b, 0x61, value === "center" ? 1 : value === "right" ? 2 : 0));
    return this;
  }

  bold(enabled: boolean) {
    this.raw(escBytes(0x1b, 0x45, enabled ? 1 : 0));
    return this;
  }

  size(mode: "normal" | "large" | "xlarge") {
    this.raw(escBytes(0x1d, 0x21, mode === "xlarge" ? 0x11 : mode === "large" ? 0x01 : 0x00));
    return this;
  }

  row(label: string, value: string) {
    const left = Array.from(label);
    const right = Array.from(value);
    const spaces = Math.max(1, this.width - left.length - right.length);
    return this.line(`${label}${" ".repeat(spaces)}${value}`);
  }

  qr(data: string) {
    this.align("center");
    for (const part of qrEscPos(data)) this.raw(part);
    this.line();
    return this;
  }

  raster(items: RasterItem[], fontScale = this.fontScale) {
    this.raw(rasterizeItems(items, this.paperWidth, fontScale));
    return this;
  }

  cut() {
    this.line().line().raw(escBytes(0x1b, 0x64, 0x02)).raw(escBytes(0x1d, 0x56, 0x00));
    return this;
  }

  bytes(): Uint8Array {
    return concatBytes(this.parts);
  }
}

function buildHeader(builder: EscPosBuilder, title: string, subtitle?: string) {
  builder.align("center").bold(true).size("large").line(title).size("normal").bold(false);
  if (subtitle) builder.line(subtitle);
  builder.separator("=");
}

function buildCashierReceiptRaster(data: CashierReceiptData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  const settings = { ...DEFAULT_PRINTER_SETTINGS, ...config };
  const builder = new EscPosBuilder(settings);
  const qrData = data.qrData || data.orgWebsite || `ORDER:${data.orderNumber};TOTAL:${money(data.total)}`;
  const top: RasterItem[] = [];

  if (data.logoText) top.push({ type: "text", text: data.logoText, align: "center", size: "large", bold: true });
  if (data.receiptHeader) top.push({ type: "text", text: data.receiptHeader, align: "center", size: "normal" });
  top.push(
    { type: "text", text: data.orgName, align: "center", size: "large", bold: true },
    ...(data.orgAddress ? [{ type: "text" as const, text: data.orgAddress, align: "center" as const, size: "small" as const }] : []),
    { type: "separator", char: "=" },
    { type: "row", label: "رقم الطلب", value: `#${data.orderNumber}`, bold: true },
    { type: "row", label: "التاريخ", value: formatDateTime(data.createdAt), size: "small" }
  );
  if (data.tableInfo) top.push({ type: "row", label: "المكان", value: data.tableInfo });
  if (data.customerName) top.push({ type: "row", label: "العميل", value: data.customerName });
  if (data.customerPhone) top.push({ type: "row", label: "الهاتف", value: data.customerPhone });
  top.push({ type: "separator" }, { type: "row", label: "الصنف", value: "الإجمالي", bold: true });

  for (const item of data.items) {
    top.push(
      { type: "text", text: item.nameAr || item.name, align: "right", bold: true },
      { type: "row", label: `${item.qty} x ${money(item.price || 0)}`, value: money((item.price || 0) * item.qty), size: "small" }
    );
    if (item.notes) top.push({ type: "text", text: `ملاحظة: ${item.notes}`, align: "right", size: "small" });
  }

  top.push(
    { type: "separator" },
    { type: "row", label: "المجموع", value: money(data.subtotal) }
  );
  if (data.discount && data.discount > 0) top.push({ type: "row", label: "الخصم", value: `-${money(data.discount)}` });
  top.push(
    { type: "row", label: "الضريبة", value: money(data.tax) },
    { type: "row", label: "الإجمالي", value: money(data.total), size: "large", bold: true },
    { type: "row", label: "الدفع", value: data.paymentMethod },
    { type: "separator" }
  );

  builder.raster(top);
  if (qrData) builder.qr(qrData);
  builder.raster([
    ...(data.footer ? [{ type: "text" as const, text: data.footer, align: "center" as const }] : []),
    { type: "text", text: "شكراً لزيارتكم", align: "center", bold: true },
  ]);
  builder.cut();
  return builder.bytes();
}

async function buildCashierReceiptRasterWithAssets(data: CashierReceiptData, config?: Partial<PrinterDeviceConfig>): Promise<Uint8Array> {
  const settings = { ...DEFAULT_PRINTER_SETTINGS, ...config };
  const builder = new EscPosBuilder(settings);
  const qrData = data.qrData || data.orgWebsite || `ORDER:${data.orderNumber};TOTAL:${money(data.total)}`;
  const top: RasterItem[] = [];

  if (data.receiptHeader) top.push({ type: "text", text: data.receiptHeader, align: "center", size: "normal" });
  if (data.logoText && !data.logoUrl) top.push({ type: "text", text: data.logoText, align: "center", size: "large", bold: true });
  builder.raster(top);
  if (data.logoUrl) builder.raw(await rasterizeImageUrl(data.logoUrl, settings.paperWidth));

  builder.raster([
    { type: "text", text: data.orgName, align: "center", size: "large", bold: true },
    ...(data.orgAddress ? [{ type: "text" as const, text: data.orgAddress, align: "center" as const, size: "small" as const }] : []),
    { type: "separator", char: "=" },
    { type: "row", label: "رقم الطلب", value: `#${data.orderNumber}`, bold: true },
    { type: "row", label: "التاريخ", value: formatDateTime(data.createdAt), size: "small" },
    ...(data.tableInfo ? [{ type: "row" as const, label: "المكان", value: data.tableInfo }] : []),
    ...(data.customerName ? [{ type: "row" as const, label: "العميل", value: data.customerName }] : []),
    ...(data.customerPhone ? [{ type: "row" as const, label: "الهاتف", value: data.customerPhone }] : []),
    { type: "separator" },
    { type: "row", label: "الصنف", value: "الإجمالي", bold: true },
  ]);

  const lines: RasterItem[] = [];
  for (const item of data.items) {
    lines.push(
      { type: "text", text: item.nameAr || item.name, align: "right", bold: true },
      { type: "row", label: `${item.qty} x ${money(item.price || 0)}`, value: money((item.price || 0) * item.qty), size: "small" }
    );
    if (item.notes) lines.push({ type: "text", text: `ملاحظة: ${item.notes}`, align: "right", size: "small" });
  }
  lines.push(
    { type: "separator" },
    { type: "row", label: "المجموع", value: money(data.subtotal) }
  );
  if (data.discount && data.discount > 0) lines.push({ type: "row", label: "الخصم", value: `-${money(data.discount)}` });
  lines.push(
    { type: "row", label: "الضريبة", value: money(data.tax) },
    { type: "row", label: "الإجمالي", value: money(data.total), size: "large", bold: true },
    { type: "row", label: "الدفع", value: data.paymentMethod },
    { type: "separator" }
  );
  builder.raster(lines);
  if (qrData) builder.qr(qrData);
  builder.raster([
    ...(data.footer ? [{ type: "text" as const, text: data.footer, align: "center" as const }] : []),
    { type: "text", text: "شكراً لزيارتكم", align: "center", bold: true },
    { type: "space", height: 4 },
    { type: "text", text: "markode.co", align: "center", size: "small", bold: true },
  ]);
  builder.cut();
  return builder.bytes();
}

function buildKitchenTicketRaster(data: KitchenTicketData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  const builder = new EscPosBuilder({ ...DEFAULT_PRINTER_SETTINGS, ...config });
  const items: RasterItem[] = [
    { type: "text", text: "طلب المطبخ", align: "center", size: "large", bold: true },
    { type: "text", text: `#${data.orderNumber}`, align: "center", bold: true },
    { type: "separator", char: "=" },
    { type: "row", label: "التاريخ", value: formatDateTime(data.createdAt), size: "small" },
  ];
  if (data.tableInfo) items.push({ type: "row", label: "المكان", value: data.tableInfo, bold: true });
  if (data.orderType) items.push({ type: "row", label: "النوع", value: data.orderType });
  items.push({ type: "separator" });

  for (const item of data.items) {
    items.push({ type: "text", text: `${item.qty} x ${item.nameAr || item.name}`, align: "right", size: "large", bold: true });
    if (item.modifiers?.length) {
      item.modifiers.forEach((modifier) => items.push({ type: "text", text: `+ ${modifier.qty || 1} ${modifier.nameAr || modifier.name}`, align: "right" }));
    }
    if (item.notes) items.push({ type: "text", text: `ملاحظة: ${item.notes}`, align: "right", bold: true });
    items.push({ type: "separator" });
  }
  if (data.notes) items.push({ type: "text", text: `ملاحظات الطلب: ${data.notes}`, align: "right", bold: true });
  builder.raster(items).cut();
  return builder.bytes();
}

function buildHallTicketRaster(data: HallTicketData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  const builder = new EscPosBuilder({ ...DEFAULT_PRINTER_SETTINGS, ...config });
  const items: RasterItem[] = [
    { type: "text", text: "طلب الصالة", align: "center", size: "large", bold: true },
    { type: "text", text: data.tableInfo || `#${data.orderNumber}`, align: "center", size: "large", bold: true },
    { type: "separator", char: "=" },
    { type: "row", label: "رقم الطلب", value: `#${data.orderNumber}`, bold: true },
    { type: "row", label: "التاريخ", value: formatDateTime(data.createdAt), size: "small" },
    { type: "separator" },
  ];
  for (const item of data.items) {
    items.push({ type: "text", text: `${item.qty} x ${item.nameAr || item.name}`, align: "right", size: "large", bold: true });
    if (item.notes) items.push({ type: "text", text: `ملاحظة: ${item.notes}`, align: "right", bold: true });
  }
  if (data.notes) items.push({ type: "separator" }, { type: "text", text: `ملاحظات: ${data.notes}`, align: "right", bold: true });
  builder.raster(items).cut();
  return builder.bytes();
}

export function buildCashierReceipt(data: CashierReceiptData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  if (canRenderRaster()) return buildCashierReceiptRaster(data, config);
  const builder = new EscPosBuilder({ ...DEFAULT_PRINTER_SETTINGS, ...config });
  const qrData = data.qrData || data.orgWebsite || `ORDER:${data.orderNumber};TOTAL:${money(data.total)}`;

  builder.align("center");
  if (data.logoText) builder.bold(true).size("large").line(data.logoText).size("normal").bold(false);
  if (data.receiptHeader) builder.line(data.receiptHeader);
  buildHeader(builder, data.orgName, data.orgAddress);
  builder
    .align("right")
    .row("رقم الطلب", `#${data.orderNumber}`)
    .row("التاريخ", formatDateTime(data.createdAt));
  if (data.tableInfo) builder.row("المكان", data.tableInfo);
  if (data.customerName) builder.row("العميل", data.customerName);
  if (data.customerPhone) builder.row("الهاتف", data.customerPhone);
  builder.separator();

  builder.bold(true).row("الصنف", "الإجمالي").bold(false);
  for (const item of data.items) {
    const name = clampText(item.nameAr || item.name, builder.width - 10);
    builder.line(name);
    builder.row(`${item.qty} x ${money(item.price || 0)}`, money((item.price || 0) * item.qty));
    if (item.notes) builder.line(`ملاحظة: ${item.notes}`);
  }

  builder
    .separator()
    .row("المجموع", money(data.subtotal));
  if (data.discount && data.discount > 0) builder.row("الخصم", `-${money(data.discount)}`);
  builder
    .row("الضريبة", money(data.tax))
    .bold(true)
    .size("large")
    .row("الإجمالي", money(data.total))
    .size("normal")
    .bold(false)
    .row("الدفع", data.paymentMethod)
    .separator();

  if (qrData) builder.qr(qrData);
  if (data.footer) builder.align("center").line(data.footer);
  builder.align("center").line("شكراً لزيارتكم").line("markode.co").cut();
  return builder.bytes();
}

export function buildKitchenTicket(data: KitchenTicketData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  if (canRenderRaster()) return buildKitchenTicketRaster(data, config);
  const builder = new EscPosBuilder({ ...DEFAULT_PRINTER_SETTINGS, ...config });
  buildHeader(builder, "طلب المطبخ", `#${data.orderNumber}`);
  builder
    .align("right")
    .row("التاريخ", formatDateTime(data.createdAt));
  if (data.tableInfo) builder.row("المكان", data.tableInfo);
  if (data.orderType) builder.row("النوع", data.orderType);
  builder.separator();

  for (const item of data.items) {
    builder.bold(true).line(`${item.qty} x ${item.nameAr || item.name}`).bold(false);
    if (item.modifiers?.length) {
      item.modifiers.forEach((modifier) => builder.line(`+ ${modifier.qty || 1} ${modifier.nameAr || modifier.name}`));
    }
    if (item.notes) builder.line(`ملاحظة: ${item.notes}`);
    builder.separator();
  }
  if (data.notes) builder.line(`ملاحظات الطلب: ${data.notes}`);
  builder.cut();
  return builder.bytes();
}

export function buildHallTicket(data: HallTicketData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  if (canRenderRaster()) return buildHallTicketRaster(data, config);
  const builder = new EscPosBuilder({ ...DEFAULT_PRINTER_SETTINGS, ...config });
  buildHeader(builder, "طلب الصالة", data.tableInfo || `#${data.orderNumber}`);
  builder.align("right").row("رقم الطلب", `#${data.orderNumber}`).row("التاريخ", formatDateTime(data.createdAt)).separator();
  for (const item of data.items) {
    builder.line(`${item.qty} x ${item.nameAr || item.name}`);
    if (item.notes) builder.line(`ملاحظة: ${item.notes}`);
  }
  if (data.notes) builder.separator().line(`ملاحظات: ${data.notes}`);
  builder.cut();
  return builder.bytes();
}

export function buildClosingReport(data: ClosingReportPrintData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  const settings = { ...DEFAULT_PRINTER_SETTINGS, ...config };
  const compactScale = printScale(settings, "report");
  const titleSize = settings.paperWidth === 80 ? "large" : "normal";
  const netSales = data.totalSubtotal - data.totalDiscount;

  if (canRenderRaster()) {
    const builder = new EscPosBuilder(settings);
    const items: RasterItem[] = [
      { type: "text", text: data.orgName, align: "center", size: titleSize, bold: true },
      { type: "text", text: "نظام إدارة المطاعم والكافيهات", align: "center", size: "small" },
      { type: "separator", char: "=" },
      { type: "text", text: data.periodLabel, align: "center", size: titleSize, bold: true },
      { type: "text", text: data.range, align: "center", size: "small" },
      { type: "separator" },
      { type: "row", label: "عدد الطلبات", value: String(data.ordersCount), bold: true },
      { type: "row", label: "إجمالي الإيرادات", value: money(data.totalRevenue), bold: true },
      { type: "row", label: "إجمالي الخصومات", value: money(data.totalDiscount) },
      { type: "row", label: "الضريبة المحصلة", value: money(data.totalTax) },
      { type: "row", label: "متوسط قيمة الطلب", value: money(data.avgOrder) },
      { type: "separator", char: "=" },
      { type: "row", label: "صافي المبيعات", value: money(netSales), size: titleSize, bold: true },
      { type: "separator" },
      { type: "text", text: "طرق الدفع", align: "right", bold: true },
    ];

    if (data.byPayment.length === 0) {
      items.push({ type: "text", text: "لا توجد مدفوعات في هذه الفترة", align: "center", size: "small" });
    } else {
      data.byPayment.forEach((payment) => {
        const label = payment.percentage != null ? `${payment.label} (${payment.percentage}%)` : payment.label;
        items.push(
          { type: "row", label, value: money(payment.total) },
          { type: "row", label: "عدد الطلبات", value: String(payment.count), size: "small" }
        );
      });
    }

    items.push(
      { type: "separator" },
      { type: "text", text: `طُبع في: ${formatDateTime()}`, align: "center", size: "small" }
    );
    builder.raster(items, compactScale).cut();
    return builder.bytes();
  }

  const builder = new EscPosBuilder(settings);
  builder
    .align("center")
    .bold(true)
    .size(settings.paperWidth === 80 ? "large" : "normal")
    .line(data.orgName)
    .size("normal")
    .bold(false)
    .line("نظام إدارة المطاعم والكافيهات")
    .separator("=")
    .bold(true)
    .line(data.periodLabel)
    .bold(false)
    .line(data.range)
    .separator()
    .align("right")
    .row("عدد الطلبات", String(data.ordersCount))
    .row("إجمالي الإيرادات", money(data.totalRevenue))
    .row("إجمالي الخصومات", money(data.totalDiscount))
    .row("الضريبة المحصلة", money(data.totalTax))
    .row("متوسط قيمة الطلب", money(data.avgOrder))
    .separator("=")
    .bold(true)
    .size(settings.paperWidth === 80 ? "large" : "normal")
    .row("صافي المبيعات", money(netSales))
    .size("normal")
    .bold(false)
    .separator()
    .line("طرق الدفع");
  if (data.byPayment.length === 0) {
    builder.align("center").line("لا توجد مدفوعات في هذه الفترة");
  } else {
    data.byPayment.forEach((payment) => {
      builder
        .align("right")
        .row(payment.label, money(payment.total))
        .row("عدد الطلبات", String(payment.count));
    });
  }
  builder.separator().align("center").line(`طُبع في: ${formatDateTime()}`).cut();
  return builder.bytes();
}

export function buildSalesReport(data: SalesReportPrintData, config?: Partial<PrinterDeviceConfig>): Uint8Array {
  const settings = { ...DEFAULT_PRINTER_SETTINGS, ...config };
  const compactScale = printScale(settings, "report");
  const titleSize = settings.paperWidth === 80 ? "large" : "normal";
  const maxTopItems = settings.paperWidth === 80 ? 10 : 6;

  if (canRenderRaster()) {
    const builder = new EscPosBuilder(settings);
    const items: RasterItem[] = [
      { type: "text", text: data.orgName, align: "center", size: titleSize, bold: true },
      { type: "text", text: "تقرير المبيعات", align: "center", size: titleSize, bold: true },
      { type: "text", text: data.printedAt, align: "center", size: "small" },
      { type: "separator", char: "=" },
      { type: "row", label: "مبيعات اليوم", value: money(data.todayRevenue), bold: true },
      { type: "row", label: "طلبات اليوم", value: String(data.todayOrders) },
      { type: "row", label: "مبيعات الشهر", value: money(data.monthRevenue), bold: true },
      { type: "row", label: "طلبات الشهر", value: String(data.monthOrders) },
      { type: "row", label: "متوسط قيمة الطلب", value: money(data.avgOrderValue) },
      { type: "row", label: "إجمالي الإيرادات", value: money(data.allTimeRevenue), bold: true },
      { type: "row", label: "إجمالي الطلبات", value: String(data.allTimeOrdersCount) },
      { type: "separator" },
      { type: "text", text: "أكثر الأصناف مبيعاً", align: "right", bold: true },
    ];

    if (data.topItems.length === 0) {
      items.push({ type: "text", text: "لا توجد مبيعات بعد", align: "center", size: "small" });
    } else {
      data.topItems.slice(0, maxTopItems).forEach((item, index) => {
        items.push(
          { type: "text", text: `${index + 1}. ${item.nameAr || item.name}`, align: "right", bold: true },
          { type: "row", label: `${item.quantity} قطعة`, value: money(item.total), size: "small" }
        );
      });
    }

    items.push({ type: "separator" }, { type: "text", text: "أنواع الطلبات", align: "right", bold: true });
    if (data.ordersByType.length === 0) {
      items.push({ type: "text", text: "لا توجد طلبات", align: "center", size: "small" });
    } else {
      data.ordersByType.forEach((orderType) => {
        items.push(
          { type: "row", label: orderType.label, value: money(orderType.total) },
          { type: "row", label: "عدد الطلبات", value: String(orderType.count), size: "small" }
        );
      });
    }

    builder.raster(items, compactScale).cut();
    return builder.bytes();
  }

  const builder = new EscPosBuilder(settings);
  builder
    .align("center")
    .bold(true)
    .size(settings.paperWidth === 80 ? "large" : "normal")
    .line(data.orgName)
    .line("تقرير المبيعات")
    .size("normal")
    .bold(false)
    .line(data.printedAt)
    .separator()
    .align("right")
    .row("مبيعات اليوم", money(data.todayRevenue))
    .row("طلبات اليوم", String(data.todayOrders))
    .row("مبيعات الشهر", money(data.monthRevenue))
    .row("طلبات الشهر", String(data.monthOrders))
    .row("متوسط قيمة الطلب", money(data.avgOrderValue))
    .row("إجمالي الإيرادات", money(data.allTimeRevenue))
    .row("إجمالي الطلبات", String(data.allTimeOrdersCount))
    .separator()
    .line("أكثر الأصناف مبيعاً");
  data.topItems.slice(0, maxTopItems).forEach((item, index) => {
    builder.line(`${index + 1}. ${clampText(item.nameAr || item.name, builder.width - 4)}`);
    builder.row(`${item.quantity} قطعة`, money(item.total));
  });
  if (data.topItems.length === 0) builder.align("center").line("لا توجد مبيعات بعد").align("right");
  builder.separator().line("أنواع الطلبات");
  data.ordersByType.forEach((orderType) => {
    builder.row(orderType.label, money(orderType.total)).row("عدد الطلبات", String(orderType.count));
  });
  if (data.ordersByType.length === 0) builder.align("center").line("لا توجد طلبات");
  builder.cut();
  return builder.bytes();
}

export function buildReceiptHtml(data: CashierReceiptData): string {
  const rows = data.items.map((item) => `
    <tr>
      <td>${item.nameAr || item.name}</td>
      <td>${item.qty}</td>
      <td>${money((item.price || 0) * item.qty)}</td>
    </tr>
  `).join("");
  const qr = data.qrData || data.orgWebsite || "";
  const qrUrl = qr ? `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(qr)}&margin=2` : "";
  return `
    <div style="direction:rtl;width:76mm;margin:0 auto;font-family:Arial,'Tahoma',sans-serif;font-size:12px;color:#111">
      ${data.receiptHeader ? `<p style="text-align:center;margin:2px 0">${data.receiptHeader}</p>` : ""}
      ${data.logoUrl ? `<div style="text-align:center;margin:4px 0"><img src="${data.logoUrl}" style="max-width:26mm;max-height:18mm;object-fit:contain" /></div>` : ""}
      <h2 style="text-align:center;margin:4px 0;font-size:18px">${data.orgName}</h2>
      ${data.orgAddress ? `<p style="text-align:center;margin:2px 0">${data.orgAddress}</p>` : ""}
      <hr style="border:0;border-top:1px dashed #111;margin:6px 0" />
      <p>رقم الطلب: #${data.orderNumber}</p>
      <p>التاريخ: ${formatDateTime(data.createdAt)}</p>
      ${data.tableInfo ? `<p>${data.tableInfo}</p>` : ""}
      ${data.customerName ? `<p>العميل: ${data.customerName}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;text-align:right">
        <thead><tr><th>الصنف</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <hr style="border:0;border-top:1px dashed #111;margin:6px 0" />
      <p>المجموع: ${money(data.subtotal)}</p>
      ${data.discount ? `<p>الخصم: -${money(data.discount)}</p>` : ""}
      <p>الضريبة: ${money(data.tax)}</p>
      <p style="font-weight:700;font-size:15px">الإجمالي: ${money(data.total)}</p>
      <p>طريقة الدفع: ${data.paymentMethod}</p>
      ${qrUrl ? `<div style="text-align:center;margin-top:8px"><img src="${qrUrl}" width="96" height="96" /></div>` : ""}
      ${data.footer ? `<p style="text-align:center;margin-top:8px">${data.footer}</p>` : ""}
      <p style="text-align:center;margin-top:4px;font-size:10px;font-weight:700;letter-spacing:.4px">markode.co</p>
    </div>
  `;
}

class PrintQueue {
  private chain = Promise.resolve();
  private pending = 0;

  get length() {
    return this.pending;
  }

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    this.pending += 1;
    const run = this.chain.then(task, task).finally(() => {
      this.pending = Math.max(0, this.pending - 1);
    });
    this.chain = run.then(() => undefined, () => undefined);
    return run;
  }
}

export class PrinterManager {
  private config: PrinterManagerConfig;
  private queues: Record<PrinterId, PrintQueue>;
  private bluetoothSessions = new Map<PrinterId, BluetoothSession>();
  private usbSessions = new Map<PrinterId, UsbSession>();
  private logs: string[] = [];

  constructor(config?: PrinterManagerConfig) {
    this.config = config || loadPrinterManagerConfig();
    this.queues = {
      cashier_printer: new PrintQueue(),
      kitchen_printer: new PrintQueue(),
      hall_printer: new PrintQueue(),
    };
  }

  getConfig() {
    return this.config;
  }

  updateConfig(config: PrinterManagerConfig) {
    this.config = config;
    savePrinterManagerConfig(config);
  }

  getLogs() {
    return [...this.logs].slice(-80);
  }

  private log(message: string) {
    const line = `${new Date().toLocaleTimeString("ar-EG-u-nu-latn")} - ${message}`;
    this.logs.push(line);
    if (this.logs.length > 120) this.logs.shift();
    console.info(`[PrinterManager] ${message}`);
  }

  status(printerId: PrinterId): PrinterRuntimeStatus {
    const cfg = this.config[printerId];
    const bt = this.bluetoothSessions.get(printerId);
    const usb = this.usbSessions.get(printerId);
    return {
      id: printerId,
      deviceName: cfg.deviceName,
      deviceAddress: cfg.deviceAddress || cfg.bluetoothDeviceId || cfg.usbSerialNumber,
      connectionType: cfg.connectionType,
      isConnected: cfg.connectionType === "bluetooth" ? !!bt?.server.connected : cfg.connectionType === "usb" ? !!usb?.device.opened : cfg.connectionType === "browser",
      lastConnected: cfg.lastConnected,
      queueLength: this.queues[printerId].length,
      signalStrength: cfg.connectionType === "bluetooth" ? "غير متاح عبر Web Bluetooth" : undefined,
    };
  }

  async testConnection(printerId: PrinterId): Promise<PrinterRuntimeStatus> {
    const cfg = this.config[printerId];
    if (!cfg.enabled && printerId !== "cashier_printer") throw new Error(`${cfg.label} غير مفعلة`);
    this.log(`${cfg.label}: اختبار اتصال ${cfg.connectionType}`);
    if (cfg.connectionType === "bluetooth") {
      const session = await this.getBluetoothSession(printerId, true);
      await writeBluetooth(session.characteristic, escBytes(0x1b, 0x40));
      this.log(`${cfg.label}: Bluetooth write path OK`);
    }
    if (cfg.connectionType === "usb") {
      const session = await this.getUsbSession(printerId, true);
      await writeUsb(session, escBytes(0x1b, 0x40));
      this.log(`${cfg.label}: USB OUT endpoint ${session.endpointNumber} OK`);
    }
    if (cfg.connectionType === "network") {
      await testNetworkConnection(cfg.networkIp || "", cfg.networkPort || 9100);
      this.log(`${cfg.label}: Network /print path OK`);
    }
    return this.status(printerId);
  }

  async print(job: PrintQueueJob) {
    return this.queues[job.printerId].enqueue(async () => {
      const cfg = this.config[job.printerId];
      if (!cfg.enabled && job.printerId !== "cashier_printer") {
        this.log(`تم تجاهل ${cfg.label}: غير مفعلة`);
        return;
      }
      const attempts = Math.max(1, cfg.retryAttempts || 3);
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          this.log(`${cfg.label}: بدء ${job.description} (محاولة ${attempt})`);
          await this.write(cfg.id, job.data);
          this.log(`${cfg.label}: تمت الطباعة`);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.log(`${cfg.label}: فشل ${lastError.message}`);
          this.bluetoothSessions.delete(job.printerId);
          this.usbSessions.delete(job.printerId);
          if (attempt < attempts) await delay(250 * attempt);
        }
      }
      throw lastError || new Error("فشلت الطباعة");
    });
  }

  private async write(printerId: PrinterId, data: Uint8Array) {
    const cfg = this.config[printerId];
    if (cfg.connectionType === "browser") {
      throw new Error("الطباعة المباشرة تحتاج Bluetooth أو USB أو شبكة. اختر طابعة من إعدادات الطباعة.");
    }
    if (cfg.connectionType === "bluetooth") {
      const session = await this.getBluetoothSession(printerId);
      await writeBluetooth(session.characteristic, data);
      return;
    }
    if (cfg.connectionType === "usb") {
      const session = await this.getUsbSession(printerId);
      await writeUsb(session, data);
      return;
    }
    if (cfg.connectionType === "network") {
      await printNetwork(cfg.networkIp || "", cfg.networkPort || 9100, data);
      return;
    }
  }

  private async getBluetoothSession(printerId: PrinterId, forceRequest = false): Promise<BluetoothSession> {
    const cfg = this.config[printerId];
    if (!("bluetooth" in navigator)) throw new Error("Web Bluetooth غير مدعوم. استخدم Chrome أو Edge.");
    const bt = navigator.bluetooth;
    const existing = this.bluetoothSessions.get(printerId);
    if (!forceRequest && existing?.server.connected) return existing;

    let device: BluetoothDevice | undefined;
    if (!forceRequest && cfg.bluetoothDeviceId && typeof bt.getDevices === "function") {
      const devices = await bt.getDevices().catch(() => []);
      device = devices.find((item) => item.id === cfg.bluetoothDeviceId);
    }
    if (!device) {
      device = await bt.requestDevice({
        acceptAllDevices: !cfg.deviceName,
        filters: cfg.deviceName ? [{ name: cfg.deviceName }] : undefined,
        optionalServices: BLUETOOTH_SERVICES,
      });
    }
    if (!device.gatt) throw new Error("الجهاز المحدد لا يدعم GATT.");

    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    const characteristic = await findBluetoothWriteCharacteristic(server);
    if (!characteristic) throw new Error("لم يتم العثور على قناة كتابة للطابعة.");

    this.config[printerId] = {
      ...cfg,
      deviceName: device.name || cfg.deviceName,
      bluetoothDeviceId: device.id,
      deviceAddress: device.id,
      lastConnected: new Date().toISOString(),
    };
    savePrinterManagerConfig(this.config);

    const session = { device, server, characteristic };
    this.bluetoothSessions.set(printerId, session);
    return session;
  }

  private async getUsbSession(printerId: PrinterId, forceRequest = false): Promise<UsbSession> {
    const cfg = this.config[printerId];
    if (!("usb" in navigator)) throw new Error("WebUSB غير مدعوم. استخدم Chrome أو Edge.");
    const usb = (navigator as Navigator & { usb: UsbNavigator }).usb;
    const existing = this.usbSessions.get(printerId);
    if (!forceRequest && existing?.device.opened) return existing;

    let device: UsbDevice | undefined;
    if (!forceRequest) {
      const devices = await usb.getDevices().catch(() => []);
      device = devices.find((item) =>
        item.vendorId === cfg.usbVendorId &&
        item.productId === cfg.usbProductId &&
        (!cfg.usbSerialNumber || item.serialNumber === cfg.usbSerialNumber)
      );
    }
    if (!device) device = await usb.requestDevice({ filters: USB_THERMAL_PRINTER_FILTERS });

    if (!device.opened) await device.open();
    if (!device.configuration) await device.selectConfiguration(1);
    const located = findUsbOutEndpoint(device);
    if (!located) throw new Error("لم يتم العثور على منفذ USB للطباعة.");
    await device.claimInterface(located.interfaceNumber);

    this.config[printerId] = {
      ...cfg,
      deviceName: device.productName || cfg.deviceName || "USB Printer",
      deviceAddress: `${device.vendorId}:${device.productId}`,
      usbVendorId: device.vendorId,
      usbProductId: device.productId,
      usbSerialNumber: device.serialNumber,
      lastConnected: new Date().toISOString(),
    };
    savePrinterManagerConfig(this.config);

    const session = { device, endpointNumber: located.endpointNumber, interfaceNumber: located.interfaceNumber };
    this.usbSessions.set(printerId, session);
    return session;
  }

  async printCashierReceipt(data: CashierReceiptData) {
    const cfg = this.config.cashier_printer;
    if (cfg.connectionType === "browser") {
      throw new Error("الطباعة الحرارية المباشرة تحتاج Bluetooth أو USB أو شبكة. اختر طابعة من إعدادات الطباعة.");
    }
    return this.print({
      printerId: "cashier_printer",
      description: `فاتورة الكاشير #${data.orderNumber}`,
      data: canRenderRaster() ? await buildCashierReceiptRasterWithAssets(data, cfg) : buildCashierReceipt(data, cfg),
    });
  }

  async printKitchenTicket(data: KitchenTicketData) {
    return this.print({
      printerId: "kitchen_printer",
      description: `طلب مطبخ #${data.orderNumber}`,
      data: buildKitchenTicket(data, this.config.kitchen_printer),
    });
  }

  async printHallTicket(data: HallTicketData) {
    return this.print({
      printerId: "hall_printer",
      description: `طلب صالة #${data.orderNumber}`,
      data: buildHallTicket(data, this.config.hall_printer),
    });
  }
}

async function findBluetoothWriteCharacteristic(server: BluetoothRemoteGATTServer) {
  for (const serviceUuid of BLUETOOTH_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      for (const characteristicUuid of BLUETOOTH_WRITE_CHARACTERISTICS) {
        try {
          const characteristic = await service.getCharacteristic(characteristicUuid);
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) return characteristic;
        } catch {}
      }
      const characteristics = await service.getCharacteristics();
      const writable = characteristics.find((item) => item.properties.write || item.properties.writeWithoutResponse);
      if (writable) return writable;
    } catch {}
  }
  return null;
}

async function writeBluetooth(characteristic: BluetoothRemoteGATTCharacteristic, data: Uint8Array) {
  const chunkSize = 180;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (characteristic.properties.writeWithoutResponse) await characteristic.writeValueWithoutResponse(chunk);
    else await characteristic.writeValue(chunk);
    await delay(12);
  }
}

function findUsbOutEndpoint(device: UsbDevice): { interfaceNumber: number; endpointNumber: number } | null {
  for (const iface of device.configuration?.interfaces || []) {
    for (const alternate of iface.alternates) {
      const endpoint = alternate.endpoints.find((item) => item.direction === "out");
      if (endpoint) return { interfaceNumber: iface.interfaceNumber, endpointNumber: endpoint.endpointNumber };
    }
  }
  return null;
}

async function writeUsb(session: UsbSession, data: Uint8Array) {
  const chunkSize = 64;
  for (let i = 0; i < data.length; i += chunkSize) {
    await session.device.transferOut(session.endpointNumber, data.slice(i, i + chunkSize));
    await delay(4);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let singleton: PrinterManager | null = null;

export function getPrinterManager() {
  if (!singleton) singleton = new PrinterManager();
  return singleton;
}

export function resetPrinterManager(config?: PrinterManagerConfig) {
  singleton = new PrinterManager(config);
  return singleton;
}

export async function printBluetooth(
  data: Uint8Array,
  options?: { deviceId?: string; deviceName?: string; maxRetries?: number }
): Promise<{ name: string; id: string }> {
  const managerConfig = loadPrinterManagerConfig();
  managerConfig.cashier_printer = {
    ...managerConfig.cashier_printer,
    connectionType: "bluetooth",
    bluetoothDeviceId: options?.deviceId,
    deviceName: options?.deviceName,
    retryAttempts: options?.maxRetries || managerConfig.cashier_printer.retryAttempts,
  };
  const manager = resetPrinterManager(managerConfig);
  await manager.print({ printerId: "cashier_printer", data, description: "طباعة Bluetooth" });
  const cfg = manager.getConfig().cashier_printer;
  return { name: cfg.deviceName || "Bluetooth Printer", id: cfg.bluetoothDeviceId || "" };
}

export async function printUSB(data: Uint8Array): Promise<{ name: string }> {
  const managerConfig = loadPrinterManagerConfig();
  managerConfig.cashier_printer = { ...managerConfig.cashier_printer, connectionType: "usb" };
  const manager = resetPrinterManager(managerConfig);
  await manager.print({ printerId: "cashier_printer", data, description: "طباعة USB" });
  return { name: manager.getConfig().cashier_printer.deviceName || "USB Printer" };
}

export async function printNetwork(ip: string, port: number, data: Uint8Array, timeout = 5000) {
  if (!ip.trim()) throw new Error("أدخل IP الطابعة أو عنوان خدمة الطباعة الشبكية أولاً");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`http://${ip}:${port}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: data as BodyInit,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل الاتصال";
    throw new Error(`خطأ في الطباعة عبر الشبكة: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testNetworkConnection(ip: string, port: number) {
  await printNetwork(ip, port, escBytes(0x1b, 0x40), 3000);
}

export async function validatePrinterConnection(config: PrinterConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (config.type === "browser") return { success: true, message: "طباعة المتصفح جاهزة" };
    if (config.type === "bluetooth") {
      if (!("bluetooth" in navigator)) return { success: false, message: "Web Bluetooth غير مدعوم" };
      return { success: true, message: "Bluetooth جاهز. سيتم استخدام الجهاز المحفوظ أو طلب اختيار طابعة." };
    }
    if (config.type === "usb") {
      if (!("usb" in navigator)) return { success: false, message: "WebUSB غير مدعوم" };
      return { success: true, message: "USB جاهز. سيتم استخدام الجهاز المحفوظ أو طلب اختيار طابعة." };
    }
    return { success: true, message: "إعدادات الشبكة جاهزة" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

export function buildEscPos(
  data: CashierReceiptData,
  options?: { codePage?: PrinterCodePage; paperWidth?: PaperWidth; fontScale?: number }
): Uint8Array {
  return buildCashierReceipt(data, { ...DEFAULT_MANAGER_CONFIG.cashier_printer, ...options });
}

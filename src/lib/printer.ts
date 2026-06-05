import * as iconv from "iconv-lite";
import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

export type PrinterType = "browser" | "bluetooth" | "network" | "usb";
export type PrinterCodePage = "cp864" | "windows-1256" | "utf8";
export type PrinterProtocol = "escpos" | "tspl";
export type PaperWidth = 58 | 80;

export interface PrinterConfig {
  type: PrinterType;
  networkIp?: string;
  networkPort?: number;
  bluetoothName?: string;
  bluetoothDeviceId?: string;
  protocol?: PrinterProtocol;
  codePage?: PrinterCodePage;
  paperWidth?: PaperWidth;
  enableRetry?: boolean;
  retryAttempts?: number;
}

export function loadPrinterConfig(): PrinterConfig {
  try {
    const s = localStorage.getItem("printer-config");
    if (s) return JSON.parse(s);
  } catch {}
  return { type: "browser" };
}

export function savePrinterConfig(cfg: PrinterConfig) {
  try {
    localStorage.setItem("printer-config", JSON.stringify(cfg));
  } catch {}
}

export function loadReceiptSettings(): { address: string; website: string; header: string } {
  try {
    const s = localStorage.getItem("receipt-settings");
    if (s) return JSON.parse(s);
  } catch {}
  return { address: "", website: "", header: "" };
}

export function saveReceiptSettings(s: { address: string; website: string; header: string }) {
  try { localStorage.setItem("receipt-settings", JSON.stringify(s)); } catch {}
}

const DEFAULT_PRINTER_CODE_PAGE: PrinterCodePage = "cp864";
const ESC_POS_CODE_PAGE_NUMBERS: Record<PrinterCodePage, number> = {
  cp864: 0x16,
  "windows-1256": 0x11,
  "utf8": 0xff, // UTF-8 support (if printer supports)
};

function reshapeArabicText(value: string): string {
  try {
    return ArabicShaper.convertArabic(value);
  } catch {
    return value;
  }
}

function reorderArabicText(value: string): string {
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
}

function encodeEscPosText(value: string, codePage: PrinterCodePage): Uint8Array {
  const normalized = value.replace(/\r?\n/g, "\n");
  const shaped = reshapeArabicText(normalized);
  const reordered = reorderArabicText(shaped);
  
  // Use appropriate encoding
  if (codePage === "utf8") {
    // For UTF-8, use TextEncoder directly
    return new TextEncoder().encode(reordered);
  }
  
  return iconv.encode(reordered, codePage);
}

function selectEscPosCodePage(codePage: PrinterCodePage): Uint8Array {
  // Only send code page command for supported code pages
  // UTF-8 doesn't need explicit selection on most printers
  if (codePage === "utf8") {
    return new Uint8Array(0); // Empty array
  }
  return escBytes(0x1b, 0x74, ESC_POS_CODE_PAGE_NUMBERS[codePage]);
}

type BluetoothDeviceRecord = { id: string; name?: string; gatt?: any };
type BluetoothNavigatorLike = { getDevices?: () => Promise<BluetoothDeviceRecord[]>; requestDevice(options: any): Promise<BluetoothDeviceRecord> };

async function getPersistedBluetoothDevice(bt: BluetoothNavigatorLike, deviceId?: string): Promise<BluetoothDeviceRecord | null> {
  if (!deviceId || typeof bt.getDevices !== "function") return null;
  try {
    const devices = await bt.getDevices();
    return devices.find((device) => device.id === deviceId) || null;
  } catch {
    return null;
  }
}

async function requestBluetoothDevice(bt: BluetoothNavigatorLike, deviceName?: string): Promise<BluetoothDeviceRecord> {
  const optionalServices = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  ];
  const requestOptions: any = { optionalServices };
  if (deviceName) {
    requestOptions.filters = [{ name: deviceName }];
  } else {
    requestOptions.acceptAllDevices = true;
  }
  return bt.requestDevice(requestOptions);
}

export function buildReceiptHtml(data: {
  orgName: string;
  orgAddress?: string;
  orgWebsite?: string;
  receiptHeader?: string;
  orderNumber: string | number;
  items: Array<{ name: string; nameAr: string | null; qty: number; price: number }>;
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  paymentMethod: string;
  footer?: string;
  tableInfo?: string;
}): string {
  const fmt = (n: number) => n.toFixed(2);
  const rows = data.items
    .map(
      (i) =>
        `<tr>
          <td style="text-align:right;padding:3px 4px;">${i.nameAr || i.name}</td>
          <td style="text-align:center;padding:3px 4px;">${i.qty}</td>
          <td style="text-align:left;padding:3px 4px;">${fmt(i.price * i.qty)}</td>
        </tr>`
    )
    .join("");

  const qrUrl = data.orgWebsite
    ? `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(data.orgWebsite)}&margin=2`
    : "";

  const websiteDomain = data.orgWebsite
    ? data.orgWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";

  return `
    <div style="font-family:'Courier New',monospace;width:76mm;margin:0 auto;direction:rtl;font-size:12px;padding:4px;">
      ${data.receiptHeader ? `<p style="text-align:center;margin:2px 0;font-size:11px;color:#555;">${data.receiptHeader}</p>` : ""}
      <h2 style="text-align:center;margin:4px 0;font-size:18px;font-weight:900;">${data.orgName}</h2>
      <p style="text-align:center;margin:0;font-size:12px;color:#333;">بسيطة</p>
      <p style="text-align:center;margin:0;font-size:11px;color:#555;">إدارة المطاعم و الكافيهات</p>
      ${data.orgAddress ? `<p style="text-align:center;margin:2px 0;font-size:10px;color:#555;">${data.orgAddress}</p>` : ""}
      <p style="text-align:center;margin:2px 0;font-size:11px;">طلب رقم: #${data.orderNumber}</p>
      ${data.tableInfo ? `<p style="text-align:center;margin:2px 0;font-size:11px;">${data.tableInfo}</p>` : ""}
      <hr style="border:1px dashed #000;margin:6px 0;"/>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="border-bottom:1px solid #000;">
          <th style="text-align:right;padding:2px 4px;">الصنف</th>
          <th style="text-align:center;padding:2px 4px;">الكمية</th>
          <th style="text-align:left;padding:2px 4px;">المبلغ</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <hr style="border:1px dashed #000;margin:6px 0;"/>
      <p style="margin:2px 0;">المجموع الفرعي: ${fmt(data.subtotal)}</p>
      ${data.discount ? `<p style="margin:2px 0;">الخصم: -${fmt(data.discount)}</p>` : ""}
      <p style="margin:2px 0;">الضريبة: ${fmt(data.tax)}</p>
      <p style="font-weight:bold;font-size:14px;margin:4px 0;">الإجمالي: ${fmt(data.total)}</p>
      <p style="margin:2px 0;">طريقة الدفع: ${data.paymentMethod}</p>
      <hr style="border:1px dashed #000;margin:6px 0;"/>
      ${data.footer ? `<p style="text-align:center;margin:4px 0;">${data.footer}</p>` : ""}
      <p style="text-align:center;margin:4px 0;">شكراً لزيارتكم 🙏</p>
      ${qrUrl ? `
      <hr style="border:1px dashed #000;margin:6px 0;"/>
      <div style="text-align:center;margin:6px 0;">
        <img src="${qrUrl}" width="90" height="90" style="display:block;margin:0 auto;" />
        <p style="font-size:10px;margin:3px 0;color:#555;">${websiteDomain}</p>
      </div>` : ""}
    </div>`;
}

export async function printBrowser(html: string) {
  const win = window.open("", "_blank", "width=420,height=700,scrollbars=yes");
  if (!win) throw new Error("فشل فتح نافذة الطباعة. تأكد من السماح للنوافذ المنبثقة.");
  win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
    <style>*{box-sizing:border-box}body{margin:0;padding:8px}@media print{body{margin:0;padding:0}}</style>
    </head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); win.close(); } catch {} }, 600);
}

function escBytes(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

export function buildEscPos(data: {
  orgName: string;
  orderNumber: string | number;
  items: Array<{ name: string; nameAr: string | null; qty: number; price: number }>;
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  paymentMethod: string;
  receiptHeader?: string;
  footer?: string;
}, options?: { codePage?: PrinterCodePage; paperWidth?: PaperWidth }): Uint8Array {
  const codePage = options?.codePage || DEFAULT_PRINTER_CODE_PAGE;
  const paperWidth = options?.paperWidth || 58;
  const parts: Uint8Array[] = [];
  const push = (b: Uint8Array) => parts.push(b);
  const txt = (s: string) => push(encodeEscPosText(s, codePage));
  const lf = () => push(new Uint8Array([0x0a]));
  const fmt = (n: number) => n.toFixed(2);
  
  // Determine line width based on paper width
  const lineWidth = paperWidth === 80 ? 48 : 32;
  const SEP = "=".repeat(lineWidth);
  
  // Initialize printer (reset all settings)
  push(escBytes(0x1b, 0x40)); // ESC @ - Full initialization
  
  // Set character code table to the appropriate code page
  push(selectEscPosCodePage(codePage));
  
  // Set line spacing to 0 (default)
  push(escBytes(0x1b, 0x32));
  
  // Center align
  push(escBytes(0x1b, 0x61, 0x01));
  
  // Header
  if (data.receiptHeader) { 
    txt(data.receiptHeader); 
    lf(); 
    lf();
  }
  
  // Organization name (bold, large)
  push(escBytes(0x1b, 0x45, 0x01)); // Bold on
  push(escBytes(0x1d, 0x21, 0x11)); // Double width and height
  txt(data.orgName); 
  lf();
  push(escBytes(0x1d, 0x21, 0x00)); // Normal size
  push(escBytes(0x1b, 0x45, 0x00)); // Bold off
  
  // Subtitle
  txt("بسيطة");
  lf();
  txt("إدارة المطاعم و الكافيهات");
  lf();
  lf();
  
  // Order number
  push(escBytes(0x1b, 0x45, 0x01)); // Bold
  txt(`رقم الطلب: #${data.orderNumber}`);
  push(escBytes(0x1b, 0x45, 0x00)); // Bold off
  lf();
  
  // Separator
  txt(SEP);
  lf();
  lf();
  
  // Left align for items
  push(escBytes(0x1b, 0x61, 0x00));
  
  // Items header
  push(escBytes(0x1b, 0x45, 0x01)); // Bold
  const headerRight = "السعر".padEnd(8);
  const headerMid = "الكمية".padEnd(8);
  const headerLeft = "الصنف";
  const headerLine = `${headerLeft.substring(0, lineWidth - 16)}${headerMid}${headerRight}`;
  txt(headerLine);
  lf();
  push(escBytes(0x1b, 0x45, 0x00)); // Bold off
  txt(SEP);
  lf();
  
  // Items list
  for (const item of data.items) {
    const name = (item.nameAr || item.name).substring(0, lineWidth - 16);
    const qty = `${item.qty}`.padStart(3);
    const price = fmt(item.price * item.qty).padStart(6);
    
    // Item name line
    txt(name);
    lf();
    
    // Qty and price line (right aligned)
    const qtyPriceStr = `${qty}x${price}`;
    const padding = lineWidth - qtyPriceStr.length;
    txt(" ".repeat(Math.max(0, padding)) + qtyPriceStr);
    lf();
  }
  
  // Totals section
  lf();
  txt(SEP);
  lf();
  
  // Right align for totals
  push(escBytes(0x1b, 0x61, 0x02)); // Right align
  
  txt(`المجموع الفرعي: ${fmt(data.subtotal)}`);
  lf();
  
  if (data.discount && data.discount > 0) {
    txt(`الخصم: -${fmt(data.discount)}`);
    lf();
  }
  
  txt(`الضريبة: ${fmt(data.tax)}`);
  lf();
  lf();
  
  // Grand total (bold, larger)
  push(escBytes(0x1b, 0x45, 0x01)); // Bold
  push(escBytes(0x1d, 0x21, 0x11)); // Double size
  txt(`الإجمالي: ${fmt(data.total)}`);
  lf();
  push(escBytes(0x1d, 0x21, 0x00)); // Normal size
  push(escBytes(0x1b, 0x45, 0x00)); // Bold off
  
  txt(`الدفع: ${data.paymentMethod}`);
  lf();
  lf();
  
  // Footer
  push(escBytes(0x1b, 0x61, 0x01)); // Center
  txt(SEP);
  lf();
  if (data.footer) {
    txt(data.footer);
    lf();
  }
  txt("شكراً لزيارتكم 🙏");
  lf();
  
  // Paper feed and cut
  lf();
  lf();
  lf();
  push(escBytes(0x1b, 0x64, 0x03)); // Feed 3 lines
  push(escBytes(0x1d, 0x56, 0x00)); // Full cut (or 0x01 for partial cut)
  
  // Combine all parts
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { 
    result.set(p, offset); 
    offset += p.length; 
  }
  
  return result;
}

// Bluetooth GATT characteristics for thermal printers
const THERMAL_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // XPrinter service
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Generic BLE UART service
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART service
  "180a",                                    // Device Information
];

const THERMAL_PRINTER_WRITE_CHARS = [
  "00002af1-0000-1000-8000-00805f9b34fb", // XPrinter write
  "49535343-8841-43f4-a8d4-ecbe34729bb3", // Generic UART TX
  "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART TX
];

async function findWriteCharacteristic(server: any): Promise<any> {
  const characteristics = [];
  
  // Try predefined services and characteristics first
  for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      
      // Try predefined write characteristics
      for (const charUuid of THERMAL_PRINTER_WRITE_CHARS) {
        try {
          const char = await service.getCharacteristic(charUuid);
          if (char && (char.properties?.write || char.properties?.writeWithoutResponse)) {
            return char;
          }
        } catch {}
      }
      
      // If no predefined characteristic found, list all and pick writable one
      const allChars = await service.getCharacteristics();
      for (const char of allChars) {
        if (char.properties?.write || char.properties?.writeWithoutResponse) {
          characteristics.push(char);
        }
      }
    } catch {}
  }
  
  // Return first writable characteristic found
  if (characteristics.length > 0) {
    return characteristics[0];
  }
  
  return null;
}

async function writeToPrinterWithRetry(
  characteristic: any, 
  data: Uint8Array, 
  maxRetries: number = 3,
  chunkSize: number = 512
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      // Write in chunks with small delay between chunks
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
        
        try {
          if (characteristic.properties?.writeWithoutResponse) {
            await characteristic.writeValueWithoutResponse(chunk);
          } else if (characteristic.properties?.write) {
            await characteristic.writeValue(chunk);
          } else {
            throw new Error("Characteristic does not support write operations");
          }
        } catch (chunkError: any) {
          // Check if error is a disconnect/GATT error
          if (chunkError?.message?.includes("GATT") || chunkError?.message?.includes("Unknown")) {
            throw chunkError; // Propagate to retry
          }
          // For other errors, continue
        }
        
        // Small delay between chunks to avoid overwhelming the printer
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      return; // Success
    } catch (error: any) {
      lastError = error;
      if (retry < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * (retry + 1)));
      }
    }
  }
  
  throw lastError || new Error("Failed to write to printer after retries");
}

export async function printBluetooth(
  data: Uint8Array, 
  options?: { 
    deviceId?: string; 
    deviceName?: string;
    maxRetries?: number;
  }
): Promise<{ name: string; id: string }> {
  if (!("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth غير مدعوم. استخدم Chrome أو Edge على جهاز يدعم البلوتوث.");
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bt = (navigator as any).bluetooth as BluetoothNavigatorLike;
  const maxRetries = options?.maxRetries ?? 3;
  let lastError: Error | null = null;

  // Try to get persisted device first
  let device: BluetoothDeviceRecord | null = null;
  if (options?.deviceId) {
    device = await getPersistedBluetoothDevice(bt, options.deviceId);
  }

  // If persisted device exists and is connected, try to use it
  if (device?.gatt?.connected) {
    try {
      const server = device.gatt;
      const char = await findWriteCharacteristic(server);
      if (char) {
        await writeToPrinterWithRetry(char, data, maxRetries);
        return { name: device.name || "Bluetooth Printer", id: device.id };
      }
    } catch (error: any) {
      lastError = error;
      // Connection failed, will try fresh connection below
    }
  }

  // Request new device if persisted one unavailable or failed
  if (!device) {
    try {
      device = await requestBluetoothDevice(bt, options?.deviceName);
    } catch (error: any) {
      throw new Error(
        `فشل البحث عن طابعة بلوتوث. تأكد من تشغيل البلوتوث والطابعة. ${error?.message || ""}`
      );
    }
  }

  // Connect to GATT server
  if (!device.gatt) {
    throw new Error("الجهاز المحدد لا يدعم اتصال GATT. قد يكون جهازاً قديماً أو غير متوافق.");
  }

  let server: any = null;
  let connectionAttempts = 0;
  const maxConnectionAttempts = maxRetries;

  while (connectionAttempts < maxConnectionAttempts) {
    try {
      server = await device.gatt.connect();
      break; // Successfully connected
    } catch (error: any) {
      connectionAttempts++;
      if (connectionAttempts >= maxConnectionAttempts) {
        throw new Error(
          `فشل الاتصال بالطابعة (محاولات: ${connectionAttempts}). تأكد من قرب الطابعة وتشغيلها. ${error?.message || ""}`
        );
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Find write characteristic
  let char: any = null;
  try {
    char = await findWriteCharacteristic(server);
  } catch (error: any) {
    throw new Error(
      `فشل البحث عن خصائص الطابعة. قد تكون الطابعة غير متوافقة. ${error?.message || ""}`
    );
  }

  if (!char) {
    throw new Error(
      "لم يتم العثور على خدمة الطباعة في الجهاز. تأكد من أن الجهاز طابعة حرارية مدعومة."
    );
  }

  // Write data to printer with retry
  try {
    await writeToPrinterWithRetry(char, data, maxRetries);
  } catch (error: any) {
    throw new Error(
      `فشلت الطباعة عبر البلوتوث: ${error?.message || "خطأ غير معروف"}`
    );
  }

  return { name: device.name || "Bluetooth Printer", id: device.id };
}

export async function printNetwork(ip: string, port: number, data: Uint8Array, timeout: number = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(`http://${ip}:${port}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: data as BodyInit,
      signal: controller.signal,
    });
    
    if (!res.ok) {
      throw new Error(`خطأ HTTP: ${res.status} - ${res.statusText}`);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`انتهت مهلة الاتصال (${timeout}ms). تأكد من عنوان IP والمنفذ.`);
    }
    throw new Error(`خطأ في الطباعة عبر الشبكة: ${error?.message || "فشل الاتصال"}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

// WebUSB Support for XPrinter and other USB thermal printers
export async function printUSB(data: Uint8Array): Promise<{ name: string }> {
  if (!("usb" in navigator)) {
    throw new Error("Web USB API غير مدعومة. استخدم Chrome أو Edge.");
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usb = (navigator as any).usb;
  
  // Common thermal printer USB IDs (Vendor ID: Product ID)
  const THERMAL_PRINTERS = [
    { vendorId: 0x0483, productId: 0x0408 }, // XPrinter
    { vendorId: 0x1208, productId: 0x0201 }, // Zjiang/Xprinter
    { vendorId: 0x0493, productId: 0x8000 }, // Datamax/Honeywell
  ];
  
  let device: any = null;
  
  try {
    // Try to request device
    device = await usb.requestDevice({
      filters: THERMAL_PRINTERS,
    });
  } catch (error: any) {
    throw new Error(`فشل اختيار جهاز USB: ${error?.message || "تم الإلغاء"}`);
  }
  
  if (!device) {
    throw new Error("لم يتم اختيار جهاز USB");
  }
  
  try {
    await device.open();
    await device.claimInterface(0);
    
    // Find OUT endpoint for sending data
    let outEndpoint = null;
    const iface = device.configuration.interfaces[0];
    if (iface) {
      const alt = iface.alternates[0];
      if (alt) {
        outEndpoint = alt.endpoints.find((e: any) => e.direction === "out");
      }
    }
    
    if (!outEndpoint) {
      throw new Error("لم يتم العثور على endpoint للطباعة");
    }
    
    // Send data in chunks
    const chunkSize = 64;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      await device.transferOut(outEndpoint.endpointNumber, chunk);
    }
    
    await device.close();
    return { name: device.productName || "USB Printer" };
  } catch (error: any) {
    try {
      await device.close();
    } catch {}
    throw new Error(`خطأ في الطباعة عبر USB: ${error?.message || "فشل الاتصال"}`);
  }
}

// Validate printer connection without printing (for testing)
export async function validatePrinterConnection(config: PrinterConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (config.type === "bluetooth") {
      // Check Bluetooth availability
      if (!("bluetooth" in navigator)) {
        return { success: false, message: "Web Bluetooth غير مدعوم على هذا الجهاز" };
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bt = (navigator as any).bluetooth;
      
      // Check if there are any persisted devices
      if (typeof bt.getDevices === "function") {
        const devices = await bt.getDevices();
        if (devices.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matched = devices.find((d: any) => d.id === config.bluetoothDeviceId || d.name === config.bluetoothName);
          if (matched?.gatt?.connected) {
            return { success: true, message: `متصل بـ: ${matched.name}` };
          }
        }
      }
      
      return { success: true, message: "جاهز للاتصال - سيتم البحث عند الطباعة" };
    }
    
    if (config.type === "network" && config.networkIp) {
      // Quick network connectivity check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      try {
        const res = await fetch(`http://${config.networkIp}:${config.networkPort || 9100}/status`, {
          method: "GET",
          signal: controller.signal,
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (res?.ok) {
          return { success: true, message: "الطابعة جاهزة" };
        }
        
        return { success: true, message: "العنوان قابل للوصول - جاهز للطباعة" };
      } catch (error: any) {
        clearTimeout(timeoutId);
        return { success: false, message: "لا يمكن الوصول إلى عنوان IP الطابعة" };
      }
    }
    
    if (config.type === "browser") {
      return { success: true, message: "جاهز للطباعة عبر المتصفح" };
    }
    
    if (config.type === "usb") {
      if (!("usb" in navigator)) {
        return { success: false, message: "Web USB غير مدعوم" };
      }
      return { success: true, message: "جاهز للطباعة عبر USB" };
    }
    
    return { success: false, message: "نوع اتصال غير معروف" };
  } catch (error: any) {
    return { success: false, message: error?.message || "خطأ غير معروف" };
  }
}

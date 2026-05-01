export type PrinterType = "browser" | "bluetooth" | "network" | "usb";

export interface PrinterConfig {
  type: PrinterType;
  networkIp?: string;
  networkPort?: number;
  bluetoothName?: string;
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

export function buildReceiptHtml(data: {
  orgName: string;
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

  return `
    <div style="font-family:'Courier New',monospace;width:76mm;margin:0 auto;direction:rtl;font-size:12px;padding:4px;">
      <h2 style="text-align:center;margin:4px 0;font-size:16px;">${data.orgName}</h2>
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
      <p style="margin:2px 0;">الضريبة (15%): ${fmt(data.tax)}</p>
      <p style="font-weight:bold;font-size:14px;margin:4px 0;">الإجمالي: ${fmt(data.total)}</p>
      <p style="margin:2px 0;">طريقة الدفع: ${data.paymentMethod}</p>
      <hr style="border:1px dashed #000;margin:6px 0;"/>
      ${data.footer ? `<p style="text-align:center;margin:4px 0;">${data.footer}</p>` : ""}
      <p style="text-align:center;margin:4px 0;">شكراً لزيارتكم 🙏</p>
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
  footer?: string;
}): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const push = (b: Uint8Array) => parts.push(b);
  const txt = (s: string) => push(enc.encode(s));
  const lf = () => push(new Uint8Array([0x0a]));
  const fmt = (n: number) => n.toFixed(2);
  const SEP = "--------------------------------";

  push(escBytes(0x1b, 0x40)); // Init
  push(escBytes(0x1b, 0x61, 0x01)); // Center
  push(escBytes(0x1b, 0x45, 0x01)); // Bold on
  txt(data.orgName); lf();
  push(escBytes(0x1b, 0x45, 0x00)); // Bold off
  txt(`#${data.orderNumber}`); lf();
  txt(SEP); lf();
  push(escBytes(0x1b, 0x61, 0x00)); // Left align

  for (const item of data.items) {
    const label = (item.nameAr || item.name).substring(0, 18);
    const right = `${item.qty}x${fmt(item.price)}`;
    txt(`${label.padEnd(20)}${right}`); lf();
  }

  txt(SEP); lf();
  txt(`المجموع:      ${fmt(data.subtotal)}`); lf();
  if (data.discount) { txt(`الخصم:        -${fmt(data.discount)}`); lf(); }
  txt(`الضريبة:      ${fmt(data.tax)}`); lf();
  push(escBytes(0x1b, 0x45, 0x01));
  txt(`الإجمالي:     ${fmt(data.total)}`); lf();
  push(escBytes(0x1b, 0x45, 0x00));
  txt(`الدفع: ${data.paymentMethod}`); lf();
  txt(SEP); lf();

  push(escBytes(0x1b, 0x61, 0x01));
  if (data.footer) { txt(data.footer); lf(); }
  txt("شكراً لزيارتكم"); lf();
  lf(); lf(); lf();
  push(escBytes(0x1d, 0x56, 0x00)); // Full cut

  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { result.set(p, offset); offset += p.length; }
  return result;
}

export async function printBluetooth(data: Uint8Array): Promise<string> {
  if (!("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth غير مدعوم. استخدم Chrome أو Edge على جهاز يدعم البلوتوث.");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bt = (navigator as any).bluetooth;
  const device = await bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    ],
  });

  const server = await device.gatt.connect();
  const serviceUUIDs = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  ];
  const writeCharUUIDs = [
    "00002af1-0000-1000-8000-00805f9b34fb",
    "49535343-8841-43f4-a8d4-ecbe34729bb3",
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let char: any = null;
  for (const svcId of serviceUUIDs) {
    try {
      const svc = await server.getPrimaryService(svcId);
      for (const charId of writeCharUUIDs) {
        try { char = await svc.getCharacteristic(charId); if (char) break; } catch {}
      }
      if (!char) {
        const chars = await svc.getCharacteristics();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        char = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
      }
      if (char) break;
    } catch {}
  }
  if (!char) throw new Error("لم يتم العثور على خدمة الطباعة في الجهاز");

  const CHUNK = 512;
  for (let i = 0; i < data.length; i += CHUNK) {
    const chunk = data.slice(i, Math.min(i + CHUNK, data.length));
    if (char.properties.writeWithoutResponse) {
      await char.writeValueWithoutResponse(chunk);
    } else {
      await char.writeValue(chunk);
    }
  }
  return device.name || "Bluetooth Printer";
}

export async function printNetwork(ip: string, port: number, data: Uint8Array) {
  const res = await fetch(`http://${ip}:${port}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: data,
  });
  if (!res.ok) throw new Error(`خطأ في الطباعة عبر الشبكة: ${res.status}`);
}

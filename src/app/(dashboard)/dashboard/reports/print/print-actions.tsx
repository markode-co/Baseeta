"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";
import { buildSalesReport, getPrinterManager, type SalesReportPrintData } from "@/lib/printer";

export function PrintActions({ data }: { data: SalesReportPrintData }) {
  const [isPrinting, setIsPrinting] = useState(false);

  async function printReport() {
    setIsPrinting(true);
    try {
      const manager = getPrinterManager();
      const cashierPrinter = manager.getConfig().cashier_printer;
      const bytes = buildSalesReport(data, { ...cashierPrinter, paperWidth: 80 });
      await manager.print({
        printerId: "cashier_printer",
        data: bytes,
        description: "طباعة تقرير المبيعات",
      });
      toast.success("تم إرسال التقرير لطابعة الكاشير");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشلت طباعة التقرير");
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={printReport}
      disabled={isPrinting}
      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Printer className="h-4 w-4" />
      {isPrinting ? "جاري الطباعة..." : "زر الطابعة"}
    </button>
  );
}

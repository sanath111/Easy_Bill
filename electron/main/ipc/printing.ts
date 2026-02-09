import { ipcMain, BrowserWindow } from 'electron';
import { getSettings, getCategories } from '../database/db';

let printWindow: BrowserWindow | null = null;

export function setupPrintingHandlers() {
  // Get list of available printers
  ipcMain.handle('print:get-printers', async () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return [];
    const printers = await win.webContents.getPrintersAsync();
    return printers;
  });

  ipcMain.handle('print:bill', async (_event, billData) => {
    try {
      console.log('Received print request:', billData);
      
      const settings = getSettings() as any;
      const defaultPrinter = settings.printer_name;

      if (!defaultPrinter) {
        return { success: false, error: "No default printer configured in settings." };
      }

      const isKOT = billData.type === 'KOT';
      const printerMode = settings.printer_mode || 'single';
      const singlePrinterKotType = settings.single_printer_kot_type || 'single_kot';

      // 1. Determine Jobs
      let jobs: { printer: string, items: any[], title: string }[] = [];

      if (!isKOT || (printerMode === 'single' && singlePrinterKotType === 'single_kot')) {
        // Single Job
        jobs.push({
          printer: defaultPrinter,
          items: billData.items,
          title: isKOT ? 'KITCHEN ORDER TICKET' : (settings.hotel_name || 'Easy Bill Hotel')
        });
      } else {
        // Multiple Jobs (Category-wise)
        const categories = getCategories() as any[];
        const categoryMap = categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {});
        
        // Group items by category
        const groups: { [key: string]: any[] } = {};
        billData.items.forEach((item: any) => {
          const catId = item.category_id || 'uncategorized';
          if (!groups[catId]) groups[catId] = [];
          groups[catId].push(item);
        });

        for (const [catId, items] of Object.entries(groups)) {
          let printer = defaultPrinter;
          let categoryName = 'Uncategorized';

          if (catId !== 'uncategorized') {
            const cat = categoryMap[catId];
            if (cat) {
              categoryName = cat.name;
              if (printerMode === 'multiple' && cat.printer_name) {
                printer = cat.printer_name;
              }
            }
          }

          jobs.push({
            printer: printer,
            items: items,
            title: `KOT - ${categoryName.toUpperCase()}`
          });
        }
      }

      // 2. Execute Jobs
      for (const job of jobs) {
        await executePrintJob(job, billData, settings);
      }

      return { success: true, message: "Print jobs initiated" };

    } catch (error: any) {
      console.error('Printing failed:', error);
      return { success: false, error: error.message };
    }
  });
}

async function executePrintJob(job: any, billData: any, settings: any) {
  const isKOT = billData.type === 'KOT';
  
  // Determine CSS width based on paper size setting (printable area)
  let cssWidth = '70mm'; // Default 3 inch (Printable 76mm)
  if (settings.paper_size === '58mm') cssWidth = '52mm'; // 2 inch (Printable 58mm)
  if (settings.paper_size === '100mm') cssWidth = '104mm'; // 4 inch (Printable 110mm)

  // Divider Logic
  const dividerType = settings.divider_type || 'css'; // 'css' or 'text'
  const dividerChar = settings.divider_character || '-';
  
  let dividerHtml = '';
  if (dividerType === 'text') {
    const repeatCount = settings.paper_size === '58mm' ? 32 : settings.paper_size === '100mm' ? 64 : 42; 
    const lineStr = dividerChar.repeat(repeatCount);
    dividerHtml = `<div class="divider-text">${lineStr}</div>`;
  } else {
    let borderStyle = '1px dashed #000';
    if (settings.line_pattern === 'solid') borderStyle = '1px solid #000';
    if (settings.line_pattern === 'double') borderStyle = '3px double #000';
    dividerHtml = `<div class="divider-css" style="border-top: ${borderStyle};"></div>`;
  }

  // Font Settings
  const fontHeader = { family: settings.font_family_header || 'monospace', size: settings.font_size_header || '16px' };
  const fontAddress = { family: settings.font_family_address || 'monospace', size: settings.font_size_address || '12px' };
  const fontBody = { family: settings.font_family_body || 'monospace', size: settings.font_size_body || '12px' };
  const fontFooter = { family: settings.font_family_footer || 'monospace', size: settings.font_size_footer || '12px' };

  let tableDisplay = 'Takeaway';
  if (billData.tableId) {
    tableDisplay = `Dine In: T${billData.tableId}`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { margin: 0; size: ${cssWidth} auto; }
        body { width: ${cssWidth}; margin: 0; padding: 0; color: black; box-sizing: border-box; overflow-x: hidden; }
        .header-section { font-family: ${fontHeader.family}; font-size: ${fontHeader.size}; text-align: center; font-weight: bold; text-transform: uppercase; word-wrap: break-word; margin-bottom: 2px; }
        .address-section { font-family: ${fontAddress.family}; font-size: ${fontAddress.size}; text-align: center; white-space: pre-wrap; word-wrap: break-word; }
        .body-section { font-family: ${fontBody.family}; font-size: ${fontBody.size}; }
        .footer-section { font-family: ${fontFooter.family}; font-size: ${fontFooter.size}; text-align: center; margin-top: 10px; word-wrap: break-word; }
        .divider-container { margin: 5px 0; width: 100%; text-align: center; overflow: hidden; }
        .divider-text { font-family: monospace; white-space: nowrap; }
        .divider-css { width: 100%; }
        .grid-meta { display: flex; flex-wrap: wrap; justify-content: space-between; line-height: 1.4; }
        .bold { font-weight: bold; }
        .flex-row { display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { text-align: left; vertical-align: top; padding: 2px 0; word-break: break-all; }
        .col-item { width: 60%; }
        .col-qty { width: 40%; text-align: right; }
        .col-item-bill { width: 40%; }
        .col-qty-bill { width: 15%; text-align: right; }
        .col-price-bill { width: 22%; text-align: right; }
        .col-amt-bill { width: 23%; text-align: right; }
        .grand-total { font-size: 1.2em; font-weight: bold; text-align: right; margin: 5px 0; display: flex; justify-content: space-between; align-items: center; }
      </style>
    </head>
    <body>
      <div class="header-section">
        ${!isKOT && settings.show_logo === 'true' ? '<div>[LOGO]</div>' : ''}
        <div>${job.title}</div>
      </div>
      
      ${!isKOT ? `
        <div class="address-section">
          <div>${settings.hotel_address || ''}</div>
          ${settings.hotel_phone ? `<div>Ph: ${settings.hotel_phone}</div>` : ''}
          ${settings.gst_number ? `<div>GST: ${settings.gst_number}</div>` : ''}
          ${settings.fssai_number ? `<div>FSSAI: ${settings.fssai_number}</div>` : ''}
        </div>
      ` : ''}
      <div class="divider-container">${dividerHtml}</div>

      <div class="body-section">
        <div class="grid-meta">
          <div style="width: 50%;">Date: ${dateStr}</div>
          <div style="width: 50%; text-align: right;" class="bold">${tableDisplay}</div>
          <div style="width: 50%;">${timeStr}</div>
          <div style="width: 50%; text-align: right;">${isKOT ? 'Token' : 'Bill'} No.: ${isKOT ? (billData.tokenNumber || 'N/A') : (billData.billNumber || 'N/A')}</div>
        </div>

        <div class="divider-container">${dividerHtml}</div>

        <table>
          <thead>
            <tr>
              <th class="${isKOT ? 'col-item' : 'col-item-bill'}">Item</th>
              <th class="${isKOT ? 'col-qty' : 'col-qty-bill'}">Qty.</th>
              ${!isKOT ? `<th class="col-price-bill">Price</th><th class="col-amt-bill">Amount</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${job.items.map((item: any) => `
              <tr>
                <td class="${isKOT ? 'col-item' : 'col-item-bill'}">${item.name}</td>
                <td class="${isKOT ? 'col-qty' : 'col-qty-bill'}">${item.quantity}</td>
                ${!isKOT ? `
                  <td class="col-price-bill">${item.price.toFixed(2)}</td>
                  <td class="col-amt-bill">${(item.price * item.quantity).toFixed(2)}</td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="divider-container">${dividerHtml}</div>
        
        ${!isKOT ? `
          <div class="grand-total"><span>Grand Total</span><span>₹ ${billData.total.toFixed(2)}</span></div>
          <div class="divider-container">${dividerHtml}</div>
          <div class="footer-section">${settings.bill_footer || ''}</div>
        ` : `<div style="text-align: center; font-weight: bold; margin-top: 10px;">End of KOT</div>`}
      </div>
    </body>
    </html>
  `;

  if (!printWindow || printWindow.isDestroyed()) {
    printWindow = new BrowserWindow({ show: false, width: 400, height: 600, webPreferences: { nodeIntegration: false } });
  }

  await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

  return new Promise((resolve) => {
    printWindow!.webContents.print({
      silent: true,
      deviceName: job.printer,
      margins: { marginType: 'none' }
    }, (success, errorType) => {
      if (!success) console.error(`Print failed to ${job.printer}:`, errorType);
      resolve(success);
      });
      });
    }
    
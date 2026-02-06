import { ipcMain, BrowserWindow } from 'electron';
import { getSettings } from '../database/db';

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
      const printerName = settings.printer_name;

      if (!printerName) {
        return { success: false, error: "No printer configured in settings." };
      }

      console.log(`Printing to: ${printerName}`);

      // Determine CSS width based on paper size setting (printable area)
      let cssWidth = '70mm'; // Default 3 inch (Printable 76mm)
      if (settings.paper_size === '58mm') cssWidth = '52mm'; // 2 inch (Printable 58mm)
      if (settings.paper_size === '100mm') cssWidth = '104mm'; // 4 inch (Printable 110mm)

      // Determine Line Style
      let borderStyle = '1px dashed #000';
      if (settings.line_pattern === 'solid') borderStyle = '1px solid #000';
      if (settings.line_pattern === 'double') borderStyle = '3px double #000';
      
      // Determine Font Family
      const fontFamily = settings.font_family || 'monospace';

      // Token Number (if needed for internal logic, though not in sample)
      const tokenNumber = billData.tableId ? `${billData.tableId}` : `${Math.floor(Math.random() * 100)}`;
      
      // Order Type / Table Name
      let tableDisplay = 'Takeaway';
      if (billData.tableId) {
        // Find table name from tableId if possible, but billData might only have ID.
        // For now assume "Table X" or passed "Dine In" logic if available.
        // Since we don't have the table name in billData usually, we might rely on ID.
        // ideally billData should contain the table name or we fetch it.
        // For simplicity, we'll format as "Dine In: T<ID>"
        tableDisplay = `Dine In: T${billData.tableId}`;
      }

      // Determine Title (KOT or Bill)
      const title = billData.type === 'KOT' ? 'KITCHEN ORDER TICKET' : (settings.hotel_name || 'Easy Bill Hotel');
      const isKOT = billData.type === 'KOT';
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YY
      const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      const totalQty = billData.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

      // 1. Generate HTML for the receipt
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page {
              margin: 0;
              size: ${cssWidth} auto;
            }
            body {
              font-family: ${fontFamily};
              width: ${cssWidth};
              margin: 0;
              padding: 0; /* No padding as requested */
              font-size: ${settings.font_size_body || '12px'};
              color: black;
              box-sizing: border-box;
              overflow-x: hidden;
            }
            .header {
              text-align: center;
              margin-bottom: 5px;
            }
            .hotel-name {
              font-size: ${settings.font_size_header || '16px'};
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 2px;
              word-wrap: break-word;
            }
            .address {
              font-size: 0.9em;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .divider {
              border-top: ${borderStyle};
              margin: 5px 0;
              width: 100%;
            }
            .grid-meta {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              margin: 5px 0;
              line-height: 1.4;
            }
            .grid-meta > div {
              /* Ensure items don't overlap */
            }
            .bold {
              font-weight: bold;
            }
            .flex-row {
              display: flex;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              text-align: left;
              vertical-align: top;
              padding: 2px 0;
              word-break: break-all; /* Prevent overflow */
            }
            th {
              padding-bottom: 2px;
            }
            /* Adjusted Column widths for better fit */
            .col-item { width: 40%; }
            .col-qty { width: 15%; text-align: right; }
            .col-price { width: 22%; text-align: right; }
            .col-amt { width: 23%; text-align: right; }

            .totals-section {
              margin-top: 5px;
            }
            .grand-total {
              font-size: 1.2em;
              font-weight: bold;
              text-align: right;
              margin: 5px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 0.9em;
              word-wrap: break-word;
            }
            .name-field {
              margin: 5px 0;
              display: flex;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${!isKOT && settings.show_logo === 'true' ? '<div>[LOGO]</div>' : ''}
            <div class="hotel-name">${title}</div>
            ${!isKOT ? `<div class="address">${settings.hotel_address || ''}</div>` : ''}
          </div>

          <div class="divider"></div>

          ${!isKOT ? `
          <div class="name-field">
            Name: __________________________
          </div>
          <div class="divider"></div>
          ` : ''}

          <div class="grid-meta">
            <div style="width: 50%;">Date: ${dateStr}</div>
            <div style="width: 50%; text-align: right;" class="bold">${tableDisplay}</div>
            <div style="width: 50%;">${timeStr}</div>
            <div style="width: 50%; text-align: right;">Bill No.: ${Math.floor(Math.random() * 10000)}</div>
            ${!isKOT && settings.show_cashier === 'true' ? `<div style="width: 100%; margin-top: 2px;">Cashier: ${settings.cashier_name || 'Admin'}</div>` : ''}
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th class="col-item">Item</th>
                <th class="col-qty">Qty.</th>
                ${!isKOT ? `
                <th class="col-price">Price</th>
                <th class="col-amt">Amount</th>
                ` : ''}
              </tr>
            </thead>
          </table>
          <div class="divider" style="margin-top: 0;"></div>
          <table>
            <tbody>
              ${billData.items.map((item: any) => `
                <tr>
                  <td class="col-item">${item.name}</td>
                  <td class="col-qty">${item.quantity}</td>
                  ${!isKOT ? `
                  <td class="col-price">${item.price.toFixed(2)}</td>
                  <td class="col-amt">${(item.price * item.quantity).toFixed(2)}</td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          ${!isKOT ? `
          <div class="totals-section">
            <div class="flex-row">
              <span class="bold">Total Qty: ${totalQty}</span>
              <span class="bold">Sub Total  ${billData.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="divider"></div>

          <div class="grand-total">
            <span>Grand Total</span>
            <span>₹ ${billData.total.toFixed(2)}</span>
          </div>

          <div class="divider"></div>
          
          <div class="footer">
            <div>Thank You, Visit Again</div>
            ${settings.bill_footer ? `<div>${settings.bill_footer}</div>` : ''}
          </div>
          ` : ''}

          ${isKOT ? `<div style="text-align: center; font-weight: bold; margin-top: 10px;">End of KOT</div>` : ''}
        </body>
        </html>
      `;

      // 2. Create or reuse a hidden window to render the HTML
      if (!printWindow || printWindow.isDestroyed()) {
        printWindow = new BrowserWindow({
          show: false,
          width: 400,
          height: 600,
          webPreferences: {
            nodeIntegration: false
          }
        });
      }

      // 3. Load the HTML
      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      // 4. Print
      return new Promise((resolve) => {
        if (!printWindow) return resolve({ success: false, error: "Window creation failed" });
        
        printWindow.webContents.print({
          silent: true,
          printBackground: true,
          deviceName: printerName,
          margins: {
            marginType: 'none'
          }
        }, (success, errorType) => {
          if (!success) {
            console.error('Print failed:', errorType);
            resolve({ success: false, error: errorType });
          } else {
            console.log('Print initiated successfully');
            resolve({ success: true, message: "Printed successfully" });
          }
        });
      });

    } catch (error: any) {
      console.error('Printing failed:', error);
      return { success: false, error: error.message };
    }
  });
}
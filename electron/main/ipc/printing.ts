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

      // Determine CSS width based on paper size setting
      let cssWidth = '80mm'; // Default 3 inch
      if (settings.paper_size === '58mm') cssWidth = '58mm'; // 2 inch
      if (settings.paper_size === '100mm') cssWidth = '100mm'; // 4 inch

      // Determine Line Style
      let borderStyle = '1px dashed #000';
      if (settings.line_pattern === 'solid') borderStyle = '1px solid #000';
      if (settings.line_pattern === 'double') borderStyle = '3px double #000';
      
      // Token Number
      const tokenNumber = billData.tableId ? `Token: #${billData.tableId}-${Math.floor(Math.random() * 100)}` : `Token: #${Math.floor(Math.random() * 1000)}`;

      // Determine Title (KOT or Bill)
      const title = billData.type === 'KOT' ? 'KITCHEN ORDER TICKET' : (settings.hotel_name || 'Easy Bill Hotel');
      const isKOT = billData.type === 'KOT';

      // 1. Generate HTML for the receipt
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page {
              margin: 0;
              size: ${cssWidth} auto; /* Auto height */
            }
            body {
              font-family: 'Courier New', monospace;
              width: ${cssWidth};
              margin: 0;
              padding: 2mm; /* Small padding to prevent edge cutting */
              font-size: ${settings.font_size_body || '12px'};
              box-sizing: border-box; /* Crucial: Padding included in width */
              overflow: hidden; /* Prevent spillover */
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .hotel-name {
              font-size: ${settings.font_size_header || '16px'};
              font-weight: bold;
              text-transform: uppercase;
              word-wrap: break-word; /* Prevent long names from breaking layout */
            }
            .divider {
              border-top: ${borderStyle};
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed; /* Fixed layout for better column control */
            }
            th, td {
              text-align: left;
              padding: 2px 0;
              word-wrap: break-word;
            }
            /* Column widths */
            th:nth-child(1), td:nth-child(1) { width: 50%; } /* Item Name */
            th:nth-child(2), td:nth-child(2) { width: 20%; text-align: right; } /* Qty */
            th:nth-child(3), td:nth-child(3) { width: 30%; text-align: right; } /* Price */

            .text-right {
              text-align: right;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
              word-wrap: break-word;
            }
            .token {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${!isKOT && settings.show_logo === 'true' ? '<div>[LOGO]</div>' : ''}
            <div class="hotel-name">${title}</div>
            ${!isKOT ? `<div>${settings.hotel_address || ''}</div>` : ''}
            <div>Date: ${new Date().toLocaleString()}</div>
            ${billData.tableId ? `<div>Table: ${billData.tableId}</div>` : '<div>Takeaway</div>'}
          </div>
          
          ${settings.show_token === 'true' ? `<div class="token">${tokenNumber}</div>` : ''}

          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                ${!isKOT ? '<th class="text-right">Price</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${billData.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  ${!isKOT ? `<td class="text-right">${(item.price * item.quantity).toFixed(2)}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          ${!isKOT ? `
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
            <span>Total:</span>
            <span>₹${billData.total.toFixed(2)}</span>
          </div>
          
          <div class="footer">
            ${settings.bill_footer || 'Thank you for your visit!'}
          </div>
          ` : ''}
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
          // We don't close the window immediately to allow reuse,
          // but in a real app you might want to manage lifecycle better.
        });
      });

    } catch (error: any) {
      console.error('Printing failed:', error);
      return { success: false, error: error.message };
    }
  });
}
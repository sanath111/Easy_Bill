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

      // Divider Logic
      const dividerType = settings.divider_type || 'css'; // 'css' or 'text'
      const dividerChar = settings.divider_character || '-';
      
      let dividerHtml = '';
      if (dividerType === 'text') {
        // Create a string of characters (approximate width)
        // This is tricky without knowing exact char width, but flexible for "text feel"
        const repeatCount = settings.paper_size === '58mm' ? 32 : settings.paper_size === '100mm' ? 64 : 42; 
        const lineStr = dividerChar.repeat(repeatCount);
        dividerHtml = `<div class="divider-text">${lineStr}</div>`;
      } else {
        // CSS Style
        let borderStyle = '1px dashed #000';
        if (settings.line_pattern === 'solid') borderStyle = '1px solid #000';
        if (settings.line_pattern === 'double') borderStyle = '3px double #000';
        dividerHtml = `<div class="divider-css" style="border-top: ${borderStyle};"></div>`;
      }

      // Font Settings per section
      const fontHeader = {
        family: settings.font_family_header || 'monospace',
        size: settings.font_size_header || '16px'
      };
      const fontAddress = {
        family: settings.font_family_address || 'monospace',
        size: settings.font_size_address || '12px'
      };
      const fontBody = {
        family: settings.font_family_body || 'monospace',
        size: settings.font_size_body || '12px'
      };
      const fontFooter = {
        family: settings.font_family_footer || 'monospace',
        size: settings.font_size_footer || '12px'
      };

      // Order Type / Table Name
      let tableDisplay = 'Takeaway';
      if (billData.tableId) {
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
              width: ${cssWidth};
              margin: 0;
              padding: 0;
              color: black;
              box-sizing: border-box;
              overflow-x: hidden;
            }
            /* Section Styles */
            .header-section {
              font-family: ${fontHeader.family};
              font-size: ${fontHeader.size};
              text-align: center;
              font-weight: bold;
              text-transform: uppercase;
              word-wrap: break-word;
              margin-bottom: 2px;
            }
            .address-section {
              font-family: ${fontAddress.family};
              font-size: ${fontAddress.size};
              text-align: center;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .body-section {
              font-family: ${fontBody.family};
              font-size: ${fontBody.size};
            }
            .footer-section {
              font-family: ${fontFooter.family};
              font-size: ${fontFooter.size};
              text-align: center;
              margin-top: 10px;
              word-wrap: break-word;
            }

            /* Divider */
            .divider-container {
              margin: 5px 0;
              width: 100%;
              text-align: center;
              overflow: hidden;
            }
            .divider-text {
              font-family: monospace; /* Always monospace for alignment */
              white-space: nowrap;
            }
            .divider-css {
              width: 100%;
            }

            .grid-meta {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              line-height: 1.4;
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
              word-break: break-all;
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
            .name-field {
              margin: 5px 0;
              display: flex;
            }
          </style>
        </head>
        <body>
          <div class="header-section">
            ${!isKOT && settings.show_logo === 'true' ? '<div>[LOGO]</div>' : ''}
            <div>${title}</div>
          </div>
          
          ${!isKOT ? `<div class="address-section">${settings.hotel_address || ''}</div>` : ''}

          <div class="divider-container">${dividerHtml}</div>

          <div class="body-section">
            ${!isKOT ? `
            <div class="name-field">
              Name:
            </div>
            <div class="divider-container">${dividerHtml}</div>
            ` : ''}

            <div class="grid-meta">
              <div style="width: 50%;">Date: ${dateStr}</div>
              <div style="width: 50%; text-align: right;" class="bold">${tableDisplay}</div>
              <div style="width: 50%;">${timeStr}</div>
              <div style="width: 50%; text-align: right;">Bill No.: ${Math.floor(Math.random() * 10000)}</div>
              ${!isKOT && settings.show_cashier === 'true' ? `<div style="width: 100%; marginTop: 2px;">Cashier: ${settings.cashier_name || 'Admin'}</div>` : ''}
            </div>

            <div class="divider-container">${dividerHtml}</div>

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
            
            <div class="divider-container" style="margin-top: 0;">${dividerHtml}</div>
            
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
            
            <div class="divider-container">${dividerHtml}</div>
            
            ${!isKOT ? `
            <div class="totals-section">
              <div class="flex-row">
                <span class="bold">Total Qty: ${totalQty}</span>
                <span class="bold">Sub Total: ${billData.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="divider-container">${dividerHtml}</div>

            <div class="grand-total">
              <span>Grand Total</span>
              <span>₹ ${billData.total.toFixed(2)}</span>
            </div>

            <div class="divider-container">${dividerHtml}</div>
            ` : ''}
          </div>
          
          ${!isKOT ? `
          <div class="footer-section">
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
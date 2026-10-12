/**
 * Dedicated thermal receipt printing utility using an isolated iframe.
 * Prevents the application layout (sidebar, headers, POS panels, tables)
 * from being included in the print output.
 */
export function printReceiptElement(elementId: string, width: '80mm' | '58mm' = '80mm'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Receipt element with id '${elementId}' not found.`);
    window.print();
    return;
  }

  // Remove any leftover print iframe
  const existingIframe = document.getElementById('thermal-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create an invisible iframe attached to body
  const iframe = document.createElement('iframe');
  iframe.id = 'thermal-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Collect style and link tags from main document to retain formatting
  const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((tag) => tag.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Receipt Print</title>
        ${styleTags}
        <style>
          @page {
            size: auto;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            font-family: monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .thermal-print-container {
            width: ${width};
            max-width: 100%;
            margin: 0 auto !important;
            padding: ${width === '58mm' ? '2mm 1mm' : '3mm 2mm'} !important;
            background: #ffffff !important;
          }
          #thermal-receipt,
          #credit-note-receipt,
          .receipt-print-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          table {
            width: 100% !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            border-collapse: collapse !important;
          }
          tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .receipt-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div class="thermal-print-container">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Give styles and fonts a moment to initialize before triggering print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print()', err);
      window.print();
    } finally {
      // Clean up the iframe after print dialog closes
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }
  }, 200);
}

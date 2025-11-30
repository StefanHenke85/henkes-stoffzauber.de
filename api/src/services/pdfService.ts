import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IOrder } from '../types';
import { logger } from '../utils/logger';

const invoicesDir = path.resolve('./invoices');

// Ensure invoices directory exists
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Generate PDF invoice for order
 */
export async function generateInvoice(order: IOrder): Promise<string> {
  return new Promise((resolve, reject) => {
    const invoicePath = path.join(invoicesDir, `invoice-${order.orderNumber}.pdf`);

    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Rechnung ${order.orderNumber}`,
          Author: 'Henkes Stoffzauber',
        },
      });

      const stream = fs.createWriteStream(invoicePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .fillColor('#5A4747')
        .text("Henkes Stoffzauber", 50, 50);

      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Musterstraße 1', 50, 80)
        .text('12345 Musterstadt', 50, 95)
        .text('info@henkes-stoffzauber.de', 50, 110)
        .text('www.henkes-stoffzauber.de', 50, 125);

      // Invoice title
      doc
        .fontSize(20)
        .fillColor('#5A4747')
        .text('RECHNUNG', 400, 50, { align: 'right' });

      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Rechnungsnummer: ${order.orderNumber}`, 400, 80, { align: 'right' })
        .text(`Datum: ${new Date(order.createdAt || Date.now()).toLocaleDateString('de-DE')}`, 400, 95, { align: 'right' });

      // Horizontal line
      doc
        .strokeColor('#F2B2B4')
        .lineWidth(2)
        .moveTo(50, 160)
        .lineTo(545, 160)
        .stroke();

      // Customer address
      doc
        .fontSize(12)
        .fillColor('#5A4747')
        .text('Rechnungsadresse:', 50, 180);

      doc
        .fontSize(10)
        .fillColor('#333')
        .text(`${order.customer.firstName} ${order.customer.lastName}`, 50, 200)
        .text(`${order.customer.street} ${order.customer.houseNumber}`, 50, 215)
        .text(`${order.customer.zip} ${order.customer.city}`, 50, 230)
        .text(order.customer.country || 'Deutschland', 50, 245);

      // Order items table header
      const tableTop = 290;
      doc
        .fontSize(10)
        .fillColor('#5A4747')
        .text('Artikel', 50, tableTop)
        .text('Menge', 320, tableTop, { width: 60, align: 'center' })
        .text('Preis', 380, tableTop, { width: 70, align: 'right' })
        .text('Gesamt', 460, tableTop, { width: 85, align: 'right' });

      // Table header line
      doc
        .strokeColor('#F2B2B4')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke();

      // Order items
      let yPosition = tableTop + 30;
      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;

        doc
          .fontSize(10)
          .fillColor('#333')
          .text(item.name, 50, yPosition, { width: 260 })
          .text(item.quantity.toString(), 320, yPosition, { width: 60, align: 'center' })
          .text(`${item.price.toFixed(2)} EUR`, 380, yPosition, { width: 70, align: 'right' })
          .text(`${itemTotal.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });

        yPosition += 20;
      });

      // Totals section
      yPosition += 20;
      doc
        .strokeColor('#ddd')
        .lineWidth(1)
        .moveTo(350, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Subtotal
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Zwischensumme:', 350, yPosition)
        .text(`${order.subtotal.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });

      yPosition += 20;

      // Shipping
      if (order.shipping > 0) {
        doc
          .text('Versandkosten:', 350, yPosition)
          .text(`${order.shipping.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });
        yPosition += 20;
      }

      // Total
      doc
        .fontSize(12)
        .fillColor('#5A4747')
        .text('Gesamtbetrag:', 350, yPosition)
        .text(`${order.total.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });

      // Tax note
      yPosition += 40;
      doc
        .fontSize(9)
        .fillColor('#888')
        .text('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).', 50, yPosition);

      // Payment info
      yPosition += 30;
      doc
        .fontSize(10)
        .fillColor('#5A4747')
        .text('Zahlungsinformationen:', 50, yPosition);

      yPosition += 15;
      doc
        .fontSize(9)
        .fillColor('#333');

      if (order.paymentMethod === 'paypal') {
        doc.text('Zahlung erfolgt via PayPal.', 50, yPosition);
      } else if (order.paymentMethod === 'invoice') {
        doc
          .text('Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf folgendes Konto:', 50, yPosition)
          .text('IBAN: DE12 3456 7890 1234 5678 90', 50, yPosition + 15)
          .text('BIC: TESTBIC', 50, yPosition + 30)
          .text(`Verwendungszweck: ${order.orderNumber}`, 50, yPosition + 45);
      } else {
        doc
          .text('Bitte überweisen Sie den Betrag vor Versand auf folgendes Konto:', 50, yPosition)
          .text('IBAN: DE12 3456 7890 1234 5678 90', 50, yPosition + 15)
          .text('BIC: TESTBIC', 50, yPosition + 30)
          .text(`Verwendungszweck: ${order.orderNumber}`, 50, yPosition + 45);
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#888')
        .text(
          'Vielen Dank für Ihren Einkauf bei Henkes Stoffzauber!',
          50,
          doc.page.height - 50,
          { align: 'center', width: 495 }
        );

      doc.end();

      stream.on('finish', () => {
        logger.info(`Invoice generated: ${invoicePath}`);
        resolve(invoicePath);
      });

      stream.on('error', reject);
    } catch (error) {
      logger.error('PDF generation error:', error);
      reject(error);
    }
  });
}

/**
 * Delete invoice file
 */
export async function deleteInvoice(orderNumber: string): Promise<void> {
  const invoicePath = path.join(invoicesDir, `invoice-${orderNumber}.pdf`);
  try {
    if (fs.existsSync(invoicePath)) {
      fs.unlinkSync(invoicePath);
      logger.info(`Invoice deleted: ${invoicePath}`);
    }
  } catch (error) {
    logger.error('Error deleting invoice:', error);
  }
}

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { IOrder } from '../types';
import { logger } from '../utils/logger';

const invoicesDir = path.resolve('./invoices');
const logoPath = path.resolve('./uploads/logo.jpg');

// Ensure invoices directory exists
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Generate EPC QR Code for SEPA payment
 */
async function generatePaymentQR(
  iban: string,
  bic: string,
  recipient: string,
  amount: number,
  reference: string
): Promise<Buffer> {
  // EPC QR Code format (SEPA)
  const epcData = [
    'BCD',                    // Service Tag
    '002',                    // Version
    '1',                      // Character Set (UTF-8)
    'SCT',                    // Identification
    bic,                      // BIC
    recipient,                // Beneficiary Name
    iban,                     // Beneficiary Account
    `EUR${amount.toFixed(2)}`, // Amount
    '',                       // Purpose
    reference,                // Reference
    '',                       // Beneficiary to Originator Information
  ].join('\n');

  return await QRCode.toBuffer(epcData, { errorCorrectionLevel: 'M', width: 150 });
}

/**
 * Generate PDF invoice for order
 */
export async function generateInvoice(order: IOrder): Promise<string> {
  return new Promise(async (resolve, reject) => {
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

      // Logo (if exists) - kleiner
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 40, { width: 50, height: 50, fit: [50, 50] });
        } catch (logoError) {
          logger.warn('Logo konnte nicht geladen werden:', logoError);
        }
      }

      // Header - Company Info - kompakter
      doc
        .fontSize(16)
        .fillColor('#5A4747')
        .font('Helvetica-Bold')
        .text("Henkes Stoffzauber", 110, 40);

      doc
        .fontSize(8)
        .fillColor('#666')
        .font('Helvetica')
        .text('Rheinstraße 40  •  47495 Rheinberg  •  Tel: 015565 612722', 110, 58);

      // Invoice title - Right aligned, kompakter
      doc
        .fontSize(16)
        .fillColor('#5A4747')
        .font('Helvetica-Bold')
        .text('RECHNUNG', 380, 40, { align: 'right', width: 165 });

      // Rechnungsnummer und Datum - kompakter
      doc
        .fontSize(8)
        .fillColor('#666')
        .font('Helvetica')
        .text(`Nr: ${order.orderNumber}  •  ${new Date(order.createdAt || Date.now()).toLocaleDateString('de-DE')}`, 380, 58, { align: 'right', width: 165 });

      // Horizontal line - höher
      doc
        .strokeColor('#F2B2B4')
        .lineWidth(1)
        .moveTo(50, 85)
        .lineTo(545, 85)
        .stroke();

      // Customer address - kompakter
      doc
        .fontSize(10)
        .fillColor('#5A4747')
        .font('Helvetica-Bold')
        .text('Rechnungsadresse:', 50, 95);

      doc
        .fontSize(9)
        .fillColor('#333')
        .font('Helvetica')
        .text(`${order.customer.firstName} ${order.customer.lastName}`, 50, 110)
        .text(`${order.customer.street} ${order.customer.houseNumber}, ${order.customer.zip} ${order.customer.city}`, 50, 123);

      // Order items table header - höher positioniert
      const tableTop = 150;
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

      // Order items - kompaktere Zeilenabstände
      let yPosition = tableTop + 25;
      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;

        doc
          .fontSize(9)
          .fillColor('#333')
          .text(item.name, 50, yPosition, { width: 260 })
          .text(item.quantity.toString(), 320, yPosition, { width: 60, align: 'center' })
          .text(`${item.price.toFixed(2)} EUR`, 380, yPosition, { width: 70, align: 'right' })
          .text(`${itemTotal.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });

        yPosition += 18;
      });

      // Totals section - kompakter
      yPosition += 15;
      doc
        .strokeColor('#ddd')
        .lineWidth(1)
        .moveTo(350, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 12;

      // Subtotal
      doc
        .fontSize(9)
        .fillColor('#666')
        .text('Zwischensumme:', 350, yPosition)
        .text(`${order.subtotal.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });

      yPosition += 15;

      // Shipping
      if (order.shipping > 0) {
        doc
          .text('Versandkosten:', 350, yPosition)
          .text(`${order.shipping.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });
        yPosition += 15;
      }

      // Total
      doc
        .fontSize(11)
        .fillColor('#5A4747')
        .font('Helvetica-Bold')
        .text('Gesamtbetrag:', 350, yPosition)
        .text(`${order.total.toFixed(2)} EUR`, 460, yPosition, { width: 85, align: 'right' });

      // Tax note - kompakter
      yPosition += 25;
      doc
        .fontSize(8)
        .fillColor('#888')
        .font('Helvetica')
        .text('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).', 50, yPosition);

      // Payment info - luftiger mit besseren Abständen
      yPosition += 25;
      doc
        .fontSize(10)
        .fillColor('#5A4747')
        .font('Helvetica-Bold')
        .text('Zahlungsinformationen:', 50, yPosition);

      yPosition += 18;
      doc
        .fontSize(9)
        .fillColor('#333')
        .font('Helvetica');

      if (order.paymentMethod === 'paypal') {
        doc.text('Zahlung erfolgt via PayPal.', 50, yPosition);
      } else if (order.paymentMethod === 'cash_on_pickup') {
        doc
          .text('Barzahlung bei Abholung: Rheinstraße 40, 47495 Rheinberg, Tel: 015565 612722', 50, yPosition);
      } else if (order.paymentMethod === 'invoice' || order.paymentMethod === 'prepayment') {
        const paymentText = order.paymentMethod === 'invoice'
          ? 'Bitte überweisen Sie innerhalb von 14 Tagen:'
          : 'Bitte überweisen Sie vor Versand:';

        // Bankdaten links mit luftigen Abständen
        const paymentInfoStart = yPosition;
        doc
          .text(paymentText, 50, yPosition)
          .fontSize(8)
          .text('Kontoinhaber: Henkes Stoffzauber', 50, yPosition + 18)
          .text('Bank: Sparkasse am Niederrhein', 50, yPosition + 32)
          .text('IBAN: DE21 3545 0000 1201 2022 96', 50, yPosition + 46)
          .text('BIC: WELADED1MOR', 50, yPosition + 60)
          .text(`Verwendungszweck: ${order.orderNumber}`, 50, yPosition + 74);

        // QR-Code rechts auf gleicher Höhe wie "Bitte überweisen..."
        try {
          const qrBuffer = await generatePaymentQR(
            'DE21354500001201202296',
            'WELADED1MOR',
            'Henkes Stoffzauber',
            order.total,
            order.orderNumber
          );
          doc.image(qrBuffer, 380, paymentInfoStart - 5, { width: 110 });
          doc
            .fontSize(7)
            .fillColor('#888')
            .text('Mit Banking-App scannen', 380, paymentInfoStart + 110, { width: 110, align: 'center' });
        } catch (qrError) {
          logger.error('QR Code generation error:', qrError);
        }
      }

      // Footer - direkt unter Zahlungsinfo
      yPosition += 135;
      doc
        .fontSize(8)
        .fillColor('#888')
        .text(
          'Vielen Dank für Ihren Einkauf bei Henkes Stoffzauber!',
          50,
          yPosition,
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

import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { EmailOptions, IOrder } from '../types';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

let transporter = createTransporter();

/**
 * Send generic email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Henkes Stoffzauber" <${env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error('Email sending failed:', error);
    return false;
  }
}

/**
 * Send order confirmation to customer
 */
export async function sendOrderConfirmation(order: IOrder, invoicePath?: string): Promise<boolean> {
  const itemsList = order.items
    .map((item) => `- ${item.name} x ${item.quantity}: ${item.price.toFixed(2)} EUR`)
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #5A4747; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F2B2B4; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #FAF8F5; padding: 20px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .total { font-size: 1.2em; font-weight: bold; color: #5A4747; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vielen Dank für Ihre Bestellung!</h1>
        </div>
        <div class="content">
          <p>Liebe/r ${order.customer.firstName} ${order.customer.lastName},</p>
          <p>wir haben Ihre Bestellung erhalten und werden sie schnellstmöglich bearbeiten.</p>

          <div class="order-details">
            <h3>Bestellnummer: ${order.orderNumber}</h3>
            <p><strong>Artikel:</strong></p>
            <ul>
              ${order.items.map((item) => `<li>${item.name} x ${item.quantity} - ${item.price.toFixed(2)} EUR</li>`).join('')}
            </ul>
            <p class="total">Gesamtsumme: ${order.total.toFixed(2)} EUR</p>
            <p><strong>Zahlungsart:</strong> ${
              order.paymentMethod === 'paypal' ? 'PayPal' :
              order.paymentMethod === 'invoice' ? 'Rechnung' : 'Vorkasse'
            }</p>
          </div>

          <div class="order-details">
            <h3>Lieferadresse:</h3>
            <p>
              ${order.customer.firstName} ${order.customer.lastName}<br>
              ${order.customer.street} ${order.customer.houseNumber}<br>
              ${order.customer.zip} ${order.customer.city}<br>
              ${order.customer.country || 'Deutschland'}
            </p>
          </div>

          ${order.paymentMethod === 'prepayment' ? `
          <div class="order-details">
            <h3>Bankverbindung für Vorkasse:</h3>
            <p>
              <strong>Kontoinhaber:</strong> Henkes Stoffzauber<br>
              <strong>IBAN:</strong> DE12 3456 7890 1234 5678 90<br>
              <strong>BIC:</strong> TESTBIC<br>
              <strong>Verwendungszweck:</strong> ${order.orderNumber}
            </p>
          </div>
          ` : ''}

          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Herzliche Grüße,<br>Ihr Team von Henkes Stoffzauber</p>
        </div>
        <div class="footer">
          <p>Henkes Stoffzauber | info@henkes-stoffzauber.de | www.henkes-stoffzauber.de</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = invoicePath
    ? [{ filename: `Rechnung-${order.orderNumber}.pdf`, path: invoicePath }]
    : undefined;

  return sendEmail({
    to: order.customer.email,
    subject: `Bestellbestätigung #${order.orderNumber} - Henkes Stoffzauber`,
    html,
    text: `
Vielen Dank für Ihre Bestellung!

Bestellnummer: ${order.orderNumber}

Artikel:
${itemsList}

Gesamtsumme: ${order.total.toFixed(2)} EUR
Zahlungsart: ${order.paymentMethod}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Herzliche Grüße,
Ihr Team von Henkes Stoffzauber
    `,
    attachments,
  });
}

/**
 * Send order notification to shop owner
 */
export async function sendOrderNotification(order: IOrder, invoicePath?: string): Promise<boolean> {
  const itemsList = order.items
    .map((item) => `- ${item.name} x ${item.quantity}: ${item.price.toFixed(2)} EUR`)
    .join('\n');

  const html = `
    <h2>Neue Bestellung eingegangen!</h2>
    <p><strong>Bestellnummer:</strong> ${order.orderNumber}</p>
    <p><strong>Kunde:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
    <p><strong>E-Mail:</strong> ${order.customer.email}</p>
    <p><strong>Telefon:</strong> ${order.customer.phone || '-'}</p>

    <h3>Lieferadresse:</h3>
    <p>
      ${order.customer.street} ${order.customer.houseNumber}<br>
      ${order.customer.zip} ${order.customer.city}
    </p>

    <h3>Bestellte Artikel:</h3>
    <ul>
      ${order.items.map((item) => `<li>${item.name} x ${item.quantity} - ${item.price.toFixed(2)} EUR</li>`).join('')}
    </ul>

    <p><strong>Gesamtsumme:</strong> ${order.total.toFixed(2)} EUR</p>
    <p><strong>Zahlungsart:</strong> ${order.paymentMethod}</p>
    <p><strong>Zahlungsstatus:</strong> ${order.paymentStatus}</p>
  `;

  const attachments = invoicePath
    ? [{ filename: `Rechnung-${order.orderNumber}.pdf`, path: invoicePath }]
    : undefined;

  return sendEmail({
    to: env.SHOP_EMAIL,
    subject: `Neue Bestellung #${order.orderNumber}`,
    html,
    text: `
Neue Bestellung eingegangen!

Bestellnummer: ${order.orderNumber}
Kunde: ${order.customer.firstName} ${order.customer.lastName}
E-Mail: ${order.customer.email}

Artikel:
${itemsList}

Gesamtsumme: ${order.total.toFixed(2)} EUR
Zahlungsart: ${order.paymentMethod}
    `,
    attachments,
  });
}

/**
 * Send shipping notification
 */
export async function sendShippingNotification(order: IOrder): Promise<boolean> {
  const html = `
    <h2>Ihre Bestellung wurde versandt!</h2>
    <p>Liebe/r ${order.customer.firstName} ${order.customer.lastName},</p>
    <p>Ihre Bestellung <strong>#${order.orderNumber}</strong> wurde versandt.</p>
    ${order.trackingNumber ? `<p><strong>Sendungsnummer:</strong> ${order.trackingNumber}</p>` : ''}
    <p>Herzliche Grüße,<br>Ihr Team von Henkes Stoffzauber</p>
  `;

  return sendEmail({
    to: order.customer.email,
    subject: `Versandbestätigung #${order.orderNumber} - Henkes Stoffzauber`,
    html,
  });
}

/**
 * Test email connection
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email service connected successfully');
    return true;
  } catch (error) {
    logger.error('Email service connection failed:', error);
    return false;
  }
}

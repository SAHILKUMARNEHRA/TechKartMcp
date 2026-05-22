import PDFDocument from 'pdfkit';
import { prisma } from '../config/database.js';

const RUPEE = 'Rs. ';

function inr(n) {
  return RUPEE + Number(n).toLocaleString('en-IN');
}

export async function generateReceipt(req, res, next) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.sub },
      include: { items: { include: { product: true } }, user: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const addr =
      typeof order.shippingAddr === 'string'
        ? JSON.parse(order.shippingAddr)
        : order.shippingAddr;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="techkart-${order.id.slice(0, 8)}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#1d1d1f').text('TechKart', 50, 50);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#6e6e73')
      .text('Tech, considered.', 50, 80);

    doc
      .fontSize(10)
      .fillColor('#1d1d1f')
      .text(`Receipt #${order.id.slice(0, 8).toUpperCase()}`, 350, 50, {
        align: 'right',
        width: 200,
      })
      .text(
        new Date(order.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        350,
        65,
        { align: 'right', width: 200 }
      )
      .text(`Status: ${order.status}`, 350, 80, { align: 'right', width: 200 })
      .text(`Payment: ${order.paymentMethod}`, 350, 95, { align: 'right', width: 200 });

    doc.moveTo(50, 125).lineTo(545, 125).strokeColor('#d2d2d7').stroke();

    // Customer
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1d1d1f').text('BILL TO', 50, 145);
    doc.font('Helvetica').fillColor('#1d1d1f').text(addr?.fullName || '—', 50, 162);
    if (addr?.street) doc.text(addr.street, 50, 178);
    if (addr?.city)
      doc.text(`${addr.city}, ${addr.state || ''} ${addr.pincode || ''}`, 50, 194);
    if (addr?.phone) doc.text(`Phone: ${addr.phone}`, 50, 210);
    doc.text(`Email: ${order.user.email}`, 50, 226);

    // Table header
    const tableY = 270;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6e6e73');
    doc.text('ITEM', 50, tableY);
    doc.text('QTY', 340, tableY, { width: 40, align: 'right' });
    doc.text('PRICE', 400, tableY, { width: 70, align: 'right' });
    doc.text('TOTAL', 480, tableY, { width: 65, align: 'right' });
    doc.moveTo(50, tableY + 16).lineTo(545, tableY + 16).strokeColor('#e5e5ea').stroke();

    // Rows
    let y = tableY + 28;
    doc.font('Helvetica').fillColor('#1d1d1f').fontSize(10);
    for (const it of order.items) {
      const title = it.product.title;
      const lineTotal = Number(it.price) * it.quantity;
      doc.text(title, 50, y, { width: 280 });
      doc.text(String(it.quantity), 340, y, { width: 40, align: 'right' });
      doc.text(inr(it.price), 400, y, { width: 70, align: 'right' });
      doc.text(inr(lineTotal), 480, y, { width: 65, align: 'right' });
      y += 26;
    }

    // Totals
    y += 8;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e5ea').stroke();
    y += 14;
    const total = Number(order.totalAmount);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d1d1f');
    doc.text('TOTAL', 380, y, { width: 90, align: 'right' });
    doc.text(inr(total), 480, y, { width: 65, align: 'right' });

    // Footer
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#86868b')
      .text('Thank you for shopping with TechKart.', 50, 770, {
        align: 'center',
        width: 495,
      })
      .text('30-day returns  ·  1-year warranty  ·  techkart.example', 50, 784, {
        align: 'center',
        width: 495,
      });

    doc.end();
  } catch (err) {
    next(err);
  }
}

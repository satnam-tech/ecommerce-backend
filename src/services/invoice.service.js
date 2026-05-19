import PDFDocument from "pdfkit";

export const generateInvoicePDF = async (order, res) => {
  // Create PDF
  const doc = new PDFDocument({
    margin: 50,
  });

  // Set headers ONCE
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=invoice-${order._id}.pdf`
  );

  // Pipe PDF to response
  doc.pipe(res);

  // =========================
  // COMPANY INFO
  // =========================

  doc.fontSize(22).text("INVOICE", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(12).text(`Invoice ID: INV-${order._id}`);

  doc.text(`Order ID: ${order._id}`);

  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);

  doc.moveDown();

  // =========================
  // CUSTOMER DETAILS
  // =========================

  doc.fontSize(16).text("Customer Details");

  doc.moveDown(0.5);

  doc.fontSize(12).text(`Name: ${order.owner?.fullName || "Customer"}`);

  doc.text(`Phone: ${order.owner?.phone || ""}`);

  doc.moveDown();

  // =========================
  // SHIPPING ADDRESS
  // =========================

  doc.fontSize(16).text("Shipping Address");

  doc.moveDown(0.5);

  const address = order.addressSnapshot;

  doc.fontSize(12);

  doc.text(address.fullName);

  doc.text(address.addressLine1);
  doc.text(address.addressLine2 || "");

  doc.text(`${address.city}, ${address.state}`);

  doc.text(`${address.country} - ${address.pincode}`);

  doc.text(`Phone: ${address.phone}`);

  doc.moveDown();

  // =========================
  // PRODUCTS
  // =========================

  doc.fontSize(16).text("Products");

  doc.moveDown();

  order.orderItems.forEach((item, index) => {
    doc.fontSize(12);

    doc.text(`${index + 1}. ${item.product?.name || "Product"}`);

    doc.text(`Qty: ${item.quantity}`);

    doc.text(`Price: ₹${item.priceAtPurchase || item.product?.price || 0}`);

    doc.text(`Total: ₹${item.quantity * (item.priceAtPurchase || item.product?.price || 0)}`);

    doc.moveDown();
  });

  // =========================
  // TOTALS
  // =========================

  doc.moveDown();

  doc.fontSize(16).text("Payment Summary");

  doc.moveDown(0.5);

  doc.fontSize(12).text(`Subtotal: ₹${order.subTotal}`);

  doc.text(`Discount: ₹${order.discountAmount || 0}`);

  doc.text(`Tax: ₹${order.taxAmount || 0}`);

  doc.text(`Shipping: ₹${order.shippingCharges || 0}`);

  doc.moveDown(0.5);

  doc.fontSize(14).text(`Grand Total: ₹${order.orderPrice}`);

  doc.moveDown();

  // =========================
  // PAYMENT INFO
  // =========================

  doc.fontSize(16).text("Payment Details");

  doc.moveDown(0.5);

  doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);

  doc.text(`Payment Status: ${order.paymentStatus}`);

  doc.text(`Order Status: ${order.orderStatus}`);

  doc.moveDown(2);

  // Footer
  doc.fontSize(12).text("Thank you for shopping with us!", {
    align: "center",
  });

  // Finalize PDF
  doc.end();
};

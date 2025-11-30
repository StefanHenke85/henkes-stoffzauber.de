import mongoose, { Document, Schema } from 'mongoose';
import { IOrder, ICustomer, IOrderItem } from '../types';

export interface OrderDocument extends Omit<IOrder, '_id'>, Document {}

const customerSchema = new Schema<ICustomer>(
  {
    firstName: {
      type: String,
      required: [true, 'Vorname ist erforderlich'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Nachname ist erforderlich'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Straße ist erforderlich'],
      trim: true,
    },
    houseNumber: {
      type: String,
      required: [true, 'Hausnummer ist erforderlich'],
      trim: true,
    },
    zip: {
      type: String,
      required: [true, 'Postleitzahl ist erforderlich'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Stadt ist erforderlich'],
      trim: true,
    },
    country: {
      type: String,
      default: 'Deutschland',
      trim: true,
    },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    imageUrl: {
      type: String,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Mindestens ein Artikel ist erforderlich',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['paypal', 'invoice', 'prepayment'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'new',
    },
    paypalOrderId: {
      type: String,
    },
    invoicePath: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        ret._id = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before save
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `HS-${year}${month}${day}-${random}`;
  }
  next();
});

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);

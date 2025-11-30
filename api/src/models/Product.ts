import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from '../types';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Produktname ist erforderlich'],
      trim: true,
      maxlength: [200, 'Name darf maximal 200 Zeichen haben'],
    },
    description: {
      type: String,
      required: [true, 'Beschreibung ist erforderlich'],
      trim: true,
      maxlength: [2000, 'Beschreibung darf maximal 2000 Zeichen haben'],
    },
    price: {
      type: Number,
      required: [true, 'Preis ist erforderlich'],
      min: [0, 'Preis kann nicht negativ sein'],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Bestand kann nicht negativ sein'],
      default: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageUrlWebp: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    fabrics: {
      type: String,
      trim: true,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for availability
productSchema.virtual('isAvailable').get(function () {
  return this.stock > 0 && this.isActive;
});

export const Product = mongoose.model<ProductDocument>('Product', productSchema);

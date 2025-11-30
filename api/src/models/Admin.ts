import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IAdmin } from '../types';

export interface AdminDocument extends Omit<IAdmin, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<AdminDocument>(
  {
    username: {
      type: String,
      required: [true, 'Benutzername ist erforderlich'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Benutzername muss mindestens 3 Zeichen haben'],
      maxlength: [30, 'Benutzername darf maximal 30 Zeichen haben'],
    },
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
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
        ret.passwordHash = undefined;
        return ret;
      },
    },
  }
);

// Index for faster lookups
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch {
    return false;
  }
};

// Static method to create initial admin
adminSchema.statics.createInitialAdmin = async function (
  username: string,
  email: string,
  password: string
) {
  const existingAdmin = await this.findOne({ $or: [{ username }, { email }] });
  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = new this({
    username,
    email,
    passwordHash: password,
    role: 'superadmin',
    isActive: true,
  });

  await admin.save();
  return admin;
};

export const Admin = mongoose.model<AdminDocument>('Admin', adminSchema);

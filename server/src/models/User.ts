import { Schema, model, Document } from 'mongoose';

export interface IOtpToken {
  codeHash: string | null;
  expiresAt: Date | null;
  attempts: number;
  lastSentAt: Date | null;
}

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  googleId?: string;
  isVerified: boolean;
  verificationOtp: IOtpToken;
  passwordResetOtp: IOtpToken;
  isDeactivated: boolean;
  deactivatedAt: Date | null;
  deletionScheduledAt: Date | null;
  dormantCycles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtpToken>(
  {
    codeHash: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: function (this: any) {
        return this.authProvider === 'LOCAL';
      },
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE'],
      default: 'LOCAL',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOtp: {
      type: otpSchema,
      default: () => ({
        codeHash: null,
        expiresAt: null,
        attempts: 0,
        lastSentAt: null,
      }),
    },
    passwordResetOtp: {
      type: otpSchema,
      default: () => ({
        codeHash: null,
        expiresAt: null,
        attempts: 0,
        lastSentAt: null,
      }),
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    deletionScheduledAt: {
      type: Date,
      default: null,
    },
    dormantCycles: {
      type: [String],
      default: [],
    },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

// Auto-set isVerified to true if authProvider is GOOGLE
userSchema.pre('save', function (this: IUser) {
  if (this.authProvider === 'GOOGLE') {
    this.isVerified = true;
  }
});

export const User = model<IUser>('User', userSchema);

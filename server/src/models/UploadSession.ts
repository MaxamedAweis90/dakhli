import { Schema, model, Document, Types } from 'mongoose';

export type UploadSessionStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';

export interface IUploadSession extends Document {
  sessionId: string;
  userId?: Types.ObjectId;
  status: UploadSessionStatus;
  imageUrl?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSessionSchema = new Schema<IUploadSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'EXPIRED'],
      default: 'PENDING',
    },
    imageUrl: {
      type: String,
      default: undefined,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL deletion
    },
  },
  {
    collection: 'upload_sessions',
    timestamps: true,
  }
);

export const UploadSession = model<IUploadSession>(
  'UploadSession',
  uploadSessionSchema
);


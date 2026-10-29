import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { IItem, Item, ItemTier } from '../models';
import {
  getRegistrySummary,
  markItemBought,
  markItemUnbought,
} from '../services/itemService';

const normalizeDbTier = (raw?: string): ItemTier => {
  const lower = (raw || '').toLowerCase().trim();
  if (lower.startsWith('essential')) return 'essential';
  if (lower.startsWith('future')) return 'future_need';
  return 'want';
};

const toContractTier = (raw?: string): 'essentials' | 'future_needs' | 'wants' => {
  const lower = (raw || '').toLowerCase().trim();
  if (lower.startsWith('essential')) return 'essentials';
  if (lower.startsWith('future')) return 'future_needs';
  return 'wants';
};

const toDisplayTier = (raw?: string): 'Essentials' | 'Future Needs' | 'Wants' => {
  const contract = toContractTier(raw);
  if (contract === 'essentials') return 'Essentials';
  if (contract === 'future_needs') return 'Future Needs';
  return 'Wants';
};

const formatItem = (item: IItem) => {
  const contractTier = toContractTier(item.tier);
  const displayTier = toDisplayTier(item.tier);
  const status =
    item.status === 'bought'
      ? 'bought'
      : item.status === 'removed' || item.status === 'cancelled'
      ? 'cancelled'
      : 'planned';

  return {
    id: item._id.toString(),
    _id: item._id.toString(),
    userId: item.userId.toString(),
    title: item.name,
    name: item.name,
    targetPrice: Number(item.estimatedPrice ?? 0),
    estimatedPrice: Number(item.estimatedPrice ?? 0),
    price: Number(item.estimatedPrice ?? 0),
    tier: contractTier,
    displayTier,
    status,
    imageUrl: item.imageUrl,
    iconKey: item.iconKey,
    notes: item.notes,
    tag: item.tag || (item.inSavePlan ? 'In Save Plan' : displayTier),
    targetProgress: item.targetProgress,
    inSavePlan: Boolean(item.inSavePlan),
    savePlanId: item.savePlanId ? item.savePlanId.toString() : null,
    boughtAt: item.boughtAt ? item.boughtAt.toISOString() : null,
    createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const listItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { tier, status } = req.query;

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (tier && typeof tier === 'string' && tier.toLowerCase() !== 'all') {
      const dbTier = normalizeDbTier(tier);
      const contractTier = toContractTier(tier);
      query.tier = { $in: [dbTier, contractTier] };
    }

    if (status) {
      query.status = status;
    } else {
      // By default, exclude soft-removed / cancelled items
      query.status = { $nin: ['removed', 'cancelled'] };
    }

    const items = await Item.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items.map(formatItem),
    });
  } catch (error) {
    next(error);
  }
};

export const getItemSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const summary = await getRegistrySummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      title,
      name,
      targetPrice,
      estimatedPrice,
      price,
      tier,
      imageUrl,
      iconKey,
      notes,
      tag,
      targetProgress,
    } = req.body;

    const finalName = title || name;
    const finalPrice =
      targetPrice !== undefined
        ? Number(targetPrice)
        : estimatedPrice !== undefined
        ? Number(estimatedPrice)
        : price !== undefined
        ? Number(price)
        : undefined;

    if (!finalName || finalPrice === undefined || !tier) {
      res.status(400).json({
        success: false,
        error: { message: 'title (or name), targetPrice (or estimatedPrice), and tier are required fields.' },
      });
      return;
    }

    const dbTier = normalizeDbTier(tier);
    const hasProgress = typeof targetProgress === 'number' && targetProgress > 0;

    const item = new Item({
      userId: new Types.ObjectId(userId),
      name: finalName.trim(),
      estimatedPrice: finalPrice,
      tier: dbTier,
      status: 'planned',
      imageUrl,
      iconKey,
      notes,
      tag,
      targetProgress: hasProgress ? Number(targetProgress) : undefined,
      inSavePlan: hasProgress,
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: formatItem(item),
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const {
      title,
      name,
      targetPrice,
      estimatedPrice,
      price,
      tier,
      status,
      imageUrl,
      iconKey,
      notes,
      tag,
      targetProgress,
    } = req.body;

    if (status === 'bought') {
      const bought = await markItemBought(userId, id);
      res.status(200).json({
        success: true,
        data: formatItem(bought),
      });
      return;
    }

    if (status === 'planned' || status === 'unbought') {
      const existing = await Item.findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      });
      if (existing && existing.status === 'bought') {
        const unbought = await markItemUnbought(userId, id);
        res.status(200).json({
          success: true,
          data: formatItem(unbought),
        });
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (title || name) updates.name = (title || name).trim();
    const finalPrice =
      targetPrice !== undefined
        ? Number(targetPrice)
        : estimatedPrice !== undefined
        ? Number(estimatedPrice)
        : price !== undefined
        ? Number(price)
        : undefined;
    if (finalPrice !== undefined) updates.estimatedPrice = finalPrice;
    if (tier) updates.tier = normalizeDbTier(tier);
    if (status === 'cancelled' || status === 'removed') updates.status = 'removed';
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (iconKey !== undefined) updates.iconKey = iconKey;
    if (notes !== undefined) updates.notes = notes;
    if (tag !== undefined) updates.tag = tag;
    if (targetProgress !== undefined) updates.targetProgress = targetProgress;

    const item = await Item.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!item) {
      res.status(404).json({
        success: false,
        error: { message: 'Registry item not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatItem(item),
    });
  } catch (error) {
    next(error);
  }
};

export const buyItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const item = await markItemBought(userId, id);

    res.status(200).json({
      success: true,
      data: formatItem(item),
    });
  } catch (error) {
    next(error);
  }
};

export const unbuyItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const item = await markItemUnbought(userId, id);

    res.status(200).json({
      success: true,
      data: formatItem(item),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const item = await Item.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { status: 'removed' } },
      { new: true }
    );

    if (!item) {
      res.status(404).json({
        success: false,
        error: { message: 'Registry item not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Item marked as removed.', item: formatItem(item) },
    });
  } catch (error) {
    next(error);
  }
};

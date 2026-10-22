import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Item, ItemTier } from '../models';
import { getRegistrySummary, markItemBought } from '../services/itemService';

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

    if (tier) {
      query.tier = tier;
    }

    if (status) {
      query.status = status;
    } else {
      // By default, exclude soft-removed items
      query.status = { $ne: 'removed' };
    }

    const items = await Item.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items,
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
    const { name, estimatedPrice, tier } = req.body;

    if (!name || estimatedPrice === undefined || !tier) {
      res.status(400).json({
        success: false,
        error: { message: 'name, estimatedPrice, and tier are required fields.' },
      });
      return;
    }

    const item = new Item({
      userId: new Types.ObjectId(userId),
      name: name.trim(),
      estimatedPrice,
      tier: tier as ItemTier,
      status: 'planned',
      inSavePlan: false,
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: item,
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
    const { name, estimatedPrice, tier } = req.body;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name.trim();
    if (estimatedPrice !== undefined) updates.estimatedPrice = estimatedPrice;
    if (tier) updates.tier = tier;

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
      data: item,
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
      data: item,
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
      data: { message: 'Item marked as removed.', item },
    });
  } catch (error) {
    next(error);
  }
};

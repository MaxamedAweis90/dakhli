import { Router } from 'express';
import {
  buyItem,
  createItem,
  deleteItem,
  getItemSummary,
  listItems,
  reorderItems,
  unbuyItem,
  updateItem,
} from '../controllers/itemController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  createItemSchema,
  itemIdParamSchema,
  reorderItemsSchema,
  updateItemSchema,
} from '../schemas/itemSchemas';

const router = Router();

router.use(authenticate);

router.get('/', listItems);
router.get('/summary', getItemSummary);
router.post('/', validateRequest({ body: createItemSchema }), createItem);
router.patch('/reorder', validateRequest({ body: reorderItemsSchema }), reorderItems);
router.patch('/:id', validateRequest({ params: itemIdParamSchema, body: updateItemSchema }), updateItem);
router.patch('/:id/buy', validateRequest({ params: itemIdParamSchema }), buyItem);
router.post('/:id/buy', validateRequest({ params: itemIdParamSchema }), buyItem);
router.patch('/:id/unbuy', validateRequest({ params: itemIdParamSchema }), unbuyItem);
router.post('/:id/unbuy', validateRequest({ params: itemIdParamSchema }), unbuyItem);
router.delete('/:id', validateRequest({ params: itemIdParamSchema }), deleteItem);

export default router;

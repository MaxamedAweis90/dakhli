import { Router } from 'express';
import {
  buyItem,
  createItem,
  deleteItem,
  getItemSummary,
  listItems,
  unbuyItem,
  updateItem,
} from '../controllers/itemController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listItems);
router.get('/summary', getItemSummary);
router.post('/', createItem);
router.patch('/:id', updateItem);
router.patch('/:id/buy', buyItem);
router.post('/:id/buy', buyItem);
router.patch('/:id/unbuy', unbuyItem);
router.post('/:id/unbuy', unbuyItem);
router.delete('/:id', deleteItem);

export default router;

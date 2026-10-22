import { Router } from 'express';
import {
  buyItem,
  createItem,
  deleteItem,
  getItemSummary,
  listItems,
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
router.delete('/:id', deleteItem);

export default router;

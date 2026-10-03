import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import {
  getItems,
  searchItems,
  getItemById,
  createItem,
  updateItem,
  toggleItemActive,
} from '../controllers/itemController';

const router = Router();

router.use(authenticate);

router.get('/', getItems);
router.get('/search', searchItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.put('/:id', updateItem);
router.patch('/:id/toggle-active', roleGuard('owner'), toggleItemActive);

export default router;

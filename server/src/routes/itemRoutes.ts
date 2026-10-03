import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  getItems,
  searchItems,
  getItemById,
  createItem,
  updateItem,
  toggleItemActive,
} from '../controllers/itemController.js';

const router = Router();

router.use(authenticate);

router.get('/', getItems);
router.get('/search', searchItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.put('/:id', updateItem);
router.patch('/:id/toggle-active', roleGuard('owner'), toggleItemActive);

export default router;

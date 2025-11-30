import { Router } from 'express';
import productsRouter from './products';
import ordersRouter from './orders';
import authRouter from './auth';
import fabricsRouter from './fabrics';

const router = Router();

// Mount routes
router.use('/products', productsRouter);
router.use('/checkout', ordersRouter);
router.use('/orders', ordersRouter);
router.use('/auth', authRouter);
router.use('/fabrics', fabricsRouter);

// Legacy route support (for backwards compatibility)
router.use('/admin', authRouter);

export default router;

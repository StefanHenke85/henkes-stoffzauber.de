import { Router } from 'express';
import productsRouter from './products';
import ordersRouter from './orders';
import authRouter from './auth';
import fabricsRouter from './fabrics';
import vouchersRouter from './vouchers';
import patternsRouter from './patterns';

const router = Router();

// Mount routes
router.use('/products', productsRouter);
router.use('/checkout', ordersRouter);
router.use('/orders', ordersRouter);
router.use('/auth', authRouter);
router.use('/fabrics', fabricsRouter);
router.use('/vouchers', vouchersRouter);
router.use('/patterns', patternsRouter);

// Legacy route support (for backwards compatibility)
router.use('/admin', authRouter);

export default router;

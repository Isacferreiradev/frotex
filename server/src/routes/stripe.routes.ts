import { Router } from 'express';
import * as stripeCtrl from '../controllers/stripe.controller';
import { authenticate } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Webhook requires raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), stripeCtrl.stripeWebhook);

// Protected routes
router.post('/checkout', authenticate, stripeCtrl.createCheckout);

export default router;

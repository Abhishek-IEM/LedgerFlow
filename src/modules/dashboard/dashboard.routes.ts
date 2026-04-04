// Dashboard routes — analytics endpoints for ANALYST and ADMIN roles.

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as ctrl from "./dashboard.controller";

const router = Router();

// all dashboard endpoints require ANALYST or ADMIN access
router.use(authMiddleware, requireRole("ANALYST", "ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated analytics endpoints (ANALYST and ADMIN)
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get total income, expenses, and net balance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary object with totalIncome, totalExpenses, netBalance, totalRecords
 *       403:
 *         description: Not authorized
 */
router.get("/summary", ctrl.getSummary);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get income and expense totals grouped by category
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of category breakdowns
 */
router.get("/categories", ctrl.getCategories);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly or weekly income/expense trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Array of trend data by period
 */
router.get("/trends", ctrl.getTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get the 10 most recent financial records
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of recent records
 */
router.get("/recent", ctrl.getRecent);

export default router;

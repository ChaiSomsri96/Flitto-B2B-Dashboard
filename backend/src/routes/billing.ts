import { checkAuth } from './../middlewares/checkAuth';
import BillingController from './../controllers/billing-controller';
import { Router } from 'express';
import { checkRole } from './../middlewares/checkRole';

const router = Router();
router.post("/get-billing-data", [checkAuth, checkRole(["requester", "tc"])], BillingController.getBillingData);
router.post("/get-worker-billing-data", [checkAuth, checkRole(["translator", "reviewer"])], BillingController.getWorkerBillingData);
router.post("/get-company-billing-data", [checkAuth, checkRole(["company", "manager"])], BillingController.getCompanyBillingData);
router.post('/get-admin-billing-data', [checkAuth, checkRole(["admin"])], BillingController.getAdminBillingData);
export default router;
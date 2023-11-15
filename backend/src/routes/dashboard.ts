import DashboardController from './../controllers/dashboard-controller';
import { checkAuth } from './../middlewares/checkAuth';
import { Router } from 'express';
import { checkRole } from './../middlewares/checkRole';
const router = Router();

//번역 현황
router.post('/get-request-status', [checkAuth], DashboardController.getRequestStatus);
//정산 현황
router.post('/get-billing-status', [checkAuth, checkRole(["admin", "requester", "company", "manager"])], DashboardController.getBillingStatus);
router.post('/get-worker-billing-status', [checkAuth, checkRole(["tc", "translator", "reviewer"])], DashboardController.getWorkerBillingStatus)
//
router.post('/get-request-list', [checkAuth, checkRole(["requester", "tc", "translator", "reviewer"])], DashboardController.getRequestList)
//
router.post('/get-top-ranking', [checkAuth, checkRole(["company", "manager"])], DashboardController.getTopRanking)
router.post('/get-top-ranking-admin', [checkAuth, checkRole(["admin"])], DashboardController.getTopRankingAdmin)
//그라프~신규요청 현황
router.post('/get-new-request-status', [checkAuth, checkRole(["company", "admin", "manager"])], DashboardController.getNewRequestStatus)
//user 현황
router.post('/get-user-status1', [checkAuth, checkRole(["company", "admin"])], DashboardController.getUserStatus)
//user 템프현황
router.post('/get-user-status', [checkAuth, checkRole(["company", "admin" , "manager"])], DashboardController.getUserStatus1)
export default router;

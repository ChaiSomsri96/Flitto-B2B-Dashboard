import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkAuth } from '../middlewares/checkAuth';
import SubtitleHistoryController from '../controllers/subtitle-history-controller';

const router = Router();

router.post('/get-request-list', [checkAuth, checkRole(["requester", "company", "manager"])], SubtitleHistoryController.getRequestList);
router.post('/get-admin-request-list', [checkAuth, checkRole(["admin"])], SubtitleHistoryController.getAdminRequestList);

export default router;
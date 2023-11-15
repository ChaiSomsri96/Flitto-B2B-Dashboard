import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth";
import { checkRole } from './../middlewares/checkRole';
import NoticeController from './../controllers/notice-controller';

const router = Router();

router.post("/get-notice-list", [checkAuth, checkRole(["requester", "company", "tc", "translator", "reviewer", "admin", "manager"])], NoticeController.getNoticeList)
router.post("/get-notice-count", [checkAuth, checkRole(["admin", "company", "requester", "tc", "translator", "reviewer", "manager"])], NoticeController.getNoticeCount)
router.post("/update-notice-unread", [checkAuth], NoticeController.updateNoticeUnRead)

export default router;

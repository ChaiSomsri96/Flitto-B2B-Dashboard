import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkAuth } from '../middlewares/checkAuth';
import { requestTranslateValidation } from '../middlewares/validation';
import SubtitleTranslationController from '../controllers/subtitle-translation-controller';
import multer from "multer";
import path from "path";
import config from '../config/config';
const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_TRANSLATE_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-translate-' + Date.now() + path.extname(file.originalname));
    }
});
let upload = multer({ storage: storage });
const router = Router();
//자막 번역 요청
router.post('/request-translate', [checkAuth, checkRole(["requester", "company", "admin", "manager"]),
                                    upload.single('file'), requestTranslateValidation], SubtitleTranslationController.requestTranslate);
//자막 번역 상세 (요청자)
router.post('/detail', [checkAuth, checkRole(["requester", "company", "admin", "manager"])], SubtitleTranslationController.detail);
export default router;
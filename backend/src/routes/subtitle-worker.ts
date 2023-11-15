import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkAuth } from '../middlewares/checkAuth';
import SubtitleWorkerController from '../controllers/subtitle-worker-controller';
import SubtitleTcController from '../controllers/subtitle-tc-controller';
import multer from "multer";
import path from "path";
import config from '../config/config';

const tc_storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_TRANSLATE_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-tc-work-' + Date.now() + path.extname(file.originalname));
    }
});

const worker_storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_TRANSLATE_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-wr-' + Date.now() + path.extname(file.originalname));
    }
})

const repace_subtitle_storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, config.LOCATION_TRANSLATE_PATH);
    },
    filename: function (_req, file, cb) {
        cb(null, file.fieldname + '-ars-' + Date.now() + path.extname(file.originalname));
    }
})

let tc_upload = multer({ storage: tc_storage, limits: { fieldSize: 250 * 1024 * 1024 } });
let worker_upload = multer({ storage: worker_storage, limits: { fieldSize: 250 * 1024 * 1024 } });
let replace_upload = multer({ storage: repace_subtitle_storage, limits: { fieldSize: 250 * 1024 * 1024 } });
// let worker_upload = multer({ storage: worker_storage });
const router = Router();
//자막번역 (TC작업자 리스트)
router.post('/get-tc-request-list', [checkAuth, checkRole(["tc"])], SubtitleTcController.getTcRequestList);
//작업자 할당 (번역가 , 검수자)
router.post('/assign-work', [checkAuth, checkRole(["admin", "tc", "translator", "reviewer"])], SubtitleWorkerController.assignWork);
router.post('/tc-assign-work', [checkAuth, checkRole(["admin", "tc"])], SubtitleTcController.tcAssignWork);
//자막번역 (번역가 , 검수자)
router.post('/get-worker-request-list', [checkAuth, checkRole(["tc", "translator", "reviewer"])], SubtitleWorkerController.getWorkerRequestList);
//자막번역상세
router.post('/detail', [checkAuth, checkRole(["tc", "translator", "reviewer"])], SubtitleWorkerController.detail);
router.post('/detail-check', [checkAuth, checkRole(["tc", "translator", "reviewer"])], SubtitleWorkerController.detailCheck);
//tc 작업자 자막번역 상세
router.post('/tc-detail', [checkAuth, checkRole(["tc"])], SubtitleTcController.tcDetail);
router.post('/tc-detail-check', [checkAuth, checkRole(["tc"])], SubtitleTcController.tcDetailCheck);
//tc 작업자
router.post('/tc-complete-work', [checkAuth, checkRole(["tc"]),
                                    tc_upload.single('file')], SubtitleTcController.tcCompleteWork);
//번역가 , 검수자
router.post('/complete-work', [checkAuth, checkRole(["translator", "reviewer"]), worker_upload.single('file')], SubtitleWorkerController.completeWork);

//작업자 가격 설정 
router.post('/set-price', [checkAuth, checkRole(["admin"])], SubtitleWorkerController.setPrice);
//작업자 마감시간 설정
router.post('/set-end-time', [checkAuth, checkRole(["admin"])], SubtitleWorkerController.setEndTime);

//자막 파일 변경
router.post('/change-video', [checkAuth, checkRole(["admin"]), replace_upload.single('file')], SubtitleWorkerController.changeVideo);

//관리자가 Push 전송
router.post('/push-notice', [checkAuth, checkRole(["admin"])], SubtitleWorkerController.pushNotice);

export default router;

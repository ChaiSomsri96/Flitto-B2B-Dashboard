import { checkDuplicateId } from './../middlewares/checkDuplicateId';
import { Router } from 'express';
import { checkRole } from './../middlewares/checkRole';
import { checkAuth } from './../middlewares/checkAuth';
import { getWorkerListValidation, registerRequesterValidation } from './../middlewares/validation';
import RequesterController from '../controllers/requester-controller';
import config from './../config/config';
import multer from "multer";
import path from "path";
import imageFilter from "./../helpers/helpers";

const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-requester-' + Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({ storage: storage, fileFilter: imageFilter });
const router = Router();

router.post("/register-requester", [checkAuth,
    checkRole(["admin", "company", "manager"]),
    upload.single('file'),
    checkDuplicateId("requester"),
    registerRequesterValidation], RequesterController.registerRequester);
router.post('/get-requester-list', [checkAuth, checkRole(["admin", "company", "manager"]), getWorkerListValidation], RequesterController.getRequesterList);
router.post('/delete-requester', [checkAuth, checkRole(["admin"])], RequesterController.deleteRequester);
router.post('/detail', [checkAuth, checkRole(["admin", "company", "manager"])], RequesterController.detail);
router.post('/check-valid-youtube-url', [checkAuth], RequesterController.checkValidYoutubeUrl);
//자막 번역 요청시 이용 요청자 정보
router.post('/get-requester-info', [checkAuth, checkRole(["requester", "company", "admin", "manager"])], RequesterController.getRequesterInfo);

router.post('/get-auth-code', [checkAuth, checkRole(["requester"])], RequesterController.getAuthCode);
router.post('/revoke-token', [checkAuth, checkRole(["requester"])], RequesterController.revokeToken);

router.post('/youtube-apply', [checkAuth, checkRole(["requester", "company", "admin"])], RequesterController.youtubeApply);

router.post('/create-requester', RequesterController.createRequester);

router.post('/update-requester-accept', [checkAuth, checkRole(["requester"])], RequesterController.updateRequesterAccept);


router.post('/payment', RequesterController.payment);

export default router;





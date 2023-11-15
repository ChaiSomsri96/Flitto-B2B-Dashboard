import { updateMyInfoValidation } from './../middlewares/validation';
import { Router } from "express";
import BasicController from "../controllers/basic-controller";
import { checkAuth } from "../middlewares/checkAuth";
import { checkRole } from './../middlewares/checkRole';
import config from './../config/config';
import global from './../config/global';
import multer from "multer";
import path from "path";
import imageFilter from "./../helpers/helpers";

const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-' + global.ROLE[_req.decodedUser.user_type-1] + '-' + Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({ storage: storage, fileFilter: imageFilter });

const router = Router();
//작업언어
router.post("/get-working-languages", [checkAuth], BasicController.getWorkingLanguages);
//비번 변경
router.post("/change-password", [checkAuth], BasicController.changePassword);
//아이디 증복확인
router.post("/duplicate-id-check", [checkAuth], BasicController.duplicateIdCheck);
//나의 정보
router.post("/get-my-info", [checkAuth], BasicController.getMyInfo);
//나의 정보 수정
router.post("/update-my-info", [checkAuth, upload.fields([{name: 'file', maxCount: 1}, {name: 'logo', maxCount: 1}]), updateMyInfoValidation], BasicController.updateMyInfo);
//태그목록에 의한 대상 작업자 count
router.post("/get-worker-count-by-tags", [checkAuth, checkRole(["admin"])], BasicController.getWorkerCountByTags);
//파일 다운로드
router.get("/file-download" , BasicController.fileDownload);
//test - temp
router.post("/youtube-apply", BasicController.youtubeApply);
//table property setting
router.post("/set-table-property", [checkAuth], BasicController.setTableProperty);
router.post("/set-table-width", [checkAuth], BasicController.setTableWidth);
router.post("/get-table-info", [checkAuth], BasicController.getTableInfo);
export default router;

import { checkDuplicateId } from './../middlewares/checkDuplicateId';
import { Router } from "express";
import CompanyController from "../controllers/company-controller";
import { checkAuth } from "./../middlewares/checkAuth";
import { checkRole } from './../middlewares/checkRole';
import { registerCompanyValidation } from './../middlewares/validation';
import config from './../config/config';
import multer from "multer";
import path from "path";
import imageFilter from "./../helpers/helpers";

const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-company-' + Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({ storage: storage, fileFilter: imageFilter });

const router = Router();
router.post("/register-company", [checkAuth,
  checkRole(["admin"]), upload.fields([{
    name: 'file', maxCount: 1
  }, {
    name: 'logo', maxCount: 1
  }]), checkDuplicateId("company"), registerCompanyValidation], CompanyController.registerCompany);

router.post('/get-company-list', [checkAuth, checkRole(["admin"])], CompanyController.getCompanyList);
router.post('/get-language-pairs', [checkAuth, checkRole(["admin", "company", "requester", "manager"])], CompanyController.getLanguagePairs);
router.post("/delete-company", [checkAuth, checkRole(["admin"])], CompanyController.deleteCompany);
router.post("/detail", [checkAuth, checkRole(["admin"])], CompanyController.detail);
//자막 번역 요청시 이용 요청자 정보
router.post('/get-company-info', [checkAuth, checkRole(["requester", "company", "admin", "manager"])], CompanyController.getCompanyInfo);
export default router;
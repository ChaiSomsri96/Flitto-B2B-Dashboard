import { checkDuplicateId } from './../middlewares/checkDuplicateId';
import { Router } from "express";
import { checkRole } from './../middlewares/checkRole';
import { checkAuth } from './../middlewares/checkAuth';
import { registerAdminValidation, getWorkerListValidation } from './../middlewares/validation';
import AdminController from './../controllers/admin-controller';
import config from './../config/config';
import multer from "multer";
import path from "path";
import imageFilter from "./../helpers/helpers";

const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-worker-' + Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({ storage: storage, fileFilter: imageFilter });

const router = Router();
router.post('/register-admin', [checkAuth,
checkRole(["admin"]), upload.single('file'),
checkDuplicateId("admin"),
registerAdminValidation], AdminController.registerAdmin);
router.post('/detail', [checkAuth, checkRole(["admin"])], AdminController.detail)
router.post('/get-admin-list', [checkAuth, checkRole(["admin"]), getWorkerListValidation], AdminController.getAdminList)
router.post('/delete-admin', [checkAuth, checkRole(["admin"])], AdminController.deleteAdmin)
export default router;
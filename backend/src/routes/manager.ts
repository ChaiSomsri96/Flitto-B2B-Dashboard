import { Router } from "express";
import { checkAuth } from "./../middlewares/checkAuth";
import { checkRole } from "./../middlewares/checkRole";
import config from './../config/config';
import { getWorkerListValidation, registerManagerValidation } from './../middlewares/validation';
import { checkDuplicateId } from './../middlewares/checkDuplicateId';
import ManagerController from './../controllers/manager-controller';
import multer from "multer";
import path from "path";
import imageFilter from "./../helpers/helpers";

const storage = multer.diskStorage({
  destination: function(_req, _file, cb) {
      cb(null, config.LOCATION_PATH);
  },
  filename: function(_req, file, cb) {
      cb(null, file.fieldname + '-manager-' + Date.now() + path.extname(file.originalname));
  }
});
let upload = multer({ storage: storage, fileFilter: imageFilter });
const router = Router();
router.post('/register-manager', [checkAuth,
  checkRole(["admin", "company"]),
  upload.single('file'),
  checkDuplicateId("manager"),
  registerManagerValidation], ManagerController.registerManager)

router.post('/get-manager-list', [checkAuth, checkRole(["admin", "company"]), getWorkerListValidation], ManagerController.getManagerList);

router.post('/delete-manager', [checkAuth, checkRole(["admin"])], ManagerController.deleteManager);

router.post('/detail', [checkAuth, checkRole(["admin", "company"])], ManagerController.detail);

export default router;


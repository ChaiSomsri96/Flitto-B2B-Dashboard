import { checkDuplicateId } from './../middlewares/checkDuplicateId';
import { registerWorkValidation, getWorkerListValidation } from './../middlewares/validation';
import { Router } from "express";
import WorkerController from "../controllers/worker-controller";
import { checkAuth } from "./../middlewares/checkAuth";
import { checkRole } from './../middlewares/checkRole';
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
router.post("/register-worker", [checkAuth,
    checkRole(["admin"]), upload.single('file'),
    checkDuplicateId("worker"),
    registerWorkValidation], WorkerController.registerWorker);
router.post("/get-tags", [checkAuth, checkRole(["admin"])], WorkerController.getTags);
router.post("/get-worker-list", [checkAuth, checkRole(["admin"]), getWorkerListValidation], WorkerController.getWorkerList);
router.post("/delete-worker", [checkAuth, checkRole(["admin"])], WorkerController.deleteWorker);
router.post("/detail", [checkAuth, checkRole(["admin"])], WorkerController.detail);
router.post("/get-worker-language", [checkAuth, checkRole(["tc", "translator", "reviewer"])], WorkerController.getWorkerLanguage);
export default router;
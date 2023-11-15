import InquiryController from './../controllers/inquiry-controller';
import { checkAuth } from './../middlewares/checkAuth';
import { registerInquiryValidation } from './../middlewares/validation';
import { Router } from 'express';
import multer from "multer";
import path from "path";
import config from './../config/config';
const router = Router();

const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, config.LOCATION_INQUIRY_PATH);
    },
    filename: function(_req, file, cb) {
        cb(null, file.fieldname + '-inquiry-' + Date.now() + path.extname(file.originalname));
    }
});

const file_storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, config.LOCATION_INQUIRY_PATH);
    },
    filename: function (_req, file, cb) {
        cb(null, file.fieldname + '-inquiry-file-' + Date.now() + path.extname(file.originalname));
    }
})

let upload = multer({
    storage: storage,
    limits: { fieldSize: 25 * 1024 * 1024 }
});

let file_upload = multer({
    storage: file_storage,
    limits: { fieldSize: 25 * 1024 * 1024 }
})

//게시글 등록
router.post("/register-inquiry", [checkAuth, upload.array('files', 10), registerInquiryValidation], InquiryController.registerInquiry);
router.post("/detail", [checkAuth], InquiryController.detail);
//코멘트 등록/수정
router.post("/register-comment", [checkAuth], InquiryController.registerComment);
//코멘트 삭제
router.post("/delete-comment", [checkAuth], InquiryController.deleteComment);
//게시글 삭제
router.post("/delete-inquiry", [checkAuth], InquiryController.deleteInquiry);
//게시물 목록 얻기
router.post("/get-inquiry-list", [checkAuth], InquiryController.getInquiryList);
router.post("/upload-image", [checkAuth, file_upload.single('file')], InquiryController.uploadImage);
export default router;
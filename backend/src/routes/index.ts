import { Router } from "express";
import auth from "./auth";
import basic from "./basic";
import worker from "./worker";
import company from "./company";
import requester from "./requester";
import manager from "./manager";
import admin from "./admin";
import inquiry from "./inquiry";
import subtitle_translation from "./subtitle-translation";
import billing from "./billing";
import subtitle_history from "./subtitle-history";
import subtitle_worker from "./subtitle-worker";
import dashboard from "./dashboard";
import notice from "./notice";

const routes = Router();

routes.use("/auth", auth);
routes.use("/basic", basic);
//작업자 관리
routes.use("/worker", worker);
//고객사 관리
routes.use("/company", company);
//요청자 관리
routes.use("/requester", requester);
//담당자 관리
routes.use("/manager", manager);
//관리자 관리
routes.use("/admin", admin);
//문의게시판
routes.use("/inquiry", inquiry);
//자막번역
routes.use("/subtitle-translation", subtitle_translation);
//자막번역 목록 (관리자 , 고객사, 요청자)
routes.use("/subtitle-history", subtitle_history);
routes.use("/subtitle-worker", subtitle_worker);
//정산관리
routes.use("/billing", billing);
//대시보드
routes.use("/dashboard", dashboard);
//알림목록
routes.use("/notice", notice);

export default routes;
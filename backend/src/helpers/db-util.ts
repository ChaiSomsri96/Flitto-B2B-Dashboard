import { Response } from 'express';
import { calc_working_time } from './utils';
import { isEmpty, isArray } from 'class-validator';
import { getRepository, getConnection, Brackets } from 'typeorm';
import { UserTag} from './../entity/user-tag';
import { Inquiry } from './../entity/inquiry';
import { Notice } from './../entity/notice';
import { Trigger } from './../entity/entity-enum';
import { TransRequest } from './../entity/trans-request';
import { User } from './../entity/user';
import { UsersWorkingLanguage } from './../entity/users-working-language';
import { UsersTranslatePair } from './../entity/users-translate-pair';
import { WorkerAssignSetting } from './../entity/worker-assign-setting';
import { RequestDetail } from './../entity/request-detail';
import { Log } from './../entity/log';
import { sendTalk, sendSms, sendEmail, webPush } from './../helpers/notice-method';
import global from './../config/global'
import config from './../config/config';
import lang from "../lang/index";
import { NoticeUser } from './../entity/notice-user';
import { google } from 'googleapis';
import fs from "fs";

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(config.CLIENT_ID, config.SECRET, 'https://b2b.ku-min.com/profile');

export const getInquiryMaxId = async () => {
    let ret = await getRepository(Inquiry)
    .createQueryBuilder('inquiry')
    .select("MAX(inquiry.id)", "max_id")
    .getRawOne();

    if(isEmpty(ret) || isEmpty(ret.max_id)) {
        return 1;
    }
    else
        return parseInt(ret.max_id) + 1;
}

export const convertTranslateMsg = (msg: string, templateObj: Object) => {
    let str = msg
    for (const [key, value] of Object.entries(templateObj)) {
        str = str.replace(`{${key}}`, value)
    }
    return str
}

export const sendPush = async(_managers: User[] | null, _parent: User | null, _admins: User[], _user: User, _trans_request: TransRequest | null, _request_detail: RequestDetail | null, _type: any, _is_read = Trigger.OFF) => {
    let _objects;
    if( _type == 1 && _trans_request != null &&_user.user_type == 3 && _trans_request.has_original_video == 'N' && _parent?.has_tc_service == 'Y') {
        //get TCS
        let query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin(WorkerAssignSetting, "worker_assign_setting", '"worker_assign_setting"."userId" = ' + _trans_request.user.parent_id + ' and "worker_assign_setting"."worker_type" = \'4\'')
                    .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                    .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = "user"."id"')
                    .leftJoin(UsersWorkingLanguage, "users_working_language", '"users_working_language"."workingLanguageId" = ' + _trans_request.original_language.id + ' and "users_working_language"."userId" = "user"."id"')
                    .where('"user"."user_type" = \'4\'')
                    .andWhere('"users_working_language"."id" is Not NULL')
                    .andWhere(new Brackets(qb => {
                        qb.where('"user_tag"."id" is not NULL or "worker_assign_setting"."tag_type" = 2')
                    }))
        _objects = await query.getMany();

        for(let i = 0; i < _objects.length; i ++) {
            await noticeProc(_managers, _parent, _admins, _objects[i], _trans_request, null, 1, Trigger.OFF)
        }
    }
    else if( (_type == 2 && _trans_request != null && _user.user_type == 4)
    || (_type == 1 && _trans_request != null && (_trans_request.has_original_video == 'Y' || _parent?.has_tc_service == 'N') && _user.user_type == 3) ) {
        _objects = []
        for(let i = 0; i < _trans_request.details.length; i ++) {
            let query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin(WorkerAssignSetting, "worker_assign_setting", '"worker_assign_setting"."userId" = ' + _trans_request.user.parent_id + ' and "worker_assign_setting"."worker_type" = \'5\'')
                    .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                    .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = "user"."id"')
                    .leftJoin(UsersTranslatePair, "users_translate_pair", '("users_translate_pair"."originalId" = ' + _trans_request.original_language.id + ' and "users_translate_pair"."translateId" = ' + _trans_request.details[i].translate_language.id + ') and "users_translate_pair"."userId" = "user"."id"')
                    .where('"user"."user_type" = \'5\'')
                    .andWhere('"users_translate_pair"."id" is not NULL')
                    .andWhere(new Brackets(qb => {
                        qb.where('"user_tag"."id" is not NULL or "worker_assign_setting"."tag_type" = 2')
                    }))
            let _ret = await query.getMany();
            _objects.push(_ret)
        }
        for(let i = 0; i < _objects.length; i ++)
                for(let j = 0; j < _objects[i].length; j ++)
                    await noticeProc(_managers, _parent, _admins, _objects[i][j], _trans_request, _trans_request.details[i], 1, Trigger.OFF)
    }
    else if(_type == 2 && _request_detail != null && _user.user_type == 5 && _request_detail.request.is_native_review == 'Y') {
        let query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin(WorkerAssignSetting, "worker_assign_setting", '"worker_assign_setting"."userId" = ' + _request_detail.request.user.parent_id + ' and "worker_assign_setting"."worker_type" = \'6\'')
                    .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                    .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = "user"."id"')
                    .leftJoin(UsersWorkingLanguage, "users_working_language", '"users_working_language"."workingLanguageId" = ' + _request_detail.translate_language.id + ' and "users_working_language"."userId" = "user"."id"')
                    .where('"user"."user_type" = \'6\'')
                    .andWhere('"users_working_language"."id" is Not NULL')
                    .andWhere(new Brackets(qb => {
                        qb.where('"user_tag"."id" is not NULL or "worker_assign_setting"."tag_type" = 2')
                    }))
        _objects = await query.getMany();
        for(let i = 0; i < _objects.length; i ++) {
            await noticeProc(_managers, _parent, _admins, _objects[i], null, _request_detail, 1, Trigger.OFF)
        }
    }
    else
        return;
}

export const insertNoticeUser = async (_user: User, _notice: Notice) => {
    try {
        let _notice_user = new NoticeUser();
        _notice_user.create_date = Math.floor(Date.now() / 1000);
        _notice_user.update_date = Math.floor(Date.now() / 1000);
        _notice_user.user = _user;
        _notice_user.notice = _notice;
        _notice_user.is_read = Trigger.OFF;
        await getConnection().manager.save(_notice_user);
    }
    catch (error) {
    }
}

/*
type:1 -> 요청 (TC요청 , 번역요청)
type:2 -> 완료
type:3 -> 마감시간 2시간전 알림 (tc)
type:4 -> 작업마감시간 초과  (tc)
type:10 -> 마감시간 2시간전 알림 (translator)
type:11 -> 작업마감시간 초과  (translator)
type:12 -> 마감시간 2시간전 알림 (reviewer)
type:13 ->  작업마감시간 초과  (reviewer)
type:5-> 관리자 (admina02)
type:6-> 관리자 (admina04)
type:7-> 관리자 (admina06)
type:8-> 관리자 (admin-)
type:9-> 관리자 (admin-)

type: 10-> 새로운 게시글 등록  14
type: 11-> 답글 등록     15
type: 12-> 댓글 등록    16

17->작업 수동 할당 알림

*/
export const noticeProc = async(_managers: User[] | null, _parent: User | null, _admins: User[], _user: User, _trans_request: TransRequest | null, _request_detail: RequestDetail | null, _type: any, _is_read = Trigger.OFF) => {
    try {
        let _notice = new Notice();
        _notice.create_date = Math.floor(Date.now() / 1000);
        _notice.update_date = Math.floor(Date.now() / 1000);
        _notice.user = _user;
        if(_trans_request != null)
            _notice.trans_request = _trans_request;
        if(_request_detail != null)
            _notice.request = _request_detail;
        _notice.type = _type;
        _notice.is_read = _is_read;
        let _notice_ret = await getConnection().manager.save(_notice);
        /* ---  번역 요청건  --- */
        if(_user.user_type == global.ROLE.indexOf('requester') + 1 && _trans_request != null && _type == 1) {
            let template_obj: {[k: string]: any} = {};
            template_obj.username = _trans_request.user.user_name
            template_obj.userid = _trans_request.user.login_id
            template_obj.title = _trans_request.title;
            template_obj.youtube_url = _trans_request.youtube_url;
            template_obj.req_date = _trans_request.create_date;
            template_obj.end_date = _trans_request.end_date;
            template_obj.site_url = config.SITE_URL;
            template_obj.org_lang = _trans_request.original_language.name
            template_obj.dst_lang = []
            if(isArray(_trans_request.details)) {
                for(let i = 0; i < _trans_request.details.length; i ++)
                    template_obj.dst_lang.push(_trans_request.details[i].translate_language.name)
            }
            if (_parent != null) {
                template_obj.org_lang = lang[_parent.system_lang]["language"][_trans_request.original_language.id - 1]

                template_obj.dst_lang = []
                if(isArray(_trans_request.details)) {
                    for(let i = 0; i < _trans_request.details.length; i ++)
                        template_obj.dst_lang.push(lang[_parent.system_lang]["language"][_trans_request.details[i].translate_language.id - 1])
                }
            }
            //sms/알림톡 ON  -- 고객사
            if (_parent != null) {
                insertNoticeUser(_parent, _notice_ret)
                let langPairs = lang[_parent.system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_parent.system_lang]["language"][_trans_request.details[0].translate_language.id - 1]
                if(isArray(_trans_request.details)) {
                    for(let i = 1; i < _trans_request.details.length; i ++)
                        langPairs += ', ' + lang[_parent.system_lang]["language"][_trans_request.details[i].translate_language.id - 1]
                }
                let msg = convertTranslateMsg(lang[_parent.system_lang]["web_push"]["client_a01"], { title: _trans_request.title, lang: langPairs })
                webPush([_parent.player_id], _parent.system_lang, msg)
            }
            if (_parent != null && _parent.is_sms_notice_on == Trigger.ON) {
                //
                let langPairs = lang[_parent.system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_parent.system_lang]["language"][_trans_request.details[0].translate_language.id - 1]
                if(isArray(_trans_request.details)) {
                    for(let i = 1; i < _trans_request.details.length; i ++)
                        langPairs += ', ' + lang[_parent.system_lang]["language"][_trans_request.details[i].translate_language.id - 1]
                }
                if(_parent.country_code == '+82' && _parent.system_lang == 'KO') {
                    sendTalk(parseInt(_parent.country_code.substring(1, _parent.country_code.length )), _parent.phone_number, _parent.system_lang, 'client_a01', template_obj)
                }
                else if(_parent.country_code == '+81') {
                    // do nothing
                }
                else{
                    let msg = convertTranslateMsg(lang[_parent.system_lang]["sms"]["client_a01"], {username: _user.user_name, userid: _user.login_id, title: _trans_request.title, lang: langPairs})
                    sendSms(parseInt(_parent.country_code.substring(1, _parent.country_code.length)), _parent.phone_number, _parent.system_lang, msg)
                }
            }
            //email ON -- 고객사
            if(_parent != null && _parent.is_email_notice_on == Trigger.ON) {
                sendEmail(_parent.user_email, _parent.system_lang, lang[_parent.system_lang]['email']['client_a01'], 'client_a01', template_obj)
            }

            /* 담당자 */
            if (_managers != null) {
                for (let i = 0; i < _managers.length; i++)
                    insertNoticeUser(_managers[i], _notice_ret);
                for (let i = 0; i < _managers.length; i++) {
                    let langPairs = lang[_managers[i].system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_managers[i].system_lang]["language"][_trans_request.details[0].translate_language.id - 1]
                    if(isArray(_trans_request.details)) {
                        for(let i = 1; i < _trans_request.details.length; i ++)
                            langPairs += ', ' + lang[_managers[i].system_lang]["language"][_trans_request.details[i].translate_language.id - 1]
                    }

                    template_obj.org_lang = lang[_managers[i].system_lang]["language"][_trans_request.original_language.id - 1]

                    template_obj.dst_lang = []
                    if(isArray(_trans_request.details)) {
                        for(let k = 0; k < _trans_request.details.length; k ++)
                            template_obj.dst_lang.push(lang[_managers[i].system_lang]["language"][_trans_request.details[k].translate_language.id - 1])
                    }
                    
                    let msg = convertTranslateMsg(lang[_managers[i].system_lang]["web_push"]["client_a01"], { title: _trans_request.title, lang: langPairs })
                    webPush([_managers[i].player_id], _managers[i].system_lang, msg)
                    if (_managers[i].is_sms_notice_on == Trigger.ON) {
                        if (_managers[i].country_code == '+82' && _managers[i].system_lang == 'KO') {
                            sendTalk(parseInt(_managers[i].country_code.substring(1, _managers[i].country_code.length )), _managers[i].phone_number, _managers[i].system_lang, 'client_a01', template_obj)
                        }
                        else if (_managers[i].country_code == '+81') {
                            // do nothing
                        }
                        else {
                            let msg = convertTranslateMsg(lang[_managers[i].system_lang]["sms"]["client_a01"], { username: _user.user_name, userid: _user.login_id, title: _trans_request.title, lang: langPairs })
                            sendSms(parseInt(_managers[i].country_code.substring(1, _managers[i].country_code.length)), _managers[i].phone_number, _managers[i].system_lang, msg)
                        }
                    }
                    // email on 
                    if (_managers[i].is_email_notice_on == Trigger.ON) {
                        sendEmail(_managers[i].user_email, _managers[i].system_lang, lang[_managers[i].system_lang]['email']['client_a01'], 'client_a01', template_obj)
                    }
                }
            }
            //어드민 알림톡
            for (let i = 0; i < _admins.length; i ++ )  
                insertNoticeUser(_admins[i], _notice_ret)
            for( let i = 0; i < _admins.length; i ++ ) {
                let langPairs = lang[_admins[i].system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_admins[i].system_lang]["language"][_trans_request.details[0].translate_language.id - 1]
                if(isArray(_trans_request.details)) {
                    for(let j = 1; j < _trans_request.details.length; j ++)
                        langPairs += ', ' + lang[_admins[i].system_lang]["language"][_trans_request.details[j].translate_language.id - 1]
                }

                webPush([_admins[i].player_id], _admins[i].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a01"], { title: _trans_request.title, lang: langPairs }))

                template_obj.org_lang = lang[_admins[i].system_lang]["language"][_trans_request.original_language.id - 1]
                template_obj.dst_lang = []
                if(isArray(_trans_request.details)) {
                        for(let k = 0; k < _trans_request.details.length; k ++)
                            template_obj.dst_lang.push(lang[_admins[i].system_lang]["language"][_trans_request.details[k].translate_language.id - 1])
                }
                
                if(_admins[i].is_sms_notice_on == Trigger.ON) {
                    if(_admins[i].country_code == '+82' && _admins[i].system_lang == 'KO') {
                        template_obj.companyname = _parent?.company_name;
                        template_obj.companyid = _parent?.login_id;
                        sendTalk(parseInt(_admins[i].country_code.substring(1, _admins[i].country_code.length)), _admins[i].phone_number, _admins[i].system_lang, 'admin_a01', template_obj)
                    }
                    else if(_admins[i].country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = '';
                            msg = convertTranslateMsg(lang[_admins[i].system_lang]["sms"]["admin_a01"],
                                            {
                                                companyname: _parent?.company_name,
                                                username: _user.user_name,
                                                title: _trans_request.title,
                                                lang: langPairs
                                            });
                        sendSms(parseInt(_admins[i].country_code.substring(1, _admins[i].country_code.length)), _admins[i].phone_number, _admins[i].system_lang, msg)
                    }
                }
                if(_admins[i].is_email_notice_on == Trigger.ON) {
                    template_obj.companyname = _parent?.company_name;
                    template_obj.companyid = _parent?.login_id;
                    sendEmail(_admins[i].user_email, _admins[i].system_lang, lang[_admins[i].system_lang]['email']['admin_a01'], 'admin_a01', template_obj)
                }
            }
        }
        //작업 완료 (요청자)
        else if(_user.user_type == global.ROLE.indexOf('requester') + 1 && _trans_request != null && _type == 2) {
            let userRepoistory = getRepository(User);
            let _parent = await userRepoistory.findOne(_user.parent_id)
            let template_obj: {[k: string]: any} = {};
            template_obj.username = _user.user_name
            template_obj.userid = _user.login_id
            template_obj.title = _trans_request.title;
            template_obj.youtube_url = _trans_request.youtube_url;
            template_obj.req_date = _trans_request.create_date;
            template_obj.end_date = _trans_request.end_date;
            template_obj.site_url = config.SITE_URL;
            template_obj.org_lang = _trans_request.original_language.name
            template_obj.dst_lang = []

            let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .leftJoinAndSelect("request_detail.translate_language", "working_language")
                    .where('"request_detail"."requestId" = ' + _trans_request.id);
            let _details = await query.getMany();
            if(isArray(_details)) {
                for(let i = 0; i < _details.length; i ++)
                    template_obj.dst_lang.push(_details[i].translate_language.name)
            }
            //sms/알림톡 ON  -- 고객사
            if (_parent != undefined) {
                template_obj.org_lang = lang[_parent.system_lang]["language"][_trans_request.original_language.id - 1];

                template_obj.dst_lang = []
                if(isArray(_details)) {
                    for(let i = 0; i < _details.length; i ++)
                        template_obj.dst_lang.push(lang[_parent.system_lang]["language"][_details[i].translate_language.id - 1])
                }
            }
            if (_parent != undefined) {
                insertNoticeUser(_parent, _notice_ret)
                //
                let langPairs = lang[_parent.system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_parent.system_lang]["language"][_details[0].translate_language.id - 1]
                if(isArray(_details)) {
                    for(let i = 1; i < _details.length; i ++)
                        langPairs += ', ' + lang[_parent.system_lang]["language"][_details[i].translate_language.id - 1]
                }
                webPush([_parent.player_id], _parent.system_lang, convertTranslateMsg(lang[_parent.system_lang]["web_push"]["client_a02"], {title: _trans_request.title, lang: langPairs}))
            }
            if(_parent != undefined && _parent.is_sms_notice_on == Trigger.ON) {
                //
                let langPairs = lang[_parent.system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_parent.system_lang]["language"][_details[0].translate_language.id - 1]
                if(isArray(_details)) {
                    for(let i = 1; i < _details.length; i ++)
                        langPairs += ', ' + lang[_parent.system_lang]["language"][_details[i].translate_language.id - 1]
                }
                if(_parent.country_code == '+82' && _parent.system_lang == 'KO' && _type == 2) {
                    //요청자 , 고객사 모두 전달
                    sendTalk(parseInt(_parent.country_code.substring(1, _parent.country_code.length)), _parent.phone_number, _parent.system_lang, 'client_a02', template_obj)
                }
                else if(_parent.country_code == '+81') {
                    // do nothing
                }
                else{
                    let msg = convertTranslateMsg(lang[_parent.system_lang]["sms"]["client_a02"], {username: _user.user_name, userid: _user.login_id, title: _trans_request.title, lang: langPairs})
                    sendSms(parseInt(_parent.country_code.substring(1, _parent.country_code.length)), _parent.phone_number, _parent.system_lang, msg)
                }
            }
            //email ON -- 고객사
            if(_parent != undefined && _parent.is_email_notice_on == Trigger.ON) {
                sendEmail(_parent.user_email, _parent.system_lang, lang[_parent.system_lang]['email']['client_a02'], 'client_a02', template_obj)
            }

            //담당자
            if (_managers != null) {
                for (let i = 0; i < _managers.length; i++) {
                    insertNoticeUser(_managers[i], _notice_ret)
                    //
                    let langPairs = lang[_managers[i].system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_managers[i].system_lang]["language"][_details[0].translate_language.id - 1]
                    if(isArray(_details)) {
                        for(let i = 1; i < _details.length; i ++)
                            langPairs += ', ' + lang[_managers[i].system_lang]["language"][_details[i].translate_language.id - 1]
                    }
                    webPush([_managers[i].player_id], _managers[i].system_lang, convertTranslateMsg(lang[_managers[i].system_lang]["web_push"]["client_a02"], { title: _trans_request.title, lang: langPairs }))

                    template_obj.org_lang = lang[_managers[i].system_lang]["language"][_trans_request.original_language.id - 1];
                    
                    template_obj.dst_lang = []
                    if(isArray(_details)) {
                        for(let k = 0; k < _details.length; k ++)
                            template_obj.dst_lang.push(lang[_managers[i].system_lang]["language"][_details[k].translate_language.id - 1])
                    }

                    if (_managers[i].is_sms_notice_on == Trigger.ON) {
                        if (_managers[i].country_code == '+82' && _managers[i].system_lang == 'KO' && _type == 2) {
                            sendTalk(parseInt(_managers[i].country_code.substring(1, _managers[i].country_code.length)), _managers[i].phone_number, _managers[i].system_lang, 'client_a02', template_obj)
                        }
                        else if (_managers[i].country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = convertTranslateMsg(lang[_managers[i].system_lang]["sms"]["client_a02"], { username: _user.user_name, userid: _user.login_id, title: _trans_request.title, lang: langPairs })
                            sendSms(parseInt(_managers[i].country_code.substring(1, _managers[i].country_code.length)), _managers[i].phone_number, _managers[i].system_lang, msg)
                        }
                    }
                    if (_managers[i].is_email_notice_on == Trigger.ON) {
                        sendEmail(_managers[i].user_email, _managers[i].system_lang, lang[_managers[i].system_lang]['email']['client_a02'], 'client_a02', template_obj)
                    }
                }
            }

            //유저 알림톡
            insertNoticeUser(_user, _notice_ret)
            let langPairs = lang[_user.system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_user.system_lang]["language"][_details[0].translate_language.id - 1]
            if(isArray(_details)) {
                for(let i = 1; i < _details.length; i ++)
                    langPairs += ', ' + lang[_user.system_lang]["language"][_details[i].translate_language.id - 1]
            }
            webPush([_user.player_id], _user.system_lang, convertTranslateMsg(lang[_user.system_lang]["web_push"]["requestor_a01"], { title: _trans_request.title, lang: langPairs }))
            
            template_obj.org_lang = lang[_user.system_lang]["language"][_trans_request.original_language.id - 1];

            template_obj.dst_lang = []
            if(isArray(_details)) {
                for(let k = 0; k < _details.length; k ++)
                    template_obj.dst_lang.push(lang[_user.system_lang]["language"][_details[k].translate_language.id - 1])
            }

            if(_user.is_sms_notice_on == Trigger.ON) {
                if(_user.country_code == '+82' && _user.system_lang == 'KO')
                    sendTalk(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, 'requestor_a01', template_obj)
                else if(_user.country_code == '+81') {
                    // do nothing
                }
                else {
                    let msg = convertTranslateMsg(lang[_user.system_lang]["sms"]["requestor_a01"], {username: _user.user_name, title: _trans_request.title, lang: langPairs})
                    sendSms(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, msg)
                }
            }
            if(_user.is_email_notice_on == Trigger.ON && _type == 2) {
                sendEmail(_user.user_email, _user.system_lang, lang[_user.system_lang]['email']['requestor_a01'], 'requestor_a01', template_obj)
            }
            //어드민 알림톡
            for( let i = 0; i < _admins.length; i ++ ) 
                insertNoticeUser(_admins[i], _notice_ret)
            for( let i = 0; i < _admins.length; i ++ ) {
                let langPairs = lang[_admins[i].system_lang]["language"][_trans_request.original_language.id - 1] + '->' + lang[_admins[i].system_lang]["language"][_details[0].translate_language.id - 1]
                if(isArray(_details)) {
                    for(let j = 1; j < _details.length; j ++)
                        langPairs += ', ' + lang[_admins[i].system_lang]["language"][_details[j].translate_language.id - 1]
                }

                webPush([_admins[i].player_id], _admins[i].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a10"], { title: _trans_request.title, lang: langPairs }))

                template_obj.org_lang = lang[_admins[i].system_lang]["language"][_trans_request.original_language.id - 1];

                template_obj.dst_lang = []
                if(isArray(_details)) {
                    for(let k = 0; k < _details.length; k ++)
                        template_obj.dst_lang.push(lang[_admins[i].system_lang]["language"][_details[k].translate_language.id - 1])
                }

                if(_admins[i].is_sms_notice_on == Trigger.ON) {
                    if(_admins[i].country_code == '+82' && _admins[i].system_lang == 'KO') {
                        template_obj.companyname = _parent?.company_name;
                        template_obj.companyid = _parent?.login_id;
                        template_obj.predict_end_date = _trans_request.predict_end_date
                        sendTalk(parseInt(_admins[i].country_code.substring(1, _admins[i].country_code.length)), _admins[i].phone_number, _admins[i].system_lang, 'admin_a10', template_obj)
                    }
                    else if(_admins[i].country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = convertTranslateMsg(lang[_admins[i].system_lang]["sms"]["admin_a10"],
                                            {
                                                username: _user.user_name,
                                                title: _trans_request.title,
                                                lang: langPairs
                                            });
                        sendSms(parseInt(_admins[i].country_code.substring(1, _admins[i].country_code.length)), _admins[i].phone_number, _admins[i].system_lang, msg)
                    }
                }
                if(_admins[i].is_email_notice_on == Trigger.ON) {
                    template_obj.companyname = _parent?.company_name;
                    template_obj.companyid = _parent?.login_id;
                    template_obj.predict_end_date = _trans_request.predict_end_date;
                    sendEmail(_admins[i].user_email, _admins[i].system_lang, lang[_admins[i].system_lang]['email']['admin_a10'], 'admin_a10', template_obj)
                }
            }
        }
        //TC알림 인 경우
        else if(_user.user_type == global.ROLE.indexOf('tc') + 1 && _trans_request != null) {
            let template_obj: {[k: string]: any} = {};
            template_obj.title = _trans_request.title;
            template_obj.org_lang = lang[_user.system_lang]["language"][_trans_request.original_language.id - 1];
            if(_type == 1 && _parent != null) {
                template_obj.predict_end_date = await calc_working_time(_parent.screen_time_limit, _parent.end_time_settings, _trans_request.duration_minute, 4, _trans_request.is_urgent)
            }
            template_obj.site_url = config.SITE_URL;
            insertNoticeUser(_user, _notice_ret)

            webPush([_user.player_id], _user.system_lang, convertTranslateMsg(lang[_user.system_lang]["web_push"]["tc_a01"], {title: _trans_request.title, org_lang: lang[_user.system_lang]["language"][_trans_request.original_language.id - 1]}))

            if(_user.is_sms_notice_on == Trigger.ON) {
                if(_user.country_code == '+82' && _user.system_lang == 'KO') {
                    if(_type == 1)
                        sendTalk(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, 'tc_a01', template_obj)
                }
                else if(_user.country_code == '+81') {
                    //do nothing
                }
                else {
                    if(_type == 1) {
                        let msg = convertTranslateMsg(lang[_user.system_lang]["sms"]["tc_a01"], {
                            title: _trans_request.title,
                            org_lang: lang[_user.system_lang]["language"][_trans_request.original_language.id - 1]
                        });
                        sendSms(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, msg)
                    }
                }
            }
            if(_user.is_email_notice_on == Trigger.ON) {
                if(_type == 1)
                    sendEmail(_user.user_email, _user.system_lang, lang[_user.system_lang]['email']['tc_a01'], 'tc_a01', template_obj)
            }
        }
        //Translate 알림인 경우
        else if(_user.user_type == global.ROLE.indexOf('translator') + 1 && _request_detail != null && _trans_request != null) {
            let template_obj: {[k: string]: any} = {};
            template_obj.title = _trans_request?.title;
            template_obj.org_lang = lang[_user.system_lang]["language"][_trans_request.original_language.id - 1];
            template_obj.dst_lang = lang[_user.system_lang]["language"][_request_detail.translate_language.id - 1];
            if(_type == 1 && _parent != null && _trans_request != null) {
                if(_trans_request.has_original_video == Trigger.OFF && _parent.has_tc_service == Trigger.ON)
                    template_obj.predict_end_date = await calc_working_time(_parent.screen_time_limit, _parent.end_time_settings, _trans_request.duration_minute, 5, _trans_request.is_urgent)
                else
                    template_obj.predict_end_date = await calc_working_time(_parent.screen_time_limit, _parent.end_time_settings, _trans_request.duration_minute, 5, _trans_request.is_urgent)
            }
            template_obj.site_url = config.SITE_URL;
            insertNoticeUser(_user, _notice_ret)

            if(_trans_request != null)
                webPush([_user.player_id], _user.system_lang, convertTranslateMsg(lang[_user.system_lang]["web_push"]["translator_a01"], { title: _trans_request.title, org_lang: lang[_user.system_lang]["language"][_trans_request.original_language.id - 1], dst_lang: _request_detail.translate_language.name }))
            
            if(_user.is_sms_notice_on == Trigger.ON) {
                if(_user.country_code == '+82' && _user.system_lang == 'KO') {
                    if(_type == 1)
                        sendTalk(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, 'translator_a01', template_obj)
                }
                else if(_user.country_code == '+81') {
                    //do nothing
                }
                else {
                    if(_type == 1 && _trans_request != null && _request_detail != null) {
                        let msg = convertTranslateMsg(lang[_user.system_lang]["sms"]["translator_a01"], {
                            title: _trans_request.title,
                            org_lang: lang[_user.system_lang]["language"][_trans_request.original_language.id - 1],
                            dst_lang: lang[_user.system_lang]["language"][_request_detail.translate_language.id - 1]    
                        });
                        sendSms(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, msg)
                    }
                }
            }
            if(_user.is_email_notice_on == Trigger.ON) {
                if(_type == 1)
                    sendEmail(_user.user_email, _user.system_lang, lang[_user.system_lang]['email']['translator_a01'], 'translator_a01', template_obj)
            }
        }
        else if(_user.user_type == global.ROLE.indexOf('reviewer') + 1 && _request_detail != null) {
            let template_obj: { [k: string]: any } = {};
            
            template_obj.title = _request_detail.request.title
            template_obj.dst_lang = lang[_user.system_lang]["language"][_request_detail.translate_language.id - 1]

            if(_type == 1 && _request_detail != null && _parent != null)
                template_obj.predict_end_date = await calc_working_time(_parent.screen_time_limit, _parent.end_time_settings, _request_detail.request.duration_minute, 6, _request_detail.request.is_urgent)
            template_obj.site_url = config.SITE_URL;
            insertNoticeUser(_user, _notice_ret)
            if(_trans_request != null)
                webPush([_user.player_id], _user.system_lang, convertTranslateMsg(lang[_user.system_lang]["web_push"]["reviewer_a01"], { title: _trans_request.title, dst_lang: lang[_user.system_lang]["language"][_request_detail.translate_language.id - 1] }))
            if(_user.is_sms_notice_on == Trigger.ON) {
                if(_user.country_code == '+82' && _user.system_lang == 'KO') {
                    if(_type == 1)
                        sendTalk(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, 'reviewer_a01', template_obj)
                }
                else if(_user.country_code == '+81') {
                    //do nothing
                }
                else {
                    if(_type == 1 && _trans_request != null && _request_detail != null) {
                        let msg = convertTranslateMsg(lang[_user.system_lang]["sms"]["reviewer_a01"], {
                            title: _trans_request.title,
                            dst_lang: lang[_user.system_lang]["language"][_request_detail.translate_language.id - 1]
                        });
                        sendSms(parseInt(_user.country_code.substring(1, _user.country_code.length)), _user.phone_number, _user.system_lang, msg)
                    }
                }
            }
            if(_user.is_email_notice_on == Trigger.ON) {
                if(_type == 1)
                    sendEmail(_user.user_email, _user.system_lang, lang[_user.system_lang]['email']['reviewer_a01'], 'reviewer_a01', template_obj)
            }
        }
        /* --- */
        sendPush(_managers, _parent, _admins, _user, _trans_request, _request_detail, _type, _is_read)
    }
    catch(err) {
    }
}

export const insertNotice = async(_user: User, _trans_request: TransRequest | null, _request_detail: RequestDetail | null, _type: any, _is_read = Trigger.OFF) => {
    try {
        let query = getRepository(User)
                    .createQueryBuilder("user")
                    .where('"user"."user_type" = 1');
        let _admins = await query.getMany();
        let userRepoistory = getRepository(User);
        let _parent = null;
        if(_trans_request != null)
            _parent = await userRepoistory.findOne(_trans_request.user.parent_id)
        else if(_request_detail != null)
            _parent = await userRepoistory.findOne(_request_detail.request.user.parent_id)
        if(_parent == undefined)
            _parent = null
        
        if (_user.user_type == 3) {
            query = getRepository(User)
            .createQueryBuilder("user")
            .leftJoin('user.managers', 'manager', '"manager"."requesterId" = ' + _user.id)
            .where('"user"."user_type" = 7')
            .andWhere('"manager"."id" is not NULL');   
            let _managers = await query.getMany();
            noticeProc(_managers, _parent, _admins, _user, _trans_request, _request_detail, _type, _is_read);
        }
        else
            noticeProc(null, _parent, _admins, _user, _trans_request, _request_detail, _type, _is_read);
    }
    catch(err) {
    }
}

export const youtube_caption_apply = (res: Response, access_token: string, _name: string, path: string, language_id: number, _request_detail: RequestDetail) => {
    oauth2Client.setCredentials({
        access_token: access_token
    })
    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
    });
    let language = '';
    if (language_id == 1) {
        language = 'ko'
    }
    else if (language_id == 2) {
        language = 'en'
    }
    else if (language_id == 3) {
        language = 'ja'
    }
    else if (language_id == 4) {
        language = 'zh-Hans'
    }
    else if (language_id == 5) {
        language = 'zh-Hant'
    }
    else if (language_id == 6) {
        language = 'id'
    }
    else if (language_id == 7) {
        language = 'vi'
    }
    else if (language_id == 8) {
        language = 'th'
    }
    else if (language_id == 9) {
        language = 'es'
    }     
    youtube.captions.insert({
        part: ['id', 'snippet'],
        requestBody: {
            snippet: {
                videoId: _request_detail.request.youtube_id,
                language: language,
                name: '',
                isDraft: false
            }
        },
        media: {
            body: fs.createReadStream(path)    
        },
        sync: true
    },
    (err: any, _data: any) => {
        if (_request_detail == undefined)
        {
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }    
        if (err) {
            // console.log('data', err.response.status)
            let _log = new Log();
            _log.create_date = Math.floor(Date.now() / 1000);
            _log.update_date = Math.floor(Date.now() / 1000);
            _log.user = _request_detail.request.user;
            _log.request = _request_detail;
            _log.status = global.STATUS.indexOf("subtitle_apply_failed") + 1;
            getConnection().manager.save(_log);
            _request_detail.youtube_applying = Trigger.OFF

            if(err.response.status == 400)
                _request_detail.status = 9
            else if (err.response.status == 409)
                _request_detail.status = 10
            else if (err.response.status == 403)
                _request_detail.status = 11
            else if (err.response.status == 400)
                _request_detail.status = 12
            else if (err.response.status == 404)
                _request_detail.status = 13
            
            getConnection().manager.save(_request_detail)   

            return res.json({ errorCode: err.response.status, errorMsg: "Caption apply failed", complete: true });
        }
        console.log("applying srt file done")
        let _log = new Log();
        _log.create_date = Math.floor(Date.now() / 1000);
        _log.update_date = Math.floor(Date.now() / 1000);
        _log.user = _request_detail.request.user;
        _log.request = _request_detail;
        _log.status = global.STATUS.indexOf("subtitle_apply") + 1;
        getConnection().manager.save(_log);
        _request_detail.youtube_applying = Trigger.OFF
        _request_detail.status = 8
        getConnection().manager.save(_request_detail)   

        if (_request_detail.request.status < _request_detail.status) {
            _request_detail.request.status = _request_detail.status
        }
        getConnection().manager.save(_request_detail.request)   
        
        return res.json({errorCode: 0, errorMsg: '', complete: true});
    })               
}






import { UsersTranslatePair } from './../entity/users-translate-pair';
import { UsersWorkingLanguage } from './../entity/users-working-language';
import { UserTag } from './../entity/user-tag';
import { RequestDetailWorker } from './../entity/request-detail-worker';
import { User } from './../entity/user';
import { RequestDetail } from './../entity/request-detail';
import { getConnection, getRepository, Brackets } from 'typeorm';
import { isEmpty, isArray, isNotEmpty, isNumber, isNumberString } from 'class-validator';
import { Request, Response } from 'express';
import { calculate_mins, calculate_predict_time, current_work_count, calculate_work_price, calc_working_time } from './../helpers/utils'
import global from './../config/global';
import config from './../config/config';
import fs from "fs";
import qs from 'qs';
import { Trigger } from './../entity/entity-enum';
import { Log } from './../entity/log';
import { Notice } from './../entity/notice';
import { convertTranslateMsg, insertNotice, youtube_caption_apply } from './../helpers/db-util';
import { TransRequest } from './../entity/trans-request';
import { WorkerAssignSetting } from './../entity/worker-assign-setting';
import { insertNoticeUser } from './../helpers/db-util';
import { webPush, sendTalk, sendEmail, sendSms } from './../helpers/notice-method';
import lang from "../lang/index";


var axios = require('axios').default;

// original
// tc
// translator
// reviewer
class SubtitleWorkerController {

    static pushNotice = async (req: Request, res: Response) => {
        try {
            let { work_no } = req.body;
            if (isEmpty(work_no)) 
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });    
            
            let query = getRepository(RequestDetail)
                .createQueryBuilder("request_detail")
                .leftJoinAndSelect("request_detail.request", "trans_request")
                .leftJoinAndSelect("trans_request.user", "user")
                .leftJoinAndSelect("user.parent", "parent")
                .leftJoinAndSelect('parent.screen_time_limit', 'screen_time_limit')
                .leftJoinAndSelect('parent.end_time_settings', 'end_time_setting')
                .leftJoinAndSelect("trans_request.original_language", "woring_language")
                .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                .where('"request_detail"."id" = :work_no', { work_no: work_no });
            
            let _request_detail = await query.getOne();
            if (_request_detail == undefined)
                return res.json({ errorCode: 15, errorMsg: 'invalid your work no.' });       
            if (_request_detail.status == 2 || _request_detail.status == 4 || _request_detail.status == 6 || _request_detail.is_end == Trigger.ON)
                return res.json({ errorCode: 401, errorMsg: 'no permission to send push' });       
            
            let _objects:User[] = [] , user_type = '';
            //TC
            if (_request_detail.status == 1 && _request_detail.request.has_original_video == Trigger.OFF && _request_detail.request.user.parent.has_tc_service == 'Y') {
                //get TCS
                let worker_query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin(WorkerAssignSetting, "worker_assign_setting", '"worker_assign_setting"."userId" = ' + _request_detail.request.user.parent_id + ' and "worker_assign_setting"."worker_type" = \'4\'')       
                    .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')       
                    .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = "user"."id"')
                    .leftJoin(UsersWorkingLanguage, "users_working_language", '"users_working_language"."workingLanguageId" = ' + _request_detail.request.original_language.id + ' and "users_working_language"."userId" = "user"."id"')
                    .where('"user"."user_type" = \'4\'')
                    .andWhere('"user"."is_delete" = \'N\'')
                    .andWhere('"users_working_language"."id" is Not NULL')
                    .andWhere(new Brackets(qb => {
                        qb.where('"user_tag"."id" is not NULL or "worker_assign_setting"."tag_type" = 2')
                    }))
                _objects = await worker_query.getMany();
                user_type = 'tc';
            } //translator
            else if (_request_detail.status == 3 || (_request_detail.status == 1 && (_request_detail.request.has_original_video == Trigger.ON || _request_detail.request.user.parent.has_tc_service == Trigger.OFF))) {
                let worker_query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin(WorkerAssignSetting, "worker_assign_setting", '"worker_assign_setting"."userId" = ' + _request_detail.request.user.parent_id + ' and "worker_assign_setting"."worker_type" = \'5\'')
                    .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                    .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = "user"."id"')
                    .leftJoin(UsersTranslatePair, "users_translate_pair", '("users_translate_pair"."originalId" = ' + _request_detail.request.original_language.id + ' and "users_translate_pair"."translateId" = ' + _request_detail.translate_language.id + ') and "users_translate_pair"."userId" = "user"."id"')       
                    .where('"user"."user_type" = \'5\'')
                    .andWhere('"user"."is_delete" = \'N\'')
                    .andWhere('"users_translate_pair"."id" is not NULL')
                    .andWhere(new Brackets(qb => {
                        qb.where('"user_tag"."id" is not NULL or "worker_assign_setting"."tag_type" = 2')
                    }))
                _objects = await worker_query.getMany();
                user_type = 'translator';
            } // reviewer
            else if (_request_detail.status == 5 && _request_detail.request.is_native_review == Trigger.ON) {
                let worker_query = getRepository(User)
                .createQueryBuilder("user")
                .leftJoin(WorkerAssignSetting, "worker_assign_setting", '"worker_assign_setting"."userId" = ' + _request_detail.request.user.parent_id + ' and "worker_assign_setting"."worker_type" = \'6\'')   
                .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = "user"."id"')
                .leftJoin(UsersWorkingLanguage, "users_working_language", '"users_working_language"."workingLanguageId" = ' + _request_detail.translate_language.id + ' and "users_working_language"."userId" = "user"."id"')       
                .where('"user"."user_type" = \'6\'')
                .andWhere('"user"."is_delete" = \'N\'')
                .andWhere('"users_working_language"."id" is Not NULL')
                .andWhere(new Brackets(qb => {
                    qb.where('"user_tag"."id" is not NULL or "worker_assign_setting"."tag_type" = 2')
                }))       
                _objects = await worker_query.getMany();
                user_type = 'reviewer';
            }
            
            for (let i = 0; i < _objects.length; i ++) {
                let _notice = new Notice();
                _notice.create_date = Math.floor(Date.now() / 1000);
                _notice.update_date = Math.floor(Date.now() / 1000);
                _notice.user = _objects[i];
                if (user_type == 'tc')
                    _notice.trans_request = _request_detail.request;
                else if (user_type == 'translator') {
                    _notice.trans_request = _request_detail.request;
                    _notice.request = _request_detail;
                }
                else if (user_type == 'reviewer')
                    _notice.request = _request_detail;
                _notice.type = 1;
                _notice.is_read = Trigger.OFF;
                let _notice_ret = await getConnection().manager.save(_notice);
                insertNoticeUser(_objects[i], _notice_ret);
                if (user_type == 'tc') {
                    let template_obj: { [k: string]: any } = {};
                    template_obj.title = _request_detail.request.title;
                    template_obj.org_lang = lang[_objects[i].system_lang]["language"][_request_detail.request.original_language.id - 1];

                    if(_request_detail.request.user.parent != null) {
                        template_obj.predict_end_date = await calc_working_time(_request_detail.request.user.parent.screen_time_limit, _request_detail.request.user.parent.end_time_settings, _request_detail.request.duration_minute, 4, _request_detail.request.is_urgent)
                    }
                    template_obj.site_url = config.SITE_URL;
                    webPush([_objects[i].player_id], _objects[i].system_lang, convertTranslateMsg(lang[_objects[i].system_lang]["web_push"]["tc_a01"], { title: _request_detail.request.title, org_lang: lang[_objects[i].system_lang]["language"][_request_detail.request.original_language.id - 1] }))   
                    if(_objects[i].is_sms_notice_on == Trigger.ON) {
                        if(_objects[i].country_code == '+82' && _objects[i].system_lang == 'KO') {
                            sendTalk(parseInt(_objects[i].country_code.substring(1, _objects[i].country_code.length)), _objects[i].phone_number, _objects[i].system_lang, 'tc_a01', template_obj)
                        }
                        else if(_objects[i].country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = convertTranslateMsg(lang[_objects[i].system_lang]["sms"]["tc_a01"], {
                                title: _request_detail.request.title,
                                org_lang: lang[_objects[i].system_lang]["language"][_request_detail.request.original_language.id - 1]
                            });
                            sendSms(parseInt(_objects[i].country_code.substring(1, _objects[i].country_code.length)), _objects[i].phone_number, _objects[i].system_lang, msg)
                        }
                    }
                    if(_objects[i].is_email_notice_on == Trigger.ON) {
                        sendEmail(_objects[i].user_email, _objects[i].system_lang, lang[_objects[i].system_lang]['email']['tc_a01'], 'tc_a01', template_obj)
                    }
                }
                else if (user_type == 'translator') {
                    let template_obj: {[k: string]: any} = {};
                    template_obj.title = _request_detail.request.title;
                    template_obj.org_lang = lang[_objects[i].system_lang]["language"][_request_detail.request.original_language.id - 1];
                    template_obj.dst_lang = lang[_objects[i].system_lang]["language"][_request_detail.translate_language.id - 1];
                    if (_request_detail.request.has_original_video == Trigger.OFF && _request_detail.request.user.parent.has_tc_service == Trigger.ON)
                        template_obj.predict_end_date = await calc_working_time(_request_detail.request.user.parent.screen_time_limit, _request_detail.request.user.parent.end_time_settings, _request_detail.request.duration_minute, 5, _request_detail.request.is_urgent)
                    else
                        template_obj.predict_end_date = await calc_working_time(_request_detail.request.user.parent.screen_time_limit, _request_detail.request.user.parent.end_time_settings, _request_detail.request.duration_minute, 5, _request_detail.request.is_urgent)
                    template_obj.site_url = config.SITE_URL;    
                    webPush([_objects[i].player_id], _objects[i].system_lang, convertTranslateMsg(lang[_objects[i].system_lang]["web_push"]["translator_a01"], { title: _request_detail.request.title, org_lang: lang[_objects[i].system_lang]["language"][_request_detail.request.original_language.id - 1], dst_lang: lang[_objects[i].system_lang]["language"][_request_detail.translate_language.id - 1] }))
                    if(_objects[i].is_sms_notice_on == Trigger.ON) {
                        if(_objects[i].country_code == '+82' && _objects[i].system_lang == 'KO') {
                            sendTalk(parseInt(_objects[i].country_code.substring(1, _objects[i].country_code.length)), _objects[i].phone_number, _objects[i].system_lang, 'translator_a01', template_obj)
                        }
                        else if(_objects[i].country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = convertTranslateMsg(lang[_objects[i].system_lang]["sms"]["translator_a01"], {
                                title: _request_detail.request.title,
                                org_lang: lang[_objects[i].system_lang]["language"][_request_detail.request.original_language.id - 1],
                                dst_lang: lang[_objects[i].system_lang]["language"][_request_detail.translate_language.id - 1]    
                            });
                            sendSms(parseInt(_objects[i].country_code.substring(1, _objects[i].country_code.length)), _objects[i].phone_number, _objects[i].system_lang, msg)
                        }
                    }
                    if(_objects[i].is_email_notice_on == Trigger.ON) {
                        sendEmail(_objects[i].user_email, _objects[i].system_lang, lang[_objects[i].system_lang]['email']['translator_a01'], 'translator_a01', template_obj)
                    }
                }
                else if (user_type == 'reviewer') {
                    let template_obj: { [k: string]: any } = {};
                    template_obj.title = _request_detail.request.title
                    template_obj.dst_lang = lang[_objects[i].system_lang]["language"][_request_detail.translate_language.id - 1]
                    template_obj.predict_end_date = await calc_working_time(_request_detail.request.user.parent.screen_time_limit, _request_detail.request.user.parent.end_time_settings, _request_detail.request.duration_minute, 6, _request_detail.request.is_urgent)
                    template_obj.site_url = config.SITE_URL;

                    webPush([_objects[i].player_id], _objects[i].system_lang, convertTranslateMsg(lang[_objects[i].system_lang]["web_push"]["reviewer_a01"], { title: _request_detail.request.title, dst_lang: lang[_objects[i].system_lang]["language"][_request_detail.translate_language.id - 1] }))   

                    if(_objects[i].is_sms_notice_on == Trigger.ON) {
                        if(_objects[i].country_code == '+82' && _objects[i].system_lang == 'KO') {
                            sendTalk(parseInt(_objects[i].country_code.substring(1, _objects[i].country_code.length)), _objects[i].phone_number, _objects[i].system_lang, 'reviewer_a01', template_obj)
                        }
                        else if(_objects[i].country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = convertTranslateMsg(lang[_objects[i].system_lang]["sms"]["reviewer_a01"], {
                                title: _request_detail.request.title,
                                dst_lang: lang[_objects[i].system_lang]["language"][_request_detail.translate_language.id - 1]
                            });
                            sendSms(parseInt(_objects[i].country_code.substring(1, _objects[i].country_code.length)), _objects[i].phone_number, _objects[i].system_lang, msg)
                        }
                    }
                    if(_objects[i].is_email_notice_on == Trigger.ON) {
                            sendEmail(_objects[i].user_email, _objects[i].system_lang, lang[_objects[i].system_lang]['email']['reviewer_a01'], 'reviewer_a01', template_obj)
                    }   
                }
            }
            return res.json({errorCode: 0, errorMsg: ''});
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }

    static changeVideo = async (req: Request, res: Response) => {
        try {
            let { work_no, video_type } = req.body;
            let file_name = '';
            if (isEmpty(work_no) || isEmpty(video_type))   
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });    
            if (video_type == 'original' || video_type == 'tc') {
                let _trans_request_repository = getRepository(TransRequest);
                let query = getRepository(TransRequest)
                    .createQueryBuilder("trans_request")
                    .where('"trans_request"."id" = :work_no', { work_no: work_no });
                let _request = await query.getOne()
                if (_request == undefined)
                    return res.json({ errorCode: 15, errorMsg: "Invalid Id." });
                if (video_type == 'original') {
                    if (req.file) {
                        if (!isEmpty(_request.original_video))
                            fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/' + _request.original_video)
                        _request.original_video = req.file.filename;
                        file_name = req.file.filename;
                    }
                }
                else {
                    if (req.file) {
                        if (!isEmpty(_request.tc_video))
                            fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/' + _request.tc_video)
                        _request.tc_video = req.file.filename;
                        file_name = req.file.filename;
                    }
                }
                await _trans_request_repository.save(_request)
            }
            else {
                let _request_detail_repository = getRepository(RequestDetail);
                let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .where('"request_detail"."id" = :work_no', { work_no: work_no });
                let _request_detail = await query.getOne()
                if (_request_detail == undefined)
                    return res.json({ errorCode: 15, errorMsg: "Invalid Id." });
                if (video_type == 'translator') {
                    if (req.file) {
                        if (!isEmpty(_request_detail.translate_video))
                            fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/' + _request_detail.translate_video)
                        _request_detail.translate_video = req.file.filename;
                        file_name = req.file.filename;
                    }
                }
                else {
                    if (req.file) {
                        if (!isEmpty(_request_detail.review_video))
                            fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/' + _request_detail.review_video)
                        _request_detail.review_video = req.file.filename;
                        file_name = req.file.filename;
                    }
                }
                await _request_detail_repository.save(_request_detail)
            }
            return res.json({
                errorCode: 0, errorMsg: '', data: {
                file_name: file_name
            }})
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static setEndTime = async (req: Request, res: Response) => {
        try {
            let { work_no, hour, minute, user_type } = req.body;
            if (isEmpty(work_no) || isEmpty(hour) || isEmpty(minute) || isEmpty(user_type))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if (user_type == 'tc') {
                let query = getRepository(TransRequest)
                    .createQueryBuilder("trans_request")
                    .leftJoinAndSelect("trans_request.user", "user")
                    .leftJoinAndSelect("user.parent", "parent")
                    .where('"trans_request"."id" = :id', { id: work_no });
                let _trans_request = await query.getOne();
                if (_trans_request == undefined)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id.' });
                if (!(_trans_request.has_original_video == Trigger.OFF && _trans_request.user.parent.has_tc_service == Trigger.ON))
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change tc worker price.' });
                if (_trans_request.status != global.STATUS.indexOf('preparing') + 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change tc worker price.' });
                _trans_request.tc_predict_time_set = Trigger.ON;
                _trans_request.tc_predict_time_value = parseInt(hour) * 60 + parseInt(minute);
                await getConnection().manager.save(_trans_request);
            }
            else if (user_type == 'translate') {
                let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .where('"request_detail"."id" = :id', { id: work_no });
                let _request_detail = await query.getOne();
                if (_request_detail == undefined)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this translate work id.' });
                if (_request_detail.status >= global.STATUS.indexOf("translating") + 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change translate predict endtime.' });       
                _request_detail.translate_predict_time_set = Trigger.ON;
                _request_detail.translate_predict_time_value = parseInt(hour) * 60 + parseInt(minute);
                await getConnection().manager.save(_request_detail)
            }
            else {
                let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .leftJoinAndSelect("request_detail.request", "trans_request")
                    .where('"request_detail"."id" = :id', { id: work_no });
                let _request_detail = await query.getOne();   
                if (_request_detail == undefined)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this review work id.' });
                if (_request_detail.request.is_native_review == Trigger.OFF)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change review predict endtime.' });
                if (_request_detail.status >= global.STATUS.indexOf("reviewing") + 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change review predict endtime.' });
                _request_detail.review_predict_time_set = Trigger.ON;
                _request_detail.review_predict_time_value = parseInt(hour) * 60 + parseInt(minute);
                await getConnection().manager.save(_request_detail)
            }
            return res.json({ errorCode: 0, errorMsg: '' })       
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });            
        }
    }
    /**
     * 작업자 가격설정
     */
    static setPrice = async (req: Request, res: Response) => {
        try {
            let { work_no, work_price, user_type } = req.body;
            if (isEmpty(work_no) || isEmpty(work_price) || isEmpty(user_type))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            
            if (user_type == 'tc') {
                let query = getRepository(TransRequest)
                    .createQueryBuilder("trans_request")
                    .leftJoinAndSelect("trans_request.user", "user")
                    .leftJoinAndSelect("user.parent", "parent")
                    .where('"trans_request"."id" = :id', {id: work_no});
                let _trans_request = await query.getOne();
                if (_trans_request == undefined)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id.' });
                if (!(_trans_request.has_original_video == Trigger.OFF && _trans_request.user.parent.has_tc_service == Trigger.ON))
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change tc worker price.' });
                if (_trans_request.status != global.STATUS.indexOf('preparing') + 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change tc worker price.' });
                _trans_request.tc_price_set = Trigger.ON
                _trans_request.tc_price_value = work_price
                await getConnection().manager.save(_trans_request);
            }
            else if (user_type == 'translate') {
                let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .where('"request_detail"."id" = :id', { id: work_no });
                let _request_detail = await query.getOne();
                if (_request_detail == undefined)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this translate work id.' });
                if (_request_detail.status >= global.STATUS.indexOf("translating") + 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change translate worker price.' });       
                _request_detail.translate_price_set = Trigger.ON
                _request_detail.translate_price_value = work_price
                await getConnection().manager.save(_request_detail)
            }
            else {
                let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .leftJoinAndSelect("request_detail.request", "trans_request")
                    .where('"request_detail"."id" = :id', { id: work_no });
                let _request_detail = await query.getOne();
                if (_request_detail == undefined)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this review work id.' });
                if (_request_detail.request.is_native_review == Trigger.OFF)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change review worker price.' });
                if (_request_detail.status >= global.STATUS.indexOf("reviewing") + 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to change review worker price.' });
                _request_detail.review_price_set = Trigger.ON
                _request_detail.review_price_value = work_price
                await getConnection().manager.save(_request_detail)
            }
            return res.json({ errorCode: 0, errorMsg: '' })
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });            
        }
    }
    /*
    errorCode: 401 ~ no permission
                1: 진행상태가 번역중(검수중) 아님
                15: invalid id
    */
    static completeWork = async(req: Request, res: Response) => {
        try {
            let { work_no, work_description, work_title } = req.body;
            if(isEmpty(work_no))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if(!req.file)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });

            let query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail")
                        .leftJoinAndSelect("request_detail.request", "trans_request")
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("request_detail.workers", "request_detail_worker")
                        .leftJoinAndSelect("request_detail_worker.user", "worker")
                        .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                        .leftJoinAndSelect("trans_request.original_language", "original_language")
                        .where('"request_detail"."id" = :work_no', {work_no: work_no});
            let _request_detail = await query.getOne();
            if(_request_detail == undefined)
                return res.json({ errorCode: 15, errorMsg: "Invalid Id." });
            if(_request_detail.request.is_title_desc == Trigger.ON && (isEmpty(work_description) || isEmpty(work_title)))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if( (_request_detail.status != global.STATUS.indexOf("translating") + 1) && (req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) )
                return res.json({ errorCode: 1, errorMsg: "Unable to complete this work." });
            else if( (_request_detail.status != global.STATUS.indexOf("reviewing") + 1) && (req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1) )
                return res.json({ errorCode: 1, errorMsg: "Unable to complete this work." });


            if( !(isArray(_request_detail.workers ) && _request_detail.workers.length > 0) )
                return res.json({ errorCode: 1, errorMsg: "Unable to complete this work." });

            let _request_detail_worker = null;
            for(let i = 0; i < _request_detail.workers.length; i ++)
                if(_request_detail.workers[i].worker_type == req.decodedUser.user_type) {
                    _request_detail_worker = _request_detail.workers[i];
                    break;
                }
            if(_request_detail_worker == null)
                return res.json({ errorCode: 1, errorMsg: "Unable to complete this work." });

            if(_request_detail_worker.user.id != req.decodedUser.id)
                return res.json({ errorCode: 401, errorMsg: "No permission to complete this work." });
            //
            if(req.file) {
                if(req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) {
                    if(!isEmpty(_request_detail.translate_video))
                        fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/'  + _request_detail.translate_video)
                    _request_detail.translate_video = req.file.filename;
                }
                else if(req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1) {
                    if(!isEmpty(_request_detail.review_video))
                        fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/'  + _request_detail.review_video)
                    _request_detail.review_video = req.file.filename;
                }
            }
            _request_detail.update_date = Math.floor(Date.now() / 1000);
            _request_detail_worker.is_end = Trigger.ON;
            _request_detail_worker.end_date = Math.floor(Date.now() / 1000);
            await getConnection().manager.save(_request_detail_worker);

            let youtube_apply = 0;

            if(req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) {
                _request_detail.review_req_date = Math.floor(Date.now() / 1000);
                _request_detail.translate_status = 3;
                _request_detail.status = global.STATUS.indexOf("translation_complete") + 1;
                if(_request_detail.request.is_title_desc == Trigger.ON) {
                    _request_detail.translate_description = work_description;
                    _request_detail.translate_title = work_title;
                }
                if(_request_detail.request.status < _request_detail.status)
                    _request_detail.request.status = _request_detail.status;
                if(_request_detail.request.is_native_review != Trigger.ON) {
                    _request_detail.is_end = Trigger.ON;
                    _request_detail.end_date = Math.floor(Date.now() / 1000);
                    _request_detail.request.update_date = Math.floor(Date.now() / 1000);
                    youtube_apply = 1;
                }
            }
            else if(req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1) {
                _request_detail.review_status = 3;
                _request_detail.status = global.STATUS.indexOf("review_complete") + 1;
                if(_request_detail.request.status < _request_detail.status)
                    _request_detail.request.status = _request_detail.status;
                if (_request_detail.request.is_title_desc == Trigger.ON) {
                    _request_detail.review_description = work_description;
                    _request_detail.review_title = work_title;
                }
                _request_detail.is_end = Trigger.ON;
                _request_detail.end_date = Math.floor(Date.now() / 1000);
                _request_detail.request.update_date = Math.floor(Date.now() / 1000);
                youtube_apply = 2;
            }
            await getConnection().manager.save(_request_detail);

            let complete_query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail")
                        .where('"request_detail"."requestId" = :request_id', {request_id: _request_detail.request.id})
                        .andWhere('"request_detail"."is_end" = \'N\'');
            let unfinished_req_count = await complete_query.getCount();
            if(unfinished_req_count == 0) {
                //all requests are finished
                _request_detail.request.is_end = Trigger.ON;
                _request_detail.request.end_date = Math.floor(Date.now() / 1000);
                //every thing is finished
                await insertNotice(_request_detail.request.user, _request_detail.request, null, 2, Trigger.OFF)
            }
            await getConnection().manager.save(_request_detail.request);
            //진행기록
            let _log = new Log();
            _log.create_date = Math.floor(Date.now() / 1000);
            _log.update_date = Math.floor(Date.now() / 1000);
            _log.user = _request_detail_worker.user;
            _log.request = _request_detail;
            if(req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) {
                _log.status = global.STATUS.indexOf("translation_complete") + 1;
            }
            else {
                _log.status = global.STATUS.indexOf("review_complete") + 1;
            }
            await getConnection().manager.save(_log);
            //insert notice
            await insertNotice(_request_detail_worker.user, _request_detail.request, _request_detail, 2, Trigger.OFF)
            //
            if (youtube_apply > 0 && _request_detail.request.is_youtube_request == Trigger.ON) {
                if (_request_detail.request.user.is_youtube_connected == Trigger.OFF)
                    return res.json({ errorCode: 101, errorMsg: "This account is not connected to  youtube account." , complete: true});    
                
                if (Math.floor(Date.now() / 1000) - _request_detail.request.user.access_token_issued_date >= 3500) {
                        const param = {
                            'client_id': config.CLIENT_ID,
                            'client_secret': config.SECRET,
                            'refresh_token': _request_detail.request.user.refresh_token,
                            'grant_type': 'refresh_token'
                        };
                        const options = {
                            method: 'POST',
                            headers: { 'content-type': 'application/x-www-form-urlencoded' },
                            data: qs.stringify(param),
                            url: "https://accounts.google.com/o/oauth2/token"
                        };
                        let { data } = await axios(options);
                        _request_detail.request.user.access_token = data.access_token;
                        _request_detail.request.user.access_token_issued_date = Math.floor(Date.now() / 1000);
                        await getConnection().manager.save(_request_detail.request.user);
                }

                let name = '', video_path = '';
                if (_request_detail.request.is_title_desc == Trigger.ON) {
                    if (_request_detail.request.is_native_review == Trigger.ON) {
                        name = isEmpty(_request_detail.review_title) ? 'apply_subtitle' : _request_detail.review_title
                    }
                    else {
                        name = isEmpty(_request_detail.translate_title) ? 'apply_subtitle' : _request_detail.translate_title
                    }
                }
                else {
                    name = _request_detail.request.title
                }
                if (_request_detail.request.is_native_review == Trigger.ON) {
                    video_path = config.LOCATION_TRANSLATE_PATH + _request_detail.review_video
                }
                else {
                    video_path = config.LOCATION_TRANSLATE_PATH + _request_detail.translate_video
                }
                youtube_caption_apply(res, _request_detail.request.user.access_token, name, video_path, _request_detail.translate_language.id, _request_detail)
                return;
            }
            else
                return res.json({errorCode: 0, errorMsg: ''});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    {
        table: {
            page: 1,
            page_length: 20
        },
        search: {
            date_type: 1~ 작업요청일시, 2~ 작업마감일시, 3~완료일시
            start_date: 12329334,
            end_date: 12329334,
            status: ['preparing', '', '' , ''], // 전체 선택한 경우 Parameter를 업로드하지 말것.
            original_language: 2, // 원본언어, 전체 선택한 경우 Parameter를 업로드 하지 말것.
            start_work_price: 0, // 작업금액
            end_work_price: 500, // 작업금액
            keyword_type: 1, // 1: 제목 , 2: 작업번호
            search_keyword: 'asdf', // 검색어
            search_type: 1,  // 1: 포함, 2: 일치


            translate_language: 3, //번역 언어
        }
    }
    */
    //TC작업자 자막번역 리스트
    //번역가 , 검수자 자막번역 리스트
    static getWorkerRequestList = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            let status = 1 , price_field_name = '', price_field_name1 = '', price_field_name2 = '';
            if(global.ROLE[req.decodedUser.user_type - 1] == 'tc')
                status = global.STATUS.indexOf("preparing") + 1;
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                status = global.STATUS.indexOf("tc_complete") + 1;
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer')
                status = global.STATUS.indexOf("translation_complete") + 1;

            if(isNotEmpty(search) && isNotEmpty(search.status) && isArray(search.status)) {
                for(let i = 0; i < search.status.length; i ++) {
                    if( (global.ROLE[req.decodedUser.user_type - 1] == 'tc' && search.status[i] == "tc_complete")
                    || (global.ROLE[req.decodedUser.user_type - 1] == 'translator' && search.status[i] == "translation_complete")
                    || (global.ROLE[req.decodedUser.user_type - 1] == 'reviewer' && search.status[i] == "review_complete") ) {
                        for(let j = global.STATUS.indexOf(search.status[i]) + 1; j < global.STATUS.length; j ++)
                            search.status.push(global.STATUS[j]);
                        break;
                    }
                }
            }

            const userRepository = getRepository(User);
            let _worker_info = await userRepository.findOne(req.decodedUser.id);
            if(_worker_info == undefined)
                return res.json({ errorCode: 15, errorMsg: 'invalid worker id or company id.'})
            let  user_correction_rate = 0;
            if(isEmpty(_worker_info.correction_rate))
                user_correction_rate = 0;
            else
                user_correction_rate = _worker_info.correction_rate;
            let query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail");

            if(global.ROLE[req.decodedUser.user_type - 1] == 'tc') {
                price_field_name = 'company_price.tc_price';
                query = query.addSelect('company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 as request_detail_temp_price');
            }
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'translator') {
                price_field_name = ' \
                ROUND(cast(CASE \
                WHEN request_detail.translate_price_set = \'Y\' \
                THEN request_detail.translate_price_value \
                ELSE company_price.trans_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 \
                END as numeric), 3)';
                price_field_name1 = '"request_detail"."status" >= 4';
                price_field_name2 = '"request_detail"."status" < 4';
                //query = query.addSelect('company_price.trans_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 as request_detail_temp_price');
                query = query.addSelect(' \
                ROUND(cast(CASE \
                WHEN request_detail.translate_price_set = \'Y\' \
                THEN request_detail.translate_price_value \
                ELSE company_price.trans_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 \
                END as numeric), 3) as request_detail_temp_price \
                ') 
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'reviewer') {

                price_field_name1 = '"request_detail"."status" >= 6';
                price_field_name2 = '"request_detail"."status" < 6';

                price_field_name = ' \
                ROUND(cast(CASE \
                WHEN request_detail.review_price_set = \'Y\' \
                THEN request_detail.review_price_value \
                ELSE company_price.test_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 \
                END as numeric), 3)';
                //query = query.addSelect('company_price.test_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 as request_detail_temp_price');
                query = query.addSelect(' \
                ROUND(cast(CASE \
                WHEN request_detail.review_price_set = \'Y\' \
                THEN request_detail.review_price_value \
                ELSE company_price.test_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 \
                END as numeric), 3) as request_detail_temp_price \
                ') 
            }

            query = query.addSelect('ROUND(cast(request_detail_worker.price as numeric), 3)', 'request_detail_worker_price')

            query = query.leftJoinAndSelect("request_detail.request", "trans_request")
                        .leftJoinAndSelect("trans_request.original_language", "working_language")
                        .leftJoinAndSelect("request_detail.translate_language", "working_language A")
                        .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', {worker_type: req.decodedUser.user_type})
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("user.parent", 'parent')
                        .leftJoin('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoinAndSelect('parent.prices', 'company_price', '"company_price"."originalId" = "trans_request"."originalLanguageId" and "company_price"."translateId" = "request_detail"."translateLanguageId"')
                        .leftJoinAndSelect('parent.end_time_settings', 'end_time_setting', '"end_time_setting"."work_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoinAndSelect('parent.screen_time_limit', 'screen_time_limit')
                        .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                        .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = :user_id', {user_id: req.decodedUser.id});

            if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                query = query.leftJoin(UsersTranslatePair, "users_translate_pair", '"trans_request"."originalLanguageId" = "users_translate_pair"."originalId" \
                and "request_detail"."translateLanguageId" = "users_translate_pair"."translateId" \
                and "users_translate_pair"."userId" = :user_id', {user_id: req.decodedUser.id});
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer')
                query = query.leftJoin(UsersWorkingLanguage, "users_working_language", '"request_detail"."translateLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: req.decodedUser.id});
            let sum_query = getConnection()
                        .createQueryBuilder()
                        .select('sum(trans_request.duration) / count(request_detail.id)', 'request_detail_duration_sum');
            if (global.ROLE[req.decodedUser.user_type - 1] == 'tc') {
                sum_query = sum_query.addSelect('sum(company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100) / count(request_detail.id)' , 'temp_price_sum');   
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'translator') {
                //sum_query = sum_query.addSelect('sum(company_price.trans_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100) / count(request_detail.id)' , 'temp_price_sum');   
                sum_query = sum_query.addSelect('ROUND(cast(sum( \
                    CASE \
                    WHEN request_detail.status >= 4 \
                    THEN 0 \
                    WHEN request_detail.translate_price_set = \'Y\' \
                    THEN request_detail.translate_price_value \
                    ELSE company_price.trans_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 \
                    END \
                ) / count(request_detail.id) as numeric), 3)', 'temp_price_sum')
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'reviewer') {
                //sum_query = sum_query.addSelect('sum(company_price.test_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100) / count(request_detail.id)' , 'temp_price_sum');   
                sum_query = sum_query.addSelect('ROUND(cast(sum( \
                    CASE \
                    WHEN request_detail.status >= 6 \
                    THEN 0 \
                    WHEN request_detail.review_price_set = \'Y\' \
                    THEN request_detail.review_price_value \
                    ELSE company_price.test_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 \
                    END \
                ) / count(request_detail.id) as numeric), 3)', 'temp_price_sum')
            }

            sum_query = sum_query.addSelect('ROUND(cast(sum(request_detail_worker.price) / count(request_detail.id) as numeric), 3)', 'work_price_sum')
                        .from(RequestDetail, "request_detail")
                        .leftJoin("request_detail.request", "trans_request")
                        .leftJoin("trans_request.original_language", "woring_language")
                        .leftJoin("request_detail.translate_language", "woring_language A")
                        .leftJoin("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = ' + req.decodedUser.user_type)
                        .leftJoin("trans_request.user", "user")
                        .leftJoin("user.parent", 'parent')
                        .leftJoin('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = \'' + req.decodedUser.user_type.toString() + '\'')
                        .leftJoin('parent.prices', 'company_price', '"company_price"."originalId" = "trans_request"."originalLanguageId" and "company_price"."translateId" = "request_detail"."translateLanguageId"')
                        .leftJoin('parent.end_time_settings', 'end_time_setting', '"end_time_setting"."work_type" =  \'' + req.decodedUser.user_type.toString() + '\'')
                        .leftJoin('parent.screen_time_limit', 'screen_time_limit')
                        .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                        .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = ' + req.decodedUser.id);

            if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                sum_query = sum_query.leftJoin(UsersTranslatePair, "users_translate_pair", '"trans_request"."originalLanguageId" = "users_translate_pair"."originalId" \
                and "request_detail"."translateLanguageId" = "users_translate_pair"."translateId" \
                and "users_translate_pair"."userId" = :user_id', {user_id: req.decodedUser.id});
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer')
                sum_query = sum_query.leftJoin(UsersWorkingLanguage, "users_working_language", '"request_detail"."translateLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: req.decodedUser.id});

            //
            if(global.ROLE[req.decodedUser.user_type - 1] == 'translator') {
                query = query.where(new Brackets(qb => {
                    qb.where('( "users_translate_pair"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) and request_detail.status <= ' + status +') or (request_detail.status > ' + status +' and "request_detail_worker"."userId" = ' + req.decodedUser.id + ')')
                }));
                sum_query = sum_query.where(new Brackets(qb => {
                    qb.where('( "users_translate_pair"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) and request_detail.status <= ' + status +' ) or (request_detail.status > ' + status +' and "request_detail_worker"."userId" = ' + req.decodedUser.id + ')')
                }));
            }
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer'){
                query = query.where(new Brackets(qb => {
                    qb.where('( "users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) and request_detail.status <= ' + status +') or (request_detail.status > ' + status +' and "request_detail_worker"."userId" = ' + req.decodedUser.id + ')')
                }));
                sum_query = sum_query.where(new Brackets(qb => {
                    qb.where('( "users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) and request_detail.status <= ' + status +' ) or (request_detail.status > ' + status +' and "request_detail_worker"."userId" = ' + req.decodedUser.id + ')')
                }));
            }
            //

            if(global.ROLE[req.decodedUser.user_type - 1] == 'tc') {
                query = query.andWhere('"trans_request"."has_original_video" = \'N\'');
                query = query.andWhere('"parent"."has_tc_service" = \'Y\'');
                sum_query = sum_query.andWhere('"trans_request"."has_original_video" = \'N\'');
                sum_query = sum_query.andWhere('"parent"."has_tc_service" = \'Y\'');
            }
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'translator') {
                query = query.andWhere(new Brackets(qb => {
                    qb.where('("request_detail"."status" >= ' + status + ' and "trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\') or ("request_detail"."status" >= ' + (global.STATUS.indexOf("preparing") + 1) + ' and ("trans_request"."has_original_video" != \'N\' or "parent"."has_tc_service" = \'N\'))')
                }));
                sum_query = sum_query.andWhere(new Brackets(qb => {
                    qb.where('("request_detail"."status" >= ' + status + ' and "trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\') or ("request_detail"."status" >= ' + (global.STATUS.indexOf("preparing") + 1) + ' and ("trans_request"."has_original_video" != \'N\' or "parent"."has_tc_service" = \'N\'))')
                }));
            }
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer') {
                query = query.andWhere('"trans_request"."is_native_review" = \'Y\'')
                             .andWhere('"request_detail"."status" >= ' + status);
                sum_query = sum_query.andWhere('"trans_request"."is_native_review" = \'Y\'')
                             .andWhere('"request_detail"."status" >= ' + status);
            }
            if(isNotEmpty(search)) {
                if(isEmpty(search.date_type))
                    return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
                let field_name = '';
                if(search.date_type == 1)
                    field_name = 'request_detail.translate_req_date';
                else if(search.date_type == 2)
                    field_name = 'request_detail_worker.predict_end_date';
                else if(search.date_type == 3)
                    field_name = 'request_detail_worker.end_date';
                //일자 범위 선택
                if(isNotEmpty(search.start_date)) {
                    query = query.andWhere(field_name + ' >= ' + search.start_date);
                    sum_query = sum_query.andWhere(field_name + ' >= ' + search.start_date);
                }
                if(isNotEmpty(search.end_date)) {
                    query = query.andWhere(field_name + ' <= ' + search.end_date);
                    sum_query = sum_query.andWhere(field_name + ' <= ' + search.end_date);
                }
                if (isNotEmpty(search.status) && isArray(search.status) && search.status.length > 0) {
                    let status_query = '1 != 1'
                    for (let i = 0; i < search.status.length; i++) {
                        if (global.ROLE[req.decodedUser.user_type - 1] == 'translator' && search.status[i] == 'tc_complete') {
                            status_query += ' or ("request_detail"."status" = 3) or ("request_detail"."status" = 1 and "trans_request"."has_original_video" != \'N\') or ("request_detail"."status" = 1 and "parent"."has_tc_service" = \'N\')'
                        }
                        else {
                            status_query += ' or "request_detail"."status" = ' + (global.STATUS.indexOf(search.status[i]) + 1)
                        }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(status_query)
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where(status_query)
                    }));
                    /* 
                    let status_query = '"request_detail"."status" = :status1', filter = {};
                    let sum_status_query = '"request_detail"."status" = ' + (global.STATUS.indexOf(search.status[0]) + 1);

                    filter = {
                        ...filter,
                        'status1': global.STATUS.indexOf(search.status[0]) + 1
                    }

                    for(let i = 1; i < search.status.length; i ++) {
                        sum_status_query += ' or "request_detail"."status" = ' + (global.STATUS.indexOf(search.status[i]) + 1);
                        status_query += ' or "request_detail"."status" = :status' + (i + 1);
                        let key = `status${i+1}`
                        filter = {
                            ...filter,
                            [key]: global.STATUS.indexOf(search.status[i]) + 1
                        }
                    }

                    query = query.andWhere(new Brackets(qb => {
                        qb.where(status_query, filter)
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where(sum_status_query)
                    })); */
                }
                if( isNotEmpty(search.original_language) ) {
                    query = query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                    sum_query = sum_query.andWhere('"trans_request"."originalLanguageId" = ' + search.original_language);
                }
                if( isNotEmpty(search.translate_language) ) {
                    query = query.andWhere('"request_detail"."translateLanguageId" = :translate_language', {translate_language: search.translate_language});
                    sum_query = sum_query.andWhere('"request_detail"."translateLanguageId" = ' + search.translate_language);
                }
                if( ( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) &&
                !(isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                 //   query = query.andWhere('"request_detail_worker"."price" >= ' + search.start_work_price);
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('(' + price_field_name1 + ' and ROUND(cast(request_detail_worker.price as numeric), 3) >= ' + search.start_work_price + ') or (' + price_field_name2 + ' and ' + price_field_name + ' >= ' + search.start_work_price + ')')
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where('(' + price_field_name1 + ' and ROUND(cast(request_detail_worker.price as numeric), 3) >= ' + search.start_work_price + ') or (' + price_field_name2 + ' and ' + price_field_name + ' >= ' + search.start_work_price + ')')
                    }));
                }
                else if( !( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) &&
                (isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('(' + price_field_name1 + ' and ROUND(cast(request_detail_worker.price as numeric), 3) <= ' + search.end_work_price + ') or (' + price_field_name2 + ' and ' + price_field_name + ' <= ' + search.end_work_price + ')')
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where('(' + price_field_name1 + ' and ROUND(cast(request_detail_worker.price as numeric), 3) <= ' + search.end_work_price + ') or (' + price_field_name2 + ' and ' + price_field_name + ' <= ' + search.end_work_price + ')')
                    }));
                }
                else if( ( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) &&
                (isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('(' + price_field_name1 + ' and ROUND(cast(request_detail_worker.price as numeric), 3) >= ' + search.start_work_price + ' and ROUND(cast(request_detail_worker.price as numeric), 3) <= ' + search.end_work_price + ') \
                            or (' + price_field_name2 + ' and ' + price_field_name + ' <= ' + search.end_work_price + '\
                            and ' + price_field_name + ' >= ' + search.start_work_price + ')')
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where('(' + price_field_name1 + ' and ROUND(cast(request_detail_worker.price as numeric), 3) >= ' + search.start_work_price + ' and ROUND(cast(request_detail_worker.price as numeric), 3) <= ' + search.end_work_price + ') \
                            or ('+ price_field_name2 + ' and ' + price_field_name + ' <= ' + search.end_work_price + '\
                            and ' + price_field_name + ' >= ' + search.start_work_price + ')')
                    }));
                }
                if( isNotEmpty(search.search_keyword) ) {
                    if(isEmpty(search.keyword_type) || isEmpty(search.search_type))
                         return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' })
                     switch(search.keyword_type) {
                         case 1:
                             field_name = '"trans_request"."title"'
                             break;
                         case 2:
                             field_name = '"request_detail"."id"::varchar(255)'
                             break;
                     }
                     if(search.search_type == 1) {
                         query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                         sum_query = sum_query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                     }
                     else {
                         query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
                         sum_query = sum_query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
                     }
                }
            }
            if(req.decodedUser.user_type == global.ROLE.indexOf('translator') + 1) {
                query = query.orderBy('request_detail.translate_status', "ASC");
                query = query.addOrderBy('request_detail.id', "DESC");
            }
            else {
                query = query.orderBy('request_detail.review_status', "ASC");
                query = query.addOrderBy('request_detail.id', "DESC");
            }
            let totals = await query.getCount()
            sum_query = sum_query.groupBy('request_detail.id');
            let __sum_query = getConnection()
                .createQueryBuilder()
                .select('sum(src.request_detail_duration_sum)', 'duration_sum')
                .addSelect('sum(src.temp_price_sum)', 'work_price_sum1')
                .addSelect('sum(src.work_price_sum)', 'work_price_sum2')
                .from('(' + sum_query.getQuery() + ')', 'src')
                .setParameters(sum_query.getParameters());
            let _result_sum = await __sum_query.getRawOne();
            if(isNotEmpty(table)) {
                query.skip((table.page - 1) * table.page_length)
                .take(table.page_length);
            }

            let _result = await query.getMany();
            let table_data: Array<any>;
            table_data = [];
            for(let i = 0; i < _result.length; i ++) {
                let item = _result[i];
                let table_item: {[k: string]: any} = {};
                table_item = {
                    work_no: item.id, //작업번호
                    title: item.request.title, //제목
                    duration: item.request.duration, //영상길이
                    req_date: ( (req.decodedUser.user_type == global.ROLE.indexOf('translator') + 1) ? item.translate_req_date : item.review_req_date ), //번역가 , 검수자 요청일시
                    youtube_url: item.request.youtube_url
                }
                if(req.decodedUser.user_type == global.ROLE.indexOf('tc') + 1) {
                    table_item.original_language = item.request.original_language.prefix;
                    table_item.video = isEmpty(item.request.tc_video) ? '' : (item.request.tc_video);
                }
                else if(req.decodedUser.user_type == global.ROLE.indexOf('translator') + 1) {
                    table_item.original_language = item.request.original_language.prefix;
                    table_item.translate_language = item.translate_language.prefix;
                    table_item.has_title_translate = item.request.is_title_desc;
                    if(item.request.has_original_video == Trigger.ON)
                        table_item.prev_video = isEmpty(item.request.original_video) ? '' : (item.request.original_video);
                    else
                        table_item.prev_video = isEmpty(item.request.tc_video) ? '' : (item.request.tc_video);
                    table_item.video = isEmpty(item.translate_video) ? '' : (item.translate_video);
                }
                else if(req.decodedUser.user_type == global.ROLE.indexOf('reviewer') + 1) {
                    table_item.has_title_translate = item.request.is_title_desc;
                    table_item.translate_language = item.translate_language.prefix;
                    table_item.prev_video = isEmpty(item.translate_video) ? '' : (item.translate_video);
                    table_item.video = isEmpty(item.review_video) ? '' : (item.review_video);
                }
                let assign_worker_item = null;
                if(isArray(item.workers)) {
                    for(let i = 0; i < item.workers.length; i ++) {
                        if(item.workers[i].worker_type == req.decodedUser.user_type) {
                            assign_worker_item = item.workers[i];
                            break;
                        }
                    }
                }
                if(assign_worker_item != null) {
                    table_item.price = assign_worker_item.price;
                    table_item.predict_end_date = assign_worker_item.predict_end_date;
                    table_item.end_date = assign_worker_item.end_date;
                    table_item.status = 2;
                    if(global.ROLE[req.decodedUser.user_type - 1] == 'tc' && item.status > global.STATUS.indexOf('tc_ing') + 1) {
                        table_item.status  = 3;
                    }
                    else if(global.ROLE[req.decodedUser.user_type - 1] == 'translator' && item.status > global.STATUS.indexOf('translating') + 1) {
                        table_item.status  = 3;
                    }
                    else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer' && item.status > global.STATUS.indexOf('reviewing') + 1) {
                        table_item.status  = 3;
                    }
                }
                else {
                    //대기
                    table_item.status = 1;
                    table_item.price = item.temp_price;
                    table_item.end_date = null;
                    if (global.ROLE[req.decodedUser.user_type - 1] == 'translator') {
                        if (item.translate_predict_time_set == Trigger.ON)
                            table_item.predict_end_date = item.translate_predict_time_value * 60;
                        else
                            table_item.predict_end_date = await calc_working_time(item.request.user.parent.screen_time_limit, item.request.user.parent.end_time_settings, calculate_mins(item.request.duration), req.decodedUser.user_type, item.request.is_urgent) * 60;
                    }
                    else {
                        if (item.review_predict_time_set == Trigger.ON)
                            table_item.predict_end_date = item.review_predict_time_value * 60;
                        else
                            table_item.predict_end_date = await calc_working_time(item.request.user.parent.screen_time_limit, item.request.user.parent.end_time_settings, calculate_mins(item.request.duration), req.decodedUser.user_type, item.request.is_urgent) * 60;
                    }
                    table_item.video = '';
                }
                table_data.push(table_item);
            }
            
            let work_price_sum = 0
            if (!(isEmpty(_result_sum.work_price_sum1) || _result_sum.work_price_sum1 == '0.000'))
                work_price_sum = parseFloat(_result_sum.work_price_sum1)
            if (!(isEmpty(_result_sum.work_price_sum2) || _result_sum.work_price_sum2 == '0.000'))
                work_price_sum += parseFloat(_result_sum.work_price_sum2)
        
            return res.json({ errorCode: 0, errorMsg: "", data: {
                totalCount: totals,
                list: table_data,
                duration_sum: isEmpty(_result_sum.duration_sum) ? 0 : _result_sum.duration_sum,
                work_price_sum: work_price_sum.toFixed(3)
            } });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    //번역가 , 검수자
    /*
    errorCode: 1 - 작업할당 오류
    errorCode: 2 - 이미 번역 , 검수 작업 완료
    errorCode: 3 - 다른 작업자가 먼저 수락하여 수락할수 없습니다.
    errorCode: 4 - 동시작업수량 초과
    */
    static assignWork = async(req: Request, res: Response) => {
        if(((req.decodedUser.user_type == global.ROLE.indexOf('admin') + 1 ) && isEmpty(req.body.worker_id))
        || isEmpty(req.body.work_no) )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        let worker_id = 0, work_no = req.body.work_no;
        try {
            if(req.decodedUser.user_type != global.ROLE.indexOf('admin') + 1)
                worker_id = req.decodedUser.id;
            else
                worker_id = req.body.worker_id;
            //get worker information
            const userRepository = getRepository(User);
            let _worker_info = await userRepository.findOne(worker_id);
            if(_worker_info == undefined)
                return res.json({ errorCode: 15, errorMsg: 'Invalid worker id.' });
            //동시작업량 체크
            if(global.WORK_TYPE.indexOf(_worker_info.user_type) < 0)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            //
            if(_worker_info.can_work == 0)
                return res.json({ errorCode: 4, errorMsg: 'unable to assign work(Simultaneous working quantity is zero.)' });
            if(_worker_info.can_work != -1) {
                let _current_work_count = await current_work_count(worker_id);
                if(_worker_info.can_work <= _current_work_count)
                    return res.json({ errorCode: 4, errorMsg: 'unable to assign work(Simultaneous working quantity exceeded.)' });
            }
            //자막번역 요청값 가져오기
            let query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail");
            query = query.leftJoinAndSelect("request_detail.request", "trans_request")
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("user.parent", "parent")
                         .leftJoinAndSelect("request_detail.workers", "request_detail_worker")
                         .leftJoinAndSelect("request_detail.translate_language", "woring_language A")
                         .leftJoinAndSelect("trans_request.original_language", "woring_language")
                         .where('"request_detail"."id" = :work_no', {work_no: work_no});

            let lang_query = getRepository(RequestDetail)
                            .createQueryBuilder("request_detail")
                            .leftJoinAndSelect("request_detail.request", "trans_request")
                            .leftJoinAndSelect("trans_request.user", "user");

            if(req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1)
                lang_query = lang_query.leftJoin(UsersTranslatePair, "users_translate_pair", '"trans_request"."originalLanguageId" = "users_translate_pair"."originalId" \
                and "request_detail"."translateLanguageId" = "users_translate_pair"."translateId" \
                and "users_translate_pair"."userId" = :user_id', {user_id: worker_id});
            else if(req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1)
                lang_query = lang_query.leftJoin(UsersWorkingLanguage, "users_working_language", '"request_detail"."translateLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: worker_id});
            let _request_detail = await query.getOne();

            if(_request_detail == undefined)
                return res.json({ errorCode: 15, errorMsg: "Invalid work-no id." });

            //상한 상태값 체크
            if( (global.ROLE[_worker_info.user_type - 1] == 'tc' && _request_detail.status >= (global.STATUS.indexOf("tc_complete") + 1))
            ||  (global.ROLE[_worker_info.user_type - 1] == 'translator' && _request_detail.status >= (global.STATUS.indexOf("translation_complete") + 1))
            || (global.ROLE[_worker_info.user_type - 1] == 'reviewer' && _request_detail.status >= (global.STATUS.indexOf("review_complete") + 1)))
                return res.json({ errorCode: 2, errorMsg: "This worker no is already finished." });
            //하한 상태값 체크
            if(global.ROLE[_worker_info.user_type - 1] == 'translator'
                && _request_detail.status < (global.STATUS.indexOf("tc_complete") + 1)
                && _request_detail.request.has_original_video == Trigger.OFF
                && _request_detail.request.user.parent.has_tc_service == Trigger.ON)
                return res.json({ errorCode: 1, errorMsg: "unable to assign work(This work no should be passed tc work.)" });
            if(global.ROLE[_worker_info.user_type - 1] == 'reviewer'
                && _request_detail.status < (global.STATUS.indexOf("translation_complete") + 1))
                return res.json({ errorCode: 1, errorMsg: "unable to assign work(This work no should be passed translate work.)" });
            //원본 동영상 있는 경우 tc작업 필요 없음
            if(global.ROLE[_worker_info.user_type - 1] == 'tc' && (_request_detail.request.has_original_video == Trigger.ON || _request_detail.request.user.parent.has_tc_service == Trigger.OFF) )
                return res.json({ errorCode: 1, errorMsg: "unable to assign work(This work no doesn't need tc work.)" });
            //원어민 검수요청이 OFF인 경우 검수작업 필요 없음
            if(global.ROLE[_worker_info.user_type - 1] == 'reviewer' && _request_detail.request.is_native_review == Trigger.OFF)
                return res.json({ errorCode: 1, errorMsg: "unable to assign work(This work no doesn't need reviewer work.)" });

            //고객사 태그 설정 && 작업자 태그 매칭
            if(req.decodedUser.user_type != global.ROLE.indexOf("admin") + 1) {

                if(global.ROLE[_worker_info.user_type - 1] == 'translator' && ( _request_detail.status == global.STATUS.indexOf("translating") + 1 ))
                    return res.json({ errorCode: 3, errorMsg: "The worker is already assigned by another translate worker." });
                if(global.ROLE[_worker_info.user_type - 1] == 'reviewer' && ( _request_detail.status == global.STATUS.indexOf("reviewing") + 1 ))
                    return res.json({ errorCode: 3, errorMsg: "The worker is already assigned by another review worker." });

                let involved = false;
                let _company = await userRepository.findOne(_request_detail.request.user.parent_id)
                if(_company == undefined)
                    return res.json({ errorCode: 15, errorMsg: "Invalid company id." });
                if(!(isArray(_company.assigns) && _company.assigns.length > 0))
                    return res.json({ errorCode: 15, errorMsg: "There is no worker assign setting in company id." });
                for(let i = 0; i < _company.assigns.length; i ++) {
                    if(_company.assigns[i].worker_type == _worker_info.user_type) {
                        if(_company.assigns[i].assign_type == 2)
                            return res.json({ errorCode: 1, errorMsg: "unable to assign work(Manual assignment operation cannot be accepted with general user rights.)" });
                        else if(_company.assigns[i].tag_type == 2)
                            involved = true;
                        else {
                            let _tags = [];
                            if(isArray(_worker_info.tags)) {
                                for(let j = 0; j < _worker_info.tags.length; j ++)
                                    _tags.push(_worker_info.tags[j].tag.id);
                            }
                            if(isArray(_company.assigns[i].setting_tags)) {
                                for(let j = 0; j < _company.assigns[i].setting_tags.length; j ++)
                                    if(_tags.indexOf(_company.assigns[i].setting_tags[j].tag.id) >= 0) {
                                        involved = true;
                                        break;
                                    }
                            }
                        }
                        break;
                    }
                }
                if(!involved)
                    return res.json({ errorCode: 1, errorMsg: "unable to assign work(Worker and Company don't have the matching tags.)" });
            }
            //언어 체크
            let lang_check_count = await lang_query.getCount();
            if(lang_check_count < 1)
                return res.json({ errorCode: 1, errorMsg: 'unable to assign work(Language not matching.)'});
            //update request detail
            if(global.ROLE[_worker_info.user_type - 1] == 'tc') {
                _request_detail.status = global.STATUS.indexOf("tc_ing") + 1;
            }
            else if(global.ROLE[_worker_info.user_type - 1] == 'translator') {
                _request_detail.status = global.STATUS.indexOf("translating") + 1;
                _request_detail.translate_status = 2;
            }
            else if(global.ROLE[_worker_info.user_type - 1] == 'reviewer') {
                _request_detail.status = global.STATUS.indexOf("reviewing") + 1;
                _request_detail.review_status = 2;
            }
            _request_detail.update_date = Math.floor(Date.now() / 1000);
            //update trans request
            let _trans_request = _request_detail.request;
            if(_trans_request.status < _request_detail.status)
                _trans_request.status = _request_detail.status;
            await getConnection().manager.save(_trans_request);
            //
            let is_update = false
            let _request_detail_work;
            if(isArray(_request_detail.workers)) {
                for(let i = 0; i < _request_detail.workers.length; i ++) {
                    if(_request_detail.workers[i].worker_type == _worker_info.user_type) {
                        is_update = true;
                        _request_detail_work = _request_detail.workers[i];
                        break;
                    }
                }
            }
            if(!is_update || _request_detail_work == undefined) {
                _request_detail_work = new RequestDetailWorker();
                _request_detail_work.create_date = Math.floor(Date.now() / 1000);
                _request_detail_work.update_date = Math.floor(Date.now() / 1000);
            }
            else {
                _request_detail_work.update_date = Math.floor(Date.now() / 1000);
            }
            _request_detail_work.worker_type = _worker_info.user_type;
            _request_detail_work.user = _worker_info;
            //set price
            _request_detail_work.price = 0;
            /*
            _request_detail_work.price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, _worker_info.correction_rate, _worker_info.user_type, _request_detail.request.original_language.id, _request_detail.translate_language.id)
            if(global.ROLE[_worker_info.user_type - 1] == 'translator')
                _request_detail.translate_work_price = _request_detail_work.price;
            else
                _request_detail.review_work_price = _request_detail_work.price;
            */
            if (global.ROLE[_worker_info.user_type - 1] == 'translator') {
                if (_request_detail.translate_price_set == Trigger.ON)
                    _request_detail.translate_work_price = _request_detail.translate_price_value
                else {
                    _request_detail_work.price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, _worker_info.correction_rate, _worker_info.user_type, _request_detail.request.original_language.id, _request_detail.translate_language.id)        
                    _request_detail.translate_work_price = _request_detail_work.price;    
                }
            }
            else if (global.ROLE[_worker_info.user_type - 1] == 'reviewer') {
                if (_request_detail.review_price_set == Trigger.ON)
                    _request_detail.review_work_price = _request_detail.review_price_value
                else {
                    _request_detail_work.price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, _worker_info.correction_rate, _worker_info.user_type, _request_detail.request.original_language.id, _request_detail.translate_language.id)        
                    _request_detail.review_work_price = _request_detail_work.price;
                }
            }
            let _ret_request_detail = await getConnection().manager.save(_request_detail);
            _request_detail_work.request_detail = _request_detail;
            //calculate work_time
            let _predict_time = 0;

            if (_request_detail.translate_predict_time_set == Trigger.ON && global.ROLE[_worker_info.user_type - 1] == 'translator')
                _predict_time = _request_detail.translate_predict_time_value;
            else if (_request_detail.review_predict_time_set == Trigger.ON && global.ROLE[_worker_info.user_type - 1] == 'reviewer')
                _predict_time = _request_detail.review_predict_time_value;
            else
                _predict_time = await calculate_predict_time(_request_detail.request.user.parent_id, calculate_mins(_request_detail.request.duration), _worker_info.user_type, _request_detail.request.is_urgent);            
            _request_detail_work.predict_end_date = _request_detail_work.update_date + _predict_time * 60;
            await getConnection().manager.save(_request_detail_work);

            //진행기록
            let _log = new Log();
            _log.create_date = Math.floor(Date.now() / 1000);
            _log.update_date = Math.floor(Date.now() / 1000);
            _log.user = _worker_info;
            _log.request = _request_detail;
            if(global.ROLE[_worker_info.user_type - 1] == 'translator') {
                _log.status = global.STATUS.indexOf("translating") + 1;
            }
            else {
                _log.status = global.STATUS.indexOf("reviewing") + 1;
            }
            await getConnection().manager.save(_log);

            if (isNotEmpty(req.body.manual) && req.body.manual) {
                let _notice = new Notice();
                _notice.create_date = Math.floor(Date.now() / 1000);
                _notice.update_date = Math.floor(Date.now() / 1000);
                _notice.user = _worker_info;    
                _notice.request = _ret_request_detail;
                _notice.type = 17;
                let _notice_ret = await getConnection().manager.save(_notice);
                insertNoticeUser(_worker_info, _notice_ret);

                if (global.ROLE[_worker_info.user_type - 1] == 'translator') {
                    webPush([_worker_info.player_id], _worker_info.system_lang, convertTranslateMsg(lang[_worker_info.system_lang]["web_push"]['translator_a04'], {
                        title: _request_detail.request.title,
                        org_lang: lang[_worker_info.system_lang]["language"][_request_detail.request.original_language.id - 1],
                        dst_lang: lang[_worker_info.system_lang]["language"][_request_detail.translate_language.id - 1]
                    }))
                }
                else {
                    webPush([_worker_info.player_id], _worker_info.system_lang, convertTranslateMsg(lang[_worker_info.system_lang]["web_push"]['reviewer_a04'], {
                        title: _request_detail.request.title,
                        dst_lang: lang[_worker_info.system_lang]["language"][_request_detail.translate_language.id - 1]
                    }))
                }

                if (_worker_info.is_sms_notice_on == Trigger.ON) {
                    if (_worker_info.country_code == '+82' && _worker_info.system_lang == 'KO') {
                        let template_obj: { [k: string]: any } = {};   
                        template_obj.title = _request_detail.request.title;
                        template_obj.dst_lang = lang[_worker_info.system_lang]["language"][_request_detail.translate_language.id - 1]
                        template_obj.predict_end_date = _request_detail_work.predict_end_date
                        template_obj.site_url = config.SITE_URL;   
                        if (global.ROLE[_worker_info.user_type - 1] == 'translator') {
                            template_obj.org_lang = lang[_worker_info.system_lang]["language"][_request_detail.request.original_language.id - 1];
                            sendTalk(parseInt(_worker_info.country_code.substring(1, _worker_info.country_code.length)), _worker_info.phone_number, _worker_info.system_lang, 'translator_a04', template_obj)               
                        }
                        else {
                            sendTalk(parseInt(_worker_info.country_code.substring(1, _worker_info.country_code.length)), _worker_info.phone_number, _worker_info.system_lang, 'reviewer_a04', template_obj)               
                        }
                    }
                    else if (_worker_info.country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = '';
                        if (global.ROLE[_worker_info.user_type - 1] == 'translator') {
                            msg = convertTranslateMsg(lang[_worker_info.system_lang]["sms"]['translator_a04'], {
                                title: _request_detail.request.title,
                                org_lang: lang[_worker_info.system_lang]["language"][_request_detail.request.original_language.id - 1],
                                dst_lang: lang[_worker_info.system_lang]["language"][_request_detail.translate_language.id - 1]
                            });       
                        }
                        else {
                            msg = convertTranslateMsg(lang[_worker_info.system_lang]["sms"]['reviewer_a04'], {
                                title: _request_detail.request.title,
                                dst_lang: lang[_worker_info.system_lang]["language"][_request_detail.translate_language.id - 1]
                            });       
                        }

                        sendSms(parseInt(_worker_info.country_code.substring(1, _worker_info.country_code.length)), _worker_info.phone_number, _worker_info.system_lang, msg)
                    }
                }
                if (_worker_info.is_email_notice_on == Trigger.ON) {
                    let template_obj: { [k: string]: any } = {};   
                    template_obj.title = _request_detail.request.title;
                    template_obj.dst_lang = lang[_worker_info.system_lang]["language"][_request_detail.translate_language.id - 1]
                    template_obj.predict_end_date = _request_detail_work.predict_end_date
                    template_obj.site_url = config.SITE_URL;   
                    if (global.ROLE[_worker_info.user_type - 1] == 'translator') {
                        template_obj.org_lang = lang[_worker_info.system_lang]["language"][_request_detail.request.original_language.id - 1]
                        sendEmail(_worker_info.user_email, _worker_info.system_lang, lang[_worker_info.system_lang]['email']['translator_a04'], 'translator_a04', template_obj)       
                    }
                    else {
                        sendEmail(_worker_info.user_email, _worker_info.system_lang, lang[_worker_info.system_lang]['email']['reviewer_a04'], 'reviewer_a04', template_obj)       
                    }
                }
            }
            //
            return res.json({
                errorCode: 0, errorMsg: "", data: {
                    user_id: _worker_info.login_id,
                    user_no: _worker_info.id,
                    user_name: _worker_info.user_name,
                    status: (global.ROLE[_worker_info.user_type - 1] == 'translator' ? 'translating' : 'reviewing')
            }});
        }
        catch( error ) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static detailCheck = async (req: Request, res: Response) => {
        const { work_no } = req.body;
        if(isEmpty(work_no))
            return res.json({ errorCode: 1, errorMsg: 'Invalid Parameter' })
        try {
            let query = getRepository(RequestDetail)
                .createQueryBuilder("request_detail")
                .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', { worker_type: req.decodedUser.user_type })
                .leftJoinAndSelect("request_detail_worker.user", "worker")
                .where('"request_detail"."id" = :work_no', { work_no: work_no });
            let _request_detail = await query.getOne();

            if(_request_detail == undefined)
                return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.' });
            
            if (req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) {
                if ((_request_detail.status >= global.STATUS.indexOf("translating") + 1)
                    && isArray(_request_detail.workers) && _request_detail.workers.length > 0
                    && _request_detail.workers[0].user.id != req.decodedUser.id)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.' });
                else
                    return res.json({ errorCode: 0, errorMsg: ''})    
            }
            else if (req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1) {
                if ((_request_detail.status >= global.STATUS.indexOf("reviewing") + 1)
                    && isArray(_request_detail.workers) && _request_detail.workers.length > 0
                    && _request_detail.workers[0].user.id != req.decodedUser.id)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.' });
                else
                    return res.json({ errorCode: 0, errorMsg: ''})
            }
            else 
                return res.json({ errorCode: 0, errorMsg: ''})
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 1, errorMsg: 'Internal Server Error' })
        }
    }
    static detail = async(req: Request, res: Response) => {
        const { work_no } = req.body;
        if(isEmpty(work_no))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            let query = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail");
            query = query.leftJoinAndSelect("request_detail.request", "trans_request")
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("user.parent", "parent")
                        .leftJoinAndSelect('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', {worker_type: req.decodedUser.user_type})
                        .leftJoinAndSelect("request_detail_worker.user", "worker")
                        .leftJoinAndSelect('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                        .leftJoinAndSelect('worker_assign_setting_tag.tag', 'tag')
                        .leftJoinAndSelect('parent.end_time_settings', 'end_time_setting', '"end_time_setting"."work_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoinAndSelect('parent.screen_time_limit', 'screen_time_limit')
                        .leftJoinAndSelect("request_detail.translate_language", "woring_language A")
                        .leftJoinAndSelect("trans_request.original_language", "woring_language")
                        .where('"request_detail"."id" = :work_no', {work_no: work_no});

            let lang_query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail")
                        .leftJoinAndSelect("request_detail.request", "trans_request")
            if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                lang_query = lang_query.leftJoin(UsersTranslatePair, "users_translate_pair", '"trans_request"."originalLanguageId" = "users_translate_pair"."originalId" \
                and "request_detail"."translateLanguageId" = "users_translate_pair"."translateId" \
                and "users_translate_pair"."userId" = :user_id', {user_id: req.decodedUser.id});
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer')
                lang_query = lang_query.leftJoin(UsersWorkingLanguage, "users_working_language", '"request_detail"."translateLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: req.decodedUser.id});

            lang_query = lang_query.where('"request_detail"."id" = :work_no', {work_no: work_no});

            let _request_detail = await query.getOne();
            if(_request_detail == undefined)
                return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
            let data: {[k: string]: any} = {};
            let userRepository = getRepository(User);
            let _worker_info = await userRepository.findOne(req.decodedUser.id)
            if(_worker_info == undefined)
                return res.json({ errorCode: 15, errorMsg: 'invalid your id.'});
            if(!(isArray(_request_detail.workers) && _request_detail.workers.length > 0)){
                //status 체크
                if(req.decodedUser.user_type == global.ROLE.indexOf('tc') + 1) {
                    //원본동영상 업로드 , tc???
                    if( _request_detail.request.has_original_video == Trigger.ON || _request_detail.request.user.parent.has_tc_service == Trigger.OFF)
                        return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
                }
                else if(req.decodedUser.user_type == global.ROLE.indexOf('translator') + 1) {
                    if(_request_detail.request.has_original_video == Trigger.OFF && _request_detail.request.user.parent.has_tc_service == Trigger.ON && global.STATUS.indexOf('tc_complete') + 1 > _request_detail.status)
                        return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
                }
                else if(req.decodedUser.user_type == global.ROLE.indexOf('reviewer') + 1) {
                    //원어민 검수 여부???
                    if(_request_detail.request.is_native_review == Trigger.OFF)
                        return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
                    if(global.STATUS.indexOf('translation_complete') + 1 > _request_detail.status)
                        return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
                }
                //언어 체크
                let lang_check_count = await lang_query.getCount();
                if(lang_check_count < 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.(language not matching)'});
                //대기
                if(isEmpty(_request_detail.request.user) || isEmpty(_request_detail.request.user.parent))
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
                if( !isArray(_request_detail.request.user.parent.assigns) )
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});

                //수동할당 체크
                if(_request_detail.request.user.parent.assigns[0].assign_type == 2)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});

                //자동할당 tag 체크
                let _tags = [], involved = false;
                if(isArray(_worker_info.tags)) {
                    for(let i = 0; i < _worker_info.tags.length; i ++)
                        _tags.push(_worker_info.tags[i].tag.id)
                }
                //전체선택 태그
                if(_request_detail.request.user.parent.assigns[0].tag_type == 2)
                    involved = true;
                else if(isArray( _request_detail.request.user.parent.assigns[0].setting_tags)) {
                    for(let i = 0; i < _request_detail.request.user.parent.assigns[0].setting_tags.length; i ++)
                        if(_tags.indexOf(_request_detail.request.user.parent.assigns[0].setting_tags[i].tag.id) >= 0) {
                            involved = true;
                            break;
                        }
                }
                if(!involved)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no. (tag not matching)'});
            }
            else {
                if(_request_detail.workers[0].user.id != req.decodedUser.id)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this work_no.'});
            }
            data = {
                work_no: _request_detail.id,
                youtube_url: _request_detail.request.youtube_url,
                title: _request_detail.request.title,
                duration: _request_detail.request.duration,
                video: '',
                video_link: ''
            }
            if(isArray(_request_detail.workers) && _request_detail.workers.length > 0) {
                data.price = _request_detail.workers[0].price;
                if(isEmpty(_request_detail.workers[0].end_date))
                    data.end_date = _request_detail.workers[0].predict_end_date;
                else
                    data.end_date = _request_detail.workers[0].end_date;
            }
            else {
                if (req.decodedUser.user_type == global.ROLE.indexOf('translator') + 1) {
                    if (_request_detail.translate_price_set == Trigger.ON)
                        data.price = _request_detail.translate_price_value
                    else
                        data.price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, _worker_info.correction_rate, _worker_info.user_type, _request_detail.request.original_language.id, _request_detail.translate_language.id);
                }
                else if (req.decodedUser.user_type == global.ROLE.indexOf('reviewer') + 1) {
                    if (_request_detail.review_price_set == Trigger.ON)
                        data.price = _request_detail.review_price_value
                    else
                        data.price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, _worker_info.correction_rate, _worker_info.user_type, _request_detail.request.original_language.id, _request_detail.translate_language.id);
                }
                data.end_date = await calc_working_time(_request_detail.request.user.parent.screen_time_limit, _request_detail.request.user.parent.end_time_settings, calculate_mins(_request_detail.request.duration), req.decodedUser.user_type, _request_detail.request.is_urgent) * 60;
                data.can_work = true;
                if(_worker_info.can_work == 0)
                    data.can_work = false;
                if(_worker_info.can_work != -1) {
                    let _current_work_count = await current_work_count(req.decodedUser.id);
                    if(_worker_info.can_work <= _current_work_count)
                        data.can_work = false;
                }
                data.can_work_count = _worker_info.can_work
            }
            if(req.decodedUser.user_type == global.ROLE.indexOf('tc') + 1) {
                data.video = isEmpty(_request_detail.request.tc_video) ? '' : _request_detail.request.tc_video;
                data.video_link = isEmpty(_request_detail.request.tc_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.request.tc_video);
                data.original_language = _request_detail.request.original_language.name;
                if(_request_detail.status <= global.STATUS.indexOf('preparing') + 1)
                    data.status = 1;
                else if(_request_detail.status >= global.STATUS.indexOf('tc_complete') + 1)
                    data.status = 3;
                else
                    data.status = 2;
            }
            else if(req.decodedUser.user_type == global.ROLE.indexOf('translator') + 1) {
                data.has_title_translate = _request_detail.request.is_title_desc;
                data.original_language = _request_detail.request.original_language.name;
                data.translate_language = _request_detail.translate_language.name;

                data.original_title = _request_detail.request.title;
                data.original_description = _request_detail.request.description;
                data.translate_title = _request_detail.translate_title;
                data.translate_description = _request_detail.translate_description;

                data.memo = _request_detail.request.memo;
                data.video = isEmpty(_request_detail.translate_video) ? '' : _request_detail.translate_video
                data.video_link = isEmpty(_request_detail.translate_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.translate_video);

                if(_request_detail.request.has_original_video == 'Y'){
                    data.prev_video = isEmpty(_request_detail.request.original_video_show_name) ? '' : _request_detail.request.original_video_show_name;
                    data.prev_video_link = isEmpty(_request_detail.request.original_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.request.original_video);
                }
                else {
                    data.prev_video = isEmpty(_request_detail.request.tc_video) ? '' : _request_detail.request.tc_video;
                    data.prev_video_link = isEmpty(_request_detail.request.tc_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.request.tc_video);
                }

                if(_request_detail.status <= global.STATUS.indexOf('tc_complete') + 1)
                    data.status = 1;
                else if(_request_detail.status >= global.STATUS.indexOf('translation_complete') + 1)
                    data.status = 3;
                else
                    data.status = 2;
                
            }
            else if(req.decodedUser.user_type == global.ROLE.indexOf('reviewer') + 1) {
                data.has_title_translate = _request_detail.request.is_title_desc;
                
                data.translate_description = _request_detail.translate_description;
                data.translate_title = _request_detail.translate_title;
                data.review_description = _request_detail.review_description;
                data.review_title = _request_detail.review_title;

                data.video = isEmpty(_request_detail.review_video) ? '' : _request_detail.review_video;
                data.video_link = isEmpty(_request_detail.review_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.review_video);
                data.translate_language = _request_detail.translate_language.name;
                data.memo = _request_detail.request.memo;
                //번역자막
                data.prev_video = isEmpty(_request_detail.translate_video) ? '' : _request_detail.translate_video;
                data.prev_video_link = isEmpty(_request_detail.translate_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.translate_video);
                if(_request_detail.status <= global.STATUS.indexOf('translation_complete') + 1)
                    data.status = 1;
                else if(_request_detail.status >= global.STATUS.indexOf('review_complete') + 1)
                    data.status = 3;
                else
                    data.status = 2;
            }
            let status = 1;
            if(global.ROLE[req.decodedUser.user_type - 1] == 'tc')
                status = global.STATUS.indexOf("tc_complete") + 1;
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                status = global.STATUS.indexOf("translation_complete") + 1;
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer')
                status = global.STATUS.indexOf("review_complete") + 1;
            //진행기록 미정
            let log_query = getRepository(Log)
                            .createQueryBuilder("log")
                            .leftJoinAndSelect("log.request", "request_detail")
                            .leftJoinAndSelect("request_detail.request", "parent_request")
                            .leftJoinAndSelect("log.trans_request", "trans_request")
                            .leftJoinAndSelect("trans_request.details", "child_detail")
                            .leftJoinAndSelect("log.user", "user")
                            .where(new Brackets(qb => {
                                qb.where('"request_detail"."id" = ' + work_no + ' or "child_detail"."id" = ' + work_no)
                            }));
            log_query = log_query.andWhere('"log"."status" <= ' + status)
            log_query = log_query.orderBy('"log"."create_date"');
            let _logs = await log_query.getMany();
            data.logs = []
            if(isArray(_logs)) {
                for(let i = 0; i < _logs.length; i ++)
                    data.logs.push({
                        log_date: _logs[i].create_date,
                        status: global.STATUS[_logs[i].status - 1],
                        user_type: global.ROLE[_logs[i].user.user_type - 1],
                        user_name: _logs[i].user.user_name,
                        user_id: _logs[i].user.login_id
                    })
            }
            //
            return res.json({errorCode: 0, errorMsg: '', data: data});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default SubtitleWorkerController;
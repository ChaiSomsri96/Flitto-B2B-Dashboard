import { getRepository, getConnection, Brackets } from "typeorm"
import { TransRequest } from './../entity/trans-request'
import { RequestDetail } from './../entity/request-detail'
import { Notice } from './../entity/notice'
import { User } from './../entity/user'
import config from './../config/config'
import { Trigger } from "./../entity/entity-enum"
import { sendTalk, sendSms, sendEmail, webPush } from "./notice-method"
import { convertTranslateMsg, insertNoticeUser } from './db-util'
import { calc_working_time } from './utils'
import { isArray } from 'class-validator'
import lang from './../lang/index'

export const adminA08A09 = async (_admins: User[], _type: number) => {
    try {
        let query = getRepository(TransRequest)
            .createQueryBuilder("trans_request")
            .leftJoinAndSelect("trans_request.user", "user")
            .leftJoinAndSelect("trans_request.details", "request_detail")
            .leftJoinAndSelect("user.parent", "parent")
            .leftJoinAndSelect("trans_request.original_language", "original_language")
            .leftJoinAndSelect("request_detail.translate_language", "translate_language")
            .leftJoin(Notice, "notice", '"trans_request"."id" = "notice"."transRequestId" and "notice"."type" = ' + _type)
            .where('"trans_request"."is_end" = \'N\'')
            .andWhere('"notice"."id" is NULL');
        
        if(_type == 8)
            query = query.andWhere('"trans_request"."predict_end_date" <= ' + (Math.floor(Date.now() / 1000) + 7200))
        else if (_type == 9)
            query = query.andWhere('"trans_request"."predict_end_date" <= ' + Math.floor(Date.now() / 1000))
        
        let _result = await query.getMany()
        for (let i = 0; i < _result.length; i++) {
            //알림추가
            let _notice = new Notice();
            _notice.create_date = Math.floor(Date.now() / 1000);
            _notice.update_date = Math.floor(Date.now() / 1000);
            _notice.trans_request = _result[i]
            _notice.type = _type
            _notice.user = _result[i].user
            _notice.is_read = Trigger.OFF
            let _notice_ret = await getConnection().manager.save(_notice);
            //
            let template_obj: { [k: string]: any } = {};
            template_obj.companyname = _result[i].user.parent.company_name
            template_obj.companyid = _result[i].user.parent.login_id
            template_obj.username = _result[i].user.user_name
            template_obj.userid = _result[i].user.login_id
            template_obj.title = _result[i].title
            template_obj.youtube_url = _result[i].youtube_url      
            template_obj.org_lang = _result[i].original_language.name
            template_obj.dst_lang = []
            if (isArray(_result[i].details)) {
                for (let j = 0; j < _result[i].details.length; j++)
                    template_obj.dst_lang.push(_result[i].details[j].translate_language.name)
            }
            template_obj.req_date = _result[i].create_date
            template_obj.predict_end_date = _result[i].predict_end_date
            template_obj.site_url = config.SITE_URL

            //admin
            for (let j = 0; j < _admins.length; j++) {
                let langPairs = lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1] + '->' + lang[_admins[j].system_lang]["language"][_result[i].details[0].translate_language.id - 1]
                if (isArray(_result[i].details)) {
                    for (let k = 1; k < _result[i].details.length; k ++)
                        langPairs += ', ' + lang[_admins[j].system_lang]["language"][_result[i].details[k].translate_language.id - 1]
                }
                insertNoticeUser(_admins[j], _notice_ret)
                if (_type == 8)
                    webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a08"], { title: _result[i].title, lang: langPairs }))   
                else if (_type == 9)
                    webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a09"], { title: _result[i].title, lang: langPairs }))   
            }
            for (let j = 0; j < _admins.length; j++) {
                
                template_obj.org_lang = lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1]
                template_obj.dst_lang = []
                if (isArray(_result[i].details)) {
                    for (let k = 0; k < _result[i].details.length; k ++)
                        template_obj.dst_lang.push(lang[_admins[j].system_lang]["language"][_result[i].details[k].translate_language.id - 1])
                }

                if (_admins[j].is_sms_notice_on == Trigger.ON) {
                    if (_admins[j].country_code == '+82' && _admins[j].system_lang == 'KO') {
                        if (_type == 8)
                            sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a08', template_obj)    
                        else if (_type == 9)
                            sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a09', template_obj)    
                    }
                    else if (_admins[j].country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let langPairs = lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1] + '->' + lang[_admins[j].system_lang]["language"][_result[i].details[0].translate_language.id - 1]
                        if (isArray(_result[i].details)) {
                            for (let k = 1; k < _result[i].details.length; k ++)
                                langPairs += ', ' + lang[_admins[j].system_lang]["language"][_result[i].details[k].translate_language.id - 1]
                        }
                        let msg = '';
                        if (_type == 8)
                            msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a08"],
                            {
                                username: _result[i].user.user_name,
                                title: _result[i].title,
                                lang: langPairs
                            });
                        else if (_type == 9)
                            msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a09"],
                            {
                                username: _result[i].user.user_name,
                                title: _result[i].title,
                                lang: langPairs
                            });
                        sendSms(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, msg)        
                    }
                }
                if (_admins[j].is_email_notice_on == Trigger.ON) {
                    if(_type == 8)
                        sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a08'], 'admin_a08', template_obj)    
                    else if (_type == 9)
                        sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a09'], 'admin_a09', template_obj)    
                }
            }
        }
    }
    catch (error) {
    }
}

export const adminA0406 = async (_admins: User[], _type: number) => {
    try {
        let query = getRepository(RequestDetail)
            .createQueryBuilder("request_detail")
            .leftJoinAndSelect("request_detail.request", "trans_request")
            .leftJoinAndSelect("trans_request.user", "user")
            .leftJoinAndSelect("user.parent", "parent")
            .leftJoinAndSelect("parent.screen_time_limit", "screen_time_limit")
            .leftJoinAndSelect("parent.end_time_settings", "end_time_setting")
            .leftJoinAndSelect("trans_request.original_language", "original_language")
            .leftJoinAndSelect("request_detail.translate_language", "translate_language")
            .leftJoin(Notice, "notice", '"request_detail"."id" = "notice"."requestId" and "notice"."type" = ' + _type);
        if (_type == 6) {
            query = query.where(new Brackets(qb => {
                qb.where('("request_detail"."status" = 1 and ("trans_request"."has_original_video" = \'Y\' or "parent"."has_tc_service" = \'N\')) or ("request_detail"."status" = 3 and "trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\')');
            }));
            query = query.andWhere('"request_detail"."translate_req_date" <= ' + (Math.floor(Date.now() / 1000) - 7200))
        }
            
        if (_type == 7) {
            query = query.where('"request_detail"."status" = 5')
                .andWhere('"trans_request"."is_native_review" = \'Y\'')
                .andWhere('"request_detail"."review_req_date" <= ' + (Math.floor(Date.now() / 1000) - 7200))
        }
        query = query.andWhere('"notice"."id" is NULL')
        let _result = await query.getMany()
        for (let i = 0; i < _result.length; i++) { 
            //알림추가
            let _notice = new Notice();
            _notice.create_date = Math.floor(Date.now() / 1000);
            _notice.update_date = Math.floor(Date.now() / 1000);
            _notice.request = _result[i]
            _notice.type = _type
            _notice.user = _result[i].request.user
            _notice.is_read = Trigger.OFF
            let _notice_ret = await getConnection().manager.save(_notice);
            //
            let template_obj: { [k: string]: any } = {};

            template_obj.companyname = _result[i].request.user.parent.company_name
            template_obj.companyid = _result[i].request.user.parent.login_id
            template_obj.username = _result[i].request.user.user_name
            template_obj.userid = _result[i].request.user.login_id
            template_obj.title = _result[i].request.title
            template_obj.youtube_url = _result[i].request.youtube_url

            if(_type == 6)
                template_obj.org_lang = _result[i].request.original_language.name
            
            template_obj.dst_lang = _result[i].translate_language.name

            if (_type == 6) {
                template_obj.req_date = _result[i].translate_req_date
                //template_obj.predict_end_date = (await calc_working_time(_result[i].request.user.parent.screen_time_limit, _result[i].request.user.parent.end_time_settings, _result[i].request.duration_minute, 5, _result[i].request.is_urgent)) * 60 + _result[i].translate_req_date
                template_obj.predict_end_date = await calc_working_time(_result[i].request.user.parent.screen_time_limit, _result[i].request.user.parent.end_time_settings, _result[i].request.duration_minute, 5, _result[i].request.is_urgent)
            } 
            else if (_type == 7) {
                template_obj.req_date = _result[i].review_req_date
                //template_obj.predict_end_date = (await calc_working_time(_result[i].request.user.parent.screen_time_limit, _result[i].request.user.parent.end_time_settings, _result[i].request.duration_minute, 6, _result[i].request.is_urgent)) * 60 + _result[i].review_req_date
                template_obj.predict_end_date = await calc_working_time(_result[i].request.user.parent.screen_time_limit, _result[i].request.user.parent.end_time_settings, _result[i].request.duration_minute, 6, _result[i].request.is_urgent)
            }
            template_obj.site_url = config.SITE_URL;

            //admin
            for (let j = 0; j < _admins.length; j++) {
                insertNoticeUser(_admins[j], _notice_ret)
                if (_type == 6)
                    webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a04"], { title: _result[i].request.title, org_lang: lang[_admins[j].system_lang]["language"][_result[i].request.original_language.id - 1], dst_lang: _result[i].translate_language.name }))
                else if (_type == 7)
                    webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a06"], { title: _result[i].request.title, dst_lang: _result[i].translate_language.name }))
            }
            for (let j = 0; j < _admins.length; j++) {

                if (_type == 6)
                    template_obj.org_lang = lang[_admins[j].system_lang]["language"][_result[i].request.original_language.id - 1];
                template_obj.dst_lang = lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1];

                if (_admins[j].is_sms_notice_on == Trigger.ON) {
                    if (_admins[j].country_code == '+82' && _admins[j].system_lang == 'KO') {
                        if (_type == 6)
                            sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a04', template_obj)    
                        else if (_type == 7)
                            sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a06', template_obj)    
                    }
                    else if (_admins[j].country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = '';
                        if (_type == 6)
                            msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a04"],
                            {
                                title: _result[i].request.title,
                                org_lang: lang[_admins[j].system_lang]["language"][_result[i].request.original_language.id - 1],
                                dst_lang: lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1]
                            });
                        else if (_type == 7)
                            msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a06"],
                            {
                                title: _result[i].request.title,
                                dst_lang: lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1]
                            });
                        sendSms(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, msg)        
                    }
                }
                if (_admins[j].is_email_notice_on == Trigger.ON) {
                    if(_type == 6)
                        sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a04'], 'admin_a04', template_obj)    
                    else if (_type == 7)
                        sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a06'], 'admin_a06', template_obj)    
                }
            }
        }
    }
    catch (error) {
    }
}
export const adminA02 = async (_admins: User[]) => {
    try {
        let query = getRepository(TransRequest)
                    .createQueryBuilder("trans_request")
                    .leftJoinAndSelect("trans_request.original_language", "woring_language")
                    .leftJoinAndSelect("trans_request.user", "user")
                    .leftJoinAndSelect("user.parent", "parent")
                    .leftJoinAndSelect("parent.screen_time_limit", "screen_time_limit")
                    .leftJoinAndSelect("parent.end_time_settings", "end_time_setting")
                    .leftJoin(Notice, "notice", '"trans_request"."id" = "notice"."transRequestId" and "notice"."type" = 5')
                    .where('"trans_request"."status" = 1')
                    .andWhere('"notice"."id" is NULL')
                    .andWhere('"trans_request"."has_original_video" = \'N\'')
                    .andWhere('"parent"."has_tc_service" = \'Y\'')
                    .andWhere('"trans_request"."tc_create_date" <= ' + (Math.floor(Date.now() / 1000) - 7200))
        let _result = await query.getMany()
        for (let i = 0; i < _result.length; i++) { 
            //알림추가
            let _notice = new Notice();
            _notice.create_date = Math.floor(Date.now() / 1000);
            _notice.update_date = Math.floor(Date.now() / 1000);
            _notice.trans_request = _result[i]
            _notice.type = 5
            _notice.user = _result[i].user
            _notice.is_read = Trigger.OFF
            let _notice_ret = await getConnection().manager.save(_notice);
            //
            let template_obj: { [k: string]: any } = {};
            template_obj.companyname = _result[i].user.parent.company_name
            template_obj.companyid = _result[i].user.parent.login_id
            template_obj.username = _result[i].user.user_name
            template_obj.userid = _result[i].user.login_id
            template_obj.title = _result[i].title
            template_obj.youtube_url = _result[i].youtube_url
            template_obj.org_lang = _result[i].original_language.name
            template_obj.req_date = _result[i].create_date
            // template_obj.predict_end_date = (await calc_working_time(_result[i].user.parent.screen_time_limit, _result[i].user.parent.end_time_settings, _result[i].duration_minute, 4, _result[i].is_urgent)) * 60 + _result[i].create_date
            template_obj.predict_end_date = await calc_working_time(_result[i].user.parent.screen_time_limit, _result[i].user.parent.end_time_settings, _result[i].duration_minute, 4, _result[i].is_urgent)
            template_obj.site_url = config.SITE_URL;
            // admin
            for (let j = 0; j < _admins.length; j++) {
                insertNoticeUser(_admins[j], _notice_ret)
                webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[j].system_lang]["web_push"]["admin_a02"], { title: _result[i].title, org_lang: lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1] }))
            }
            for (let j = 0; j < _admins.length; j++) {

                template_obj.org_lang = lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1]

                if (_admins[j].is_sms_notice_on == Trigger.ON) {
                    if (_admins[j].country_code == '+82' && _admins[j].system_lang == 'KO')
                        sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a02', template_obj)    
                    else if (_admins[j].country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a02"],
                        {
                            title: _result[i].title,
                            org_lang: lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1]
                        });
                        sendSms(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, msg)        
                    }
                }
                if (_admins[j].is_email_notice_on == Trigger.ON) {
                    sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a02'], 'admin_a02', template_obj)    
                }
            }
        }
    }
    catch (error) {
    }
}
export const reviewA02A03 = async (_admins:  User[], _type: number) => {
    try {
        let cur_time = Math.floor(Date.now() / 1000) + 7200;
        let query = getRepository(RequestDetail)
            .createQueryBuilder("request_detail")
            .leftJoinAndSelect("request_detail.request", "trans_request")
            .leftJoinAndSelect("trans_request.user", "user")
            .leftJoinAndSelect("user.parent", "parent")
            .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = 6')
            .leftJoinAndSelect("request_detail_worker.user", "worker");
        
        if(_type == 3)
            query = query.leftJoin(Notice, "notice", '"request_detail"."id" = "notice"."requestId" and "notice"."type" = 12 and "notice"."transRequestId" is NULL');
        else if (_type == 4)
            query = query.leftJoin(Notice, "notice", '"request_detail"."id" = "notice"."requestId" and "notice"."type" = 13 and "notice"."transRequestId" is NULL');
        
        query = query.leftJoinAndSelect("notice.user", "notice_user")
            .leftJoinAndSelect("request_detail.translate_language", "translate_language")
            .where('"request_detail"."status" = 6')
        if (_type == 3)
            query = query.andWhere('"request_detail_worker"."end_date" <= ' + cur_time);
        if (_type == 4)
            query = query.andWhere('"request_detail_worker"."predict_end_date" <= ' + Math.floor(Date.now() / 1000));
        query = query.andWhere(new Brackets(qb => {
            qb.where('("notice"."id" is NULL or ("notice_user"."user_type" != 6 and "notice_user"."user_type" is not NULL))')
        }));
        let _result = await query.getMany();
        for (let i = 0; i < _result.length; i++) {
            //알림추가
            let _notice = new Notice();
            _notice.create_date = Math.floor(Date.now() / 1000);
            _notice.update_date = Math.floor(Date.now() / 1000);
            if(isArray(_result[i].workers))
                _notice.user = _result[i].workers[0].user
            _notice.request = _result[i]   
            if (_type == 3)
                _notice.type = 12;
            else if (_type == 4)
                _notice.type = 13;
            _notice.is_read = Trigger.OFF
            let _notice_ret = await getConnection().manager.save(_notice);
            /**  */
            let template_obj: {[k: string]: any} = {};
            template_obj.title = _result[i].request.title;
            template_obj.youtube_url = _result[i].request.youtube_url;
            if (isArray(_result[i].workers))
                template_obj.end_date = _result[i].workers[0].end_date
            template_obj.site_url = config.SITE_URL;    
            let _worker = null;
            if (isArray(_result[i].workers))
                _worker = _result[i].workers[0].user;
            if (_worker != null) {

                template_obj.dst_lang = lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1];

                insertNoticeUser(_worker, _notice_ret);
                if(_type == 3)
                    webPush([_worker.player_id], _worker.system_lang, convertTranslateMsg(lang[_worker.system_lang]["web_push"]["reviewer_a02"], { title: _result[i].request.title, dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1] }))
                else if (_type == 4)
                    webPush([_worker.player_id], _worker.system_lang, convertTranslateMsg(lang[_worker.system_lang]["web_push"]["reviewer_a03"], { title: _result[i].request.title, dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1] }))
                //sms
                if (_worker.is_sms_notice_on == Trigger.ON) {
                    if (_worker.country_code == '+82' && _worker.system_lang == 'KO') {
                        if (_type == 3)
                            sendTalk(parseInt(_worker.country_code.substring(1, _worker.country_code.length)), _worker.phone_number, _worker.system_lang, 'reviewer_a02', template_obj)
                        else if (_type == 4)
                            sendTalk(parseInt(_worker.country_code.substring(1, _worker.country_code.length)), _worker.phone_number, _worker.system_lang, 'reviewer_a03', template_obj)
                    }
                    else if (_worker.country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = '';
                        if(_type == 3)
                            msg = convertTranslateMsg(lang[_worker.system_lang]["sms"]["reviewer_a02"],
                            {
                                title: _result[i].request.title,
                                dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1]
                            });
                        else if(_type == 4)
                            msg = convertTranslateMsg(lang[_worker.system_lang]["sms"]["reviewer_a03"],
                            {
                                title: _result[i].request.title,
                                dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1]
                            });

                        sendSms(parseInt(_worker.country_code.substring(1, _worker.country_code.length)), _worker.phone_number, _worker.system_lang, msg)
                    }
                }
                //email
                if (_worker.is_email_notice_on == Trigger.ON) {
                    if(_type == 3)
                        sendEmail(_worker.user_email, _worker.system_lang, lang[_worker.system_lang]['email']['reviewer_a02'], 'reviewer_a02', template_obj)           
                    else if (_type == 4)
                        sendEmail(_worker.user_email, _worker.system_lang, lang[_worker.system_lang]['email']['reviewer_a03'], 'reviewer_a03', template_obj)           
                }
                //admin
                if (_type == 4) {
                    template_obj.companyname = _result[i].request.user.parent.company_name
                    template_obj.companyid = _result[i].request.user.parent.login_id
                    template_obj.username = _result[i].request.user.user_name
                    template_obj.userid = _result[i].request.user.login_id
                    template_obj.review_userid  = _worker.login_id
                    template_obj.review_username = _worker.user_name
                    template_obj.req_date = _result[i].workers[0].create_date
                    for (let j = 0; j < _admins.length; j++) {
                        insertNoticeUser(_admins[j], _notice_ret)
                        webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[j].system_lang]["web_push"]["admin_a07"], {title: _result[i].request.title, dst_lang: _result[i].translate_language.name }))
                    }
                    for (let j = 0; j < _admins.length; j++) {
                        template_obj.dst_lang = lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1]
                        if (_admins[j].is_sms_notice_on == Trigger.ON) {
                            if (_admins[j].country_code == '+82' && _admins[j].system_lang == 'KO')
                                sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a07', template_obj)    
                            else if (_admins[j].country_code == '+81') {
                                //do nothing
                            }
                            else {
                                let msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a07"],
                                {
                                    title: _result[i].request.title,
                                    dst_lang: lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1],
                                    username: _worker.user_name
                                });
                                sendSms(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, msg)     
                            }
                        }
                        if (_admins[j].is_email_notice_on == Trigger.ON) {
                            sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a07'], 'admin_a07', template_obj)
                        }
                    }
                }
            }
        }
    }    
    catch (error) {
        console.log(error)
    }
}

export const translateA02A03 = async(_admins:  User[], _type: number) => {
    try {
        let cur_time = Math.floor(Date.now() / 1000) + 7200;
        let query = getRepository(RequestDetail)
            .createQueryBuilder("request_detail")
            .leftJoinAndSelect("request_detail.request", "trans_request")
            .leftJoinAndSelect("trans_request.user", "user")
            .leftJoinAndSelect("user.parent", "parent")
            .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = 5')
            .leftJoinAndSelect("request_detail_worker.user", "worker");
        
        if (_type == 3)
            query = query.leftJoin(Notice, "notice", '"request_detail"."id" = "notice"."requestId" and "notice"."type" = 10 and "notice"."transRequestId" is NULL');
        else if (_type == 4)
            query = query.leftJoin(Notice, "notice", '"request_detail"."id" = "notice"."requestId" and "notice"."type" = 11 and "notice"."transRequestId" is NULL');
        
        query = query.leftJoinAndSelect("notice.user", "notice_user")
            .leftJoinAndSelect("trans_request.original_language", "original_language")
            .leftJoinAndSelect("request_detail.translate_language", "translate_language")
            .where('"request_detail"."status" = 4')
        if (_type == 3)
            query = query.andWhere('"request_detail_worker"."end_date" <= ' + cur_time);
        if (_type == 4)
            query = query.andWhere('"request_detail_worker"."predict_end_date" <= ' + Math.floor(Date.now() / 1000));
        query = query.andWhere(new Brackets(qb => {
            qb.where('("notice"."id" is NULL or ("notice_user"."user_type" != 5 and "notice_user"."user_type" is not NULL))')
        }));
        let _result = await query.getMany();
        for (let i = 0; i < _result.length; i++) {
            //알림추가
            let _notice = new Notice();
            _notice.create_date = Math.floor(Date.now() / 1000);
            _notice.update_date = Math.floor(Date.now() / 1000);
            if(isArray(_result[i].workers))
                _notice.user = _result[i].workers[0].user
            _notice.request = _result[i]
            if (_type == 3)
                _notice.type = 10;
            else if (_type == 4)
                _notice.type = 11;
            _notice.is_read = Trigger.OFF;
            let _notice_ret = await getConnection().manager.save(_notice);

            let _worker = null;
            if (isArray(_result[i].workers))
                _worker = _result[i].workers[0].user;
            //
            if (_worker != null) {

                let template_obj: {[k: string]: any} = {};
                template_obj.title = _result[i].request.title;
                template_obj.youtube_url = _result[i].request.youtube_url;
                template_obj.org_lang = lang[_worker.system_lang]["language"][_result[i].request.original_language.id - 1];
                template_obj.dst_lang = lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1];
                if(isArray(_result[i].workers))
                    template_obj.end_date = _result[i].workers[0].end_date
                template_obj.site_url = config.SITE_URL; 

                insertNoticeUser(_worker, _notice_ret)
                if (_type == 3)
                    webPush([_worker.player_id], _worker.system_lang, convertTranslateMsg(lang[_worker.system_lang]["web_push"]["translator_a02"],
                    {
                        title: _result[i].request.title,
                        org_lang: lang[_worker.system_lang]["language"][_result[i].request.original_language.id - 1],
                        dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1]
                    }))
                else if (_type == 4)
                    webPush([_worker.player_id], _worker.system_lang, convertTranslateMsg(lang[_worker.system_lang]["web_push"]["translator_a03"],
                    {
                        title: _result[i].request.title,
                        org_lang: lang[_worker.system_lang]["language"][_result[i].request.original_language.id - 1],
                        dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1]
                    }))
                //sms
                if (_worker.is_sms_notice_on == Trigger.ON) {
                    if (_worker.country_code == '+82' && _worker.system_lang == 'KO') {
                        if (_type == 3)
                            sendTalk(parseInt(_worker.country_code.substring(1, _worker.country_code.length)), _worker.phone_number, _worker.system_lang, 'translator_a02', template_obj)
                        else if (_type == 4)
                            sendTalk(parseInt(_worker.country_code.substring(1, _worker.country_code.length)), _worker.phone_number, _worker.system_lang, 'translator_a03', template_obj)
                    }
                    else if (_worker.country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = '';
                        if(_type == 3)
                            msg = convertTranslateMsg(lang[_worker.system_lang]["sms"]["translator_a02"],
                            {
                                title: _result[i].request.title,
                                org_lang: lang[_worker.system_lang]["language"][_result[i].request.original_language.id - 1],
                                dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1]
                            });
                        else if(_type == 4)
                            msg = convertTranslateMsg(lang[_worker.system_lang]["sms"]["translator_a03"],
                            {
                                title: _result[i].request.title,
                                org_lang: lang[_worker.system_lang]["language"][_result[i].request.original_language.id - 1],
                                dst_lang: lang[_worker.system_lang]["language"][_result[i].translate_language.id - 1]
                            });
                        sendSms(parseInt(_worker.country_code.substring(1, _worker.country_code.length)), _worker.phone_number, _worker.system_lang, msg)
                    }
                }
                //email
                if (_worker.is_email_notice_on == Trigger.ON) {
                    if(_type == 3)
                        sendEmail(_worker.user_email, _worker.system_lang, lang[_worker.system_lang]['email']['translator_a02'], 'translator_a02', template_obj)           
                    else if (_type == 4)
                        sendEmail(_worker.user_email, _worker.system_lang, lang[_worker.system_lang]['email']['translator_a03'], 'translator_a03', template_obj)           
                }
                //admin
                if (_type == 4) {
                    template_obj.companyname = _result[i].request.user.parent.company_name
                    template_obj.companyid = _result[i].request.user.parent.login_id
                    template_obj.username = _result[i].request.user.user_name
                    template_obj.userid = _result[i].request.user.login_id
                    template_obj.translate_userid = _worker.login_id
                    template_obj.translate_username = _worker.user_name
                    template_obj.req_date = _result[i].workers[0].create_date
                    for (let j = 0; j < _admins.length; j++) {
                        insertNoticeUser(_admins[j], _notice_ret)
                        webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[j].system_lang]["web_push"]["admin_a05"],
                        {
                            title: _result[i].request.title,
                            org_lang: lang[_admins[j].system_lang]["language"][_result[i].request.original_language.id - 1],
                            dst_lang: lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1]
                        }))
                    }
                    for (let j = 0; j < _admins.length; j++) {
                        if (_admins[j].is_sms_notice_on == Trigger.ON) {
                            if (_admins[j].country_code == '+82' && _admins[j].system_lang == 'KO')
                                sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a05', template_obj)    
                            else if (_admins[j].country_code == '+81') {
                                //do nothing
                            }
                            else {
                                let msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a05"],
                                {
                                    title: _result[i].request.title,
                                    org_lang: lang[_admins[j].system_lang]["language"][_result[i].request.original_language.id - 1],
                                    dst_lang: lang[_admins[j].system_lang]["language"][_result[i].translate_language.id - 1],
                                    username: _worker.user_name
                                });
                                sendSms(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, msg)     
                            }
                        }
                        if (_admins[j].is_email_notice_on == Trigger.ON) {
                            sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a05'], 'admin_a05', template_obj)
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        console.log(error)
    }
}

export const tcA02A03 = async(_admins:  User[], _type: number) => {   
    try {
        let cur_time = Math.floor(Date.now() / 1000) + 7200;
        let query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                .leftJoinAndSelect("trans_request.original_language", "woring_language")
                .leftJoinAndSelect("trans_request.tc_user", "tc_user")
                .leftJoinAndSelect("trans_request.user", "user")
                .leftJoinAndSelect("user.parent", "parent")
                .leftJoin(Notice, "notice", '"trans_request"."id" = "notice"."transRequestId" and "notice"."type" = ' + _type)
                .where('"trans_request"."status" = 2');
        if(_type == 3)
            query = query.andWhere('"trans_request"."tc_end_date" <= ' + cur_time)
        if(_type == 4)
            query = query.andWhere('"trans_request"."tc_predict_end_date" <= ' + Math.floor(Date.now() / 1000))

        query = query.andWhere('"notice"."id" is NULL')
        let _result = await query.getMany();
        for(let i = 0; i < _result.length; i ++) {
            //알림추가
            let _notice = new Notice();
            _notice.create_date = Math.floor(Date.now() / 1000);
            _notice.update_date = Math.floor(Date.now() / 1000);
            _notice.user = _result[i].tc_user;
            _notice.trans_request = _result[i];
            if (_type == 3)
                _notice.type = 3;
            else if (_type == 4)
                _notice.type = 4;
            _notice.is_read = Trigger.OFF;
            let _notice_ret = await getConnection().manager.save(_notice);
            insertNoticeUser(_result[i].tc_user, _notice_ret)

            if(_type == 3)
                webPush([_result[i].tc_user.player_id], _result[i].tc_user.system_lang, convertTranslateMsg(lang[_result[i].tc_user.system_lang]["web_push"]["tc_a02"],
                {
                    title: _result[i].title,
                    org_lang: lang[_result[i].tc_user.system_lang]["language"][_result[i].original_language.id - 1]
                }))
            else if (_type == 4)
                webPush([_result[i].tc_user.player_id], _result[i].tc_user.system_lang, convertTranslateMsg(lang[_result[i].tc_user.system_lang]["web_push"]["tc_a03"],
                {
                    title: _result[i].title,
                    org_lang: lang[_result[i].tc_user.system_lang]["language"][_result[i].original_language.id - 1]
                }))
            
            if (_type == 4) {
                for (let j = 0; j < _admins.length; j++) {
                    insertNoticeUser(_admins[j], _notice_ret)
                    webPush([_admins[j].player_id], _admins[j].system_lang, convertTranslateMsg(lang[_admins[j].system_lang]["web_push"]["admin_a03"],
                    {
                        title: _result[i].title,
                        org_lang: lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1]
                    }))
                }   
            }
            let template_obj: {[k: string]: any} = {};
            template_obj.title = _result[i].title;
            template_obj.youtube_url = _result[i].youtube_url;
            template_obj.org_lang = lang[_result[i].tc_user.system_lang]["language"][_result[i].original_language.id - 1];
            template_obj.end_date = _result[i].tc_end_date;
            template_obj.site_url = config.SITE_URL; 
            if(_result[i].tc_user.is_sms_notice_on == Trigger.ON) {
                if(_result[i].tc_user.country_code == '+82' && _result[i].tc_user.system_lang == 'KO') {
                    if(_type == 3)
                        sendTalk(parseInt(_result[i].tc_user.country_code.substring(1, _result[i].tc_user.country_code.length)), _result[i].tc_user.phone_number, _result[i].tc_user.system_lang, 'tc_a02', template_obj)
                    else if(_type == 4)
                        sendTalk(parseInt(_result[i].tc_user.country_code.substring(1, _result[i].tc_user.country_code.length)), _result[i].tc_user.phone_number, _result[i].tc_user.system_lang, 'tc_a03', template_obj)
                }
                else if(_result[i].tc_user.country_code == '+81') {
                    //do  nothing
                }
                else {
                    let msg = '';
                    if(_type == 3)
                        msg = convertTranslateMsg(lang[_result[i].tc_user.system_lang]["sms"]["tc_a02"],
                        {
                            title: _result[i].title,
                            org_lang: lang[_result[i].tc_user.system_lang]["language"][_result[i].original_language.id - 1]
                        });
                    else if(_type == 4)
                        msg = convertTranslateMsg(lang[_result[i].tc_user.system_lang]["sms"]["tc_a03"],
                        {
                            title: _result[i].title,
                            org_lang: lang[_result[i].tc_user.system_lang]["language"][_result[i].original_language.id - 1]
                        });

                    sendSms(parseInt(_result[i].tc_user.country_code.substring(1, _result[i].tc_user.country_code.length)), _result[i].tc_user.phone_number, _result[i].tc_user.system_lang, msg)
                }
            }
            if (_result[i].tc_user.is_email_notice_on == Trigger.ON) {
                if(_type == 3)
                    sendEmail(_result[i].tc_user.user_email, _result[i].tc_user.system_lang, lang[_result[i].tc_user.system_lang]['email']['tc_a02'], 'tc_a02', template_obj)
                else if (_type == 4)
                    sendEmail(_result[i].tc_user.user_email, _result[i].tc_user.system_lang, lang[_result[i].tc_user.system_lang]['email']['tc_a03'], 'tc_a03', template_obj)
            }
            //admin
            if (_type == 4) {
                template_obj.companyname = _result[i].user.parent.company_name
                template_obj.companyid = _result[i].user.parent.login_id
                template_obj.username = _result[i].user.user_name
                template_obj.userid = _result[i].user.login_id
                template_obj.tc_userid = _result[i].tc_user.login_id
                template_obj.tc_username = _result[i].tc_user.user_name
                template_obj.req_date = _result[i].tc_create_date
                for (let j = 0; j < _admins.length; j++) {
                    if (_admins[j].is_sms_notice_on == Trigger.ON) {
                        if (_admins[j].country_code == '+82' && _admins[j].system_lang == 'KO')
                            sendTalk(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, 'admin_a03', template_obj)
                        else if (_admins[j].country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = convertTranslateMsg(lang[_admins[j].system_lang]["sms"]["admin_a03"],
                                {
                                    title: _result[i].title,
                                    org_lang: lang[_admins[j].system_lang]["language"][_result[i].original_language.id - 1],
                                    username: _result[i].tc_user.user_name
                                });
                            sendSms(parseInt(_admins[j].country_code.substring(1, _admins[j].country_code.length)), _admins[j].phone_number, _admins[j].system_lang, msg)
                        }
                    }
                    if (_admins[j].is_email_notice_on == Trigger.ON) {
                        sendEmail(_admins[j].user_email, _admins[j].system_lang, lang[_admins[j].system_lang]['email']['admin_a03'], 'admin_a03', template_obj)
                    }
                }
            }
        }
    }    
    catch(error) {
    }
}

export const loop = async() => {
    console.log("loop here")
    let query = getRepository(User)
                .createQueryBuilder("user")
                .where('"user"."user_type" = 1');
    let _admins = await query.getMany();
    //TC
    tcA02A03(_admins, 3);
    tcA02A03(_admins, 4);
    //Translator
    translateA02A03(_admins, 3);
    translateA02A03(_admins, 4);
    //Review
    reviewA02A03(_admins, 3);
    reviewA02A03(_admins, 4);
    /** admin  */
    adminA02(_admins)
    adminA0406(_admins, 6)
    adminA0406(_admins, 7)
    adminA08A09(_admins, 8)
    adminA08A09(_admins, 9)
}
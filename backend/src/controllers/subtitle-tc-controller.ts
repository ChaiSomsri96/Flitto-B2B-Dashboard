import { UsersWorkingLanguage } from './../entity/users-working-language';
import { TransRequest } from './../entity/trans-request';
import { UserTag } from './../entity/user-tag';
import { User } from './../entity/user';
import { getConnection, getRepository, Brackets } from 'typeorm';
import { isEmpty, isArray, isNotEmpty, isNumber, isNumberString } from 'class-validator';
import { Request, Response } from 'express';
import { calculate_mins, current_tc_work_count, calculate_work_price, calc_working_time, calculate_predict_time } from './../helpers/utils'
import global from './../config/global';
import config from './../config/config';
import { insertNotice, convertTranslateMsg, insertNoticeUser } from './../helpers/db-util';
import fs from "fs";
import { Trigger } from './../entity/entity-enum';
import { Log } from './../entity/log';
import { sendTalk, sendSms, sendEmail, webPush } from './../helpers/notice-method';
import { Notice } from './../entity/notice';
import lang from "../lang/index";
class SubtitleTcController {
    //work_no는 작업번호가 아님
    /*
    errorCode: 401 ~ no permission
                1:  진행상태가 tc중 아님
                15: Invalid Id
    */
    static tcCompleteWork = async(req: Request, res: Response) => {
        let { work_no } = req.body;
        if(isEmpty(work_no))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        if( !req.file )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            let _trans_request_repository = getRepository(TransRequest);
            let query = getRepository(TransRequest)
                        .createQueryBuilder("trans_request");
            query = query.leftJoinAndSelect("trans_request.details", "request_detail")
                         .leftJoinAndSelect("trans_request.tc_user", "tc_user")
                         .leftJoinAndSelect("trans_request.user", "user")
                         .leftJoinAndSelect("trans_request.original_language", "original_language")
                         .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                         .where('"trans_request"."id" = :work_no', {work_no: work_no});
            let _request = await query.getOne()
            if(_request == undefined)
                return res.json({ errorCode: 15, errorMsg: "Invalid Id." });
            if(_request.status != global.STATUS.indexOf("tc_ing") + 1)
                return res.json({ errorCode: 1, errorMsg: "Unable to complete this tc work." });
            if(_request.tc_user.id != req.decodedUser.id)
                return res.json({ errorCode: 401, errorMsg: "No permission to complete this tc work." });
            _request.status = global.STATUS.indexOf("tc_complete") + 1;
            _request.tc_status = 3;
            _request.tc_end_date = Math.floor(Date.now() / 1000);
            if(req.file) {
                if(!isEmpty(_request.tc_video))
                    fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/'  + _request.tc_video)
                _request.tc_video = req.file.filename;
            }
            if(isArray(_request.details)) {
                for(let i = 0; i < _request.details.length; i ++) {
                    _request.details[i].status = global.STATUS.indexOf("tc_complete") + 1;
                    _request.details[i].translate_req_date = _request.details[i].update_date = Math.floor(Date.now() / 1000);
                    await getConnection().manager.save(_request.details[i]);
                }
            }
            let _trans_request = await _trans_request_repository.save(_request);
            //진행기록 등록
            let _log = new Log();
            _log.create_date = Math.floor(Date.now() / 1000);
            _log.update_date = Math.floor(Date.now() / 1000);
            _log.user = _trans_request.tc_user;
            _log.trans_request = _trans_request;
            _log.status = global.STATUS.indexOf("tc_complete") + 1;
            await getConnection().manager.save(_log);
            //
            await insertNotice(_trans_request.tc_user, _trans_request, null, 2, Trigger.OFF)

            return res.json({errorCode: 0, errorMsg: '', data: {
                tc_video: _request.tc_video,
                tc_video_link: (isEmpty(_request.tc_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request.tc_video))
            }});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    //work_no는 작업번호가 아님 , trans_request 의 id 임
    //worker_id는 작업자 아이디
    /*
    errorCode: 1 - 작업할당 오류
    errorCode: 2 - 이미 TC작업 완료
    errorCode: 3 - 다른 TC작업자가 먼저 수락하여 수락할수 없습니다.
    errorCode: 4 - 동시작업수량 초과
    */
    static tcAssignWork = async(req: Request, res: Response) => {
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
                let _current_work_count = await current_tc_work_count(worker_id);
                if(_worker_info.can_work <= _current_work_count)
                    return res.json({ errorCode: 4, errorMsg: 'unable to assign work(Simultaneous working quantity exceeded.)' });
            }
            //자막번역 요청값 가져오기
            let query = getRepository(TransRequest)
                        .createQueryBuilder("trans_request");
            query = query.leftJoinAndSelect("trans_request.details", "request_detail")
                .leftJoinAndSelect("trans_request.user", "user")
                .leftJoinAndSelect("user.parent", "parent")
                .leftJoinAndSelect("request_detail.translate_language", "woring_language A")
                .leftJoinAndSelect("trans_request.original_language", "woring_language")
                .where('"trans_request"."id" = :work_no', {work_no: work_no});

            let lang_query = getRepository(TransRequest)
                            .createQueryBuilder("trans_request")
                            .leftJoinAndSelect("trans_request.user", "user")
                            .leftJoin(UsersWorkingLanguage, "users_working_language", '"trans_request"."originalLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: worker_id})
                            .where('"trans_request"."id" = :work_no and "users_working_language"."id" is not NULL', {work_no: work_no});
            let _request = await query.getOne();
            if(_request == undefined)
                return res.json({ errorCode: 15, errorMsg: "Invalid tc work-id." });
            //상한 상태값 체크
            if(_request.status >= (global.STATUS.indexOf("tc_complete") + 1))
                return res.json({ errorCode: 2, errorMsg: "This worker no is already finished." });
            if( (req.decodedUser.user_type != (global.ROLE.indexOf("admin") + 1)) && (_request.status == (global.STATUS.indexOf("tc_ing") + 1)) )
                return res.json({ errorCode: 3, errorMsg: "The worker is already assigned by another tc worker." });
            //원본 동영상 있는 경우 tc작업 필요 없음
            if(_request.has_original_video == Trigger.ON || _request.user.parent.has_tc_service == Trigger.OFF)
                return res.json({ errorCode: 1, errorMsg: "unable to assign work(This work no doesn't need tc work.)" });
            //고객사 태그 설정 && 작업자 태그 매칭 admin인 경우 체크 필요 없음
            if(req.decodedUser.user_type != global.ROLE.indexOf("admin") + 1) {
                let involved = false;
                let _company = await userRepository.findOne(_request.user.parent_id)
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
            //
            _request.status = global.STATUS.indexOf("tc_ing") + 1;
            _request.tc_update_date = Math.floor(Date.now() / 1000);
            _request.tc_user = _worker_info;
            _request.tc_status = 2;
            _request.tc_work_price = 0;
            if (isArray(_request.details) && _request.details.length > 0) {
                if (_request.tc_price_set == Trigger.ON)
                    _request.tc_work_price = _request.tc_price_value
                else
                    _request.tc_work_price = await calculate_work_price(_request.user.parent_id, _request.duration, _worker_info.correction_rate, _worker_info.user_type, _request.original_language.id, _request.details[0].translate_language.id)   
            }
            let _predict_time = 0;

            if (_request.tc_predict_time_set == Trigger.ON)
                _predict_time = _request.tc_predict_time_value
            else
                _predict_time = await calculate_predict_time(_request.user.parent_id, calculate_mins(_request.duration), _worker_info.user_type, _request.is_urgent);
            
            _request.tc_predict_end_date = _request.tc_update_date + _predict_time * 60;
            if( isArray(_request.details) ) {
                for(let i = 0; i < _request.details.length; i ++) {
                    _request.details[i].update_date = Math.floor(Date.now() / 1000);
                    _request.details[i].status = global.STATUS.indexOf("tc_ing") + 1;
                    await getConnection().manager.save(_request.details[i]);
                }
            }
            let _trans_request = await getConnection().manager.save(_request);
            let _log = new Log();
            _log.create_date = Math.floor(Date.now() / 1000);
            _log.update_date = Math.floor(Date.now() / 1000);
            _log.user = _worker_info;
            _log.trans_request = _trans_request;
            _log.status = global.STATUS.indexOf("tc_ing") + 1;
            await getConnection().manager.save(_log);
            // notice push
            if (isNotEmpty(req.body.manual) && req.body.manual) {
                let _notice = new Notice();
                _notice.create_date = Math.floor(Date.now() / 1000);
                _notice.update_date = Math.floor(Date.now() / 1000);
                _notice.user = _worker_info;
                _notice.trans_request = _trans_request;
                _notice.type = 17;
                let _notice_ret = await getConnection().manager.save(_notice);
                insertNoticeUser(_worker_info, _notice_ret);
                webPush([_worker_info.player_id], _worker_info.system_lang, convertTranslateMsg(lang[_worker_info.system_lang]["web_push"]['tc_a04'], { title: _request.title, org_lang: lang[_worker_info.system_lang]["language"][_request.original_language.id-1] }))
                if (_worker_info.is_sms_notice_on == Trigger.ON) {
                    if (_worker_info.country_code == '+82' && _worker_info.system_lang == 'KO') {
                        let template_obj: { [k: string]: any } = {};   
                        template_obj.title = _request.title;
                        template_obj.youtube_url = _request.youtube_url;
                        template_obj.org_lang = lang[_worker_info.system_lang]["language"][_request.original_language.id - 1];
                        template_obj.predict_end_date = _request.tc_predict_end_date;
                        template_obj.site_url = config.SITE_URL;
                        sendTalk(parseInt(_worker_info.country_code.substring(1, _worker_info.country_code.length)), _worker_info.phone_number, _worker_info.system_lang, 'tc_a04', template_obj)               
                    }
                    else if (_worker_info.country_code == '+81') {
                        //do nothing
                    }
                    else {
                        let msg = '';
                        msg = convertTranslateMsg(lang[_worker_info.system_lang]["sms"]['tc_a04'], {
                            title: _request.title,
                            org_lang: lang[_worker_info.system_lang]["language"][_request.original_language.id - 1]
                        });
                        sendSms(parseInt(_worker_info.country_code.substring(1, _worker_info.country_code.length)), _worker_info.phone_number, _worker_info.system_lang, msg)
                    }
                }
                if (_worker_info.is_email_notice_on == Trigger.ON) {
                    let template_obj: { [k: string]: any } = {};   
                    template_obj.title = _request.title;
                    template_obj.youtube_url = _request.youtube_url;
                    template_obj.org_lang = lang[_worker_info.system_lang]["language"][_request.original_language.id - 1];
                    template_obj.predict_end_date = _request.tc_predict_end_date
                    template_obj.site_url = config.SITE_URL;

                    sendEmail(_worker_info.user_email, _worker_info.system_lang, lang[_worker_info.system_lang]['email']['tc_a04'], 'tc_a04', template_obj)       
                }
            }
            return res.json({
                errorCode: 0, errorMsg: "", data: {
                    user_id: _worker_info.login_id,
                    user_no: _worker_info.id,
                    user_name: _worker_info.user_name,
                    status: 'tc_ing'
            }});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getTcRequestList = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            let status = global.STATUS.indexOf("preparing") + 1;
            if(isNotEmpty(search) && isNotEmpty(search.status) && isArray(search.status)) {
                for(let i = 0; i < search.status.length; i ++) {
                    if(global.ROLE[req.decodedUser.user_type - 1] == 'tc' && search.status[i] == "tc_complete") {
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
            let query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                //.addSelect('company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 as trans_request_temp_price');
                .addSelect('ROUND(cast(CASE \
                WHEN  trans_request.tc_price_set = \'Y\'   \
                THEN  trans_request.tc_price_value \
                ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                END as numeric), 3) as trans_request_temp_price')
                .addSelect('ROUND(cast(trans_request.tc_work_price as numeric), 3)', 'trans_request_tc_work_price')
            query = query.leftJoinAndSelect("trans_request.details", "request_detail")
                        .leftJoinAndSelect("trans_request.original_language", "woring_language")
                        .leftJoinAndSelect("request_detail.translate_language", "woring_language A")
                        .leftJoinAndSelect("trans_request.user", "user", "trans_request.status <= :status", {status: status})
                        .leftJoinAndSelect("user.parent", 'parent')
                        .leftJoin('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoinAndSelect('parent.prices', 'company_price', '"company_price"."originalId" = "trans_request"."originalLanguageId" and "company_price"."translateId" = "request_detail"."translateLanguageId"')
                        .leftJoinAndSelect('parent.end_time_settings', 'end_time_setting', '"end_time_setting"."work_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoinAndSelect('parent.screen_time_limit', 'screen_time_limit')
                        .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                        .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = :user_id', {user_id: req.decodedUser.id})
                        .leftJoin(UsersWorkingLanguage, "users_working_language", '"trans_request"."originalLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: req.decodedUser.id});

            let sum_query = getConnection()
                            .createQueryBuilder()
                            .select('sum(trans_request.duration) / count(trans_request.id)', 'trans_request_duration_sum')
                            //.addSelect('sum(company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100) / count(trans_request.id)' , 'temp_price_sum')
                            .addSelect('ROUND(cast(sum(CASE \
                WHEN trans_request.status > 1 \
                THEN 0 \
                WHEN  trans_request.tc_price_set = \'Y\'   \
                THEN  trans_request.tc_price_value \
                ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                END) / count(trans_request.id) as numeric), 3)', 'temp_price_sum')
                            .addSelect('ROUND(cast(sum(trans_request.tc_work_price) / count(trans_request.id) as numeric), 3)', 'work_price_sum')
                            .from(TransRequest, "trans_request")
                            .leftJoin("trans_request.details", "request_detail")
                            .leftJoin("trans_request.original_language", "woring_language")
                            .leftJoin("request_detail.translate_language", "woring_language A")
                            .leftJoin("trans_request.user", "user", "trans_request.status <= " + status)
                            .leftJoin("user.parent", 'parent')
                            .leftJoin('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = \'' + req.decodedUser.user_type.toString() + '\'')
                            .leftJoin('parent.prices', 'company_price', '"company_price"."originalId" = "trans_request"."originalLanguageId" and "company_price"."translateId" = "request_detail"."translateLanguageId"')
                            .leftJoin('parent.end_time_settings', 'end_time_setting', '"end_time_setting"."work_type" = \'' + req.decodedUser.user_type.toString() + '\'')
                            .leftJoin('parent.screen_time_limit', 'screen_time_limit')
                            .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                            .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = ' + req.decodedUser.id)
                            .leftJoin(UsersWorkingLanguage, "users_working_language", '"trans_request"."originalLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = ' + req.decodedUser.id);

            query = query.where(new Brackets(qb => {
                qb.where(' ( "users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) ) or (trans_request.status > ' + status +' and "trans_request"."tcUserId" = ' + req.decodedUser.id + ')')
            }));
            //query = query.andWhere('"trans_request"."has_original_video" = \'N\'');
            //query = query.andWhere('"parent"."has_tc_service" = \'Y\'');
            query = query.andWhere(new Brackets(qb => {
                qb.where('("trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\') or "parent"."id" is NULL')
            }));
            sum_query = sum_query.where(new Brackets(qb => {
                qb.where(' ( "users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) ) or (trans_request.status > ' + status +' and "trans_request"."tcUserId" = ' + req.decodedUser.id + ')')
            }));
            //sum_query = sum_query.andWhere('"trans_request"."has_original_video" = \'N\'');
            //sum_query = sum_query.andWhere('"parent"."has_tc_service" = \'Y\'');
            sum_query = sum_query.andWhere(new Brackets(qb => {
                qb.where('("trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\') or "parent"."id" is NULL')
            }));
            if(isNotEmpty(search)) {
                if(isEmpty(search.date_type))
                    return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
                let field_name = '';
                if(search.date_type == 1)
                    field_name = 'trans_request.tc_create_date';
                else if(search.date_type == 2)
                    field_name = 'trans_request.tc_predict_end_date';
                else if(search.date_type == 3)
                    field_name = 'trans_request.tc_end_date';
                //일자범위선택
                if(isNotEmpty(search.start_date)) {
                    query = query.andWhere(field_name + ' >= ' + search.start_date);
                    sum_query = sum_query.andWhere(field_name + ' >= ' + search.start_date);
                }
                if(isNotEmpty(search.end_date)) {
                    query = query.andWhere(field_name + ' <= ' + search.end_date);
                    sum_query = sum_query.andWhere(field_name + ' <= ' + search.end_date);
                }
                if(isNotEmpty(search.status) && isArray(search.status) && search.status.length > 0) {
                    let status_query = '"trans_request"."status" = :status1', filter = {};
                    let sum_status_query = '"request_detail"."status" = ' + (global.STATUS.indexOf(search.status[0]) + 1);
                    filter = {
                        ...filter,
                        'status1': global.STATUS.indexOf(search.status[0]) + 1
                    }
                    for(let i = 1; i < search.status.length; i ++) {
                        sum_status_query += ' or "request_detail"."status" = ' + (global.STATUS.indexOf(search.status[i]) + 1);
                        status_query += ' or "trans_request"."status" = :status' + (i + 1);
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
                    }));
                }
                if( isNotEmpty(search.original_language) ) {
                    query = query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                    sum_query = sum_query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                }
                if( ( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) &&
                !(isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                    query = query.andWhere(new Brackets(qb => {
                        //qb.where('"trans_request"."tc_work_price" >= ' + search.start_work_price + ' or company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100 >= ' + search.start_work_price)
                        qb.where('("trans_request"."status" > 1 and ROUND(cast("trans_request"."tc_work_price" as numeric), 3) >= ' + search.start_work_price + ') or ("trans_request"."status" = 1 and \
                        ROUND(cast(CASE \
                        WHEN  trans_request.tc_price_set = \'Y\'   \
                        THEN  trans_request.tc_price_value \
                        ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                        END as numeric), 3) >= ' + search.start_work_price + ')')
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where('("trans_request"."status" > 1 and ROUND(cast("trans_request"."tc_work_price" as numeric), 3) >= ' + search.start_work_price + ') or ("trans_request"."status" = 1 and \
                        ROUND(cast(CASE \
                        WHEN  trans_request.tc_price_set = \'Y\'   \
                        THEN  trans_request.tc_price_value \
                        ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                        END as numeric), 3) >= ' + search.start_work_price + ')')
                    }));
                }
                else if( !( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) &&
                (isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('("trans_request"."status" > 1 and ROUND(cast("trans_request"."tc_work_price" as numeric), 3) <= ' + search.end_work_price + ') or ("trans_request"."status" = 1 and \
                        ROUND(cast(CASE \
                        WHEN  trans_request.tc_price_set = \'Y\'   \
                        THEN  trans_request.tc_price_value \
                        ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                        END as numeric), 3) <= ' + search.end_work_price + ')')
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where('("trans_request"."status" > 1 and ROUND(cast("trans_request"."tc_work_price" as numeric), 3) <= ' + search.end_work_price + ') or ("trans_request"."status" = 1 and \
                        ROUND(cast(CASE \
                        WHEN  trans_request.tc_price_set = \'Y\'   \
                        THEN  trans_request.tc_price_value \
                        ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                        END as numeric), 3) <= ' + search.end_work_price + ')')
                    }));
                }
                else if( ( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) &&
                (isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('("trans_request"."status" > 1 and ROUND(cast("trans_request"."tc_work_price" as numeric), 3) >= ' + search.start_work_price + ' and "trans_request"."tc_work_price" <= ' + search.end_work_price + ') \
                            or ("trans_request"."status" = 1 and \
                            ROUND(cast(CASE \
                                WHEN  trans_request.tc_price_set = \'Y\'   \
                                THEN  trans_request.tc_price_value \
                                ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                                END as numeric), 3) <= ' + search.end_work_price + '\
                            and ROUND(cast(CASE \
                            WHEN  trans_request.tc_price_set = \'Y\'   \
                            THEN  trans_request.tc_price_value \
                            ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                            END as numeric), 3) >= ' + search.start_work_price + ')')
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where('("trans_request"."status" > 1 and ROUND(cast("trans_request"."tc_work_price" as numeric), 3) >= ' + search.start_work_price + ' and "trans_request"."tc_work_price" <= ' + search.end_work_price + ') \
                            or ("trans_request"."status" = 1 and \
                            ROUND(cast(CASE \
                                WHEN  trans_request.tc_price_set = \'Y\'   \
                                THEN  trans_request.tc_price_value \
                                ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                                END as numeric), 3) <= ' + search.end_work_price + '\
                            and ROUND(cast(CASE \
                            WHEN  trans_request.tc_price_set = \'Y\'   \
                            THEN  trans_request.tc_price_value \
                            ELSE  company_price.tc_price * trans_request.duration_minute * (100 + ' + user_correction_rate + ') / 100  \
                            END as numeric), 3) >= ' + search.start_work_price + ')')
                    }));
                }
                if( isNotEmpty(search.search_keyword) ) {
                     if(isEmpty(search.keyword_type) || isEmpty(search.search_type))
                         return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' })
                     switch(search.keyword_type) {
                         case 1:
                             field_name = '"trans_request"."title"';
                             break;
                         case 2:
                             field_name = '"request_detail"."id"::varchar(255)';
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

            query = query.orderBy('trans_request.tc_status', "ASC");
            query = query.addOrderBy('trans_request.id', "DESC");

            let totals = await query.getCount()
            sum_query = sum_query.groupBy('trans_request.id');

            let __sum_query = getConnection()
            .createQueryBuilder()
            .select('sum(src.trans_request_duration_sum)', 'duration_sum')
            .addSelect('ROUND(cast(sum(src.temp_price_sum) as numeric), 3)', 'work_price_sum1')
            .addSelect('ROUND(cast(sum(src.work_price_sum) as numeric), 3)', 'work_price_sum2')
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
                let table_item: {[k: string]: any} = {}, work_no = [];
                if(isArray(item.details)) {
                    for(let j = 0; j < item.details.length; j ++) {
                        work_no.push(item.details[j].id);
                    }
                }
                table_item = {
                    id: item.id,
                    work_no: work_no, //작업번호 수정필요
                    title: item.title, //제목
                    duration: item.duration, //영상길이
                    req_date: item.tc_create_date, //TC요청일시
                    youtube_url: item.youtube_url,
                    original_language: item.original_language.prefix,
                    video: isEmpty(item.tc_video) ? '' : (item.tc_video)
                }
                if(item.status > global.STATUS.indexOf("preparing") + 1){
                    table_item.price = item.tc_work_price;
                    table_item.predict_end_date = item.tc_predict_end_date;
                    table_item.end_date = item.tc_end_date;
                    table_item.status = 2;
                    if(item.status > global.STATUS.indexOf('tc_ing') + 1)
                        table_item.status = 3;
                }
                else {
                    //대기
                    table_item.status = 1;
                    table_item.price = item.temp_price;
                    table_item.end_date = null;
                    if (item.tc_predict_time_set == Trigger.ON)
                        table_item.predict_end_date = item.tc_predict_time_value * 60
                    else
                        table_item.predict_end_date = await calc_working_time(item.user.parent.screen_time_limit, item.user.parent.end_time_settings, calculate_mins(item.duration), req.decodedUser.user_type, item.is_urgent) * 60;
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
        catch( error ){
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static tcDetailCheck = async (req: Request, res: Response) => {
        const { id } = req.body;
        if (isEmpty(id))
            return res.json({ errorCode: 1, errorMsg: 'Invalid Parameter' })
        try {
            let query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                .leftJoinAndSelect("trans_request.tc_user", "worker")
                .where('"trans_request"."id" = :id', { id: id });
            let _request = await query.getOne();
            
            if (_request == undefined)
                return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id.' });
            
            if ((_request.status >= global.STATUS.indexOf("tc_ing") + 1) && _request.tc_user.id != req.decodedUser.id)
                return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id.' });
            else
                return res.json({ errorCode: 0, errorMsg: '' });
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 1, errorMsg: 'Internal Server Error' })
        }
    }
    static tcDetail = async(req: Request, res: Response) => {
        const { id } = req.body;
        if(isEmpty(id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            let query = getRepository(TransRequest)
                        .createQueryBuilder("trans_request");
            query = query.leftJoinAndSelect("trans_request.user", "user")
                    .leftJoinAndSelect("trans_request.details", "request_detail")
                    .leftJoinAndSelect("user.parent", "parent")
                    .leftJoinAndSelect('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                    .leftJoinAndSelect("trans_request.tc_user", "worker")
                    .leftJoinAndSelect('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                    .leftJoinAndSelect('worker_assign_setting_tag.tag', 'tag')
                    .leftJoinAndSelect('parent.end_time_settings', 'end_time_setting', '"end_time_setting"."work_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                    .leftJoinAndSelect('parent.screen_time_limit', 'screen_time_limit')
                    .leftJoinAndSelect("trans_request.original_language", "woring_language")
                    .leftJoinAndSelect("request_detail.translate_language", "woring_language A")
                    .where('"trans_request"."id" = :id', {id: id});
            let language_query = getRepository(TransRequest)
                                .createQueryBuilder("trans_request")
                                .leftJoinAndSelect("trans_request.user", "user")
                                .leftJoinAndSelect(UsersWorkingLanguage, "users_working_language", '"trans_request"."originalLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: req.decodedUser.id})
                                .where('"trans_request"."id" = :id and "users_working_language"."id" is not NULL ', {id: id});
            let _request = await query.getOne();
            if(_request == undefined)
                return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id.'});
            let data: {[k: string]: any} = {};
            let userRepository = getRepository(User);
            let _worker_info = await userRepository.findOne(req.decodedUser.id)
            if(_worker_info == undefined)
                return res.json({ errorCode: 15, errorMsg: 'invalid your id.'});
            if( (_request.has_original_video == Trigger.ON || _request.user.parent.has_tc_service == Trigger.OFF) &&  (_request.status == global.STATUS.indexOf("preparing") + 1) )
                return res.json({ errorCode: 2, errorMsg: 'This request has got original video. no need tc work'});
            if(_request.status > global.STATUS.indexOf("preparing") + 1) {
                //assign
                if(_request.tc_user.id != req.decodedUser.id)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id1.'});
            }
            else {
                //언어 체크
                let lang_check_count = await language_query.getCount();
                if(lang_check_count < 1)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id2.'});
                if(isEmpty(_request.user) || isEmpty(_request.user.parent))
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id3.'});
                if( !isArray(_request.user.parent.assigns) )
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id4.'});
                //수동할당 체크
                if(_request.user.parent.assigns[0].assign_type == 2)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id5.'});
                //자동할당 tag 체크
                let _tags = [], involved = false;
                if(isArray(_worker_info.tags)) {
                    for(let i = 0; i < _worker_info.tags.length; i ++)
                        _tags.push(_worker_info.tags[i].tag.id)
                }
                //전체선택 태그
                if(_request.user.parent.assigns[0].tag_type == 2)
                    involved = true;
                else if(isArray( _request.user.parent.assigns[0].setting_tags)) {
                    for(let i = 0; i < _request.user.parent.assigns[0].setting_tags.length; i ++)
                        if(_tags.indexOf(_request.user.parent.assigns[0].setting_tags[i].tag.id) >= 0) {
                            involved = true;
                            break;
                        }
                }
                if(!involved)
                    return res.json({ errorCode: 1, errorMsg: 'no permission to get information of this tc work id(tag matching problem).'});
            }
            let work_no = [];
            if(isArray(_request.details)) {
                for(let i = 0; i < _request.details.length; i ++)
                    work_no.push(_request.details[i].id);
            }
            data = {
                id: _request.id,
                work_no: work_no,
                youtube_url: _request.youtube_url,
                title: _request.title,
                duration: _request.duration,
                video: '',
                video_link: ''
            }
            if(_request.status > global.STATUS.indexOf("preparing") + 1) {
                data.price = _request.tc_work_price;
                if(isEmpty(_request.tc_end_date))
                    data.end_date = _request.tc_predict_end_date;
                else
                    data.end_date = _request.tc_end_date;
            }
            else {
                if (isArray(_request.details)) {
                    if (_request.tc_price_set == Trigger.ON)
                        data.price = _request.tc_price_value
                    else
                        data.price = await calculate_work_price(_request.user.parent_id, _request.duration, _worker_info.correction_rate, _worker_info.user_type, _request.original_language.id, _request.details[0].translate_language.id);
                }
                else
                    data.price = 0;
                data.end_date = await calc_working_time(_request.user.parent.screen_time_limit, _request.user.parent.end_time_settings, calculate_mins(_request.duration), req.decodedUser.user_type, _request.is_urgent) * 60;
                data.can_work = true;
                if(_worker_info.can_work == 0)
                    data.can_work = false;
                if(_worker_info.can_work != -1) {
                    let _current_work_count = await current_tc_work_count(req.decodedUser.id);
                    if(_worker_info.can_work <= _current_work_count)
                        data.can_work = false;
                }
                data.can_work_count = _worker_info.can_work
            }
            data.video = isEmpty(_request.tc_video) ? '' : _request.tc_video;
            data.video_link = isEmpty(_request.tc_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request.tc_video);
            data.original_language = _request.original_language.name;
            if(_request.status <= global.STATUS.indexOf('preparing') + 1)
                data.status = 1;
            else if(_request.status >= global.STATUS.indexOf('tc_complete') + 1)
                data.status = 3;
            else
                data.status = 2;
            //진행기록 미정
            let log_query = getRepository(Log)
                            .createQueryBuilder("log")
                            .leftJoinAndSelect("log.request", "request_detail")
                            .leftJoinAndSelect("request_detail.request", "parent_request")
                            .leftJoinAndSelect("log.trans_request", "trans_request")
                            .leftJoinAndSelect("trans_request.details", "child_detail")
                            .leftJoinAndSelect("log.user", "user")
                            .where(new Brackets(qb => {
                                qb.where('"trans_request"."id" = ' + id + ' or "parent_request"."id" = ' + id)
                            }))
                            .andWhere('"log"."status" <= ' + (global.STATUS.indexOf('tc_complete') + 1))
                            .orderBy('"log"."create_date"');
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
export default SubtitleTcController;
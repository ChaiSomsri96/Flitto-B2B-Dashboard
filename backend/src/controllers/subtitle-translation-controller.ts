import { Log } from './../entity/log';
import { Trigger } from './../entity/entity-enum';
import { WorkingLanguage } from './../entity/working-language';
import { RequestDetail } from './../entity/request-detail';
import { TransRequest } from './../entity/trans-request';
import { User } from './../entity/user';
import { CaptionTemp } from './../entity/caption-temp';
import { getRepository, getConnection } from 'typeorm';
import { isNotEmpty, isArray, isEmpty, isDefined } from 'class-validator';
import { calculate_duration, calculate_work_price } from './../helpers/utils';
import { insertNotice } from './../helpers/db-util';
import config from './../config/config';
import global from './../config/global';
// import { removeFile } from './../middlewares/validation';
import { Request, Response } from 'express';
var axios = require('axios').default;

class SubtitleTranslationController {
    static requestTranslate = async(req: Request, res: Response) => {
        try {
            //get youtube information
            let requester_id = res.locals.requester_id, company_id = res.locals.company_id;
            const userRepository = getRepository(User);
            let company = await userRepository.findOneOrFail(company_id)
            let requester_user = await userRepository.findOneOrFail(requester_id)

            if (company.is_card_payment == 'Y' && req.body.work_price > 0 && !(isNotEmpty(req.body.free_request_check) && req.body.free_request_check == 'Y')) {
                let data: { [k: string]: any } = {}; 
                data = req.body
                if(req.file) {
                    data.original_video = req.file.filename;
                    data.original_video_show_name = req.file.originalname;
                    data.has_original_video = Trigger.ON;
                }
                data.requester_id = requester_id
                data.company_id = company_id
                let _cap = new CaptionTemp()
                _cap.create_date = Math.floor(Date.now() / 1000)
                _cap.update_date = Math.floor(Date.now() / 1000)
                _cap.caption_data = JSON.stringify(data)
                let _cap_result = await getConnection().manager.save(_cap);  

                return res.json({ errorCode: 0, errorMsg: '', data: {caption_id: _cap_result.id}});
            }
            else {
                let { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos?id=' + req.body.youtube_id + '&key=' + config.YOUTUBE_API_KEY + '&part=snippet,contentDetails,statistics,status')
                if(data.items.length < 1)
                    return res.json({ errorCode: 1, errorMsg: "Invalid Url" });
                let duration = Math.floor(calculate_duration(data.items[0].contentDetails.duration) / 60);
                if (calculate_duration(data.items[0].contentDetails.duration) % 60 >= 30)
                    duration++;
                else if (duration == 0)
                    duration++;
                let work_price = 0 , predict_time = 0 , _prices = [] , is_free_request = false;
                // 무료요청 횟수 체크 및 가격 계산
                if( !(isNotEmpty(req.body.free_request_check)
                    && req.body.free_request_check == 'Y'
                    && requester_user.free_req_cnt >= req.body.translate_languages.length
                    && company.screen_time_limit.free_screen_limit >= duration) ) {
                    // let unit_price = 0;
                    if(isArray(company.prices)) {
                        for(let i = 0; i < company.prices.length; i ++) {
                            if(company.prices[i].original.id == req.body.original_language && (req.body.translate_languages.indexOf(company.prices[i].translate.id) >= 0 || req.body.translate_languages.indexOf(company.prices[i].translate.id.toString()) >= 0)) {
                                let _price_in_language = {
                                    language_id: company.prices[i].translate.id,
                                    work_price: 0
                                }
                                _price_in_language.work_price += company.prices[i].work_price;
                                if(isNotEmpty(requester_user.discount)) {
                                    _price_in_language.work_price -= requester_user.discount;
                                    _price_in_language.work_price = _price_in_language.work_price < 0 ? 0 : _price_in_language.work_price;
                                }
                                //원어민 검수
                                if(isNotEmpty(req.body.native_review_check) && req.body.native_review_check == 'Y')
                                    _price_in_language.work_price += company.prices[i].native_review_price
                                _prices.push(_price_in_language)
                            }
                        }
                    }
                    for(let i = 0; i < _prices.length; i ++) {
                        _prices[i].work_price = _prices[i].work_price * duration;
                        if(isNotEmpty(req.body.title_request_check) && req.body.title_request_check == 'Y')
                            _prices[i].work_price += company.title_cost;
                    }
                    //긴급번역인 경우 할증률
                    if(isNotEmpty(req.body.emergency_request_check)
                        && req.body.emergency_request_check == 'Y'
                        && company.screen_time_limit.emergency_screen_limit >= duration) {
                            for(let i = 0; i < _prices.length; i ++)
                                _prices[i].work_price = Math.floor(_prices[i].work_price * (1 + company.premium_rate / 100));
                    }
                    for(let i = 0; i < _prices.length; i ++)
                        work_price += _prices[i].work_price;
                }
                else {
                    if(isArray(company.prices)) {
                        for(let i = 0; i < company.prices.length; i ++) {
                            if(company.prices[i].original.id == req.body.original_language && (req.body.translate_languages.indexOf(company.prices[i].translate.id) >= 0 || req.body.translate_languages.indexOf(company.prices[i].translate.id.toString()) >= 0)) {
                                let _price_in_language = {
                                    language_id: company.prices[i].translate.id,
                                    work_price: 0
                                }
                                _prices.push(_price_in_language)
                            }
                        }
                    }
                    is_free_request = true;
                    work_price = 0;
                }
                //추후체크
                // console.log("point -- here" , work_price, req.body.work_price)
                /*
                if(work_price != req.body.work_price) {
                    removeFile(req, 'translate')
                    return res.json({
                        errorCode: 1, errorMsg: 'work price is wrong from frontend.'
                    })
                } */
                //작업 예상 시간 계산
                //진급 번역 케이스
                if(isNotEmpty(req.body.emergency_request_check)
                && req.body.emergency_request_check == 'Y'
                && company.screen_time_limit.emergency_screen_limit >= duration
                && !is_free_request) {
                    /* for(let i = 0; i < company.end_time_settings.length; i ++)
                        predict_time += (duration * company.end_time_settings[i].emergency_trans_time + company.end_time_settings[i].emergency_add_time); */
                    predict_time = 24 * 60;
                }
                else if(company.screen_time_limit.general_screen_limit >= duration) {
                    //48시간 이내 초과하지 않는 케이스
                    /*
                    for(let i = 0; i < company.end_time_settings.length; i ++)
                        predict_time += (duration * company.end_time_settings[i].general_trans_time + company.end_time_settings[i].general_trans_add_time);
                    */
                predict_time = 48 * 60;
                }
                else {
                    //48시간 초과하는 케이스
                    for(let i = 0; i < company.end_time_settings.length; i ++)
                        predict_time += (duration * company.end_time_settings[i].general_excess_time + company.end_time_settings[i].general_excess_add_time);
                    /*
                    ------------
                    */
                    predict_time = predict_time + company.screen_time_limit.general_end_time;
                    //추후 체크
                    /* if(predict_time != req.body.predict_time) {
                        removeFile(req, 'translate')
                        return res.json({
                            errorCode: 1, errorMsg: 'predict time is wrong from frontend.'
                        })
                    } */
                }
                let trans_request = new TransRequest();
                trans_request.tc_create_date = trans_request.tc_update_date = trans_request.update_date = trans_request.create_date = Math.floor(Date.now() / 1000);
                trans_request.youtube_url = req.body.youtube_url;
                trans_request.youtube_id = req.body.youtube_id;
                trans_request.duration = calculate_duration(data.items[0].contentDetails.duration);
                trans_request.duration_minute = duration;
                trans_request.title = data.items[0].snippet.title;
                trans_request.description = data.items[0].snippet.description;
                if(req.file) {
                    trans_request.original_video = req.file.filename;
                    trans_request.original_video_show_name = req.file.originalname;
                    trans_request.has_original_video = Trigger.ON;
                }
                //24시간 긴급요청
                if(isNotEmpty(req.body.emergency_request_check)
                && req.body.emergency_request_check == 'Y'
                && company.screen_time_limit.emergency_screen_limit >= duration)
                    trans_request.is_urgent = req.body.emergency_request_check;
                //YouTube 자동적용
                if(isNotEmpty(req.body.youtube_apply_check) && req.body.youtube_apply_check == 'Y')
                    trans_request.is_youtube_request = req.body.youtube_apply_check;
                //제목/설명 번역
                if(isNotEmpty(req.body.title_request_check) && req.body.title_request_check == 'Y')
                    trans_request.is_title_desc = req.body.title_request_check;
                //원어민 검수
                if(isNotEmpty(req.body.native_review_check) && req.body.native_review_check == 'Y')
                    trans_request.is_native_review = req.body.native_review_check;
                if(isDefined(req.body.translator_memo))
                    trans_request.memo = req.body.translator_memo;
                if(isDefined(req.body.requester_memo))
                    trans_request.requester_memo = req.body.requester_memo;
                trans_request.predict_end_date = trans_request.create_date + predict_time * 60;
                trans_request.status = global.STATUS.indexOf("preparing") + 1;
                trans_request.work_price = work_price;
                trans_request.currency_type = company.currency_type;

                const workingLanguageRepository = getRepository(WorkingLanguage);
                let _workingLanguage = await workingLanguageRepository.findOneOrFail(req.body.original_language);
                trans_request.original_language = _workingLanguage;
                //request detail
                trans_request.details = [];
                for(let i = 0; i < req.body.translate_languages.length; i ++) {
                    let _request_detail = new RequestDetail();
                    _request_detail.create_date = Math.floor(Date.now() / 1000);
                    _request_detail.update_date = Math.floor(Date.now() / 1000);
                    _request_detail.status = global.STATUS.indexOf("preparing") + 1;
                    for(let j = 0; j < _prices.length; j ++)
                        if(_prices[j].language_id == req.body.translate_languages[i]) {
                            _request_detail.work_price = _prices[j].work_price;
                            break;
                        }
                    let _translateWorkingLanguage = await workingLanguageRepository.findOneOrFail(req.body.translate_languages[i]);
                    _request_detail.translate_language = _translateWorkingLanguage;
                    if(trans_request.has_original_video == Trigger.ON)
                        _request_detail.translate_req_date = Math.floor(Date.now() / 1000);
                    if (company.has_tc_service == Trigger.OFF)
                        _request_detail.translate_req_date = Math.floor(Date.now() / 1000);
                    await getConnection().manager.save(_request_detail);
                    trans_request.details.push(_request_detail);
                }
                trans_request.user = requester_user;
                let _trans_request = await getConnection().manager.save(trans_request);
                //진행기록--record(check later)
                let _log = new Log();
                _log.create_date = Math.floor(Date.now() / 1000);
                _log.update_date = Math.floor(Date.now() / 1000);
                _log.user = requester_user;
                _log.trans_request = _trans_request;
                _log.status = global.STATUS.indexOf("preparing") + 1;
                await getConnection().manager.save(_log);
                //
                if(is_free_request) {
                    requester_user.free_req_cnt -= _prices.length;
                    await getConnection().manager.save(requester_user);
                }
                //알림발송등록--notice-ghost
                await insertNotice(requester_user, _trans_request, null, 1, Trigger.OFF)
                //notice-ghost
                return res.json({ errorCode: 0, errorMsg: '' });
            }
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static detail = async(req: Request, res: Response) => {
        try {
            const { id } = req.body;
            if(isEmpty(id))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            let query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail");
            query = query.leftJoinAndSelect("request_detail.request", "trans_request")
                        .leftJoinAndSelect("request_detail.workers", "request_detail_worker")
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("user.parent", "parent")
                        .leftJoinAndSelect("request_detail.translate_language", "woring_language A")
                        .leftJoinAndSelect("trans_request.original_language", "woring_language")
                        .leftJoinAndSelect("request_detail.logs", "log")
                        .leftJoinAndSelect("log.user", "user B")
                        .where('"request_detail"."id" = :request_detail_id', {request_detail_id: id});

            let _request_detail = await query.getOne();

            if(_request_detail == undefined)
                return res.json({ errorCode: 15, errorMsg: "Invalid Request Id." });
            
            if(global.ROLE[req.decodedUser.user_type - 1] == 'requester' && _request_detail.request.user.id != req.decodedUser.id) {
                return res.json({ errorCode: 401, errorMsg: "no permission to edit this request id."});
            }
            if (global.ROLE[req.decodedUser.user_type - 1] == 'company' && _request_detail.request.user.parent_id != req.decodedUser.id) {
                return res.json({ errorCode: 401, errorMsg: "no permission to edit this request id."});   
            }

            let data: {[k: string]: any} = {};
            data = {
                status: _request_detail.status <= 8 ? global.STATUS[_request_detail.status - 1] : 'subtitle_apply_failed',  //진행상태
                work_number: _request_detail.id,                    //작업번호
                request_time: _request_detail.request.create_date,  //요청일시
                predict_end_date: _request_detail.request.predict_end_date, //완료예정일시
                youtube_url: _request_detail.request.youtube_url,
                working_language: {
                   original_language: _request_detail.request.original_language.name,
                   translate_language: _request_detail.translate_language.name
                },
                duration: _request_detail.request.duration,
                work_price: _request_detail.work_price,
                currency_type: _request_detail.request.currency_type,
                native_review_check: _request_detail.request.is_native_review,
                title_request_check: _request_detail.request.is_title_desc,
                youtube_apply_check: _request_detail.request.is_youtube_request,
                youtube_applying: _request_detail.youtube_applying,
                emergency_request_check: _request_detail.request.is_urgent ,
                title: _request_detail.request.title,
                description: _request_detail.request.description,
                original_video_name: (isEmpty(_request_detail.request.original_video_show_name) ? '' : _request_detail.request.original_video_show_name),
                original_video_link: (isEmpty(_request_detail.request.original_video_show_name) ? '' : ( config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.request.original_video )),
                translator_memo: (isEmpty(_request_detail.request.memo) ? '' : _request_detail.request.memo),
                requester_memo: (isEmpty(_request_detail.request.requester_memo) ? '' : _request_detail.request.requester_memo),
                card_payment: _request_detail.request.is_card_payment
            }
            //진행기록
            let log_query = getRepository(Log)
                            .createQueryBuilder("log")
                            .leftJoinAndSelect("log.request", "request_detail")
                            .leftJoinAndSelect("request_detail.request", "parent_request")
                            .leftJoinAndSelect("log.trans_request", "trans_request")
                            .leftJoinAndSelect("trans_request.details", "child_detail")
                            .leftJoinAndSelect("log.user", "user")
                            .where('"request_detail"."id" = ' + id)
                            .orWhere('"child_detail"."id" = ' + id)
                            .orderBy('"log"."create_date"');
            let _logs = await log_query.getMany();
            data.logs = []
            if(isArray(_logs)) {
                for (let i = 0; i < _logs.length; i++)
                    if (_logs[i].status <= 8) {
                        data.logs.push({
                            log_date: _logs[i].create_date,
                            status: global.STATUS[_logs[i].status - 1],
                            user_type: global.ROLE[_logs[i].user.user_type - 1],
                            user_name: _logs[i].user.user_name,
                            user_id: _logs[i].user.login_id
                        })   
                    }
                    else {
                        data.logs.push({
                            log_date: _logs[i].create_date,
                            status: global.STATUS[8],
                            user_type: global.ROLE[_logs[i].user.user_type - 1],
                            user_name: _logs[i].user.user_name,
                            user_id: _logs[i].user.login_id,
                            error_type: (_logs[i].status - 8)
                        })   
                    }
            }
            //작업완료 라벨
            if(_request_detail.request.is_native_review == 'Y') //번역 + 검수 -> 완료
                data.work_finish = 'review_complete';
            else
                data.work_finish = 'translation_complete'; // 번역 -> 완료
            data.is_finish = _request_detail.is_end;
            if(global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
                //작업금액(번역가, 검수자) - admin인 경우 에만 response
                if(isArray(_request_detail.workers)) {
                    for(let i = 0; i < _request_detail.workers.length; i ++) {
                        if(_request_detail.workers[i].worker_type == (global.ROLE.indexOf("translator") + 1)) {
                            data.translate_work_price = _request_detail.translate_work_price
                        }
                        if ( (_request_detail.workers[i].worker_type == (global.ROLE.indexOf("reviewer") + 1))
                        && _request_detail.request.is_native_review == 'Y') {
                            // data.review_work_price = _request_detail.workers[i].price;
                            data.review_work_price = _request_detail.review_work_price
                        }
                    }
                }
                //작업금액 TC
                if(_request_detail.request.has_original_video == Trigger.OFF && _request_detail.request.user.parent.has_tc_service == Trigger.ON && _request_detail.request.status >= (global.STATUS.indexOf('tc_ing') + 1)) {
                    data.tc_work_price = _request_detail.request.tc_work_price;
                }
                //예상금액 계산
                if (_request_detail.request.has_original_video == Trigger.OFF && _request_detail.request.user.parent.has_tc_service == Trigger.ON && !isDefined(data.tc_work_price)) {
                    if (_request_detail.request.tc_price_set == Trigger.ON)
                        data.tc_work_price = _request_detail.request.tc_price_value
                    else {
                        data.tc_work_price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, 0, global.ROLE.indexOf('tc') + 1, _request_detail.request.original_language.id, _request_detail.translate_language.id)
                    }  
                }
                if (!isDefined(data.translate_work_price)) {
                    if (_request_detail.translate_price_set == Trigger.ON)
                        data.translate_work_price = _request_detail.translate_price_value
                    else
                        data.translate_work_price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, 0, global.ROLE.indexOf('translator') + 1, _request_detail.request.original_language.id, _request_detail.translate_language.id)
                }
                if(_request_detail.request.is_native_review == 'Y' && !isDefined(data.review_work_price)) {
                    if (_request_detail.review_price_set == Trigger.ON)
                        data.review_work_price = _request_detail.review_price_value
                    else
                        data.review_work_price = await calculate_work_price(_request_detail.request.user.parent_id, _request_detail.request.duration, 0, global.ROLE.indexOf('reviewer') + 1, _request_detail.request.original_language.id, _request_detail.translate_language.id)
                }
                //
                if(_request_detail.request.is_native_review == 'Y' && (global.STATUS[_request_detail.status-1] == 'review_complete' || global.STATUS[_request_detail.status-1] == 'subtitle_apply' || global.STATUS[_request_detail.status-1] == 'subtitle_apply_failed')) {
                    //검수완료 , 자막적용 -- 제목/설명 번역 , 제목 / 설명 검수
                    data.review_title = isEmpty(_request_detail.review_title)?'':_request_detail.review_title;
                    data.review_description = isEmpty(_request_detail.review_description) ? '' : _request_detail.review_description;
                    data.translate_title = isEmpty(_request_detail.translate_title)?'':_request_detail.translate_title;
                    data.translate_description = isEmpty(_request_detail.translate_description)?'':_request_detail.translate_description;
                }

                if(global.STATUS[_request_detail.status-1] == 'translation_complete' || global.STATUS[_request_detail.status-1] == 'subtitle_apply' || global.STATUS[_request_detail.status-1] == 'subtitle_apply_failed') {
                    //번역완료, 자막적용 -- 제목/설명 번역
                    data.translate_title = isEmpty(_request_detail.translate_title) ? '' : _request_detail.translate_title;
                    data.translate_description = isEmpty(_request_detail.translate_description) ? '' : _request_detail.translate_description;
                }

               if(_request_detail.translate_status == 3) {
                    data.translate_video_name = isEmpty(_request_detail.translate_video) ? '' : (_request_detail.translate_video);
                    data.translate_video_link = isEmpty(_request_detail.translate_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.translate_video);
               }
               if(_request_detail.review_status == 3) {
                    data.reviewer_video_name = isEmpty(_request_detail.review_video) ? '' : (_request_detail.review_video);
                    data.reviewer_video_link = isEmpty(_request_detail.review_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.review_video);
               }
                //tc video
                data.tc_video_name = isEmpty(_request_detail.request.tc_video) ? '' : (_request_detail.request.tc_video);
                data.tc_video_link = isEmpty(_request_detail.request.tc_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.request.tc_video)
            }
            else {
                if(_request_detail.request.is_native_review == 'Y' && (global.STATUS[_request_detail.status-1] == 'review_complete' || global.STATUS[_request_detail.status-1] == 'subtitle_apply' || global.STATUS[_request_detail.status-1] == 'subtitle_apply_failed')) {
                    data.translate_title = _request_detail.review_title;
                    data.translate_description = _request_detail.review_description;
                    data.translate_video_name = isEmpty(_request_detail.review_video) ? '' : (_request_detail.review_video);
                    data.translate_video_link = isEmpty(_request_detail.review_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.review_video); 
                }
                else if(_request_detail.request.is_native_review == 'N' && (global.STATUS[_request_detail.status-1] == 'translation_complete' || global.STATUS[_request_detail.status-1] == 'subtitle_apply' || global.STATUS[_request_detail.status-1] == 'subtitle_apply_failed')) {
                    data.translate_title = _request_detail.translate_title;
                    data.translate_description = _request_detail.translate_description;
                    data.translate_video_name = isEmpty(_request_detail.translate_video) ? '' : (_request_detail.translate_video);
                    data.translate_video_link = isEmpty(_request_detail.translate_video) ? '' : (config.TRANSLATE_VIDEO_PREFIX_URL + _request_detail.translate_video);
                }
            }

            if (isNotEmpty(data.tc_work_price)) 
                data.tc_work_price = parseFloat(data.tc_work_price).toFixed(3)
            if (isNotEmpty(data.translate_work_price)) 
                data.translate_work_price = parseFloat(data.translate_work_price).toFixed(3)
            if (isNotEmpty(data.review_work_price)) 
                data.review_work_price = parseFloat(data.review_work_price).toFixed(3)
            return res.json({ errorCode: 0, errorMsg: "", data: data });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default SubtitleTranslationController;
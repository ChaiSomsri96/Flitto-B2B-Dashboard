import { AnalysisDate } from './../entity/analysis-date';
import { RequestDetailWorker } from './../entity/request-detail-worker';
import { RequestDetail } from './../entity/request-detail';
import { getRepository } from 'typeorm';
import { UserTag } from './../entity/user-tag';
import { User } from './../entity/user';
import { Manager } from './../entity/manager';
import { isEmpty, isNotEmpty, isArray } from 'class-validator';
import { TransRequest } from './../entity/trans-request';
import { UsersWorkingLanguage } from './../entity/users-working-language';
import { UsersTranslatePair } from './../entity/users-translate-pair';
import { Brackets, getConnection } from 'typeorm';
import { Request, Response } from "express";
import { CurrencyType } from './../entity/entity-enum';
import  { getDateString, getGraphDateFormat } from './../helpers/utils';
import global from './../config/global';
import config from './../config/config';
class DashboardController {
    //번역 현황
    static getRequestStatus = async(req: Request, res: Response) => {
        let data: {[k: string]: any} = {};
        var now = new Date();
        let startOfDay = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)).getTime() / 1000);
        try {
            if (global.ROLE[req.decodedUser.user_type - 1] == 'admin') {

                let query = getConnection()
                    .createQueryBuilder()
                    .select('count("request_detail"."id")', 'new_req_cnt')
                    .from(RequestDetail, "request_detail")
                    .leftJoin("request_detail.request", "trans_request");

                query = query.andWhere('"trans_request"."create_date" >= ' + startOfDay.toString())
                    .andWhere('"trans_request"."create_date" < ' + (startOfDay + 86400).toString());
                
                let _result = await query.getRawOne();
                data.new_req_cnt = isEmpty(_result.new_req_cnt) ? 0 : _result.new_req_cnt;

                query = getConnection()
                    .createQueryBuilder()
                    .select('count("request_detail"."id")', 'progress_req_cnt')
                    .from(RequestDetail, "request_detail");
                query = query.andWhere('"request_detail"."is_end" = \'N\'');
                _result = await query.getRawOne();
                data.progress_req_cnt = isEmpty(_result.progress_req_cnt) ? 0 : _result.progress_req_cnt;

                query = getConnection()
                    .createQueryBuilder()
                    .select('count("request_detail"."id")', 'end_req_cnt')
                    .from(RequestDetail, "request_detail");
                query = query.andWhere('"request_detail"."end_date" >= ' + startOfDay.toString())
                    .andWhere('"request_detail"."end_date" < ' + (startOfDay + 86400).toString())
                    .andWhere('"request_detail"."is_end" = \'Y\'');

                _result = await query.getRawOne();
                data.end_req_cnt = isEmpty(_result.end_req_cnt) ? 0 : _result.end_req_cnt;
            }
            else if(global.ROLE[req.decodedUser.user_type-1] == 'requester' || global.ROLE[req.decodedUser.user_type-1] == 'company' || global.ROLE[req.decodedUser.user_type-1] == 'manager') {
                let query = getConnection()
                   .createQueryBuilder()
                   .select('count("trans_request"."id")', 'new_req_cnt')
                   .from(TransRequest, "trans_request");

                if(global.ROLE[req.decodedUser.user_type-1] == 'company') {
                    query = query.leftJoin('trans_request.user', 'user');
                    query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
                }
                else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                    query = query.leftJoin('trans_request.user', 'user')
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id);
                    query = query.where('"manager"."id" is not null')
                }
                else if(global.ROLE[req.decodedUser.user_type-1] == 'requester')
                    query = query.where('"trans_request"."userId" = ' + req.decodedUser.id)

                query = query.andWhere('"trans_request"."create_date" >= ' + startOfDay.toString())
                    .andWhere('"trans_request"."create_date" < ' + (startOfDay + 86400).toString());
                let _result = await query.getRawOne();
                data.new_req_cnt = isEmpty(_result.new_req_cnt) ? 0 : _result.new_req_cnt;

                query = getConnection()
                        .createQueryBuilder()
                        .select('count("trans_request"."id")', 'progress_req_cnt')
                        .from(TransRequest, "trans_request")
                if(global.ROLE[req.decodedUser.user_type-1] == 'company') {
                        query = query.leftJoin('trans_request.user', 'user');
                        query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
                }
                else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                    query = query.leftJoin('trans_request.user', 'user')
                    .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id);
                    query = query.where('"manager"."id" is not null')
                }
                else if(global.ROLE[req.decodedUser.user_type-1] == 'requester')
                        query = query.where('"trans_request"."userId" = ' + req.decodedUser.id)

                query = query.andWhere('"trans_request"."is_end" = \'N\'');
                _result = await query.getRawOne();
                data.progress_req_cnt = isEmpty(_result.progress_req_cnt) ? 0 : _result.progress_req_cnt;

                query = getConnection()
                    .createQueryBuilder()
                    .select('count("trans_request"."id")', 'end_req_cnt')
                    .from(TransRequest, "trans_request")
                if(global.ROLE[req.decodedUser.user_type-1] == 'company') {
                    query = query.leftJoin('trans_request.user', 'user');
                    query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
                }
                else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                    query = query.leftJoin('trans_request.user', 'user')
                    .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id);
                    query = query.where('"manager"."id" is not null')
                }
                else if(global.ROLE[req.decodedUser.user_type-1] == 'requester')
                    query = query.where('"trans_request"."userId" = ' + req.decodedUser.id)

                query = query.andWhere('"trans_request"."end_date" >= ' + startOfDay.toString())
                    .andWhere('"trans_request"."end_date" < ' + (startOfDay + 86400).toString())
                    .andWhere('"trans_request"."is_end" = \'Y\'');

                _result = await query.getRawOne();
                data.end_req_cnt = isEmpty(_result.end_req_cnt) ? 0 : _result.end_req_cnt;
            }
            else if(global.ROLE[req.decodedUser.user_type-1] == 'tc') {
                let status = global.STATUS.indexOf("preparing") + 1;
                //작업수락 가능한 TC
                let query = getRepository(TransRequest)
                    .createQueryBuilder('trans_request')
                    .leftJoin(UsersWorkingLanguage, "users_working_language", '"trans_request"."originalLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', { user_id: req.decodedUser.id })
                    .leftJoin("trans_request.user", "user", "trans_request.status <= :status", { status: status })
                    .leftJoin("user.parent", 'parent')
                    .leftJoin('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = :worker_type', { worker_type: req.decodedUser.user_type.toString() })
                    .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                    .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = :user_id', { user_id: req.decodedUser.id })
                    .where('"trans_request"."status" <= ' + status)
                    .andWhere(new Brackets(qb => {
                        qb.where('"users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2))');
                    }))
                    .andWhere('"trans_request"."has_original_video" = \'N\'')
                    .andWhere('"parent"."has_tc_service" = \'Y\'');
                data.allow_req_cnt = await query.getCount();
                let _userRepository = getRepository(User);
                let _worker_info = await _userRepository.findOne(req.decodedUser.id);
                if(_worker_info == undefined)
                    return res.json({ errorCode: 15, errorMsg: 'invalid your id.'});
                //진행중
                query = getConnection()
                        .createQueryBuilder()
                        .select('count("trans_request"."id")', 'progress_req_cnt')
                        .from(TransRequest, "trans_request")
                        .where('"trans_request"."tc_status" = 2')
                        .andWhere('"trans_request"."tcUserId" = ' + req.decodedUser.id)
                let _result = await query.getRawOne();
                data.progress_req_cnt = isEmpty(_result.progress_req_cnt) ? 0 : _result.progress_req_cnt;
                //작업가능
                data.can_work = _worker_info.can_work;
                //이번달 완료한 TC
                let startOfThisMonthDay = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).getTime() / 1000);
                query = getConnection()
                        .createQueryBuilder()
                        .select('count("trans_request"."id")', 'end_req_cnt')
                        .from(TransRequest, "trans_request")
                        .where('"trans_request"."tc_status" = 3')
                        .andWhere('"trans_request"."tcUserId" = ' + req.decodedUser.id)
                        .andWhere('"trans_request"."tc_end_date" >= ' + startOfThisMonthDay);
                _result = await query.getRawOne();
                data.end_req_cnt = isEmpty(_result.end_req_cnt) ? 0 : _result.end_req_cnt;
            }
            else if(global.ROLE[req.decodedUser.user_type-1] == 'translator' || global.ROLE[req.decodedUser.user_type-1] == 'reviewer') {
                let status = 1;
                if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                    status = global.STATUS.indexOf("tc_complete") + 1;
                else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer')
                    status = global.STATUS.indexOf("translation_complete") + 1;
                //작업가능한 번역건
                let query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail")
                        .leftJoin("request_detail.request", "trans_request")
                        .leftJoin("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', {worker_type: req.decodedUser.user_type})
                        .leftJoin("trans_request.user", "user")
                        .leftJoin("user.parent", 'parent')
                        .leftJoin('parent.assigns', 'worker_assign_setting', '"worker_assign_setting"."worker_type" = :worker_type', {worker_type: req.decodedUser.user_type.toString()})
                        .leftJoin('worker_assign_setting.setting_tags', 'worker_assign_setting_tag')
                        .leftJoin(UserTag, "user_tag", '"user_tag"."tagId" = "worker_assign_setting_tag"."tagId" and "user_tag"."userId" = :user_id', {user_id: req.decodedUser.id});

                if(global.ROLE[req.decodedUser.user_type - 1] == 'translator') {
                    query = query.leftJoin(UsersTranslatePair, "users_translate_pair", '"trans_request"."originalLanguageId" = "users_translate_pair"."originalId" \
                        and "request_detail"."translateLanguageId" = "users_translate_pair"."translateId" \
                        and "users_translate_pair"."userId" = :user_id', { user_id: req.decodedUser.id });
                    
                    /*
                    query = query.where(new Brackets(qb => {
                        qb.where('"users_translate_pair"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2))')
                    }));
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('("request_detail"."status" >= ' + status + ' and "trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\') \
                         or ("request_detail"."status" = ' + (global.STATUS.indexOf("preparing") + 1) + ' and ("trans_request"."has_original_video" != \'N\' or "parent"."has_tc_service" != \'Y\') )')
                    })); */
                    query = query.where(new Brackets(qb => {
                        qb.where('( "users_translate_pair"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) and request_detail.status <= ' + status +') or (request_detail.status > ' + status +' and "request_detail_worker"."userId" = ' + req.decodedUser.id + ')')
                    }));
                    query = query.andWhere(new Brackets(qb => {
                        qb.where('("request_detail"."status" >= ' + status + ' and "trans_request"."has_original_video" = \'N\' and "parent"."has_tc_service" = \'Y\') or ("request_detail"."status" >= ' + (global.STATUS.indexOf("preparing") + 1) + ' and ("trans_request"."has_original_video" != \'N\' or "parent"."has_tc_service" = \'N\'))')
                    }));
                    let status_query = '("request_detail"."status" = 3) or ("request_detail"."status" = 1 and "trans_request"."has_original_video" != \'N\') or ("request_detail"."status" = 1 and "parent"."has_tc_service" = \'N\')'
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(status_query)
                    }));
                }
                else if(global.ROLE[req.decodedUser.user_type - 1] == 'reviewer') {
                    query = query.leftJoin(UsersWorkingLanguage, "users_working_language", '"request_detail"."translateLanguageId" = "users_working_language"."workingLanguageId" and "users_working_language"."userId" = :user_id', {user_id: req.decodedUser.id});
                    /*
                    query = query.where(new Brackets(qb => {
                        qb.where('"users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2))')
                    }));
                    query = query.andWhere('"trans_request"."is_native_review" = \'Y\'')
                        .andWhere('"request_detail"."status" >= ' + status);
                    */
                    query = query.where(new Brackets(qb => {
                        qb.where('( "users_working_language"."id" is not NULL and (("user_tag"."id" is not NULL) or ("worker_assign_setting"."tag_type" = 2)) and request_detail.status <= ' + status +') or (request_detail.status > ' + status +' and "request_detail_worker"."userId" = ' + req.decodedUser.id + ')')
                    }));
                    query = query.andWhere('"trans_request"."is_native_review" = \'Y\'')
                        .andWhere('"request_detail"."status" >= ' + status);
                    query = query.andWhere('"request_detail"."status" = 5');
                }
                data.allow_req_cnt = await query.getCount();
                let _userRepository = getRepository(User);
                let _worker_info = await _userRepository.findOne(req.decodedUser.id);
                if(_worker_info == undefined)
                    return res.json({ errorCode: 15, errorMsg: 'invalid your id.'});
                //작업가능
                data.can_work = _worker_info.can_work;
                //진행중
                query = getConnection()
                    .createQueryBuilder()
                    .select('count("request_detail"."id")', 'progress_req_cnt')
                    .from(RequestDetail, "request_detail")
                    .leftJoin("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', {worker_type: req.decodedUser.user_type})
                    if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                        query = query.where('"request_detail"."translate_status" = 2')
                    else
                        query = query.where('"request_detail"."review_status" = 2')
                    query = query.andWhere('"request_detail_worker"."userId" = ' + req.decodedUser.id);

                let _result = await query.getRawOne();
                data.progress_req_cnt = isEmpty(_result.progress_req_cnt) ? 0 : _result.progress_req_cnt;

                //이번달 완료한 번역
                let startOfThisMonthDay = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).getTime() / 1000);
                query = getConnection()
                        .createQueryBuilder()
                        .select('count("request_detail"."id")', 'end_req_cnt')
                        .from(RequestDetail, "request_detail")
                        .leftJoin("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', {worker_type: req.decodedUser.user_type});

                if(global.ROLE[req.decodedUser.user_type - 1] == 'translator')
                    query = query.where('"request_detail"."translate_status" = 3')
                else
                    query = query.where('"request_detail"."review_status" = 3')
                query = query.andWhere('"request_detail_worker"."userId" = ' + req.decodedUser.id)
                             .andWhere('"request_detail_worker"."end_date" >= ' + startOfThisMonthDay);
                _result = await query.getRawOne();
                data.end_req_cnt = isEmpty(_result.end_req_cnt) ? 0 : _result.end_req_cnt;
            }
            return res.json({errorCode: 0, errorMsg: '', data: data});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    //정산 현황 (지난달 번역금액 , 이번달 번역금액 , 전체 번역금액)
    static getBillingStatus = async(req: Request, res: Response) => {
        let currency_type = CurrencyType.JPY;
        if(global.ROLE[req.decodedUser.user_type - 1] == 'admin' && isNotEmpty(req.body.currency_type)) {
            currency_type = req.body.currency_type;
        }
        try {
            let data: {[k: string]: any} = {};
            var now = new Date();
            let firstDayOfThisMonth = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).getTime() / 1000);
            let firstDayOfLastMonth = Math.round(new Date(Date.UTC(now.getFullYear(), ((now.getMonth() - 1 < 0)?11:(now.getMonth() - 1)), 1, 0, 0, 0)).getTime() / 1000);
            //지난달 번역금액
            let query = getConnection()
                        .createQueryBuilder()
                        .select('case \
                        when sum("trans_request"."work_price") is NULL \
                        then 0 \
                        else sum("trans_request"."work_price") \
                        end \
                        as last_month_work_price')
                        .from(TransRequest, "trans_request")
            if(global.ROLE[req.decodedUser.user_type - 1] == 'requester')
                query = query.where('"trans_request"."userId" = ' + req.decodedUser.id)
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                query = query.leftJoin('trans_request.user', 'user')
                query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                query = query.leftJoin('trans_request.user', 'user')
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                        .where('"manager"."id" is not null')
            }
            else {
                query = query.where('"trans_request"."currency_type" = :currency_type', {currency_type: currency_type});
            }
            query = query.andWhere('"trans_request"."is_end" = \'Y\'')
                        .andWhere('"trans_request"."end_date" >= ' + firstDayOfLastMonth)
                        .andWhere('"trans_request"."end_date" < ' + firstDayOfThisMonth);
            let _result = await query.getRawOne();
            data.last_month_work_price = isEmpty(_result.last_month_work_price) ? 0 : _result.last_month_work_price;
            //이번달 번역금액
            query = getConnection()
                        .createQueryBuilder()
                        .select('case \
                        when sum("trans_request"."work_price") is NULL \
                        then 0 \
                        else sum("trans_request"."work_price") \
                        end \
                        as this_month_work_price')
                        .from(TransRequest, "trans_request")
            if(global.ROLE[req.decodedUser.user_type - 1] == 'requester')
                        query = query.where('"trans_request"."userId" = ' + req.decodedUser.id)
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                        query = query.leftJoin('trans_request.user', 'user')
                        query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                query = query.leftJoin('trans_request.user', 'user')
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                        .where('"manager"."id" is not null')
            }
            else {
                query = query.where('"trans_request"."currency_type" = :currency_type', {currency_type: currency_type});
            }
                        query = query.andWhere('"trans_request"."is_end" = \'Y\'')
                        .andWhere('"trans_request"."end_date" >= ' + firstDayOfThisMonth);
            _result = await query.getRawOne();
            data.this_month_work_price = isEmpty(_result.this_month_work_price) ? 0 : _result.this_month_work_price;
            //전체 번역금액
            query = getConnection()
                        .createQueryBuilder()
                        .select('case \
                        when sum("trans_request"."work_price") is NULL \
                        then 0 \
                        else sum("trans_request"."work_price") \
                        end \
                        as total_work_price')
                        .from(TransRequest, "trans_request")
            if(global.ROLE[req.decodedUser.user_type - 1] == 'requester')
                        query = query.where('"trans_request"."userId" = ' + req.decodedUser.id)
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                        query = query.leftJoin('trans_request.user', 'user')
                        query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                query = query.leftJoin('trans_request.user', 'user')
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                        .where('"manager"."id" is not null')
            }
            else {
                query = query.where('"trans_request"."currency_type" = :currency_type', {currency_type: currency_type});
            }
            query = query.andWhere('"trans_request"."is_end" = \'Y\'')
            _result = await query.getRawOne();
            data.total_work_price = isEmpty(_result.total_work_price) ? 0 : _result.total_work_price;
            return res.json({errorCode: 0, errorMsg: '', data: data});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getWorkerBillingStatus = async(req: Request, res: Response) => {
        let data: {[k: string]: any} = {};
        var now = new Date();
        let firstDayOfThisMonth = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).getTime() / 1000);
        let firstDayOfLastMonth = Math.round(new Date(Date.UTC(now.getFullYear(), ((now.getMonth() - 1 < 0)?11:(now.getMonth() - 1)), 1, 0, 0, 0)).getTime() / 1000);
        try {
            //
            if(global.ROLE[req.decodedUser.user_type - 1] == 'tc') {
                let query = getConnection()
                .createQueryBuilder()
                .select('case \
                when sum("trans_request"."tc_work_price") is NULL \
                then 0 \
                else sum("trans_request"."tc_work_price") \
                end \
                as total_work_price')
                .from(TransRequest, "trans_request")
                .where('"trans_request"."tc_status" = 3')
                .andWhere('"trans_request"."tcUserId" = ' + req.decodedUser.id);
                let _result = await query.getRawOne();
                data.total_work_price = isEmpty(_result.total_work_price) ? 0 : _result.total_work_price;

                query = getConnection()
                .createQueryBuilder()
                .select('case \
                when sum("trans_request"."tc_work_price") is NULL \
                then 0 \
                else sum("trans_request"."tc_work_price") \
                end \
                as last_month_work_price')
                .from(TransRequest, "trans_request")
                .where('"trans_request"."tc_status" = 3')
                .andWhere('"trans_request"."tcUserId" = ' + req.decodedUser.id)
                .andWhere('"trans_request"."tc_end_date" >= ' + firstDayOfLastMonth)
                .andWhere('"trans_request"."tc_end_date" < ' + firstDayOfThisMonth);
                _result = await query.getRawOne();
                data.last_month_work_price = isEmpty(_result.last_month_work_price) ? 0 : _result.last_month_work_price;

                query = getConnection()
                .createQueryBuilder()
                .select('case \
                when sum("trans_request"."tc_work_price") is NULL \
                then 0 \
                else sum("trans_request"."tc_work_price") \
                end \
                as this_month_work_price')
                .from(TransRequest, "trans_request")
                .where('"trans_request"."tc_status" = 3')
                .andWhere('"trans_request"."tcUserId" = ' + req.decodedUser.id)
                .andWhere('"trans_request"."tc_end_date" >= ' + firstDayOfThisMonth);
                _result = await query.getRawOne();
                data.this_month_work_price = isEmpty(_result.this_month_work_price) ? 0 : _result.this_month_work_price;
                return res.json({ errorCode: 0, errorMsg: "", data: data });
            }
            else {
                let query = getConnection()
                            .createQueryBuilder()
                            .select('case \
                            when sum("request_detail_worker"."price") is NULL \
                            then 0 \
                            else sum("request_detail_worker"."price") \
                            end \
                            as total_work_price')
                            .from(RequestDetailWorker, "request_detail_worker")
                            .where('"request_detail_worker"."is_end" = \'Y\'')
                            .andWhere('"request_detail_worker"."userId" = ' + req.decodedUser.id)
                let _result = await query.getRawOne();
                data.total_work_price = isEmpty(_result.total_work_price) ? 0 : _result.total_work_price;

                query = getConnection()
                        .createQueryBuilder()
                        .select('case \
                        when sum("request_detail_worker"."price") is NULL \
                        then 0 \
                        else sum("request_detail_worker"."price") \
                        end \
                        as last_month_work_price')
                        .from(RequestDetailWorker, "request_detail_worker")
                        .where('"request_detail_worker"."is_end" = \'Y\'')
                        .andWhere('"request_detail_worker"."userId" = ' + req.decodedUser.id)
                        .andWhere('"request_detail_worker"."end_date" >= ' + firstDayOfLastMonth)
                        .andWhere('"request_detail_worker"."end_date" < ' + firstDayOfThisMonth);
                _result = await query.getRawOne();
                data.last_month_work_price = isEmpty(_result.last_month_work_price) ? 0 : _result.last_month_work_price;

                query = getConnection()
                        .createQueryBuilder()
                        .select('case \
                        when sum("request_detail_worker"."price") is NULL \
                        then 0 \
                        else sum("request_detail_worker"."price") \
                        end \
                        as this_month_work_price')
                        .from(RequestDetailWorker, "request_detail_worker")
                        .where('"request_detail_worker"."is_end" = \'Y\'')
                        .andWhere('"request_detail_worker"."userId" = ' + req.decodedUser.id)
                        .andWhere('"request_detail_worker"."end_date" >= ' + firstDayOfThisMonth);
                _result = await query.getRawOne();
                data.this_month_work_price = isEmpty(_result.this_month_work_price) ? 0 : _result.this_month_work_price;
                return res.json({ errorCode: 0, errorMsg: "", data: data });
            }
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getRequestList = async(req: Request, res: Response) => {
        try {
            if(global.ROLE[req.decodedUser.user_type - 1] == 'requester') {
                //진행중
                let query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                .leftJoinAndSelect('trans_request.details', 'request_detail')
                .where('"trans_request"."userId" = ' + req.decodedUser.id)
                .andWhere('trans_request.is_end != \'Y\'')
                .orderBy('trans_request.create_date', "DESC")
                let _progress_count = await query.getCount();
                query = query.skip(0)
                        .take(5);
                let _result = await query.getMany();
                let progress_table_data: Array<any>;
                progress_table_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let item = _result[i];
                    let table_item: {[k: string]: any} = {};
                    table_item = {
                        id: (isArray(item.details) ? item.details[0].id : 0),
                        status: global.STATUS[item.status - 1],
                        youtube_url: item.youtube_url,
                        title: item.title,
                        req_date: item.create_date
                    }
                    progress_table_data.push(table_item);
                }
                //완료된 번역
                query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                .leftJoinAndSelect('trans_request.details', 'request_detail')
                .where('"trans_request"."userId" = ' + req.decodedUser.id)
                .andWhere('trans_request.is_end = \'Y\'')
                .orderBy('trans_request.end_date', "DESC")
                let _complete_count = await query.getCount();
                query = query.skip(0)
                    .take(5);
                _result = await query.getMany();
                let complete_table_data: Array<any>;
                complete_table_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let item = _result[i];
                    let table_item: {[k: string]: any} = {};
                    table_item = {
                        id: (isArray(item.details) ? item.details[0].id : 0),
                        status: global.STATUS[item.status - 1],
                        youtube_url: item.youtube_url,
                        title: item.title,
                        end_date: item.end_date
                    }
                    complete_table_data.push(table_item);
                }
                return res.json({
                    errorCode: 0,
                    errorMsg: '',
                    progress_count: _progress_count,
                    progress_list: progress_table_data,
                    complete_count: _complete_count,
                    complete_list: complete_table_data
                })
            }
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'tc') {
                //진행중
                let query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                .where('"trans_request"."tcUserId" = ' + req.decodedUser.id)
                .andWhere('"trans_request"."tc_status" = 2')
                .orderBy('"trans_request"."tc_create_date"', "DESC")
                let _progress_count = await query.getCount();
                query = query.skip(0)
                        .take(5);
                let _result = await query.getMany();
                let progress_table_data: Array<any>;
                progress_table_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let item = _result[i];
                    let table_item: {[k: string]: any} = {};
                    table_item = {
                        id: item.id,
                        status: global.STATUS[item.status - 1],
                        youtube_url: item.youtube_url,
                        title: item.title,
                        predict_end_date: item.tc_predict_end_date
                    }
                    progress_table_data.push(table_item);
                }
                //완료된 번역
                query = getRepository(TransRequest)
                .createQueryBuilder("trans_request")
                .where('"trans_request"."tcUserId" = ' + req.decodedUser.id)
                .andWhere('"trans_request"."tc_status" = 3')
                .orderBy('"trans_request"."tc_end_date"', "DESC")
                let _complete_count = await query.getCount();
                query = query.skip(0)
                    .take(5);
                _result = await query.getMany();
                let complete_table_data: Array<any>;
                complete_table_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let item = _result[i];
                    let table_item: {[k: string]: any} = {};
                    table_item = {
                        id: item.id,
                        status: 'tc_complete',
                        youtube_url: item.youtube_url,
                        title: item.title,
                        end_date: item.tc_end_date
                    }
                    complete_table_data.push(table_item);
                }
                return res.json({
                    errorCode: 0,
                    errorMsg: '',
                    progress_count: _progress_count,
                    progress_list: progress_table_data,
                    complete_count: _complete_count,
                    complete_list: complete_table_data
                })
            }
            else {
                //번역가 , 검수자
                let query = getRepository(RequestDetailWorker)
                .createQueryBuilder('request_detail_worker')
                .leftJoinAndSelect('request_detail_worker.request_detail', 'request_detail')
                .leftJoinAndSelect('request_detail.request', 'trans_request')
                .where('request_detail_worker."userId" = ' + req.decodedUser.id)
                .andWhere('request_detail_worker.is_end != \'Y\'')
                .orderBy('request_detail_worker.create_date', "DESC");
                let _progress_count = await query.getCount();
                query = query.skip(0)
                        .take(5);
                let _result = await query.getMany();
                let progress_table_data: Array<any>;
                progress_table_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let item = _result[i];
                    let table_item: {[k: string]: any} = {};
                    table_item = {
                        id: item.request_detail.id,
                        status: (global.ROLE[req.decodedUser.user_type - 1] == 'translator' ? 'translating' : 'reviewing'),
                        youtube_url: item.request_detail.request.youtube_url,
                        title: item.request_detail.request.title,
                        predict_end_date: item.predict_end_date
                    }
                    progress_table_data.push(table_item);
                }
                query = getRepository(RequestDetailWorker)
                .createQueryBuilder('request_detail_worker')
                .leftJoinAndSelect('request_detail_worker.request_detail', 'request_detail')
                .leftJoinAndSelect('request_detail.request', 'trans_request')
                .where('request_detail_worker."userId" = ' + req.decodedUser.id)
                .andWhere('request_detail_worker.is_end = \'Y\'')
                .orderBy('request_detail_worker.end_date', "DESC");
                let _complete_count = await query.getCount();
                query = query.skip(0)
                        .take(5);
                _result = await query.getMany();
                let complete_table_data: Array<any>;
                complete_table_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let item = _result[i];
                    let table_item: {[k: string]: any} = {};
                    table_item = {
                        id: item.request_detail.id,
                        status: (global.ROLE[req.decodedUser.user_type - 1] == 'translator' ? 'translation_complete' : 'review_complete'),
                        youtube_url: item.request_detail.request.youtube_url,
                        title: item.request_detail.request.title,
                        end_date: item.end_date
                    }
                    complete_table_data.push(table_item);
                }
                return res.json({
                    errorCode: 0, errorMsg: '',
                    progress_count: _progress_count,
                    progress_list: progress_table_data,
                    complete_count: _complete_count,
                    complete_list: complete_table_data
                })
            }
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getTopRanking = async(req: Request, res: Response) => {
        try {
            const { method } = req.body;
            var now = new Date();
            let firstDayOfThisMonth = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).getTime() / 1000);
            let sub_query = getConnection()
            .createQueryBuilder()
            .select('"trans_request"."id"')
            .addSelect('"trans_request"."userId"', 'user_no')
            .addSelect('"trans_request"."work_price"')
            .from(TransRequest, "trans_request")
            .where('trans_request.is_end = \'Y\'')
            .andWhere('trans_request.end_date >= ' + firstDayOfThisMonth);

            let query = getConnection()
                        .createQueryBuilder();

            if(isEmpty(method) || method == 1)
                query = query.select('count("t_r"."id") as "complete_count"')
            else
                query = query.select('case \
                when sum("t_r"."work_price") IS NULL \
                THEN 0 \
                ELSE sum("t_r"."work_price") \
                END \
                as "work_price_sum" \
                ')

            if (req.decodedUser.user_type == (global.ROLE.indexOf("company") + 1)) {
                query = query.addSelect('"user"."user_name"', "_user_name")
                        .addSelect('"user"."id"', "_user_no")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."avatar"', "_avatar")
                        .from(User, 'user')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."user_no"')
                        .where('"user"."user_type" = ' + (global.ROLE.indexOf('requester') + 1).toString())
                        .andWhere('"user"."parent_id" = ' + req.decodedUser.id)
                        .andWhere('"user"."is_delete" = \'N\'')
                        .groupBy('"user"."id"');   
            }
            else if (req.decodedUser.user_type == (global.ROLE.indexOf("manager") + 1)) {
                query = query.addSelect('"user"."user_name"', "_user_name")
                        .addSelect('"user"."id"', "_user_no")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."avatar"', "_avatar")
                        .from(User, 'user')
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."user_no"')
                        .where('"user"."user_type" = ' + (global.ROLE.indexOf('requester') + 1).toString())
                        .andWhere('"manager"."id" is not null')
                        .andWhere('"user"."is_delete" = \'N\'')
                        .groupBy('"user"."id"');   
            }
            if(isEmpty(method) || method == 1)
                query = query.orderBy('count("t_r"."id")', 'DESC')
            else
                query = query.orderBy('case \
                when sum("t_r"."work_price") IS NULL \
                THEN 0 \
                ELSE sum("t_r"."work_price") \
                END \
                ', 'DESC')
            query = query.offset(0)
                        .limit(5);
            let _result = await query.getRawMany();
            let table_data: Array<any>;
            table_data = [];
            if(isEmpty(method) || method == 1) {
                for(let i = 0; i < _result.length; i ++) {
                    if(_result[i].complete_count == 0)
                        continue;
                    table_data.push({
                        complete_count: _result[i].complete_count,
                        user_name: _result[i]._user_name,
                        user_no: _result[i]._user_no,
                        user_id: _result[i]._user_id,
                        avatar: isEmpty(_result[i]._avatar)?'':(config.IMAGE_PREFIX_URL + _result[i]._avatar)
                    })
                }
            }
            else {
                for(let i = 0; i < _result.length; i ++) {
                    if(_result[i].work_price_sum == 0)
                        continue;
                    table_data.push({
                        work_price_sum: _result[i].work_price_sum,
                        user_name: _result[i]._user_name,
                        user_no: _result[i]._user_no,
                        user_id: _result[i]._user_id,
                        avatar: isEmpty(_result[i]._avatar)?'':(config.IMAGE_PREFIX_URL + _result[i]._avatar)
                    })
                }
            }
            return res.json({ errorCode: 0, errorMsg: "", data: table_data });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
/*
method: 1 ~ 완료번역수 기준 2 ~ 번역금액 (JPY) 기준 3 ~ 번역금액 (USD) 기준 4 ~ 번역금액 (KRW) 기준
user_type: 1 ~ 요청자  2 ~ 고객사
*/
    static getTopRankingAdmin = async(req: Request, res: Response) => {
        try {
            const { method, user_type } = req.body;
            if(isEmpty(method) || isEmpty(user_type))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            var now = new Date();
            let firstDayOfThisMonth = Math.round(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).getTime() / 1000);
            /*
            let sub_query = getConnection()
            .createQueryBuilder()
            .select('"trans_request"."id"')
            .addSelect('"trans_request"."userId"', 'user_no')
            .addSelect('"trans_request"."work_price"')
            .from(TransRequest, "trans_request")
            .where('trans_request.is_end = \'Y\'')
            .andWhere('trans_request.end_date >= ' + firstDayOfThisMonth);
            */
            let sub_query = getConnection()
                .createQueryBuilder()
                .select('"request_detail"."id"')
                .addSelect('"trans_request"."userId"', 'user_no')
                .addSelect('"request_detail"."work_price"')
                .from(RequestDetail, "request_detail")
                .leftJoin('request_detail.request', 'trans_request')
                .where('request_detail.is_end = \'Y\'')
                .andWhere('request_detail.end_date >= ' + firstDayOfThisMonth);

            if(method == 2)
                sub_query = sub_query.andWhere('"trans_request"."currency_type" = :currency_type', {currency_type: CurrencyType.JPY});
            else if(method == 3)
                sub_query = sub_query.andWhere('"trans_request"."currency_type" = :currency_type', {currency_type: CurrencyType.USD});
            else if(method == 4)
                sub_query = sub_query.andWhere('"trans_request"."currency_type" = :currency_type', {currency_type: CurrencyType.KRW});

            let query = getConnection()
                        .createQueryBuilder();

            if(method == 1)
                query = query.select('count("t_r"."id") as "complete_count"')
            else
                query = query.select('case \
                when sum("t_r"."work_price") IS NULL \
                THEN 0 \
                ELSE sum("t_r"."work_price") \
                END \
                as "work_price_sum" \
                ')
            if(user_type == 1) {
                query = query.addSelect('"user"."user_name"', "_user_name")
                        .addSelect('"user"."id"', "_user_no")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."avatar"', "_avatar")
                        .addSelect('"parent"."id"', "_company_no")
                        .from(User, 'user')
                        .leftJoin('user.parent', 'parent')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."user_no"')
                        .setParameters(sub_query.getParameters())
                        .where('"user"."user_type" = ' + (global.ROLE.indexOf('requester') + 1).toString())
                        .andWhere('"user"."is_delete" = \'N\'')
                        .groupBy('"user"."id"')
                        .addGroupBy('"parent"."id"');
            }
            else {
                query = query.addSelect('"user"."company_name"', "_user_name")
                        .addSelect('"user"."id"', "_user_no")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."company_logo"', "_avatar")
                        .from(User, 'user')
                        .leftJoin('user.childs', 'child')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"child"."id" = "t_r"."user_no"')
                        .setParameters(sub_query.getParameters())
                        .where('"user"."user_type" = ' + (global.ROLE.indexOf('company') + 1).toString())
                        .andWhere('"user"."is_delete" = \'N\'')
                        .groupBy('"user"."id"');
            }
            if(method == 1)
                query = query.orderBy('count("t_r"."id")', 'DESC')
            else
                query = query.orderBy('case \
                when sum("t_r"."work_price") IS NULL \
                THEN 0 \
                ELSE sum("t_r"."work_price") \
                END \
                ', 'DESC')
            query = query.offset(0)
                        .limit(5);
            let _result = await query.getRawMany();
            let table_data: Array<any>;
            table_data = [];
            if(method == 1) {
                for(let i = 0; i < _result.length; i ++) {
                    if(_result[i].complete_count == 0)
                        continue;
                    table_data.push({
                        complete_count: _result[i].complete_count,
                        user_name: _result[i]._user_name,
                        user_no: _result[i]._user_no,
                        user_id: _result[i]._user_id,
                        company_no: (isEmpty(_result[i]._company_no) ? 0 : _result[i]._company_no),
                        avatar: isEmpty(_result[i]._avatar)?'':(config.IMAGE_PREFIX_URL + _result[i]._avatar)
                    })
                }
            }
            else {
                for(let i = 0; i < _result.length; i ++) {
                    if(_result[i].work_price_sum == 0)
                        continue;
                    table_data.push({
                        work_price_sum: _result[i].work_price_sum,
                        user_name: _result[i]._user_name,
                        user_no: _result[i]._user_no,
                        user_id: _result[i]._user_id,
                        company_no: (isEmpty(_result[i]._company_no) ? 0 : _result[i]._company_no),
                        avatar: isEmpty(_result[i]._avatar)?'':(config.IMAGE_PREFIX_URL + _result[i]._avatar)
                    })
                }
            }
            return res.json({ errorCode: 0, errorMsg: "", data: table_data });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getNewRequestStatus = async(req: Request, res: Response) => {
        try {
            let curDate = new Date() , pastDate = new Date();
            pastDate.setDate(curDate.getDate() - 6);


            let sub_query = getConnection()
                .createQueryBuilder();
            
            if (global.ROLE[req.decodedUser.user_type - 1] == 'company' || global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                sub_query = sub_query.select('"trans_request"."id"')
                            .addSelect('date_part(\'year\', to_timestamp(trans_request.create_date))', 'req_year')
                            .addSelect('date_part(\'month\', to_timestamp(trans_request.create_date))', 'req_month')
                            .addSelect('date_part(\'day\', to_timestamp(trans_request.create_date))', 'req_day')
                            .from(TransRequest, "trans_request");
            }
            else {
                sub_query = sub_query.select('"request_detail"."id"')
                        .addSelect('date_part(\'year\', to_timestamp(request_detail.create_date))', 'req_year')
                        .addSelect('date_part(\'month\', to_timestamp(request_detail.create_date))', 'req_month')
                        .addSelect('date_part(\'day\', to_timestamp(request_detail.create_date))', 'req_day')
                        .from(RequestDetail, "request_detail");   
            }

            if (global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                sub_query = sub_query.leftJoin("trans_request.user", "user");   
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                sub_query = sub_query.leftJoin("trans_request.user", "user");   
                sub_query = sub_query.leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
            }

            if (global.ROLE[req.decodedUser.user_type - 1] == 'company' || global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                sub_query = sub_query.where('to_timestamp(trans_request.create_date) >= \'' + getDateString(pastDate) + '\'')
            }
            else {
                sub_query = sub_query.where('to_timestamp(request_detail.create_date) >= \'' + getDateString(pastDate) + '\'')
            }

            if (global.ROLE[req.decodedUser.user_type - 1] == 'company') {   
                sub_query = sub_query.andWhere('"user"."parent_id" = ' + req.decodedUser.id);   
                sub_query = sub_query.andWhere('"user"."is_delete" = \'N\'');   
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                sub_query = sub_query.andWhere('"manager"."id" is not null');
                sub_query = sub_query.andWhere('"user"."is_delete" = \'N\'');   
            }


            let query = getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."id") as "req_count"')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"t_r"."req_year" = date_part(\'year\', "analysis_date"."basic_date") and \
                        "t_r"."req_month" = date_part(\'month\', "analysis_date"."basic_date") and "t_r"."req_day" = date_part(\'day\', "analysis_date"."basic_date")')
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .groupBy('"analysis_date"."basic_date"');
            
            let _result = await query.getRawMany();
            let table_data: Array<any>, date_data: Array<any>;
            table_data = [];
            date_data = [];
            for(let i = 0; i < _result.length; i ++) {
                let _item = _result[i];
                table_data.push(parseInt(_item.req_count));
                date_data.push(getGraphDateFormat(_item.basic_date));
            }
            return res.json({ errorCode: 0, errorMsg: "", data: {
                labels: date_data,
                values: table_data
            }});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getUserStatus1 = async(req: Request, res: Response) => {
        let user_type = 3;
        if(global.ROLE[req.decodedUser.user_type - 1] == 'admin' && isEmpty(req.body.user_type))
            user_type = -1;
        else if(global.ROLE[req.decodedUser.user_type - 1] == 'admin')
            user_type = global.ROLE.indexOf(req.body.user_type) + 1;
        try {
            let curDate = new Date() , pastDate = new Date();
            let query;
            pastDate.setDate(curDate.getDate() - 6);
            if(user_type == -1) {
                query = getConnection()       
                        .createQueryBuilder()
                        .select('count("user".user_name)', 'user_count')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin(User, 'user', 'to_timestamp("user"."create_date")::TIMESTAMP::DATE <= "analysis_date"."basic_date" \
                        and ("user"."user_type" = 4 or "user"."user_type" = 5 or "user"."user_type" = 6)')
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .groupBy('"analysis_date"."basic_date"')
                        .orderBy('"analysis_date"."basic_date"')
            }
            else {
                if(global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
                    query = getConnection()       
                        .createQueryBuilder()
                        .select('count("user".user_name)', 'user_count')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin(User, 'user', 'to_timestamp("user"."create_date")::TIMESTAMP::DATE <= "analysis_date"."basic_date" \
                        and "user"."user_type" = ' + user_type)
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .groupBy('"analysis_date"."basic_date"')
                        .orderBy('"analysis_date"."basic_date"')
                }
                else if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                    query = getConnection()       
                        .createQueryBuilder()
                        .select('count("user".user_name)', 'user_count')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin(User, 'user', 'to_timestamp("user"."create_date")::TIMESTAMP::DATE <= "analysis_date"."basic_date" \
                        and "user"."user_type" = ' + user_type + ' and "user"."parent_id" = ' + req.decodedUser.id)
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .groupBy('"analysis_date"."basic_date"')
                        .orderBy('"analysis_date"."basic_date"')
                }
                else {
                    query = getConnection()       
                        .createQueryBuilder()
                        .select('count("user".user_name)', 'user_count')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin(User, 'user', 'to_timestamp("user"."create_date")::TIMESTAMP::DATE <= "analysis_date"."basic_date" \
                        and "user"."user_type" = ' + user_type)
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .andWhere('"manager"."id" is not null')
                        .groupBy('"analysis_date"."basic_date"')
                        .orderBy('"analysis_date"."basic_date"')
                }
            }
            let _result = await query.getRawMany();
            let table_data: Array<any>, date_data: Array<any>;
            table_data = [];
            date_data = [];
            for(let i = 0; i < _result.length; i ++) {
                let _item = _result[i];
                table_data.push(parseInt(_item.user_count));
                date_data.push(getGraphDateFormat(_item.basic_date));
            }
            return res.json({ errorCode: 0, errorMsg: "", data: {
                labels: date_data,
                values: table_data
            }});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getUserStatus = async(req: Request, res: Response) => {
        let user_type = 3;
        if(global.ROLE[req.decodedUser.user_type - 1] == 'admin' && isEmpty(req.body.user_type))
            user_type = -1;
        else if(global.ROLE[req.decodedUser.user_type - 1] == 'admin')
            user_type = global.ROLE.indexOf(req.body.user_type) + 1;
        try {
            let curDate = new Date() , pastDate = new Date();
            pastDate.setDate(curDate.getDate() - 6);
            let sub_query;
            if(user_type == 2 || user_type == 3 || user_type == 4 || user_type == 5 || user_type == 6) {
                if(user_type == 3) {
                    //요청자 현황
                    sub_query = getConnection()
                                .createQueryBuilder()
                                .select('date_part(\'year\', to_timestamp(trans_request.create_date))', 'req_year')
                                .addSelect('date_part(\'month\', to_timestamp(trans_request.create_date))', 'req_month')
                                .addSelect('date_part(\'day\', to_timestamp(trans_request.create_date))', 'req_day')
                                .addSelect('"trans_request"."userId"', 'user_no')
                                .addSelect('count("trans_request"."id")', 'user_cnt')
                                .from(TransRequest, "trans_request")
                                .where('to_timestamp(trans_request.create_date) >= \'' + getDateString(pastDate) + '\'')
                                .groupBy('date_part(\'year\', to_timestamp(trans_request.create_date))')
                                .addGroupBy('date_part(\'month\', to_timestamp(trans_request.create_date))')
                                .addGroupBy('date_part(\'day\', to_timestamp(trans_request.create_date))')
                                .addGroupBy('"trans_request"."userId"');
                }
                else if(user_type == 2) {
                    //고객사 현황
                    sub_query = getConnection()
                                .createQueryBuilder()
                                .select('date_part(\'year\', to_timestamp(trans_request.create_date))', 'req_year')
                                .addSelect('date_part(\'month\', to_timestamp(trans_request.create_date))', 'req_month')
                                .addSelect('date_part(\'day\', to_timestamp(trans_request.create_date))', 'req_day')
                                .addSelect('"user"."parent_id"', 'user_no')
                                .addSelect('count("trans_request"."id")', 'user_cnt')
                                .from(TransRequest, "trans_request")
                                .leftJoin('trans_request.user', 'user')
                                .where('to_timestamp(trans_request.create_date) >= \'' + getDateString(pastDate) + '\'')
                                .groupBy('date_part(\'year\', to_timestamp(trans_request.create_date))')
                                .addGroupBy('date_part(\'month\', to_timestamp(trans_request.create_date))')
                                .addGroupBy('date_part(\'day\', to_timestamp(trans_request.create_date))')
                                .addGroupBy('"user"."parent_id"');
                }
                else if(user_type == 4) {
                    //TC 작업자
                    sub_query = getConnection()
                                .createQueryBuilder()
                                .select('date_part(\'year\', to_timestamp(trans_request.tc_create_date))', 'req_year')
                                .addSelect('date_part(\'month\', to_timestamp(trans_request.tc_create_date))', 'req_month')
                                .addSelect('date_part(\'day\', to_timestamp(trans_request.tc_create_date))', 'req_day')
                                .addSelect('"trans_request"."tcUserId"', 'user_no')
                                .addSelect('count("trans_request"."id")', 'user_cnt')
                                .from(TransRequest, "trans_request")
                                .where('to_timestamp(trans_request.tc_create_date) >= \'' + getDateString(pastDate) + '\'')
                                .andWhere('"trans_request"."tc_status" > 1')
                                .groupBy('date_part(\'year\', to_timestamp(trans_request.tc_create_date))')
                                .addGroupBy('date_part(\'month\', to_timestamp(trans_request.tc_create_date))')
                                .addGroupBy('date_part(\'day\', to_timestamp(trans_request.tc_create_date))')
                                .addGroupBy('"trans_request"."tcUserId"');
                }
                else {
                    sub_query = getConnection()
                                .createQueryBuilder()
                                .select('date_part(\'year\', to_timestamp(request_detail_worker.create_date))', 'req_year')
                                .addSelect('date_part(\'month\', to_timestamp(request_detail_worker.create_date))', 'req_month')
                                .addSelect('date_part(\'day\', to_timestamp(request_detail_worker.create_date))', 'req_day')
                                .addSelect('"request_detail_worker"."userId"', 'user_no')
                                .addSelect('count("request_detail_worker"."id")', 'user_cnt')
                                .from(RequestDetailWorker, "request_detail_worker")
                                .where('to_timestamp(request_detail_worker.create_date) >= \'' + getDateString(pastDate) + '\'')
                                .andWhere('"request_detail_worker"."worker_type" = ' + user_type)
                                .groupBy('date_part(\'year\', to_timestamp(request_detail_worker.create_date))')
                                .addGroupBy('date_part(\'month\', to_timestamp(request_detail_worker.create_date))')
                                .addGroupBy('date_part(\'day\', to_timestamp(request_detail_worker.create_date))')
                                .addGroupBy('"request_detail_worker"."userId"');
                }
                let query = getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."user_no") as "user_count"')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"t_r"."req_year" = date_part(\'year\', "analysis_date"."basic_date") and \
                        "t_r"."req_month" = date_part(\'month\', "analysis_date"."basic_date") and "t_r"."req_day" = date_part(\'day\', "analysis_date"."basic_date")')
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .groupBy('"analysis_date"."basic_date"');
                let _result = await query.getRawMany();
                let table_data: Array<any>, date_data: Array<any>;
                table_data = [];
                date_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    let _item = _result[i];
                    table_data.push(parseInt(_item.user_count));
                    date_data.push(getGraphDateFormat(_item.basic_date));
                }
                return res.json({ errorCode: 0, errorMsg: "", data: {
                    labels: date_data,
                    values: table_data
                }});
            }
            else {
                sub_query = getConnection()
                            .createQueryBuilder()
                            .select('date_part(\'year\', to_timestamp(trans_request.tc_create_date))', 'req_year')
                            .addSelect('date_part(\'month\', to_timestamp(trans_request.tc_create_date))', 'req_month')
                            .addSelect('date_part(\'day\', to_timestamp(trans_request.tc_create_date))', 'req_day')
                            .addSelect('"trans_request"."tcUserId"', 'user_no')
                            .addSelect('count("trans_request"."id")', 'user_cnt')
                            .from(TransRequest, "trans_request")
                            .where('to_timestamp(trans_request.tc_create_date) >= \'' + getDateString(pastDate) + '\'')
                            .andWhere('"trans_request"."tc_status" > 1')
                            .groupBy('date_part(\'year\', to_timestamp(trans_request.tc_create_date))')
                            .addGroupBy('date_part(\'month\', to_timestamp(trans_request.tc_create_date))')
                            .addGroupBy('date_part(\'day\', to_timestamp(trans_request.tc_create_date))')
                            .addGroupBy('"trans_request"."tcUserId"');
                //
                let query = getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."user_no") as "user_count"')
                        .addSelect('"analysis_date"."basic_date"')
                        .from(AnalysisDate, 'analysis_date')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"t_r"."req_year" = date_part(\'year\', "analysis_date"."basic_date") and \
                        "t_r"."req_month" = date_part(\'month\', "analysis_date"."basic_date") and "t_r"."req_day" = date_part(\'day\', "analysis_date"."basic_date")')
                        .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                        .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                        .groupBy('"analysis_date"."basic_date"');
                let _result = await query.getRawMany();
                sub_query = getConnection()
                            .createQueryBuilder()
                            .select('date_part(\'year\', to_timestamp(request_detail_worker.create_date))', 'req_year')
                            .addSelect('date_part(\'month\', to_timestamp(request_detail_worker.create_date))', 'req_month')
                            .addSelect('date_part(\'day\', to_timestamp(request_detail_worker.create_date))', 'req_day')
                            .addSelect('"request_detail_worker"."userId"', 'user_no')
                            .addSelect('count("request_detail_worker"."id")', 'user_cnt')
                            .from(RequestDetailWorker, "request_detail_worker")
                            .where('to_timestamp(request_detail_worker.create_date) >= \'' + getDateString(pastDate) + '\'')
                            .groupBy('date_part(\'year\', to_timestamp(request_detail_worker.create_date))')
                            .addGroupBy('date_part(\'month\', to_timestamp(request_detail_worker.create_date))')
                            .addGroupBy('date_part(\'day\', to_timestamp(request_detail_worker.create_date))')
                            .addGroupBy('"request_detail_worker"."userId"');
                query = getConnection()
                            .createQueryBuilder()
                            .select('count("t_r"."user_no") as "user_count"')
                            .addSelect('"analysis_date"."basic_date"')
                            .from(AnalysisDate, 'analysis_date')
                            .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"t_r"."req_year" = date_part(\'year\', "analysis_date"."basic_date") and \
                            "t_r"."req_month" = date_part(\'month\', "analysis_date"."basic_date") and "t_r"."req_day" = date_part(\'day\', "analysis_date"."basic_date")')
                            .where('"analysis_date"."basic_date" >= \'' + getDateString(pastDate) + '\'')
                            .andWhere('"analysis_date"."basic_date" <= \'' + getDateString(curDate) + '\'')
                            .groupBy('"analysis_date"."basic_date"');
                let _result_other = await query.getRawMany();
                let table_data: Array<any>, date_data: Array<any>;
                table_data = []; date_data = [];
                for(let i = 0; i < _result.length; i ++) {
                    table_data.push(parseInt(_result[i].user_count) + parseInt(_result_other[i].user_count));
                    date_data.push(getGraphDateFormat(_result[i].basic_date));
                }
                return res.json({ errorCode: 0, errorMsg: "", data: {
                    labels: date_data,
                    values: table_data
                }});
            }
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default DashboardController;
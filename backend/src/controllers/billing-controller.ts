import { User } from './../entity/user';
import { RequestDetailWorker } from './../entity/request-detail-worker';
import { isNotEmpty, isEmpty, isArray } from 'class-validator';
import { Period } from './../entity/period';
import { Manager } from './../entity/manager';
import { Brackets, getConnection } from 'typeorm';
import { TransRequest } from './../entity/trans-request';
import { RequestDetail } from './../entity/request-detail';
import { Request, Response } from 'express';
import global from './../config/global';
import { CurrencyType } from './../entity/entity-enum';
import { UserTag } from './../entity/user-tag';
class BillingController {
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        start_year,
        start_month,
        end_year,
        end_month,

        billing_type: 1,   // 1: 월별(통합) , 2: 고객사별 , 3: 요청자별 , 4: TC작업자별 , 5: 번역가별 , 6: 검수자별
        companies: [],
        requesters: [],
        workers: []
    }
    */
    static getAdminBillingData = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;

            if(isEmpty(search) || isEmpty(search.billing_type))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if ((search.billing_type == 1 || search.billing_type == 2 || search.billing_type == 3) && isEmpty(search.settle_type))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            
            let start_year = new Date().getFullYear();
            let end_year = start_year;
            let start_month = new Date().getMonth() + 1;
            let end_month = start_month;
            if(isNotEmpty(search.start_year)) {
                start_year = search.start_year;
                end_year = search.end_year;
                start_month = search.start_month;
                end_month = search.end_month;
            }
            else {
                let limit_query = getConnection()
                .createQueryBuilder();
                if (search.billing_type == 1 || search.billing_type == 2 || search.billing_type == 3) {
                    if (search.settle_type == 1) {
                        limit_query = limit_query.select('date_part(\'month\', to_timestamp(min(end_date))) as start_month')
                                    .addSelect('date_part(\'year\', to_timestamp(min(end_date))) as start_year')
                                    .from(TransRequest, "trans_request")
                                    .where('"trans_request"."is_end" = \'Y\'');   
                    }
                    else {
                        limit_query = limit_query.select('date_part(\'month\', to_timestamp(min(end_date))) as start_month')
                                    .addSelect('date_part(\'year\', to_timestamp(min(end_date))) as start_year')
                                    .from(RequestDetail, "request_detail")
                                    .where('"request_detail"."is_end" = \'Y\'');   
                    }
                }
                else if(search.billing_type == 4) {
                    //tc 작업자
                    limit_query = limit_query.select('date_part(\'month\', to_timestamp(min(tc_end_date))) as start_month')
                                .addSelect('date_part(\'year\', to_timestamp(min(tc_end_date))) as start_year')
                                .from(TransRequest, "trans_request")
                                .where('"trans_request"."tc_status" = 3')
                }
                else {
                    //tc , translator
                    limit_query = limit_query.select('date_part(\'month\', to_timestamp(min(request_detail_worker.end_date))) as start_month')
                                    .addSelect('date_part(\'year\', to_timestamp(min(request_detail_worker.end_date))) as start_year')
                                    .from(RequestDetailWorker, "request_detail_worker")
                                    .where('"request_detail_worker"."is_end" = \'Y\'')
                }
                let _period_one = await limit_query.getRawOne();
                if(isNotEmpty(_period_one.start_year))
                    start_year = _period_one.start_year;
                if(isNotEmpty(_period_one.start_month))
                    start_month = _period_one.start_month;
            }
            let query, sub_query;
            if (search.billing_type == 1 || search.billing_type == 2 || search.billing_type == 3) {
                if (search.settle_type == 1) {
                    sub_query = getConnection()
                                .createQueryBuilder()
                                .select('"trans_request"."id"')
                                .addSelect('"trans_request"."end_date"');    
                    if(search.billing_type == 1) {
                        sub_query = sub_query.addSelect('"trans_request"."userId"');
                    }
                    else if(search.billing_type == 2) {
                        sub_query = sub_query.addSelect('"user"."id"', "user_no");
                    }
                    else if(search.billing_type == 3) {
                        sub_query = sub_query.addSelect('"user"."id"', "user_no");
                    }
                    sub_query = sub_query.addSelect('"trans_request"."currency_type"')
                            .addSelect('sum(trans_request.duration) / count(trans_request.id)', 'duration')
                            .addSelect('sum(trans_request.work_price) / count(trans_request.id)', 'work_price')
                            .addSelect('ROUND(cast(sum(trans_request.tc_work_price) / count(trans_request.id) as numeric), 3)', 'tc_work_price')
                            .addSelect('ROUND(cast(sum(request_detail.translate_work_price) as numeric), 3)', 'translate_work_price')
                            .addSelect('ROUND(cast(sum(request_detail.review_work_price) as numeric), 3)', 'review_work_price')
                            .addSelect('ROUND(cast(sum(trans_request.tc_work_price) / count(trans_request.id) + \
                            sum(request_detail.translate_work_price) + \
                            sum(request_detail.review_work_price) as numeric), 3)', 'total_work_price')
                            .from(TransRequest, "trans_request")
                            .leftJoin("trans_request.details", "request_detail")
                        .leftJoin("trans_request.user", "user");
                    sub_query = sub_query.leftJoin("user.parent", "parent")
                    sub_query = sub_query.where('trans_request.is_end = \'Y\'');
                    sub_query = sub_query.andWhere('"user"."is_delete" = \'N\'');
                    sub_query = sub_query.andWhere('"parent"."is_delete" = \'N\'');
                }
                else {
                    sub_query = getConnection()
                        .createQueryBuilder()
                        .select('"request_detail"."id"')
                        .addSelect('"request_detail"."end_date"');    
                    if (search.billing_type == 1) {
                        sub_query = sub_query.addSelect('"trans_request"."userId"');
                    }
                    else if (search.billing_type == 2) {
                        sub_query = sub_query.addSelect('"user"."id"', "user_no");
                    }
                    else if (search.billing_type == 3) {
                        sub_query = sub_query.addSelect('"user"."id"', "user_no");
                    }
                    sub_query = sub_query.addSelect('"trans_request"."currency_type"')
                        .addSelect('"trans_request"."duration"', 'duration')
                        .addSelect('"request_detail"."work_price"', 'work_price')
                        .addSelect('ROUND(cast("trans_request"."tc_work_price" as numeric), 3)', 'tc_work_price')
                        .addSelect('ROUND(cast("request_detail"."translate_work_price" as numeric), 3)', 'translate_work_price')
                        .addSelect('ROUND(cast(request_detail.review_work_price as numeric), 3)', 'review_work_price')
                        .addSelect('ROUND(cast("trans_request"."tc_work_price" + "request_detail"."translate_work_price" + "request_detail"."review_work_price" as numeric), 3)', 'total_work_price')
                        .from(RequestDetail, "request_detail")
                        .leftJoin('request_detail.request', 'trans_request')
                        .leftJoin('trans_request.user', 'user');
                    sub_query = sub_query.leftJoin('user.parent', 'parent');
                    sub_query = sub_query.where('request_detail.is_end = \'Y\'');
                    sub_query = sub_query.andWhere('"user"."is_delete" = \'N\'');
                    sub_query = sub_query.andWhere('"parent"."is_delete" = \'N\'');
                }
            }
            else if(search.billing_type == 4) {
                sub_query = getConnection()
                            .createQueryBuilder()
                            .select('"trans_request"."id"')
                            .addSelect('"trans_request"."duration"', 'duration')
                            .addSelect('ROUND(cast("trans_request"."tc_work_price" as numeric), 3)', 'tc_work_price')
                            .addSelect('"trans_request"."tcUserId"', 'tc_user_no')
                            .from(TransRequest, "trans_request")
                            .where('trans_request.tc_status = 3');
            }
            else {
                //번역가 , 검수자 , TC
                sub_query = getConnection()
                            .createQueryBuilder()
                            .select('"request_detail"."id"')
                            .addSelect('"trans_request"."duration"', 'duration')
                            .addSelect('ROUND(cast("request_detail_worker"."price" as numeric), 3)', 'work_price')
                            .addSelect('"request_detail_worker"."userId"', 'user_no')
                            .from(RequestDetail, "request_detail")
                            .leftJoin('request_detail.request', 'trans_request')
                            .leftJoin('request_detail.workers', 'request_detail_worker', 'request_detail_worker.worker_type = :worker_type', {worker_type: search.billing_type});
                            if(search.billing_type == 5)
                                sub_query = sub_query.where('"request_detail"."translate_status" = 3');
                            else if(search.billing_type == 6)
                                sub_query = sub_query.where('"request_detail"."review_status" = 3');
            }
            if(search.billing_type == 1) {
                //1: 월별(통합)
                if(isNotEmpty(search.requesters) && isArray(search.requesters) && search.requesters.length > 0) {
                    let requester_query = '"trans_request"."userId" = :requester1', filter = {};
                    filter = {
                        ...filter,
                        'requester1': search.requesters[0]
                    }
                    for(let i = 1; i < search.requesters.length; i ++) {
                        requester_query += ' or "trans_request"."userId" = :requester' + (i + 1);
                        let key = `requester${i+1}`
                        filter = {
                            ...filter,
                            [key]: search.requesters[i]
                        }
                    }
                    sub_query = sub_query.andWhere(new Brackets(qb => {
                        qb.where(requester_query, filter)
                    }));
                }
                if(isNotEmpty(search.companies) && isArray(search.companies) && search.companies.length > 0) {
                    let company_query = '"user"."parent_id" = :company1', filter = {};
                    filter = {
                        ...filter,
                        'company1': search.companies[0]
                    }
                    for(let i = 1; i < search.companies.length; i ++) {
                        company_query += ' or "user"."parent_id" = :company' + (i + 1);
                        let key = `company${i+1}`
                        filter = {
                            ...filter,
                            [key]: search.companies[i]
                        }
                    }
                    sub_query = sub_query.andWhere(new Brackets(qb => {
                        qb.where(company_query, filter)
                    }));
                }

                if (search.settle_type == 1) {
                    sub_query = sub_query.groupBy('"trans_request"."id"');
                }

                query =  getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."end_date") as "complete_count"')
                    .addSelect(' \
                        case \
                        when sum("t_r"."duration") is NULL \
                        then 0 \
                        else sum("t_r"."duration") \
                        end \
                        as "duration_sum"')
                    .addSelect('\
                        case \
                        when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.JPY + '\') is NULL \
                        then 0 \
                        else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.JPY + '\') \
                        end \
                        as jpy_work_price_sum')
                    .addSelect('\
                        case \
                        when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.KRW + '\') is NULL \
                        then 0 \
                        else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.KRW + '\') \
                        end \
                        as krw_work_price_sum')
                    .addSelect('\
                        case \
                        when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.USD + '\') is NULL \
                        then 0 \
                        else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.USD + '\') \
                        end \
                        as usd_work_price_sum')
                    .addSelect('\
                        case \
                        when sum("t_r"."tc_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."tc_work_price") \
                        end \
                        as tc_work_price_sum')
                    .addSelect('\
                        case \
                        when sum("t_r"."translate_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."translate_work_price") \
                        end \
                        as translate_work_price_sum')
                    .addSelect('\
                        case \
                        when sum("t_r"."review_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."review_work_price") \
                        end \
                        as review_work_price_sum')
                    .addSelect('\
                        case \
                        when sum("t_r"."total_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."total_work_price") \
                        end \
                        as total_work_price_sum')
                    .addSelect('"period"."year" as "year"')
                    .addSelect('"period"."month" as "month"')
                    .from(Period, "period")
                    .leftJoin('(' + sub_query.getQuery() + ')', "t_r", 'date_part(\'month\', to_timestamp("t_r"."end_date")) = "period"."month" and \
                    date_part(\'year\', to_timestamp(t_r.end_date)) = "period"."year"')
                    .setParameters(sub_query.getParameters());

                    if(start_year != end_year)
                        query = query.where('"period"."year" >= ' + start_year)
                                    .andWhere('"period"."year" <= ' + end_year)
                                    .andWhere(new Brackets(qb => {
                                        qb.where('("period"."year" = ' + start_year + ' and "period"."month" >= ' + start_month + ') or ("period"."year" = ' + end_year + ' and "period"."month" <= ' + end_month + ') \
                                        or("period"."year" > ' + start_year + ' and "period"."year" < ' + end_year +')');
                        }));
                    else {
                        query = query.where('"period"."year" = ' + start_year)
                                    .andWhere('"period"."month" <= ' + end_month)
                                    .andWhere('"period"."month" >= ' + start_month);
                    }
                    query = query.groupBy('"period"."year"')
                    .addGroupBy('"period"."month"');
            }
            else if(search.billing_type == 2 || search.billing_type == 3){
                //고객사별 , 요청자별 2,3
                if (search.settle_type == 1) {
                    if(start_year != end_year) {
                        sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(trans_request.end_date)) >= ' + start_year)
                                            .andWhere('date_part(\'year\', to_timestamp(trans_request.end_date)) <= ' + end_year)
                                            .andWhere(new Brackets(qb => {
                                                qb.where('(date_part(\'year\', to_timestamp(trans_request.end_date)) = ' + start_year + ' and date_part(\'month\', to_timestamp(trans_request.end_date)) >= ' + start_month + ') or  \
                                                (date_part(\'year\', to_timestamp(trans_request.end_date)) = ' + end_year + ' and date_part(\'month\', to_timestamp(trans_request.end_date)) <= ' + end_month + ') \
                                                or(date_part(\'year\', to_timestamp(trans_request.end_date)) > ' + start_year + ' and date_part(\'year\', to_timestamp(trans_request.end_date)) < ' + end_year +')')
                                            }));
                    }
                    else {
                        sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(trans_request.end_date)) = ' + start_year)
                        .andWhere('date_part(\'month\', to_timestamp(trans_request.end_date)) <= ' + end_month)
                        .andWhere('date_part(\'month\', to_timestamp(trans_request.end_date)) >= ' + start_month);
                    }
                    if(search.billing_type == 2) {
                        sub_query = sub_query.groupBy('"trans_request"."id"')
                                            .addGroupBy('"user"."id"');
                    }
                    else {
                        sub_query = sub_query.groupBy('"trans_request"."id"')
                                        .addGroupBy('"user"."id"');
                    }
                }
                else {
                    if(start_year != end_year) {
                        sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(request_detail.end_date)) >= ' + start_year)
                                            .andWhere('date_part(\'year\', to_timestamp(request_detail.end_date)) <= ' + end_year)
                                            .andWhere(new Brackets(qb => {
                                                qb.where('(date_part(\'year\', to_timestamp(request_detail.end_date)) = ' + start_year + ' and date_part(\'month\', to_timestamp(request_detail.end_date)) >= ' + start_month + ') or  \
                                                (date_part(\'year\', to_timestamp(request_detail.end_date)) = ' + end_year + ' and date_part(\'month\', to_timestamp(request_detail.end_date)) <= ' + end_month + ') \
                                                or(date_part(\'year\', to_timestamp(request_detail.end_date)) > ' + start_year + ' and date_part(\'year\', to_timestamp(request_detail.end_date)) < ' + end_year +')')
                                            }));
                    }
                    else {
                        sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(request_detail.end_date)) = ' + start_year)
                        .andWhere('date_part(\'month\', to_timestamp(request_detail.end_date)) <= ' + end_month)
                        .andWhere('date_part(\'month\', to_timestamp(request_detail.end_date)) >= ' + start_month);
                    }
                }

                query =  getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."end_date") as "complete_count"')
                        .addSelect(' \
                            case \
                            when sum("t_r"."duration") is NULL \
                            then 0 \
                            else sum("t_r"."duration") \
                            end \
                            as "duration_sum"')
                        .addSelect('\
                            case \
                            when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.JPY + '\') is NULL \
                            then 0 \
                            else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.JPY + '\') \
                            end \
                            as jpy_work_price_sum')
                        .addSelect('\
                            case \
                            when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.KRW + '\') is NULL \
                            then 0 \
                            else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.KRW + '\') \
                            end \
                            as krw_work_price_sum')
                        .addSelect('\
                            case \
                            when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.USD + '\') is NULL \
                            then 0 \
                            else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.USD + '\') \
                            end \
                            as usd_work_price_sum')
                        .addSelect('\
                            case \
                            when sum("t_r"."tc_work_price") is NULL \
                            then 0 \
                            else sum("t_r"."tc_work_price") \
                            end \
                            as tc_work_price_sum')
                        .addSelect('\
                            case \
                            when sum("t_r"."translate_work_price") is NULL \
                            then 0 \
                            else sum("t_r"."translate_work_price") \
                            end \
                            as translate_work_price_sum')
                        .addSelect('\
                            case \
                            when sum("t_r"."review_work_price") is NULL \
                            then 0 \
                            else sum("t_r"."review_work_price") \
                            end \
                            as review_work_price_sum')
                        .addSelect('\
                            case \
                            when sum("t_r"."total_work_price") is NULL \
                            then 0 \
                            else sum("t_r"."total_work_price") \
                            end \
                            as total_work_price_sum');

                        if(search.billing_type == 2) {
                            query = query.addSelect('"user"."company_name"', "_user_name")
                                .addSelect('"user"."login_id"', "_user_id")
                                .addSelect('"user"."id"', "_user_no")
                                .from(User, "user")
                                .leftJoin('user.childs', "child")
                                .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"child"."id" = "t_r"."user_no"')
                                .setParameters(sub_query.getParameters())
                                .where('"user"."user_type" = ' + (global.ROLE.indexOf('company') + 1))
                                .andWhere('"user"."is_delete" = \'N\'')
                                .andWhere('"child"."is_delete" = \'N\'');
                        }
                        else if(search.billing_type == 3) {
                            query = query.addSelect('"user"."user_name"', "_user_name")
                                    .addSelect('"user"."login_id"', "_user_id")
                                    .addSelect('"user"."id"', "_user_no")
                                    .addSelect('"parent"."company_name"', "_company_name")
                                    .addSelect('"parent"."login_id"', "_company_id")
                                    .addSelect('"parent"."id"', "_company_no")
                                    .from(User, "user")
                                    .leftJoin('user.parent', 'parent')
                                    .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."user_no"')
                                    .setParameters(sub_query.getParameters())
                                    .where('"user"."user_type" = ' + (global.ROLE.indexOf('requester') + 1))
                                    .andWhere('"user"."is_delete" = \'N\'')
                                    .andWhere('"parent"."is_delete" = \'N\'');
                        }

                        if(isNotEmpty(search.companies) && isArray(search.companies) && search.companies.length > 0 && search.billing_type == 3) {
                            let company_query = '"parent"."id" = :company1', filter = {};
                            filter = {
                                ...filter,
                                'company1': search.companies[0]
                            }
                            for(let i = 1; i < search.companies.length; i ++) {
                                company_query += ' or "parent"."id" = :company' + (i + 1);
                                let key = `company${i+1}`
                                filter = {
                                    ...filter,
                                    [key]: search.companies[i]
                                }
                            }
                            query = query.andWhere(new Brackets(qb => {
                                qb.where(company_query, filter)
                            }));
                        }
                        else if(isNotEmpty(search.companies) && isArray(search.companies) && search.companies.length > 0 && search.billing_type == 2) {
                            let company_query = '"user"."id" = :company1', filter = {};
                            filter = {
                                ...filter,
                                'company1': search.companies[0]
                            }
                            for(let i = 1; i < search.companies.length; i ++) {
                                company_query += ' or "user"."id" = :company' + (i + 1);
                                let key = `company${i+1}`
                                filter = {
                                    ...filter,
                                    [key]: search.companies[i]
                                }
                            }
                            query = query.andWhere(new Brackets(qb => {
                                qb.where(company_query, filter)
                            }));
                        }

                        if(search.billing_type == 3) {
                            if(isNotEmpty(search.requesters) && isArray(search.requesters) && search.requesters.length > 0) {
                                let requester_query = '"user"."id" = :requester1', filter = {};
                                filter = {
                                    ...filter,
                                    'requester1': search.requesters[0]
                                }
                                for(let i = 1; i < search.requesters.length; i ++) {
                                    requester_query += ' or "user"."id" = :requester' + (i + 1);
                                    let key = `requester${i+1}`
                                    filter = {
                                        ...filter,
                                        [key]: search.requesters[i]
                                    }
                                }
                                query = query.andWhere(new Brackets(qb => {
                                    qb.where(requester_query, filter)
                                }));
                            }
                        }
                        query = query.groupBy('"user"."id"');
                        if(search.billing_type == 3) {
                            query = query.addGroupBy('"parent"."company_name"')
                            .addGroupBy('"parent"."login_id"')
                            .addGroupBy('"parent"."id"')
                        }
                        query = query.orderBy('count("t_r"."end_date")', 'DESC');
            }
            else if(search.billing_type == 4){
                if(start_year != end_year) {
                    sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(trans_request.tc_end_date)) >= ' + start_year)
                                         .andWhere('date_part(\'year\', to_timestamp(trans_request.tc_end_date)) <= ' + end_year)
                                         .andWhere(new Brackets(qb => {
                                            qb.where('(date_part(\'year\', to_timestamp(trans_request.tc_end_date)) = ' + start_year + ' and date_part(\'month\', to_timestamp(trans_request.tc_end_date)) >= ' + start_month + ') or  \
                                            (date_part(\'year\', to_timestamp(trans_request.tc_end_date)) = ' + end_year + ' and date_part(\'month\', to_timestamp(trans_request.tc_end_date)) <= ' + end_month + ') \
                                            or(date_part(\'year\', to_timestamp(trans_request.tc_end_date)) > ' + start_year + ' and date_part(\'year\', to_timestamp(trans_request.tc_end_date)) < ' + end_year +')')
                                         }));
                }
                else {
                    sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(trans_request.tc_end_date)) = ' + start_year)
                    .andWhere('date_part(\'month\', to_timestamp(trans_request.tc_end_date)) <= ' + end_month)
                    .andWhere('date_part(\'month\', to_timestamp(trans_request.tc_end_date)) >= ' + start_month);
                }

                if (isNotEmpty(search.tags) && isArray(search.tags) && search.tags.length > 0) {
                    let tag_query;
                    tag_query = getConnection()
                        .createQueryBuilder()
                        .select('"user"."id"', 'user_no')
                        .from(User, "user");  
                    let tag_user_query = '1 != 1';
                    for (let i = 0; i < search.tags.length; i++) {
                        tag_user_query += ' or "user_tag"."tagId" = ' + search.tags[i]
                    }
                    tag_query = tag_query.leftJoin(UserTag, "user_tag", '"user_tag"."userId" = "user"."id" and (' + tag_user_query + ')')
                    tag_query = tag_query.where('"user"."user_type" = 4')
                        .andWhere('"user_tag"."id" is not NULL');
                    tag_query = tag_query.groupBy('"user"."id"');

                    query = getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."id") as "complete_count"')
                        .addSelect(' \
                                case \
                                when sum("t_r"."duration") is NULL \
                                then 0 \
                                else sum("t_r"."duration") \
                                end \
                                as "duration_sum"')
                        .addSelect('\
                                case \
                                when sum("t_r"."tc_work_price") is NULL \
                                then 0 \
                                else sum("t_r"."tc_work_price") \
                                end \
                                as work_price_sum')
                        .addSelect('"user"."user_name"', "_user_name")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."id"', "_user_no")
                        .from(User, "user")
                        .leftJoin('(' + tag_query.getQuery() + ')', "tag_tb", '"user"."id" = "tag_tb"."user_no"')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."tc_user_no"')
                        .setParameters(sub_query.getParameters())
                        .where('"user"."user_type" = ' + (global.ROLE.indexOf('tc') + 1))
                        .andWhere('"tag_tb"."user_no" is not NULL')
                        .andWhere('"user"."is_delete" = \'N\'');
                }
                else {
                    query = getConnection()
                    .createQueryBuilder()
                    .select('count("t_r"."id") as "complete_count"')
                    .addSelect(' \
                            case \
                            when sum("t_r"."duration") is NULL \
                            then 0 \
                            else sum("t_r"."duration") \
                            end \
                            as "duration_sum"')
                    .addSelect('\
                            case \
                            when sum("t_r"."tc_work_price") is NULL \
                            then 0 \
                            else sum("t_r"."tc_work_price") \
                            end \
                            as work_price_sum')
                    .addSelect('"user"."user_name"', "_user_name")
                    .addSelect('"user"."login_id"', "_user_id")
                    .addSelect('"user"."id"', "_user_no")
                    .from(User, "user")
                    .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."tc_user_no"')
                    .setParameters(sub_query.getParameters())
                    .where('"user"."user_type" = ' + (global.ROLE.indexOf('tc') + 1))
                    .andWhere('"user"."is_delete" = \'N\'');
                }

                if(isNotEmpty(search.workers) && isArray(search.workers) && search.workers.length > 0) {
                    let worker_query = '"user"."id" = :worker1', filter = {};
                    filter = {
                        ...filter,
                        'worker1': search.workers[0]
                    }
                    for(let i = 1; i < search.workers.length; i ++) {
                        worker_query += ' or "user"."id" = :worker' + (i + 1);
                        let key = `worker${i+1}`
                        filter = {
                            ...filter,
                            [key]: search.workers[i]
                        }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(worker_query, filter)
                    }));
                }
                query = query.groupBy('"user"."id"');        
            }
            else {
                if(start_year != end_year) {
                    sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(request_detail_worker.end_date)) >= ' + start_year)
                                         .andWhere('date_part(\'year\', to_timestamp(request_detail_worker.end_date)) <= ' + end_year)
                                         .andWhere(new Brackets(qb => {
                                            qb.where('(date_part(\'year\', to_timestamp(request_detail_worker.end_date)) = ' + start_year + ' and date_part(\'month\', to_timestamp(request_detail_worker.end_date)) >= ' + start_month + ') or  \
                                            (date_part(\'year\', to_timestamp(request_detail_worker.end_date)) = ' + end_year + ' and date_part(\'month\', to_timestamp(request_detail_worker.end_date)) <= ' + end_month + ') \
                                            or(date_part(\'year\', to_timestamp(request_detail_worker.end_date)) > ' + start_year + ' and date_part(\'year\', to_timestamp(request_detail_worker.end_date)) < ' + end_year +')')
                                         }));
                }
                else {
                    sub_query = sub_query.andWhere('date_part(\'year\', to_timestamp(request_detail_worker.end_date)) = ' + start_year)
                    .andWhere('date_part(\'month\', to_timestamp(request_detail_worker.end_date)) <= ' + end_month)
                    .andWhere('date_part(\'month\', to_timestamp(request_detail_worker.end_date)) >= ' + start_month);
                }

                if (isNotEmpty(search.tags) && isArray(search.tags) && search.tags.length > 0) {
                    let tag_query = getConnection()
                        .createQueryBuilder()
                        .select('"user"."id"', 'user_no')
                        .from(User, "user");  
                    let tag_user_query = '1 != 1';
                    for (let i = 0; i < search.tags.length; i++) {
                        tag_user_query += ' or "user_tag"."tagId" = ' + search.tags[i]
                    }
                    tag_query = tag_query.leftJoin(UserTag, "user_tag", '"user_tag"."userId" = "user"."id" and (' + tag_user_query + ')')
                    tag_query = tag_query.where('"user"."user_type" = ' + search.billing_type)
                        .andWhere('"user_tag"."id" is not NULL');
                    tag_query = tag_query.groupBy('"user"."id"');

                    query =  getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."id") as "complete_count"')
                        .addSelect(' \
                            case \
                            when sum("t_r"."duration") is NULL \
                            then 0 \
                            else sum("t_r"."duration") \
                            end \
                            as "duration_sum"')
                        .addSelect('\
                            case \
                            when sum("t_r"."work_price") is NULL \
                            then 0 \
                            else sum("t_r"."work_price") \
                            end \
                            as work_price_sum')
                        .addSelect('"user"."user_name"', "_user_name")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."id"', "_user_no")
                        .from(User, "user")
                        .leftJoin('(' + tag_query.getQuery() + ')', "tag_tb", '"user"."id" = "tag_tb"."user_no"')
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."user_no"')
                        .setParameters(sub_query.getParameters())
                        .where('"user"."user_type" = ' + search.billing_type)
                        .andWhere('"user"."is_delete" = \'N\'')
                        .andWhere('"tag_tb"."user_no" is not NULL');
                }   
                else {
                    query =  getConnection()
                        .createQueryBuilder()
                        .select('count("t_r"."id") as "complete_count"')
                        .addSelect(' \
                            case \
                            when sum("t_r"."duration") is NULL \
                            then 0 \
                            else sum("t_r"."duration") \
                            end \
                            as "duration_sum"')
                        .addSelect('\
                            case \
                            when sum("t_r"."work_price") is NULL \
                            then 0 \
                            else sum("t_r"."work_price") \
                            end \
                            as work_price_sum')
                        .addSelect('"user"."user_name"', "_user_name")
                        .addSelect('"user"."login_id"', "_user_id")
                        .addSelect('"user"."id"', "_user_no")
                        .from(User, "user")
                        .leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."user_no"')
                        .setParameters(sub_query.getParameters())
                        .where('"user"."user_type" = ' + search.billing_type)
                        .andWhere('"user"."is_delete" = \'N\'');
                }

                if(isNotEmpty(search.workers) && isArray(search.workers) && search.workers.length > 0) {
                    let worker_query = '"user"."id" = :worker1', filter = {};
                    filter = {
                        ...filter,
                        'worker1': search.workers[0]
                    }
                    for(let i = 1; i < search.workers.length; i ++) {
                        worker_query += ' or "user"."id" = :worker' + (i + 1);
                        let key = `worker${i+1}`
                        filter = {
                            ...filter,
                            [key]: search.workers[i]
                        }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(worker_query, filter)
                    }));
                }

                query = query.groupBy('"user"."id"');
                //   query = query.orderBy('count("t_r"."id")', 'DESC');
            }


            let __sum_query = getConnection()
                                .createQueryBuilder();
            if(search.billing_type == 1 || search.billing_type == 2 || search.billing_type == 3) {
                __sum_query = __sum_query.select('sum(src.complete_count)', '_complete_count')
                                        .addSelect('sum(src.duration_sum)', '_duration_sum')
                                        .addSelect('sum(src.usd_work_price_sum)', '_usd_work_price_sum')
                                        .addSelect('sum(src.krw_work_price_sum)', '_krw_work_price_sum')
                                        .addSelect('sum(src.jpy_work_price_sum)', '_jpy_work_price_sum')
                                        .addSelect('sum(src.total_work_price_sum)', '_total_work_price_sum')
                                        .addSelect('sum(src.tc_work_price_sum)', '_tc_work_price_sum')
                                        .addSelect('sum(src.translate_work_price_sum)', '_translate_work_price_sum')
                                        .addSelect('sum(src.review_work_price_sum)', '_review_work_price_sum');
            }
            else if(search.billing_type == 4 || search.billing_type == 5 || search.billing_type == 6) {
                __sum_query = __sum_query.select('sum(src.complete_count)', '_complete_count')
                                        .addSelect('sum(src.duration_sum)', '_duration_sum')
                                        .addSelect('sum(src.work_price_sum)', '_work_price_sum');
            }
            __sum_query = __sum_query.from('(' + query.getQuery() + ')', 'src')
                                    .setParameters(query.getParameters());
            let _result_sum = await __sum_query.getRawOne();
            if (isNotEmpty(table)) {
                if (isEmpty(table.order)) {
                    if (search.billing_type == 1) {
                        query = query.orderBy('"period"."year"', 'DESC')
                                    .addOrderBy('"period"."month"', 'DESC');  
                    }
                    if (search.billing_type == 2 || search.billing_type == 3) {
                        query = query.orderBy('count("t_r"."end_date")', 'DESC');
                    }
                    if (search.billing_type == 4 || search.billing_type == 5 || search.billing_type == 6) {
                        query = query.orderBy('count("t_r"."id")', 'DESC');
                    }
                }
                else {
                    let _order = parseInt(table.order);
                    if (search.billing_type == 1 && Math.abs(_order) == 1) {
                        query = query.orderBy('"period"."year"', _order > 0 ? 'ASC' : 'DESC')
                            .addOrderBy('"period"."month"', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if (search.billing_type == 2 && Math.abs(_order) == 1) {
                        query = query.orderBy('"user"."company_name"', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if (search.billing_type == 3 && Math.abs(_order) == 1) {
                        query = query.orderBy('"parent"."company_name"', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 4 && Math.abs(_order) == 1)
                        || (search.billing_type == 5 && Math.abs(_order) == 1)
                        || (search.billing_type == 6 && Math.abs(_order) == 1)) {
                        query = query.orderBy('"user"."user_name"', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if (search.billing_type == 3 && Math.abs(_order) == 2) {
                        query = query.orderBy('"user"."user_name"', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 2)
                        || (search.billing_type == 2 && Math.abs(_order) == 2)
                        || (search.billing_type == 3 && Math.abs(_order) == 3)) {
                        query = query.orderBy('count("t_r"."end_date")', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 4 && Math.abs(_order) == 2)
                        || (search.billing_type == 5 && Math.abs(_order) == 2)
                        || (search.billing_type == 6 && Math.abs(_order) == 2)) {
                        query = query.orderBy('count("t_r"."id")', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 3)
                        || (search.billing_type == 2 && Math.abs(_order) == 3)
                        || (search.billing_type == 3 && Math.abs(_order) == 4)
                        || (search.billing_type == 4 && Math.abs(_order) == 3)
                        || (search.billing_type == 5 && Math.abs(_order) == 3)
                        || (search.billing_type == 6 && Math.abs(_order) == 3)) {
                        query = query.orderBy(' \
                        case \
                        when sum("t_r"."duration") is NULL \
                        then 0 \
                        else sum("t_r"."duration") \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 4)
                        || (search.billing_type == 2 && Math.abs(_order) == 4)
                        || (search.billing_type == 3 && Math.abs(_order) == 5)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.USD + '\') is NULL \
                        then 0 \
                        else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.USD + '\') \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 5)
                        || (search.billing_type == 2 && Math.abs(_order) == 5)
                        || (search.billing_type == 3 && Math.abs(_order) == 6)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.KRW + '\') is NULL \
                        then 0 \
                        else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.KRW + '\') \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 6)
                        || (search.billing_type == 2 && Math.abs(_order) == 6)
                        || (search.billing_type == 3 && Math.abs(_order) == 7)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.JPY + '\') is NULL \
                        then 0 \
                        else sum("t_r"."work_price") FILTER (WHERE "t_r"."currency_type"=\'' + CurrencyType.JPY + '\') \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 7)
                        || (search.billing_type == 2 && Math.abs(_order) == 7)
                        || (search.billing_type == 3 && Math.abs(_order) == 8)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."total_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."total_work_price") \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 8)
                        || (search.billing_type == 2 && Math.abs(_order) == 8)
                        || (search.billing_type == 3 && Math.abs(_order) == 9)
                        || (search.billing_type == 4 && Math.abs(_order) == 4)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."tc_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."tc_work_price") \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 9)
                        || (search.billing_type == 2 && Math.abs(_order) == 9)
                        || (search.billing_type == 3 && Math.abs(_order) == 10)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."translate_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."translate_work_price") \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 1 && Math.abs(_order) == 10)
                        || (search.billing_type == 2 && Math.abs(_order) == 10)
                        || (search.billing_type == 3 && Math.abs(_order) == 11)) {
                        query = query.orderBy('\
                        case \
                        when sum("t_r"."review_work_price") is NULL \
                        then 0 \
                        else sum("t_r"."review_work_price") \
                        end', _order > 0 ? 'ASC' : 'DESC');
                    }
                    else if ((search.billing_type == 5 && Math.abs(_order) == 4)
                        || (search.billing_type == 6 && Math.abs(_order) == 4)) {
                            query = query.orderBy('\
                            case \
                            when sum("t_r"."work_price") is NULL \
                            then 0 \
                            else sum("t_r"."work_price") \
                            end', _order > 0 ? 'ASC' : 'DESC');
                    }
                }
                query.offset((table.page - 1) * table.page_length)
                    .limit(table.page_length);
            }
            let totals = await query.getCount();
            let _result = await query.getRawMany();
            let table_data: Array<any>;
            table_data = [];
            _result.forEach(function(item) {
                let table_item: {[k: string]: any} = {};
                if(search.billing_type == 1) {
                    table_item = {
                        year: item.year,
                        month: item.month,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        usd_work_price_sum: item.usd_work_price_sum,
                        krw_work_price_sum: item.krw_work_price_sum,
                        jpy_work_price_sum: item.jpy_work_price_sum,
                        tc_work_price_sum: item.tc_work_price_sum,
                        translate_work_price_sum: item.translate_work_price_sum,
                        review_work_price_sum: item.review_work_price_sum,
                        total_work_price_sum: item.total_work_price_sum
                    }
                }
                else if(search.billing_type == 2){
                    table_item = {
                        company_name: item._user_name,
                        company_id: item._user_id,
                        company_no: item._user_no,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        usd_work_price_sum: item.usd_work_price_sum,
                        krw_work_price_sum: item.krw_work_price_sum,
                        jpy_work_price_sum: item.jpy_work_price_sum,
                        tc_work_price_sum: item.tc_work_price_sum,
                        translate_work_price_sum: item.translate_work_price_sum,
                        review_work_price_sum: item.review_work_price_sum,
                        total_work_price_sum: item.total_work_price_sum
                    }
                }
                else if(search.billing_type == 3){
                    table_item = {
                        company_name: item._company_name,
                        company_id: item._company_id,
                        company_no: item._company_no,
                        user_name: item._user_name,
                        user_id: item._user_id,
                        user_no: item._user_no,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        usd_work_price_sum: item.usd_work_price_sum,
                        krw_work_price_sum: item.krw_work_price_sum,
                        jpy_work_price_sum: item.jpy_work_price_sum,
                        tc_work_price_sum: item.tc_work_price_sum,
                        translate_work_price_sum: item.translate_work_price_sum,
                        review_work_price_sum: item.review_work_price_sum,
                        total_work_price_sum: item.total_work_price_sum
                    }
                }
                else if(search.billing_type == 4) {
                    table_item = {
                        user_name: item._user_name,
                        user_id: item._user_id,
                        user_no: item._user_no,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        work_price_sum: item.work_price_sum
                    }
                }
                else {
                    table_item = {
                        user_name: item._user_name,
                        user_id: item._user_id,
                        user_no: item._user_no,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        work_price_sum: item.work_price_sum
                    }
                }
                table_data.push(table_item);
            });
           if(search.billing_type == 1 || search.billing_type == 2 || search.billing_type == 3) {
                return res.json({ errorCode: 0, errorMsg: "", data: {
                    totalCount: totals,
                    list: table_data,
                    _complete_count: (isEmpty(_result_sum._complete_count) ? 0 : _result_sum._complete_count),
                    _duration_sum: (isEmpty(_result_sum._duration_sum) ? 0 : _result_sum._duration_sum),
                    _usd_work_price_sum: (isEmpty(_result_sum._usd_work_price_sum) ? 0 : _result_sum._usd_work_price_sum),
                    _krw_work_price_sum: (isEmpty(_result_sum._krw_work_price_sum) ? 0 : _result_sum._krw_work_price_sum),
                    _jpy_work_price_sum: (isEmpty(_result_sum._jpy_work_price_sum) ? 0 : _result_sum._jpy_work_price_sum),
                    _total_work_price_sum: (isEmpty(_result_sum._total_work_price_sum) ? 0 : _result_sum._total_work_price_sum),
                    _tc_work_price_sum: (isEmpty(_result_sum._tc_work_price_sum) ? 0 : _result_sum._tc_work_price_sum),
                    _translate_work_price_sum: (isEmpty(_result_sum._translate_work_price_sum) ? 0 : _result_sum._translate_work_price_sum),
                    _review_work_price_sum: (isEmpty(_result_sum._review_work_price_sum) ? 0 : _result_sum._review_work_price_sum)
                } });
           }
           else {
                return res.json({ errorCode: 0, errorMsg: "", data: {
                    totalCount: totals,
                    list: table_data,
                    _complete_count: (isEmpty(_result_sum._complete_count) ? 0 : _result_sum._complete_count),
                    _duration_sum: (isEmpty(_result_sum._duration_sum) ? 0 : _result_sum._duration_sum),
                    _work_price_sum: (isEmpty(_result_sum._work_price_sum) ? 0 : _result_sum._work_price_sum)
                } });
           }
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        start_year,
        start_month,
        end_year,
        end_month
    }
    */
    static getWorkerBillingData = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            let query = getConnection()
                        .createQueryBuilder()
                        .select('count("request_detail_worker"."id") as "complete_count"')
                        .addSelect(' \
                        case \
                        when sum("trans_request"."duration") is NULL \
                        then 0 \
                        else sum("trans_request"."duration") \
                        end \
                        as "duration_sum"')
                        .addSelect(' \
                        ROUND(cast(case \
                        when sum("request_detail_worker"."price") is NULL \
                        then 0 \
                        else sum("request_detail_worker"."price") \
                        end as numeric), 3) \
                        as work_price_sum')
                        .addSelect('"period"."year" as "year"')
                        .addSelect('"period"."month" as "month"')
                        .from(Period, "period")
                        .leftJoin(RequestDetailWorker, "request_detail_worker", 'date_part(\'month\', to_timestamp("request_detail_worker"."end_date")) = "period"."month" and \
                        date_part(\'year\', to_timestamp(request_detail_worker.end_date)) = "period"."year" and "request_detail_worker"."is_end" = \'Y\' and "request_detail_worker"."userId" = ' + req.decodedUser.id)
                        .leftJoin('request_detail_worker.request_detail', 'request_detail')
                        .leftJoin('request_detail.request', 'trans_request');

            let start_year = new Date().getFullYear();
            let end_year = start_year;
            let start_month = new Date().getMonth() + 1;
            let end_month = start_month;

            if(isNotEmpty(search)) {
                if(isNotEmpty(search.start_year)) {
                    start_year = search.start_year;
                    end_year = search.end_year;
                    start_month = search.start_month;
                    end_month = search.end_month;
                }
                else {
                    let limit_query = getConnection()
                                    .createQueryBuilder()
                                    .select('date_part(\'month\', to_timestamp(min(request_detail_worker.end_date))) as start_month')
                                    .addSelect('date_part(\'year\', to_timestamp(min(request_detail_worker.end_date))) as start_year')
                                    .from(RequestDetailWorker, "request_detail_worker")
                                    .where('"request_detail_worker"."is_end" = \'Y\'')
                                    .andWhere('"request_detail_worker"."userId" = ' + req.decodedUser.id);
                    let _period_one = await limit_query.getRawOne();
                    if(isNotEmpty(_period_one.start_year))
                        start_year = _period_one.start_year;
                    if(isNotEmpty(_period_one.start_month))
                        start_month = _period_one.start_month;
                }
            }
            if(start_year != end_year)
                    query = query.where('"period"."year" >= ' + start_year)
                                 .andWhere('"period"."year" <= ' + end_year)
                                 .andWhere(new Brackets(qb => {
                                    qb.where('("period"."year" = ' + start_year + ' and "period"."month" >= ' + start_month + ') or ("period"."year" = ' + end_year + ' and "period"."month" <= ' + end_month + ') \
                                            or("period"."year" > ' + start_year + ' and "period"."year" < ' + end_year +')');
                            }));
            else {
                query = query.where('"period"."year" = ' + start_year)
                            .andWhere('"period"."month" <= ' + end_month)
                            .andWhere('"period"."month" >= ' + start_month);
            }

            query = query.groupBy('"period"."year"')
                        .addGroupBy('"period"."month"');

            let totals = await query.getCount()
            let __sum_query = getConnection()
                        .createQueryBuilder()
                        .select('sum(src.complete_count)', 'total_complete_count')
                        .addSelect('sum(src.duration_sum)', 'total_duration_sum')
                        .addSelect('sum(src.work_price_sum)', 'total_work_price_sum')
                        .from('(' + query.getQuery() + ')', 'src')
                        .setParameters(query.getParameters());
            let _result_sum = await __sum_query.getRawOne();
            if (isNotEmpty(table)) {
                if (isEmpty(table.order)) {
                    query = query.orderBy('"period"."year"', 'DESC')
                        .addOrderBy('"period"."month"', 'DESC');    
                }
                else {
                    let _order = parseInt(table.order);
                    switch (Math.abs(_order)) {
                        case 1:
                            query = query.orderBy('"period"."year"', _order > 0 ? 'ASC' : 'DESC')
                                        .addOrderBy('"period"."month"', _order > 0 ? 'ASC' : 'DESC');
                            break;
                        case 2:
                            query = query.orderBy('count("request_detail_worker"."id")', _order > 0 ? 'ASC' : 'DESC');
                            break;
                        case 3:
                            query = query.orderBy(' \
                            case \
                            when sum("trans_request"."duration") is NULL \
                            then 0 \
                            else sum("trans_request"."duration") \
                            end', _order > 0 ? 'ASC' : 'DESC');
                            break;
                        case 4:
                            query = query.orderBy(' \
                            case \
                            when sum("request_detail_worker"."price") is NULL \
                            then 0 \
                            else sum("request_detail_worker"."price") \
                            end', _order > 0 ? 'ASC' : 'DESC');
                            break;
                    }  
                }
                query.offset((table.page - 1) * table.page_length)
                    .limit(table.page_length);
            }
            let _result = await query.getRawMany();
            let table_data: Array<any>;
            table_data = [];
            _result.forEach(function(item) {
                let table_item: {[k: string]: any} = {};
                table_item = {
                    year: item.year,
                    month: item.month,
                    complete_count: item.complete_count,
                    duration_sum: item.duration_sum,
                    work_price_sum: item.work_price_sum
                }
                table_data.push(table_item);
            });
            return res.json({errorCode: 0, errorMsg: '', data: {
                totalCount: totals,
                list: table_data,
                total_complete_count: (isEmpty(_result_sum.total_complete_count)?0:_result_sum.total_complete_count),
                total_duration_sum: (isEmpty(_result_sum.total_duration_sum)?0:_result_sum.total_duration_sum),
                total_work_price_sum: (isEmpty(_result_sum.total_work_price_sum)?0:_result_sum.total_work_price_sum)
            }})
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        start_year,
        start_month,
        end_year,
        end_month,

        billing_type, //1: 월별(통합) , 2: 요청자별
        requesters: [1,3,4,5] //요청자목록
    }
    */
    static getBillingData = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            let query = getConnection()
                        .createQueryBuilder()
                        .select('count("trans_request"."id") as "complete_count"')
                        .addSelect(' \
                        case \
                        when sum("trans_request"."duration") is NULL \
                        then 0 \
                        else sum("trans_request"."duration") \
                        end \
                        as "duration_sum"');
            if(global.ROLE[req.decodedUser.user_type-1] == 'requester') {
                query = query.addSelect(' \
                case \
                when sum("trans_request"."work_price") is NULL \
                then 0 \
                else sum("trans_request"."work_price") \
                end \
                as work_price_sum')
                .addSelect('"period"."year" as "year"')
                .addSelect('"period"."month" as "month"')
                .from(Period, "period")
                .leftJoin(TransRequest, "trans_request", 'date_part(\'month\', to_timestamp("trans_request"."end_date")) = "period"."month" and \
                date_part(\'year\', to_timestamp(trans_request.end_date)) = "period"."year" and "trans_request"."is_end" = \'Y\' and "trans_request"."userId" = ' + req.decodedUser.id);
            }
            else if(global.ROLE[req.decodedUser.user_type-1] == 'tc') {
                query = query.addSelect(' \
                ROUND(cast(case \
                when sum("trans_request"."tc_work_price") is NULL \
                then 0 \
                else sum("trans_request"."tc_work_price") \
                end as numeric), 3) \
                as work_price_sum')
                .addSelect('"period"."year" as "year"')
                .addSelect('"period"."month" as "month"')
                .from(Period, "period")
                .leftJoin(TransRequest, "trans_request", 'date_part(\'month\', to_timestamp("trans_request"."tc_end_date")) = "period"."month" and \
                date_part(\'year\', to_timestamp(trans_request.tc_end_date)) = "period"."year" and "trans_request"."tc_status" = 3 and "trans_request"."tcUserId" = ' + req.decodedUser.id);
            }

                let start_year = new Date().getFullYear();
                let end_year = start_year;
                let start_month = new Date().getMonth() + 1;
                let end_month = start_month;

                if(isNotEmpty(search)) {
                    if(isNotEmpty(search.start_year)) {
                        start_year = search.start_year;
                        end_year = search.end_year;
                        start_month = search.start_month;
                        end_month = search.end_month;
                    }
                    else {
                        let limit_query = getConnection()
                                        .createQueryBuilder();
                        if(global.ROLE[req.decodedUser.user_type-1] == 'requester') {
                            limit_query = limit_query.select('date_part(\'month\', to_timestamp(min(end_date))) as start_month')
                            .addSelect('date_part(\'year\', to_timestamp(min(end_date))) as start_year')
                            .from(TransRequest, "trans_request")
                            .where('"trans_request"."is_end" = \'Y\'')
                            .andWhere('"trans_request"."userId" = ' + req.decodedUser.id);
                        }
                        else {
                            limit_query = limit_query.select('date_part(\'month\', to_timestamp(min(tc_end_date))) as start_month')
                            .addSelect('date_part(\'year\', to_timestamp(min(tc_end_date))) as start_year')
                            .from(TransRequest, "trans_request")
                            .where('"trans_request"."tc_status" = 3')
                            .andWhere('"trans_request"."tcUserId" = ' + req.decodedUser.id);
                        }
                        let _period_one = await limit_query.getRawOne();
                        if(isNotEmpty(_period_one.start_year))
                            start_year = _period_one.start_year;
                        if(isNotEmpty(_period_one.start_month))
                            start_month = _period_one.start_month;
                    }
                }
                if(start_year != end_year)
                    query = query.where('"period"."year" >= ' + start_year)
                                        .andWhere('"period"."year" <= ' + end_year)
                                        .andWhere(new Brackets(qb => {
                                            qb.where('("period"."year" = ' + start_year + ' and "period"."month" >= ' + start_month + ') or ("period"."year" = ' + end_year + ' and "period"."month" <= ' + end_month + ') \
                                            or("period"."year" > ' + start_year + ' and "period"."year" < ' + end_year +')');
                            }));
                else {
                    query = query.where('"period"."year" = ' + start_year)
                                .andWhere('"period"."month" <= ' + end_month)
                                .andWhere('"period"."month" >= ' + start_month);
                }
                query = query.groupBy('"period"."year"')
                .addGroupBy('"period"."month"');
            let totals = await query.getCount()
            let __sum_query = getConnection()
                        .createQueryBuilder()
                        .select('sum(src.complete_count)', 'total_complete_count')
                        .addSelect('sum(src.duration_sum)', 'total_duration_sum')
                        .addSelect('sum(src.work_price_sum)', 'total_work_price_sum')
                        .from('(' + query.getQuery() + ')', 'src')
                        .setParameters(query.getParameters());
            let _result_sum = await __sum_query.getRawOne();
            if (isNotEmpty(table)) {
                if (isEmpty(table.order)) {
                    query = query.orderBy('"period"."year"', 'DESC')
                        .addOrderBy('"period"."month"', 'DESC');    
                }
                else {
                    let _order = parseInt(table.order);
                    switch (Math.abs(_order)) {
                        case 1:
                            query = query.orderBy('"period"."year"', _order > 0 ? 'ASC' : 'DESC')
                                        .addOrderBy('"period"."month"', _order > 0 ? 'ASC' : 'DESC');
                            break;
                        case 2:
                            query = query.orderBy('count("trans_request"."id")', _order > 0 ? 'ASC' : 'DESC');
                            break;
                        case 3:
                            query = query.orderBy(' \
                            case \
                            when sum("trans_request"."duration") is NULL \
                            then 0 \
                            else sum("trans_request"."duration") \
                            end', _order > 0 ? 'ASC' : 'DESC');
                            break;
                        case 4:
                            query = query.orderBy(' \
                            case \
                            when sum("trans_request"."tc_work_price") is NULL \
                            then 0 \
                            else sum("trans_request"."tc_work_price") \
                            end', _order > 0 ? 'ASC' : 'DESC');
                            break;
                    }  
                }
                query.offset((table.page - 1) * table.page_length)
                    .limit(table.page_length);
            }

            let _result = await query.getRawMany();
            let table_data: Array<any>;
            table_data = [];
            _result.forEach(function(item) {
                let table_item: {[k: string]: any} = {};
                table_item = {
                    year: item.year,
                    month: item.month,
                    complete_count: item.complete_count,
                    duration_sum: item.duration_sum,
                    work_price_sum: item.work_price_sum
                }
                table_data.push(table_item);
            });
            return res.json({errorCode: 0, errorMsg: '', data: {
                totalCount: totals,
                list: table_data,
                total_complete_count: (isEmpty(_result_sum.total_complete_count)?0:_result_sum.total_complete_count),
                total_duration_sum: (isEmpty(_result_sum.total_duration_sum)?0:_result_sum.total_duration_sum),
                total_work_price_sum: (isEmpty(_result_sum.total_work_price_sum)?0:_result_sum.total_work_price_sum)
            }})
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        start_year,
        start_month,
        end_year,
        end_month,
        billing_type, //1: 월별(통합) , 2: 요청자별
        requesters: [1,3,4,5] //요청자목록
    }
    */
    static getCompanyBillingData = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            if(isEmpty(search) || isEmpty(search.billing_type))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });

            let query = getConnection()
                        .createQueryBuilder();
            if(search.billing_type == 1) {
                let sub_query = getConnection()
                    .createQueryBuilder()
                    .from(TransRequest, "trans_request");
                
                if (req.decodedUser.user_type == 2) {
                    sub_query = sub_query.leftJoin("trans_request.user", "user")
                    .where('"user"."parent_id" = ' + req.decodedUser.id)
                    .andWhere('"user"."is_delete" = \'N\'')    
                    .andWhere('"trans_request"."is_end" = \'Y\'');   
                }
                else if (req.decodedUser.user_type == 7) {
                    sub_query = sub_query.leftJoin("trans_request.user", "user")
                    .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                    .where('"manager"."id" is not null')
                    .andWhere('"user"."is_delete" = \'N\'')
                    .andWhere('"trans_request"."is_end" = \'Y\'');   
                }
                
                if(isNotEmpty(search.requesters) && isArray(search.requesters) && search.requesters.length > 0) {
                    let requester_query = '"trans_request"."userId" = :requester1', filter = {};
                    filter = {
                        ...filter,
                        'requester1': search.requesters[0]
                    }
                    for(let i = 1; i < search.requesters.length; i ++) {
                        requester_query += ' or "trans_request"."userId" = :requester' + (i + 1);
                        let key = `requester${i+1}`
                        filter = {
                            ...filter,
                            [key]: search.requesters[i]
                        }
                    }
                    sub_query = sub_query.andWhere(new Brackets(qb => {
                        qb.where(requester_query, filter)
                    }));
                }
                query = query.select('count("t_r"."end_date") as "complete_count"')
                .addSelect(' \
                    case \
                    when sum("t_r"."duration") is NULL \
                    then 0 \
                    else sum("t_r"."duration") \
                    end \
                    as "duration_sum"')
                .addSelect('\
                case \
                when sum("t_r"."work_price") is NULL \
                then 0 \
                else sum("t_r"."work_price") \
                end \
                as work_price_sum')
                .addSelect('"period"."year" as "year"')
                .addSelect('"period"."month" as "month"')
                .from(Period, "period")
                .leftJoin('(' + sub_query.getQuery() + ')', "t_r", 'date_part(\'month\', to_timestamp("t_r"."end_date")) = "period"."month" and \
                date_part(\'year\', to_timestamp(t_r.end_date)) = "period"."year"')
                .setParameters(sub_query.getParameters());
            }
            else if(search.billing_type == 2) {
                query =  query.select('count("trans_request"."id") as "complete_count"')
                .addSelect(' \
                    case \
                    when sum("trans_request"."duration") is NULL \
                    then 0 \
                    else sum("trans_request"."duration") \
                    end \
                    as "duration_sum"')
                .addSelect(' \
                    case \
                    when sum("trans_request"."work_price") is NULL \
                    then 0 \
                    else sum("trans_request"."work_price") \
                    end \
                    as work_price_sum')
                .addSelect('"user"."login_id" as "user_id"')
                .addSelect('"user"."user_name" as "user_name"')
                .addSelect('"user"."id" as "user_no"')
                .from(User, "user");
            }
            let start_year = new Date().getFullYear();
            let end_year = start_year;
            let start_month = new Date().getMonth() + 1;
            let end_month = start_month;
            if(isNotEmpty(search.start_year)) {
                start_year = search.start_year;
                end_year = search.end_year;
                start_month = search.start_month;
                end_month = search.end_month;
            }
            else {
                let limit_query = getConnection()
                    .createQueryBuilder()
                    .select('date_part(\'month\', to_timestamp(min(end_date))) as start_month')
                    .addSelect('date_part(\'year\', to_timestamp(min(end_date))) as start_year')
                    .from(TransRequest, "trans_request");
                if (req.decodedUser.user_type == 2) {
                    limit_query = limit_query.leftJoin("trans_request.user", "user")
                    .where('"trans_request"."is_end" = \'Y\'')
                        .andWhere('"user"."parent_id" = ' + req.decodedUser.id)
                        .andWhere('"user"."is_delete" = \'N\'');
                }
                else if(req.decodedUser.user_type == 7){
                    limit_query = limit_query.leftJoin("trans_request.user", "user")
                        .leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                        .where('"trans_request"."is_end" = \'Y\'')
                        .andWhere('"manager"."id" is not null')   
                        .andWhere('"user"."is_delete" = \'N\'');
                }
                let _period_one = await limit_query.getRawOne();
                if(isNotEmpty(_period_one.start_year))
                    start_year = _period_one.start_year;
                if(isNotEmpty(_period_one.start_month))
                    start_month = _period_one.start_month;
            }
            if(search.billing_type == 1) {
                if(start_year != end_year)
                    query = query.where('"period"."year" >= ' + start_year)
                                        .andWhere('"period"."year" <= ' + end_year)
                                        .andWhere(new Brackets(qb => {
                                            qb.where('("period"."year" = ' + start_year + ' and "period"."month" >= ' + start_month + ') or ("period"."year" = ' + end_year + ' and "period"."month" <= ' + end_month + ') \
                                            or("period"."year" > ' + start_year + ' and "period"."year" < ' + end_year +')');
                            }));
                else {
                    query = query.where('"period"."year" = ' + start_year)
                                .andWhere('"period"."month" <= ' + end_month)
                                .andWhere('"period"."month" >= ' + start_month);
                }
                query = query.groupBy('"period"."year"')
                .addGroupBy('"period"."month"');
            }
            else if(search.billing_type == 2) {
                if(start_year != end_year)
                    query = query.leftJoin('user.trans_requests', 'trans_request', '"trans_request"."is_end" = \'Y\' and date_part(\'year\', to_timestamp(trans_request.end_date)) >= ' + start_year + ' \
                                            and date_part(\'year\', to_timestamp(trans_request.end_date)) <= ' + end_year + ' \
                                            and ( (date_part(\'year\', to_timestamp(trans_request.end_date)) = ' + start_year + ' and date_part(\'month\', to_timestamp(trans_request.end_date)) >= ' + start_month + ') or (date_part(\'year\', to_timestamp(trans_request.end_date)) = ' + end_year + ' and date_part(\'month\', to_timestamp(trans_request.end_date)) <= ' + end_month + ') \
                                            or(date_part(\'year\', to_timestamp(trans_request.end_date)) > ' + start_year + ' and date_part(\'year\', to_timestamp(trans_request.end_date)) < ' + end_year +') )');
                else
                    query = query.leftJoin('user.trans_requests', 'trans_request', '"trans_request"."is_end" = \'Y\' and date_part(\'year\', to_timestamp(trans_request.end_date)) = ' + start_year + ' \
                                        and date_part(\'month\', to_timestamp(trans_request.end_date)) <= ' + end_month + ' \
                                        and date_part(\'month\', to_timestamp(trans_request.end_date)) >= ' + start_month + ' \
                    ');
                
                ////////////////////////////// 
                if (req.decodedUser.user_type == 2) {
                    query = query.where('"user"."parent_id" = ' + req.decodedUser.id)
                    .andWhere('"user"."is_delete" = \'N\'');
                }
                else if (req.decodedUser.user_type == 7) {
                    query = query.leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                    query = query.where('"manager"."id" is not null')
                    .andWhere('"user"."is_delete" = \'N\'');
                }

                if(isNotEmpty(search.requesters) && isArray(search.requesters) && search.requesters.length > 0) {
                    let requester_query = '"user"."id" = :requester1', filter = {};
                    filter = {
                        ...filter,
                        'requester1': search.requesters[0]
                    }
                    for(let i = 1; i < search.requesters.length; i ++) {
                        requester_query += ' or "user"."id" = :requester' + (i + 1);
                        let key = `requester${i+1}`
                        filter = {
                            ...filter,
                            [key]: search.requesters[i]
                        }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(requester_query, filter)
                    }));
                }
                query = query.groupBy('"user"."login_id"')
                    .addGroupBy('"user"."user_name"')
                    .addGroupBy('"user"."id"');
            }
            let totals = await query.getCount();

            let __sum_query = getConnection()
            .createQueryBuilder()
            .select('sum(src.complete_count)', 'total_complete_count')
            .addSelect('sum(src.duration_sum)', 'total_duration_sum')
            .addSelect('sum(src.work_price_sum)', 'total_work_price_sum')
            .from('(' + query.getQuery() + ')', 'src')
            .setParameters(query.getParameters());

            let _result_sum = await __sum_query.getRawOne();

            if (isNotEmpty(table)) {
                if (isEmpty(table.order)) {
                    if (search.billing_type == 1) {
                        query = query.orderBy('"period"."year"', 'DESC')
                                     .addOrderBy('"period"."month"', 'DESC');    
                    }
                    else {
                        query = query.orderBy('count("trans_request"."id")', 'DESC');
                    }
                }
                else {
                    let _order = parseInt(table.order);
                    if(search.billing_type == 1) {
                        switch (Math.abs(_order)) {
                            case 1:
                                query = query.orderBy('"period"."year"', _order > 0 ? 'ASC' : 'DESC')
                                            .addOrderBy('"period"."month"', _order > 0 ? 'ASC' : 'DESC');
                                break;
                            case 2:
                                query = query.orderBy('count("t_r"."end_date")', _order > 0 ? 'ASC' : 'DESC');
                                break;
                            case 3:
                                query = query.orderBy(' \
                                case \
                                when sum("t_r"."duration") is NULL \
                                then 0 \
                                else sum("t_r"."duration") \
                                end', _order > 0 ? 'ASC' : 'DESC');
                                break;
                            case 4:
                                query = query.orderBy('\
                                case \
                                when sum("t_r"."work_price") is NULL \
                                then 0 \
                                else sum("t_r"."work_price") \
                                end', _order > 0 ? 'ASC' : 'DESC');
                                break;
                        }  
                    }
                    else if(search.billing_type == 2) {
                        switch (Math.abs(_order)) {
                            case 1:
                                query = query.orderBy('"user"."user_name"', _order > 0 ? 'ASC' : 'DESC');
                                break;
                            case 2:
                                query = query.orderBy('count("trans_request"."id")', _order > 0 ? 'ASC' : 'DESC');
                                break;
                            case 3:
                                query = query.orderBy(' \
                                case \
                                when sum("trans_request"."duration") is NULL \
                                then 0 \
                                else sum("trans_request"."duration") \
                                end', _order > 0 ? 'ASC' : 'DESC');
                                break;
                            case 4:
                                query = query.orderBy(' \
                                case \
                                when sum("trans_request"."work_price") is NULL \
                                then 0 \
                                else sum("trans_request"."work_price") \
                                end', _order > 0 ? 'ASC' : 'DESC');
                                break;
                        }  
                    }
                }
                query.offset((table.page - 1) * table.page_length)
                    .limit(table.page_length);
            }
            let _result = await query.getRawMany();
            let table_data: Array<any>;
            table_data = [];
            _result.forEach(function(item) {
                let table_item: {[k: string]: any} = {};
                if(search.billing_type == 1) {
                    table_item = {
                        year: item.year,
                        month: item.month,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        work_price_sum: item.work_price_sum
                    }
                }
                else if(search.billing_type == 2){
                    table_item = {
                        user_id: item.user_id,
                        user_name: item.user_name,
                        user_no: item.user_no,
                        complete_count: item.complete_count,
                        duration_sum: item.duration_sum,
                        work_price_sum: item.work_price_sum
                    }
                }
                table_data.push(table_item);
            });

            return res.json({errorCode: 0, errorMsg: '', data: {
                totalCount: totals,
                list: table_data,
                total_complete_count: (isEmpty(_result_sum.total_complete_count)?0:_result_sum.total_complete_count),
                total_duration_sum: (isEmpty(_result_sum.total_duration_sum)?0:_result_sum.total_duration_sum),
                total_work_price_sum: (isEmpty(_result_sum.total_work_price_sum)?0:_result_sum.total_work_price_sum)
            }})
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default BillingController;
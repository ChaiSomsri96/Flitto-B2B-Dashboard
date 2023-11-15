import { User } from './../entity/user';
import { isEmpty, isArray, isNotEmpty } from 'class-validator';
import { Trigger } from './../entity/entity-enum';
import { RequestDetail } from './../entity/request-detail';
import { getRepository, Brackets } from 'typeorm';
import global from './../config/global';
import { TransRequest } from './../entity/trans-request';
// import { Tag } from './../entity/tag';

export const generateRandomString = (length: number) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const get_id_from_pair_array = (item1: any, item2: any, array1: any[], array2: any[]) => {
    for(let i = 0; i < array1.length; i ++) {
        if(array1[i] == item1 && array2[i] == item2) {
            return i;
        }
    }
    return -1;
};

export const calculate_duration = (duration: string) => {
    /* PT1H23M45S */
    let seconds = 0;
    let timePart = duration.substr(2, duration.length - 2);
    /*1H23M45S*/
    seconds += (timePart.indexOf("H") < 0 ? 0 : parseInt(timePart.split("H")[0]) * 3600)
    timePart = timePart.substr(timePart.indexOf("H") + 1, timePart.length - timePart.indexOf("H") - 1)
    seconds += (timePart.indexOf("M") < 0 ? 0 : parseInt(timePart.split("M")[0]) * 60)
    timePart = timePart.substr(timePart.indexOf("M") + 1, timePart.length - timePart.indexOf("M") - 1)
    seconds += (timePart.indexOf("S") < 0 ? 0 : parseInt(timePart.split("S")[0]) )
    return seconds;
}

export const calculate_mins = (duration: number) => {
    let _duration = Math.floor(duration / 60);
    if(duration % 60 >= 30)
        _duration ++;
    return _duration;
}

export const getWorkerCountByTags = async (worker_type: string, tags: number[]) => {
    try {
        let query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoinAndSelect("user.tags", "user_tag")
                    .leftJoinAndSelect("user_tag.tag", "tag");
        query = query.where('"user"."user_type" = :user_type', { user_type: (global.ROLE.indexOf(worker_type) + 1) })
        
        if (isArray(tags)) {
            if (tags.length < 1) {
                // query = query.andWhere('"user_tag"."id" = :column', { column: null });
            }
            else {
                let tag_query = '"user_tag"."tagId" = :tag1', filter = {};
                filter = {
                    ...filter,
                    'tag1': tags[0]
                }
                for( let i = 1; i < tags.length; i ++) {
                    tag_query += ' or "user_tag"."tagId" = :tag' + (i  + 1);
                    let key = `tag${i+1}`
                        filter = {
                            ...filter,
                            [key] : tags[i]
                        }
                }
                query = query.andWhere(new Brackets(qb => {
                    qb.where(tag_query, filter)
                }));         
            }
        }
        else {
        //    query = query.andWhere('"user_tag"."id" = :column' , {column: null});
        }
        let totals = await query.getCount();
        return totals
    }
    catch (error) {
        return 0;
    }
}
        
export const current_work_count = async (user_id: number) => {
    let work_count = getRepository(RequestDetail)
                    .createQueryBuilder("request_detail")
                    .select("count(request_detail.id)", "work_count")
                    .leftJoin("request_detail.workers", "request_detail_worker")
                    .where('"request_detail_worker"."userId" = :user_id', {user_id: user_id})
                    .andWhere('"request_detail_worker"."is_end" = :is_end', {is_end: Trigger.OFF});
    let _result = await work_count.getRawOne();
    if(isEmpty(_result.work_count))
        return 0;
    else
        return _result.work_count;
}

export const current_tc_work_count = async(user_id: number) => {
    let work_count = getRepository(TransRequest)
                    .createQueryBuilder("trans_request")
                    .select("count(trans_request.id)", "work_count")
                    .where('"trans_request"."tcUserId" = :tc_user_id', {tc_user_id: user_id})
                    .andWhere("trans_request.tc_status != 3");
    let _result = await work_count.getRawOne();
    if(isEmpty(_result.work_count))
        return 0;
    else
        return _result.work_count;
}

export const calculate_work_price = async(company_id: number , duration: number, correction_rate: number,
    worker_type: number , original_language: number, translate_language: number) => {
    const userRepository = getRepository(User);
    let _company = await userRepository.findOne(company_id);
    let work_price = 0;
    if(_company == undefined)
        return 0;
    if(isArray(_company.prices)) {
        for(let i = 0; i < _company.prices.length; i ++) {
            if( (_company.prices[i].original.id == original_language)
            &&  (_company.prices[i].translate.id == translate_language) ) {
                if(global.ROLE[worker_type - 1] == 'tc')
                    work_price = _company.prices[i].tc_price;
                else if(global.ROLE[worker_type - 1] == 'translator')
                    work_price = _company.prices[i].trans_price;
                else if(global.ROLE[worker_type - 1] == 'reviewer')
                    work_price = _company.prices[i].test_price;
                break;
            }
        }
    }
    if (isNotEmpty(correction_rate)) {
        work_price = work_price * (100 + correction_rate) / 100;
    }
    work_price = calculate_mins(duration) * work_price;
    work_price = parseFloat(work_price.toFixed(4))
    return work_price;
}

export const calculate_predict_time = async(company_id: number, duration_mins: number, user_type: number, is_urgent: string) => {
    const userRepository = getRepository(User);
    let _company = await userRepository.findOne(company_id);
    let predict_time = 0;
    if(_company == undefined)
        return predict_time;
    if(isArray(_company.end_time_settings)) {
        for(let i = 0; i < _company.end_time_settings.length; i ++) {
            if(_company.end_time_settings[i].work_type == user_type) {
                if(is_urgent == 'Y') {
                    //긴급번역
                    predict_time = duration_mins * _company.end_time_settings[i].emergency_trans_time + _company.end_time_settings[i].emergency_add_time;
                }
                else {
                    //일반번역 (48시간)
                    if(duration_mins <= _company.screen_time_limit.general_screen_limit) {
                        predict_time = duration_mins * _company.end_time_settings[i].general_trans_time + _company.end_time_settings[i].general_trans_add_time;
                    }
                    else {
                        predict_time += ( duration_mins * _company.end_time_settings[i].general_excess_time + _company.end_time_settings[i].general_excess_add_time );
                    }
                }
                break;
            }
        }
    }
    return predict_time;
}
export const calc_working_time = async(screen_time_limit: any, end_time_settings: any, duration_mins: number, user_type: number, is_urgent: string) => {
    let predict_time = 0;
    if(isArray(end_time_settings)) {
        for(let i = 0; i < end_time_settings.length; i ++) {
            if(end_time_settings[i].work_type == user_type) {
                if(is_urgent == 'Y') {
                    //긴급번역
                    predict_time = duration_mins * end_time_settings[i].emergency_trans_time + end_time_settings[i].emergency_add_time;
                }
                else {
                    //일반번역 (48시간)
                    if(duration_mins <= screen_time_limit.general_screen_limit) {
                        predict_time = duration_mins * end_time_settings[i].general_trans_time + end_time_settings[i].general_trans_add_time;
                    }
                    else {
                        predict_time += ( duration_mins * end_time_settings[i].general_excess_time + end_time_settings[i].general_excess_add_time );
                    }
                }
                break;
            }
        }
    }
    return predict_time;
}
export const getDateString = (_date: Date) => {
    let _year = _date.getFullYear();
    let _month = _date.getMonth() + 1;
    let _day = _date.getDate();
    let _ret = _year.toString();
    if(_month < 10) _ret += '-0' + _month;
    else _ret += '-' + _month;
    if(_day  < 10) _ret += '-0' + _day;
    else _ret += '-'  + _day;
    return _ret;
}

export const getGraphDateFormat = (_date: Date) => {
    return (_date.getMonth() + 1).toString() + '/' + _date.getDate();
}

export const getIntVal = (_val: any) => {
    if(isNaN(parseInt(_val)))
        return 0
    else
        return parseInt(_val)
}

export const getDecimalFormatFloatVal = (_val: any) => {
    let _flt = parseFloat(_val)
    if(isNaN(_flt))
        return 0
    var e = 1, p = 0
    while (Math.round(_flt * e) / e !== _flt) { e *= 10; p++; }
    if(p >= 5)
        return parseFloat(_flt.toFixed(4))
    else
        return _flt
}
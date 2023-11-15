import { Request, Response } from 'express';
import { isArray, isDefined, isEmpty, isNotEmpty,isNumber , isNumberString } from 'class-validator';
import { generateRandomString } from './../helpers/utils';
import { getRepository, getConnection, Brackets } from "typeorm";
import { User } from './../entity/user';
import { Manager } from './../entity/manager';
import fs from "fs";
import config from '../config/config';
import global from '../config/global';
import { sendEmail } from './../helpers/notice-method';
import lang from "../lang/index";
import { Trigger } from './../entity/entity-enum';

class ManagerController {
  static detail = async (req: Request, res: Response) => {
    const {
      id
    } = req.body;
    if (isEmpty(id))
      return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });   
    try {
      let query = getRepository(User)
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.managers", "manager")
        .leftJoinAndSelect("user.parent", "parent")
        .leftJoinAndSelect("manager.requester","requester")
        .where('user.id = ' + id);
      
      let user = await query.getOne();
      if(user === undefined || user.is_delete === Trigger.ON)
        return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' }); 
      if (global.ROLE[user.user_type - 1] !== 'manager') {
        return res.json({ errorCode: 1, errorMsg: 'Invalid Id, This is not manager id.' });
      }
      if(global.ROLE[req.decodedUser.user_type - 1] === 'company' && user.parent_id !== req.decodedUser.id) {
        return res.json({ errorCode: 2, errorMsg: 'Invalid Id, This is not valid id for you. ' });
      }

      let data: { [k: string]: any } = {};
      if (global.ROLE[req.decodedUser.user_type - 1] === 'company')
        data.memo = isEmpty(user.company_memo) ? '' : user.company_memo;  
      else
        data.memo = isEmpty(user.admin_memo) ? '' : user.admin_memo;
      data = {
        id: id,
        user_id: user.login_id,
        user_name: user.user_name,
        country_code: isEmpty(user.country_code) ? '' : user.country_code,
        phone_number: isEmpty(user.phone_number) ? '' : user.phone_number,
        email: user.user_email,
        system_lang: user.system_lang,
        sms_notice_check:  user.is_sms_notice_on,
        email_notice_check: user.is_email_notice_on,
        memo: (global.ROLE[req.decodedUser.user_type - 1] === 'company' ? user.company_memo : user.admin_memo),
        manage_cnt: user.requester_cnt,
        avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar)
      }
      if (global.ROLE[req.decodedUser.user_type - 1] === 'admin') {
        data.company_data = {
          id: user.parent.id,
          company_name: user.parent.company_name,
          company_id: user.parent.login_id
        }
      }
      data.requesters = []
      data.requester_names = []
      for (let i = 0; i < user.managers.length; i++) {
        data.requesters.push(user.managers[i].requester.id)
        data.requester_names.push({
          user_name: user.managers[i].requester.user_name,
          user_id: user.managers[i].requester.login_id
        })
      }
      return res.json({ errorCode: 0, errorMsg: '', data: data });
    }
    catch (error) {
      console.log(error) 
      return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
    }
  }
  static deleteManager = async (req: Request, res: Response) => {
    const { ids } = req.body;
    if( !( isArray(ids) && ids.length > 0 ) )
      return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
    try {
      for (let i = 0; i < ids.length; i++) {
        let index = ids[i]
        /* 
        //remove manager
        await getConnection()
          .createQueryBuilder()
          .delete()        
          .from(Manager)
          .where('"manager"."managerId" = :id', { id: index })
          .execute();
        //remove from User
        await getConnection()
          .createQueryBuilder()
          .delete()
          .from(User)
          .where("id = :id", { id: index })
          .execute();
          */
         await getConnection()
         .createQueryBuilder()
         .update(User)
         .set({
             is_delete: Trigger.ON 
         })
         .where("id = :id", { id: index })
         .execute();
      }
      return res.json({ errorCode: 0, errorMsg: "" });
    }
    catch (error) {
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
      company_ids: ['1', '2', '3', '4'],
      keyword_type: 1,   // 1: 이름 , 2: 아이디 , 3: 전화번호 , 4: 이메일
      search_keyword: 'asdf',   //검색어
      search_type: 1,    // 1: 포함 , 2: 일치

      requester_ids: [],

      manage_cnt_start: 0, //관리대상 요청자 수
      manage_cnt_end: 0 //관리대상 요청자 수
  }  
  */
  static getManagerList = async (req: Request, res: Response) => {
    const {
      table,
      search
    } = req.body;

    let sub_query = getConnection()
      .createQueryBuilder()
      .select('count("manager"."id")', 'cnt')
      .addSelect('"manager"."managerId"', 'managerId')
      .from(Manager, "manager")
      .groupBy('"manager"."managerId"')
    

    let query = getRepository(User)
      .createQueryBuilder("user")
      .addSelect('case  \
      when t_r.cnt is NULL \
      then 0 \
      else t_r.cnt \
      end', 'user_requester_cnt')
    
    /* if (global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
        query = query.leftJoinAndSelect(User, "A", '"user"."parent_id" = "A"."id"');
    } */

    query = query.leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"t_r"."managerId" = "user"."id"')

    if (global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
      query = query.leftJoinAndSelect("user.parent", "parent");
    }

    query = query.leftJoinAndSelect("user.managers", "manager");

    query = query.where("1=1")
    query = query.andWhere('"user"."is_delete" = \'N\'')
    if (global.ROLE[req.decodedUser.user_type - 1] == 'company') {
      query = query.andWhere("user.parent_id = :parent_id", {parent_id: req.decodedUser.id});
    }
    {
        query = query.andWhere("user.user_type = :user_type", {user_type: (global.ROLE.indexOf("manager") + 1)});
    }
    if (isNotEmpty(search)) {
      //검색어
      if (isNotEmpty(search.search_keyword)) {
        let field_name = '';
        switch (search.keyword_type) {
          case 1:
            field_name = "user.user_name"
            break;
          case 2:
            field_name = "user.login_id"       
            break;
          case 3:
            field_name = "user.phone_number"   
            break;
          case 4:
            field_name = "user.user_email"
            break;
        }

        if (search.search_type == 1)
          query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
        else
          query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
      }
     //고객사 검색
      if (global.ROLE[req.decodedUser.user_type - 1] === 'admin' && isNotEmpty(search.company_ids) && isArray(search.company_ids) && search.company_ids.length > 0) {
          let company_id_query = 'user.parent_id = :company_id1', filter = {};
          filter = {
            ...filter,
            'company_id1': search.company_ids[0]
          }
          for( let i = 1; i < search.company_ids.length; i ++ ) {
              company_id_query += ' or user.parent_id = :company_id' + (i + 1);
              let key = `company_id${i+1}`
              filter = {
                  ...filter,
                  [key]: search.company_ids[i]
              }
          }
          query = query.andWhere(new Brackets(qb => {
              qb.where(company_id_query, filter)
          }));
      }
      //요청자 검색
      if (isNotEmpty(search.requester_ids) && isArray(search.requester_ids) && search.requester_ids.length > 0) {
        let requester_id_query = '"manager"."requesterId" = :requester_id1', filter = {};
        filter = {
          ...filter,
          'requester_id1': search.requester_ids[0]
        }
        for( let i = 1; i < search.requester_ids.length; i ++ ) {
            requester_id_query += ' or "manager"."requesterId" = :requester_id' + (i + 1);
            let key = `requester_id${i+1}`
            filter = {
                ...filter,
                [key]: search.requester_ids[i]
            }
        }
        query = query.andWhere(new Brackets(qb => {
            qb.where(requester_id_query, filter)
        }));
      }
      if (isNotEmpty(search.manage_cnt_start) && (isNumber(search.manage_cnt_start) || isNumberString(search.manage_cnt_start)))
        query = query.andWhere('case  \
        when t_r.cnt is NULL \
        then 0 \
        else t_r.cnt \
        end >= ' + search.manage_cnt_start);
      if (isNotEmpty(search.manage_cnt_end) && (isNumber(search.manage_cnt_end) || isNumberString(search.manage_cnt_end)))
        query = query.andWhere('case  \
        when t_r.cnt is NULL \
        then 0 \
        else t_r.cnt \
        end <= ' + search.manage_cnt_end);
    }
    query = query.orderBy('user.create_date', "DESC"); 

    let totals = await query.getCount()

    if (!(table === null || table === undefined)) {
      query.skip((table.page - 1) * table.page_length)
            .take(table.page_length);
    }

    let result = await query.getMany();
    let table_data: Array<any>;
    table_data = [];

    result.forEach(function (item) {
      let table_item: { [k: string]: any } = {};
      table_item = {
        id: item.id,
        user_id: item.login_id,
        user_name: item.user_name,
        phone_number: (isEmpty(item.phone_number) ? '' : (item.country_code + ' ' + item.phone_number)),
        email: item.user_email,
        manage_cnt: item.requester_cnt,
        reg_date: item.create_date
      }
      if (global.ROLE[req.decodedUser.user_type - 1] === 'admin') {
        table_item.company_name = item.parent.company_name;
        table_item.company_id = item.parent.login_id;
      }
      table_data.push(table_item);

    });
    return res.json({ errorCode: 0, errorMsg: '', data: {list: table_data, totalCount: totals} });
  }
  static registerManager = async (req: Request, res: Response) => {
    const {
      user_id,
      user_pwd,
      user_name,
      country_code,
      phone_number,
      email,
      system_lang,
      sms_notice_check,
      email_notice_check,
      memo,
      id,
      password_gen
    } = req.body;

    if (isEmpty(id)) {
      if((isEmpty(password_gen) || password_gen == 'N') && isEmpty(user_pwd))
          return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
    }
    //end validation
    try {
      const userRepository = getRepository(User); 
      let user, _company;
      if(isEmpty(id))
        user = new User();
      else {
        let query = getRepository(User)
          .createQueryBuilder("user")
          .leftJoinAndSelect("user.managers", "manager")
          .leftJoinAndSelect("manager.requester", "requester")
          .where('"user"."id" = :id', { id: id });
        user = await query.getOne();
        if (user == undefined)
          return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
      }

      if( req.file ) {
        if(!isEmpty(user.avatar))
            fs.unlinkSync(config.LOCATION_PATH + '/'  + user.avatar)
        user.avatar = req.file.filename;
      }

      const company_id = (global.ROLE[req.decodedUser.user_type - 1] == 'admin') ? req.body.company_id : req.decodedUser.id;            
      _company = await userRepository.findOne(company_id)
      if(_company == undefined)
        return res.json({ errorCode: 15, errorMsg: 'invalid company id.' })
      
      if (isEmpty(id)) {
        user.create_date = Math.floor(Date.now() / 1000);
        user.player_id = generateRandomString(24);
        user.requesters = [];
        user.managers = [];
        user.requester_cnt = 0
      } 
      user.update_date = Math.floor(Date.now() / 1000);
      user.user_type = global.ROLE.indexOf("manager") + 1;
      user.login_id = user_id;

      let gen_pwd = '';

      if (isEmpty(id)) {
        if (isEmpty(password_gen) || password_gen == 'N')
        {
            user.password = user_pwd;
            user.hashPassword();
        }
        else {
            gen_pwd = generateRandomString(12);
            user.password = gen_pwd;
            user.hashPassword();
        }
      }      
      else {
        if(!isEmpty(user_pwd)) {
          user.password = user_pwd;
          user.hashPassword();
        }
      }

      user.user_name = user_name;
      
      if (isNotEmpty(email))
        user.user_email = email;  
      
      if(isNotEmpty(country_code))
        user.country_code = country_code; 
      if(isNotEmpty(phone_number))
        user.phone_number = phone_number;   
      user.system_lang = system_lang;
      user.parent_id = company_id;
      user.parent = _company;
      user.is_sms_notice_on = sms_notice_check;
      user.is_email_notice_on = email_notice_check;
      if (isDefined(memo)) {
        if( global.ROLE[req.decodedUser.user_type - 1] == 'admin' )
          user.admin_memo = memo;
        else
          user.company_memo = memo;  
      }
      //관리 대상 요청자
      if (isEmpty(req.body.requesters)) 
        req.body.requesters = []
      if (req.body.requesters != undefined && isArray(req.body.requesters)) {
        let manager_requester_ids = [], add_manager_requester_ids = []
        let removed_cnt = 0
        for (let i = 0; i < user.managers.length; i++)  {
          manager_requester_ids.push(user.managers[i].requester.id)
          if (req.body.requesters.indexOf(user.managers[i].requester.id) < 0) {
            removed_cnt ++
            await getConnection()
              .createQueryBuilder()
              .delete()
              .from(Manager)
              .where('"manager"."managerId" = :manager_id and "manager"."requesterId" = :requester_id', {
                manager_id: id, requester_id: user.managers[i].requester.id
              })
              .execute();
          }
        }
        for (let i = 0; i < req.body.requesters.length; i++) {
          if (manager_requester_ids.indexOf(req.body.requesters[i]) < 0)
            add_manager_requester_ids.push(req.body.requesters[i]);
        }
        for (let i = 0; i < add_manager_requester_ids.length; i++) {
          const _manager = new Manager();
          let _requester = await userRepository.findOneOrFail(add_manager_requester_ids[i])
          _manager.create_date = Math.floor(Date.now() / 1000);
          _manager.update_date = Math.floor(Date.now() / 1000);
          _manager.requester = _requester;
          await getConnection().manager.save(_manager);   
          user.managers.push(_manager)
        }
        user.requester_cnt = user.requester_cnt - removed_cnt + add_manager_requester_ids.length
      }
      await getConnection().manager.save(user);
      if (isEmpty(id) && !isEmpty(password_gen) && password_gen == 'Y' && !isEmpty(email)) {
        let template_obj: { [k: string]: any } = {};
        template_obj.site_url = config.SITE_URL;
        template_obj.domain = _company.login_id;
        template_obj.userid = user_id;
        template_obj.password = gen_pwd;
        sendEmail(email, system_lang, lang[user.system_lang]['email']['client_a05'], 'client_a05', template_obj); 
      }
      return res.json({ errorCode: 0, errorMsg: '' });
    }
    catch (error) {
      console.log(error)
      return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
    }
  }
}
export default ManagerController;
import { RequestDetailWorker } from './request-detail-worker';
import { Log } from './log';
import { TransRequest } from './trans-request';
import { Comment } from './comment';
import { Inquiry } from './inquiry';
import { WorkingLanguage } from './working-language';
import { ScreenTimeLimit } from './screen-time-limit';
import { UserTag } from './user-tag';
import { UsersWorkingLanguage } from './users-working-language';
import { UsersTranslatePair } from './users-translate-pair';
import { WorkerAssignSetting } from './worker-assign-setting';
import { CompanyService } from './company-service';
import { EndTimeSetting } from './end-time-setting';
import { CompanyPrice } from './company-price';
import {Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne/*, JoinTable, CreateDateColumn, UpdateDateColumn*/ } from "typeorm";
import * as bcrypt from "bcryptjs";
import {Trigger , SystemLang , CurrencyType} from './entity-enum';
import { Notice } from './notice';
import { NoticeUser } from './notice-user';
import { Manager } from './manager';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column({ nullable: true })
    access_token_issued_date: number;

    @Column()
    login_id: string;

    @Column()
    password: string;

    //아바타
    @Column({ nullable: true })
    avatar: string;
    /*
    사용자 유형
    1: 관리자 2: 고객사 3: 요청자
    4: TC 5: 번역 6: 검수
    */
    @Column()
    user_type: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_delete: Trigger;

    //고객사 관련 
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    use_terms : Trigger;

    //요청자 관련 
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    agreed: Trigger;
    
    /**
     * 고객사 - TC작업 여부
     */
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    has_tc_service: Trigger;
    /*
    요청자 -  이름 고객사 - 담당자명 TC작업자 - 이름
    번역가 - 이름 검수자 - 이름 관리자 -  이름
    */
    @Column()
    user_name: string;

    //이메일
    @Column({ nullable: true })
    user_email: string;

    @Column({ nullable: true })
    country_code: string;

    @Column({ nullable: true })
    phone_number: string;

    //시스템언어
    @Column({
        type: "enum",
        enum: SystemLang,
        default: SystemLang.KOREAN
    })
    system_lang: SystemLang

    //알림톡/SMS 알림
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_sms_notice_on: Trigger;

    //이메일  알림
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_email_notice_on: Trigger;

    //회사명
    @Column({ nullable: true })
    company_name: string;

    //회사로고
    @Column({ nullable: true })
    company_logo: string;

    //관리자용 메모
    @Column({ nullable: true })
    admin_memo: string;

    //요청자 - 기타항목
    @Column({ nullable: true })
    extra: string;
    //요청시 , 카드결제여부 선택
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_card_payment: Trigger;

    //youtube 연동
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_youtube_connected: Trigger;

    @Column({ nullable: true })
    access_token: string;

    @Column({ nullable: true })
    refresh_token: string;

    @Column({ nullable: true })
    youtube_name: string;

    @Column({ nullable: true })
    youtube_email: string;
    
    //보정률
    @Column({ nullable: true, default: 0, type: "float4" })
    correction_rate: number;

    //동시 작업 가능 수량
    @Column({ nullable: true, default: 0 })
    can_work: number;

    //요청자인경우 고객사 아이디
    @Column({ nullable: true, default: 0 })
    parent_id: number;

    //분당 번역금액에서 할인 됩니다.  ->관리자가 설정가능
    @Column({ nullable: true, type: "float4" })
    discount: number;

    //무료 요청 가능횟수 -> 관리자가 설정가능
    @Column({ nullable: true, default: 0 })
    free_req_cnt: number;

    //고객사 메모
    @Column({ nullable: true })
    company_memo: string;

    //자막 번역 여부 (고객사 관련)
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.ON
    })
    is_screen_translation: Trigger;

    //결제기준 화페
    @Column({
        type: "enum",
        enum: CurrencyType,
        default: CurrencyType.JPY
    })
    currency_type: CurrencyType;

    //제목/설명 번역 비용
    @Column({ nullable: true, default: 0, type: "float4" })
    title_cost: number;

    //할증
    @Column({ nullable: true, default: 0, type: "float4" })
    premium_rate: number;

    //총 작업수 (계정의 누적 총 작업수 표시)
    @Column({ nullable: true, default: 0 })
    total_work_numbers: number;

    //총 작업금액 (계정의 누적 총 작업금액 표시)
    @Column({ nullable: true, default: 0, type: "float4" })
    total_work_price: number;

    //기준금액 일괄적용 여부
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.ON
    })
    is_base_price_set: Trigger;

    //총 요청수
    @Column({ nullable: true, default: 0 })
    total_request_numbers: number;

    //총 번역금액
    @Column({ nullable: true, default: 0 })
    total_translate_price: number;

    //
    @OneToOne(_type => ScreenTimeLimit, {eager: true})
    @JoinColumn()
    screen_time_limit: ScreenTimeLimit;

    //
    /*
    @OneToOne(_type => WorkingLanguage, {eager: true})
    @JoinColumn()
    requester_working_language: WorkingLanguage | null;
    */

    @ManyToOne(_type => WorkingLanguage, requester_working_language => requester_working_language.users, {eager: true})
    requester_working_language: WorkingLanguage | null


    @OneToMany(_type => User, user => user.parent)
    childs: User[];

    @ManyToOne(_type => User, parent => parent.childs)
    parent: User;


    @OneToMany(_type => CompanyPrice, price => price.user, {eager: true})
    prices: CompanyPrice[];

    @OneToMany(_type => UserTag, tag => tag.user, {
        eager: true
    })
    tags: UserTag[];

    @OneToMany(_type => EndTimeSetting, end_time_setting => end_time_setting.user, {eager: true})
    end_time_settings: EndTimeSetting[];

    @OneToMany(_type => CompanyService, service => service.user, {eager: true})
    services: CompanyService[];

    @OneToMany(_type => WorkerAssignSetting, assign => assign.user, {eager: true})
    assigns: WorkerAssignSetting[];

    @OneToMany(_type => UsersTranslatePair, language_pair => language_pair.user, {
        eager: true
    })
    language_pairs: UsersTranslatePair[];

    @OneToMany(_type => UsersWorkingLanguage, working_language => working_language.user, {
        eager: true
    })
    working_languages: UsersWorkingLanguage[];

    @OneToMany(_type => Inquiry, inquiry => inquiry.user)
    inquiries: Inquiry[];

    @OneToMany(_type => Comment, comment => comment.user)
    comments: Comment[];

    //자막번역
    @OneToMany(_type => TransRequest, trans_request => trans_request.user)
    trans_requests: TransRequest[];

    //TC작업자 아이디
    @OneToMany(_type => TransRequest, tc_trans_request => tc_trans_request.tc_user)
    tc_trans_requests: TransRequest[];

    @OneToMany(_type => Log, log => log.user)
    logs: Log[];

    @OneToMany(_type => Notice, notice => notice.user)
    notices: Notice[];

    @OneToMany(_type => NoticeUser, notice_user => notice_user.user)
    notice_users: NoticeUser[];

    @OneToMany(_type => RequestDetailWorker, request_detail_worker => request_detail_worker.user)
    request_detail_workers: RequestDetailWorker[];

    @OneToMany(_type => Manager, manager=>manager.manager)
    managers: Manager[];    

    @OneToMany(_type => Manager, requester=>requester.requester)
    requesters: Manager[];    
    //OneSignal Playerid
    @Column({ nullable: true })
    player_id: string;

    @Column({ nullable: true, default: 0 })
    requester_cnt: number;

    hashPassword() {
        this.password = bcrypt.hashSync(this.password);
    }

    checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
        return bcrypt.compareSync(unencryptedPassword, this.password);
    }
}

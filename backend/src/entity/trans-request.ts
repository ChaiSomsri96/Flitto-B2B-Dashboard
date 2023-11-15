import { User } from './user';
import { Log } from './log';
import { Notice } from './notice';
import { RequestDetail } from './request-detail';
import { WorkingLanguage } from './working-language';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import {Trigger , CurrencyType} from './entity-enum';
@Entity()
export class TransRequest {
    @PrimaryGeneratedColumn()
    id: number;

    //자막번역 요청일자
    @Column()
    create_date: number;

    //
    @Column()
    update_date: number;

    //유투브 url
    @Column()
    youtube_url: string;

    //재생시간
    @Column({ nullable: true, default: 0 })
    duration: number;

    //재생시간 (분)
    @Column({ nullable: true, default: 0 })
    duration_minute: number;

    //유투브 아이디
    @Column()
    youtube_id: string;

    //유투브 제목
    @Column({ nullable: true })
    title: string;

    //유투브 설명
    @Column({ nullable: true })
    description: string;

    //원본 동영상 업로드 여부
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    has_original_video: Trigger;

    //번역가에게 메모
    @Column({ nullable: true })
    memo: string;
    //요청자 메모
    @Column({ nullable: true })
    requester_memo: string;

    //원본 동영상 링크
    @Column({ nullable: true })
    original_video: string;

    //원본 동영상 파일이름
    @Column({ nullable: true })
    original_video_show_name: string;

    //카드 결제
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_card_payment: Trigger;

    //24시간 긴급 요청
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_urgent: Trigger;

    //youtube 자막적용
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_youtube_request: Trigger;

    //제목 설명 번역 요청 여부
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_title_desc: Trigger;

    //원어민 검수 여부
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_native_review: Trigger;

    //자막요청 예상 완료 일시
    @Column({ nullable: true })
    predict_end_date: number;

    //완료 일자
    @Column({ nullable: true })
    end_date: number;

    //진행상태
    @Column()
    status: number;

    //작업 금액
    @Column({ nullable: true, default: 0, type: "float4" })
    work_price: number;

    //화페형태
    @Column({
        type: "enum",
        enum: CurrencyType,
        default: CurrencyType.JPY
    })
    currency_type: CurrencyType;

    @ManyToOne(_type => WorkingLanguage, original_language => original_language.request_o_languages, {eager: true})
    original_language: WorkingLanguage;

    @OneToMany(_type => RequestDetail, detail => detail.request, {eager: true})
    details: RequestDetail[];

    @OneToMany(_type => Log, log => log.trans_request, {eager: true})
    logs: Log[];    

    @OneToMany(_type => Notice, notice => notice.trans_request, {eager: true})
    notices: Notice[];    

    //요청자 아이디
    @ManyToOne(_type => User, user => user.trans_requests, {eager: true})
    user: User;

    //전체 작업 완료 (전체작업 완료 - > 필터시 이용 , 고객사 + 요청자 자막번역 목록)
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_end: Trigger;

    //TC작업자 아이디, TC비디오, TC 완료일자, TC 예정일자 , 요청일자 , 변경일자, 완료, 가격
    @Column({ nullable: true })
    tc_video: string;
    @Column({ nullable: true })
    tc_create_date: number;
    @Column({ nullable: true })
    tc_update_date: number;
    @Column({ nullable: true })
    tc_end_date: number;
    @Column({ nullable: true })
    tc_predict_end_date: number;
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    tc_is_end: Trigger;
    //TC작업자 아이디
    @ManyToOne(_type => User, tc_user => tc_user.tc_trans_requests, {eager: true})
    tc_user: User;

    @Column({ nullable: true, default: 0, type: "float4" })
    tc_work_price: number;

    @Column({ nullable: true, default: 1 })
    tc_status: number;

    @Column({ nullable: true, default: 0, type: "float4" })
    temp_price: number;

    //admin설정관련
    @Column({ nullable: true, default: 0 })
    tc_predict_time_value: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    tc_predict_time_set: Trigger;

    @Column({ nullable: true, default: 0, type: "float4" })
    tc_price_value: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    tc_price_set: Trigger;
}
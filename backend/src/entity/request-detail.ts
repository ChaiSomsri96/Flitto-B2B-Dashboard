import { RequestDetailWorker } from './request-detail-worker';
import { Log } from './log';
import { Notice } from './notice';
import { TransRequest } from './trans-request';
import { WorkingLanguage } from './working-language';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import {Trigger} from './entity-enum';
@Entity()
export class RequestDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column({ nullable: true })
    status: number;

    @Column({ nullable: true })
    end_date: number;

    //번역금액
    @Column({ nullable: true, default: 0, type: "float4" })
    work_price: number;
    //user type - 작업금액 - 관리자 자막번역 용
    @Column({ nullable: true, default: 0, type: "float4" })
    translate_work_price: number;

    @Column({ nullable: true, default: 0, type: "float4" })
    review_work_price: number;

    @Column({ nullable: true, default: 0, type: "float4" })
    temp_price: number;
    @Column({ nullable: true, default: 0, type: "float4" })
    temp_price_translate: number;
    @Column({ nullable: true, default: 0, type: "float4" })
    temp_price_review: number;
    @Column({ nullable: true, default: 0, type: "float4" })
    temp_sum_price: number;

    @Column({ nullable: true, default: 0 })
    duration_sum: number;

    @Column({ nullable: true })
    translate_title: string;

    @Column({ nullable: true })
    translate_description: string;

    @Column({ nullable: true })
    review_title: string;

    @Column({ nullable: true })
    review_description: string;

    @Column({ nullable: true })
    translate_video: string;

    @Column({ nullable: true })
    review_video: string;

    @Column({ nullable: true, default: 1 })
    translate_status: number;

    @Column({ nullable: true, default: 1 })
    review_status: number;
    //작업 완료
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_end: Trigger;

    //
    @ManyToOne(_type => WorkingLanguage, translate_language => translate_language.request_o_languages, {eager: true})
    translate_language: WorkingLanguage;

    @ManyToOne(_type => TransRequest, request => request.details)
    request: TransRequest;

    @OneToMany(_type => Log, log => log.request, {eager: true})
    logs: Log[];

    @OneToMany(_type => Notice, notice => notice.request, {eager: true})
    notices: Notice[];

    @OneToMany(_type => RequestDetailWorker, worker => worker.request_detail, {eager: true})
    workers: RequestDetailWorker[];

    //번역가 작업자 요청일시
    @Column({ nullable: true })
    translate_req_date: number;
    //검수자 작업자 요청일시
    @Column({ nullable: true })
    review_req_date: number;

    //admin설정관련
    @Column({ nullable: true, default: 0 })
    translate_predict_time_value: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    translate_predict_time_set: Trigger;

    @Column({ nullable: true, default: 0 })
    review_predict_time_value: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    review_predict_time_set: Trigger;

    @Column({ nullable: true, default: 0, type: "float4" })
    translate_price_value: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    translate_price_set: Trigger;

    @Column({ nullable: true, default: 0, type: "float4" })
    review_price_value: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    review_price_set: Trigger;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    youtube_applying: Trigger;
}
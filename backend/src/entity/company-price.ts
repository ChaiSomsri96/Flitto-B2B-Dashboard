import { WorkingLanguage } from './working-language';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

//번역 금액 비용
@Entity()
export class CompanyPrice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //번역금액
    @Column({ nullable: true, default: 0, type: "float4" })
    work_price: number;

    //원어민 검수요청
    @Column({ nullable: true, default: 0, type: "float4" })
    native_review_price: number;

    //작업금액 (TC)
    @Column({ nullable: true, default: 0, type: "float4" })
    tc_price: number;

    //작업금액(번역)
    @Column({ nullable: true, default: 0, type: "float4" })
    trans_price: number;

    //작업금액(검수)
    @Column({ nullable: true, default: 0, type: "float4" })
    test_price: number;

    //원본 언어 선택
    @ManyToOne(_type => WorkingLanguage, original => original.company_price_o_languages, {eager: true})
    original: WorkingLanguage;


    //번역언어 선택
    @ManyToOne(_type => WorkingLanguage, translate => translate.company_price_t_languages, {eager: true})
    translate: WorkingLanguage;

    @ManyToOne(_type => User, user => user.prices)
    user: User;
}
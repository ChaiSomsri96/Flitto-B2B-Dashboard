import { TransRequest } from './trans-request';
import { RequestDetail } from './request-detail';
import { CompanyPrice } from './company-price';
import { User } from './user';
import { UsersWorkingLanguage } from './users-working-language';
import { UsersTranslatePair } from './users-translate-pair';
import {Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity()
export class WorkingLanguage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    prefix: string;

    @Column()
    order: number;

    @OneToMany(_type => TransRequest, request_o_language => request_o_language.original_language)
    request_o_languages: TransRequest[];

    @OneToMany(_type => RequestDetail, request_t_language => request_t_language.translate_language)
    request_t_languages: RequestDetail[];

    @OneToMany(_type => CompanyPrice, company_price_o_language => company_price_o_language.original)
    company_price_o_languages: CompanyPrice[];

    @OneToMany(_type => CompanyPrice, company_price_t_language => company_price_t_language.translate)
    company_price_t_languages: CompanyPrice[];

    @OneToMany(_type => UsersTranslatePair, working_o_language => working_o_language.original)
    working_o_languages: UsersTranslatePair[];

    @OneToMany(_type => UsersTranslatePair, working_t_language => working_t_language.translate)
    working_t_languages: UsersTranslatePair[];

    @OneToMany(_type => UsersWorkingLanguage, users_working_language => users_working_language.workingLanguage)
    users_working_languages: UsersWorkingLanguage[];

    @OneToMany(_type => User, user => user.requester_working_language)
    users: User[];
}
import { WorkingLanguage } from './working-language';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

//(고객사 , 번역가) - 작업language 패어
@Entity()
export class UsersTranslatePair {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //원본 언어 선택
    @ManyToOne(_type => WorkingLanguage, original => original.working_o_languages, {eager: true})
    original: WorkingLanguage;

    //번역언어 선택
    @ManyToOne(_type => WorkingLanguage, translate => translate.working_t_languages, {eager: true})
    translate: WorkingLanguage;
    //
    @ManyToOne(_type => User, user => user.language_pairs)
    user: User;
}
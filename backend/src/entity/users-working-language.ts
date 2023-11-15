import { WorkingLanguage } from './working-language';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

// TC , 검수자한정 작업언어
@Entity()
export class UsersWorkingLanguage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;
    //작업언어
    @ManyToOne(_type => WorkingLanguage, workingLanguage => workingLanguage.users_working_languages, {eager: true})
    workingLanguage: WorkingLanguage;
    //
    @ManyToOne(_type => User, user => user.working_languages)
    user: User;
}


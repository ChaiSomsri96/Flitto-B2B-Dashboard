import { Inquiry } from './inquiry';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //
    @ManyToOne(_type => Inquiry, inquiry => inquiry.comments)
    inquiry: Inquiry;

    //
    @ManyToOne(_type => User, user => user.comments, {eager: true})
    user: User;

    @Column({ nullable: true })
    comment: string;
}
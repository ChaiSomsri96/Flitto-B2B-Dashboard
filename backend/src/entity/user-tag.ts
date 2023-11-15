import { Tag } from './tag';
import { User } from './user';
import {Entity, PrimaryGeneratedColumn, ManyToOne /*, OneToOne, JoinColumn*/ } from "typeorm";

@Entity()
export class UserTag {
    @PrimaryGeneratedColumn()
    id: number;

    /* @OneToOne(_type => Tag)
    @JoinColumn()
    tag: Tag; */

    //@Column()
    //tagId: number;

    @ManyToOne(_type => User, user => user.tags)
    user: User;

    @ManyToOne(_type => Tag, tag => tag.user_tags, {eager: true})
    tag: Tag;
}
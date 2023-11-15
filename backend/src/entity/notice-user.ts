import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { User } from './user';
import { Notice } from './notice';
import { Trigger } from './entity-enum';
@Entity()
export class NoticeUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  create_date: number;

  @Column()
  update_date: number;

  @ManyToOne(_type => User, user=>user.notice_users, {eager: true})
  user: User;
  
  @ManyToOne(_type => Notice, notice => notice.notice_users, { eager: true })
  notice: Notice;

  @Column({
    type: "enum",
    enum: Trigger,
    default: Trigger.OFF
  })
  is_read: Trigger;
}
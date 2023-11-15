import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
@Entity()
export class Manager {
  @PrimaryGeneratedColumn()
  id: number;  

  @Column()
  create_date: number;

  @Column()
  update_date: number; 

  @ManyToOne(_type => User, manager => manager.managers)
  manager: User


  @ManyToOne(_type => User, requester => requester.requesters)
  requester: User
}
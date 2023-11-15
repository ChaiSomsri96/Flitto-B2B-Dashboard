import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
@Entity()
export class UserTableProperty {
  @PrimaryGeneratedColumn()
  id: number;  

  @Column()
  create_date: number;

  @Column()
  update_date: number;

  //
  @OneToOne(_type => User, {eager: true})
  @JoinColumn()
  user: User;

  /**
   * 1,2,3,4,5,6,7
   */
  @Column({ nullable: true, default: null, type: "json" })
  caption_list: string;
  /**
   * 1
   */
  @Column({ nullable: true, default: null, type: "json" })
  admin_list: string;
  /**
   * 1
   */
  @Column({ nullable: true, default: null, type: "json" })
  company_list: string;
  /**
   * 1, 2
   */
  @Column({ nullable: true, default: null, type: "json" })
  manager_list: string;
  /**
   * 1, 2
   */
  @Column({ nullable: true, default: null, type: "json" })
  requester_list: string;
  /**
   * 1
   */
  @Column({ nullable: true, default: null, type: "json" })
  worker_list: string;
  /**
   * 1,2,3,4,5,6,7
   */
  @Column({ nullable: true, default: null, type: "json" })
  billing_list: string;

  @Column({ nullable: true, default: null, type: "json" })
  billing_list1: string;

  @Column({ nullable: true, default: null, type: "json" })
  billing_list2: string;

  @Column({ nullable: true, default: null, type: "json" })
  billing_list3: string;

  @Column({ nullable: true, default: null, type: "json" })
  billing_list4: string;

  @Column({ nullable: true, default: null, type: "json" })
  billing_list5: string;
}
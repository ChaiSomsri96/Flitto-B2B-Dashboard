import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity()
export class CaptionTemp {
  @PrimaryGeneratedColumn()
  id: number;  

  @Column()
  create_date: number;

  @Column()
  update_date: number;

  @Column({ nullable: true })
  caption_data: string;
}
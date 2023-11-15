import { Period } from './../entity/period';
import {MigrationInterface, QueryRunner, getConnection} from "typeorm";
export class CreatePeriod1597342869930 implements MigrationInterface {

    public async up(_queryRunner: QueryRunner): Promise<void> {
        for(let i = 0; i < 100; i ++) {
            for(let j = 0; j < 12; j ++) {
                let _period = new Period();
                _period.create_date = Math.floor(Date.now() / 1000);
                _period.update_date = Math.floor(Date.now() / 1000);
                _period.year = 2020 + i;
                _period.month = j + 1;
                await getConnection().manager.save(_period);
            }
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
    }

}

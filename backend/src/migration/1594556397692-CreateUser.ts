import { MigrationInterface, QueryRunner, getRepository } from "typeorm";
import { User } from "../entity/user";

export class CreateUser1594556397692 implements MigrationInterface {

    public async up(_queryRunner: QueryRunner): Promise<void> {
        let user = new User();
        user.create_date = Math.floor(Date.now() / 1000)
        user.update_date = Math.floor(Date.now() / 1000)
        user.login_id = "admin"
        user.password = "1111";
        user.hashPassword();
        user.user_type = 1;
        user.user_name = '관리팀';
        user.user_email = 'admin@flitto.com';
        user.country_code = '82';
        user.phone_number = '10-7777-7777';
        user.admin_memo = 'memo';
        const userRepository = getRepository(User);
        await userRepository.save(user);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
    }

}

import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../entity/user";

class WorkerController {

    static changePassword = async (req: Request, res: Response) => {
        let resp = {
            errorCode: 0, errorMsg: ''
        }
        const { oldPassword, newPassword } = req.body;
        if(!( oldPassword && newPassword )) {
            resp.errorCode = 400; resp.errorMsg = 'Invalid Parameter';
        }
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail(req.decodedUser.id)
            if( !user.checkIfUnencryptedPasswordIsValid(oldPassword) ) {
                resp.errorCode = 1;
                resp.errorMsg = 'Old password is incorrect.';
                return res.json(resp);
            }
            user.password = newPassword
            userRepository.save(user);
            return res.json(resp);
        }
        catch(error) {
            resp.errorCode = 500; resp.errorMsg = "Internal Server Error";
            res.json(resp);
            return;
        }
    };

    static listAll = async (_req: Request, res: Response) => {
        //Get users from database
        const userRepository = getRepository(User);
        const users = await userRepository.find({
            select: ["id", "login_id", "user_type"] //We dont want to send the passwords on response
        });

        //Send the users object
        res.send(users);
    };

    static getOneById = async (req: Request, res: Response) => {
        //Get the ID from the url
        const id: number = parseInt(req.params.id);

        //Get the user from database
        const userRepository = getRepository(User);
        try {
            const user = await userRepository.findOneOrFail(id, {
            select: ["id",  "login_id", "user_type"] //We dont want to send the password on response
            });
            res.send(user);
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static newUser = async (req: Request, res: Response) => {
        //Get parameters from the body
        let { userid, password, user_type } = req.body;
        let user = new User();
        user.login_id = userid;
        user.password = password;
        user.user_type = user_type;

        //Validade if the parameters are ok
        const errors = await validate(user);
        if (errors.length > 0) {
            res.status(400).send(errors);
            return;
        }

        //Hash the password, to securely store on DB
        user.hashPassword();

        //Try to save. If fails, the username is already in use
        const userRepository = getRepository(User);
        try {
            await userRepository.save(user);
        } catch (e) {
            res.status(409).send("username already in use");
            return;
        }

        //If all ok, send 201 response
        res.status(201).send("User created");
    };

    static editUser = async (req: Request, res: Response) => {
        //Get the ID from the url
        const id = req.params.id;

        //Get values from the body
        const { userid, role } = req.body;

        //Try to find user on database
        const userRepository = getRepository(User);
        let user;

        try {
            user = await userRepository.findOneOrFail(id);
            //Validate the new values on model
            user.login_id = userid;
            user.user_type = role;
            const errors = await validate(user);
            if (errors.length > 0) {
                res.status(400).send(errors);
                return;
            }

            //Try to safe, if fails, that means username already in use
            try {
                await userRepository.save(user);
            } catch (e) {
                res.status(409).send("username already in use");
                return;
            }
            //After all send a 204 (no content, but accepted) response
            res.status(204).send();

        } catch (error) {
            //If not found, send a 404 response
            res.status(404).send("User not found");
            return;
        }
    };

    static deleteUser = async (req: Request, res: Response) => {
        //Get the ID from the url
        const id = req.params.id;

        const userRepository = getRepository(User);
        try {
            await userRepository.findOneOrFail(id);
        } catch (error) {
            res.status(404).send("User not found");
            return;
        }
        userRepository.delete(id);

        //After all send a 204 (no content, but accepted) response
        res.status(204).send();
    };
};

export default UserController;
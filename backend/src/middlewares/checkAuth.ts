import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/config";

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization)
        return res.status(401).send({ errorMsg: "Token not provided" });
    if (req.headers.authorization.toLowerCase().indexOf("bearer ") === -1)
        return res.status(401).send({ errorMsg: "Invalid token" });

    let token = req.headers.authorization.split(' ')[1], decoded;

    try {
        decoded = <any>jwt.verify(token, config.jwtSecret);
        // if everything good, save to request for use in other routes
        req.decodedUser = decoded;
        next();
        return;
    }
    catch (error)  {
        return res.status(401).send({ errorMsg: "Authentication check error" });
    }
};
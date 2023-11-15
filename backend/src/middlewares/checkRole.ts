import { Request, Response, NextFunction } from "express";
import global from "../config/global";

export const checkRole = (roles: Array<string>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userRole = global.ROLE[req.decodedUser.user_type - 1];
      if (roles.indexOf(userRole) > -1) {
          next();
          return;
      }
      else {
        return res.status(401).send({ errorMsg: "permission error" });
      }
    };
};

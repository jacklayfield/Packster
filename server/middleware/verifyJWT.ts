import { Request, Response, NextFunction } from "express";
var jwt = require("jsonwebtoken");

interface VerifyError {
  name: string;
  message: string;
  expiredAt?: number;
}

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  jwt.verify(
    req.cookies.token,
    process.env.SECRET as string,
    (err: VerifyError | null, decoded: any) => {
      if (err) return res.status(403).json({ message: "Forbidden" });
      next();
    }
  );
};

export default verifyJWT;

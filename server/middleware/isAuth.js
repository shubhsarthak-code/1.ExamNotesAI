import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    console.log("Cookies:", req.cookies);

    let { token } = req.cookies;

    console.log("Token:", token);

    if (!token) {
      return res.status(400).json({
        message: "Token is not found",
      });
    }

    let verifyToken = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = verifyToken.userId;

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: `is auth error ${error}`,
    });
  }
};

export default isAuth;

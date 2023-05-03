const User = require("../model/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const signToken = (id) => {
  return jwt.sign({ id }, "My-secure-and-protected-password", {
    expiresIn: "1hr",
  });
};
const cookieOptions = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  httpOnly: true,
};
if (process.env.NODE_ENV == "production") cookieOptions.secure = true;
module.exports = {
  login: async (req, res, next) => {
    console.log("entering admin login...........................");
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ err: "Please provide email and password!" });
      return;
    }
    const user = await User.findOne({ email: email, role: "admin" }).select(
      "+password"
    );
    if (!user) {
      res.status(400).json({ err: "There is no admin with this email" });
      return;
    }
    bcrypt.compare(password, user.password).then((status) => {
      if (!status) {
        res.status(400).json({ err: "Password is Incorrect" });
        return;
      }
      const token = signToken(user._id);
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      //  const expires = new Date(Date.now() + 10 * 1000)
      res.cookie("jwt", token, cookieOptions);
      user.password = undefined;
      console.log(
        user,
        "....................................................................................................................................................................................................................................."
      );
      res.status(200).json({
        status: "success",
        token,
        expires,
        data: user,
      });
    });
  },
  allUsers: async (req, res) => {
    const allUsers = await User.find({ role: { $ne: "admin" } });
    res.status(200).json({ data: allUsers });
  },
  blockUser: async (req, res) => {
    const id = req.query.id;
    const access = req.query.access;
    let accesses;
    if (access == 1) {
      accesses = false;
    } else {
      accesses = true;
    }
    console.log(accesses, "user access", access);
    const upUser = await User.findByIdAndUpdate(
      id,
      { $set: { access: accesses } },
      { new: true }
    );
    console.log(upUser, "blocking");
    res.status(200).json({ status: "success", data: { upUser } });
  },
  search: async (req, res) => {
    const skey = req.query.name;

    const regex = new RegExp("^" + skey + ".*", "i");
    const allUsers = await User.aggregate([{ $match: { name: regex } }]);
    res.status(200).json({ data: allUsers });
  },
  editUser: async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    const name = req.body.name;

    console.log(req.body, "edited body");

    const newUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { name: name, email: email } },
      { new: true }
    );

    res.status(200).json({ data: newUser });
  },
};

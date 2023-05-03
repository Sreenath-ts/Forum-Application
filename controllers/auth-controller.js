const User = require('../model/user-model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer');
const http = require('http');
const fetch = require('node-fetch')

// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       type: 'OAuth2',
//       user: process.env.USER,
//       pass: process.env.pass,
//       clientId: process.env.CLIENTID,
//       clientSecret:process.env.CLIENTSECRET,
//       refreshToken: '1//043QbeCCNgl7JCgYIARAAGAQSNwF-L9IrX_ylMs8XWqKZm--QD8r8YrU4Hw48YmxIIswyisucG2njMO-4hHOivl-WG0pI2sNPZ6U'
//     }
//   });
// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    service: "Outlook",
    auth: {
      user: process.env.SERVICE_EMAIL,
      pass: process.env.SERVICE_PASSWORD
    }
  });
const { promisify } = require('util');
const { findOneAndUpdate } = require('../model/user-model');
const signToken = id => {
    return jwt.sign({ id }, 'My-secure-and-protected-password', {
        expiresIn: '15m' //change
    })
}

const cookieOptions = {
    expires:
        new Date(Date.now() + 60 * 60 * 1000),
    httpOnly: true
}
if (process.env.NODE_ENV == 'production') cookieOptions.secure = true
module.exports = {
    signup: async (req, res, next) => {

        try {
            console.log(req.body, 'sign in body check')
            if (req.body.googleToken) {
//                 http.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + req.body.googleToken, res => {
//     let data = '';
//     res.on('data', chunk => {
//         data += chunk;
//     });
//     res.on('end', async () => {
//         const tokenInfo = JSON.parse(data);
//         console.log(tokenInfo);
//         if (tokenInfo.error) {
//             res.status(400).json({ err: 'Google authentication failed!' });
//             return;
//         } else {
//             // req.body.password =await  bcrypt.hash(req.body.password,10)
//             try {
//                 const newUser = await User.create({
//                     name: req.body.name,
//                     email: req.body.email,
//                     password: 'hehehehehe'
//                 }); 
//             } catch (error) {
//                 if (error.code = 11000) {
//                             res.status(400).json({
//                                 status: 'failed',
//                                 err: 'This email already exists.'
//                             })
//                             return
//                         }
//             }
           
//             const token = signToken(newUser._id);
//             const refreshToken = jwt.sign({ user: newUser._id }, 'My-secure-and-refreshed-password', { expiresIn: '7d' });

//             res.cookie('jwt', token, cookieOptions);

//             newUser.password = undefined;

//             const expires = new Date(Date.now() + 900 * 1000);
//             //  const expires = new Date(Date.now() + 10 * 1000)

//             res.status(201).json({
//                 status: 'success',
//                 token,
//                 refreshToken,
//                 expires,
//                 data: {
//                     user: newUser
//                 }
//             });
//         }
//     });
// }).on('error', error => {
//     console.error(error);
// });
                fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + req.body.googleToken, {
                    method: 'get'
                }).then((data) => {
                    return data.json()
                }).then(async (data) => {
                    console.log(data)
                    if (data.error) {
                        res.status(400).json({ err: 'Google authentication failed!' })
                        return
                    } else {
                        // req.body.password =await  bcrypt.hash(req.body.password,10)
                        const newUser = await User.create({
                            name: req.body.name,
                            email: req.body.email,
                            password: 'hehehehehe'
                        })
                        const token = signToken(newUser._id)
                        const refreshToken = jwt.sign({ user: newUser._id }, 'My-secure-and-refreshed-password', { expiresIn: '7d' });

                        res.cookie('jwt', token, cookieOptions)


                        newUser.password = undefined

                        const expires = new Date(Date.now() + 900 * 1000)
                        //  const expires = new Date(Date.now() + 10 * 1000)

                        res.status(201).json({
                            status: 'success',
                            token,
                            refreshToken,
                            expires,
                            data: {
                                user: newUser
                            }
                        })
                    }
                }).catch((e) => {
                    if (e.code = 11000) {
                        res.status(400).json({
                            status: 'failed',
                            err: 'This email already exists.'
                        })
                        return
                    }
                })
            } else {

                req.body.password = await bcrypt.hash(req.body.password, 10)
                const newUser = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                })
                const token = signToken(newUser._id)
                const refreshToken = jwt.sign({ user: newUser._id }, 'My-secure-and-refreshed-password', { expiresIn: '7d' });

                res.cookie('jwt', token, cookieOptions)


                newUser.password = undefined

                const expires = new Date(Date.now() + 900 * 1000)
                //  const expires = new Date(Date.now() + 10 * 1000)

                res.status(201).json({
                    status: 'success',
                    token,
                    refreshToken,
                    expires,
                    data:newUser
                })
            }
        } catch (e) {
            console.log(e,'signup error')
            if (e.code = 11000) {
                res.status(400).json({
                    status: 'failed',
                    err: 'This email already exists.'
                })
                return
            }
        }
    },
    login: async (req, res) => {
        console.log(req.body, 'user login..........................................................................................');
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).json({ err: 'Please provide email and password!' })
            return
        }

        const user = await User.findOne({ email: email }).select('+password')
        if (!user) {
            res.status(400).json({ err: 'There is no user with this email' })
            return
        }
        if (!user.access) {
            res.status(400).json({ err: 'This user is blocked!' })
            return
        }
        if (req.body.googleToken) {
//             http.get('http://oauth2.googleapis.com/tokeninfo?id_token=' + req.body.googleToken, (res) => {
//     let data = '';
//     res.on('data', (chunk) => {
//         data += chunk;
//     });

//     res.on('end', async () => {
//         const result = JSON.parse(data);
//         console.log(result);
//         if (result.error) {
//             res.status(400).json({ err: 'Google authentication failed!' });
//             return;
//         } else {
//             const token = signToken(user._id);
//             const refreshToken = jwt.sign({ user: user._id }, 'My-secure-and-refreshed-password', { expiresIn: '7d' });
//             const currentDate = new Date()
//             // const  expires =  new Date(currentDate.getTime() + 15 * 60000);
//             const expires = new Date(Date.now() + 900 * 1000)
//             console.log(expires, 'ex ti');
//             //  const expires = new Date(Date.now() + 10 * 1000)
//             res.cookie('jwt', token, cookieOptions)
//             user.password = undefined
//             res.status(200).json({
//                 status: 'success',
//                 token,
//                 refreshToken,
//                 expires,
//                 data: user
//             })
//         }
//     });
// }).on('error', (err) => {
//     console.log('Error: ', err.message);
// });
            fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + req.body.googleToken, {
                method: 'get'
            }).then((data) => {
                return data.json()
            }).then(async (data) => {
                console.log(data)
                if (data.error) {
                    res.status(400).json({ err: 'Google authentication failed!' })
                    return
                } else {
                    const token = signToken(user._id)
                    const refreshToken = jwt.sign({ user: user._id }, 'My-secure-and-refreshed-password', { expiresIn: '7d' });
                    const currentDate = new Date()
                    // const  expires =  new Date(currentDate.getTime() + 15 * 60000);
                    const expires = new Date(Date.now() + 900 * 1000)
                    console.log(expires, 'ex ti');
                    //  const expires = new Date(Date.now() + 10 * 1000)
                    res.cookie('jwt', token, cookieOptions)
                    user.password = undefined
                    res.status(200).json({
                        status: 'success',
                        token,
                        refreshToken,
                        expires,
                        data: user
                    })
                }
            }
            )
        } else {
            const status = await bcrypt.compare(password, user.password)
            if (!status) {
                res.status(400).json({ err: 'Password is Incorrect' })
                return
            }

            const token = signToken(user._id)
            const refreshToken = jwt.sign({ user: user._id }, 'My-secure-and-refreshed-password', { expiresIn: '7d' });
            const currentDate = new Date()

            const expires = new Date(Date.now() + 900 * 1000)

            //const expires = new Date(Date.now() + 10 * 1000)
            res.cookie('jwt', token, cookieOptions)
            user.password = undefined
            res.status(200).json({
                status: 'success',
                token,
                refreshToken,
                expires,
                data: user
            })
        }
    },
    protect: async (req, res, next) => {
        try {
            console.log(req.headers)
            let token;

            if (
                req.headers.authorization &&
                req.headers.authorization.startsWith('Bearer')
            ) {

                token = req.headers.authorization.split(' ')[1];
                console.log(token, 'mil kaye');
            } else if (req.cookies.jwt) {
                token = req.cookies.jwt
            }
            console.log(token,'protected route.................***********...................******>>>>>>>>>');
            if (!token) {
                res.status(401).json({ err: `You aren't logged in,please loggin to get access!` })
                return
            }
            const decode = await promisify(jwt.verify)(token, 'My-secure-and-protected-password');
            console.log(decode, 'decode');
            const freshUser = await User.findById(decode.id)
            console.log(freshUser,'freshUser')
            if (!freshUser) {
                res.status(401).json({ err: 'The user belonging to this token does no longer exist!' })
                return
            }
            req.user = freshUser
            next()
        } catch (e) {
            console.log(e,'error1')
            if (e.name === 'JsonWebTokenError') {
                res.status(401).json({ err: 'Invalid Token Plese Login Again!' })
                return
            }
            if (e.name === 'TokenExpiredError') {
                res.status(401).json({ err: 'Your Token Has Expired , Plese Login Again!' })
                return
            }
        }
    },
    logout: (req, res) => {
        res.cookies('jwt', 'loggedout', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        })
        res.status(200).json({ status: 'success' })
    },
    tokenVerify: (req, res) => {
        try {
            let refreshToken;
            if (
                req.headers.authorization &&
                req.headers.authorization.startsWith('Bearer')
            ) {
              
                refreshToken = req.headers.authorization.split(' ')[1];
               
            }
            if (!refreshToken) {
                res.status(401).json({ err: `You aren't logged in,please loggin to get access!` })
                return
            }
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, 'My-secure-and-refreshed-password');
            const id = decoded.user;
            console.log(id, 'userid')
            // Create new JWT
            const token = jwt.sign({ id }, 'My-secure-and-protected-password', { expiresIn: '15m' });

            // Return new token
            res.json({ token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
    // recaptcha: (req, res, next) => {
    //     let data;
    //     if (Object.keys(req.query).length > 0) {
    //       data = req.query;
    //     } else {
    //       data = req.body;
    //     }
      
    //     const postData = `secret=${'6LeY3uskAAAAAPSya30jbULZKchVYooMHzMkXh1F'}&response=${data.captchaToken}`;
      
    //     const options = {
    //       hostname: 'www.google.com',
    //       port: 80,
    //       path: '/recaptcha/api/siteverify',
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //         'Content-Length': postData.length
    //       }
    //     };
      
    //     const request = http.request(options, (response) => {
    //       let data = '';
    //       response.on('data', (chunk) => {
    //         data += chunk;
    //       });
    //       response.on('end', () => {
    //         console.log(data,'dataatatatatatatatatattttttttttttttttttttttttttttttttttttttttt')
    //         const result =data.json()
    //         console.log(result, 'recaptchaaaaaaaaaaaaaaaaaaaaa')
    //         if (result.success == true) {
    //           return next()
    //         }
    //         res.status(400).json({ err: 'Seems you are not a human!' })
    //         console.log(result);
    //       });
    //     });
      
    //     request.on('error', (error) => {
    //       console.error(error);
    //     });
      
    //     request.write(postData);
    //     request.end();
    //   },
    recaptcha: (req, res, next) => {
        let data;
        if (Object.keys(req.query).length > 0) {
            data = req.query;
        } else {
            data = req.body;
        }
        let _data = {
            secret: '6LeY3uskAAAAAPSya30jbULZKchVYooMHzMkXh1F',
            response: { 'missing-input-secret': data.captchaToken }
        }
        fetch('https://www.google.com/recaptcha/api/siteverify',
            {
                method: "POST",
                body: `secret=${'6LeY3uskAAAAAPSya30jbULZKchVYooMHzMkXh1F'}&response=${data.captchaToken}`,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        )
            .then((data) => {

                return data.json()
            })
            .then((data) => {
                console.log(data, 'recaptchaaaaaaaaaaaaaaaaaaaaa')
                if (data.success == true) {
                    return next()
                }
                res.status(400).json({ err: 'Seems you are not a human!' })
                console.log(data);
            })
    },
    verifyEmail: async (req, res) => {
         try{
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 4; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }

        // User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }).then(users => {
//     if (!users) {
//       return next(new AppError("Token Generated Didn't match", 404))
//     }


        const id = req.user._id

        const user = await User.findOne({ _id: id })

        if (!user) {
            return res.status(401).json({ err: 'There is no user with this email!' })
        }

        if (user.validated) {
            return res.status(401).json({ err: 'You  already validated your mail.' })
        }
        user.resetToken = OTP
        const exTime = new Date()
        exTime.setMinutes(exTime.getMinutes() + 1.5);
        user.resetTokenExpiration = exTime
        user.save()

        let mailOptions = {
            from: 'codeboxservice@outlook.com',
            to: user.email,
            subject: 'Email verification !!!!!',
            html: `
            <p>Your Verification Code :- ${OTP}</p>
          `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.status(401).json({ err: `Internal Server error` })
                console.log(error);
            } else {
               
                console.log('Email sent: ' + info.response);
                res.status(200).json({status:true})
            }
        });
       
    }catch(e){
        console.log(e,'error2')
    }
},
OtpCheck:async(req,res)=>{
const code = req.body.code
const id = req.user._id
console.log(req.body)
const user = await User.findOne({_id:id,resetToken:code,resetTokenExpiration: { $gt: Date.now() }})
console.log(user)

if(!user || user==null){
  return  res.status(401).json({ err: `Otp Verification failed` })
}

const updatedUser = await User.findOneAndUpdate({_id:id},{$set:{validated:true},$unset:{resetToken:'',resetTokenExpiration:''}},{new:true})

res.status(200).json({status:true})
},
checkUser:async(req,res,next)=>{
    try {
        console.log(req.headers)
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {

            token = req.headers.authorization.split(' ')[1];
            console.log(token, 'mil kaye');
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt
        }
        console.log(token,'protected route.................***********...................******>>>>>>>>>');
      let  freshUser
       if(token){
        const decode = await promisify(jwt.verify)(token, 'My-secure-and-protected-password');
        console.log(decode, 'decode');
         freshUser = await User.findById(decode.id)
        console.log(freshUser,'freshUser')
       }
        
        req.user = freshUser
        next()
    } catch (e) {
        console.log(e,'error1')
        if (e.name === 'JsonWebTokenError') {
            res.status(401).json({ err: 'Invalid Token Plese Login Again!' })
            return
        }
        if (e.name === 'TokenExpiredError') {
            res.status(401).json({ err: 'Your Token Has Expired , Plese Login Again!' })
            return
        }
    }
}
}








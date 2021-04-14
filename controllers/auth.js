const User = require('../models/user')
const Blog = require('../models/blog')
const shortId = require('shortid')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const _ = require('lodash')
const nodemailer = require("nodemailer");
const { errorHandler } = require('../helpers/dbErrorHandler')
const { OAuth2Client } = require('google-auth-library')
const shortid = require('shortid')

//Nodemailer Email
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "prajapatimahin@gmail.com",
        pass: "mahin161997",
    },
});

exports.preSignup = (req, res) => {
    const { name, email, password } = req.body
    User.findOne({ email: email.toLowerCase() }, (err, user) => {
        if (user) {
            return res.status(400).json({
                error: 'Email is taken'
            })
        }
        const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '1d' })
        const data = {
            from: "prajapatimahin@gmail.com",
            to: email,
            subject: "Account activation Link",
            html: `
            <p>Please use the following link to activate your account:</p>
            <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://seoblog.com</p>
        `,
        };
        transporter.sendMail(data).then(sent => {
            return res.json({
                message: `Email has been sent to ${email}. Follow the instruction to activate your account`
            });
        }).catch(err => console.log(err))
    })
}

// exports.signup = (req, res) => {
//     User.findOne({ email: req.body.email }).exec((err, user) => {
//         if (user) {
//             return res.status(400).json({
//                 error: 'Email is taken'
//             })
//         }
//         const { name, email, password } = req.body
//         let username = shortId.generate()
//         let profile = `${process.env.CLIENT_URL}/profile/${username}`

//         let newUser = new User({ name, email, password, profile, username })
//         newUser.save((err, success) => {
//             if (err) {
//                 return res.status(400).json({
//                     error: err
//                 })
//             }
//             res.json({
//                 message: 'Signup success! Please signin'
//             })
//         })
//     })
// }

exports.signup = (req, res) => {
    const token = req.body.token;
    if (token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Signup again'
                });
            }

            const { name, email, password } = jwt.decode(token);

            let username = shortId.generate();
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;

            const user = new User({ name, email, password, profile, username });
            user.save((err, user) => {
                if (err) {
                    return res.status(401).json({
                        error: errorHandler(err)
                    });
                }
                return res.json({
                    message: 'Singup success! Please signin'
                });
            });
        });
    } else {
        return res.json({
            message: 'Something went wrong. Try again'
        });
    }
};


exports.signin = (req, res) => {
    const { email, password } = req.body

    User.findOne({ email }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            })
        }

        if (!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email and password do not match'
            })
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '365d' })

        res.cookie('token', token, { expiresIn: '365d' })
        const { _id, username, name, email, role } = user
        return res.json({
            token,
            user: { _id, username, name, email, role }
        })
    })
}

exports.signout = (req, res) => {
    res.clearCookie('token')
    res.json({
        message: 'Signout success'
    })
}

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256']
})

exports.authMiddleware = (req, res, next) => {
    const authUserId = req.user._id
    User.findById({ _id: authUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: "User not found"
            })
        }
        req.profile = user
        next()
    })
}

exports.adminMiddleware = (req, res, next) => {
    const adminUserId = req.user._id
    User.findById({ _id: adminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: "User not found"
            })
        }

        if (user.role !== 1) {
            return res.status(400).json({
                error: "Admin resource. Access denied"
            })
        }

        req.profile = user
        next()
    })
}

exports.canUpdateDeleteBlog = (req, res, next) => {
    const slug = req.params.slug.toLowerCase()
    Blog.findOne({ slug }).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            })
        }
        let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString()
        if (!authorizedUser) {
            return res.status(400).json({
                error: "You are not authorized"
            })
        }
        next()
    })
}

exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    User.findOne({ email }, (err, user) => {
        // console.log('USERS',user)
        if (err || !user) {
            return res.status(400).json({
                error: "User email does not exists",
            });
        }

        let token = jwt.sign(
            { _id: user._id },
            process.env.JWT_RESET_PASSWORD
        );
        const data = {
            from: "prajapatimahin@gmail.com",
            to: email,
            subject: "Password Reset Link",
            html: `
            <p>Please use the following link to reset your password:</p>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://seoblog.com</p>
        `,
        };
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.status(400).json({
                    error: "Reset Password Link Error",
                });
            } else {
                transporter.sendMail(data, (err, body) => {
                    // console.log(data)
                    if (err) {
                        return res.json({
                            error: err.message,
                        });
                    }
                    return res.json({
                        message:
                            "Email has been sent, kindly Follow the instruction",
                    });
                });
            }
        });
    });
}

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    error: 'Expired Link. Try again'
                })
            }
            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(400).json({
                        error: 'Something went wrong. Try later'
                    })
                }
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                }
                user = _.extend(user, updatedFields)
                user.save((err, result) => {
                    if (err) {
                        return res.json({ error: errorHandler(err) });
                    }
                    res.json({
                        message: 'Great! Now you are login with your new password'
                    })
                })
            })
        })
    }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
exports.googleLogin = (req, res) => {
    const idToken = req.body.tokenId
    client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }).then(response => {
        const { email_verified, name, email, jti } = response.payload
        if (email_verified) {
            User.findOne({ email }).exec((err, user) => {
                if (user) {
                    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
                    res.cookie('token', token, { expiresIn: '1d' })
                    const { _id, email, name, role, username } = user
                    return res.json({ token, user: { _id, email, name, role, username } })
                } else {
                    let username = shortid.generate()
                    let profile = `${process.env.CLIENT_URL}/profile/${username}`
                    let password = jti
                    user = new User({ name, email, profile, username, password })
                    user.save((err, data) => {
                        if (err) {
                            return res.status(400).json({
                                error: errorHandler(err)
                            })
                        }
                        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
                        res.cookie('token', token, { expiresIn: '1d' })
                        const { _id, email, name, role, username } = user
                        return res.json({ token, user: { _id, email, name, role, username } })
                    })
                }
            })
        } else {
            return res.status(400).json({
                error: 'Google login failed. Try again'
            })
        }
    })
}
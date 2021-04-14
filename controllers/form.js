const nodemailer = require('nodemailer')


//Nodemailer Email
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "prajapatimahin@gmail.com",
        pass: "mahin161997",
    },
});

exports.contactForm = (req, res) => {
    const { name, email, message } = req.body;
    // console.log(req.body);

    const emailData = {
        from: "prajapatimahin@gmail.com",
        to: email,
        subject: `Contact form - ${process.env.APP_NAME}`,
        text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
        html: `
            <h4>Email received from contact form:</h4>
            <p>Sender name: ${name}</p>
            <p>Sender email: ${email}</p>
            <p>Sender message: ${message}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://seoblog.com</p>
        `
    };

    transporter.sendMail(emailData).then(sent => {
        return res.json({
            success: true
        });
    }).catch(err => console.log(err))
}

exports.contactBlogAuthorForm = (req, res) => {
    const { authorEmail, email, name, message } = req.body;
    // console.log(req.body);

    let maillist = [authorEmail, email];

    const emailData = {
        to: maillist,
        from: "prajapatimahin@gmail.com",
        subject: `Someone messaged you from ${process.env.APP_NAME}`,
        text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
        html: `
            <h4>Message received from:</h4>
            <p>name: ${name}</p>
            <p>Email: ${email}</p>
            <p>Message: ${message}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://seoblog.com</p>
        `
    };

    transporter.sendMail(emailData).then(sent => {
        return res.json({
            success: true
        });
    }).catch(err => console.log(err))
};
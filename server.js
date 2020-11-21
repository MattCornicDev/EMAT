const express = require('express');
const app = express();
// const dotenv = require('dotenv').config();

const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const randToken = require('rand-token');
const nodemailer = require("nodemailer");

const https = require('https');

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// stripe pour les paiements en ligne
const Publishable_Key = process.env.Publishable_Key;
const Secret_Key = process.env.Secret_Key;
const stripe = require('stripe')(Secret_Key);

// MODELS
// const User = require("./models/user");
const Client = require("./models/client");
const Reset  = require("./models/reset");

mongoose.set('useFindAndModify', false);

//session
app.use(session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false
}));
// passport 
app.use(passport.initialize());
app.use(passport.session());
//mongodb+srv://Certificats_immatriculations:rarib@cluster0.9gpmm.mongodb.net/client?retryWrites=true&w=majority
mongoose.connect('mongodb+srv://Certificats_immatriculations:rarib@cluster0.9gpmm.mongodb.net/Immat?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
});
// passport local mongoose
passport.use(Client.createStrategy());
passport.serializeUser(Client.serializeUser());
passport.deserializeUser(Client.deserializeUser());



// mongoose.connect('mongodb+srv://WebImmat:abdel@cluster0.9gpmm.mongodb.net/visiteur?retryWrites=true&w=majority',{
//     userNewUrlParser : true,
//     useUnifiedTopology: true
// });

// EJS
app.set('view engine', 'ejs');

// PUBLIC FOLDER
app.use(express.static("public"));

// BODY PARSER
app.use(bodyParser.urlencoded({extended:false}));


const methodOverride = require('method-override');
const flash = require('connect-flash');
const { replaceOne } = require('./models/client');
app.use(flash());


app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});




app.get("/accueil", function (req,res) { 
    res.render('accueil');
});

/* Ancienne route
app.get("/tarifs",(req,res)=>{
    res.render('tarifs');
});
app.post("/tarifs",(req,res)=>{
   
});
*/
app.get("/reglementation", (req,res) =>{
    res.render('reglementation');
});
app.get("/changementProprio",(req,res)=>{
    res.render('changementProprio');
});
app.get("/cession",(req,res)=>{
    res.render('cession');
});
app.get("/duplicata",(req,res)=>{
    res.render("duplicata");
});
app.get("/changementNom",(req,res)=>{
    res.render("changementNom");
});
app.get("/changementAdresse",(req,res)=>{
    res.render("changementAdresse");
});
app.get("/heritage",(req,res)=>{
    res.render('heritage');
});
app.post("/heritage",(req,res) => {
    console.log(req.body.carteGriseBarre);
})


app.get("/info-vehicule",(req,res)=>{
    res.render('info-vehicule');
});
app.get('/contact',(req,res)=>{
    res.render('contact');
});
app.post('/contact',(req,res)=>{

    // async..await is not allowed in global scope, must use a wrapper
async function main() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
  
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'immatriculation006@gmail.com', // generated ethereal user
        pass: 'Intrusion', // generated ethereal password
      },
    });
  
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: req.body.email, // sender address
      to: "immatriculation006@gmail.com", // list of receivers
      subject: req.body.email, // Subject line
      text: req.body.message, // plain text body
      html: req.body.message, // html body
    });
  
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    transporter.sendMail(info,(err,response)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/accueil");
        }
    });
  }
 

  main().catch(console.error);   
});

// sign In 
app.get("/signup", function (req,res) {  
    res.render("signup");
});
app.post("/signup", function(req,res){
    const newClient = new Client({
        username: req.body.username,
    });
    Client.register(newClient, req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            return res.render("signup");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.render("login");
            });
        }
    });
});

// login
app.get("/login",function(req,res){
    res.render("login");
});
app.post("/login",(req,res)=>{
   const client = new Client({
       username : req.body.username,
       password : req.body.password
   });
   req.login(client,(err)=>{
       if(err){
           console.log(err);
       }else{
           passport.authenticate("local")(req,res,()=>{
               req.flash('success',"connection succès !");
            res.redirect("/dashboard");
           })
       }
   })
    });
    app.get('/dashboard',isLoggedIn,(req,res)=>{
        console.log(req.user);
        res.render('dashboard');
    });

    app.get("/logout",(req,res)=>{
        req.logout();
        req.flash('success',"Merci pour votre visite vous êtes desormais déconnecté");
        res.render("login");
    });

    app.get("/forgot",(req,res)=>{
        res.render("forgot");
    });
    app.post("/forgot",(req,res)=>{
        Client.findOne({username: req.body.username},(err,userFound)=>{
            if(err){
                console.log(err);
                res.redirect("login"); //("/login");
            }else{
                const token = randToken.generate(16);
                Reset.create({
                    username : userFound.username,
                    resetPasswordToken : token,
                    resetPasswordExpires: Date.now() + 3600000
                });
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'immatriculation006@gmail.com',
                        pass: 'Intrusion'
                    }
                });
                const mailOptions = {
                    from : 'immatriculation006@gmail.com',
                    to: req.body.username,
                    subject: 'link to rest your password',
                    text: 'click sur ce lien pour réinitialisé ton password: http://localhost:3000/reset/' + token
                }
                console.log("le mail est pres à être envoyé");

                transporter.sendMail(mailOptions,(err,response)=>{
                    if(err){
                        console.log(err);
                    }else{
                        req.flash("success","Votre email a été envoyé avec succès");
                        res.redirect("login");
                    }
                });
            }
        });
    });
   
    app.get("/reset/:token",(req,res)=>{
    Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    },(err, obj)=>{
        if(err){
            console.log("token expired");
            req.flash("error","Token expiré");
            res.redirect("login");
        }else{
            res.render("reset",{
                token: req.params.token
            });
        }
    });
    });
    app.post("/reset/:token", (req,res)=>{
    Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    },(err,obj)=>{
        if(err){
            console.log("token expired");
            res.redirect("/login");
        }else{
            if(req.body.password==req.body.password2){
                Client.findOne({
                    username: obj.username
                },(err,user)=>{
                    if(err){
                        console.log(err);
                    }else{
                        user.setPassword(req.body.password,(err)=>{
                            if(err){
                                console.log(err);
                            }else{
                                user.save();
                                const updatedReset = {
                                    resetPasswordToken : null,
                                    resetPasswordExpires : null
                                }
                                Reset.findOneAndUpdate({resetPasswordToken:req.params.token},updatedReset,(err,obj1)=>{
                                    if(err){
                                        console.log(err);
                                    }else{
                                        res.redirect("/login");
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
});


});

// Api tarifs carte grise (Obtenir le num SIV du ministère de l'intérieur)

// Fonction de connection

function isLoggedIn(req,res,next){
    if (req.isAuthenticated()) {
        return next();
    }else{
        req.flash("error","svp authentifiez-vous !");
        res.redirect('/login');
    }
}

// stripe route
app.get('/tarifs', (req, res)=>{ 
	res.render('stripe', { 
	key: Publishable_Key 
	}) 
});

// récuperation du formularire 
app.post('/payment', function(req, res){ 
	stripe.customers.create({ 
		email: req.body.stripeEmail, 
		source: req.body.stripeToken, 
		name: 'Laamimat Rarib', 
		address: { 
			line1: '', 
			postal_code: '59124', 
			city: 'Escaudain', 
			state: 'Nord', 
			country: 'France', 
		} 
	}) 
	.then((customer) => { 

		return stripe.charges.create({ 
			amount: 7000,	 // Charing Rs 25 
			description: 'Web Development Product', 
			currency: 'EUR', 
			customer: customer.id 
		}); 
	}) 
	.then((charge) => { 
		res.send("Success") // If no error occurs 
	}) 
	.catch((err) => { 
		res.send(err)	 // If some error occurs 
	}); 
}) 

// stripe creation d'un client
const createCustomer = ()=>{
    let param = {};
    param.email = "mike@gmail.com";
    param.name = "Mike";
    param.description = "from node";

    stripe.customers.create(param,(err,customer)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(customer)
        {
            console.log("success: "+customer);
        }else{
            console.log("Quelque chose cloche")
        }
    });
}
//createCustomer();

const retrieveCustomer = ()=>{
    stripe.customers.retrieve("cus_IPzA1X587XYUsi",(err,customer)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(customer)
        {
            console.log("success: "+JSON.stringify(customer, null, 2));
        }else{
            console.log("Quelque chose cloche")
        }
    });
}
// retrieveCustomer();

const createToken = ()=>{

    let param = {};
    param.card = {
        number:'4242424242424242',
        exp_month: 2,
        exp_year: 2024,
        cvc : '212'
    }

    stripe.tokens.create(param,(err,token)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(token)
        {
            console.log("success: "+JSON.stringify(token, null, 2));
        }else{
            console.log("Quelque chose cloche")
        }
    });  
}
// createToken();

const addCardToCustomer = ()=>{
    stripe.customers.createSource("cus_IPzA1X587XYUsi",{source:'tok_1HpAKiGsIt3lDAZ2OI50QoPV'},(err,card)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(card)
        {
            console.log("success: "+JSON.stringify(card, null, 2));
        }else{
            console.log("Quelque chose cloche")
        }
    });  
}
// addCardToCustomer ();

const chargeCustomerThroughCustomerID = ()=>{

    let param = {
        amount:'2000',
        currency: 'eur',
        description: 'First payemment',
        customer : 'cus_IPzA1X587XYUsi'
    }

    stripe.charges.create(param,(err,charge)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(charge)
        {
            console.log("success: "+JSON.stringify(charge, null, 2));
        }else{
            console.log("Quelque chose cloche")
        }
    });  
}
//chargeCustomerThroughCustomerID();

const chargeCustomerThroughTokenID = ()=>{

    let param = {
        amount:'2000',
        currency: 'eur',
        description: 'First payemment',
        source : 'tok_1HpAyZGsIt3lDAZ2UhrZ6TWV'
    }

    stripe.charges.create(param,(err,charge)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(charge)
        {
            console.log("success: "+JSON.stringify(charge, null, 2));
        }else{
            console.log("Quelque chose cloche")
        }
    });  
}
// chargeCustomerThroughTokenID();

const getAllCustomers = ()=>{

    stripe.customers.list({limit: 4},(err,customers)=>{
        if(err)
        {
            console.log("err: " +err);
        }if(customers)
        {
            console.log("success: "+JSON.stringify(customers.data, null, 2));
        }else{
            console.log("Quelque chose cloche")
        }
    });  
}
//getAllCustomers();



app.listen(3000, ()=>{
    console.log('server is running on port 3000');
});


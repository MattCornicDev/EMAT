const express = require('express');
const app = express();
const dotenv = require('dotenv').config();

const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const randToken = require('rand-token');
const nodemailer = require("nodemailer");

const https = require('https');
const fs = require('fs');
const upload = require('express-fileupload');

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// stripe pour les paiements en ligne
const Secret_Key = process.env.SECRET_KEY;
const Publishable_Key = process.env.PUBLISHABLE_KEY;
const stripe = require('stripe')(Secret_Key)

// MODELS
const User = require("./models/user");
const Client = require("./models/client");
const Reset  = require("./models/reset");
const Receipe  = require("./models/receipe");
const Ingredient  = require("./models/ingredient");
const Favourite  = require("./models/favourite");
const Schedule  = require("./models/schedule");

mongoose.set('useFindAndModify', false);

// initialisation de upload
app.use(upload());


//session initialisation 
app.use(session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false // ici il dit que si une session n'a jamais été initialisé doit il l'enregister 
}));
// passport 
app.use(passport.initialize());
app.use(passport.session()); // lien entre passport et le plug-in session

mongoose.connect(process.env.MONGO_DB,
{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// passport local mongoose Configuration en dessous de mongoose.connect
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser()); // permet de gerer les cookies 
passport.deserializeUser(User.deserializeUser());

// EJS instancié
app.set('view engine', 'ejs');

// PUBLIC FOLDER
app.use(express.static("public"));

// BODY PARSER
app.use(bodyParser.urlencoded({extended:false}));


const methodOverride = require('method-override'); // m'évite d'utiliser postman et réécrire au dessus de la méthode post
const flash = require('connect-flash');
const { replaceOne, findById } = require('./models/client');
const { errorMonitor } = require('events');
const ingredient = require('./models/ingredient');
// const receipe = require('./models/receipe');
// const ingredient = require('./models/ingredient');
app.use(flash()); // initiatlisation flash 
app.use(methodOverride('_method'));


app.use((req,res,next)=>{ // on va pouvoir passer des messages d'erreur
    res.locals.currentUser = req.user; // l'utislisateur courant qui va utiliser notre page 
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success'); // recuperer les success 
    next();
});

app.get("/accueil", function (req,res) { 
    res.render('accueil');
});
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
        if (req.files){
            var file = req.files.filename,
            filename = file.name;
            file.mv("./uploads/" + filename, (err)=>{
                if(err){
                    console.log(err);
                    res.send("Une erreur est survenu");
                }else{
                    res.redirect('heritage');
                }
            });
        } 
});


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
        pass: process.env.PDW // generated ethereal password
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
app.get("/signup", (req,res)=> {  
    res.render("signup");
});
app.post("/signup", function(req,res){
    const newUser = new User({
        username: req.body.username, // je recupere le username
    });
    User.register(newUser, req.body.password,(err,user)=>{  // j'enregiste mon utilisateur dans ma collection qui hashe et salt mon password
        if(err){
            console.log(err);
            return res.render("signup");
        }else{
            passport.authenticate("local")(req,res,()=>{ // cette method va me permettre d'authentifier mon utilisateur en strategy local
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
   const user = new User({ //je crée un nouvelle utilisateur 
       username : req.body.username, // on récupére 
       password : req.body.password
   });
   req.login(user,(err)=>{ // method req.login je connect mon client 
       if(err){
           console.log(err);
       }else{
           passport.authenticate("local")(req,res,()=>{ // on l'autentifie en stratégy local 
               req.flash('success',"Vous êtes connecté !"); // envoie du message flash
            res.redirect("/dashboard");
           })
       }
   })
    });
    app.get('/dashboard',isLoggedIn,(req,res)=>{ // is loggin va render le dashbord que si je suis connecté 
        console.log(req.user);
        res.render('dashboard');
    });

    app.get("/logout",(req,res)=>{
        req.logout(); // pour deconnecter l'utilisateur 
        req.flash('success',"Merci pour votre visite vous êtes desormais déconnecté");
        res.render("login");
    });

    app.get("/forgot",(req,res)=>{
        res.render("forgot");
    });
    app.post("/forgot",(req,res)=>{
        User.findOne({username: req.body.username},(err,userFound)=>{ // je vérifie si l'utilisateur existe dans la collection avec findOne
            if(err){
                console.log(err);
                res.redirect("login"); 
            }else{
                const token = randToken.generate(16); // je lui créé un token nbre aléatoire de 16 caractère
                Reset.create({          // insere dans la nouvelle table
                    username : userFound.username, 
                    resetPasswordToken : token,
                    resetPasswordExpires: Date.now() + 3600000 // fonction qui me renvoie la date actuelle plus un int en milliseconde
                });
                const transporter = nodemailer.createTransport({  // le transporter va livrer mon mail 
                    service: 'gmail',
                    auth: {                     // mot de passe à partir duquel j'envoie le mail
                        user: 'immatriculation006@gmail.com',
                        pass: process.env.PWD
                    }
                });
                const mailOptions = {  // les options du mail
                    from : 'immatriculation006@gmail.com',
                    to: req.body.username, // vers qui on l'envoi
                    subject: 'lien pour réinitialiser le mot de passe',
                    text: 'Clique sur ce lien pour réinitialisé ton password: http://localhost:3000/reset/' + token
                }
                console.log("le mail est pres à être envoyé");

                transporter.sendMail(mailOptions,(err,response)=>{ //maintenant que j'ai mis nos options je vais l'envoyer
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
    Reset.findOne({ // je cherche un utilisateur qui à pour token valide
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: {$gt: Date.now()} // le token est-il valide ?
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
    app.post("/reset/:token", (req,res)=>{ // je vérifie que le token n'est pas expiré
    Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    },(err,obj)=>{
        if(err){
            console.log("token expired");
            res.redirect("/login");
        }else{  // sinon je test les mots de passe
            if(req.body.password==req.body.password2){ // name qui sont dans les inputs de reset.ejs
                User.findOne({ // je cherche si le client existe 
                    username: obj.username // je veux recuperer les username qui correspond à mon reset.js
                },(err,user)=>{
                    if(err){
                        console.log(err);
                    }else{
                        user.setPassword(req.body.password,(err)=>{ // j'actualise le mot de passe 
                            if(err){
                                console.log(err);
                            }else{
                                user.save(); // j'actualise mon utilisateur dans la nouvelle collection
                                const updatedReset = { // le token je le remet à null pour ne l'utiliser qu'une fois
                                    resetPasswordToken : null,
                                    resetPasswordExpires : null
                                }
                                Reset.findOneAndUpdate({resetPasswordToken:req.params.token},updatedReset,(err,obj1)=>{ // j'actualiser ma collection reset le deuxieme parametre est l'objet que je veux update
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

// Route Receipe
app.get("/dashboard/myreceipes",isLoggedIn,(req,res)=>{
    Receipe.find({  // je fais une recherche par id de l'utilisateur
       user: req.user.id
    },(err,receipe)=>{
        if(err){
            console.log(err);
        }else{
            res.render('receipe',{receipe: receipe}); // on lui passe un objet le deuxieme receipe fait réference à celui du dessus
    }
});
});
app.get("/dashboard/newreceipe",isLoggedIn,(req,res)=>{
    res.render("newreceipe");
});
app.post("/dashboard/newreceipe",(req,res)=>{
    const newReceipe = {
        name: req.body.receipe,
        image: req.body.logo,
        user : req.user.id
    }
    Receipe.create(newReceipe,(err, newReceipe)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("success","new receipe ajouter");
            res.redirect("/dashboard/myreceipes");
        }
    })
});
app.get("/dashboard/myreceipes/:id",function(req,res){  // :id parce que l'id on ne le connait pas
    Receipe.findOne({user:req.user.id,_id:req.params.id},(err, receipeFound)=>{
        if(err){
            console.log(err);
        }else{
            Ingredient.find({
                user: req.user.id,
                receipe: req.params.id
            },(err,ingredientFound)=>{
                if(err){
                    console.log(err);
                }else{
                    res.render("ingredients",{
                        ingredient: ingredientFound,
                        receipe: receipeFound
                    });
                }
            })
        }
    }) // on verifie que l'id correspond à req.params et le user à req.user
});

app.delete("/dashboard/myreceipes/:id",isLoggedIn,(req,res)=>{
    Receipe.deleteOne({_id: req.params.id},(err)=>{
        if(err){
            console.log(err);
        }else{
            req.flash('success','effacé');
            res.redirect("/dashboard/myreceipes");
        }
    });
});

// Route Ing
app.get("/dashboard/myreceipes/:id/newingredient",(req,res)=>{
    Receipe.findById({_id: req.params.id},function(err,found){ // findById, method mongoose qui permet de rechercher que par l'id
        if(err){
            console.log(err);
        }else{
            res.render("newingredient",{receipe: found});
        }
    });
});
app.post("/dashboard/myreceipes/:id",(req,res)=>{
    const newIngredient={
        name: req.body.name,
        bestDish: req.body.dish,
        user: req.user.id,
        quantity: req.body.quantity,
        receipe: req.params.id
    }
    Ingredient.create(newIngredient,(err,newIngredient)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("success","ajouté !");
            res.redirect("/dashboard/myreceipes/" + req.params.id);
        }
    }) // je passe dans ma table
});

// Fav Routes
app.get("/dashboard/favourites",isLoggedIn,(req,res)=>{
    Favourite.find({user: req.user.id}, (err,favourite)=>{
        if(err){
            console.log(err);
        }else{
            res.render("favourites",{favourite: favourite}); // j'ajoute un objet favourite qui contient tous mes objets
        }
    });
});
app.get("/dashboard/favourites/newfavourite",isLoggedIn,(req,res)=>{
    res.render('newfavourite');
});
app.post("/dashboard/favourites",isLoggedIn,(req,res)=>{
    const newfavourite={
        image: req.body.image,
        title: req.body.title, 
        description: req.body.description,
        user: req.user.id,
    }
    Favourite.create(newfavourite,(err,newfavourite)=>{
        if(err){
            console.log(err)
        }else{
            req.flash("success","tu as ajouté à tes favoris");
            res.redirect("/dashboard/favourites");
        }
    });
});
app.delete("/dashboard/favourites/:id",isLoggedIn,(req,res)=>{
    Favourite.deleteOne({_id: req.params.id},(err)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("success","ton favori a été supprimé");
            res.redirect("/dashboard/favourites");
        }
    });
});

app.delete("/dashboard/myreceipes/:id/:ingredientsid",isLoggedIn,(req,res)=>{
    Ingredient.deleteOne({_id: req.params.ingredientid},(err)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("success","votre fichier à été supprimé");
            res.redirect("/dashboard/myreceipes/" + req.params.id);
        }
    });
});
app.post("/dashboard/myreceipes/:id/:ingredientid/edit",isLoggedIn,(req,res)=>{
    Receipe.findOne({user:req.user.id,_id:req.params.id},(err, receipeFound)=>{
        if(err){
            console.log(err);
        }else{
            Ingredient.findOne({
                _id:req.params.ingredientid,
                receipe: req.params.id
            }),(err, ingredientFound)=>{
                if(err){
                    console.log(err);
                }else{
                    res.render("edit",{
                        ingredient: ingredientFound,
                        receipe: receipeFound
                    });
                }
            }
        }
    })
});
app.put("/dashboard/myreceipes/:ingredientid",isLoggedIn,(req,res)=>{
    const ingredient_updated = 
    {
        name: req.body.name,
        bestDish: req.body.dish, 
        user: req.user.id,
        quantity: req.body.quantity,
        receipe: req.params.id
    }
    ingredient.findByIdAndUpdate({_id: req.params.ingredientid},ingredient_updated,(err,updatedIngredient)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("succes","update réalisé avec success");
            res.redirect("/dahsboard/myreceipes/" + req.params.id);
        }
    })
});

// routes Schedule "programmation"
app.get("/dashboard/schedule",isLoggedIn,(req,res)=>{
    Schedule.find({user: req.user.id},(err,schedule)=>{
        if(err){
            console.log(err);
        }else{
            res.render("schedule",{schedule: schedule})
        }
    })
});
app.get("/dashboard/schedule/newSchedule",isLoggedIn,(req,res)=>{
    res.render("newSchedule");
});
app.post("/dashboard/schedule",isLoggedIn,(req,res)=>{
    const newSchedule = 
    {
        ReceipeName: req.body.Receipename,
        scheduleDate: req.body.scheduledate, 
        user: req.user.id,
        time: req.body.time
    }
    Schedule.create(newSchedule,(err,newSchedule)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("success","nouvelle programmation");
            res.redirect("/dashboard/schedule");
        }
    })
});
app.delete("/dashboard/schedule/:id",isLoggedIn,function(req,res){
    Schedule.deleteOne({_id: req.params.id},(err)=>{
        if(err){
            console.log(err);
        }else{
            req.flash("succes","tu as bien éffacé ton programme");
            res.redirect("/dashboard/schedule");
        }
    })
});




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
    console.log('server is running on port 5000');
});


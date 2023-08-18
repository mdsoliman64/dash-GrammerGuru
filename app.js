require('dotenv').config();
const express= require("express");
const mongoose = require("mongoose");
const bodyParser=require("body-parser");
const app = express();
const cors = require("cors");
const session = require("express-session");
const port = process.env.PORT || 8000;
const bcrypt = require('bcrypt');
const saltRounds = 15;

////// Middleware ///////////////////////////////////////////////////
app.use(cors());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());
//////////////    Session store //////////////////////////////
app.use(session({
    secret: "Bangladesh is beautiful country  ",
    resave: false,
    saveUninitialized: true,
}));



function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
      next(); // User is logged in, proceed to the next middleware/route handler
    } else {
   
      res.status(401).redirect('/'); // User is not logged in
    }
  }
///////  database ///////////////////////////////
mongoose.connect(process.env.dbURL,{useNewUrlParser:true});
/////////////////// new schema ///////////////////////////////////////
const adminSchema = mongoose.Schema({
    email:String,
    password: String
 
});
const Admin = mongoose.model("admin",adminSchema);
bcrypt.hash(process.env.password , saltRounds, function(err, hash) {
    const admin = new Admin({
        email:process.env.email,
        password: hash
        
    });



    Admin.findOne({email:process.env.email}).then((found)=>{
        if(!found){
        admin.save();
        }else{
            console.log("this user already exist on this db ");
            
        }
        
        
        }).catch(err=>{
            console.log(err);
        });
});






///////      all route start from here       ////////////////////////////////////
app.get("/compose", isAuthenticated ,(req,res)=>{
res.render("composer");
})

app.get("/",(req,res)=>{
res.render("login");

});


app.post("/",(req,res)=>{
Admin.findOne({email:req.body.email}).then(found=>{
   if(found){

    bcrypt.compare(req.body.password, found.password, function(err, result) {

        if(result == true){
            req.session.isLoggedIn = true;
            res.redirect("/home");
            console.log("succesfully login");

        }else if(result == false){
        req.session.isLoggedIn = false;
    console.log("credential does not match");
    res.redirect("/");

        }
    });


   
   }else{
    req.session.isLoggedIn = false;
    console.log("credential does not match");
    res.redirect("/");
   }
})
});

app.get("/home", isAuthenticated ,(req,res)=>{
res.render("home");
});

app.post("/logout",(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/");
    })
});

//////////////////////  Post /composing content///////////////////////////////////////////////////
const postSchema = new mongoose.Schema({
Topic:String,
Question:String,
optionA:String,
optionB:String,
optionC:String,
optionD:String,
Answer: String



});
const Post = mongoose.model("post",postSchema);
/////////////////////// post api router ///////////////////////////
app.post("/post",(req,res)=>{


Post.findOne({Question:req.body.Question, optionA: req.body.optionA, optionB:req.body.optionB,}).then((found)=>{
if(!found){
const post = new Post({
    Topic: req.body.topic,
    Question:req.body.Question,
    optionA: req.body.optionA,
    optionB:req.body.optionB,
    optionC:req.body.optionC,
    optionD:req.body.optionD,
    Answer: req.body.answer
});
post.save().then(()=>{
    res.redirect("/compose");
    console.log(req.body.topic +": got a  post" );
});



}else{
    res.redirect("/compose");
    console.log("this post already exist here ");
}


}).catch(err=>{console.log(err);});

});


/////////////

// 
const userId = process.env.userId;
app.get(`/api/${userId}/:topicId`,(req,res)=>{
const topicId=  req.params.topicId;

Post.find({Topic:topicId}).then((found)=>{

if(found){
    res.send(found);
}else if(!found) {
    console.log("there is no post");
};

}).catch((err)=>{console.log(err);})

});
/////////////////////////////////////////////////////////////////
app.listen(port,()=>{

    console.log("Listening port no : " ,port );
})
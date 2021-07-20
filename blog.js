//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const ejs = require("ejs");
const _ = require("lodash");
const date = require(__dirname+"/date");
const multer = require("multer");

const storageStrategy = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './uploads');
  },
  filename: function(req, file, cb){
    cb(null, Date.now()+"_" + file.originalname);
  }
})

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
    cb(null, true)
  }else{
    cb(null, false)
  }
}

const upload = multer({
  storage: storageStrategy,
  limits: { fileSize: 1024*1024*10 },
  fileFilter: fileFilter
});


const aboutContent = "Welcome to Daily journal About page"
const contactContent = "Welcome to Daily journal Contact page";

const app = express();
const url = "mongodb+srv://admin-todolist:todolist@cluster0.jv4fj.mongodb.net/blogDB"
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true} )

const blogSchema = {
  name : String,
  content: String,
  filePath: String
}
const Blog = mongoose.model("blog", blogSchema)


const homeStartingContent = new Blog({
  name: "Home",
  content: "Welcome to Daily journal, Please make sure to have unique heading for each post Thanks ❤️"
})
const posts = [homeStartingContent]

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.static("public"));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

app.get("/", function(req, res){
  
  let day = date.getDate()

  Blog.find({}, function(err, allPosts){
    if(!err){
      if (allPosts.length<=0){
        homeStartingContent.save()
      }
      res.render("home", { postContent: allPosts, date:day});
    }
  })
})

app.get("/about", function(req, res){
  res.render("about", {ac: aboutContent});
})

app.get("/contact", function(req, res){
  res.render("contact", {cc: contactContent});
})

app.get("/compose", function(req, res){
  res.render("compose");
})

app.get("/post/:postName", function(req, res){
  reqTitle = req.params.postName;

  Blog.find({name: reqTitle}, (err, foundTitle)=>{
    //let fileUrl = "http://localhost:3000/"+foundTitle[0].filePath;
    let fileUrl = "https://cryptic-thicket-00500.herokuapp.com/"+foundTitle[0].filePath;
    console.log(fileUrl)
    if(!err){
      res.render("post", {st : foundTitle[0].name, 
                          storedContent: foundTitle[0].content,
                          id: foundTitle[0]._id ,
                          fileUrl : fileUrl
                         } )
    }else{
      res.send(err)
    }
  })
})

app.post("/compose", upload.single('blogImage') ,function(req, res){
  //console.log( req.file)

  let title = _.capitalize(req.body.title)

  Blog.find({name: title}, function(err, found){
    if(!err){
      if(found.length>0){
        res.render("post", {st : found[0].name, storedContent: found[0].content, id:found[0]._id } )
      }else{
        let newPostObj = new Blog({ 
          "name" : title,
          "content" : req.body.post,
          "filePath" : "1623868807567_Waterfall2.jpg"
        })  

        if (req.file){
          console.log("req.file: "+ req.file)
          newPostObj.filePath =  req.file.filename 
        }
        console.log(newPostObj)    
        newPostObj.save()
        res.redirect("/")
      }
    }
  })
});

app.post("/delete", function(req, res){
  let deleteBlogId = req.body.icon

  Blog.deleteOne({_id : deleteBlogId}, function(err){
    if(!err){
      res.redirect("/")
    }
  })
})

app.listen( process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

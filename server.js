// init project
const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const { exec } = require("child_process");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({secret: 'ssshhhhh tornado balance jogurt medal bamblbee sinalco', saveUninitialized: true, resave: true}));
app.use(express.static("public"));

// init sqlite db
const dbFile = "sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run("CREATE TABLE Categories (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, position INTEGER, type INTEGER, publish INTEGER)");
    db.run("INSERT INTO Categories (title,position,type,publish) VALUES ('No Category',0,1,1)");
    db.run("CREATE TABLE Articles (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, link TEXT, content TEXT, publish INTEGER, timestamp INTEGER, style INTEGER)");
    db.run("CREATE TABLE Articles_Categories (id INTEGER PRIMARY KEY AUTOINCREMENT, id_article INTEGER, id_category INTEGER)");
    console.log("New tables created!");
  } else {
    console.log('Database good!');
  }
});

////////////
//  DATABASE BACKUP / IMPORT
///////////
app.post("/upload", (request, response) => {
  if (request.session.logged){
    const sqlImport = request.body.data;
    fs.writeFile('import.dump', sqlImport, function (err) {
      if (err) {
        response.send({ message: "error" })
      }   
      exec('rm '+ dbFile + '; sqlite3 '+dbFile+' < import.dump; refresh', (error, stdout, stderr) => {
          if (error) {
              response.send({ message: error.message });
              return;
          }
          if (stderr) {
            response.send({ message: stderr });
              return;
          }
          response.send({ message: "success" });
        });    
    });
  }
  else{
    response.sendFile(`${__dirname}/views/index.html`);
  }
});
app.get("/backup", (request, response) => {
  if (request.session.logged){
    exec('sqlite3 '+dbFile+' .dump > backup.dump', (error, stdout, stderr) => {
      if (error) {
          response.send({ message: error.message });
          return;
      }
      if (stderr) {
        response.send({ message: stderr });
          return;
      }
      response.download('backup.dump','backup.dump');
    });
  }
  else{
    response.sendFile(`${__dirname}/views/index.html`);
  }
});

/////////
//  VIEWS
/////////
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});
app.get("/admin", (request, response) => {
  if (request.session.logged){
    response.sendFile(`${__dirname}/views/admin.html`);  
  }
  else{
    response.sendFile(`${__dirname}/views/login.html`);
  }
});

/////////
//  AUTH
////////
app.post("/login", (request, response) => {
  const password = request.body.password;
  if (password == "password") {
    request.session.logged = true;
  }
  response.send({message: "ok"});
});
app.get("/logout", (request, response) => {
  request.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        response.redirect('/');
    });
});

////////
//  EDIT VIEWS
////////
app.get("/edit/story/:id", (request, response) => {
  if (request.session.logged){
    response.sendFile(`${__dirname}/views/edit-content.html`);
  }
  else{
    response.sendFile(`${__dirname}/views/login.html`);
  }
});
app.get("/edit/category/:id", (request, response) => {
  if (request.session.logged){
    response.sendFile(`${__dirname}/views/edit-category.html`);
  }
  else{
    response.sendFile(`${__dirname}/views/login.html`);
  }
});

////////
//  ARTICLE VIEWS
////////
app.get("/article/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/article.html`);
});
app.get("/a/:title/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/article.html`);
});
app.post("/article/:id", (request, response) => {
  var idStorie = request.params.id;
  db.all("SELECT * from Articles WHERE NOT publish = 0 AND id == ?", idStorie , (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

////////
//  PAGE VIEWS
///////
app.get("/page/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/page.html`);
});
app.get("/p/:title/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/page.html`);
});
app.post("/page/:id/page/:page", (request, response) => {
  var idCategory = request.params.id;
  var page = request.params.page * 50;
  db.all("SELECT Articles.* from Articles JOIN Articles_Categories ON Articles.id = Articles_Categories.id_article WHERE NOT Articles.publish = 0 AND Articles_Categories.id_category = ? ORDER BY Articles.timestamp DESC LIMIT 50 OFFSET ? ", [idCategory,page] , (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

////////
//  LIST VIEWS
////////
app.get("/list/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/list.html`);
});
app.get("/l/:title/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/list.html`);
});
app.post("/list/:id/page/:page", (request, response) => {
  var idCategory = request.params.id;
  var page = request.params.page * 10;
  db.all("SELECT Articles.* from Articles JOIN Articles_Categories ON Articles.id = Articles_Categories.id_article WHERE NOT Articles.publish = 0 AND Articles_Categories.id_category = ? ORDER BY Articles.timestamp DESC LIMIT 10 OFFSET ? ", [idCategory,page] , (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

/////////
//  ARTICLES API
/////////
app.get("/stories/admin", (request, response) => {
  db.all("SELECT * from Articles ORDER BY id DESC", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.get("/stories/:category/admin", (request, response) => {
  var category = request.params.category;
  db.all("SELECT Articles.* from Articles JOIN Articles_Categories ON Articles.id = Articles_Categories.id_article WHERE Articles_Categories.id_category = ? ORDER BY Articles.timestamp DESC",category, (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.get("/stories/page/:page", (request, response) => {
  var page = request.params.page * 50;
  db.all("SELECT * from Articles WHERE publish = 1 ORDER BY timestamp DESC LIMIT 50 OFFSET ? ",page, (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.post("/stories/add", (request, response) => {  
  if (request.session.logged){
    const title = request.body.title;
    const link = request.body.link;
    const content = request.body.content;
    const categories = request.body.category;
    const publish = request.body.publish;
    const timestamp = request.body.timestamp;
    const style = request.body.style;
    db.run(`INSERT INTO Articles (title,link,content,publish,timestamp,style) VALUES (?,?,?,?,?,?)`, [title,link,content,publish,timestamp,style], function (error) {
      if (error) {
        response.send({ message: "error!" });
      } else {
        var lastIndex = this.lastID;
        categories.forEach(function(element) {
          db.run(`INSERT INTO Articles_Categories (id_article,id_category) VALUES (?,?)`, [lastIndex,element], error => {
            if (error) { console.log("error forearch"); } 
          });
        });
        response.send({ message: "success" });
      }
    });
  }
  else{
      response.send({ message: "fail" });
  }
});
app.post("/stories/remove", (request, response) => {
  if (request.session.logged){
    const idStorie = request.body.id;
    db.run(`DELETE FROM Articles WHERE id = ?`, idStorie, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        db.run(`DELETE FROM Articles_Categories WHERE id_article = ?`, idStorie, error => {
          if (error) {
            response.send({ message: "error!" });
          } else {
            response.send({ message: "success" });
          }
        });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});
app.post("/stories/edit", (request, response) => {
  if (request.session.logged){
    const idStorie = request.body.id;
    const title = request.body.title;
    const link = request.body.link;
    const content = request.body.content;
    const categories = request.body.categories;
    const timestamp = request.body.timestamp;
    const style = request.body.style;
    db.run(`UPDATE Articles SET title = ?, link = ?, content = ?, timestamp = ?, style = ? WHERE id = ?`, [title,link,content,timestamp,style,idStorie], function (error) {
      if (error) {
        response.send({ message: "error!" });
      } else {
        db.run(`DELETE FROM Articles_Categories WHERE id_article = ?`, idStorie, error => {
          if (error) {
            response.send({ message: "error!" });
          } else {
            categories.forEach(function(element) {
              db.run(`INSERT INTO Articles_Categories (id_article,id_category) VALUES (?,?)`, [idStorie,element], error => {
                if (error) { console.log("error forearch"); } 
              });
            });
            response.send({ message: "success" });
          }
        });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});
app.post("/stories/publish", (request, response) => {
  if (request.session.logged){
    const idStorie = request.body.id;
    const publish = request.body.publish;
    db.run(`UPDATE Articles SET publish = ? WHERE id = ?`, [publish,idStorie], error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});
app.get("/stories/category/:id", (request, response) => {
  var id_article = request.params.id;
  db.all("SELECT * from Articles_Categories WHERE id_article = ?",[id_article], (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

/////////
//  CATEGORIES API
/////////
app.get("/category/admin", (request, response) => {
  db.all("SELECT * from Categories ORDER BY position ASC", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.get("/category", (request, response) => {
  db.all("SELECT * from Categories WHERE publish = 1 ORDER BY position ASC", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.get("/category/:id", (request, response) => {
  var catID = request.params.id;
  db.all("SELECT * from Categories WHERE id = ?",catID, (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.post("/category/add", (request, response) => {
  if (request.session.logged){
    const title = request.body.title;
    const position = request.body.position;
    const type = request.body.type;
    db.run(`INSERT INTO Categories (title,position,type) VALUES (?,?,?)`, [title,position,type], error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});
app.post("/category/remove", (request, response) => {
  if (request.session.logged){
    const idCategory = request.body.id;
    db.run(`DELETE FROM Categories WHERE id = ?`, idCategory, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});
app.post("/category/publish", (request, response) => {
  if (request.session.logged){
    const idCategory = request.body.id;
    const publish = request.body.publish;
    db.run(`UPDATE Categories SET publish = ? WHERE id = ?`, [publish,idCategory], error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});
app.post("/category/edit", (request, response) => {
  if (request.session.logged){
    const idCategory = request.body.id;
    const title = request.body.title;
    const position = request.body.position;
    const type = request.body.type;
    db.run(`UPDATE Categories SET title = ?, position = ?, type = ? WHERE id = ?`, [title,position,type,idCategory], error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
  else{
    response.send({ message: "fail" });
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

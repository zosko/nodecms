// init project
const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const { exec } = require("child_process");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({secret: 'ssshhhhh', saveUninitialized: true, resave: true}));
app.use(express.static("public"));

// init sqlite db
const dbFile = "sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run("CREATE TABLE Categories (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, position INTEGER, type INTEGER)");
    db.run("INSERT INTO Categories (title,position,type) VALUES ('No Category',0,1)");
    db.run("CREATE TABLE Articles (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, link TEXT, content TEXT, category INTEGER, publish INTEGER, timestamp INTEGER, style INTEGER)");
    console.log("New tables created!");
  } else {
    console.log('Database good!');
  }
});

////////////
//  DATABASE BACKUP / IMPORT
///////////
app.post("/upload", (request, response) => {
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
});
app.get("/backup", (request, response) => {
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
  if (password == "test123") {
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
  response.sendFile(`${__dirname}/views/edit-content.html`);
});
app.get("/edit/category/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/edit-category.html`);
});

////////
//  ARTICLE VIEWS
////////
app.get("/article/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/article.html`);
});
app.post("/article/:id", (request, response) => {
  var idStorie = request.params.id;
  db.all("SELECT * from Articles WHERE id == ?", idStorie , (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

////////
//  PAGE VIEWS
///////
app.get("/page/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/page.html`);
});
app.post("/page/:id", (request, response) => {
  var idCategory = request.params.id;
  db.all("SELECT * from Articles WHERE category == ?", idCategory , (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

////////
//  LIST VIEWS
////////
app.get("/list/:id", (request, response) => {
  response.sendFile(`${__dirname}/views/list.html`);
});
app.post("/list/:id", (request, response) => {
  var idStorie = request.params.id;
  db.all("SELECT * from Articles WHERE category == ?", idStorie , (err, rows) => {
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
  db.all("SELECT * from Articles WHERE category == ? ORDER BY id DESC",category, (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.get("/stories", (request, response) => {
  db.all("SELECT * from Articles WHERE publish = 1 ORDER BY timestamp DESC", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.get("/stories/:category", (request, response) => {
  var category = request.params.category;
  db.all("SELECT * from Articles WHERE category == ? AND publish = 1 ORDER BY timestamp DESC",category, (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});
app.post("/stories/add", (request, response) => {  
  const title = request.body.title;
  const link = request.body.link;
  const content = request.body.content;
  const category = request.body.category;
  const publish = request.body.publish;
  const timestamp = request.body.timestamp;
  const style = request.body.style;
  db.run(`INSERT INTO Articles (title,link,content,category,publish,timestamp,style) VALUES (?,?,?,?,?,?,?)`, [title,link,content,category,publish,timestamp,style], error => {
    if (error) {
      response.send({ message: "error!" });
    } else {
      response.send({ message: "success" });
    }
  });
});
app.post("/stories/remove", (request, response) => {
  const idStorie = request.body.id;
  db.run(`DELETE FROM Articles WHERE id = ?`, idStorie, error => {
    if (error) {
      response.send({ message: "error!" });
    } else {
      response.send({ message: "success" });
    }
  });
});
app.post("/stories/edit", (request, response) => {
  const idStorie = request.body.id;
  const title = request.body.title;
  const link = request.body.link;
  const content = request.body.content;
  const category = request.body.category;
  const publish = request.body.publish;
  const timestamp = request.body.timestamp;
  const style = request.body.style;
  db.run(`UPDATE Articles SET title = ?, link = ?, content = ?, category = ?, publish = ?, timestamp = ?, style = ? WHERE id = ?`, [title,link,content,category,publish,timestamp,style,idStorie], error => {
    if (error) {
      response.send({ message: "error!" });
    } else {
      response.send({ message: "success" });
    }
  });
});
app.post("/stories/publish", (request, response) => {
  const idStorie = request.body.id;
  const publish = request.body.publish;
  db.run(`UPDATE Articles SET publish = ? WHERE id = ?`, [publish,idStorie], error => {
    if (error) {
      response.send({ message: "error!" });
    } else {
      response.send({ message: "success" });
    }
  });
});

/////////
//  CATEGORIES API
/////////
app.get("/category", (request, response) => {
  db.all("SELECT * from Categories ORDER BY position ASC", (err, rows) => {
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
});
app.post("/category/remove", (request, response) => {
  const idCategory = request.body.id;
  db.run(`DELETE FROM Categories WHERE id = ?`, idCategory, error => {
    if (error) {
      response.send({ message: "error!" });
    } else {
      response.send({ message: "success" });
    }
  });
});
app.post("/category/edit", (request, response) => {
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
});

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const http = require("http");
const { resolve } = require("path");
const path = require("path");
const app = express();
const server = http.createServer(app);

const db = new sqlite3.Database("./data.db");
db.run(
  "CREATE TABLE IF NOT EXISTS tareas(id int, tarea varchar(24), prioridad int, estado varchar(24))"
);
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./public/index.html"));
});
app.use(express.static('public'));

app.get("/add", function (req, res) {
  req.query.prioridad === "Baja"
    ? (req.query.prioridad = 3)
    : req.query.prioridad === "Media"
    ? (req.query.prioridad = 2)
    : req.query.prioridad === "Alta"
    ? (req.query.prioridad = 1)
    : null;

  const estado = '<i class="bi bi-x-square-fill text-danger fs-3"></i>';
  db.serialize(() => {
    try {
      db.run(
        "INSERT INTO tareas(id, tarea, prioridad, estado) VALUES(?,?,?,?)",
        [1, req.query.tarea, req.query.prioridad, estado],
        function (err) {
          console.log("Tarea registrada!");
          res.sendFile(path.join(__dirname, "./public/index.html"));
          db.run(
            "Update tareas SET id=x.rn from (SELECT tarea, row_number() over (partition by 1 order by prioridad) rn from tareas) x where tareas.tarea=x.tarea"
          );
        }
      );
    } catch (e) {
      return console.log(e.message);
    }
  });
});

app.get("/view.json", function (req, res) {
  db.serialize(() => {
    try {
      db.all(
        "SELECT * FROM tareas ORDER BY prioridad ASC",
        [],
        function (err, row) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Method", "GET");
          res.send(row);
        }
      );
    } catch (error) {
      return console.log(error.message);
    }
  });
});

app.get("/delete", function (req, res) {
  db.serialize(() => {
    try {
      db.all(
        "DELETE FROM tareas WHERE id = ?",
        [req.query.id],
        function (err, row) {
          console.log("eliminacion ok !");
          res.sendFile(path.join(__dirname, "./public/index.html"));
        }
      );
    } catch (e) {
      return console.log(e.message);
    }
  });
});

app.get("/update", function (req, res) {
  req.query.prioridad === "Baja"
    ? (req.query.prioridad = 3)
    : req.query.prioridad === "Media"
    ? (req.query.prioridad = 2)
    : req.query.prioridad === "Alta"
    ? (req.query.prioridad = 1)
    : null;

  req.query.estado === "Completo"
    ? (req.query.estado =
        '<i class="bi bi-check-square-fill text-success fs-3 "></i>')
    : (req.query.estado =
        '<i class="bi bi-x-square-fill text-danger fs-3"></i>');

  db.serialize(() => {
    try {
      db.all(
        "UPDATE tareas SET tarea = ?, prioridad = ?, estado = ? WHERE id = ?",
        [req.query.tarea, req.query.prioridad, req.query.estado, req.query.id],
        function (err, row) {
          console.log("Actualizacion exitosa!");
          res.sendFile(path.join(__dirname, "./public/index.html"));
        }
      );
    } catch (e) {
      return console.log(e.message);
    }
  });
});

app.get("/close", function (req, res) {
  db.close((err) => {
    if (err) {
      res.send("There is some error in closing the database");
      return console.error(err.message);
    }
    console.log("Closing the database connection.");
    res.send("Database connection successfully closed");
  });
});

server.listen(3000, function () {
  console.log("server is listening on port: 3000");
});

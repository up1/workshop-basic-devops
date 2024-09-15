const express = require("express");

const app = express();
const pg = require("pg");
const ip = require("ip");

const port = process.env.PORT || 3000;

const connectionString =
  process.env.CONNECT_STRING ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

const { Client } = pg;

const client = new Client({
  connectionString,
});

const getRandomNumber = () => {
  return Math.floor(Math.random() * 100) + 1;
};

const randomNumber = 2; //getRandomNumber();

let connection = false;
let broken = process.env.BROKEN === "true" || false;

const start = async () => {
  console.log("starting", randomNumber, ip.address());
  console.log("connecting to database", connectionString);
  if (randomNumber % 2 !== 0) {
    console.log("can not connect...", randomNumber);
    return;
  }
  await client.connect();
  connection = true;
  const result = await client.query("SELECT NOW()");
  console.log(connectionString, result.rows);

  try {
    const res = await client.query("SELECT * FROM pings");
    console.log(res.rows);
  } catch (e) {
    console.log("creating table");
    await client.query("CREATE TABLE pings(count INT)");
    await client.query("INSERT INTO pings(count) VALUES(0)");
  }
};

start();

const getPings = async () => {
  const { rows } = await client.query("SELECT * FROM pings");
  return rows[0].count;
};

const setPings = async (val) => {
  const { rows } = await client.query("DELETE FROM pings");
  await client.query("INSERT INTO pings(count) VALUES($1)", [val]);
};

const isBroken = (req, res, next) => {
  if (!connection || randomNumber % 2 !== 0) {
    res.status(500).send("error");
  } else {
    next();
  }
};

app.get("/flip", async (req, res) => {
  console.log("/flip, now is broken", broken, ip.address());
  broken = !broken;
  console.log("/flip changed to broken", broken, ip.address());
  res.send("is broken: " + true + " " + ip.address());
});

app.get("/healthz", isBroken, async (req, res) => {
  console.log("healthz:", randomNumber, ip.address());
  if (connection && !broken) {
    console.log("ok", randomNumber, ip.address());
    res.send("ok" + randomNumber);
  } else {
    console.log("fail", randomNumber, ip.address());
    res.status(500).send("error");
  }
});

app.get("/", async (req, res) => {
  console.log("/", randomNumber, ip.address());
  if (true || connection) {
    res.send(
      '<p>pingpong: <a href="/pingpong">pingpong</a></p>' +
        randomNumber +
        "<p>" +
        ip.address() +
        "</p>"
    );
  } else {
    console.log("fail", randomNumber);
    res.status(500).send("error");
  }
});

app.get("/pingpong", async (req, res) => {
  console.log("pingpong", randomNumber, ip.address());
  const pings = await getPings();

  await setPings(pings + 1);
  res.send(
    "<p>pong " +
      (pings + 1) +
      "</p><p> random: " +
      randomNumber +
      "</p><p>in ip " +
      ip.address() +
      "</p>"
  );
});

app.get("/pings", async (req, res) => {
  const pings = await getPings();
  res.send({ pings });
});

/*
app.get('*', (req, res) => {
  res.setHeader('Connection', 'close');
  res.send(`pingpong: route not found: ${req.originalUrl}`);
});
*/

function gracefulShutdown() {
  console.log("Shutting down gracefully in 3 seconds...");
  broken = true;
  setTimeout(() => {
    console.log("Shutting down NOW...");
    process.exit(0);
  }, Number(process.env.SHUTDOWN_TIMEOUT) || 3000);
}

process.on("SIGTERM", gracefulShutdown);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

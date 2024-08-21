const express = require("express");
const ejs = require("ejs");
const engine = require("ejs-mate");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const { Issuer, TokenSet, custom, generators } = require("openid-client");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const cookieSecret = process.env.COOKIE_SECRET || generators.random();
const secureCookieConfig = {
  secure: false,
  httpOnly: true,
  signed: true,
};

app.engine("ejs", engine);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public", {
  setHeaders: (res, path) => {
    if (path.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
  }
}));

app.use(cookieParser(cookieSecret));
app.use(express.urlencoded({ extended: true }));

async function main() {
  const issuer = await Issuer.discover(
    "https://apis.roblox.com/oauth/.well-known/openid-configuration"
  );

  const client = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [`https://rowager-3tp8.onrender.com/oauth/callback`],
    response_types: ["code"],
    scope: "openid profile",
    id_token_signed_response_alg: "ES256",
  });

  client[custom.clock_tolerance] = 180;

  async function checkLoggedIn(req, res, next) {
    if (req.signedCookies.tokenSet) {
      let tokenSet = new TokenSet(req.signedCookies.tokenSet);

      if (tokenSet.expired()) {
        try {
          tokenSet = await client.refresh(tokenSet);
          res.cookie("tokenSet", tokenSet, secureCookieConfig);
        } catch (error) {
          console.error('Error refreshing token:', error);
          return res.redirect('/login');
        }
      }

      req.tokenSet = tokenSet;
      next();
    } else {
      res.redirect("/login");
    }
  }

  app.get("/", checkLoggedIn, (req, res) => {
    res.redirect("/rowager");
  });

  app.get("/login", (req, res) => {
    const state = generators.state();
    const nonce = generators.nonce();

    res
      .cookie("state", state, secureCookieConfig)
      .cookie("nonce", nonce, secureCookieConfig)
      .redirect(
        client.authorizationUrl({
          scope: client.scope,
          state,
          nonce,
        })
      );
  });

  app.get("/logout", async (req, res) => {
    if (req.signedCookies.tokenSet) {
      try {
        await client.revoke(req.signedCookies.tokenSet.refresh_token);
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }

    res.clearCookie("tokenSet").redirect("/");
  });

  app.get("/oauth/callback", async (req, res) => {
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(
        `https://rowager-3tp8.onrender.com/oauth/callback`,
        params,
        {
          state: req.signedCookies.state,
          nonce: req.signedCookies.nonce,
        }
      );

      res
        .cookie("tokenSet", tokenSet, secureCookieConfig)
        .clearCookie("state")
        .clearCookie("nonce")
        .redirect("/rowager");
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.redirect('/login');
    }
  });

  let placeHolder;

  app.get("/rowager", checkLoggedIn, (req, res) => {
    const tokenSet = req.tokenSet;

    io.emit('login_client', tokenSet.claims());
    placeHolder = tokenSet.claims();
    console.log('Emitting login_client event with token:', tokenSet.claims());

    res.render("home.ejs");
  });

  io.on("connection", (socket) => {
    console.log('A user connected');

    socket.on("message", (user, msg) => {
      console.log(user + ": " + msg);
      io.emit("newtext", user, msg);
    });

    socket.on('login_request', () => {
      socket.emit('login_return', placeHolder);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  server.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

main().catch(console.error);

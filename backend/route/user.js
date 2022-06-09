const router = require("express").Router();
const jwt = require("jsonwebtoken");
const httpModule = require("../util/http");
const http = httpModule();
const User = require("../model/user");

const config = {
  google: {
    clientId: "651816047225-1us03r4vchvce7h51t0c49f4u0ip7ubm.apps.googleusercontent.com",
    clientSecret: "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",
    redirectUri: "http://localhost:3000/callback",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "openid",
  },
  github: {
    clientId: "a6b3d8e1c2c6c193dac2",
    clientSecret: "7c566a9529bc9ef3dee18af40e183ec31e768291",
    redirectUri: "http://localhost:3000/callback/github",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    scope: "user",
    userEndpoint: "https://api.github.com/user", // header: { authorization: Bearer <access_token> }
    user_id: "id",
  },
  // facebook: {
  //   clientId: "",
  //   clientSecret: "",
  //   redirectUri: "",
  //   tokenEndpoint: "",
  // },
};

router.post("/login", async (req, res) => {
  const payload = req.body;
  if (!payload) return res.status(400).send("Nice try");

  const code = payload.code;
  const provider = payload.provider;
  if (!code || !provider) return res.status(400).send("Nice try");
  if (Object.keys(config).includes("provider")) return res.status(400).send("Nice try");

  const configProvider = config[provider];
  const link = configProvider.tokenEndpoint;

  // our own http module
  const response = await http.post(
    link,
    {
      code: code,
      client_id: configProvider.clientId,
      client_secret: configProvider.clientSecret,
      redirect_uri: configProvider.redirectUri,
      grant_type: "authorization_code",
    },
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response) return res.status(500).send("google error");
  if (response.status !== 200) return res.status(400).send("Nice try");

  let oId;
  const onlyOauth = !response.data.id_token;
  if (onlyOauth) {
    let token = response.data.access_token;
    const userResponse = await http.post(
      configProvider.userEndpoint,
      {},
      {
        headers: {
          authorization: "Bearer " + token,
        },
      }
    );
    if (!response) return res.status(500).send("provider error");
    if (response.status !== 200) return res.status(400).send("Nice try");
    oId = userResponse.data.id;
  } else {
    const decoded = jwt.decode(response.data.id_token);
    if (!decoded) return res.status(500).send("decoded error");
    oId = decoded.sub;
  }

  // find user if exists
  const key = `providers.${provider}`;
  const user = await User.findOneAndUpdate(
    { [key]: oId },
    {
      providers: {
        [provider]: oId,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json(token);
});

module.exports = router;

/*
google:
https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=651816047225-1us03r4vchvce7h51t0c49f4u0ip7ubm.apps.googleusercontent.com&redirect_uri=http://localhost:3000/callback&scope=openid%20email&prompt=select_account

github:
https://github.com/login/oauth/authorize?response_type=code&client_id=a6b3d8e1c2c6c193dac2&redirect_uri=http://localhost:3000/callback/github&scope=user%20email&prompt=select_account

http://localhost:3000/callback/github

*/

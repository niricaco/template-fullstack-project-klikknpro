const { default: axios } = require("axios");

const http = (baseUrl) => {
  const instance = axios.create({
    baseURL: baseUrl || "",
    timeout: 3000,
  });

  const post = async (url, body, options) => {
    try {
      const response = await instance.post(url, body, options);
      return response;
    } catch (err) {
      console.log(err);
      return err.reponse;
    }
  };
  return { post };
};

module.exports = http;

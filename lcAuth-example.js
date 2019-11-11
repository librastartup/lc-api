module.exports = {
  passPostgres: () => {
    return('yourPassword');
  },
  lcEnv: () => {
    // return('live');
    return('dev');
  },
  lcOriginUrl: () => {
    // return 'https://librachecker.com';
    return 'http://localhost:8080';
  }
}
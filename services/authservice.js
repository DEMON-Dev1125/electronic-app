const mysql = require('mysql');

async function connexion(key){
    var cnt
    var connection = mysql.createConnection({
        host     : '185.31.40.39',
        user     : '209609',
        password : 'lV0ajlBV5t7oREjh',
        database : 'soniastarlette_login'
      });

      connection.connect();
      q = `SELECT count(*) from login where keyLog="${key}"`
      connection.query(q, function (error, results) {
        cnt = results[0]['count(*)']
      });
      connection.end();

      function delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
        }
    await delay(1000);

      if(cnt == 0){
        return false;
      }
      if(cnt==1){
        return true;
      }
      
}
module.exports = {
    connexion
  };
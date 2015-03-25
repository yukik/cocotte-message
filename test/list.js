var msg = require('..');

var debug = msg.debug('worker');

// ---- 環境変数(DEBUG)による ---

// 設定しない     -> 表示される
// workerを設定   -> 表示される
// workerを未設定 -> 表示されない
debug('abc');

// ---- ブラックリスト ----
msg.isWhiteList = false;
msg.blackList = [];

debug('def'); // 表示される

msg.blackList = ['worker'];

debug('ghi'); // 表示されない


// ---- ホワイトリスト ----
msg.isWhiteList = true;
msg.whiteList = [];

debug('jkl'); // 表示されない

msg.whiteList = ['worker'];

debug('mno'); // 表示される

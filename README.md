cocotte-message
===========

# はじめに

メッセージの表示およびログの出力を行います  

# インストール

```
$ npm install cocotte-message
```

# 使用方法

## 基本的な使用方法

```javascript
var msg = require('cocotte-message');
msg('最初');
msg('次');
msg('最後');
```

コンソールに次のように表示されます

```
[DEBUG] "最初" test.js(2)
[DEBUG] "次" test.js(3)
[DEBUG] "最後" test.js(4)
```

以下、上記のmsgをメッセージ関数と呼びます


第二引数はオブジェクトを指定し、出力オプションを設定することができます  

  + level: {String} コンソール出力のレベルを設定します
    + debug: デバッグ。 (既定値)
    + info:  情報。
    + warn:  注意。エラーではないが通常ではない動作
    + error: エラー。動作不良を起こす動作
    + fatal: 致命的なエラー。動作の継続に支障を起こすエラー
  + label    : {String}   ラベルの文字列
    + 既定値:levelの文字列のupperCase
  + logg     : {String}   書込みを行うファイルフォーマット
      + nullを設定すると書込みしません
      + フォーマットはmomentを参照
      + 既定値:msg.logg依存 (レベル毎に設定されています)
        + debug,infoはnull、warn,error,fatalは`[log]-YYYY-MM-DD.[log]`です
  + caller   : {Function} ファイル名・行数の対象をコントロール
      + 実行したファイルと行の調査でstacktraceをさかのぼる際に排除する関数を指定します
  + bench    : {String}   ベンチマーク結果
    + 以前のポイントからどれだけの時間が経過したかを文字列で指定します
  + noval    : {Boolean}  値の出力を省略する際に指定します
  + trace    : {Boolean}  ログ出力時にファイル名と行数を追加する際にtrueにします

## デバッグ関数

### デバッグ関数とは

デバッグ関数は、メッセージ関数とは異なり次のような機能があります

+ 最後にメッセージを表示からの経過時間が表示します  
+ 表示・非表示の切り替えが簡単に行うことができます

デバッグ関数は、メッセージ関数のdebugメソッドを呼びだすことで作成されます  
引数には、デバッグキーを指定します

### 使用方法

```javascript
var msg = require('cocotte-message');
var debug = msg.debug('worker');
debug('最初');
debug('次');
debug('最後');
```

コンソールには次のように表示されます

```
[DEBUG:worker]  2ms "最初" test.js(3)
[DEBUG:worker]  0ms "次" test.js(4)
[DEBUG:worker]  0ms "最後" test.js(5)
```

### 表示・非表示の切り替え

デバッグ関数の表示・非表示を切り替えるには、次の２つの種類が存在します

+ ブラックリスト方式 (既定値)
+ ホワイトリスト方式

既定値ではブラックリスト方式に設定されています  

```
var msg = require('cocotte-message');
var debug = msg.debug('worker')

debug('foo'); // 表示されます

msg.blackList = ['worker'];

debug('bar'); // 表示されません
```


ホワイトリスト形式に変更する場合は次のように設定します  

```
var msg = require('cocotte-message');
msg.isWhiteList = true;

var debug = msg.debug('worker');

debug('foo'); // 表示されません

msg.whiteList = ['worker'];

debug('bar'); // 表示されます
```

### 環境変数を使用する

実行時に環境変数`DEBUG`に設定した値によりデバッグ関数の表示・非表示を制御することができます  
規定値はホワイトリスト方式になります

`DEBUG=worker node test.js`と実行すると、`worker`が自動的にホワイトリストに追加されます  
複数のキーを設定する場合は、カンマ区切りで指定します

## ログ関数

log関数はログファイルに出力することができます  
第一引数でメッセージのレベルを指定することで実行できます  
レベルは規定で次の用に設定されています

 + `debug` デバッグ用。既定値です。
 + `info` 情報。正しい処理を行っている動作
 + `warn` 警告。エラーではないが通常ではない動作
 + `error` エラー。処理の不良を起こす可能性のある動作
 + `fatal` 致命的なエラー。継続に支障を起こす致命的な動作

第二引数でログファイルのフォーマットを決定します  
規定値はmsg.loggに依存します。規定値がnullの場合は`[log]-YYYY-MM-DD.[txt]`です


つぎのように行う事で、コンソールに表示し更にログファイルに書込みを行います

```javascript
var logger = msg.logger('error');
logger('foo');
```


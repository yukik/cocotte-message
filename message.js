/*jshint strict:false, maxparams:6 */

/*
 * cocotte-message
 * Copyright(c) 2013 Yuki Kurata <yuki.kurata@gmail.com>
 * MIT Licensed
 */

/*
 * dependencies
 */
var util = require('util');
var logg = require('cocotte-logger');

/**
 * variables
 */
var LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
var COLORS = {
  clear : '\033[0m',
  black : '\033[30m',
  brown : '\033[31m',
  green : '\033[32m',
  yellow: '\033[33m',
  blue  : '\033[34m',
  pink  : '\033[35m',
  cyan  : '\033[36m',
  gray  : '\033[90m',
  red   : '\033[91m'
};
var LEVEL_COLORS = {
  debug: COLORS.blue,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.pink,
  fatal: COLORS.red
};
var istty = require('tty').isatty(1);

var DEFAULT_LOGFILE_FORMAT = '[log]-YYYY-MM-DD.[txt]';

/**
 * コンソールにメッセージの出力します
 *
 * 次のような機能を持ちます
 *
 *  ・ファイル名と行数も表示する事が出来ます
 *
 *  ・ファイル名を短く表示する事が出来ます
 *    (msg.path設定時)
 *   
 *  ・色付きで読みやすく工夫されています
 *   
 *  ・メッセージの型に応じて出力形式を自動的に変更します
 *
 *  ・ログを出力するファイルを指定する事ができます
 *    (常に設定するにはmsg.loggの値により出力レベル毎に設定する事ができます)
 *
 * @class msg
 * @method msg
 * @static
 * @param {Mixed} message 
 * @param {Object} options 
 *    オプションで出力をコントロールできます
 *    level    : {String} コンソール出力のレベルを設定します
 *                debug: デバッグ。 (既定値)
 *                info:  情報。
 *                warn:  注意。エラーではないが通常ではない動作
 *                error: エラー。動作不良を起こす動作
 *                fatal: 致命的なエラー。動作の継続に支障を起こすエラー
 *
 *    label    : {String}   ラベルの文字列
 *                          既定値:levelの文字列のupperCase
 *
 *    logg     : {String}   書込みを行うファイルフォーマット、nullを設定すると書込みしません
 *                          フォーマットはmomentを参照
 *                          既定値:msg.logg依存 (レベル毎に設定されています)
 *
 *    caller   : {Function} 実行したファイルと行を表示する際に、排除する関数を指定すると
 *                          stacktraceをさかのぼります
 *
 *    bench    : {String}   ベンチマーク結果
 *
 *    noval    : {Boolean}  値の出力を省略する
 *
 *    trace    : {Boolean}  ログ出力時にファイル名と行数を追加するか
 */
var msg = function msg (message, options) {

  options = options || {};

  // エラーオブジェクトタイプ調査
  var isError = message instanceof Error;

  // メッセージのレベル名
  var level  = options.level || (isError ? 'error' : 'debug');
  if (!~LEVELS.indexOf(level)){
    level = 'debug';
  }

  // ラベル
  var label = typeof options.label ==='string' ? options.label : level.toUpperCase();
  if (msg.labelLength) {
    label = (label + '                    ').substring(0, msg.labelLength);
  }

  // 関数名・オブジェクトのコンストラクタ名など
  var name;

  // 出力値
  var value;

  switch (true) {
  case options.noval:
    value = '';
    break;
  case message === undefined:
  case message === null:
    name = null;
    value = message + '';
    break;

  case typeof message === 'string':
    name = null;
    value = '"' + message + '"';
    break;

  case typeof message === 'number':
  case typeof message === 'boolean':
  case message instanceof Date:
  case message instanceof RegExp:
    value = message.toString();
    break;

  case typeof message === 'function':
    name = 'Function';
    value = message.name || '';
    break;

  case isError:
    name = message.name;
    value = logg.stackShort(message);
    break;

  default:
    name = message.constructor.name || null;
    value = util.inspect(message, {depth: 3});
    break;
  }

  out(level, label, name, options.bench || '', value, options.caller);

  // ログに書込みするファイル名（フル）
  var logFile = options.logg === null || options.logg === false ? null :
        typeof options.logg === 'string' ? options.logg : msg.logFile[level];

  if (logFile) {

    var logText;
    if (isError) {
      logText = message;
    } else {
      logText = '[' + label + ']' + (name ? '(' + name + ')' : '') + (options.bench || '') +  ' ' + value;
    }

    var logOptions = {
      time: true,
      trace: options.trace || false,
      caller: options.caller || msg
    };

    logg(logText, logFile, logOptions);
  }

  return msg;
};

/**
 * ラベルの長さを固定長にする場合に指定
 * nullで可変長
 * @property {Number}
 */
msg.labelLength = null;

/**
 * コンソールに表示
 * @method out
 * @param  {String} level
 * @param  {String} label
 * @param  {String} name
 * @param  {String} value
 * @param  {Function} caller
 */
function out (level, label, name, bench, value, caller) {

  // スタック
  var stack = logg.getTrace(caller || msg);
  var file = stack.file;
  var line = stack.line;

  // 関数名
  var fname = stack.name || '';
  var fnameIdx = fname.indexOf(' ');
  if (fname.indexOf('null.') === 0) {
    fname = '';
  } else if (0 < fnameIdx) {
    fname = fname.substring(0, fnameIdx);
  }
  if (fname) {
    fname = ':' + fname;
  }

  // ファイルパスの略称
  if (Array.isArray(msg.path)) {
    msg.path.forEach(function(p) {
      file = file.replace(p, '');
    });
  }

  // 表示値の加工
  if (istty) {
    // -- 色つき --

    // メッセージのレベルに応じた色
    var lvColor = LEVEL_COLORS[level] || LEVEL_COLORS.debug;

    label = lvColor + '[' + label + ']';
    bench = bench ? COLORS.blue + bench + ' ' : '';
    name = name ? COLORS.gray + '(' + name + ')' : '';
    value = COLORS.black + value + COLORS.clear;
    file = COLORS.gray + ' ' + file + COLORS.green + '(' + line + fname + ')' + COLORS.clear;

  } else {
    // -- 色なし --
    label = '[' + label + ']';
    bench = bench ? bench + ' ' : '';
    name = name ? '(' + name + ') ': '';
    file = ' ' + file + '(' + line + fname + ')';
  }

  // 表示
  if (value.length < 200) {
    console.log(label + bench + name + value + file);

  } else {
    // 値の文字長が大きい場合は別行に値を表示する
    console.log(label + bench + name + file);
    console.log(value);
  }
}

/**
 * debugの表示のコントロール
 * trueの場合はホワイトリストに基づいてで表示します
 * falseの場合はブラックリストに基づいて表示します
 * @property {Boolean} isWhiteList
 */
msg.isWhiteList = false;

/**
 * ホワイトリスト
 * @property {Array} whiteList
 */
msg.whiteList = [];

/**
 * ブラックリスト
 * @property {Array} blackList
 */
msg.blackList = [];

// debugで出力するキーをホワイトリストで指定
if (typeof process.env.DEBUG === 'string') {
  msg.isWhiteList = true;
  msg.whiteList = process.env.DEBUG.split(',');
}

/**
 * デバッグメッセージを表示する関数を返す
 * @method debug
 * @param  {String} key
 * @return {Function}
 */
msg.debug = function debug (key) {
  'use strict';
  var last = new Date();

  return function debugc (message) {

    if (msg.isWhiteList) {
      if (!~msg.whiteList.indexOf(key)){
        return;
      }
    } else {
      if (~msg.blackList.indexOf(key)) {
        return;
      }
    }

    // ベンチマーク時間の記録
    var dt = new Date();
    var ms = getMs(last, dt);
    last = dt;

    var options = {};

    options.label = 'DEBUG:' + key;
    options.caller = debugc;
    options.bench = ms;
    options.noval = !arguments.length;
    msg(message, options);
  };
};

/**
 * デバッグ時の処理時間を理解しやすい文字列に変更
 * @method getMs
 * @param  {Date} last
 * @param  {Date} dt
 * @return {String}
 */
function getMs(last, dt) {
  var ms = dt - last;
  var val;
  if (ms >= 3600000) {
    val = (ms / 3600000).toFixed(1) + 'h';

  } else if (ms >= 60000) {
    val = (ms / 60000).toFixed(1) + 'm';

  } else if (ms >= 1000) {
    val =  (ms / 1000).toFixed(1) + 's';

  } else {
    val = ms + 'ms';
  }
  if (val.length < 5) {
    val = '     '.substring(0, 5 - val.length) + val;
  }
  return val;
}

/**
 * ログファイルを指定する関数を返す
 * @method logger
 * @param {String} level {String} 出力レベルを設定します
 *           debug: デバッグ。
 *           info:  情報。  (規定値)
 *           warn:  注意。エラーではないが通常ではない動作
 *           error: エラー。動作不良を起こす動作
 *           fatal: 致命的なエラー。動作の継続に支障を起こすエラー
 * @param  {String} file 書込みを行うファイルフォーマット
 *           フォーマットはmomentを参照
 *           既定値:'[log]-YYYY-MM-DD.[txt]'
 * @return {Function}
 */
msg.logger = function logger (level, file) {
  'use strict';

  level = !~LEVELS.indexOf(level) ? 'info': level;

  var logg = file || msg.logFile[level] || DEFAULT_LOGFILE_FORMAT;

  var options = {
    level: level,
    logg: logg,
    noval: false,
    trace: true,
  };

  var loggerc = function loggerc (message) {
    msg(message, options);
  };

  options.caller = loggerc;

  return loggerc;
};

/**
 * ログ出力先
 * 
 * レベル毎にログを出力するファイル名を設定する事が出来ます
 * 実際の処理はcocotte-loggerが行います
 * @property {Object}
 */
msg.logFile = {
  debug: null,
  info : null,
  warn : DEFAULT_LOGFILE_FORMAT,
  error: DEFAULT_LOGFILE_FORMAT,
  fatal: DEFAULT_LOGFILE_FORMAT
};

/**
 * パスを省略形で出力する際のルートのパスを設定します
 * @property {String}
 */
msg.path = [process.cwd() + '/'];

module.exports = exports = msg;
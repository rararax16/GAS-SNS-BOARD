/***************************************************************
 *webアプリケーションとして使用する場合の決まりのやり方
 ***************************************************************/
function doGet(e) {
  //更新処理中の場合、errorページを返す
  var htmlName = "error";
  if (updata_flg === 0) {
    htmlName = "index";
  }

  return HtmlService.createTemplateFromFile(htmlName).evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,initial-scale=1.0')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/***********************************************
 *WEBアプリケーションのURLを渡す
 **********************************************/
function getScriptUrl() {
  var url = ScriptApp.getService().getUrl();
  return url;
}

/********************************************************************
 * アプリケーションアクセス時、初回データ取得情報
 * return : [array]  .user_id : Gsuiteアドレス
 *                  .reload_url : 再読み込み時に使用する自信のURL
 *                  .access_key : データ更新時に使用するアクセスキー
 *******************************************************************/
function gas_get_firstInfo() {
  //webアプリケーションのURLを取得
  var reload_url = getScriptUrl();

  var json = {
    "user_id": user_id
    , "reload_url": reload_url
    , "access_key": access_key
  }
  return json
}

/********************************************************************
 * 投稿一覧を全て取得する
 * @param1 : タイムスタンプのソート順
 *******************************************************************/
function get_all_sns(sort) {
  //掲示板投稿内容を一覧で取得
  var sns_list_array = data_sheet.getRange(1, 1, data_sheet.getLastRow(), data_sheet.getLastColumn()).getValues();

  //投稿のタイムスタンプで並び替え
  //  0 : 昇順
  //  1 : 降順
  if (sort === 0) {
    sns_list_array.sort(function (a, b) {
      if (a[3] < b[3]) return -1;
      if (a[3] > b[3]) return 1;
      return 0;
    });
  }
  else {
    sns_list_array.sort(function (a, b) {
      if (a[3] > b[3]) return -1;
      if (a[3] < b[3]) return 1;
      return 0;
    });
  }

  return sns_list_array
}

/********************************************************************
 * フロントに返すための配列を作成
 * @param1 : [array]投稿一覧
 *******************************************************************/
function set_sns_list_json(array_list) {
  //結果を格納する変数
  var out_list_array = [];

  for (i in array_list) {
    var setArray = {
      "card_no": array_list[i][0]
      , "card_no_title1": array_list[i][0] + "_title1"
      , "card_no_title2": array_list[i][0] + "_title2"
      , "card_no_title3": array_list[i][0] + "_title3"
      , "card_no_title4": array_list[i][0] + "_title4"
      , "card_no_title5": array_list[i][0] + "_title5"
      , "postDate": Utilities.formatDate(new Date(array_list[i][3]), "JST", "yyyy/MM/dd HH:mm")
      , "userAccount": array_list[i][4]
      , "userName": array_list[i][5]
      , "title": array_list[i][6]
      , "text": array_list[i][7]
      , "linkURL": array_list[i][8]
      , "fileURL": array_list[i][9]
    }
    out_list_array.push(setArray);
  }
  return out_list_array;
}

/********************************************************************
 * 返信一覧の取得と、投稿内容の既読者更新
 * @param1 : 投稿No.
 *******************************************************************/
function gas_getReply_readUpdata(replyNo) {
  //投稿データを昇順で取得
  var sns_list_array = get_all_sns(0);

  //親IDと一致し、削除フラグがついていないデータに絞り込む
  var sns_list_array_limit = sns_list_array.filter(function (array) {
    var result = false;
    if (array[1] === replyNo && array[2] === 0) {
      result = true;
    }
    return result
  });

  //既読の名前を取得。名前が取得できない場合、アドレスで代用
  var read_name = "";
  if (user_name === "") {
    read_name = user_id;
  }
  else {
    read_name = user_name;
  }

  //投稿No.の既読セルオブジュエクトを取得
  var read_cell = data_sheet.getRange(replyNo, 11)

  //投稿No.の既読一覧内容を取得(カンマ区切り)し、配列に格納
  var read_data = read_cell.getValue();
  var read_array = read_data.split(",");

  //以前に投稿内容を確認してるか名前で検索を実施
  var read_result = false;
  for (i in read_array) {
    if (read_name === read_array[i]) {
      read_result = true;
      break;
    }
  }

  //以前に既読していない場合、既読データに名前をしセルを更新
  if (!read_result) {
    read_data = read_data + read_name + ",";
    read_cell.setValue(read_data);
  }

  //フロントに返すための返信一覧と既読一覧を作成
  var out_list_array = set_sns_list_json(sns_list_array_limit);
  var out_read_list = read_data.split(",");

  var json = {
    "out_list_array": out_list_array
    , "out_read_list": out_read_list
  }
  return json
}

/***************************************************************
 *掲示板投稿内容を取得
 * @param1 : 取得行数
 * @param2 : 検索ワード
 ***************************************************************/
function gas_get_sns(row, word) {

  //掲示板投稿内容を一覧降順で取得
  var sns_list_array = get_all_sns(1);

  //検索結果のリミット件数を取得
  var limitRow = row + 10;

  //検索ワードを[半角スペース]区切りで配列に格納
  var searchName_chg = word.replace(/　/g, " ")
  var searchName_array = searchName_chg.split(" ");

  /*以下の内容でデータを絞り込む
      親IDが無いデータ
      削除フラグがついていないデータ
      検索ワード（複数部分一致）に一致するデータ
  */
  var sns_list_array_limit = sns_list_array.filter(function (array) {
    var result = false;

    //投稿データの親で削除していないデータのみに絞り込む
    if (array[1] === "" && array[2] === 0) {
      //検索ワードに入力がある場合、部分一致するデータに絞り込む
      if (word != "") {
        //検索ワードの配列（複数ワード）だけ繰り返す
        for (var i = 0; i < searchName_array.length; i++) {
          if (searchName_array[i] != "") {
            if (array[4].indexOf(searchName_array[i]) > -1
              || array[5].indexOf(searchName_array[i]) > -1
              || array[6].indexOf(searchName_array[i]) > -1
              || array[7].indexOf(searchName_array[i]) > -1
            ) {
              result = true;
            }
            else {
              result = false;
              break;
            }
          }
        }
      }
      else {
        result = true;
      }
    }
    return result
  });


  //フロントに返すためにデータを作成
  var get_list_array = set_sns_list_json(sns_list_array_limit, row, limitRow);

  //次回検索開始No.と検索リミット結果の変数
  var nextRow = 0;
  var out_list_array = [];

  //絞り込んだデータがリミットより多い場合、リミット数のみにデータを制限
  if (limitRow < get_list_array.length) {
    nextRow = limitRow + 1;
    for (var i = row; i < limitRow; i++) {
      out_list_array.push(get_list_array[i]);
    }
  } else {
    //絞り込んだデータがリミット以下の場合は、データの数だけ結果の配列に格納
    for (var i = row; i < get_list_array.length; i++) {
      out_list_array.push(get_list_array[i]);
    }
  }

  var json = {
    "out_list_array": out_list_array
    , "nextRow": nextRow
  }

  return json;
}

/***************************************************************
 *掲示シートのデータの追加
 * @param1 : [array]   .title : 投稿タイトル
 *                      .text : 投稿本文
 *                      .link : 投稿URL
 *                      .fileURL : 投稿添付ファイルURL
 *                      .mother_no : 投稿親No.
 ***************************************************************/
function post_sns(json) {
  //タイムスタンプを取得
  var date_now = get_dateNow();

  //フルネームが取得できない場合、アドレスを代用
  var set_name = user_name;
  if (user_name === "") {
    set_name = user_name
  }


  //シートに追加する形成にし、投稿シートに追加
  var set_array = ["=Row()", json.mother_no, 0, date_now, user_id, set_name, json.title, json.text, json.link, json.fileURL];
  data_sheet.appendRow(set_array);
}

/***************************************************************
 *掲示板に新規投稿
 * @param1 : [form]   : new_access_key : 投稿アクセスキー
 *                      : new_file : 添付ファイルオブジェクト
 *                      : new_title : 投稿タイトル
 *                      : new_text : 投稿本文
 *                      : new_link : 投稿URL
 ***************************************************************/
function gas_post_newSns(sns_form) {
  //新規投稿処理時のエラー番号(0は正常)
  var err_no = 0;

  //更新処理が実施中の場合、エラー番号を更新する
  if (updata_bat_flg()) {
    err_no = 1;
  }

  //アクセスキーが変わっていた（投稿データの退避処理実施時に変更）場合、エラー番号を更新する
  if (!access_key_chk(sns_form.new_access_key)) {
    err_no = 2;
  }

  //チェック処理を通過した場合、掲示のシートに投稿を追加する
  if (err_no === 0) {

    //添付ファイルオブジェクトを取得
    var file_obj = sns_form.new_file;

    //添付ファイルがある場合googleドライブに添付ファイルを保存し、結果のIDを取得する
    var fileURL = "";
    if (file_obj.name != null && file_obj.name != "") {
      fileURL = folder.createFile(file_obj).getId();

      //googleDriveのリンクURLを作成
      fileURL = file_url + fileURL
    }

    var set_json = {
      "title": sns_form.new_title
      , "text": sns_form.new_text
      , "link": sns_form.new_link
      , "fileURL": fileURL
      , "mother_no": ""
    }

    //投稿シートにデータ更新処理を実施
    post_sns(set_json);
  }


  var json = {
    "err_no": err_no
    , "screen_no": 0
  }
  return json
}

/****************************************************************
 * 掲示板の対して返信を行ったデータの更新処理
 * @param : [array] json   : text : 返信投稿本文
 *                          : link :  返信URL
 *                          : mother_no : 返信元投稿No.
 *                          : mother_title : 返信元投稿タイトル
 *                          : mail_flg : メール送信フラグ
 *                          : to_mailAddress : 送信先メールアドレス
 ***************************************************************/
function gas_post_replySns(json) {

  //返信投稿処理時のエラー番号(0は正常)
  var err_no = 0;

  //更新処理が実施中の場合、エラー番号を更新する
  if (updata_bat_flg()) {
    err_no = 1;
  }

  //アクセスキーが変わっていた（投稿データの退避処理実施時に変更）場合、エラー番号を更新する
  if (!access_key_chk(json.access_key)) {
    err_no = 2;
  }

  //チェック処理を通過した場合、掲示のシートに投稿を追加する
  if (err_no === 0) {
    var set_json = {
      "title": ""
      , "text": json.text
      , "link": json.link
      , "fileURL": ""
      , "mother_no": json.mother_no
    }

    //返信内容をシートに追加処理
    post_sns(set_json);

    //メール送信フラグがtrueの場合、返信元のアドレスにメールを送信
    if (json.mail_flg) {
      var webURL = getScriptUrl();

      var text = "こんにちは。\n以下のコメントを投稿しています。\n";
      text = text + "\n";
      text = text + "[コメント内容]\n";
      text = text + json.text + "\n";
      text = text + "\n";
      text = text + "詳細はのURLから確認をしてください。\n";
      text = text + webURL;

      var set_json = {
        "to_address": json.to_mailAddress
        , "title": "掲示板[" + json.mother_title + "]にコメントを記入しました。"
        , "text": text
      }
      send_mail(set_json);
    }
  }

  var json = {
    "err_no": err_no
    , "screen_no": 1
  }

  return json
}

/*********************************************************
 * 投稿、返信内容の削除
 *
 **********************************************************/
function gas_sns_delete(json) {
  var err_no = 0;

  var card_no = json.card_no

  if (updata_bat_flg()) {
    err_no = 1;
  }

  if (!access_key_chk(json.access_key)) {
    err_no = 2;
  }


  var target_user_account = data_sheet.getRange(card_no, 5).getValue();
  if (user_id !== target_user_account) {
    err_flg = 3;
  }

  if (err_no === 0) {
    data_sheet.getRange(card_no, 3).setValue(1);
  }

  var json = {
    "err_flg": err_no
    , "screen_no": json.screen_no
  }
  return json;
}

/****************************************************************
 * メールの送信
 * @param : [array] json   : to_address : 送信先アドレス
 *                          : title : メール件名
 *                          : text : メール本文
 ***************************************************************/
function send_mail(json) {
  MailApp.sendEmail(json.to_address, json.title, json.text);
}

/****************************************************************
 * バッチ処理中か確認処理
 *
 ***************************************************************/
function updata_bat_flg() {
  var result = false;
  if (updata_flg === 1) {

    doGet()
    result = true;
  }
  return result

}

/****************************************************************
 * バックアップ処理が実行された場合、キーが変わるため
 *  バックアップ処理が行われたかの確認
 ***************************************************************/
function access_key_chk(select_access_key) {
  var result = false;

  if (access_key === select_access_key) {
    result = true;
  }

  return result
}

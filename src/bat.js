/***********************************************************************************
* バッチ処理
* スプレッドシートの使用セル数を確認し、490万セル以上使用している場合
* バックアップ処理を実行
* 直近の投稿内容と、返信一覧は残す
***********************************************************************************/
function back_up_bat() {

  //バックアップ処理を実行する基準の使用セル数
  var limit_cell = 4900000

  try {
    //バッチ処理フラグを[1]に更新　[1]の間webアプリケーションにアクセスできない仕様
    var updata_flg = setting_sheet.getRange(1, 2).setValue(1);

    //投稿一覧シートIDとシートオブジェクトを取得
    var data_ID = setting_sheet.getRange(3, 2).getValue();
    var data_sheet = SpreadsheetApp.openById(data_ID).getSheetByName("data");

    //データの最終行と最終列を取得
    var col_cnt = data_sheet.getLastColumn();
    var row_cnt = data_sheet.getLastRow();

    //使用セル数を取得 Zセルまである想定
    var use_cell_cnt = col_cnt * 26;

    //使用しているセルが上限を超えている場合、バックアップ処理を実行
    if (use_cell_cnt >= limit_cell) {
      /*++++++++++++++++++++++++++++++++++++++++++++
      + バックアップ処理
      +++++++++++++++++++++++++++++++++++++++++++++*/
      //スプレッドシートファイルオブジェクトを取得
      var bk_file = DriveApp.getFileById(data_ID);

      //バックアップ保存先のファルダーIDとファルダーオブジェクトを取得
      var bk_folder_ID = setting_sheet.getRange(6, 2).getValue();
      var bk_folder = DriveApp.getFolderById(bk_folder_ID);

      //バックアップファイル名を取得、設定
      var bk_name = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy年MM月dd日_掲示板バックアップ');

      //バックアップ処理を実行
      var bk_id = bk_file.makeCopy(bk_name, bk_folder).getId();

      //バックアップ結果を追加
      SpreadsheetApp.openById(datahistory_id).getSheetByName("setting").appendRow([bk_name , bk_id]);

      /*++++++++++++++++++++++++++++++++++++++++++++
      + 新規掲示板保持データに直近10件の投稿内容と返信一覧を再設定
      +++++++++++++++++++++++++++++++++++++++++++++*/

      //掲示板の投稿データを一括取得
      var data_list_array = data_sheet.getRange(1, 1, row_cnt, col_cnt).getValues();

      //掲示板の投稿元のみに絞り込み結果を取得
      var mother_list = data_list_array.filter(function (array) {
        var result = false;

        if (array[1] === "" && array[2] === 0) {
          result = true;
        }
        return result
      })

      //投稿に対しての返信のみに絞り込み結果を取得
      var replay_list = data_list_array.filter(function (array) {
        var result = false;

        if (array[1] != "" && array[2] === 0) {
          result = true;
        }

        return result
      })

      //カラム列名を取得
      var col_name = data_list_array[0];

      //掲示板の直近10件のデータと返信一覧を格納する配列
      var newData_first_list = [col_name];

      //掲示板の親Noを振り直しを行うために使用する配列
      var newData_motherNo = [];

      //新たな親IDの配列変数
      var cnt = 0;

      //掲示板の親が10件以上の場合は、直近の10件を取得する
      if (mother_list.length >= 10) {

        //直近10件の掲示板IDの振り直した結果を配列に格納
        for (var i = mother_list.length - 10; i < mother_list.length; i++) {
          newData_motherNo.push(mother_list[i][0]);
          mother_list[i][0] = "=row()";

          newData_first_list.push(mother_list[i]);

          cnt++;
        }
      }
      else {
        //全親データの掲示板IDの振り直した結果を配列に格納
        for (var i = 0; i < mother_list.length; i++) {
          newData_motherNo.push(mother_list[i][0]);
          mother_list[i][0] = "=row()";

          newData_first_list.push(mother_list[i]);

          cnt++;
        }
      }

      //新たな掲示板に残す内容の返信投稿を掲示板IDと親IDを振り直す
      for (var i = 0; i < replay_list.length; i++) {
        var result = false;

        //返信の一覧データから掲示板に残す投稿内容に対しての返信があるか確認
        for (var n = 0; n < newData_motherNo.length; n++) {
          if (replay_list[i][1] == newData_motherNo[n]) {
            replay_list[i][0] = "=row()";
            replay_list[i][1] = n + 2;
            result = true;
            break;
          }

        }

        //返信内容がある場合、配列に格納する
        if (result) {
          newData_first_list.push(replay_list[i]);
        }
      }

      //掲示板保持シートをクリアする
      data_sheet.clearContents();

      //直近掲示板の結果を格納した配列をフレッドシートに貼り付ける
      data_sheet.getRange(1, 1, newData_first_list.length, col_cnt).setValues(newData_first_list);

      //L列からZ列を削除する
      data_sheet.deleteColumns(12, 14);

      //アクセスキーの変更
      var new_key = ""
      for (var i = 0; i < 10; i++) {
        new_key += String(Math.floor(Math.random() * 10));
      }
      setting_sheet.getRange(2, 2).setValue(new_key);

      //メール本文の内容を更新
      Logger.log("バックアップ実行しました。");
    }
    else {
      //メール本文の内容を更新
      Logger.log("バックアップ不要でした。");
    }

    //バッチ処理フラグを[0]に更新
    setting_sheet.getRange(1, 2).setValue(0);
  }
  catch (e) {
    //メール本文の内容を更新
    Logger.log("バックアップに不具合が生じました。\n" + e);


    //バッチ処理フラグを[0]に更新
    setting_sheet.getRange(1, 2).setValue(0);

  }
}

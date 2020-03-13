/***************************************************************
 * グローバル変数
 **************************************************************/
//添付ファイルを表示するためのURL
var file_url = "https://drive.google.com/open?id=";

//設定スプレッドシートIDと設定シートオブジェクトの取得
var setting_ID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
var setting_sheet = SpreadsheetApp.openById(setting_ID).getSheetByName("setting");

//設定シートから情報を２次元配列で取得
var setting_data_array = setting_sheet.getRange(1, 1, setting_sheet.getLastRow(), setting_sheet.getLastColumn()).getValues();

//バッチ処理を行なっているか区分
var updata_flg = setting_data_array[0][1];

//データ更新時のアクセスキー
var access_key = setting_data_array[1][1];

//投稿データを保持しているスプレッドシートID とシートオブジェクト
var data_ID = setting_data_array[2][1];
var data_sheet = SpreadsheetApp.openById(data_ID).getSheetByName("data");

//添付ファイル格納フォルダIDと、フォルダオブジェクト
var dbFolder_id = setting_data_array[4][1];
var folder = DriveApp.getFolderById(dbFolder_id);

//バックアップ処理結果ID
var datahistory_id =  setting_data_array[3][1];

//処理実行時間を[yyyy/MM/dd HH:mm:ss]形式で取得
var get_dateNow = function () {
  return Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss")
}

//アクセスしたgoogle情報を取得
var user_id = Session.getActiveUser().getEmail();

//Gsuiteアカウントからコンタクトオブジェクトを取得
var user_name_chk = ContactsApp.getContact(user_id);

//コンタクトオブジェクトが取れた場合、フルネームを取得
var user_name = "";
if (user_name_chk != null) {
  user_name = user_name_chk.getFullName();
}

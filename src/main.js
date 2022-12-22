function doGet() {
  return HtmlService.createTemplateFromFile('index.html').evaluate();
}

function getSnsData(keyWord, startRow) {

  const snsBoard = new SnsBoard();

  const data = snsBoard.getDataByKeyWord(keyWord, startRow);

  return data;
}

function getReplayData(id, startRow) {
  const snsBoard = new SnsBoard();

  const res = snsBoard.getCommentDataById(id, startRow);
  return res;

}

function newPostSns(param) {
  const snsBoard = new SnsBoard();

  const res = snsBoard.addData(param);
  return res;

}

function updateData(param) {
  const snsBoard = new SnsBoard();

  const res = snsBoard.updateData(param);
  return res;
}
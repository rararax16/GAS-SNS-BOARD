class SnsBoard {
  constructor() {
    this.sheet = SpreadsheetApp.openByUrl(SNS_BOARD_URL).getSheetByName(SNS_BOARD_SHEET_NAME);
  }

  getAllData(){
    const snsDataList = this.sheet.getDataRange().getValues();
    return snsDataList;
  }

  clearAllData(){
    const snsDataList = this.getAllData();
    const header = snsDataList[0];
    this.sheet.clear();
    this.sheet.getRange(1, 1, 1, header.length).setValues([header])
  }

  addDataList(dataList){
    if(dataList.length == 0) return;
    this.sheet.getRange(2, 1, dataList.length, dataList[0].length).setValues(dataList);
  }

  getDataByKeyWord(keyWord, startRow) {

    const snsDataList = this.getAllData();
    snsDataList.shift();
    snsDataList.reverse();

    let resultSnsDataList = [];

    const user = new User();

    snsDataList.forEach(snsData => {
      if (snsData[2] == 1) return;
      if (snsData[1] != '' && snsData[1] != null) return;

      const timestampBase = new Date(snsData[3]);
      const timestamp = `${timestampBase.getFullYear()}/${timestampBase.getMonth() + 1}/${timestampBase.getDate()}(${('0' + timestampBase.getHours()).slice(-2)}:${('0' + timestampBase.getMinutes()).slice(-2)})`

      const result = {
        id: snsData[0],
        timestamp: timestamp,
        postUserEmail: snsData[4],
        postUserName: snsData[5],
        userImageUrl: snsData[6],
        title: snsData[7],
        message: snsData[8],
        linkUrl: snsData[9],
        fileUrl: snsData[10],
        viewer: snsData[11].replaceAll(',', ' / '),
        replay: [],
        isOwner: user.emailAddress == snsData[4] ? true : false,
        isRead: snsData[11].includes(user.name) ? true : false
      }

      resultSnsDataList.push(result);
    });

    if (
      keyWord != '' &&
      keyWord != '　' &&
      keyWord != ' ' &&
      keyWord != null
    ) {
      const keyWordFormat = keyWord.replaceAll('　', ' ');

      const keyWordList = keyWordFormat.split(' ');

      resultSnsDataList = resultSnsDataList.filter(resultSnsData => {
        let result = false;
        keyWordList.forEach(word => {
          if (
            resultSnsData.title.includes(word) ||
            resultSnsData.message.includes(word)
          ) {
            result = true
          }
          else {
            result = false;
          };
        });
        return result;
      })
    }

    let endRow = startRow + Number(SNS_DISPLAY_COUNT);
    let finishFlag = false;
    if(resultSnsDataList.length <= endRow){
      endRow = endRow.length;
      finishFlag = true;
    }
    resultSnsDataList = resultSnsDataList.slice(startRow, endRow);

    return {
      data: resultSnsDataList,
      nextRow: finishFlag ? null : endRow
    };
  }

  getCommentDataById(id, startRow) {
    const user = new User();
    const snsDataList = this.getAllData();
    snsDataList.reverse();

    let resultList = [];

    snsDataList.forEach(snsData => {
      if(snsData[2] == 1) return;
      if(snsData[1] != id) return;

      const timestampBase = new Date(snsData[3]);
      const timestamp = `${timestampBase.getFullYear()}/${timestampBase.getMonth() + 1}/${timestampBase.getDate()}(${('0' + timestampBase.getHours()).slice(-2)}:${('0' + timestampBase.getMinutes()).slice(-2)})`

      const result = {
        id: snsData[0],
        timestamp: timestamp,
        postUserEmail: snsData[4],
        postUserName: snsData[5],
        userImageUrl: snsData[6],
        title: snsData[7],
        message: snsData[8],
        linkUrl: snsData[9],
        fileUrl: snsData[10],
        viewer: snsData[11].replaceAll(',', ' / '),
        isOwner: user.emailAddress == snsData[4] ? true : false
      }
      resultList.push(result);
    })

    let finishFlag = false;
    let endRow = startRow + Number(COMMENT_DISPLAY_COUNT);
    if(resultList.length <= endRow){
      endRow = endRow.length;
      finishFlag = true;
    }
    resultList = resultList.slice(startRow, endRow);

    return {
      data: resultList,
      nextRow: finishFlag ? null : endRow
    };
  }

  addData(param) {
    let imageUrl = '';

    if (param.inputFile.name != null && param.inputFile.name != '') {
      let folderId = String(UPLOAD_FOLDER_URL).replace('/folders/', '$');
      folderId = folderId.substring(folderId.indexOf('$') + 1, folderId.length);
      const _pos = folderId.indexOf('?');
      if (_pos >= 0) {
        folderId = folderId.substring(0, _pos);
      }
      const folder = DriveApp.getFolderById(folderId)
      imageUrl = 'https://drive.google.com/open?id=' + folder.createFile(param.inputFile).getId();
    };

    const user = new User();
    const uuid = Utilities.getUuid();

    const timestamp = Utilities.formatDate(new Date(),'JST', 'yyyy-MM-dd HH:mm:ss')

    const insertformat = [
      uuid,
      param.pearentId,
      0,
      timestamp,
      user.emailAddress,
      user.name,
      user.imageUrl,
      param.inputTitle,
      param.inputMessage,
      param.inputUrl,
      imageUrl
    ];

    this.sheet.appendRow(insertformat);

    const result = {
      id: uuid,
      isOwner: true
    }
    return result
  }

  updateData(param) {
    const dataList = this.getAllData();

    const updateTargetIndex = dataList.findIndex(data => data[0] == param.id);

    if (updateTargetIndex < 0) throw new Error('投稿データがありません');

    const updateData = dataList[updateTargetIndex];

    const user = new User();

    if (param.isDelete) {
      updateData[2] = 1;
    }

    if (param.isViewer) {
      if (updateData[11].includes(user.name)) return;
      updateData[11] = updateData[11] + user.name + ',';
    }
    this.sheet.getRange(updateTargetIndex + 1, 1, 1, updateData.length).setValues([updateData]);

    return true;
  }
}


class User {
  constructor() {
    this.emailAddress = String(Session.getActiveUser().getEmail());

    const people = People.People.get(
      'people/me', {
      personFields: 'names,photos'
    })
    this.name = String(people.names[0].displayName);
    this.imageUrl = String(people.photos[0].url);
  }
};

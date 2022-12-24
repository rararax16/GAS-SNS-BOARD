function organizeSnsData() {
  const snsBoard = new SnsBoard();

  const snsDataList = snsBoard.getAllData();

  snsDataList.shift();

  let resultData = [];
  const deleteParentList = [];

  resultData = snsDataList.filter(snsData => {
    let result = true;
    if(snsData[2] == 1) {
      result = false;
      if(snsData[1] == '') {
        deleteParentList.push(snsData[0]);
      }
    }
    return result
  });

  resultData = resultData.filter(snsData => {
    let result = true;
    if(deleteParentList.includes(snsData[1])){
      result = false;
    }
    return result
  });


  snsBoard.clearAllData();
  snsBoard.addDataList(resultData);

}
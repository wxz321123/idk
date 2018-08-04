'use strict';
const fs = require('fs');
const fileTag = ['A', 'B'];
const logger = fs.createWriteStream('submit_20180731-174400.csv', {
    flags: 'w' // 'a' means appending (old data will be preserved)
});
fileTag.forEach(file => {
    const data = require(`./output/dataset_${file}.json`).serverList;
    const inputData = require(`./metaElaborated/formatted_${file}.json`); //.serverType; //app_identity
    data.forEach(serverPopolation => {
        if (serverPopolation.appList.length > 0) {
            serverPopolation
                .appList
                .forEach(app => {
                    logger.write(`inst_${inputData.app_identity[app].istanceList[0] + 1},machine_${inputData.serverType[serverPopolation.type_index].list_server_id[0] + 1}\n`);
                    inputData
                        .app_identity[app]
                        .istanceList
                        .splice(0, 1);
                })
            inputData
                .serverType[serverPopolation.type_index]
                .list_server_id
                .splice(0, 1);
        }
    })
    if (file == 'A') {
        logger.write('#\n');
    }
});
logger.end() // close string
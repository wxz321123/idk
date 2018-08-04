'use strict';
const fs = require('fs');
const inputFileName = "scheduling_preliminary_a_instance_deploy_20180606.json";
const inputData = require(`../jsonSource/${inputFileName}`).data;
const data = [];
inputData.forEach(app => {
    data.push({
        id_app: parseInt(app.id_app.substring(4)),
        id_server: parseInt(app.id_server.substring(8)),
        id_istance: parseInt(app.id.substring(5))
    });
});
fs.writeFile(`./${inputFileName}`, JSON.stringify({data}), (err) => {
    if (err) {
        return console.log(err);
    };
});
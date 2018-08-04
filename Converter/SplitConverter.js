'use strict';
const fs = require('fs');
const inputFileName = "scheduling_preliminary_a_app_resources_20180606.json";
const inputData = require(`../jsonSource/${inputFileName}`).data;
const outputData = [];
inputData.forEach(app => {
    const data = {
        id_app: parseInt(app.id_app.substring(4)),
        memory: parseFloat(app.memory),
        cpu: [],
        ram: [],
        pm: parseInt(app.pm),
        p: parseInt(app.p),
        m: parseInt(app.m)
    }
    app
        .cpu
        .split('|')
        .forEach(el => {
            data
                .cpu
                .push(parseFloat(el));
        });
    app
        .ram
        .split('|')
        .forEach(el => {
            data
                .ram
                .push(parseFloat(el));
        })
    outputData.push(data);
});
const data = outputData;
fs.writeFile(`./${inputFileName}`, JSON.stringify({data}), (err) => {
    if (err) {
        return console.log(err);
    };
});
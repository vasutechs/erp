erpConfig.moduleFiles.productionEntryReport = function(context) {
    return {
        callBackList: function() {
            if (context.commonFact.location.search() && context.commonFact.location.search()['type']) {
                context.controller.methods[context.commonFact.location.search()['type']]();
            } else {
                context.controller.methods.productionEntryReport();
            }
        },
        toolHistoryCard: function() {
            var list = [];
            context.controller.listViewData = [];
            context.controller.methods.getAllYearData().then(function(listViewYearData) {
                for (var x in listViewYearData) {
                    var listViewData = listViewYearData[x];
                    for (var i in listViewData) {
                        var frmDate = context.filterView.data['frmDate'];
                        var toDate = context.filterView.data['toDate'];
                        var filterToolNo = context.filterView.data['toolNo'];
                        var filterPartNo = context.filterView.data['partNo'];
                        var partNo = listViewData[i]['partNo'];

                        for (var j in listViewData[i].mapping) {
                            var toolNo = listViewData[i].mapping[j].toolNo;
                            var date = new Date(listViewData[i].mapping[j].date);
                            if ((!filterToolNo || (toolNo === filterToolNo)) && (!filterPartNo || (partNo === filterPartNo)) && (!frmDate || (frmDate && new Date(frmDate) <= date)) && (!toDate || toDate && new Date(toDate) >= date)) {
                                var details = {
                                    partNo: partNo,
                                    toolNo: toolNo,
                                    qty: listViewData[i].mapping[j].acceptedQty,
                                    activity: listViewData[i].mapping[j].operationTo,
                                    date: listViewData[i].mapping[j].date,
                                    cummulativeQty: parseInt(listViewData[i].mapping[j].acceptedQty)
                                };

                                var isPartExist = context.commonFact.findObjectByKey(list, { toolNo: details.toolNo, partNo: details.partNo });
                                if (isPartExist) {
                                    details.cummulativeQty += parseInt(isPartExist.cummulativeQty);
                                }
                                list.push(details);
                            }
                        }
                    }
                }
                context.controller.listViewData = list;
            });

        },
        machineRunningTime: function() {
            var list = [];
            context.controller.listViewData = [];
            context.controller.methods.getAllYearData().then(function(listViewYearData) {
                for (var x in listViewYearData) {
                    var listViewData = listViewYearData[x];
                    for (var i in listViewData) {
                        var frmDate = context.filterView.data['frmDate'];
                        var toDate = context.filterView.data['toDate'];
                        var filterMachineNo = context.filterView.data['machineNo'];

                        for (var j in listViewData[i].mapping) {
                            var date = new Date(listViewData[i].mapping[j].date);
                            var machineNo = listViewData[i].mapping[j]['machineNo'];
                            if ((!filterMachineNo || (machineNo === filterMachineNo)) && (!frmDate || (frmDate && new Date(frmDate) <= date)) && (!toDate || toDate && new Date(toDate) >= date)) {
                                var details = {
                                    machineNo: machineNo,
                                    date: listViewData[i].mapping[j].date,
                                    startTime: listViewData[i].mapping[j].startTime,
                                    endTime: listViewData[i].mapping[j].endTime
                                };

                                details.runningTime = details.cumRunningTime = parseFloat(details.endTime) - parseFloat(details.startTime);
                                var isExist = context.commonFact.findObjectByKey(list, { machineNo: details.machineNo });
                                if (isExist) {
                                    details.cumRunningTime += parseFloat(isExist.cumRunningTime);
                                }
                                list.push(details);
                            }
                        }
                    }
                }
                context.controller.listViewData = list;
            });

        },
        empPerformanceReport: function() {
            var list = [];
            var listViewData = angular.copy(context.controller.listViewDataMaster);
            for (var i in listViewData) {
                var frmDate = context.filterView.data['frmDate'];
                var toDate = context.filterView.data['toDate'];
                var filterPartNo = context.filterView.data['partNo'];
                var partNo = listViewData[i]['partNo'];
                var filterOperator = context.filterView.data['operator'];

                for (var j in listViewData[i].mapping) {
                    var date = new Date(listViewData[i].mapping[j].date);
                    var operator = listViewData[i].mapping[j].operator;
                    if ((!filterPartNo || (partNo === filterPartNo)) && (!filterOperator || (operator === filterOperator)) && (!frmDate || (frmDate && new Date(frmDate) <= date)) && (!toDate || toDate && new Date(toDate) >= date)) {
                        var details = {
                            partNo: partNo,
                            date: listViewData[i].mapping[j].date,
                            startTime: listViewData[i].mapping[j].startTime,
                            endTime: listViewData[i].mapping[j].endTime,
                            operator: operator,
                            operationTo: listViewData[i].mapping[j].operationTo,
                            planQty: listViewData[i].mapping[j].planQty,
                            acceptedQty: listViewData[i].mapping[j].acceptedQty
                        };
                        list.push(details);
                    }
                }
            }
            context.controller.listViewData = list;
        },
        productionEntryReport: function() {
            var list = [];
            var listViewData = angular.copy(context.controller.listViewDataMaster);

            for (var i in listViewData) {
                var frmDate = context.filterView.data['frmDate'];
                var toDate = context.filterView.data['toDate'];

                for (var j in listViewData[i].mapping) {
                    var date = new Date(listViewData[i].mapping[j].date);
                    var machineNo = listViewData[i].mapping[j]['machineNo'];
                    if ((!frmDate || (frmDate && new Date(frmDate) <= date)) && (!toDate || toDate && new Date(toDate) >= date)) {
                        var details = {
                            machineNo: machineNo,
                            jobCardNo: listViewData[i].jobCardNo,
                            partNo: listViewData[i].partNo,
                            operationFrom: listViewData[i].mapping[j].operationFrom,
                            operationTo: listViewData[i].mapping[j].operationTo,
                            toolNo: listViewData[i].mapping[j].toolNo,
                            operator: listViewData[i].mapping[j].operator,
                            startTime: listViewData[i].mapping[j].startTime,
                            endTime: listViewData[i].mapping[j].endTime,
                            planQty: listViewData[i].mapping[j].planQty,
                            acceptedQty: listViewData[i].mapping[j].acceptedQty,
                            rejectionQty: listViewData[i].mapping[j].rejectionQty,
                            rwQty: listViewData[i].mapping[j].rwQty,
                            date: listViewData[i].mapping[j].date
                        };
                        list.push(details);
                    }
                }
            }
            context.controller.listViewData = list;
        },
        getAllYearData: function() {
            var listOfDbsConfig = {
                id: 'getDatabases',
                services: {
                    list: {
                        method: 'GET',
                        params: {
                            year: true
                        }
                    }
                }
            };
            var prodTabConfig = context.erpAppConfig.modules.controllers.report.productionEntryReport.services.list;
            var dataList = [];
            return context.commonFact.getData(listOfDbsConfig).then(function(res) {
                var listOfDbs = res.data.list;
                var listOfDbsProm = [];
                for (var i in listOfDbs) {
                    var serConf = angular.copy(prodTabConfig);
                    serConf.services.list.params.year = listOfDbs[i];
                    listOfDbsProm.push(context.commonFact.getData(serConf).then(function(prodRes) {
                        dataList.push(prodRes.data);
                    }));
                }
                return Promise.all(listOfDbsProm).then(function() {
                    return dataList;
                });
            });
        }
    };
};

erpConfig.moduleFiles.toolHistoryCard = erpConfig.moduleFiles.empPerformanceReport = erpConfig.moduleFiles.machineRunningTime = erpConfig.moduleFiles.productionEntryReport;
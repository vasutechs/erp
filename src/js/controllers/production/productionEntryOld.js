erpApp.controller('productionEntryOldCtrl', ['erpAppConfig', '$scope', 'commonFact', 'serviceApi', function(erpAppConfig, $scope, commonFact, serviceApi) {
    var actions = angular.extend(angular.copy(commonFact.defaultActions), {
        callBackList: function(context) {
            context.actions.getPartStock(context);
        },
        checkAcceptedQty: function(context) {
            var qtyCanMake = 0,
                rejectionQtyMax = 0,
                rwQtyMax = 0;
            if (context.data.partNo && context.data.operationFrom) {
                qtyCanMake = context.partStock[context.data.partNo + '-' + context.data.operationFrom] && context.partStock[context.data.partNo + '-' + context.data.operationFrom].partStockQty || 0;
            }
            context.form.fields['acceptedQty'].max = qtyCanMake;
            rejectionQtyMax = qtyCanMake - context.data.acceptedQty;
            rwQtyMax = context.data.rejectionQty ? qtyCanMake - context.data.acceptedQty - context.data.rejectionQty : qtyCanMake - context.data.acceptedQty;
            context.form.fields['rejectionQty'].max = rejectionQtyMax;
            context.form.fields['rwQty'].max = rwQtyMax;
        },
        callBackEdit: function(context, key) {
            context.data['startTime'] = context.actions.timeFormatChange(context.data['startTime']);
            context.data['endTime'] = context.actions.timeFormatChange(context.data['endTime']);
        },
        callBackChangeMapping: function(context, data, key, field) {
            context.actions.updateOperationFrom(context, data, key, field);
            context.actions.updateOperationTo(context, data, key, field);
        },
        updateOperationFrom: function(context, data, key, field) {
            if (context.data.jobCardNo) {
                var restriction = {
                        partNo: context.data.partNo
                    },
                    operation = [];
                for (var i in context.partStock) {
                    if (context.partStock[i].partStockQty > 0 && context.data.partNo === context.partStock[i].partNo) {
                        operation.push(context.partStock[i].operationTo);
                    }
                }
                restriction.filter = {
                    id: operation
                }
                context.actions.getOperationFromFlow(context, context.form.fields['operationFrom'], restriction);
            }
        },
        updateOperationTo: function(context, data, key, field) {
            if (context.data.jobCardNo) {
                var partNo = context.data.partNo,
                    restriction = {
                        partNo: partNo,
                        filter: {
                            source: 'In-House'
                        }
                    },
                    operation = [];
                if (context.data.operationFrom) {
                    restriction = angular.extend(restriction, {
                        limit: 1,
                        startWith: context.data.operationFrom
                    });
                }
                var serviceconf = this.getServiceConfig('production.flowMaster');
                serviceApi.callServiceApi(serviceconf).then(function(res) {
                    var flowMasterData = res.data,
                        prevOpp;
                    for (var i in flowMasterData) {
                        if (flowMasterData[i].partNo === partNo) {
                            var flowMasterMap = context.actions.objectSort(flowMasterData[i].mapping, 'id');
                            for (var j in flowMasterMap) {
                                prevOpp = flowMasterMap[j - 1];
                                if (prevOpp && context.partStock[partNo + '-' + prevOpp.id] && context.partStock[partNo + '-' + prevOpp.id].partStockQty > 0) {
                                    operation.push(flowMasterMap[j].id);
                                }
                            }
                        }
                    }
                    restriction.filter = angular.extend(restriction.filter, {
                        id: operation
                    });

                    context.actions.getOperationFromFlow(context, context.form.fields['operationTo'], restriction);
                });
            }
        },
        calculatePlanQty: function(context) {
            var startDate = context.data.startTime;
            var endDate = context.data.endTime;
            var timeDiff = endDate - startDate;
            context.data.planQty = timeDiff * context.form.fields['partNo'].options[context.data.partNo].prodRateHr;
        },
        updateMaterialIssue: function(context, replaceData, key) {
            var jobCard = context.form.fields['jobCardNo'].options[context.data.jobCardNo];
            var jobCardQty = jobCard && jobCard.qtyCanMake;
            var jobCardPrdQty = jobCard && jobCard.productionQty || 0;
            context.actions.getPRQty(context).then(function(PRStock) {
                jobCard.productionQty = PRStock;
                if (parseInt(jobCardQty) <= parseInt(jobCard.productionQty)) {
                    jobCard.status = 1;
                }
                context.actions.updateData('production.materialIssueNote', jobCard);
            });
        },
        getPRQty: function(context) {
            var PRRejQty = 0;
            var PRQty = 0;
            return context.actions.getData('production.productionEntry').then(function(res) {
                var listViewData = res.data;
                for (var i in listViewData) {
                    if (context.data.jobCardNo === listViewData[i].jobCardNo) {
                        if (listViewData[i].operationTo === 1) {
                            PRRejQty += parseInt(listViewData[i].rejectionQty) + parseInt(listViewData[i].rwQty);
                            PRQty += parseInt(listViewData[i].acceptedQty);
                        }
                    }
                }
                PRQty += PRRejQty;
                return PRQty;
            });
        },
        callBackSubmit: function(context) {
            if (context.data.operationTo === erpAppConfig.finalStageOpp) {
                context.actions.updateMaterialIssue(context);
            }
            context.actions.updatePartStock(context);
        }
    });
    $scope.context = erpAppConfig.modules.production.productionEntry;
    $scope.context.actions = actions;
    $scope.context.actions.list($scope.context);
}]);
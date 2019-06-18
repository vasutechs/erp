erpApp.controller('invoiceCtrl', ['$scope', 'commonFact', '$location', function($scope, commonFact, $location) {
    var orgItemVal = null,
        delMapItemVal = [],
        actions = {
            callBackList: function(context) {
                context.actions.getPartStock(context);
                orgItemVal = null;
                delMapItemVal = [];
            },
            callBackSetAutoGenKey: function(context) {
                var year = context.appConfig.calendarYear;
                context.data[context.form.autoGenKey] = context.data[context.form.autoGenKey] + '/' + year + '-' + ('' + parseInt(year + 1)).substring(2);
            },
            callBackChangeMapping: function(context, data, key, field) {
                context.actions.getPartStockDetail(context, data, key, field);
                orgItemVal.mapping = angular.copy(context.data.mapping);
            },
            callBackRemoveMapping: function(context, data, key) {
                if (context.page.name === 'edit') {
                    delMapItemVal.push(orgItemVal.mapping[key]);
                }
                delete orgItemVal.mapping.splice(key, 1);
            },
            callBackAdd: function(context) {
                orgItemVal = angular.copy(context.data);
                delMapItemVal = [];
            },
            callBackEdit: function(context) {
                orgItemVal = angular.copy(context.data);
                delMapItemVal = [];
            },
            getPartStockDetail: function(context, data, key, field) {
                var newMapData = [];
                newMapData = context.data.mapping.filter(function(data) {
                    if (context.partStock[data.id + '-' + context.appConfig.finalStageOpp]) {
                        data.operationFrom = context.partStock[data.id + '-' + context.appConfig.finalStageOpp].operationFrom;
                        data.operationTo = context.partStock[data.id + '-' + context.appConfig.finalStageOpp].operationTo;
                    }

                    return (context.partStock && context.partStock[data.id + '-' + context.appConfig.finalStageOpp] && parseInt(context.partStock[data.id + '-' + context.appConfig.finalStageOpp].partStockQty) > 0);
                });
                context.data.mapping = newMapData;
            },
            updateTotal: function(context, data, updateValue, key) {
                var partDetail = context.form.mapping.fields['id'].options[data.id],
                    taxRate = 0,
                    cgst = 0,
                    sgst = 0,
                    totalBeforTax = 0,
                    partStock = 0;

                if (context.partStock[data.id + '-' + context.appConfig.finalStageOpp]) {
                    partStock = parseInt(context.partStock[data.id + '-' + context.appConfig.finalStageOpp].partStockQty);
                    if (context.page.name === 'edit') {
                        partStock += parseInt(orgItemVal.mapping[key].unit);
                    }
                    data.unit = partStock < data.unit ? null : data.unit;
                }

                totalBeforTax = data.unit * data.rate;

                data.amount = parseFloat(totalBeforTax).toFixed(2);
                data.cgst = partDetail.cgst;
                data.sgst = partDetail.sgst;
                data.taxRate = partDetail.gst;

                context.actions.updateTotalAmount(context);

            },
            updateTotalAmount: function(context) {
                var taxRate = 0,
                    cgst = 0,
                    sgst = 0,
                    taxRateTotal = 0,
                    cgstTotal = 0,
                    sgstTotal = 0,
                    total = 0,
                    subTotal = 0,
                    mapping = context.data.mapping;

                for (var i in mapping) {
                    cgst += mapping[i].cgst;
                    sgst += mapping[i].sgst;
                    taxRate += mapping[i].taxRate;

                    cgstTotal += (parseFloat(mapping[i].amount) * parseFloat(mapping[i].cgst / 100));
                    sgstTotal += (parseFloat(mapping[i].amount) * parseFloat(mapping[i].sgst / 100));
                    taxRateTotal += (parseFloat(mapping[i].amount) * parseFloat(mapping[i].taxRate / 100));
                    subTotal += parseFloat(mapping[i].amount);
                }

                if (context.cashBill === false) {
                    total = subTotal + cgstTotal + sgstTotal;
                    context.data.taxRate = parseInt(taxRate) / mapping.length;
                    context.data.cgst = parseInt(cgst) / mapping.length;
                    context.data.sgst = parseInt(sgst) / mapping.length;
                    context.data.cgstTotal = parseFloat(cgstTotal).toFixed(2);
                    context.data.sgstTotal = parseFloat(sgstTotal).toFixed(2);
                } else {
                    total = subTotal;
                }

                context.data.subTotal = parseFloat(subTotal).toFixed(2);
                context.data.total = parseFloat(total).toFixed(2);
                if (context.cashBill) {
                    context.actions.updatePreBalance(context);
                }
            },
            updatePreBalance: function(context) {
                var total = parseFloat(context.data.subTotal);
                if (context.data.preBalance) {
                    total = total + parseFloat(context.data.preBalance);
                }
                context.data.total = total.toFixed(2);
            },
            updateInvocePartStock: function(context) {
                var mapStockUpdate = function(map, key, del) {
                    var data = angular.copy(map);
                    var newContext = angular.copy(context);
                    data.partNo = data.id;
                    if (!del && orgItemVal && orgItemVal.mapping && orgItemVal.mapping[key]) {
                        if (orgItemVal.id) {
                            data.acceptedQty = parseInt(orgItemVal.mapping[key].unit) - parseInt(map.unit);
                        } else {
                            data.acceptedQty = 0 - parseInt(map.unit);
                        }
                    } else {
                        data.acceptedQty = parseInt(map.unit);
                    }
                    newContext.data = data;
                    newContext.updatePrevStock = false;
                    context.actions.updatePartStock(newContext);
                };
                for (var i in context.data.mapping) {
                    mapStockUpdate(context.data.mapping[i], i, false);
                }
                for (var j in delMapItemVal) {
                    mapStockUpdate(delMapItemVal[j], j, true);
                }

            },
            callBackSubmit: function(context) {
                context.actions.updateInvocePartStock(context);
            },
            callBeforeDelete: function(context, id, item) {
                context.data = item;
                context.actions.updateInvocePartStock(context);
            }
        };
    if ($location.search() && $location.search()['type'] === 'cashBill') {
        commonFact.initCtrl($scope, 'marketing.cashBill', actions).then(function() {
            $scope.context.cashBill = true;
        });
    } else {
        commonFact.initCtrl($scope, 'marketing.invoice', actions).then(function() {
            $scope.context.cashBill = false;
        });
    }
}]);
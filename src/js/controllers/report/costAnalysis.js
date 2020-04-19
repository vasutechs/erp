erpApp.controller('costAnalysisCtrl', ['$scope', 'commonFact', 'serviceApi', '$location', function($scope, commonFact, serviceApi, $location) {
    var cashBill = false,
        actions = {
            callBackList: function(context) {
                context.actions.getFlowMaster(context).then(function() {
                    context.actions.getData('purchase.rmMaster').then(function(res) {

                        for (var i in context.listViewData) {
                            var partDetails = context.listViewData[i];
                            var rmCode = context.listViewData[i].rmCode;
                            var rmDetails = rmCode && res.data[rmCode];
                            var flowMasterDetails = context.flowMasterByPart[partDetails.id];
                            var materialCost;
                            var conversionCost;
                            var subTotal;
                            var rejCost;
                            var iccCost;
                            var toolMaintCost;
                            var transCost;
                            var profitCost;
                            var total;
                            var salesRate;
                            var differenceInCost;
                            var gainOrLoss;
                            if (rmDetails) {
                                partDetails.rmRate = rmDetails.rate;
                                partDetails.scrapRate = rmDetails.scrapRate;
                                partDetails.materialCost = rmDetails && ((parseFloat(partDetails.inputWeight) * parseFloat(rmDetails.rate)) - (((parseFloat(partDetails.inputWeight) - parseFloat(partDetails.finishedWeight)) * parseFloat(rmDetails.scrapRate))));
                                partDetails.conversionCost = flowMasterDetails && flowMasterDetails.totalCost;
                                partDetails.subTotal = parseFloat(partDetails.materialCost) + parseFloat(partDetails.conversionCost);
                                partDetails.rejCost = partDetails.subTotal * (partDetails.rejection / 100);
                                partDetails.iccCost = partDetails.subTotal * (partDetails.icc / 100);
                                partDetails.toolMaintCost = partDetails.subTotal * (partDetails.toolMaintenance / 100);
                                partDetails.transCost = rmDetails && ((parseFloat(partDetails.finishedWeight) * parseFloat(partDetails.transportCostKg)) + (parseFloat(partDetails.inputWeight) * parseFloat(rmDetails.transportCostKg)));
                                partDetails.profitCost = partDetails.subTotal * (partDetails.profit / 100);
                                partDetails.total = partDetails.subTotal + partDetails.rejCost + partDetails.iccCost + partDetails.toolMaintCost + partDetails.transCost + partDetails.profitCost;
                                partDetails.salesRate = partDetails.rate;
                                partDetails.differenceInCost = partDetails.salesRate - partDetails.total;
                                partDetails.gainOrLoss = (partDetails.differenceInCost / partDetails.salesRate) * 100;
                            }
                        }

                    });
                });
            }
        };
    commonFact.initCtrl($scope, 'report.costAnalysis', actions);

}]);
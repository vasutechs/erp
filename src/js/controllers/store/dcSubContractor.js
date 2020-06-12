erpConfig.moduleFiles.dcSubContractor = function(context) {
    var orgItemVal = null;
    return {
        callBackList: function() {
            context.commonFact.getPartStock();
        },
        callBackEdit: function() {
            context.controller.form.mapping.actions.delete = false;
            orgItemVal = angular.copy(context.controller.data);
            context.controller.methods.getDCQty();
        },
        getPOSubContractor: function(data, key, field) {
            context.controller.form.fields['poNo'] = angular.extend(context.controller.form.fields['poNo'], {
                filter: {
                    subContractorCode: key,
                    status: 0
                }
            });
            context.commonFact.makeOptionsFields(context.controller.form.fields['poNo']);
            context.commonFact.changeMapping(context.controller.data, context.controller.data['subContractorCode'], context.controller.form.fields['subContractorCode']);
        },
        callBackChangeMapping: function() {
            context.controller.methods.checkAcceptedQty();
            context.controller.methods.getDCQty();
        },
        checkAcceptedQty: function() {
            var partNo,
                operationFrom;
            context.commonFact.getData('production.flowMaster').then(function(res) {
                var flowMasterData = res.data,
                    prevOpp,
                    qty;
                var dcPartStockQty;
                for (var i in context.controller.data.mapping) {
                    partNo = context.controller.data.mapping[i].id;
                    qty = context.controller.data.mapping[i].acceptedQty;
                    for (var j in flowMasterData) {
                        if (flowMasterData[j].partNo === partNo) {
                            for (var k in flowMasterData[j].mapping) {
                                prevOpp = flowMasterData[j].mapping[k - 1];
                                if (prevOpp && flowMasterData[j].mapping[k].source === 'Sub-Contractor') {
                                    operationFrom = prevOpp.id;
                                }

                                if (operationFrom) {
                                    dcPartStockQty = context.controller.partStock[partNo + '-' + operationFrom].partStockQty;

                                    if (dcPartStockQty === undefined || dcPartStockQty < qty) {
                                        context.controller.data.mapping[i].acceptedQty = qty = null;
                                    }
                                }
                            }
                        }
                    }
                    context.controller.data.mapping[i].operationFrom = operationFrom;
                }
            });
        },
        callBackUpdatePartTotal: function(data) {
            var qty = parseInt(data.acceptedQty),
                poQty = parseInt(context.controller.methods.getPOQty(data)),
                dcQty = context.controller.dcQty && context.controller.dcQty[context.controller.data['poNo'] + '-' + data.id] || 0;

            qty += parseInt(dcQty);
            if (poQty < qty) {
                data.acceptedQty = null;
            }
            context.commonFact.updatePOTotalAmount();
        },
        getPOQty: function(data) {
            var poSubContractor = context.controller.form.fields['poNo'].options[context.controller.data.poNo];
            var poQty = 0;
            var poNo = context.controller.data.poNo;

            for (var i in poSubContractor.mapping) {
                if (data && data.id) {
                    if (poSubContractor.mapping[i].id === data.id) {
                        poQty += parseInt(poSubContractor.mapping[i].acceptedQty);
                    }
                } else {
                    poQty += parseInt(poSubContractor.mapping[i].acceptedQty);
                }
            }
            return poQty;
        },
        updatePoSubContractor: function() {
            var poSubContractor = context.controller.form.fields['poNo'].options[context.controller.data.poNo];
            var poQty = 0;
            var dcQty = 0;
            var qty = 0;
            poSubContractor.status = 1;
            for (var i in context.controller.data.mapping) {
                poQty = context.controller.methods.getPOQty(context.controller.data.mapping[i]);
                dcQty = parseInt(context.controller.dcQty[context.controller.data['poNo'] + '-' + context.controller.data.mapping[i].id]) || 0;
                qty = parseInt(context.controller.data.mapping[i].acceptedQty) + dcQty;
                if (parseInt(poQty) > parseInt(qty)) {
                    poSubContractor.status = 0;
                }
            }

            context.commonFact.updateData('purchase.poSubContractor', poSubContractor);

        },
        getDCQty: function(partNo) {
            var dcQtyTag;
            var dcQty;
            context.controller.dcQty = [];
            return context.commonFact.getData('store.dcSubContractor').then(function(res) {
                var listViewData = res.data;
                for (var i in listViewData) {
                    if (context.controller.data.poNo === listViewData[i].poNo && (!orgItemVal || listViewData[i].id !== orgItemVal.id)) {
                        for (var j in listViewData[i].mapping) {
                            dcQtyTag = listViewData[i].poNo + '-' + listViewData[i].mapping[j].id;
                            if (partNo === undefined || listViewData[i].mapping[j].id === partNo) {
                                dcQty = parseInt(listViewData[i].mapping[j].acceptedQty);
                            }
                            context.controller.dcQty[dcQtyTag] = context.controller.dcQty[dcQtyTag] === undefined ? dcQty : parseInt(context.controller.dcQty[dcQtyTag]) + dcQty;
                        }
                    }
                }
                return dcQty;
            });
        },
        callBackSubmit: function() {
            var acceptedQty;
            for (var i in context.controller.data.mapping) {
                var data = angular.copy(context.controller.data.mapping[i]);
                var newContext = angular.copy(context);
                data.partNo = data.id;
                data.subContractorCode = context.controller.data.subContractorCode;
                if (orgItemVal && orgItemVal.mapping[i] && orgItemVal.mapping[i].acceptedQty) {
                    acceptedQty = parseInt(data.acceptedQty) - parseInt(orgItemVal.mapping[i].acceptedQty);
                    data.acceptedQty = acceptedQty;
                }
                newContext.controller.data = data;
                context.commonFact.updateSCStock(newContext);
                newContext.controller.updateCurStock = false;
                context.commonFact.updatePartStock(newContext);
            }
            context.controller.methods.updatePoSubContractor();
        },
        callBeforeDelete: function(id, item) {
            var acceptedQty;
            var poSubContractor = context.controller.form.fields['poNo'].allOptions[item.poNo];
            for (var i in item.mapping) {
                var data = angular.copy(item.mapping[i]);
                var newContext = angular.copy(context);
                data.partNo = data.id;
                data.subContractorCode = item.subContractorCode;
                acceptedQty = 0 - parseInt(data.acceptedQty);
                data.acceptedQty = acceptedQty;

                newContext.controller.data = data;
                context.commonFact.updateSCStock(newContext);
                newContext.controller.updateCurStock = false;
                context.commonFact.updatePartStock(newContext);
            }
            poSubContractor.status = 0;
            context.commonFact.updateData('purchase.poSubContractor', poSubContractor);
        }
    };
};
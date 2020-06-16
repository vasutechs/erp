erpConfig.moduleFiles.commonFact = function($filter, $location, $window, $http) {
    return function(context) {
        return {
            add: function() {
                context.controller.page.name = 'add';
                context.controller.data = angular.copy(context.controller.masterData);
                if (context.controller.form.autoGenKey) {
                    context.commonFact.setAutoGenKey();
                }
                if (context.controller.data.date === null) {
                    context.controller.data.date = new Date();
                }
                return context.commonFact.formRender().then(function() {
                    context.controller.methods.callBackAdd && context.controller.methods.callBackAdd();
                    return true;
                });
            },
            edit: function(key, printView) {
                context.controller.page.name = 'edit';
                context.controller.page.printView = printView;
                context.controller.page.editKey = key;
                context.controller.existEditData = context.controller.page.editKey && context.commonFact.findObjectByKey(context.controller.listViewDataMaster, 'id', context.controller.page.editKey);

                return context.commonFact.formRender().then(function() {
                    return context.commonFact.getData(context.controller, key).then(function(res) {
                        context.controller.data = res.data;
                        context.controller.printData = angular.copy(context.controller.data);
                        if (context.controller.data['date']) {
                            context.controller.data['date'] = new Date(context.controller.data['date']);
                        }
                        if (context.controller.data['frmDate']) {
                            context.controller.data['frmDate'] = new Date(context.controller.data['frmDate']);
                        }
                        if (context.controller.data['toDate']) {
                            context.controller.data['toDate'] = new Date(context.controller.data['toDate']);
                        }
                        context.controller.methods.callBackEdit && context.controller.methods.callBackEdit(key);
                        return context;
                    });
                });

            },
            printView: function(key, printView) {
                context.commonFact.edit(key, printView);
            },
            disable: function(id, item) {
                context.controller.methods.callBeforeDelete && context.controller.methods.callBeforeDelete(item);
                context.controller.listViewDataMaster[id]['disabled'] = true;
                context.commonFact.updateData(context.controller, context.controller.listViewData[id]);
                context.commonFact.list();
                context.controller.methods.callBackDelete && context.controller.methods.callBackDelete(id, item);
            },
            delete: function(id, item) {
                context.controller.methods.callBeforeDelete && context.controller.methods.callBeforeDelete(id, item);
                context.commonFact.updateData(context.controller, { id: id, delete: 'yes' });
                context.commonFact.list();
                context.controller.methods.callBackDelete && context.controller.methods.callBackDelete(id, item);
            },
            list: function() {
                var pageProm = [];
                var promiseRes = context.commonFact.getPromiseRes();
                context.controller.existEditData = null;
                context.controller.page.editKey = undefined;
                context.controller.page.printView = undefined;
                context.controller.page.name = 'list';
                context.controller.currentPage = 0;
                context.controller.pageSize = 10;
                context.controller.filterBy = context.controller.page.filter || {};
                context.controller.listViewData = [];
                context.controller.orderByProperty = 'updated';
                context.commonFact.pageActionsAccess();
                pageProm.push(context.commonFact.updateFields(context.controller.listView));
                context.controller.filterView && pageProm.push(context.commonFact.updateFields(context.controller.filterView.fields));


                Promise.all(pageProm).then(function() {
                    context.commonFact.getData().then(function(res) {
                        var listViewData = res.data;
                        for (var x in listViewData) {
                            listViewData.hasOwnProperty(x) && !listViewData[x].disabled && context.controller.listViewData.push(listViewData[x])
                        }
                        context.controller.listViewDataMaster = angular.copy(context.controller.listViewData);
                        context.controller.lastData = angular.copy(context.controller.listViewData[context.controller.listViewData.length - 1]);
                        context.controller.methods.callBackList && context.controller.methods.callBackList();
                        promiseRes.resolve(context);
                    });
                });
                return promiseRes.promise;

            },
            formRender: function() {
                return context.commonFact.updateFields(context.controller.form.fields).then(function() {
                    if (context.controller.form.mapping) {
                        return context.commonFact.updateFields(context.controller.form.mapping.fields);
                    }
                    return context;
                });

            },
            getPageData: function() {
                return $filter('filter')(context.controller.listViewData, context.controller.filterBy, true) || [];
            },
            numberOfPages: function() {
                return Math.ceil(context.commonFact.getPageData().length / context.controller.pageSize);
            },
            submit: function() {
                return context.commonFact.updateData(context.controller, context.controller.data).then(function(res) {
                    context.commonFact.list();
                    context.controller.methods.callBackSubmit && context.controller.methods.callBackSubmit(res.data);
                    return context;
                });

            },
            cancel: function() {
                context.commonFact.list();
            },
            getData: function(module, data) {
                var ctrl = angular.copy(module || context.controller);
                var serviceConf = context.commonFact.getServiceConfig(ctrl, 'GET');
                var params = data && typeof(data) !== 'object' ? { id: data } : data;
                serviceConf.params = angular.extend(serviceConf.params, params);
                //Get Part master data
                return context.serviceApi.callServiceApi(serviceConf);
            },
            updateData: function(module, data) {
                var ctrl = angular.copy(module || context.controller);
                var userDetails = context.authFact.getUserDetail();
                var serviceConf = context.commonFact.getServiceConfig(ctrl, 'POST');
                data.updatedUserId = userDetails && context.commonFact.isSuperAdmin() ? context.commonFact.isSuperAdmin() + '-' + userDetails.id : userDetails.id || null;
                //Get Part master data
                return context.serviceApi.callServiceApi(serviceConf, data);
            },
            replaceFieldVal: function(viewData, field) {
                var list,
                    serviceConf,
                    self = this,
                    orgViewDataFieldId = viewData,
                    updateField = function(field, fieldData, list) {
                        fieldData = (fieldData && list && list[orgViewDataFieldId] && field.replaceName) ? list[orgViewDataFieldId][field.replaceName] : fieldData;
                        fieldData = field.valuePrefix ? field.valuePrefix + fieldData : fieldData;
                        fieldData = field.valuePrefixData ? list[orgViewDataFieldId][field.valuePrefixData] + ' - ' + fieldData : fieldData;
                        if (context.commonFact.isFloat(fieldData)) {
                            fieldData = parseFloat(fieldData).toFixed(2);
                        }
                        return fieldData;
                    };
                //Get Part master data
                if (field.type === 'select' || field.dataFrom) {
                    viewData = field.options && field.options[viewData] && field.options[viewData].optionName || (field.allOptions && field.allOptions[viewData]) && field.allOptions[viewData].optionName || viewData;
                } else if (field.type === 'date' || field.inputType === 'date') {
                    viewData = viewData && context.commonFact.dateFormatChange(viewData) || '';
                } else if (field.inputType === 'password') {
                    viewData = 'XXX';
                } else {
                    viewData = updateField(field, viewData);
                }
                return viewData;
            },
            matchFilter: function(field, list) {
                var returnFlag = false;
                // if (context && context.controller.page.name === 'edit') {
                //     return true;
                // }
                for (var i in field.filter) {
                    if (typeof(field.filter[i]) === 'object' && field.filter[i].indexOf(list[i]) < 0) {
                        return false;
                    } else if (typeof(field.filter[i]) !== 'object' && field.filter[i] != list[i]) {
                        return false;
                    } else {
                        returnFlag = true;
                    }
                }
                return returnFlag;
            },
            makeOptionsFields: function(field) {
                var self = this,
                    list;

                field.options = {};
                field.allOptions = {};

                return context.commonFact.getData(field.dataFrom).then(function(res) {
                    list = res.data;
                    for (var i in list) {
                        var optionVal = field.optionId && list[i][field.optionId] || list[i]['id'];
                        var optionIdVal = field.optionId && list[i][field.optionId] || list[i]['id'];
                        var optionNameVal = field.valuePrefix && field.valuePrefix || '';
                        var editOption = context.controller.existEditData && optionIdVal === context.controller.existEditData[field.id] || false;
                        optionNameVal += field.valuePrefixData && list[i][field.valuePrefixData] + ' - ' || '';
                        optionNameVal += list[i][field.replaceName] || '';
                        var isCheckExistVal = field.existingCheck && context.controller.listViewDataMaster && context.commonFact.findObjectByKey(context.controller.listViewDataMaster, field.id, optionIdVal) || false;
                        field.allOptions[optionVal] = list[i];
                        field.allOptions[optionVal]['optionName'] = optionNameVal;
                        field.allOptions[optionVal]['optionId'] = optionIdVal;
                        if ((field.filter === undefined ||
                                context.commonFact.matchFilter(field, list[i], context) === true) &&
                            (!isCheckExistVal || editOption)) {
                            field.options[optionVal] = field.allOptions[optionVal];
                        }
                    }
                    return field;
                });
            },
            addMapping: function(mapping) {
                var newMapping = angular.extend({}, mapping[0]);
                for (var mapKey in newMapping) {
                    newMapping[mapKey] = null;
                }
                mapping.push(newMapping);
            },
            removeMapping: function(data, key) {
                delete data.splice(key, 1);
                context.controller.methods.callBackRemoveMapping && context.controller.methods.callBackRemoveMapping(data, key);
            },
            changeMapping: function(data, key, field, fieldMapKey) {
                for (var dataKey in data) {
                    if ((field.updateData && field.updateData.indexOf(dataKey) >= 0) || field.updateData === undefined) {
                        if (key === null) {
                            data[dataKey] = angular.copy(context.controller.masterData[dataKey]);
                        } else if (key !== undefined && field.options[key][dataKey]) {
                            if (typeof(field.options[key][dataKey]) !== 'object') {
                                data[dataKey] = field.options[key][dataKey];
                            } else if (field.updateMapping) {
                                data[dataKey] = angular.copy(context.controller.masterData[dataKey]);
                                for (var mapKey in field.options[key][dataKey]) {
                                    var copyDataMapKey = angular.copy(context.controller.masterData[dataKey][0]);
                                    if (field.options[key][dataKey][mapKey] !== null || field.options[key][dataKey][mapKey] !== '') {
                                        data[dataKey][mapKey] = angular.extend(copyDataMapKey, field.options[key][dataKey][mapKey]);
                                        for (var mapFieldKey in context.controller.form.mapping.fields) {
                                            var mapfield = context.controller.form.mapping.fields[mapFieldKey];
                                            if (mapfield.action) {
                                                if (mapfield.type === 'select') {
                                                    context.commonFact.callActions(mapfield.action, [data[dataKey][mapKey], data[dataKey][mapKey][mapfield.id], mapfield, mapKey]);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                field.callBack !== false && context.controller.methods.callBackChangeMapping && context.controller.methods.callBackChangeMapping(data, key, field, fieldMapKey);
            },
            setAutoGenKey: function() {
                var lastDataKey = context.controller.lastData ? context.controller.lastData[context.controller.form.autoGenKey] : undefined;
                lastDataKey = lastDataKey ? parseInt(lastDataKey) + 1 : context.controller.form.autoGenValStart ? context.controller.form.autoGenValStart : 1;
                context.controller.data[context.controller.form.autoGenKey] = lastDataKey;
                context.controller.methods.callBackSetAutoGenKey && context.controller.methods.callBackSetAutoGenKey();
            },
            dateFormatChange: function(dateValue) {
                dateValue = new Date(dateValue);
                return dateValue.getDate() + '-' + (dateValue.getMonth() + 1) + '-' + dateValue.getFullYear();
            },
            timeFormatChange: function(value) {
                value = new Date(value);
                return value.getHours() + ':' + value.getMinutes() + ':' + value.getSeconds();
            },
            getOperationFromFlow: function(field, restriction) {
                var self = this,
                    partNo = restriction.partNo || context.controller.data.partNo,
                    limit = 0;
                var promiseRes = context.commonFact.getPromiseRes();

                if (partNo) {
                    context.commonFact.makeOptionsFields(field).then(function() {
                        var localOptions = field.options;
                        context.commonFact.getData('production.flowMaster').then(function(res) {
                            var flowMasterData = res.data,
                                flowMasterVal;
                            var isPartFlow = false;
                            field.options = {};
                            for (var i in flowMasterData) {
                                if (flowMasterData[i].partNo === partNo) {
                                    context.commonFact.mergeOprFlowMap(flowMasterData[i].mapping).then(function(flowMasterMap) {
                                        var startWith = context.commonFact.findObjectByKey(flowMasterMap, 'id', restriction.startWith);
                                        flowMasterMap = context.commonFact.objectSort(flowMasterMap, 'opCode');
                                        for (var j in flowMasterMap) {
                                            flowMasterVal = flowMasterMap[j];
                                            if ((!restriction.limit || limit < restriction.limit) &&
                                                (!restriction.startWith || (startWith.opCode < flowMasterVal.opCode)) &&
                                                (restriction.filter === undefined || context.commonFact.matchFilter(restriction, flowMasterVal) === true)) {
                                                limit++;
                                                field.options[flowMasterVal.id] = localOptions[flowMasterVal.id];
                                            }
                                        }
                                        promiseRes.resolve(field);
                                    });
                                    isPartFlow = true;
                                }
                            }
                            if (!isPartFlow) {
                                promiseRes.resolve(field);
                            }
                        });
                    });
                } else {
                    promiseRes.resolve(field);
                }
                return promiseRes.promise;
            },
            updatePartStock: function(newContext) {
                var self = this;
                var localContext = newContext || context;
                var promiseRes = context.commonFact.getPromiseRes();
                var currentPartProm = context.commonFact.getPromiseRes();
                var currentData;
                var prevData;
                context.commonFact.getData('report.partStock').then(function(res) {
                    var partStockData = res.data,
                        partStock = {};
                    for (var i in partStockData) {
                        partStock[partStockData[i].partNo + '-' + partStockData[i].operationFrom + '-' + partStockData[i].operationTo] = partStockData[i] && partStockData[i] || undefined;
                        partStock[partStockData[i].partNo + '-' + partStockData[i].operationTo] = partStockData[i] && partStockData[i] || undefined;
                    }
                    var existingStock = partStock[localContext.controller.data.partNo + '-' + localContext.controller.data.operationFrom + '-' + localContext.controller.data.operationTo];
                    var partStockQty = existingStock ? parseInt(existingStock.partStockQty) + parseInt(localContext.controller.data.acceptedQty) : parseInt(localContext.controller.data.acceptedQty);
                    if (localContext.controller.updateCurStock === undefined || localContext.controller.updateCurStock) {
                        currentData = {
                            id: existingStock && existingStock.id || undefined,
                            partNo: localContext.controller.data.partNo,
                            partStockQty: partStockQty,
                            operationFrom: localContext.controller.data.operationFrom,
                            operationTo: localContext.controller.data.operationTo
                        }
                        context.commonFact.updateData('report.partStock', currentData).then(function() {
                            context.commonFact.getPartStock();
                            currentPartProm.resolve();
                        });
                    } else {
                        currentPartProm.resolve();
                    }
                    currentPartProm.promise.then(function() {
                        var existingPrevStock = partStock[localContext.controller.data.partNo + '-' + localContext.controller.data.operationFrom];
                        if (existingPrevStock && (localContext.controller.updatePrevStock === undefined || localContext.controller.updatePrevStock)) {
                            var existPartStockQty = parseInt(localContext.controller.data.acceptedQty);
                            existPartStockQty += parseInt(localContext.controller.data.rejectionQty) || 0;
                            existPartStockQty += parseInt(localContext.controller.data.rwQty) || 0;
                            existPartStockQty = parseInt(existingPrevStock.partStockQty) - parseInt(existPartStockQty);
                            prevData = {
                                id: existingPrevStock.id,
                                partNo: localContext.controller.data.partNo,
                                partStockQty: existPartStockQty,
                                operationFrom: existingPrevStock.operationFrom,
                                operationTo: existingPrevStock.operationTo
                            }
                            context.commonFact.updateData('report.partStock', prevData).then(function() {
                                context.commonFact.getPartStock();
                                promiseRes.resolve();
                            });
                        } else {
                            promiseRes.resolve();
                        }
                    });

                });

                return promiseRes.promise;
            },
            updateSCStock: function(newContext) {
                var promiseRes = context.commonFact.getPromiseRes();
                var localContext = newContext || context;
                var returnPromise = [];
                context.commonFact.getData('report.subContractorStock').then(function(res) {
                    var scStockData = res.data,
                        scStock = {};
                    for (var i in scStockData) {
                        scStock[scStockData[i].partNo + '-' + scStockData[i].operationFrom + '-' + scStockData[i].operationTo] = scStockData[i] && scStockData[i] || undefined;
                        scStock[scStockData[i].partNo + '-' + scStockData[i].operationTo] = scStockData[i] && scStockData[i] || undefined;
                    }
                    var existingStock = scStock[localContext.controller.data.partNo + '-' + newContext.controller.data.operationFrom + '-' + newContext.controller.data.operationTo];
                    var partStockQty = existingStock ? parseInt(existingStock.partStockQty) + parseInt(newContext.controller.data.acceptedQty) : parseInt(newContext.controller.data.acceptedQty);
                    var data = {
                        id: existingStock && existingStock.id || undefined,
                        partNo: localContext.controller.data.partNo,
                        subContractorCode: localContext.controller.data.subContractorCode,
                        partStockQty: partStockQty,
                        operationFrom: localContext.controller.data.operationFrom,
                        operationTo: localContext.controller.data.operationTo
                    }
                    promiseRes.resolve(context.commonFact.updateData('report.subContractorStock', data));
                });

                return promiseRes.promise;
            },
            updatePartTotal: function(data, newValue, field, fieldMapKey) {
                var total = 0,
                    totalBeforTax = 0,
                    qty = newValue,
                    operation = data.operationFrom;
                if (data.id &&
                    operation &&
                    (context.controller.partStock === undefined ||
                        context.controller.partStock[data.id + '-' + operation] === undefined ||
                        context.controller.partStock[data.id + '-' + operation].partStockQty < qty)) {
                    data[field.id] = qty = null;
                }
                totalBeforTax = qty * data.rate;
                data.total = parseFloat(totalBeforTax).toFixed(2);
                context.controller.methods.callBackUpdatePartTotal && context.controller.methods.callBackUpdatePartTotal(data, newValue, field, fieldMapKey);

            },
            getServiceConfig: function(ctrl, replaceMethod) {
                var currentYear = context.erpAppConfig.calendarYear;
                var serviceConfig = ctrl;
                var genUrl = function(serviceConfig) {
                    var url = context.erpAppConfig.serverApiUri;
                    url += context.erpAppConfig.serverAuth ? ('/' + context.erpAppConfig.serverAuth) : '';
                    url += !serviceConfig.notDataUri ? (serviceConfig.dataUri ? ('/' + serviceConfig.dataUri) : ('/' + context.erpAppConfig.serverDataUri)) : '';
                    url += serviceConfig.id ? ('/' + serviceConfig.id) : '';
                    return url;
                };

                if (typeof(ctrl) !== 'object') {
                    ctrl = context.commonFact.getDeepProp(context.erpAppConfig.modules.controllers, ctrl);
                }
                if (ctrl.id && ctrl.page) {
                    serviceConfig = ctrl.services && ctrl.services.list || {};
                    serviceConfig.id = serviceConfig.id || ctrl.id;
                }
                serviceConfig.params = angular.extend(serviceConfig.params || {}, { appCustomer: serviceConfig.params && serviceConfig.params.appCustomer || context.commonFact.isAppCustomer() || '' })

                if (serviceConfig.params.year) {
                    serviceConfig.params.year = context.erpAppConfig.calendarYear || currentYear;
                }
                serviceConfig.url = genUrl(serviceConfig);
                serviceConfig.method = replaceMethod ? replaceMethod : serviceConfig.method;
                serviceConfig.cache = serviceConfig.cache === undefined ? context.erpAppConfig.httpCache : serviceConfig.cache;
                return serviceConfig;
            },
            getPartStock: function() {
                context.commonFact.getData('report.partStock').then(function(res) {
                    var partStockData = res.data,
                        partStock = {};
                    for (var i in partStockData) {
                        partStock[partStockData[i].partNo + '-' + partStockData[i].operationTo] = partStockData[i] && partStockData[i] || undefined;
                    }
                    context.controller.partStock = partStock;
                });
            },
            getSCStock: function() {
                return context.commonFact.getData('report.subContractorStock').then(function(res) {
                    var scStockData = res.data,
                        scStock = {};
                    for (var i in scStockData) {
                        scStock[scStockData[i].partNo + '-' + scStockData[i].operationFrom] = scStockData[i] && scStockData[i] || undefined;
                    }
                    context.controller.partStock = scStock;
                    return scStock;
                });
            },
            getRMStock: function() {
                context.commonFact.getData('report.rmStock').then(function(res) {
                    var rmStockData = res.data,
                        rmStock = {};
                    for (var i in rmStockData) {
                        rmStock[rmStockData[i].rmCode] = rmStockData[i] && rmStockData[i] || undefined;
                    }
                    context.controller.rmStock = rmStock;
                });
            },
            objectSort: function(obj, sortBy) {
                function compare(a, b) {
                    if (a[sortBy] < b[sortBy])
                        return -1;
                    if (a[sortBy] > b[sortBy])
                        return 1;
                    return 0;
                }

                return obj.sort(compare);
            },
            viewFilterBy: function(list) {
                var self = this;
                if (!list.selectedFilterBy) {
                    delete context.controller.filterBy[list.id];
                } else {
                    if (list.type === 'date' || list.inputType === 'date') {
                        context.controller.filterBy[list.id] = new Date(list.selectedFilterBy).toISOString();
                    } else {
                        context.controller.filterBy[list.id] = list.selectedFilterBy;
                    }
                }
            },
            getFlowMaster: function() {
                context.controller.flowMasterData = {};
                context.controller.flowMasterByPart = {};
                context.controller.flowMasterByPartOpr = {};

                return context.commonFact.getData('production.flowMaster').then(function(res) {
                    var flowMasterData = res.data,
                        prevOpp;

                    context.controller.flowMasterData = flowMasterData;
                    for (var i in flowMasterData) {
                        context.controller.flowMasterByPart[flowMasterData[i].partNo] = flowMasterData[i];
                        for (var j in flowMasterData[i].mapping) {
                            context.controller.flowMasterByPartOpr[flowMasterData[i].partNo + '-' + flowMasterData[i].mapping[j].id] = flowMasterData[i].mapping[j];
                        }
                    }
                    return context;
                });

            },
            mergeOprFlowMap: function(flowMap) {
                var promiseRes = context.commonFact.getPromiseRes();
                context.commonFact.getData('production.operationMaster').then(function(res) {
                    for (var i in flowMap) {
                        flowMap[i] = res.data[flowMap[i].id];
                        flowMap[i].opCode = parseInt(res.data[flowMap[i].id].opCode);
                    }
                    promiseRes.resolve(flowMap);
                });
                return promiseRes.promise;
            },
            getOperations: function() {
                context.controller.operationsData = {};

                context.commonFact.getData('production.operationMaster').then(function(res) {
                    context.controller.operationsData = res.data;
                });

            },
            isCheckExistField: function(data, value, field) {
                if (context.controller.listViewData && context.commonFact.findObjectByKey(context.controller.listViewData, field.id, value)) {
                    data[field.id] = null;
                }
            },
            findObjectByKey: function(array, key, value) {
                var isExist = false;
                for (var i = 0; i < array.length; i++) {
                    if (typeof(key) === 'object') {
                        for (var j in key) {
                            if ((!isExist || typeof(isExist) === 'object') && array[i][j] === key[j]) {
                                isExist = array[i];
                            }
                        }
                    } else if (array[i][key] === value) {
                        isExist = array[i];
                    }
                }
                return isExist;
            },
            updateGstPart: function(data, newValue, field, fieldMapKey) {
                var acceptedQtyField = context.controller.form.mapping.fields['acceptedQty'];
                var cgstField = context.controller.form.mapping.fields['cgst'];
                var sgstField = context.controller.form.mapping.fields['sgst'];
                if (cgstField && sgstField) {
                    if (newValue > 0) {
                        data[cgstField.id] = parseInt(newValue) / 2;
                        data[sgstField.id] = parseInt(newValue) / 2;
                    } else {
                        data[cgstField.id] = 0;
                        data[sgstField.id] = 0;
                    }
                }
                context.commonFact.updatePartTotal(data, data[acceptedQtyField.id], acceptedQtyField, fieldMapKey);
            },
            updateFields: function(fields) {
                var returnPromise = [];
                for (var i in fields) {
                    if (fields[i].dataFrom && (typeof(fields[i].dataFrom) === 'object' || context.commonFact.getDeepProp(context.erpAppConfig.modules.controllers, fields[i].dataFrom)) && (fields[i].makeFieldOptions === undefined || fields[i].makeFieldOptions)) {
                        returnPromise.push(context.commonFact.makeOptionsFields(fields[i]));
                    } else if (fields[i].dataFrom) {
                        delete fields[i];
                    }
                }
                return Promise.all(returnPromise);
            },
            showSubModule: function(module) {
                var subModules = {};

                for (var i in module) {
                    if (typeof(module[i]) === 'object') {
                        subModules[i] = module[i];
                    }
                }
                return subModules;
            },
            pageActionsAccess: function() {
                var actions = {
                    add: false,
                    edit: false,
                    delete: false,
                    print: false
                };
                if (context.controller.page && (context.controller.page.actions === undefined || context.controller.page.actions)) {
                    actions.add = context.controller.page.actions === undefined ? true : context.controller.page.actions.add;
                    actions.edit = context.controller.page.actions === undefined ? true : context.controller.page.actions.edit;
                    actions.delete = context.controller.page.actions === undefined ? true : context.controller.page.actions.delete;
                    actions.print = context.controller.page.actions === undefined ? true : context.controller.page.actions.print;
                }
                context.controller.page.actions = actions;
            },
            isFloat: function(n) {
                return Number(n) === n && n % 1 !== 0;
            },
            downloadExcel: function(table) {
                context.controller.filterBy = [];
                var uri = 'data:application/vnd.ms-excel;base64,',
                    template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
                    base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) },
                    format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) };
                if (!table.nodeType) table = document.getElementById(table);
                var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML }
                var downloadLink = document.createElement("a");
                downloadLink.href = uri + base64(format(template, ctx));
                downloadLink.download = "downloadExcel.xls";

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            },
            updatePORmTotal: function(data) {
                var total = 0;
                var qty = data['qty'] || data['acceptedQty'] || 0;
                total = qty * data.rate;
                data.total = parseFloat(total).toFixed(2);
                context.commonFact.updatePOTotalAmount();

            },
            updatePOTotalAmount: function() {
                var gst = context.controller.data.gst,
                    igst = context.controller.data.igst,
                    cgst = context.controller.data.cgst,
                    sgst = context.controller.data.sgst,
                    igstTotal = 0,
                    cgstTotal = 0,
                    sgstTotal = 0,
                    gstTotal = 0,
                    total = 0,
                    subTotal = 0,
                    mapping = context.controller.data.mapping,
                    extraAmount = context.controller.data.extraAmount || 0;

                for (var i in mapping) {
                    subTotal += mapping[i].total && parseFloat(mapping[i].total) || 0;
                }
                cgstTotal = context.controller.data.cgst && ((parseFloat(extraAmount) + parseFloat(subTotal)) * parseFloat(context.controller.data.cgst / 100)) || 0;
                sgstTotal = context.controller.data.sgst && ((parseFloat(extraAmount) + parseFloat(subTotal)) * parseFloat(context.controller.data.sgst / 100)) || 0;
                igstTotal = context.controller.data.igst && ((parseFloat(extraAmount) + parseFloat(subTotal)) * parseFloat(context.controller.data.igst / 100)) || 0;

                gstTotal = (parseFloat(cgstTotal) + parseFloat(sgstTotal) + parseFloat(igstTotal));
                total = subTotal + gstTotal + extraAmount;
                context.controller.data.gstTotal = parseFloat(gstTotal).toFixed(2);
                context.controller.data.subTotal = parseFloat(subTotal).toFixed(2);
                context.controller.data.total = parseInt(total);
            },
            goToPage: function(url, isReload) {
                window.location.hash = '#!/' + url;
                if (isReload) {
                    setTimeout(function() { window.location.reload() }, 200);
                }
            },
            setSessionStore: function(key, data) {
                $window.sessionStorage.setItem(key, data);
            },
            getSessionStore: function(key) {
                var data = $window.sessionStorage.getItem(key);

                return data;
            },
            selectListData: function(data) {
                if (!context.selectedTableData) {
                    context.selectedTableData = {};
                    context.selectedTableData[context.controller.id] = {};
                }
                context.selectedTableData[context.controller.id][data.id] = angular.copy(data);
                delete context.selectedTableData[context.controller.id][data.id].id;
                delete context.selectedTableData[context.controller.id][data.id].isExported;
            },
            downloadTableData: function() {
                context.commonFact.downloadFile(context.selectedTableData, context.controller.id + '.json');
            },
            downloadFile: function(data, name, type) {

                if (!type || type === 'json') {
                    data = JSON.stringify(data);
                }
                //Convert JSON string to BLOB.
                data = [data];

                var blob1 = new Blob(data, { type: 'application/octet-stream' });

                //Check the Browser.
                var isIE = false || !!document.documentMode;
                if (isIE) {
                    window.navigator.msSaveBlob(blob1, name);
                } else {
                    var url = window.URL || window.webkitURL;
                    var hrefData = url.createObjectURL(blob1);

                    var downloadLink = document.createElement("a");

                    downloadLink.href = hrefData;
                    downloadLink.download = name;

                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                }
            },
            downloadDatabase: function(year) {
                var downloadDbName = 'database' + (year ? context.erpAppConfig.calendarYear + '-' + ('' + parseInt(context.erpAppConfig.calendarYear + 1)).substring(2) : '');

                context.commonFact.getData({ id: 'databaseDownload', params: { year: year } }).then(function(res) {
                    context.commonFact.downloadFile(res.data, downloadDbName + '.json');
                });
            },
            showLoadingHttp: function(scope) {
                var showLoader = function(v) {
                    if (v) {
                        scope.context.showLoading = false;
                    } else {
                        scope.context.showLoading = true;
                    }
                };
                scope.isLoading = function() {
                    return $http.pendingRequests.length <= 0;
                };

                scope.$watch(scope.isLoading, showLoader);
            },
            getDeepProp: function(obj, desc) {
                var arr = desc.split(".");
                while (arr.length && (obj = obj[arr.shift()]));
                return obj;
            },
            location: $location,
            changeCalendarYear: function() {
                context.commonFact.goToPage(context.erpAppConfig.modules.controllers.dashboard.page.link);
            },
            downloadData: function() {
                angular.element('#downloadModal').modal('show');
            },
            showAlertRol: function() {
                var showROL = true;
                var userDetail = context.authFact.getUserDetail();
                var alertRolContext = {
                    partRolYellow: [],
                    partRolRed: [],
                    hideROL: function() {
                        showROL = false;
                    }
                };
                if (userDetail && userDetail.userType) {
                    context.commonFact.getData('marketing.partMaster').then(function(res) {
                        var partMaster = res.data;
                        context.commonFact.getData('report.partStock').then(function(res1) {
                            var partStockData = res1.data,
                                partStock = {};
                            for (var i in partStockData) {
                                partStock[partStockData[i].partNo + '-' + partStockData[i].operationTo] = partStockData[i] && partStockData[i] || undefined;
                            }
                            for (var j in partMaster) {
                                var yellowAlert = partMaster[j].rolQtyYellowRage;
                                var redAlert = partMaster[j].rolQtyRedRage;
                                var checkPartStock = partStock[partMaster[j].id + '-' + context.erpAppConfig.finalStageOpp];

                                if (checkPartStock) {
                                    checkPartStock.partName = partMaster[j].partName;
                                    if (redAlert >= checkPartStock.partStockQty) {
                                        alertRolContext.alertRolContext.partRolRed.push(checkPartStock);
                                    } else if (yellowAlert >= checkPartStock.partStockQty) {
                                        alertRolContext.alertRolContext.partRolYellow.push(checkPartStock);
                                    }
                                }

                            }
                            if ((alertRolContext.alertRolContext.partRolRed.length > 0 || alertRolContext.alertRolContext.partRolYellow.length > 0) && showROL) {
                                angular.element('#RolModal').modal('show');
                            }
                        });
                    });
                }
                return alertRolContext;
            },
            isAppUser: function() {
                var userDetail = context.authFact.getUserDetail();
                return userDetail && userDetail.userType !== 'SUPERADMIN' && userDetail.userType !== 'ADMIN';
            },
            isSuperAdmin: function() {
                var userDetail = context.authFact.getUserDetail();
                return userDetail && userDetail.userType === 'SUPERADMIN' && userDetail.userType || null;
            },
            isAppAdmin: function() {
                var userDetail = context.authFact.getUserDetail();
                return userDetail && userDetail.userType === 'ADMIN' && userDetail.userType || null;
            },
            isAppCustomer: function() {
                var userDetails = context.authFact.getUserDetail();
                return userDetails && userDetails.appCustomer;
            },
            isShowMenu: function(menu) {
                var disabled = menu.disableMenu || menu.disable;
                var restricked = context.commonFact.isSuperAdmin() && !context.commonFact.isAppCustomer() && menu.restricked || false;
                var isAppCustomer = !menu.restricked && context.commonFact.isAppCustomer();
                return !disabled && (restricked || isAppCustomer);
            },
            errorHandler: function(e) {
                context.authFact.logout();
                context.commonFact.goToPage(context.erpAppConfig.modules.controllers.login.page.link);
                return e;
            },
            callActions: function(actionName, params) {
                var actionMethod = actionName && (context.controller.methods[actionName] || context.authFact[actionName] || context.commonFact[actionName]);
                actionMethod && actionMethod.apply(this, params);
            },
            appModuleAccess: function() {
                var promiseRes = context.commonFact.getPromiseRes();
                var isAppCustomer = context.commonFact.isAppCustomer();
                var userDetail = context.authFact.getUserDetail();
                if (isAppCustomer && userDetail) {
                    context.commonFact.getData(context.erpAppConfig.modules.controllers.admin.settings, isAppCustomer).then(function(res) {
                        context.erpAppConfig = angular.extend(context.erpAppConfig, res.data);
                        if (context.commonFact.isAppUser()) {
                            for (var i in context.erpAppConfig.mapping) {
                                var map = context.erpAppConfig.mapping[i];
                                var module = context.commonFact.getDeepProp(context.erpAppConfig.modules.controllers, map.module) || {};
                                if (!userDetail.userType || (userDetail.userType && map.restrictUser !== userDetail.userType)) {
                                    module.disable = map.restrictUser && true;
                                }
                                if (module.page && (module.page.actions || module.page.actions === undefined)) {
                                    module.page.actions = {
                                        print: true
                                    };
                                    module.page.actions.add = map.restrictUser === userDetail.userType && map['add'] || false;
                                    module.page.actions.edit = map.restrictUser === userDetail.userType && map['edit'] || false;
                                    module.page.actions.delete = map.restrictUser === userDetail.userType && map['delete'] || false;
                                }
                            }
                        }
                        promiseRes.resolve();
                    });
                } else {
                    promiseRes.resolve();
                }
                return promiseRes.promise;
            },
            getPromiseRes: function() {
                var returnPromiseRes;
                var returnPromiseRej;
                var returnPromise = new Promise(function(res, rej) {
                    returnPromiseRes = res;
                    returnPromiseRej = rej;
                });
                return {
                    promise: returnPromise,
                    resolve: returnPromiseRes,
                    reject: returnPromiseRej
                };
            }
        };
    };
};

erpApp.factory('commonFact', erpConfig.moduleFiles.commonFact);
erpConfig.moduleFiles.appCustomers = function(context) {
    return {
        callBackList: function() {
            var moduleField = context.controller.form.mapping.fields['module'];
            moduleField.options = {
                all: {
                    'optionName': 'All',
                    'optionId': 'all'
                }
            };
            moduleField.allOptions = {
                all: {
                    'optionName': 'All',
                    'optionId': 'all'
                }
            };
            context.controller.methods.makeModuleOptions(context.erpAppConfig.modules.controllers, moduleField);


        },
        makeModuleOptions: function(modules, field, parentModule) {
            for (var i in modules) {
                var module = angular.copy(modules[i]);
                var optionIdVal = parentModule && parentModule.id + '/' + module.id || module.id;
                var optionNameVal = parentModule && '-- ' + module.title || module.title;
                if (module.defaultRelease === undefined) {
                    field.allOptions[optionIdVal] = module;
                    field.allOptions[optionIdVal]['optionName'] = optionNameVal;
                    field.allOptions[optionIdVal]['optionId'] = optionIdVal;
                    field.options[optionIdVal] = field.allOptions[optionIdVal];

                    if (!module.page) {
                        context.controller.methods.makeModuleOptions(context.commonFact.showSubModule(modules[i]), field, modules[i]);
                    }
                }
            }
        },
        callBackSubmit: function(data) {
            var appCustomer = data.id;
            var userData = {
                userName: data.companyName.replace(' ', '').toLowerCase(),
                password: data.companyName.replace(' ', '').toLowerCase(),
                userType: 'ADMIN'
            };
            var appSettings = {
                dataUri: 'restrict/settings',
                params: {
                    appCustomer: appCustomer
                }
            };

            var appUsers = {
                dataUri: 'data/users',
                params: {
                    appCustomer: appCustomer
                }
            };
            context.commonFact.updateData(appSettings, { id: appCustomer, appModules: data.mapping }).then(function() {
                !context.controller.page.editKey && context.commonFact.updateData(appUsers, userData);
            });
        },
        callBackDelete: function(id) {
            var removeAppCustomer = {
                dataUri: 'removeAppCustomer',
                params: {
                    appCustomer: id
                }
            };
            context.commonFact.getData(removeAppCustomer);
        },
        downloadAppCustomer: function(data) {
            var id = data.id;
            window.open('/appCustomers/' + id);
        }
    };
};
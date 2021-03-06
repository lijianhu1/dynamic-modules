var app = angular.module('app', ['ui.router', 'oc.lazyLoad']);
app.controller('root', function ($rootScope, $urlRouter, $ocLazyLoad, $location) {
    $rootScope.$on('$locationChangeSuccess', function () {//url地扯改变或者刷新
        if (!$location.path()) {
            $location.path('/root');
        } else {
            if ($location.path() == '/root/') {
                $location.path('/root');
            }
        }
        var moduleName = $location.path();
        var modules = moduleName.substring(1).split('/');
        var prefixModules = [];
        modules.forEach(function (module) {
            var _module = module;
            var filter = _module.match(/\[\d+\]/g);
            if (filter) {
                _module = module.replace(/\[\d+\]/g, '');
            }
            prefixModules.push(_module);
            loadModule($ocLazyLoad, $urlRouter, prefixModules.join('/'), filter);//加载模块
        });
    });
});

function loadModule($ocLazyLoad, $urlRouter, moduleName, filter, fun) {
    moduleName = moduleName[0] != '/' ? ('/' + moduleName) : moduleName
    var loadFiles = ['/module/_config' + moduleName + '.js', moduleName + '/_res/js/router.js', moduleName + '/_res/js/controller.js'];
    if (filter) {
        var filterStr = filter.pop();
        if (filterStr == '[123]') {
            return;
        }
        if (filterStr.match('1')) {//不加载config.js配置文件
            loadFiles.shift(0);
            if (filterStr.match('2')) {//不加载router.js路由文件
                loadFiles.shift(0);
                $ocLazyLoad.load(loadFiles[0]).then(function () {
                    $urlRouter.sync();
                    if (fun) {
                        fun();
                    }
                });
            } else {
                $ocLazyLoad.load(loadFiles[0]).then(function () {
                    loadFiles.shift(0);
                    $ocLazyLoad.load(loadFiles[0]).then(function () {
                        $urlRouter.sync();
                        if (fun) {
                            fun();
                        }
                    });
                });
            }
            return;
        } else if (filterStr.match('2')) {//不加载controller.js控制器文件
            loadFiles.splice(1, 1);
            $ocLazyLoad.load(loadFiles[0]).then(function () {
                loadFiles.shift(0);
                $ocLazyLoad.load(loadFiles[0]).then(function () {
                    $urlRouter.sync();
                    if (fun) {
                        fun();
                    }
                });
            });
            return;
        }
    }

    $ocLazyLoad.load(loadFiles[0]).then(function () {
        loadFiles.shift(0);
        $ocLazyLoad.load(loadFiles[0]).then(function () {
            loadFiles.shift(0);
            $ocLazyLoad.load(loadFiles[0]).then(function () {
                $urlRouter.sync();
                if (fun) {
                    fun();
                }
            });
        });
    });

}


app.config(function ($provide, $urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
    $provide.decorator('$state', function ($delegate, $ocLazyLoad, $urlRouter) {//ui-router 渲染
        var state = {};
        angular.copy($delegate, state);
        $delegate.transitionTo = function (uiRouter) {
            var args = arguments;
            var uiRouter = args[0];
            if (uiRouter.self) {//刷新进来
                var name = uiRouter.self.name;
                if (name != 'root') {
                    name = '/' + name.split('.').join('/');
                }

                var filter = name.match(/\[\d+\]/g);
                if (filter) {
                    name = name.replace(/\[\d+\]/g, '');
                }

                if (filter) {
                    if (!filter.pop().match('3')) {
                        $ocLazyLoad.load([name + '/_res/js/controller.js']).then(function () {
                            state.transitionTo.apply(null, args);
                        });
                    }
                } else {
                    $ocLazyLoad.load([name + '/_res/js/controller.js']).then(function () {
                        state.transitionTo.apply(null, args);
                    });
                }
            } else {// ui-sref 点击进来
                if (uiRouter[0] == '.') {//判断是否有相对路径 .user
                    var sname = args[2].relative.self.name;
                    var snames = sname.split('.');
                    var uiRouters = uiRouter.substring(1).split('.');
                    if (uiRouters[0] == snames[snames.length - 1]) {//
                        uiRouters.shift(1);
                        uiRouter = (sname + '.' + uiRouters.join('.'));
                    } else {
                        var len = sname.indexOf(uiRouter) != -1 ? sname.indexOf(uiRouter) : sname.length;
                        uiRouter = sname.substring(0, len) + uiRouter;
                    }

                }
                var path = uiRouter;
                var filter = path.match(/\[\d+\]/g);
                if (filter) {
                    path = path.replace(/\[\d+\]/g, '');
                }

                loadModule($ocLazyLoad, $urlRouter, path.split('.').join('/'), filter, function () {
                    state.transitionTo.apply(null, args);
                });
            }
        }
        return $delegate;
    });

});
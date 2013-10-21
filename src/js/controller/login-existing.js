define(function(require) {
    'use strict';

    var appController = require('js/app-controller');

    var LoginExistingCtrl = function($scope, $location) {
        
        $scope.confirmPassphrase = function() {
            var passphrase = $scope.passphrase,
                emailDao = appController._emailDao;

            if (!passphrase) {
                return;
            }

            unlockCrypto(imapLogin);

            function unlockCrypto(callback) {
                var userId = emailDao._account.emailAddress;
                emailDao._keychain.getUserKeyPair(userId, function(err, keypair) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    emailDao.unlock(keypair, passphrase, callback);
                });
            }

            function imapLogin(err) {
                if (err) {
                    console.error(err);
                    return;
                }

                // login to imap backend
                appController._emailDao.imapLogin(function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    onLogin();
                });
            }
        };

        function onLogin() {
            $location.path('/desktop');
            $scope.$apply();
        }
    };

    return LoginExistingCtrl;
});
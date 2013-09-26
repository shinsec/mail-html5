define(function(require) {
    'use strict';

    var _ = require('underscore'),
        appController = require('js/app-controller'),
        emailDao;

    var MailListCtrl = function($scope) {
        var offset = -6,
            num = 0;

        // show inbox at the beginning
        $scope.folder = 'INBOX';
        emailDao = appController._emailDao;

        $scope.select = function(email) {
            email.bodyDisplayParts = email.body.split('\n');
            $scope.selected = email;
            // set selected in parent scope ro it can be displayed in the read view
            $scope.$parent.selected = $scope.selected;
        };

        // production... in chrome packaged app
        if (window.chrome && chrome.identity) {
            initList();
            return;
        }

        // development
        createDummyMails(function(emails) {
            $scope.emails = emails;
            $scope.select($scope.emails[0]);
        });

        function initList() {
            // list messaged from local db
            listLocalMessages({
                folder: $scope.folder,
                offset: offset,
                num: num
            }, function() {
                // sync from imap to local db
                syncImapFolder({
                    folder: $scope.folder,
                    offset: offset,
                    num: num
                }, function() {
                    // list again from local db after syncing
                    listLocalMessages({
                        folder: $scope.folder,
                        offset: offset,
                        num: num
                    }, function() {
                        console.log('syncing ' + $scope.folder + ' complete');
                    });
                });
            });
        }

        function syncImapFolder(options, callback) {
            // sync if emails are empty
            emailDao.imapSync(options, function(err) {
                if (err) {
                    console.log(err);
                    return;
                }

                callback();
            });
        }

        function listLocalMessages(options, callback) {
            emailDao.listMessages(options, function(err, emails) {
                if (err) {
                    console.log(err);
                    return;
                }
                // add display dates
                displayEmails(emails);

                callback(emails);
            });
        }

        function displayEmails(emails) {
            if (!emails || emails.length < 1) {
                return;
            }

            // sort by uid
            emails = _.sortBy(emails, function(e) {
                return -e.uid;
            });

            $scope.emails = emails;
            $scope.select($scope.emails[0]);
            $scope.$apply();
        }
    };

    function createDummyMails(callback) {
        var Email = function(unread, attachments, replied) {
            this.uid = '1';
            this.from = [{
                name: 'Whiteout Support',
                address: 'support@whiteout.io'
            }]; // sender address
            this.to = [{
                address: 'max.musterman@gmail.com'
            }]; // list of receivers
            this.attachments = (attachments) ? [true] : undefined;
            this.unread = unread;
            this.replied = replied;
            this.sentDate = new Date('Thu Sep 19 2013 20:41:23 GMT+0200 (CEST)');
            this.subject = "Welcome Max"; // Subject line
            this.body = "Hi Max,\n\n" +
                "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n\n" +
                "Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet.\n\n" +
                "Best regards\nYour whiteout team"; // plaintext body
        };

        var dummys = [new Email(true, true), new Email(true), new Email(false, true, true), new Email(false), new Email(false), new Email(false)];

        callback(dummys);
    }

    return MailListCtrl;
});
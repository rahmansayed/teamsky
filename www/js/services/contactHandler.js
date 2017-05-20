angular.module('starter.services')

  .factory('contactHandler', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, dbHandler,
                                       $cordovaContacts, $http, global, $state) {

    var formatContact = function (contact) {

      return {
        "name": contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
        "emails": contact.emails || [],
        "numbers": ';' + (contact.phoneNumbers || []).join(';') + ';',
        "photos": contact.photos.length == 0 ? null : contact.photos[0]
      };

    };

    /******************************************************************************************************************
     * this function will convert the phone number in the international format starting with +
     * @param EnteredPhoneNumber
     * @returns {string}
     */
    var formatPhoneNumber = function (EnteredPhoneNumber) {
      var formattedNumber = ' ';
      console.log('formatPhoneNumber EnteredPhoneNumber = ' + EnteredPhoneNumber);
      var phoneNumber = EnteredPhoneNumber.replace(/\s+/g, '');
      if (!(phoneNumber.substr(0, 1) == '+' || phoneNumber.substr(0, 2) == '00')) {
        if (phoneNumber.substr(0, 1) == '0') {

          formattedNumber = '+966'.concat(phoneNumber.substr(1));
          console.log('formatPhoneNumber Formatted No' + formattedNumber)
        }
        else {

          formattedNumber = global.countryCode.concat(phoneNumber);
          console.log('formatPhoneNumber Formatted No' + formattedNumber)
        }
      }
      else if (phoneNumber.substr(0, 2) == '00') {
        formattedNumber = "+".concat(phoneNumber.substr(2));

        console.log('formatPhoneNumber No is in international Format' + formattedNumber)
      } else {
        formattedNumber = phoneNumber;
        console.log('formatPhoneNumber No is in international Format' + formattedNumber)
      }

      return formattedNumber

    };

    function listContactsUpstreamer() {
      var defer = $q.defer();
      var promises = [];
      global.db.transaction(function (tx) {
        var query = "select l.*, c.*" +
          " from list l, listUser lu, contact c" +
          " where c.contactLocalId = lu.contactLocalId " +
          " and l.listLocalId = lu.listLocalId " +
          " and lu.flag = 'N' ";
        tx.executeSql(query, function (tx, res) {
          for (var i = 0; i < res.rows.length; i++) {
            promises.push(addListContactUpstream({
              listServerId: res.rows.item(i).listServerId
            }, {
              contactServerId: res.rows.item(i).contactServerId,
              contactName: res.rows.item(i).contactName
            }));
          }
          $q.all(promises).then(function () {
            defer.resolve();
          }, function () {
            defer.reject();
          })
        });
      }, function (err) {

      }, function () {

      });

      return defer.promise;
    }

    function addListContactUpstream(list, contact) {
      listDetail = {
        listServerId: list.listServerId,
        invitedUserServerId: contact.contactServerId,
        deviceServerId: global.deviceServerId,
        userServerId: global.userServerId,
        contactName: contact.contactName
      };
      return $http.post(global.serverIP + "/api/list/invite", listDetail);
    }

    var pickContact = function (list) {

      var deferred = $q.defer();

      console.log("pickContact ");
      /*
       var onSuccess = function (contact) {
       console.log("pickContact findContact contact = " + JSON.stringify(contact));
       };

       var onError = function (error) {
       console.log("pickContact findContact error = " + JSON.stringify(error));
       };
       var options = new ContactFindOptions();
       options.filter = "0595976779";
       options.multiple = true;
       //options.desiredFields = [navigator.contacts.fieldType.id];


       var fields = [navigator.contacts.fieldType.phoneNumbers];

       try {
       navigator.contacts.find(fields, onSuccess, onError, options);
       } catch (err) {
       console.log("pickContact navigator.contacts.find contact = " + JSON.stringify(err));
       }

       var opts = {                                           //search options
       filter: "0595976779",                                 // 'Bob'
       multiple: true,                                      // Yes, return any contact that matches criteria
       fields: ['*']                   // These are the fields to search for 'bob'.
       //desiredFields: [id];    //return fields.
       };
       */


      /*
       try {
       $cordovaContacts.find(opts).then(function (contact) {
       console.log("pickContact $cordovaContacts contact = " + JSON.stringify(contact));
       });
       } catch (err) {
       console.err('$cordovaContacts.find err = ' + JSON.stringify(err));
       }
       */
      if (navigator && navigator.contacts) {
        navigator.contacts.pickContact(function (contact) {
            console.log("pickContact contact = " + JSON.stringify(contact));
            var newContact = {
              "contactName": contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
              "emails": contact.emails || []/*,
               "photos": contact.photos ? (contact.photos.length == 0 ? null : contact.photos[0].value) : null*/
            };
            newContact.numbers = (contact.phoneNumbers || []).map(function (phoneNumber) {
              return formatPhoneNumber(phoneNumber.value);
            });
            // checking if the contact in the local db
            getContactLocalId(newContact).then(function (resultContact) {
              if (resultContact.contactLocalId != -1) {
                addListContact(list.listLocalId, resultContact.contactLocalId).then(function () {
                  addListContactUpstream(list, resultContact).then(function () {
                    updateListUserStatusAfterSuccessfullServer();
                    $state.reload();
                  });
                  deferred.resolve();
                });
              }
              else {
                // check the contact status from the server
                var prospect = {
                  name: newContact.name,
                  numbers: newContact.numbers
                };

                checkProspect(prospect, list.listServerId).then(function (contactServerId) {
                  newContact.contactServerId = contactServerId;
                  insertContact(newContact).then(function (resultContact2) {
                    console.log("pickContact insertContact resultContact2 = " + JSON.stringify(resultContact2));
                    // download contact photo if exists.
                    downloadContactPhoto(contactServerId);
                    addListContact(list.listLocalId, resultContact2.contactLocalId);
                    //call the server invite API
                    addListContactUpstream(list, resultContact2).then(function () {
                      updateListUserStatusAfterSuccessfullServer();
                      $state.reload();
                    });
                  });
                }, function () {
                  insertContact(newContact).then(function (resultContact2) {
                    addListContact(list.listLocalId, resultContact2.contactLocalId);
                  });
                });
              }
            });

            deferred.resolve();
          }
        );
      }
      else {
        deferred.reject("No contacts in desktop browser");
      }
      return deferred.promise;
    }

    function updateListUserStatusAfterSuccessfullServer(listLocalId, contactLocalId) {
      var defer = $q.defer();
      global.db.transaction(function (tx) {
        var query = "update listUser " +
          " set flag ='S' " +
          " where listLocalId = ? " +
          " and contactLocalId = ? ";
        tx.executeSql(query, [listLocalId, resultContact2.contactLocalId]);
      }, function (err) {
        console.error("updateListUserStatusAfterSuccessfullServer error = " + err.message);
        defer.reject();
      }, function () {
        defer.resolve();
      });

      return defer.promise;
    }

    var chooseContact = function () {

      var deferred = $q.defer();

      console.log("chooseContact ");

      if (navigator && navigator.contacts) {
        navigator.contacts.pickContact(function (contact) {
            console.log("chooseContact contact = " + JSON.stringify(contact));
            var newContact = {
              "contactName": contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
              "emails": contact.emails || []/*,
               "photos": contact.photos ? (contact.photos.length == 0 ? null : contact.photos[0].value) : null*/
            };
            newContact.numbers = (contact.phoneNumbers || []).map(function (phoneNumber) {
              return formatPhoneNumber(phoneNumber.value);
            });
            // checking if the contact in the local db
            getContactLocalId(newContact).then(function (resultContact) {
              if (resultContact.contactLocalId != -1) {
                /*                addListContact(list.listLocalId, resultContact.contactLocalId).then(function () {
                 addListContactUpstream(list, resultContact).then(function () {
                 $state.reload();
                 });
                 deferred.resolve();
                 });*/
                deferred.resolve();
                console.log("chooseContact contact = " + JSON.stringify(contact));
              }
              else {
                // check the contact status from the server
                var prospect = {
                  name: newContact.name,
                  numbers: newContact.numbers
                };

                /*checkProspect(prospect, list.listServerId).then(function (contactServerId) {*/
                //newContact.contactServerId = contactServerId;
                insertContact(newContact).then(function (resultContact2) {
                  console.log("chooseContact insertContact resultContact2 = " + JSON.stringify(resultContact2));
                  // download contact photo if exists.
                  //downloadContactPhoto(contactServerId);
                  /*addListContact(list.listLocalId, resultContact2.contactLocalId);*/
                  //call the server invite API
                  /*               addListContactUpstream(list, resultContact2).then(function () {
                   $state.reload();
                   });*/
                });
                /*                }, function () {
                 insertContact(newContact).then(function (resultContact2) {
                 addListContact(list.listLocalId, resultContact2.contactLocalId);
                 });
                 });*/
              }
            });

            deferred.resolve(resultContact2);
          }
        );
      }
      else {
        deferred.reject("No contacts in desktop browser");
      }
      return deferred.promise;
    }


    function addListContact(listLocalId, contactLocalId) {

      var deferred = $q.defer();
      console.log("addListContact listLocalId = " + listLocalId);
      console.log("addListContact contactLocalId = " + contactLocalId);
      // check if the contact was added to the list and deactivated

      global.db.transaction(function (tx) {
        var checkQuery = "select deleted " +
          " from listUser lu" +
          " where lu.listLocalId = ? " +
          " and lu.contactLocalId = ? ";
        tx.executeSql(checkQuery, [listLocalId, contactLocalId], function (tx, res) {
          if (res.rows.length > 0) {
            console.log("addListContact res.rows.item(0).deleted = " + res.rows.item(0).deleted);
            if (res.rows.item(0).deleted != 'N') {
              var updateQuery = "update listUser " +
                " set deleted = 'N', flag = 'N' " +
                " where listLocalId = ? " +
                " and contactLocalId = ? ";
              tx.executeSql(updateQuery, [listLocalId, contactLocalId], function (tx, res2) {
                deferred.resolve();
              }, function (err) {
                console.error('addListContact fail update query ' + err.message);
                deferred.reject();
              });
            }
          }
          else {
            var query = "insert " +
              " into listUser (listLocalId ,contactLocalId ,privilage ,lastUpdateDate ,lastUpdateBy, flag ) values (?,?,?,?,?, 'N')";

            tx.executeSql(query, [listLocalId, contactLocalId, null, new Date().getTime(), null], function (tx, response) {
              //Success Callback
              console.log('addListContact response.insertId' + JSON.stringify(response.insertId));
              listUserId = response.insertId;
              console.log('contact: ' + JSON.stringify(listUserId));
              deferred.resolve(response);
            }, function (error) {
              //Error Callback
              console.error('addListContact fail insert query ' + error);
              deferred.reject(error);
            });
          }
        }, function (err) {
          console.error('addListContact fail check query ' + err);
        });
      }, function (err) {

      }, function () {

      });
      /*console.log('Master Deferred Promise: '+ JSON.stringify(deferred.promise));*/
      return deferred.promise;
    };

    function updateContactStatus(contactLocalId, status, contactServerId) {

      var deferred = $q.defer();

      var query = "update contact  set contactStatus=?,contactServerId=?,lastUpdateDate=?,lastUpdateby = ? where contactLocalId = ?";

      dbHandler.runQuery(query, [status, contactServerId, new Date().getTime(), 'S', contactLocalId], function (response) {
        //Success Callback
        console.log('13/2/2017 - ContactHandler - aalatief : Success Contact Status - Server Id update' + JSON.stringify(response));
        /*            listUserId = response;
         console.log('contact: ' + JSON.stringify(listUserId));*/
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.error('13/2/2017 - ContactHandler - aalatief : Fail Contact Status - Server Id update ' + error);
        deferred.reject(error);
      });
      /*console.log('Master Deferred Promise: '+ JSON.stringify(deferred.promise));*/
      return deferred.promise;
    };

    function checkProspect(prospect, listServerId) {
      console.log("checkProspect prospect = " + JSON.stringify(prospect));
      var defer = $q.defer();
      var data = {
        userServerId: global.userServerId,
        contact: prospect,
        listServerId: listServerId
      };

      $http.post(global.serverIP + '/api/user/check', data).then(function (res) {
        console.log("checkProspect " + JSON.stringify(prospect) + " server response " + JSON.stringify(res));
        if (prospect.prospectLocalId) {
          updateContactStatus(prospect.prospectLocalId, 'S', res.userServerId);
        }
        defer.resolve(res.data.userServerId);
      }, function (err) {
        console.log("checkProspect prospect = " + JSON.stringify(prospect));
        defer.reject('0000');
      });
      return defer.promise;
    };

    function checkProspects() {
      var defer = $q.defer();

      var query = "select * from contact where contactStatus = 'P'";
      global.db.transaction(function (tx) {
        tx.executeSql(query, [], function (tx, res) {
          for (var i = 0; i < res.rows.length; i++) {
            var prospect = {
              name: res.rows.item(0).contactName,
              numbers: [],
              prospectLocalId: res.rows.item(i).contactLocalId
            };
            prospect.numbers = res2.rows.item(i).phoneNumber.split(';');
            checkProspect(prospect);
          }
        }, function (err) {
          console.log("checkProspects Query err " + err);
          defer.reject();
        });
      }, function (err) {
        console.error("checkProspects db err " + err);
      }, function () {
        defer.resolve();
      });
      return defer.promise;
    }

    function getContactLocalId(contact) {
      var defer = $q.defer();
      console.log("getContactLocalId contact = " + JSON.stringify(contact));
      global.db.transaction(function (tx) {
        var query = "select contactLocalId, contactServerId, contactName from contact where ";
        query = contact.numbers.reduce(function (query, number) {
          return query + "( phoneNumber like '%;" + number + ";%' ) or ";
        }, query);
        query = query.substr(0, query.length - 3);
        console.log("getContactLocalId query = " + query);

        tx.executeSql(query, [], function (tx, res) {
          if (res.rows.length > 0) {
            console.log("getContactLocalId res.rows.item(0).contactLocalId = " + res.rows.item(0).contactLocalId);
            defer.resolve(res.rows.item(0));
          } else {
            defer.resolve({
              contactLocalId: -1,
              contactServerId: -1,
              contactName: ''
            });
          }
        }, function (err) {
          console.error("getContactLocalId err = " + err.message);
          defer.reject();
        });
      });

      return defer.promise;
    }

    function insertContact(contact) {
      var defer = $q.defer();

      console.log('insertContact contact = ' + JSON.stringify(contact));
      global.db.transaction(function (tx) {
          var insertQuery = "insert into contact (contactLocalId, contactName, phoneNumber, contactStatus, contactServerId, photo) " +
            " values (null, ?, ?, ?, ?, ?) ";

          var numberList = ';' + contact.numbers.join(';') + ';';
          var contactServerId = contact.contactServerId || '';
          var contactPhoto = contact.photos || '';
          var contactStatus = (contact.contactServerId) ? 'S' : 'P';
          tx.executeSql(insertQuery, [contact.contactName, numberList, contactStatus, contactServerId, contactPhoto], function (tx, res) {
            console.log("insertContact res.insertId = " + res.insertId);
            contact.contactLocalId = res.insertId;
            defer.resolve(contact);
          }, function (err) {
            console.error("insertContact insertQuery err = " + err.message);
            console.error("insertContact insertQuery err contact = " + JSON.stringify(contact));
            console.error("insertContact insertQuery err numberList = " + JSON.stringify(numberList));
            console.error("insertContact insertQuery err contactServerId = " + JSON.stringify(contactServerId));
            console.error("insertContact insertQuery err contactPhoto = " + JSON.stringify(contactPhoto));
            console.error("insertContact insertQuery err contactStatus = " + JSON.stringify(contactStatus));
            defer.reject(err);
          });
        }
        , function (err) {
          console.error("insertContact query err = " + err.message);
          defer.reject(err);
        });

      return defer.promise;
    }

    function upsertContact(contact) {
      var defer = $q.defer();
      console.log("upsertContact contact = " + JSON.stringify(contact));
      global.db.transaction(function (tx) {
        var query = "select contactLocalId, contactServerId, contactName from contact where ";
        query = contact.numbers.reduce(function (query, number) {
          return query + "( phoneNumber like '%;" + number + ";%' ) or ";
        }, query);
        query = query.substr(0, query.length - 3);
        console.log("getContactLocalId query = " + query);

        tx.executeSql(query, [], function (tx, res) {
          if (res.rows.length > 0) {
            console.log("getContactLocalId res.rows.item(0).contactLocalId = " + res.rows.item(0).contactLocalId);
            defer.resolve(res.rows.item(0));
          } else {
            var insertQuery = "insert into contact (contactLocalId, contactName, phoneNumber, contactStatus, contactServerId, photo) " +
              " values (null, ?, ?, ?, ?, ?) ";

            var numberList = ';' + contact.numbers.join(';') + ';';
            var contactServerId = contact.contactServerId || '';
            var contactPhoto = contact.photos || '';
            var contactStatus = (contact.contactServerId) ? 'S' : 'P';
            tx.executeSql(insertQuery, [contact.name, numberList, contactStatus, contactServerId, contactPhoto], function (tx, res) {
              console.log("upsertContact res.insertId = " + res.insertId);
              contact.contactLocalId = res.insertId;
              defer.resolve(contact);
            }, function (err) {
              console.error("insertContact insertQuery err = " + err.message);
              console.error("insertContact insertQuery err contact = " + JSON.stringify(contact));
              console.error("insertContact insertQuery err numberList = " + JSON.stringify(numberList));
              console.error("insertContact insertQuery err contactServerId = " + JSON.stringify(contactServerId));
              console.error("insertContact insertQuery err contactPhoto = " + JSON.stringify(contactPhoto));
              console.error("insertContact insertQuery err contactStatus = " + JSON.stringify(contactStatus));
              defer.reject(err);
            });
          }
        });
      });
      return defer.promise;
    }

    /*----------------------------------------------------------------------------------------*/


    function downloadContactPhoto(contactServerId) {
      var defer = $q.defer();
      var fileTransfer = new FileTransfer();
      var uri = encodeURI(global.serverIP + "/photos/downloadUserPhoto/" + contactServerId + '.jpg');

      fileTransfer.download(
        uri,
        cordova.file.externalApplicationStorageDirectory + '/contactPhotos/' + contactServerId + '.jpg',
        function (entry) {
          console.log("download complete entry.toURL(): " + entry.toURL());
          console.log("download complete entry.toURI(): " + entry.toURI());
          // update contact table with contact photo
          global.db.transaction(function (tx) {
            var query = "UPDATE contact SET photo = ? where contactServerId = ?";
            tx.executeSql(query, [entry.toURL(), contactServerId]);
          }, function (err) {
            console.error("downloadContactPhoto db transaction failed err = " + JSON.stringify(err));
          }, function () {

          });
          defer.resolve(entry.toURL());
        },
        function (error) {
          console.error("download error source " + error.source);
          console.error("download error target " + error.target);
          console.error("download error code" + error.code);
          defer.reject(error);
        },
        false,
        {
          headers: {
            "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
          }
        }
      );
      return defer.promise;
    }

    return {
      pickContact: pickContact,
      chooseContact: chooseContact,
      formatPhoneNumber: formatPhoneNumber,
      addListContact: addListContact,
      addListContactUpstream: addListContactUpstream,
      getContactLocalId: getContactLocalId,
      updateContactStatus: updateContactStatus,
      checkProspects: checkProspects,
      upsertContact: upsertContact,
      downloadContactPhoto: downloadContactPhoto,
      listContactsUpstreamer: listContactsUpstreamer
    };


  })
;


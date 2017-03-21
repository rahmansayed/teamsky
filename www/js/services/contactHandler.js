angular.module('starter.services')

  .factory('contactHandler', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, dbHandler,
                                       $cordovaContacts, $http, global) {

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
            "name": contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
            "emails": contact.emails || [],
            "numbers": ';' + (contact.phoneNumbers || []).join(';') + ';',
            "photos": contact.photos.length == 0 ? null : contact.photos[0]
          };

          // checking if the contact in the local db
          getContactLocalId(newContact).then(function (contactLocalId) {
            if (contactLocalId != -1) {
              addListContact(listLocalId, contactLocalId);
            }
            else {
              // check the contact status from the server
              var prospect = {
                name: newContact.name
              };

              prospect.numbers = contact.phoneNumbers.map(function (phoneNumber) {
                return formatPhoneNumber(phoneNumber);
              });

              checkProspect(prospect).then(function (contactServerId) {
                newContact.userServerId = contactServerId;
                insertContact(newContact).then(function (contactLocalId) {
                  addListContact(list.listLocalId, contactLocalId);
                  //call the server invite API
                  listDetail = {
                    listServerId: list.listServerId,
                    invitedUserServerId: contactServerId,
                    contactName: newContact.name
                  }
                  $http.post(global.serverIP + "/api/list/invite", listDetail).then(function (response) {
                    console.log('pickContact invite server response = ' + JSON.stringify(response));
                    $state.reload();
                  }, function (error) {
                  });

                });
              }, function () {
                insertContact(newContact).then(function (contactLocalId) {
                  addListContact(list.listLocalId, contactLocalId);
                });
              });
            }
          });
          deferred.resolve(formatContact(contact));
        });
      } else {
        deferred.reject("No contacts in desktop browser");
      }

      return deferred.promise;
    };

    function addLocalContact(contact) {

      var deferred = $q.defer();

      var query = "insert or ignore into contact(contactLocalId,contactName,phoneNumber,phoneType,contactServerId,contactStatus,photo,lastUpdateDate,lastUpdateBy) values (?,?,?,?,?,?,?,?,?)";
      getMaxContactLocalId()
        .then(function (response) {
            maxContactId = response.rows.item(0).maxId + 1;
            console.log('11/2/2017 - contactHandler - aalatief :maxContactId ' + JSON.stringify(maxContactId));
            for (var i = 0; i < (contact || []).length; i++) {
              dbHandler.runQuery(query, [maxContactId, contact[i].displayName, contact[i].phoneValue, contact[i].phoneType, '', 'N', contact[i].photo, new Date().getTime(), 'U'], function (response) {
                //Success Callback
                console.log(response);
                deferred.resolve(response.insertId);
              }, function (error) {
                //Error Callback
                console.log(error);
                deferred.reject(error);
              });
            }
            ;

          },

          function (error) {
            console.log('11/2/2017 - contactHandler - aalatief :error ');
          });


      return deferred.promise;
    };

    function addListContact(listLocalId, contactLocalId) {

      var deferred = $q.defer();

      var query = "insert into listUser (listLocalId ,contactLocalId ,privilage ,lastUpdateDate ,lastUpdateBy ) values (?,?,?,?,?)";

      dbHandler.runQuery(query, [listLocalId, contactLocalId, null, new Date().getTime(), null], function (response) {
        //Success Callback
        console.log('11/2/2017 - ContactHandler - aalatief : Success List Contact Added' + JSON.stringify(response.rows));
        listUserId = response.insertId;
        console.log('contact: ' + JSON.stringify(listUserId));
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.error('fail Master query ' + error);
        deferred.reject(error);
      });
      /*console.log('Master Deferred Promise: '+ JSON.stringify(deferred.promise));*/
      return deferred.promise;
    };

    function getMaxContactLocalId() {
      var deferred = $q.defer();
      var query = "select max(c.contactLocalId) maxId from contact as c ";
      //var query = "SELECT i.itemLocalId, i.itemName, i.categoryLocalId FROM masterItem ";
      dbHandler.runQuery(query, [], function (response) {
        //Success Callback
        console.log('Success local contact Id ' + JSON.stringify(response.rows));
        contact = response.rows.item(0);
        console.log('contact: ' + JSON.stringify(contact));
        deferred.resolve(response);
      }, function (error) {
        //Error Callback
        console.error('fail Master query ' + error);
        deferred.reject(error);
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

    function checkProspect(prospect) {
      console.log("checkProspect prospect = " + JSON.stringify(prospect));
      var defer = $q.defer();
      var data = {
        userServerId: global.userServerId,
        contact: prospect
      };

      $http.post(global.serverIP + '/api/user/check', data).then(function (res) {
        console.log("checkProspect " + JSON.stringify(prospect) + " server response " + JSON.stringify(res));
        if (prospect.prospectLocalId) {
          updateContactStatus(prospect.prospectLocalId, 'S', res.userServerId);
        }
        defer.resolve(res.userServerId);
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
        var query = "select contactLocalId from contact where ";
        query = contact.numbers.reduce(function (query, number) {
          return query + "( phoneNumber like '%;" + number + ";%' ) or ";
        }, query);
        query = query.substr(0, query.length - 3);
        console.log("getContactLocalId query = " + query);

        tx.executeSql(query, [], function (tx, res) {
          if (res.rows.length > 0) {
            console.log("getContactLocalId res.rows.item(0).contactLocalId = " + res.rows.item(0).contactLocalId);
            defer.resolve(res.rows.item(0).contactLocalId);
          } else {
            defer.resolve(-1);
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

      global.db.transaction(function (tx) {
          var insertQuery = "insert into contact (contactLocalId, contactName, phoneNumber, contactStatus, contactServerId, photo) " +
            " values (null, ?, ?, ?, ?, ?) ";

          var numberList = ';' + contact.numbers.join(';') + ';';
          var contactServerId = contact.userServerId || '';
          var contactPhoto = contact.photo || '';
          var contactStatus = (contact.userServerId) ? 'S' : 'P';
          tx.executeSql(insertQuery, [contact.name, numberList, contactStatus, contactServerId, contactPhoto], function (tx, res) {
            console.log("insertContact res.insertId = " + res.insertId);
            defer.resolve(res.insertId);
          }, function (err) {
            console.error("insertContact insertQuery err = " + err.message);
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
      getContactLocalId(contact).then(function (res) {
        if (res != -1) {
          defer.resolve(res);
        }
        else {
          insertContact(contact).then(function (res) {
            defer.resolve(res);
          }, function (err) {
            defer.reject(err);
          });

        }
      });
      return defer.promise;
    }


    return {
      pickContact: pickContact,
      addLocalContact: addLocalContact,
      formatPhoneNumber: formatPhoneNumber,
      addListContact: addListContact,
      getContactLocalId: getContactLocalId,
      updateContactStatus: updateContactStatus,
      checkProspects: checkProspects,
      upsertContact: upsertContact

    };


  })
;


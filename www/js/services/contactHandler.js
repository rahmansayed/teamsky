angular.module('starter.services')

  .factory('contactHandler', function ($ionicPlatform, $cordovaSQLite, $q, $ionicLoading, $location, dbHandler,
                                       $cordovaContacts, $http, global) {

    var formatContact = function (contact) {

      return {
        "displayName": contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
        "emails": contact.emails || [],
        "phones": contact.phoneNumbers || [],
        "photos": contact.photos || []
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

    var reorderContact = function (contacts) {

      var arrangedContact = [];
      console.log('06/02/2017 - contactHandler - aalatief: contact passed' + JSON.stringify(contacts));
      /*for (var i = 0; i < contacts.length; i++) {*/

      console.log('06/02/2017 - contactHandler - aalatief:test phone no. array' + ' length: ' + (contacts.phones || []).length + ' Array: ' + JSON.stringify(contacts.phones));
      for (var j = 0; j < (contacts.phones || []).length; j++) {

        var newContact = {
          displayName: contacts.displayName,
          phoneValue: formatPhoneNumber(contacts.phones[j].value),
          phoneType: contacts.phones[j].type
        };
        if (contacts.photos.length > 0) {
          newContact.photo = contacts.photos[0].value
        }
        if (contacts)
          arrangedContact.push(newContact);
      }
      /*}*/
      return arrangedContact;
    };


    var pickContact = function () {

      var deferred = $q.defer();

      console.log("pickContact ");
      /*      var onSuccess = function (contact) {
       console.log("pickContact findContact contact = " + JSON.stringify(contact));
       };

       var onError = function (error) {
       console.log("pickContact findContact error = " + JSON.stringify(error));
       };
       var options = new ContactFindOptions();
       options.filter = "Marwa";
       options.multiple = true;


       var fields = ["displayName", "organizations"];

       navigator.contacts.find(fields, onSuccess, onError, options);
       */
      if (navigator && navigator.contacts) {
        navigator.contacts.pickContact(function (contact) {
          console.log("pickContact contact = " + JSON.stringify(contact));
          deferred.resolve(formatContact(contact));
        });
      } else {
        deferred.reject("No contacts in desktop browser");
      }

      return deferred.promise;
    };

    function addLocalContact(contact) {

      var deferred = $q.defer();

      var query = "insert or ignore into contact(contactLocalId,contactName,phoneNumber,phoneType,contactServerId,contactStatus,photo,lastUpdateDate,lastUpdateBy) values (?,?,?,?,?,?,?,?)";
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

    function getContactLocalId(phoneNumber) {
      var deferred = $q.defer();
      var query = "select c.contactLocalId from contact as c where c.phoneNumber=?";
      //var query = "SELECT i.itemLocalId, i.itemName, i.categoryLocalId FROM masterItem ";
      dbHandler.runQuery(query, [phoneNumber], function (response) {
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
        contact: prospect.prospectNumbers
      };

      $http.post(global.serverIP + '/api/user/check', data).then(function (res) {
        console.log("checkProspect " + JSON.stringify(prospect) + " server response " + JSON.stringify(res));
        updateContactStatus(prospect.prospectLocalId, 'S', res.userServerId);
      }, function (err) {

      });
      return defer.promise;
    };

    function checkProspects() {
      var defer = $q.defer();

      var query = "select distinct contactLocalId from contact where contactStatus = 'P'";
      global.db.transaction(function (tx) {
        tx.executeSql(query, [], function (tx, res) {
          for (var i = 0; i < res.rows.length; i++) {
            var numbersQuery = "select * from contact where contactLocalId = ?";
            tx.executeSql(numbersQuery, [res.rows.item(i).contactLocalId], function (tx, res2) {
              var prospect = {
                prospectLocalId: res2.rows.item(0).contactLocalId,
                prospectNumbers: []
              };
              for (var j = 0; j < res2.rows.length; j++) {
                prospect.prospectNumbers.push(res2.rows.item(j).phoneNumber);
              }
              checkProspect(prospect);
            }, function (err) {
              console.log("checkProspects numbersQuery err " + err);
            });
          }
        }, function (err) {
          console.error("checkProspects query err " + err);
        });
      });
      return defer.promise;
    }

    return {
      pickContact: pickContact,
      formatContact: formatContact,
      reorderContact: reorderContact,
      addLocalContact: addLocalContact,
      getMaxContactLocalId: getMaxContactLocalId,
      formatPhoneNumber: formatPhoneNumber,
      addListContact: addListContact,
      getContactLocalId: getContactLocalId,
      updateContactStatus: updateContactStatus,
      checkProspects: checkProspects

    };


  })
;


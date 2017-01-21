angular.module('starter.services')

  .factory('userVerify', function ($ionicPlatform, $cordovaSQLite,$q,$ionicLoading, $location,dbHandler) {

  
        var verificationData = {
            deviceLocalId:'',
            userServerId:'',
            deviceServerId:'',
            vcode:''  
        } ;
       
    var selectedUsers =[];
    
    
/*    var x = getUserInfo()      
    .then(getUserSuccessCB,getUserErrorCB);
    */
/*
    function itemExitInList(selectedItem){
        for  (var j=0;j<selectedItems.length;j++){
            if (selectedItems[j].listLocalId == selectedItem.listLocalId && selectedItems[j].itemName.toLowerCase() == selectedItem.itemName.toLowerCase()){
               return true;
             }
        };
     return false;
      };
*/
    
    function isUserVerified(deviceLocalId){
        if (selectedUsers.length>0){

        for  (var j=0;j<selectedUsers.length;j++){
            if (selectedUsers[j].deviceLocalId == deviceLocalId && selectedUsers[j].status == 'V'){
                console.log('aalatief: user already verified!! -> '+deviceLocalId + ' '+ selectedUsers.length);
               return true;
             }
        };
        }
        console.log('aalatief: User Array Still Not Loaded-> '+deviceLocalId + ' ' + selectedUsers.length);
   
     return false;
      };
    
        function getUserSuccessCB(response)
		{
			 selectedUsers=[];
			if(response && response.rows && response.rows.length > 0)
			{

				for(var i=0;i<response.rows.length;i++)
				{
                selectedUsers.push({deviceLocalId :response.rows.item(i).deviceLocalId ,
                                    dialCode :response.rows.item(i).dialCode ,
                                   userServerId :response.rows.item(i).userServerId ,
                                   deviceServerId :response.rows.item(i).deviceServerId ,
                                   status :response.rows.item(i).status ,
                                   lastUpdateDate :response.rows.item(i).lastUpdateDate ,
                                   lastUpdateBy :response.rows.item(i).lastUpdateBy});
                     //console.log('aalatief: Pushed User '+JSON.stringfy(selectedUsers))  ;
				}
			}else
			{
				var message = "No entry created till now.";
			}
		};

		function getUserErrorCB(error)
		{
			var loadingLists = false;
			var message = "Some error occurred in fetching User";
		}
    ;

    function addUserInfo(userInfo){
                console.log('User Info Added to Table'+userInfo);
                 /*console.log('Add Item to List Case: '+ JSON.stringify(mySelectedItem));*/
     /*            if (!itemExitInList(mySelectedItem)){
                    selectedItems.push(mySelectedItem);
                    saveToLocalStorage();
                    console.log('item added in list '||mySelectedItem.categoryName);
                  */
                //Sqlite
                var deferred = $q.defer();
                var query = "INSERT INTO userInfo (deviceLocalId,dialCode,userServerId,deviceServerId,status,lastUpdateDate,lastUpdateBy) VALUES (?,?,?,?,?,?,?)";
                dbHandler.runQuery(query,[userInfo.deviceLocalId,userInfo.dialCode,userInfo.userServerId,userInfo.deviceServerId,userInfo.status,new Date().getTime(),'U'],function(response){
                    //Success Callback
                    console.log(response);
                    deferred.resolve(response);
                },function(error){
                    //Error Callback
                    console.log(error);
                    deferred.reject(error);
                });

                return deferred.promise;
            /* }*/
                
            };
              function updateUserInfo(userInfo,status){
/*
                 console.log('Is Item Checked: '+isItemChecked(listItem));
                 if (!isItemChecked(listItem)){
                    checkedItems.push(listItem);
                    //window.localStorage['checkedItems'] = angular.toJson(checkedItems) ;
*/

                  for (var i = 0; i < selectedUsers.length; i++) {

                      if (selectedUsers[i].deviceLocalId ==userInfo.deviceLocalId) {
                       
                        selectedUsers[i].status= status;
                      
                         var deferred = $q.defer();
                         var query =  'update userInfo  set status=?,lastUpdateDate=?,lastUpdateBy=? where deviceLocalId =?';
                          
                        console.log('aalatief: Update user staus '+userInfo.deviceLocalId)  ;
                        dbHandler.runQuery(query,[status,new Date().getTime(),'S',userInfo.deviceLocalId],function(response){
                            //Success Callback
                            console.log('Update user status');
                            console.log(response);
                            deferred.resolve(response);
                        },function(error){
                            //Error Callback
                            console.log(error);
                            deferred.reject(error);
                        });

                        return deferred.promise;  

                      }
                    }
                    ;

                 /*}*/
            };
    
    
      function getUserInfo(){
        var deferred = $q.defer();
        var query = "SELECT *  FROM userInfo u";
          /*var query = "SELECT * FROM  masterItem ";*/
        dbHandler.runQuery(query,[],function(response){
            //Success Callback
            console.log(response);
            selectedUsers = response.rows;
            console.log('Selected user: ' + JSON.stringify(selectedUsers));
       
            deferred.resolve(response);
        },function(error){
            //Error Callback
            console.log(error);
            deferred.reject(error);
        });
        console.log('Deferred Promise: '+ JSON.stringify(deferred.promise));
        return deferred.promise;
    };
    


    function updateVerificationData(data) {
        
        console.log('aalatief service, User Data:'+JSON.stringify(data));
        verificationData.deviceLocalId = data.deviceLocalId;
        verificationData.userServerId = data.userServerId;
        verificationData.deviceServerId = data.deviceServerId;
        
        console.log('aalatief service after update, User Data:'+JSON.stringify(verificationData));
        
    };





    return {
     
      verificationData: function(){

                  return verificationData;
              },
        
        
    selectedUser: function(){
        /*selectedUsers = [];

          m = getUserInfo()      
        .then(getUserSuccessCB,getUserErrorCB);
            console.log('aalatief: Users Are: ' + JSON.stringify(selectedUsers));*/
          return selectedUsers;
      },
      updateVerificationData: updateVerificationData,
      addUserInfo : addUserInfo ,
      getUserInfo:getUserInfo,
      updateUserInfo:updateUserInfo,
      isUserVerified:isUserVerified
    };
});


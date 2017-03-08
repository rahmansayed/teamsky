angular.module('starter.services')

  .factory('pickerView', function ($compile, $rootScope, $timeout, $q, $ionicScrollDelegate, $ionicBackdrop) {  

/*.factory('pickerView', ['$compile', '$rootScope', '$timeout', '$q', '$ionicScrollDelegate', '$ionicBackdrop',
	function($compile, $rootScope, $timeout, $q, $ionicScrollDelegate, $ionicBackdrop) {*/

	var i, j, k, tmpVar;

	var domBody, pickerCtnr, pickerInfo;

	var isInit, isShowing;

	var setElementRotate = function setElementRotate(elemList, ni) {
		if (ni < 0 || ni === undefined) { return; }

		if (ni - 2 >= 0)
			angular.element(elemList[ni - 2]).removeClass('pre-select');
		if (ni - 1 >= 0)
			angular.element(elemList[ni - 1]).removeClass('selected').addClass('pre-select');

		angular.element(elemList[ni]).removeClass('pre-select').addClass('selected');
		if (ni + 1 < elemList.length)
			angular.element(elemList[ni + 1]).removeClass('selected').addClass('pre-select');
		if (ni + 2 < elemList.length)
			angular.element(elemList[ni + 2]).removeClass('pre-select');
	};

	var init = function init() {
		if (isInit) { return; }

		var template = 
			'<div class="picker-view"> ' +
				'<div class="picker-accessory-bar">' +
					'<a class="button button-clear" on-tap="pickerEvent.onCancelBuuton()" ng-bind-html="pickerOptions.cancelButtonText"></a>' +
					'<h3 class="picker-title" ng-bind-html="pickerOptions.titleText"></h3>' + 
					'<a class="button button-clear" on-tap="pickerEvent.onDoneBuuton()" ng-bind-html="pickerOptions.doneButtonText"></a>' +
				'</div>' +
				'<div class="picker-content">' +
					'<ion-scroll ng-repeat="(idx, item) in pickerOptions.items" ' +
						'class="picker-scroll" ' +
						'delegate-handle="{{ \'pickerScroll\' + idx }}" ' +
						'direction="y" ' +
						'scrollbar-y="false" ' +
						'has-bouncing="true" ' +
            'overflow-scroll="false" ' + 
						'on-touch="pickerEvent.scrollTouch(idx)" ' +
						'on-release="pickerEvent.scrollRelease(idx)" ' +
						'on-scroll="pickerEvent.scrollPicking(event, scrollTop, idx)">' +

						'<div ng-repeat="val in item.values" ng-bind-html="val"></div>' +
					'</ion-scroll>' +
				'</div>' + 
			'</div>';

		pickerCtnr = $compile(template)($rootScope);
		pickerCtnr.addClass('hide');

		['webkitAnimationStart', 'animationstart'].forEach(function runAnimStartHandle(eventKey) {
			pickerCtnr[0].addEventListener(eventKey, function whenAnimationStart() {
				if (pickerCtnr.hasClass('picker-view-slidein')) {
					// Before Show Picker View
					$ionicBackdrop.retain();
					isShowing = true;
				} else if (pickerCtnr.hasClass('picker-view-slideout')) {
					// Before Hide Picker View
					isShowing = false;
				}
			}, false);
		});

		['webkitAnimationEnd', 'animationend'].forEach(function runAnimEndHandle(eventKey) {
			pickerCtnr[0].addEventListener(eventKey, function whenAnimationEnd() {
				if (pickerCtnr.hasClass('picker-view-slidein')) {
					// After Show Picker View
					pickerCtnr.removeClass('picker-view-slidein');
				} else if (pickerCtnr.hasClass('picker-view-slideout')) {
					// After Hide Picker View
					pickerCtnr.addClass('hide').removeClass('picker-view-slideout');
					$ionicBackdrop.release();
				}
			}, false);
		});

		if (!domBody) { domBody = angular.element(document.body); }
		domBody.append(pickerCtnr);
		isInit = true;
	};

	var dispose = function dispose() {
		pickerCtnr.remove();

		for (k in $rootScope.pickerOptions) { delete $rootScope.pickerOptions[k]; }
		delete $rootScope.pickerOptions;
		for (k in $rootScope.pickEvent) { delete $rootScope.pickEvent[k]; }
		delete $rootScope.pickEvent;

		pickerCtnr = pickerInfo = i = j = k = tmpVar = null;

		isInit = isShowing = false;
	};

	var close = function close() {
		if (!isShowing) { return; }

		pickerCtnr.addClass('picker-view-slideout');
	};

	var show = function show(opts) {
		if (!isInit || typeof opts !== 'object') { return undefined; }

		var pickerShowDefer = $q.defer();

		opts.titleText = opts.titleText || '';
		opts.doneButtonText = opts.doneButtonText || 'Done';
		opts.cancelButtonText = opts.cancelButtonText || 'Cancel';

		pickerInfo = [];
		for (i = 0; i < opts.items.length; i++) {
			if (opts.items[i].defaultIndex === undefined) {
				opts.items[i].defaultIndex = 0;
			}

			// push a empty string to last, because the scroll height problem
			opts.items[i].values.push('&nbsp;');

			pickerInfo.push({
				scrollTopLast: undefined,
				scrollMaxTop: undefined,
				eachItemHeight: undefined,
				nowSelectIndex: opts.items[i].defaultIndex,
				output: opts.items[i].values[opts.items[i].defaultIndex],
				isTouched: false,
				isFixed: false,
				scrollStopTimer: null
			});
		}

		for (k in $rootScope.pickerOptions) { delete $rootScope.pickerOptions[k]; }
		delete $rootScope.pickerOptions;
		for (k in $rootScope.pickEvent) { delete $rootScope.pickEvent[k]; }
		delete $rootScope.pickEvent;

		$rootScope.pickerOptions = opts;
		$rootScope.pickerEvent = {
			onDoneBuuton: function onDoneBuuton() {
				var pickerOutput = (function () {
					var totalOutput = [];
					for (i = 0; i < $rootScope.pickerOptions.items.length; i++) {
						totalOutput.push(pickerInfo[i].output);
					}
					return totalOutput;
				})();
				pickerShowDefer.resolve(pickerOutput);
				close();
			},
			onCancelBuuton: function onCancelBuuton() {
				pickerShowDefer.resolve();
				close();
			},
			scrollTouch: function scrollTouch(pickerIdx) {
				pickerInfo[pickerIdx].isTouched = true;
				pickerInfo[pickerIdx].isFixed = false;
			},
			scrollRelease: function scrollRelease(pickerIdx) {
				pickerInfo[pickerIdx].isTouched = false;
			},
			scrollPicking: function scrollPicking(e, scrollTop, pickerIdx) {
				if (!$rootScope.pickerOptions) { return;  }

				if (!pickerInfo[pickerIdx].isFixed) {
					pickerInfo[pickerIdx].scrollTopLast = scrollTop;

					// update the scrollMaxTop (only one times)
					if (pickerInfo[pickerIdx].scrollMaxTop === undefined) {
						pickerInfo[pickerIdx].scrollMaxTop = e.target.scrollHeight - e.target.clientHeight + e.target.firstElementChild.offsetTop;
					}

					// calculate Select Index
					tmpVar = Math.round(pickerInfo[pickerIdx].scrollTopLast / pickerInfo[pickerIdx].eachItemHeight);
					
					if (tmpVar < 0) {
						tmpVar = 0;
					} else if (tmpVar > e.target.firstElementChild.childElementCount - 2) {
						tmpVar = e.target.firstElementChild.childElementCount - 2;
					}
					
					if (pickerInfo[pickerIdx].nowSelectIndex !== tmpVar) {
						pickerInfo[pickerIdx].nowSelectIndex = tmpVar;
						pickerInfo[pickerIdx].output = $rootScope.pickerOptions.items[pickerIdx].values[pickerInfo[pickerIdx].nowSelectIndex];

						// update item states
						setElementRotate(e.target.firstElementChild.children, 
							pickerInfo[pickerIdx].nowSelectIndex);
					}
				}


				if (pickerInfo[pickerIdx].scrollStopTimer) {
					$timeout.cancel(pickerInfo[pickerIdx].scrollStopTimer);
					pickerInfo[pickerIdx].scrollStopTimer = null;
				}
				if (!pickerInfo[pickerIdx].isFixed) {
					pickerInfo[pickerIdx].scrollStopTimer = $timeout(function () {
						$rootScope.pickerEvent.scrollPickStop(pickerIdx);
					} , 80);
				}
			},
			scrollPickStop: function scrollPickStop(pickerIdx) {
				if (pickerInfo[pickerIdx].isTouched || pickerIdx === undefined) {
					return;
				}

				pickerInfo[pickerIdx].isFixed = true;

				// check each scroll position
				for (j = $ionicScrollDelegate._instances.length - 1; j >= 1; j--) {
					if ($ionicScrollDelegate._instances[j].$$delegateHandle !== ('pickerScroll' + pickerIdx)) { continue; }
					
					// fixed current scroll position
					tmpVar = pickerInfo[pickerIdx].eachItemHeight * pickerInfo[pickerIdx].nowSelectIndex;
					if (tmpVar > pickerInfo[pickerIdx].scrollMaxTop) {
						tmpVar = pickerInfo[pickerIdx].scrollMaxTop;
					}
					$ionicScrollDelegate._instances[j].scrollTo(0, tmpVar, true);
					break;
				}
			}
		};

		(function listenScrollDelegateChanged(options) {
			var waitScrollDelegateDefer = $q.defer();

			var watchScrollDelegate = $rootScope.$watch(function getDelegate() {
				return $ionicScrollDelegate._instances;
			}, function delegateChanged(instances) {
				watchScrollDelegate(); // remove watch callback
				watchScrollDelegate = null;

				var waitingScrollContentUpdate = function waitingScrollContentUpdate(prIdx, sDele) {
					$timeout(function contentRefresh() {
						watchScrollDelegate = $rootScope.$watch(function getUpdatedScrollView() {
							return sDele.getScrollView();
						}, function scrollViewChanged(sView) {
							watchScrollDelegate();
							watchScrollDelegate = null;

							pickerInfo[prIdx].eachItemHeight = sView.__content.firstElementChild.clientHeight;

							// padding the first item
							sView.__container.style.paddingTop = (pickerInfo[prIdx].eachItemHeight * 1.5) + 'px';
							
							// scroll to default index (no animation)
							sDele.scrollTo(0, pickerInfo[prIdx].eachItemHeight * options.items[prIdx].defaultIndex, false);

							// update item states
							setElementRotate(sView.__content.children, 
								options.items[prIdx].defaultIndex);
						});
					}, 20);
				};

				var dele;
				for (i = 0; i < options.items.length; i++) {
					dele = null;
					for (j = instances.length - 1; j >= 1; j--) {
						if (instances[j].$$delegateHandle === undefined) { continue; }

						if (instances[j].$$delegateHandle === ('pickerScroll' + i)) {
							dele = instances[j];
							break;
						}
					}

					if (dele) { waitingScrollContentUpdate(i, dele); }
				}

				waitScrollDelegateDefer.resolve();
			});

			return waitScrollDelegateDefer.promise;
		})(opts).then(function preparePickerViewFinish() {
			if (!isShowing) {
				pickerCtnr.removeClass('hide').addClass('picker-view-slidein');
			}
		});

		pickerShowDefer.promise.close = close;
		return pickerShowDefer.promise;
	};

	var getIsInit = function getIsInit() { return isInit; };
	var getIsShowing = function getIsShowing() { return isShowing; };

	ionic.Platform.ready(init); // when DOM Ready, init Picker View

	return {
		init: init,
		dispose: dispose,
		show: show,
		close: close,

		isInit: getIsInit,
		isShowing: getIsShowing
	};
});
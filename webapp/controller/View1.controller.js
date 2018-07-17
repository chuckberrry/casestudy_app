sap.ui.define([
	"jquery.sap.global",
	"sap/m/MessageToast",
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	'./Formatter'
], function (jQuery, MessageToast, Controller,Formatter, Fragment, Filter) {
	"use strict";

	return Controller.extend("cs.case_study.controller.View1", {

		onInit: function () {
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.loadData("/AWS_case_study/res.json");
			// Assign the model object to the SAPUI5 core
			this.getView().setModel(oModel);
		},

		handleValueChange: function (oEvent) {
			MessageToast.show("Press 'Upload File' to upload file '" +
				oEvent.getParameter("newValue") + "'");
		},

		openUploadDialog: function () {
			var oUploadDialog = new sap.m.Dialog();
			oUploadDialog.setTitle("Upload photo");
			// prepare the FileUploader control
			var oFileUploader = new sap.ui.unified.FileUploader({
				uploadUrl: "/AWS_case_study/images/upload",
				name: "image",
				uploadOnChange: false,
				sendXHR: false,
				useMultipart: true,
				typeMissmatch: function (oEvent) {
					var aFileTypes = oEvent.getSource().getFileType();
					jQuery.each(aFileTypes, function (key, value) {
						aFileTypes[key] = "*." + value;
					});
					var sSupportedFileTypes = aFileTypes.join(", ");
					MessageToast.show("The file type *." + oEvent.getParameter("fileType") +
						" is not supported. Choose one of the following types: " +
						sSupportedFileTypes);
				},
				placeholder: "Choose a file for Upload...",
				fileType: "png,jpg",
				uploadComplete: function (oEvent) {
					var sResponse = oEvent.getParameter("response");
					if (sResponse) {
						oUploadDialog.close();
						sap.m.MessageToast.show("Upload complete");
					}
				}
			});
			// create a button to trigger the upload
			var oTriggerButton = new sap.m.Button({
				text: "Upload",
				press: function () {
					// call the upload method
					//oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({name: "slug", value: oFileUploader.getValue() }));
					oFileUploader.upload();
				}
			});
			var oTriggerButton2 = new sap.m.Button({
				text: "Cancel",
				press: function () {
					oUploadDialog.close();
				}
			});
			oUploadDialog.addContent(oFileUploader);
			oUploadDialog.addContent(oTriggerButton);
			oUploadDialog.addContent(oTriggerButton2);
			oUploadDialog.open();
		},

		onRun: function (evt) {
			var input1 = this.byId("Input1").getValue();
			var input2 = this.byId("Input2").getValue();
			if (input1 === "") {
				input1 = 0.6;
			}
			if (input2 === "") {
				input2 = 0.5;
			}
			var settings = {
				"async": true,
				"crossDomain": true,
				"url": "/AWS_case_study/parameter",
				"method": "POST",
				"data": {
					"pixel_thres": input1,
					"link_thres": input2,
					"align": this.byId("ch1").getSelected()
				}
			};

			$.ajax(settings).done(function (response) {});
			sap.m.MessageToast.show("Successfully Sent");
		},

		handleRefresh: function (evt) {
			setTimeout(function () {
				this.byId("pullToRefresh").hide();
				var oModel = this.getView().getModel();
				oModel.loadData("/AWS_case_study/res.json");
				this.getView().byId("img1").setSrc("/AWS_case_study/images/demo_res.jpg?t=" + new Date().getTime());
			}.bind(this), 1000);
		},
		

		handleTableSelectDialogPress: function(oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("cs.case_study.view.Dialog", this);
			}

			// Multi-select if required
			var bMultiSelect = !!oEvent.getSource().data("multi");
			this._oDialog.setMultiSelect(bMultiSelect);

			// Remember selections if required
			var bRemember = !!oEvent.getSource().data("remember");
			this._oDialog.setRememberSelections(bRemember);

			this.getView().addDependent(this._oDialog);

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},

		handleSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("Results", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		handleClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function(oContext) { return oContext.getObject().Name; }).join(", "));
			}
			oEvent.getSource().getBinding("items").filter([]);
		}

	});
});
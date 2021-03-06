sap.ui.define([
	"sap/m/MessageToast",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter"
], function (MessageToast, Controller, Fragment, Filter) {
	"use strict";

	return Controller.extend("cs.case_study.controller.View1", {
	formatter: function(path){ // all parameters are strings
                          return path + this.getView().getModel().getProperty("/id_run"); 
               },
               
		onInit: function () {
			var oModel = new sap.ui.model.json.JSONModel(),
				oView = this.getView();
			var id = Math.random().toString(36).substr(2, 9);
			$.get("/AWS_case_study/init?id=" + id, function (data) {
				oModel.setData(data);
				oView.setModel(oModel);
				oView.getModel().setProperty("/afterUpload", false);
				oView.getModel().setProperty("/afterRun", false);
				oView.getModel().setProperty("/id_run", id);
			});
		},

		handleValueChange: function (oEvent) {
			MessageToast.show("Press 'Upload File' to upload file '" +
				oEvent.getParameter("newValue") + "'");
		},

		openUploadDialog: function () {
			var that = this;
			var oUploadDialog = new sap.m.Dialog();
			oUploadDialog.setTitle("Upload photo");
			// prepare the FileUploader control
			var oFileUploader = new sap.ui.unified.FileUploader({
				uploadUrl: "/AWS_case_study/images/upload?id=" + that.getView().getModel().getProperty("/id_run"),
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
				placeholder: "Choose an Image...",
				fileType: "png,jpg,jpeg",
				uploadComplete: function (oEvent) {
					var sResponse = oEvent.getParameter("response");
					if (sResponse) {
						oUploadDialog.close();
						that.getView().byId("Run").setEnabled(true);
						that.getView().getModel().setProperty("/afterUpload", true);
						that.getView().byId("img1").setSrc("/AWS_case_study/preview/demo.jpg?id=" + that.getView().getModel().getProperty("/id_run") + "#t="  + new Date().getTime());
						sap.m.MessageToast.show("Upload complete");
					}
				}
			});
			// create a button to trigger the upload
			var oTriggerButton = new sap.m.Button({
				text: "Upload",
				press: function () {
					// call the upload method
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
			var that = this;
			var input1 = this.byId("Input1").getValue();
			var input2 = this.byId("Input2").getValue();
			var align;
			var check = this.byId("ch1").getSelected();
			var id = this.getView().getModel().getProperty("/id_run");
			if (check) {
				align = check;
			} else {
				align = this.byId("Input3").getValue();
			}
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
					"align": align,
					"id": id
				}
			};
			this.oDialog = sap.ui.xmlfragment("cs.case_study.view.BusyDialog", this);
			this.oDialog.open();
			$.ajax(settings).done(function (response) {
				that.handleRefresh();
				that.oDialog.close();
				that.getView().getModel().setProperty("/afterRun", true);
				sap.m.MessageToast.show(response.message);
			}).fail(function (response) {
				that.oDialog.close();
				sap.m.MessageToast.show("Error: " + response.message);
			});

		},

		handleRefresh: function (evt) {
				setTimeout(function () {
				var oModel = this.getView().getModel();
				var id = oModel.getProperty("/id_run");
				oModel.loadData("/AWS_case_study/res.json?id=" + id);
				this.getView().byId("img1").setSrc("/AWS_case_study/preview/demo.jpg?id=" + id + "#t="  + new Date().getTime());
				this.getView().byId("img2").setSrc("/AWS_case_study/images/demo_res.jpg?id=" + id + "#t="  + new Date().getTime());
				this.getView().byId("img3").setSrc("/AWS_case_study/images/demo_text.png?id=" + id + "#t="  + new Date().getTime());
						}.bind(this), 1000);
		},

		handleTableSelectDialogPress: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("cs.case_study.view.Dialog", this);
			}

			// Multi-select if required
			var bMultiSelect = !!oEvent.getSource().data("multi");
			this._oDialog.setMultiSelect(bMultiSelect);

			this.getView().addDependent(this._oDialog);

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},
		onExit: function () {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},

		handleSearch: function (oEvent) {
			// create model filter
			var filters = [];
			var query = oEvent.getParameter("value");
			if (query && query.length > 0) {
				var filter = new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, query);
				filters.push(filter);
			}

			// update list binding
			var list = oEvent.getSource();
			var binding = list.getBinding("items");
			binding.filter(filters);
		},

		handleClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			var nr;
			if (aContexts && aContexts.length) {
				nr = aContexts.map(function (oContext) {
					return oContext.getObject().text;
				}).join("");

			}
			var descr = this.byId("inputText").getValue();
			var sBody =
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><SERVICENOTIFICATION_CREATEFR01><IDOC BEGIN="1"><EDI_DC40 SEGMENT="1"><TABNAM/><DOCNUM/><DIRECT>2</DIRECT><IDOCTYP>SERVICENOTIFICATION_CREATEFR01</IDOCTYP><MESTYP>SERVICENOTIFICATION_CREATEFROM</MESTYP><SNDPOR>SCPI</SNDPOR><SNDPRT>LS</SNDPRT><SNDPFC/><SNDPRN>SCPI</SNDPRN><RCVPOR>SAPS4T</RCVPOR><RCVPRT>LS</RCVPRT><RCVPRN>S4TCLNT200</RCVPRN><SERIAL/></EDI_DC40><E1SERVICENOTIFICATION_CREAT SEGMENT="1"><NOTIF_TYPE>Z1</NOTIF_TYPE><E1BP2080_NOTHDRI SEGMENT="1"><EQUIPMENT>' +
				nr +
				'</EQUIPMENT><SHORT_TEXT>Meldung Instandhaltungsbedarf</SHORT_TEXT></E1BP2080_NOTHDRI><E1BP2080_NOTITEMI SEGMENT="1"><DESCRIPT>' +
				descr + '</DESCRIPT><EQUIPMENT>' + nr +
				'</EQUIPMENT></E1BP2080_NOTITEMI><E1BP2080_NOTFULLTXTI SEGMENT=""><TEXT_LINE>Textzeile</TEXT_LINE></E1BP2080_NOTFULLTXTI></E1SERVICENOTIFICATION_CREAT><E1IDOCENHANCEMENT SEGMENT="1"><IDENTIFIER/><DATA/></E1IDOCENHANCEMENT></IDOC></SERVICENOTIFICATION_CREATEFR01></soapenv:Body></soapenv:Envelope>';
			$.ajax({
				url: "/S4T_IDOC/sap/bc/srt/idoc?sap-client=200",
				method: "POST",
				data: sBody,
				headers: {
					"Content-Type": "text/xml"
				}
			});
			sap.m.MessageToast.show('Succesfully sent Service Notification!\nDescription: "' + descr + '"\nEquipmentnumber: "' + nr + '"');
			oEvent.getSource().getBinding("items").filter([]);
		}

	});
});
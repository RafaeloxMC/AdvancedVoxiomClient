const { ipcRenderer } = require("electron");
const store = require("electron-store");
const log = require("electron-log");
const path = require("path");
const avcTool = require("../util/tool");
const tools = new avcTool.clientTools();
const config = new store();

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("div").forEach((node) => {
		console.log(node);
	});

	tools.initSettingData();
	if (location.origin === "https://voxiom.io") {
		if (location.href === "https://voxiom.io/auth/refresh/#" || location.href === "https://voxiom.io/auth/refresh") {
			location.href = "https://voxiom.io/";
		} else if (location.href === "https://voxiom.io/stats") {
			document.body.insertAdjacentHTML("beforeend", `<script src="https://html2canvas.hertzen.com/dist/html2canvas.js"></script>`);
		}
		try {
			tools.setupClientSetting();
		} catch (error) {
			log.warn(error);
		}
		try {
			tools.initDoms();
		} catch (error) {
			log.warn(error);
		}
	}
	document.body.insertAdjacentHTML("beforeend", tools.avcSettingStyleInject());
	window.tool = new avcTool.settingTool();

	const observerCallback = function (mutationsList, observer) {
		for (let mutation of mutationsList) {
			mutation.addedNodes.forEach((addedNode) => {
				console.log(location.href, "\n", addedNode);
				if (addedNode.className === "sc-bhiFeW kqFtze") {
					tools.sendWebhook(addedNode);
				} else if (addedNode.className === "sc-jtXEFf evngGB") {
					let tempDom = `<div id=escJoin><input id=joinInput> <input onclick='Window.tool.joinGame()'type=button value=JOIN></div><div id=escCopy><input onclick=navigator.clipboard.writeText(location.href) type=button value="Copy Link"></div>`;
					document.getElementsByClassName("dgbOnQ")[0].insertAdjacentHTML("afterend", tempDom);
				} else if (addedNode.className === "sc-dDgCVK vLMrg") {
					let tempDom = `<div id="escJoin"><input type="text" id="joinInput" placeholder="Enter URL"><input type="button" value="JOIN" onclick="window.tool.joinGame('joinInput')"></div>`;
					document.getElementsByClassName("fQTYZA")[0].insertAdjacentHTML("afterend", tempDom);
				} else if (addedNode.style["cssText"] === `position: absolute; overflow: hidden; width: 100%; height: 100%; top: 0px; left: 0px; display: flex; flex-direction: column; align-items: center; pointer-events: auto;`) {
					tools.initTitleText();
					tools.menuBarAddition();
					let dom = document.querySelectorAll(".jrjvIg")[0];
					dom.innerHTML = `<div id=login><a class=discord href=http://voxiom.io/auth/discord2 id=loginBtn target=_self>Sign in with Discord</a> <a class=google href=http://voxiom.io/auth/google2 id=loginBtn target=_self>Sign in with Google</a> <a class=facebook href=http://voxiom.io/auth/facebook2 id=loginBtn target=_self>Sign in with Facebook</a></div><style>#loginBtn{text-align:center;padding:10px;text-decoration:none;color:#fff;margin-bottom:10px;width:200px;display:flex;-webkit-box-align:center;align-items:center;cursor:pointer}.discord{background-color:#7289da}.google{background-color:#ea4435}.facebook{background-color:#4967aa}.discord:hover{background-color:#8da6ff}.google:hover{background-color:#ff6a5c}.facebook:hover{background-color:#658be2}</style>`;
				} else if (addedNode.className === "sc-dDgCVK vLMrg" || addedNode.className === "sc-bBHxTw cSKUzy" || addedNode.className === "sc-fOfeEA bggwgU" || addedNode.className === "sc-cVeCjG gtMOKh" || addedNode.className === "sc-iSLKLn ctoevy" || addedNode.className === "sc-iSLKLn ctoevy" || addedNode.className === "sc-bJijCA koPVTY" || addedNode.className === "sc-djoyIk efIxmv" || addedNode.className === "sc-jjBTab cPzpQf" || addedNode.className === "sc-mDocm jcrddu" || addedNode.className === "sc-fZjiHd kgHOae" || addedNode.className === "sc-cCcXHH eoXzlP") {
					tools.initTitleText();
					tools.menuBarAddition();
					document.querySelectorAll(".fXzVCi")[0] ? (document.querySelectorAll(".fXzVCi")[0].innerHTML = `<div id=login><a class=discord href=http://voxiom.io/auth/discord2 id=loginBtn target=_self>Sign in with Discord</a> <a class=google href=http://voxiom.io/auth/google2 id=loginBtn target=_self>Sign in with Google</a> <a class=facebook href=http://voxiom.io/auth/facebook2 id=loginBtn target=_self>Sign in with Facebook</a></div><style>#loginBtn{text-align:center;padding:10px;text-decoration:none;color:#fff;margin-bottom:10px;width:200px;display:flex;-webkit-box-align:center;align-items:center;cursor:pointer}.discord{background-color:#7289da}.google{background-color:#ea4435}.facebook{background-color:#4967aa}.discord:hover{background-color:#8da6ff}.google:hover{background-color:#ff6a5c}.facebook:hover{background-color:#658be2}</style>`) : "";
					if (location.href === "https://voxiom.io/stats") {
						tools.statsGen();
					}
				} else if (addedNode.id.includes("voxiom-io")) {
					addedNode.remove();
				} else if (addedNode.id.includes("google_ads_iframe")) {
					addedNode.remove();
				}
			});
		}
	};
	const targetNode = document.querySelector("#app");
	const observer = new MutationObserver(observerCallback);
	const observerConfig = { childList: true, subtree: true };
	// 対象のノードと設定を渡して監視を開始
	observer.observe(targetNode, observerConfig);
	if (config.get("smartInfo")) {
		tools.smartInfo();
	} else if (config.get("smartInfo") === null) {
		tools.smartInfo();
	}
});

ipcRenderer.on("ESC", () => {
	setTimeout(() => {
		document.exitPointerLock();
	}, 100);
});
ipcRenderer.on("F1", () => {
	window.tool.closeSetting();
});
ipcRenderer.on("F6", () => {
	window.tool.quickJoin();
});
ipcRenderer.on("F8", () => {
	window.tool.openMatchList();
});
ipcRenderer.on("F10", () => {
	window.location.href = "https://voxiom.io/";
});

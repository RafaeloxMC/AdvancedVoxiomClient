const html2canvas = require("html2canvas");
const { ipcRenderer, shell, app, dialog } = require("electron");
const store = require("electron-store");
const log = require("electron-log");
const path = require("path");
const fs = require("fs");
let version;
ipcRenderer.invoke("appVer").then((v) => {
	version = v;
});

const config = new store();
const setting = require("./setting");
const { clearInterval } = require("timers");

log.info("gametools.js has been loaded.");

exports.clientTools = class {
	generateSettingDom(val) {
		// log.info(val.id, config.get(val.id))
		switch (val.type) {
			case "checkbox":
				return `<input id="settingCheckbox" type="checkbox" onclick="window.tool.setSetting('${val.id}',this.checked)"${(config.get(val.id), val.default ? "checked" : "")}>`;
			case "text":
				return `<input id="settingTextbox" type="text" onInput="window.tool.setSetting('${val.id}',this.value)" value="${config.get(val.id) != null ? config.get(val.id) : val.default}" > `;
			case "select":
				let dom = `<select onchange="window.tool.setSetting('${val.id}',this.value);">`;
				Object.keys(val.options).forEach((opt) => {
					dom += `<option value="${opt}" ${config.get(val.id, val.default) === opt ? " selected" : ""}> ${val.options[opt]} </option>`;
				});
				return (dom += `</select>`);
			case "range-text":
				return `
                <div id="rangeNum">
                    <input type="range" id="range${val.id}"min="0" max="1024" value="${config.get(val.id) ? config.get(val.id) : val.default}" step="1" oninput="window.tool.sliderMove('${val.id}',this.value);window.tool.setSetting('${val.id}',this.value)">
                    <input type="number" id="num${val.id}" min="0" max="1024" value="${config.get(val.id) ? config.get(val.id) : val.default}" step="1"oninput="window.tool.numInput('${val.id}',this.value);window.tool.setSetting('${val.id}',this.value)">
                </div>`;
			case "textarea":
				return `
                <textarea id="${val.id}" onchange="window.tool.setSetting('${val.id}',this.value)">${config.get(val.id) != null ? config.get(val.id) : ""}</textarea>`;
			case "password":
				return `<input type="password" id="${val.id}" oninput="window.tool.setSetting('${val.id}',this.value)" value="${config.get(val.id) != null ? config.get(val.id) : ""}">`;
			case "button":
				return `<input type="button" id="${val.id}" value="${val.buttonVal}" onclick="window.tool.setSetting('${val.id}')">`;
			case "openFile":
				return `<input title="${config.get(val.id) != null ? config.get(val.id) : "No file selected"}" type="button" id="${val.id}" value="OPEN FILE" onclick="window.tool.openFile('${val.id}')">`;
		}
	}
	setupClientSetting() {
		const windowInitialize = () => {
			let settingWindowHTML = `<div id="windowCloser" onclick="window.tool.closeSetting()" class="${config.get("settingWindowOpen") ? "" : "hide"}"></div><div id="avcSetting" ${config.get("settingWindowOpen") ? 'class=""' : 'class="hide" '}><div id="settingTitleBar">Vanced Voxiom Client Settings<span class="material-symbols-outlined closeBtn" onclick="window.tool.closeSetting()">close</span></div><div id="setBody">`;
			let prevCat = null;
			Object.values(setting).forEach((val) => {
				let dom = "";
				if (val.cat != prevCat) {
					if (prevCat) {
						dom += `</div>`;
					}
					dom += `<div id="setBox">
                                <div id="${val.cat}" class="catTitle">${val.cat}</div><div id="horizonalSpacer"></div>`;
					prevCat = val.cat;
				}
				dom += `<div id="setItem"><div id="settingName">${val.title}</div>`;
				settingWindowHTML += dom + this.generateSettingDom(val) + "</div>";
			});
			settingWindowHTML += `<div id=setBox><div class=catTitle>Account manager</div><div id=horizonalSpacer></div><div id=setItem class=gridBtn><input onclick='window.open("https://google.com")' type=button value=Google><input onclick='window.open("https://www.facebook.com")' type=button value=Facebook><input onclick='window.open("https://discord.com/channels/@me")' type=button value=Discord><input onclick='window.tool.help()' type=button value="Open Help"></div></div>`;
			return settingWindowHTML ? settingWindowHTML + "</div></div></div>" : "";
		};
		document.body.insertAdjacentHTML("afterbegin", windowInitialize());
	}
	avcSettingStyleInject() {
		let dom = `<link rel="stylesheet" href="avc://${path.join(__dirname, "../../html/css/avc.css")}">`;
		return dom;
	}
	initDoms() {
		let dom1 = `<style id="customBgCss">.bNczYf{background-image:url("${config.get("customBG") == null || config.get("customBG") == "" ? setting.customBackGround.default : config.get("customBG")}")}.kdQfwP{content:url("${config.get("customLogo") == "" || config.get("customLogo") == null ? setting.customGameLogo.default : config.get("customLogo")}")}</style>`;
		document.body.insertAdjacentHTML("afterbegin", dom1);
		let dom2 = `<div style="top:0;left:0;position:fixed;text-shadow:0 0 3px black;z-index:1">AVC v${version}</div>`;
		document.body.insertAdjacentHTML("afterbegin", dom2);
		let dom3 = `<style id="freeGem">.isjMgk{display:${config.get("disableGemPopup") !== true ? "unset" : "none !important"}}</style>`;
		document.body.insertAdjacentHTML("afterbegin", dom3);
		try {
			let crosshair = `<img id="crosshairImg" style="width:${config.get("crosshairSizeX") != null ? config.get("crosshairSizeX") : setting.crosshairSizeX.default}px;height:${config.get("crosshairSizeY") != null ? config.get("crosshairSizeY") : setting.crosshairSizeY.default}px;" src="${config.get("customCrosshairImage") != null ? config.get("customCrosshairImage") : setting.customCrosshairImage.default}" class="${config.get("customCrosshairCheckbox") ? "" : "hide"}" ></img>`;
			document.getElementById("app").insertAdjacentHTML("afterbegin", crosshair);
		} catch (error) {
			log.error(error);
		}
		let matchList = `<div id=matchCloser class=hide onclick=window.tool.closeMatchList()></div><div id=matchList class=hide><div id=settingTitleBar>Match Browser <span class="closeBtn material-symbols-outlined"onclick=window.tool.closeMatchList()>close</span></div><div id=setBody><div id=matches><table id=matchTable><tbody id=matchInfo></tbody></table></div></div></div>`;
		document.body.insertAdjacentHTML("afterbegin", matchList);
		let infoDom = `<div id=infoBox class=${config.get("smartInfo") ? "" : "hide"}><div id=compass><img alt=↑ id=needle src=https://voxiom.io/package/0c0a064432d08848541a.png></div><div id=fpsDisplay></div><div id=playerPos><div id=x></div><div id=y></div><div id=z></div></div><div id=ping></div></div><style id="infoStyle">${config.get("smartInfo") ? 'div[style*="width: 550px; position: absolute; top: 0px; left: 0px; padding: 10px; pointer-events: none; background-color: rgba(0, 0, 0, 0.8);"]{opacity:0}' : 'div[style*="width: 550px; position: absolute; top: 0px; left: 0px; padding: 10px; pointer-events: none; background-color: rgba(0, 0, 0, 0.8);"]{opacity:1}'}</style>`;
		document.getElementById("app").insertAdjacentHTML("afterbegin", infoDom);

		if (config.get("cssType") === "none") {
			console.log("No custom css gen");
		} else if (config.get("cssType") === "text") {
			let css = `<style id="customCSS">${config.get("cssTextarea") != null ? config.get("cssTextarea") : ""}</style>`;
			document.body.insertAdjacentHTML("afterbegin", css);
		} else if (config.get("cssType") === "localfile") {
			let css = `<link rel="stylesheet" id="customCSS" href="avc://${config.get("cssLocal") != null ? config.get("cssLocal") : ""}">`;
			document.body.insertAdjacentHTML("afterbegin", css);
		} else if (config.get("cssType") === "online") {
			let css = `<style id="customCSS">@import url('${config.get("cssUrl") != null ? config.get("cssUrl") : ""}');</style>`;
			document.body.insertAdjacentHTML("afterbegin", css);
		}
	}
	initTitleText() {
		document.querySelector(".JSRtQ").innerText = config.get("customGameLogoText") !== null ? config.get("customGameLogoText") : setting.customGameLogoText.default;
	}
	sendWebhook(node) {
		if (config.get("enableCtW")) {
			let text = node.innerText.replace(/[`]/g, "'");
			try {
				let url = config.get("webhookUrl");
				const req = {
					content: "`" + text + "`",
					username: "Vanced Voxiom Client CtW Tool",
					avatar_url: "https://i.imgur.com/bdClDSq.png",
					allowed_mentions: {
						parse: [],
					},
				};
				fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(req),
				});
			} catch (error) {
				log.error(error);
			}
		}
	}
	smartInfo() {
		const getInfo = () => {
			let info = document.querySelector('div[style*="width: 550px; position: absolute; top: 0px; left: 0px; padding: 10px; pointer-events: none; background-color: rgba(0, 0, 0, 0.8);"]');
			try {
				if (info.getAttribute("style").includes("display: none;")) {
					document.getElementById("infoBox").setAttribute("class", "hide");
				} else if (!info.getAttribute("style").includes("display: none;") && config.get("smartInfo")) {
					document.getElementById("infoBox").setAttribute("class", "");
				}
			} catch (error) {
				log.error("smartInfo", error);
			}
			let infoArray = info.innerText.split("\n");
			const hari = document.getElementById("needle");
			let yaw = infoArray[9].split(" ")[2];
			let per = yaw / 3.14159265358979323;
			hari.style = `transform:rotate(${per * -180}deg)`;
			const fpsDisp = document.getElementById("fpsDisplay");
			let fps = Math.floor(infoArray[0].split(" ")[1]);
			fpsDisp.innerText = "FPS : " + fps;
			let xPos = document.getElementById("x");
			let yPos = document.getElementById("y");
			let zPos = document.getElementById("z");
			let pos = infoArray[2].split(" ");
			xPos.innerText = "X : " + Math.floor(pos[1]);
			yPos.innerText = "Y : " + Math.floor(pos[3]);
			zPos.innerText = "Z : " + Math.floor(pos[5]);
			let pingDisp = document.getElementById("ping");
			pingDisp.innerText = "Ping : " + infoArray[11].split(" ")[1];
		};
		let inforval = setInterval(() => {
			try {
				getInfo();
			} catch (error) {}
		}, 50);
		inforval;
	}
	menuBarAddition() {
		if (document.getElementById("stat") == null) {
			let menuBar = document.getElementsByClassName("cPFhJE")[0];
			let dom = `<a class="sc-gulkZw HHuq" id="stats" href="/stats">Stats</a>`;
			let dom2 = `<a class="sc-gulkZw HHuq active" id="stats" href="/stats">Stats</a>`;
			if (location.href === "https://voxiom.io/stats") {
				menuBar.insertAdjacentHTML("beforeend", dom2);
			} else if (document.getElementById("stats")) {
				log.info("id:stat is exit");
			} else {
				menuBar.insertAdjacentHTML("beforeend", dom);
			}

			log.info("STAT GEN");
		}
	}
	initSettingData() {
		Object.values(setting).forEach((val) => {
			try {
				if (config.get(val.id) == null) {
					if (val.default !== null) {
						config.set(val.id, val.default);
					}
				}
			} catch (error) {
				log.warn(error, val.id);
			}
		});
	}
	statsGen() {
		let d;
		const fetchMe = async () => {
			const response = await fetch("https://voxiom.io/profile/me", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const result = await response.json().then((data) => {
				console.log(data.data);
				d = data.data;
			});
		};
		fetchMe().then(() => {
			document.querySelector(".jCQNJI").insertAdjacentHTML("beforebegin", `<input type="button" value="Download" onclick="window.tool.genCanvas()">`);
			document.querySelector(".jCQNJI").innerHTML = `<style>
            @import url('https://fonts.googleapis.com/css2?family=Afacad:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');
            .jCQNJI {
                background: transparent;
                display: unset;
            }
            div#stat {
                background: #FFF1;
                border-radius: 20px;
            }
            input[onclick="window.tool.genCanvas()"] {
                font-size: 20px;
                padding: 20px;
                background: white;
                border: 2px solid purple;
                box-shadow: 5px 5px 0 pink;
                cursor: pointer;
            }
            div[id*="voxiom-io"] {
                display: none !important;
            }
            #profileBox {
                font-family: Afacad, sans-serif !important;
            }
            #profileBox {
                background: url(https://cdn.discordapp.com/attachments/1186527845149843516/1198853019819855973/test.png);
                width: 830px;
                height: 570px;
                border-radius: 20px;
                border: 4px solid #fff;
                color: #fff;
                position: relative;
                text-shadow: 0 0 10px #000
            }
            #head {
                display: grid;
                grid-template-areas: "icon name name name gems" "icon levl prog prog gems";
                grid-template-columns: 75pt 40px 340px 180px auto;
                grid-gap: 5px;
                width: 750px;
                padding: 20px 40px;
                background: #0006;
                border-top-right-radius: 20px;
                border-top-left-radius: 20px;
                border-bottom: 2px solid #0006
            }
            #gem {
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                align-items: center;
                margin-left: 20px
            }
            #icon {
                grid-area: icon;
                height: 4pc;
                width: 4pc
            }
            #clan {
                margin-left: 10px
            }
            #clan,
            #name {
                font-size: 30px
            }
            #nameHolder {
                grid-area: name;
                display: flex
            }
            #lv {
                grid-area: levl
            }
            #xp {
                grid-area: prog;
                border: 1px solid #fff4
            }
            #gem {
                grid-area: gems
            }
            #bodyBR,
            #bodyCTG {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-gap: 5px 10px;
                width: 790px;
                margin-left: auto;
                margin-right: auto
            }
            #bodyBRTitle {
                position: absolute;
                font-size: 30px;
                margin-top: -40px
            }
            #bodyBR {
                margin-top: 40px
            }
            #bodyCTG {
                margin-top: 70px
            }
            #bodyCTGTitle {
                position: absolute;
                font-size: 30px;
                margin-top: -50px
            }
            #xp {
                position: relative
            }
            #xpVal {
                position: absolute;
                left: 10px
            }
            #xpInner {
                height: 100%;
                background: linear-gradient(90deg, #6d005e, #ff8eb0)
            }
            #stat {
                display: flex;
                justify-content: flex-end;
                flex-direction: column;
                align-items: center;
                position: relative;
                height: 50px
            }
            #statTitle {
                font-size: 15px;
                color: #ccc;
                position: absolute;
                top: 0;
                left: 0
            }
            #statVal {
                font-size: 24px
            }
            #accGen {
                right: 10px;
                font-size: 20px
            }
            #accGen,
            #avcName {
                position: absolute;
                bottom: 5px
            }
            #avcName {
                left: 10px;
                color: #aaa
            }
        </style>
        <div id=profileBox>
            <div id=head><img id=icon src=https://namekujilsds.github.io/VVC/icon.ico>
                <div id=nameHolder>
                    <div id=name>${d.nickname}</div>
                    <div id=clan>[${d.clan.tag}]</div>
                </div>
                <div id=lv>${d.level}</div>
                <div id=xp>
                    <div id=xpVal>${d.xp}/${Math.floor(d.level * 127)}</div>
                    <div id=xpInner style=width:${Math.fround((d.xp / (d.level * 127)) * 100).toFixed(2)}%;></div>
                </div>
                <div id=gem>
                    <div id=gemTitle>Gems</div>
                    <div id=gemValue>${d.gems}</div>
                </div>
            </div>
            <div id=bodyBR>
                <div id=bodyBRTitle>Battle Royale</div>
                <div id=stat class=brPlay>
                    <div id=statTitle>Plays</div>
                    <div id=statVal>${d.br.total_games_played}</div>
                </div>
                <div id=stat class=brWinR>
                    <div id=statTitle>WinRate</div>
                    <div id=statVal>${Math.fround((d.br.total_games_won / d.br.total_games_played) * 100).toFixed(2)}%</div>
                </div>
                <div id=stat class=brKills>
                    <div id=statTitle>Kills</div>
                    <div id=statVal>${d.br.total_kills}</div>
                </div>
                <div id=stat class=brDeath>
                    <div id=statTitle>Deaths</div>
                    <div id=statVal>${d.br.total_deaths}</div>
                </div>
                <div id=stat class=brKdr>
                    <div id=statTitle>K/D</div>
                    <div id=statVal>${Math.fround(d.br.total_kills / d.br.total_deaths).toFixed(2)}</div>
                </div>
                <div id=stat class=brSpk>
                    <div id=statTitle>SPK</div>
                    <div id=statVal>${Math.fround((d.br.total_score - d.br.total_games_won * 100) / d.br.total_kills).toFixed(2)}</div>
                </div>
                <div id=stat class=brScore>
                    <div id=statTitle>Score</div>
                    <div id=statVal>${d.br.total_score}</div>
                </div>
                <div id=stat class=brTime>
                    <div id=statTitle>Survival Time</div>
                    <div id=statVal>${Math.floor(d.br.total_survival_time / 3600) + "h" + Math.floor((d.br.total_survival_time % 3600) / 60) + "m" + (d.br.total_survival_time % 60) + "s"}</div>
                </div>
            </div>
            <div id=bodyCTG>
                <div id=bodyCTGTitle>Capture the Gems</div>
                <div id=stat class=ctgPlay>
                    <div id=statTitle>Plays</div>
                    <div id=statVal>${d.ctg.total_games_played}</div>
                </div>
                <div id=stat class=ctgWinR>
                    <div id=statTitle>Win Rate</div>
                    <div id=statVal>${Math.fround((d.ctg.total_games_won / d.ctg.total_games_played) * 100).toFixed(2)}%</div >
                </div >
                <div id=stat class=ctgKills>
                    <div id=statTitle>Kills</div>
                    <div id=statVal>${d.ctg.total_kills}</div>
                </div>
                <div id=stat class=ctgDeath>
                    <div id=statTitle>Deaths</div>
                    <div id=statVal>${d.ctg.total_deaths}</div>
                </div>
                <div id=stat class=ctgKdr>
                    <div id=statTitle>K/D</div>
                    <div id=statVal>${Math.fround(d.ctg.total_kills / d.ctg.total_deaths).toFixed(2)}</div>
                </div>
                <div id=stat class=ctgSpk>
                    <div id=statTitle>SPK</div>
                    <div id=statVal>${Math.fround((d.ctg.total_score - d.ctg.total_captures * 250 - d.ctg.total_games_won * 100) / d.ctg.total_kills).toFixed(2)}</div>
                </div>
                <div id=stat class=ctgScore>
                    <div id=statTitle>Score</div>
                    <div id=statVal>${d.ctg.total_score}</div>
                </div>
                <div id=stat class=ctgCapture>
                    <div id=statTitle>Captures</div>
                    <div id=statVal>${d.ctg.total_captures}</div>
                </div>
            </div >
    <div id=foot>
        <div id=accGen>Account Since :${new Date(d.creation_time).getFullYear() + "-" + Math.floor(new Date(d.creation_time).getMonth() + 1) + "-" + new Date(d.creation_time).getDate()}</div>
        <div id=avcName>Vanced Voxiom Client v${version}</div>
    </div >
</div > `;
		});
	}
};
exports.settingTool = class {
	closeSetting() {
		let settingWindow = document.getElementById("avcSetting");
		let closer = document.getElementById("windowCloser");
		settingWindow != null ? settingWindow.classList.toggle("hide") : "";
		closer != null ? closer.classList.toggle("hide") : "";
		config.set("settingWindowOpen", !document.getElementById("avcSetting").classList.contains("hide"));
	}
	setSetting(id, value) {
		value != null ? config.set(id, value) : "";
		log.info(id, value);
		switch (id) {
			case "customBG":
				document.getElementById("customBgCss").innerText = `.bNczYf{ background - image: url("${value == "" ? setting.customBackGround.default : (value = null ? setting.customBackGround.default : value)}") }.crZZWp{ content: url("${config.get("customLogo") == "" || config.get("customLogo") == null ? setting.customGameLogo.default : config.get("customLogo")} ") } `;
				break;
			case "customLogo":
				document.getElementById("customBgCss").innerText = `.bNczYf{ background - image: url("${config.get("customBG") == null || config.get("customBG") == "" ? setting.customBackGround.default : config.get("customBG")}") }.crZZWp{ content: url("${value == "" || value == null ? setting.customGameLogo.default : value}") } `;
				break;
			case "customGameLogoText":
				document.querySelector(".ikfQiC").innerText = value;
				break;
			case "customCrosshairCheckbox":
				value ? document.getElementById("crosshair").classList.remove("hide") : document.getElementById("crosshair").classList.add("hide");
				break;
			case "customCrosshairImage":
				document.getElementById("crosshairImg").setAttribute("src", value);
				break;
			case "crosshairSizeX":
				document.getElementById("crosshairImg").setAttribute("style", `width:${value != null ? value : setting.crosshairSizeX.default} px; height:${config.get("crosshairSizeY") != null ? config.get("crosshairSizeY") : setting.crosshairSizeY.default} px; `);
				break;
			case "crosshairSizeY":
				document.getElementById("crosshairImg").setAttribute("style", `width:${config.get("crosshairSizeX") != null ? config.get("crosshairSizeX") : setting.crosshairSizeX.default} px; height:${value != null ? value : setting.crosshairSizeY.default} px; `);
				break;
			case "detectCrosshairSize":
				let C = document.getElementById("crosshairImg");
				let X = document.getElementById("crosshairImg").naturalWidth;
				let Y = document.getElementById("crosshairImg").naturalHeight;
				config.set("crosshairSizeX", X);
				config.set("crosshairSizeY", Y);
				C.setAttribute("style", `width:${X} px; height:${Y} px`);
				document.getElementById("rangecrosshairSizeX").value = X;
				document.getElementById("rangecrosshairSizeY").value = Y;
				document.getElementById("numcrosshairSizeX").value = X;
				document.getElementById("numcrosshairSizeY").value = Y;
				break;
			case "cssType":
				document.getElementById("customCSS") ? document.getElementById("customCSS").remove() : "";
				switch (value) {
					case "none":
						document.getElementById("customCSS") ? document.getElementById("customCSS").remove() : "";
						break;
					case "text":
						console.log(config.get("cssTextarea"));
						document.body.insertAdjacentHTML("afterbegin", `<style id="customCSS"> ${config.get("cssTextarea") != null ? config.get("cssTextarea") : ""}</style> `);
						break;
					case "localfile":
						document.body.insertAdjacentHTML("afterbegin", `<link rel="stylesheet" id="customCSS" href= "avc://${config.get("cssLocal") != null ? config.get("cssLocal") : ""}"> `);
						break;
					case "online":
						document.body.insertAdjacentHTML("afterbegin", `<style id="customCSS" > @import url('${config.get("cssUrl") != null ? config.get("cssUrl") : ""}');</style> `);
						break;
				}
				break;
			case "cssTextarea":
				config.get("cssType") === "text" ? (document.getElementById("customCSS").innerText = value) : "";
				break;
			case "cssLocal":
				config.get("cssType") === "localfile" ? document.getElementById("customCSS").setAttribute("href", "avc://" + value) : "";
				break;
			case "cssUrl":
				config.get("cssType") === "online" ? (document.getElementById("customCSS").innerText = `@import url('${value}')`) : "";
				break;
			case "quickJoinRegion":
				break;
			case "quickJoinMode":
				break;
			case "disableSnow":
				value ? (document.getElementById("snowStyle").innerText = ".snowflakes{display: none}") : (document.getElementById("snowStyle").innerText = ".snowflakes{display: unset}");
				break;
			case "disableGemPopup":
				value ? (document.getElementById("freeGem").innerText = ".etzJfT{display:none !important}") : (document.getElementById("freeGem").innerText = ".etzJfT{display: unset}");
				break;
			case "enableCtW":
				break;
			case "webhookUrl":
				break;
			case "resourceSwapperEnable":
				break;
			case "smartInfo":
				break;
		}
	}
	sliderMove(id, value) {
		switch (id) {
			case "crosshairSizeX":
				document.getElementById("numcrosshairSizeX").value = value;
				if (value == null || value == "") {
					document.getElementById("numcrosshairSizeX").value = 0;
					document.getElementById("rangecrosshairSizeX").value = 0;
				}
				break;
			case "crosshairSizeY":
				document.getElementById("numcrosshairSizeY").value = value;
				if (value == null || value == "") {
					document.getElementById("numcrosshairSizeY").value = 0;
					document.getElementById("rangecrosshairSizeY").value = 0;
				}
				break;
		}
	}
	numInput(id, value) {
		switch (id) {
			case "crosshairSizeX":
				document.getElementById("rangecrosshairSizeX").value = value;
				if (value == null || value == "") {
					document.getElementById("numcrosshairSizeX").value = 0;
					document.getElementById("rangecrosshairSizeX").value = 0;
				}
				break;
			case "crosshairSizeY":
				document.getElementById("rangecrosshairSizeY").value = value;
				if (value == null || value == "") {
					document.getElementById("numcrosshairSizeY").value = 0;
					document.getElementById("rangecrosshairSizeY").value = 0;
				}
				break;
		}
	}
	openFile(id) {
		ipcRenderer.invoke("openFile").then((path) => {
			log.info(path);
			log.info(path[0]);
			path != null ? config.set(id, path[0]) : "";
			this.setSetting(id, path[0]);
		});
	}
	help() {
		shell.openExternal("https://namekujilsds.github.io/VVC");
	}
	exportGameSetting() {
		let setting = localStorage.getItem("persist:root");
		const blob = new Blob([setting], { type: "text/plain" });
		const downloadLink = document.createElement("a");
		downloadLink.download = "Setting.txt";
		downloadLink.href = window.URL.createObjectURL(blob);
		downloadLink.click();
	}
	importGameSetting() {}
	settingCheck(id) {
		log.debug(id, config.get(id));
	}
	quickJoin() {
		let url = `https://voxiom.io/find?region=${config.get("quickJoinRegion") != null ? config.get("quickJoinRegion") : setting.quickJoinRegion.default}&game_mode=${config.get("quickJoinMode") != null ? config.get("quickJoinMode") : setting.quickJoinMode.default}`;
		fetch(url)
			.then((responce) => {
				return responce.json();
			})
			.then((data) => {
				log.info(data.tag);
				location.href = `https://voxiom.io/#${data.tag}`;
			})
			.then(() => {
				location.reload;
			})
			.catch((e) => {
				log.error(e);
			});
	}
	openMatchList() {
		const displayChange = () => {
			document.getElementById("matchList").classList.toggle("hide");
			document.getElementById("matchCloser").classList.toggle("hide");
		};
		const genUrls = () => {
			const reg = [0, 1, 2, 3];
			const mode = ["ctg", "br", "ffa", "svv"];
			const urls = [];
			for (let num of reg) {
				for (let m of mode) {
					const url = `https://voxiom.io/find?region=${num}&game_mode=${m}`;
					urls.push([num, m, url]);
				}
			}
			return urls;
		};
		displayChange();
		let url = genUrls();
		if (!document.getElementById("matchList").classList.contains("hide")) {
			document.getElementById("matchInfo").innerHTML = "";
			for (let array of url) {
				fetch(array[2])
					.then((result) => {
						return result.json();
					})
					.then((data) => {
						let temDom = `<tr>
                    <td>${array[0] === 0 ? "US-W" : array[0] === 1 ? "US-E" : array[0] === 2 ? "EU" : array[0] === 3 ? "Asia" : array[0]}</td >
                    <td>${array[1] === "svv" ? "Survival" : array[1] === "ffa" ? "FFA" : array[1] === "br" ? "BR" : array[1] === "ctg" ? "CTG" : array[1]}</td>
                    <td>https://voxiom.io/#${data.tag}</td>
                    <td onclick="navigator.clipboard.writeText('https://voxiom.io/#${data.tag}')">Copy</td>
                    <td onclick="window.location.replace('https://voxiom.io/#${data.tag}');location.reload() ">Join</td></tr>`;
						document.getElementById("matchInfo").insertAdjacentHTML("afterbegin", temDom);
					});
			}
		}
	}
	closeMatchList() {
		document.getElementById("matchList").classList.contains("hide") ? "" : document.getElementById("matchList").classList.add("hide");
		document.getElementById("matchCloser").classList.contains("hide") ? "" : document.getElementById("matchCloser").classList.add("hide");
	}
	joinGame() {
		document.getElementById("joinInput").value != null ? (location.href = document.getElementById("joinInput").value) : "";
		document.getElementById("joinInput").value != null ? location.reload() : "";
	}
	genCanvas() {
		const genC = async () => {
			await html2canvas(document.getElementById("profileBox"), {
				// height: 570,
				// width: 830,
				backgroundColor: null,
				useCORS: true,
				x: 0,
				y: 0,
			})
				.then((canvas) => {
					canvas.setAttribute("style", "display:none");
					canvas.setAttribute("id", "pfpCanvas");
					document.body.appendChild(canvas);
				})
				.then(() => {
					const now = new Date();
					const month = ("0" + (now.getMonth() + 1)).slice(-2);
					const date = ("0" + now.getDate()).slice(-2);
					const hours = ("0" + now.getHours()).slice(-2);
					const minutes = ("0" + now.getMinutes()).slice(-2);
					const seconds = ("0" + now.getSeconds()).slice(-2);
					const formattedDateTime = `${month}${date}${hours}${minutes}${seconds}`;
					let canvas = document.getElementById("pfpCanvas");
					let link = document.createElement("a");
					link.href = canvas.toDataURL("image/png");
					link.download = "profile" + formattedDateTime + ".png";
					link.click();
				});
		};
		genC();
	}
};

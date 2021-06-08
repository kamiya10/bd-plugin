/**
 * @name Kamiya
 * @website https://github.com/kamiya10/bd-plugin/tree/master/osuTimestamp
 * @source https://github.com/kamiya10/bd-plugin/blob/master/osuTimestamp/osuTimestamp.plugin.js
 */

module.exports = (() => {
  const config = {
    "main": "index.js",
    "info": {
      "name": "osu! Timestamps",
      "authors": [
        {
          "name": "Kamiya",
          "discord_id": "437158166019702805",
          "github_username": "kamiya10"
        }
      ],
      "version": "1.0.0",
      "description": "Render osu! timestamps into clickable urls.",
      "github": "https://github.com/kamiya10/bd-plugin/tree/master/osuTimestamp",
      "github_raw": "https://github.com/kamiya10/bd-plugin/blob/master/osuTimestamp/osuTimestamp.plugin.js"
    }
  };

  return !global.ZeresPluginLibrary ? class {
    constructor() { this._config = config; };
    getName() { return config.info.name; };
    getAuthor() { return config.info.authors.map(a => a.name).join(", "); };
    getDescription() { return config.info.description; };
    getVersion() { return config.info.version; };
    load() {
      BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
        confirmText: "Download Now",
        cancelText: "Cancel",
        onConfirm: () => {
          require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
            if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
            await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
          });
        }
      });
    };
    start() { };
    stop() { };
  } : (([Plugin, Api]) => {
    const plugin = (Plugin, Library) => {
      const { Patcher, WebpackModules, DiscordModules } = Library;
      const { React } = DiscordModules;

      const regex = /(\d{2}:\d{2}:\d{3}(?:\s\((?:[\d|]+,?)+\))?)/g;

      return class osuTimestamp extends Plugin {
        onStart() {
          const parser = WebpackModules.getByProps('parse', 'parseTopic');
          Patcher.after(parser, 'parse', (_, args, res) => this.inject(args, res));
        };

        onStop() {
          Patcher.unpatchAll();
        };

        inject(_, res) {
          const elements = [];
          for (const el of res) {
            if (typeof el !== 'string') {
              if (['em', 'u', 'strong', 's'].includes(el.type))
                el.props.children = this.inject({}, el.props.children);
              if (el.type.name === 'StringPart')
                el.props.parts = this.inject({}, el.props.parts);
              elements.push(el);
              continue;
            };

            if (!regex.test(el)) {
              elements.push(el);
              continue;
            };

            const reg = /(\d{2}:\d{2}:\d{3}(?:\s\((?:[\d|]+,?)+\))?)/;

            const tsArray = el.split(reg);
            for (const ts of tsArray) {
              if (!regex.test(ts)) {
                elements.push(ts);
                continue;
              };

              const timestamp = ts.match(reg)[1];
              elements.push(
                React.createElement('a', {
                  title: `Timestamp ${timestamp} - Click to open in osu!`,
                  href: `osu://edit/${timestamp}`,
                  target: '_blank'
                }, ts)
              );
            }
          };
          return elements;
        }
      }
    };
    return plugin(Plugin, Api);
  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
import { memoize } from "fusion-core";
import { Locale, Locales } from "locale";
import fs from "fs";
import path from "path";

const readDir = root => {
  try {
    return fs.readdirSync(root);
  } catch (e) {
    return [];
  }
};

const loader = __NODE__
  ? () => {
      const translationDir = path.resolve("translations");

      const locales = readDir(translationDir)
        .filter(p => p.match(/json$/))
        .map(p => p.replace(/\.json$/, ""));

      const localeMapping = locales.reduce((memo, locale) => {
        const parsedLocale = new Locale(locale);

        memo[parsedLocale.normalized] = JSON.parse(
          fs.readFileSync(path.join(translationDir, locale + ".json"), "utf8")
        );

        return memo;
      }, {});

      const supportedLocales = new Locales(locales);

      return {
        from: memoize(ctx => {
          const localeFromPath = ctx.path.replace("/", "");
          let expectedLocales;

          /**
           * Use path or language header to determine initial locale
           */
          if (localeFromPath.length > 0) {
            expectedLocales = new Locales(localeFromPath);
          } else {
            expectedLocales = new Locales(ctx.headers["accept-language"]);
          }

          const locale = expectedLocales.best(supportedLocales);
          const translations = localeMapping[locale.normalized];
          console.log(ctx.headers);
          console.log("hellllo");
          ctx.template.htmlAttrs.lang = locale.language;

          return { translations, locale };
        })
      };
    }
  : null;

export default loader;

// Android 13+: don't show the app's content in the Recents (app switcher) thumbnail.
// Android takes that snapshot *before* JS learns the app went to the background, so an
// in-app cover (src/ui/PrivacyCover.tsx) is too late there. Unlike FLAG_SECURE this keeps
// normal screenshots possible; screens with the recovery phrase still use FLAG_SECURE
// via expo-screen-capture.
const { withMainActivity } = require('expo/config-plugins');

const MARKER = '// amethyst: hide recents preview';
const CODE = `    ${MARKER}
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      setRecentsScreenshotEnabled(false)
    }`;

module.exports = function withHideRecentsPreview(config) {
  return withMainActivity(config, (cfg) => {
    const { contents, language } = cfg.modResults;
    if (language !== 'kt') throw new Error('withHideRecentsPreview expects a Kotlin MainActivity');
    if (contents.includes(MARKER)) return cfg;
    if (!contents.includes('super.onCreate(')) {
      throw new Error('withHideRecentsPreview: super.onCreate(...) not found in MainActivity');
    }
    let next = contents.replace(/(super\.onCreate\([^)]*\))/, `$1\n${CODE}`);
    if (!/^import android\.os\.Build$/m.test(next)) {
      next = next.replace(/^(package [^\n]+\n)/, '$1import android.os.Build\n');
    }
    cfg.modResults.contents = next;
    return cfg;
  });
};

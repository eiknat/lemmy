import { BASE_PATH } from './isProduction';

export const emojiPaths = [
  '100-com.png',
  '10000-com.png',
  'AyyyyyOC-big.png',
  'AyyyyyOC.png',
  'CommiePOGGERS.png',
  'LIB.png',
  'PIGPOOPBALLS.png',
  'RIchard-D-Wolff.png',
  'a-guy.png',
  'acab.png',
  'af-heart.png',
  'af.png',
  'ak47.png',
  'amerikkka.png',
  'anarchy.png',
  'angery.png',
  'back-to-me.png',
  'bear.png',
  'bootlicker.png',
  'br-soc-big.png',
  'breadpill.png',
  'bruh.png',
  'butt.png',
  'capitalist-woke.png',
  'capitalist.png',
  'cat-com.png',
  'cat-trans.png',
  'chairman.png',
  'chapo.png',
  'chavez-salute.png',
  'che-laugh.png',
  'che-smile.png',
  'comfy.png',
  'cool-dad.png',
  'corona-and-lime.png',
  'corona.png',
  'crab-party.gif',
  'crazy-frog-trans.png',
  'curious-marx.png',
  'curious-sickle.png',
  'cursed.png',
  'dem.png',
  'didnt-kill-himself.png',
  'dorner.png',
  'dril.png',
  'elmofire.gif',
  'feminism.png',
  'ferret.jpg',
  'flag-su.png',
  'grumpy-lizard.png',
  'gui-better.png',
  'gui-trans.png',
  'gui.png',
  'halal.png',
  'hammerandsickle.png',
  'haram.png',
  'heart-sickle.png',
  'hexabear-big.png',
  'hexabear.png',
  'hexbear-shining.png',
  'hexshork-big.png',
  'hexshork.png',
  'iww.png',
  'jb-shining.png',
  'jeb.png',
  'john-brown.png',
  'juche.png',
  'kropotkin-big.png',
  'kropotkin-shining.png',
  'large-adult-son.png',
  'lenin-fancy.png',
  'lenin-heart.png',
  'lenin-pensive.png',
  'liberalism.png',
  'logo.png',
  'loser.png',
  'maduro_coffee-big.png',
  'maduro_coffee.png',
  'mao-aggro-shining.png',
  'mao-shining.png',
  'matt.png',
  'must-go.png',
  'no-police.png',
  'og-hex-bear.png',
  'pigpoop.png',
  'pray-against.png',
  'rainbow-has.png',
  'red-fist.png',
  'rose-fist.png',
  'sabo.png',
  'sankara-salute.png',
  'screm-a.png',
  'screm-cool.png',
  'screm-pretty.png',
  'screm.png',
  'screm2.png',
  'screm3.png',
  'snom.gif',
  'soviet-bashful.png',
  'soviet-hmm.png',
  'specter.png',
  'stalin-shining.png',
  'stalin-smokin.png',
  'stalin-stressed.png',
  'stalin.png',
  'star.png',
  'stirner-cool.png',
  'stirner-shocked.png',
  'stonks-down.png',
  'sweat.png',
  'tank.png',
  'thinkin-lenin.png',
  'this-is-fine.gif',
  'tibia-case.png',
  'transshork-happy.png',
  'transshork-sad.png',
  'ukkk.png',
  'uncle-ho.png',
  'valentina.png',
  'vegan-edge.png',
  'virgil-bb.png',
  'virgil-sad.png',
  'vuvuzela.png',
  'will.png',
  'yes.png',
  'yugoslavia.png',
  'zizek-fuck.png',
  'zizek-ok.png',
];

const EMOJI_DIR_PATH = `${BASE_PATH}emojis/`;

export const customEmojis = emojiPaths.map(path => ({
  key: path.split('.')[0],
  val: `<img className="icon icon-navbar" src="${EMOJI_DIR_PATH + path}" alt="${
    path.split('.')[0]
  }" />`,
}));

export function replaceEmojis(html) {
  let newHtml = html;
  customEmojis.forEach(emoji => {
    if (html.includes(`:${emoji.key}:`)) {
      const regex = new RegExp(`:${emoji.key}:`, 'g');
      newHtml = newHtml.replace(regex, emoji.val);
    }
  });

  return newHtml;
}

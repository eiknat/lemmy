// @TODO: Figure out how to do this properly with esmodules
import 'moment/locale/es';
import 'moment/locale/el';
import 'moment/locale/eu';
import 'moment/locale/eo';
import 'moment/locale/de';
import 'moment/locale/zh-cn';
import 'moment/locale/fr';
import 'moment/locale/sv';
import 'moment/locale/ru';
import 'moment/locale/nl';
import 'moment/locale/it';
import 'moment/locale/fi';
import 'moment/locale/ca';
import 'moment/locale/fa';
import 'moment/locale/pl';
import 'moment/locale/pt-br';
import 'moment/locale/ja';
import 'moment/locale/ka';
import 'moment/locale/hi';
import 'moment/locale/gl';
import 'moment/locale/tr';
import 'moment/locale/hu';
import 'moment/locale/uk';
import 'moment/locale/sq';
import 'moment/locale/km';
import 'moment/locale/ga';
import 'moment/locale/sr';

import {
  UserOperation,
  Comment,
  CommentNode as CommentNodeI,
  Post,
  PrivateMessage,
  User,
  SortType,
  CommentSortType,
  ListingType,
  DataType,
  SearchType,
  WebSocketResponse,
  WebSocketJsonResponse,
  SearchForm,
  SearchResponse,
  CommentResponse,
  PostResponse,
  GetSiteModeratorsResponse,
  CommunityModsState,
} from './interfaces';
import { UserService, WebSocketService } from './services';

import Tribute from 'tributejs/src/Tribute.js';
import markdown_it from 'markdown-it';
import markdownitEmoji from 'markdown-it-emoji/light';
import markdown_it_container from 'markdown-it-container';
import iterator from 'markdown-it-for-inline';
import emojiShortName from 'emoji-short-name';
import Toastify from 'toastify-js';
import tippy from 'tippy.js';
// import { EmojiButton } from '@joeattardi/emoji-button';

import { customEmojis, replaceEmojis } from './custom-emojis';
import moment from 'moment';
import { BASE_PATH } from './isProduction';

export const repoUrl = 'https://gitlab.com/chapo-sandbox/production';
export const helpGuideUrl = '/docs/about_guide.html';
export const markdownHelpUrl = `${helpGuideUrl}#markdown-guide`;
export const sortingHelpUrl = `${helpGuideUrl}#sorting`;
export const archiveUrl = 'https://archive.is';

export const postRefetchSeconds: number = 60 * 1000;
export const fetchLimit = 20;
export const commentFetchLimit = 15;
export const mentionDropdownFetchLimit = 10;

export const languages = [
  { code: 'ca', name: 'Català' },
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'eu', name: 'Euskara' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'gl', name: 'Galego' },
  { code: 'hu', name: 'Magyar Nyelv' },
  { code: 'ka', name: 'ქართული ენა' },
  { code: 'km', name: 'ភាសាខ្មែរ' },
  { code: 'hi', name: 'मानक हिन्दी' },
  { code: 'fa', name: 'فارسی' },
  { code: 'ja', name: '日本語' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt_BR', name: 'Português Brasileiro' },
  { code: 'zh', name: '中文' },
  { code: 'fi', name: 'Suomi' },
  { code: 'fr', name: 'Français' },
  { code: 'sv', name: 'Svenska' },
  { code: 'sq', name: 'Shqip' },
  { code: 'sr_Latn', name: 'srpski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'uk', name: 'Українська Mова' },
  { code: 'ru', name: 'Русский' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'it', name: 'Italiano' },
];

export const themes = [
  'laborwave',
  'litera',
  'materia',
  'minty',
  'solar',
  'united',
  'cyborg',
  'darkly',
  'journal',
  'sketchy',
  'vaporwave',
  'vaporwave-dark',
  'i386',
  'litely',
  'lux',
];

// export const emojiPicker = new EmojiButton({
//   style: 'twemoji',
//   theme: 'dark',
//   position: 'auto-start',
// });

const DEFAULT_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function getRandomCharFromAlphabet(alphabet: string): string {
  return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
}

export function randomStr(
  idDesiredLength = 20,
  alphabet = DEFAULT_ALPHABET
): string {
  /**
   * Create n-long array and map it to random chars from given alphabet.
   * Then join individual chars as string
   */
  return Array.from({ length: idDesiredLength })
    .map(() => {
      return getRandomCharFromAlphabet(alphabet);
    })
    .join('');
}

export function wsJsonToRes(msg: WebSocketJsonResponse): WebSocketResponse {
  let opStr: string = msg.op;
  return {
    op: UserOperation[opStr],
    data: msg.data,
  };
}

export const md = new markdown_it({
  html: false,
  linkify: true,
  typographer: true,
})
  .use(markdown_it_container, 'spoiler', {
    validate: function (params: any) {
      return params.trim().match(/^spoiler\s+(.*)$/);
    },

    render: function (tokens: any, idx: any) {
      var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

      if (tokens[idx].nesting === 1) {
        // opening tag
        return `<details><summary> ${md.utils.escapeHtml(m[1])} </summary>\n`;
      } else {
        // closing tag
        return '</details>\n';
      }
    },
  })
  .use(markdownitEmoji, {
    defs: objectFlip(emojiShortName),
  })
  .use(iterator, 'url_new_win', 'link_open', function (tokens, idx) {
    // make sure all inline links open in a new window and don't include the referrer
    tokens[idx].attrPush(['target', '_blank']);
    tokens[idx].attrPush(['rel', 'noreferrer']);
  })
  .disable('image');

export function hotRankComment(comment: Comment): number {
  return hotRank(comment.score, comment.published);
}

export function hotRankPost(post: Post): number {
  return hotRank(post.score, post.newest_activity_time);
}

export function hotRank(score: number, timeStr: string): number {
  // Rank = ScaleFactor * sign(Score) * log(1 + abs(Score)) / (Time + 2)^Gravity
  let date: Date = new Date(timeStr + 'Z'); // Add Z to convert from UTC date
  let now: Date = new Date();
  let hoursElapsed: number = (now.getTime() - date.getTime()) / 36e5;

  let rank =
    (10000 * Math.log10(Math.max(1, 3 + score))) /
    Math.pow(hoursElapsed + 2, 1.8);

  // console.log(`Comment: ${comment.content}\nRank: ${rank}\nScore: ${comment.score}\nHours: ${hoursElapsed}`);

  return rank;
}

export function mdToHtml(text: string) {
  return { __html: replaceEmojis(md.render(text)) };
}

export function getUnixTime(text: string): number {
  return text ? new Date(text).getTime() / 1000 : undefined;
}

export function addTypeInfo<T>(
  arr: Array<T>,
  name: string
): Array<{ type_: string; data: T }> {
  return arr.map(e => {
    return { type_: name, data: e };
  });
}

export function canMod(
  user: User,
  modIds: Array<number>,
  creator_id: number,
  onSelf = false
): boolean {
  // You can do moderator actions only on the mods added after you.
  if (user) {
    let yourIndex = modIds.findIndex(id => id == user.id);
    if (yourIndex == -1) {
      return false;
    } else {
      // onSelf +1 on mod actions not for yourself, IE ban, remove, etc
      modIds = modIds.slice(0, yourIndex + (onSelf ? 0 : 1));
      return !modIds.includes(creator_id);
    }
  } else {
    return false;
  }
}

export function isMod(modIds: Array<number>, creator_id: number): boolean {
  return modIds.includes(creator_id);
}

const imageRegex = new RegExp(
  /(http)?s?:?(\/\/[^"']*\.(?:jpg|jpeg|gif|png|svg|webp))/
);
const videoRegex = new RegExp(`(http)?s?:?(\/\/[^"']*\.(?:mp4))`);

const embedRegex = new RegExp(/(gist.github.com)/); //used to block iframely embeds from certain sites e.g. gist.github.com

export function isImage(url: string) {
  return imageRegex.test(url);
}

export function isVideo(url: string) {
  return videoRegex.test(url);
}

export function isValidEmbed(url: string) {
  return !embedRegex.test(url);
}

export function validURL(str: string) {
  try {
    return !!new URL(str);
  } catch {
    return false;
  }
}

export function validEmail(email: string) {
  let re = /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z\-]+\.)+[A-Za-z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function routeSortTypeToEnum(sort: string): SortType {
  if (sort == 'new') {
    return SortType.New;
  } else if (sort == 'hot') {
    return SortType.Hot;
  } else if (sort == 'topday') {
    return SortType.TopDay;
  } else if (sort == 'topweek') {
    return SortType.TopWeek;
  } else if (sort == 'topmonth') {
    return SortType.TopMonth;
  } else if (sort == 'topyear') {
    return SortType.TopYear;
  } else if (sort == 'topall') {
    return SortType.TopAll;
  }
}

export function routeListingTypeToEnum(type: string): ListingType {
  return ListingType[capitalizeFirstLetter(type)];
}

export function routeDataTypeToEnum(type: string): DataType {
  return DataType[capitalizeFirstLetter(type)];
}

export function routeSearchTypeToEnum(type: string): SearchType {
  return SearchType[capitalizeFirstLetter(type)];
}

export async function getPageTitle(url: string | null) {
  let res = await fetch(`/iframely/oembed?url=${url}`);
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.title;
}

export function debounce(func: any, wait = 1000, immediate = false) {
  // 'private' variable for instance
  // The returned function will be able to reference this due to closure.
  // Each call to the returned function will share this common timer.
  let timeout: any;

  // Calling debounce returns a new anonymous function
  return function () {
    // reference the context and args for the setTimeout function
    var context = this,
      args = arguments;

    // Should the function be called now? If immediate is true
    //   and not already in a timeout then the answer is: Yes
    var callNow = immediate && !timeout;

    // This is the basic debounce behaviour where you can call this
    //   function several times, but it will only execute once
    //   [before or after imposing a delay].
    //   Each time the returned function is called, the timer starts over.
    clearTimeout(timeout);

    // Set the new timeout
    timeout = setTimeout(function () {
      // Inside the timeout function, clear the timeout variable
      // which will let the next execution run when in 'immediate' mode
      timeout = null;

      // Check if the function already ran with the immediate flag
      if (!immediate) {
        // Call the original function with apply
        // apply lets you define the 'this' object as well as the arguments
        //    (both captured before setTimeout)
        func.apply(context, args);
      }
    }, wait);

    // Immediate mode and no wait timer? Execute the function..
    if (callNow) func.apply(context, args);
  };
}

export function getLanguage(): string {
  let user = UserService?.Instance?.user;
  let lang = user && user.lang ? user.lang : 'browser';

  if (lang == 'browser') {
    return getBrowserLanguage();
  } else {
    return lang;
  }
}

export function getBrowserLanguage(): string {
  return navigator.language;
}

export function getMomentLanguage(): string {
  let lang = getLanguage();
  if (lang.startsWith('zh')) {
    lang = 'zh-cn';
  } else if (lang.startsWith('sv')) {
    lang = 'sv';
  } else if (lang.startsWith('fr')) {
    lang = 'fr';
  } else if (lang.startsWith('de')) {
    lang = 'de';
  } else if (lang.startsWith('ru')) {
    lang = 'ru';
  } else if (lang.startsWith('es')) {
    lang = 'es';
  } else if (lang.startsWith('eo')) {
    lang = 'eo';
  } else if (lang.startsWith('nl')) {
    lang = 'nl';
  } else if (lang.startsWith('it')) {
    lang = 'it';
  } else if (lang.startsWith('fi')) {
    lang = 'fi';
  } else if (lang.startsWith('ca')) {
    lang = 'ca';
  } else if (lang.startsWith('fa')) {
    lang = 'fa';
  } else if (lang.startsWith('pl')) {
    lang = 'pl';
  } else if (lang.startsWith('pt')) {
    lang = 'pt-br';
  } else if (lang.startsWith('ja')) {
    lang = 'ja';
  } else if (lang.startsWith('ka')) {
    lang = 'ka';
  } else if (lang.startsWith('hi')) {
    lang = 'hi';
  } else if (lang.startsWith('el')) {
    lang = 'el';
  } else if (lang.startsWith('eu')) {
    lang = 'eu';
  } else if (lang.startsWith('gl')) {
    lang = 'gl';
  } else if (lang.startsWith('tr')) {
    lang = 'tr';
  } else if (lang.startsWith('hu')) {
    lang = 'hu';
  } else if (lang.startsWith('uk')) {
    lang = 'uk';
  } else if (lang.startsWith('sq')) {
    lang = 'sq';
  } else if (lang.startsWith('km')) {
    lang = 'km';
  } else if (lang.startsWith('ga')) {
    lang = 'ga';
  } else if (lang.startsWith('sr')) {
    lang = 'sr';
  } else {
    lang = 'en';
  }
  return lang;
}

export function setTheme(theme = 'chapo', loggedIn = false) {
  const event = new CustomEvent('change-theme', { detail: theme });
  document.dispatchEvent(event);
}

export function loadCss(id: string, loc: string) {
  if (!document.getElementById(id)) {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = loc;
    link.media = 'all';
    head.prepend(link);
  }
}

export function objectFlip(obj: any) {
  const ret = {};
  Object.keys(obj).forEach(key => {
    ret[obj[key]] = key;
  });
  return ret;
}

export function pictrsAvatarThumbnail(src: string): string {
  // sample url: http://localhost:8535/pictrs/image/thumbnail256/gs7xuu.jpg
  let split = src.split('/pictrs/image');
  let out = `${split[0]}/pictrs/image/${
    canUseWebP() ? 'webp/' : ''
  }thumbnail96${split[1]}`;
  return out;
}

export function showAvatars(): boolean {
  return (
    //(UserService.Instance.user && UserService.Instance.user.show_avatars) ||
    !UserService.Instance.user
  );
}

export function isCakeDay(published: string): boolean {
  // moment(undefined) or moment.utc(undefined) returns the current date/time
  // moment(null) or moment.utc(null) returns null
  const userCreationDate = moment.utc(published || null).local();
  const currentDate = moment(new Date());

  return (
    userCreationDate.date() === currentDate.date() &&
    userCreationDate.month() === currentDate.month() &&
    userCreationDate.year() !== currentDate.year()
  );
}

// Converts to image thumbnail
export function pictrsImage(hash: string, thumbnail = false): string {
  let root = `/pictrs/image`;

  // Necessary for other servers / domains
  if (hash.includes('pictrs')) {
    let split = hash.split('/pictrs/image/');
    root = `${split[0]}/pictrs/image`;
    hash = split[1];
  }

  let out = `${root}/${canUseWebP() ? 'webp/' : ''}${
    thumbnail ? 'thumbnail256/' : ''
  }${hash}`;
  return out;
}

export function isCommentType(item: Comment | PrivateMessage): item is Comment {
  return (item as Comment).community_id !== undefined;
}

export function toast(text: string, background = 'success') {
  let backgroundColor = `var(--${background})`;
  Toastify({
    text: text,
    backgroundColor: backgroundColor,
    gravity: 'bottom',
    position: 'left',
  }).showToast();
}

export function pictrsDeleteToast(
  clickToDeleteText: string,
  deletePictureText: string,
  deleteUrl: string
) {
  let backgroundColor = `var(--light)`;
  let toast = Toastify({
    text: clickToDeleteText,
    backgroundColor: backgroundColor,
    gravity: 'top',
    position: 'right',
    duration: 10000,
    onClick: () => {
      if (toast) {
        window.location.replace(deleteUrl);
        alert(deletePictureText);
        toast.hideToast();
      }
    },
    close: true,
  }).showToast();
}

export function messageToastify(
  creator: string,
  avatar: string,
  body: string,
  link: string,
  router: any
) {
  let backgroundColor = `var(--light)`;
  body = '<div className="notification-text-container">' + body + '</div>';
  if (!UserService.Instance.user || !UserService.Instance.user.show_nsfw) {
    body = replaceImageEmbeds(body);
  }
  let toast = Toastify({
    text: `${body}${creator}`,
    avatar: avatar,
    backgroundColor: backgroundColor,
    className: 'text-dark',
    close: true,
    gravity: 'top',
    position: 'right',
    duration: 5000,
    onClick: () => {
      if (toast) {
        toast.hideToast();
        router.history.push(link);
      }
    },
  }).showToast();
}

export function testMessageToast() {
  messageToastify(
    'example-user',
    null,
    '<p>Example toast. <img src="https://dev.chapo.chat/pictrs/image/YsYoLsoLaf.jpg" alt=""/> The quick brown fox jumped over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'dev.chapo.chat',
    null
  );
}

export function setupTribute(): Tribute {
  return new Tribute({
    noMatchTemplate: function () {
      return '<span style:"visibility: hidden;"></span>';
    },
    collection: [
      // Emojis
      {
        trigger: ':',
        menuItemTemplate: (item: any) => {
          let shortName = `:${item.original.key}:`;
          return `${item.original.val} ${shortName}`;
        },
        selectTemplate: (item: any) => {
          return `:${item.original.key}:`;
        },
        values: [
          // ...Object.entries(emojiShortName).map(e => {
          //   return { key: e[1], val: e[0] };
          // }),
          {
            key: 'logo',
            val: `<img className="icon icon-navbar" src="${BASE_PATH}logo.png" alt="vaporwave hammer and sickle logo, courtesy of ancestral potato">`,
          },
          ...customEmojis,
        ],
        allowSpaces: false,
        autocompleteMode: true,
        menuItemLimit: mentionDropdownFetchLimit,
        menuShowMinLength: 2,
      },
      // Users
      {
        trigger: '@',
        selectTemplate: (item: any) => {
          let link = item.original.local
            ? `[${item.original.key}](/u/${item.original.name})`
            : `[${item.original.key}](/user/${item.original.id})`;
          return link;
        },
        values: (text: string, cb: any) => {
          userSearch(text, (users: any) => cb(users));
        },
        allowSpaces: false,
        autocompleteMode: true,
        menuItemLimit: mentionDropdownFetchLimit,
        menuShowMinLength: 2,
      },

      // Communities
      {
        trigger: '!',
        selectTemplate: (item: any) => {
          let link = item.original.local
            ? `[${item.original.key}](/c/${item.original.name})`
            : `[${item.original.key}](/community/${item.original.id})`;
          return link;
        },
        values: (text: string, cb: any) => {
          communitySearch(text, (communities: any) => cb(communities));
        },
        allowSpaces: false,
        autocompleteMode: true,
        menuItemLimit: mentionDropdownFetchLimit,
        menuShowMinLength: 2,
      },
    ],
  });
}

let tippyInstance = tippy('[data-tippy-content]');

export function setupTippy() {
  tippyInstance.forEach(e => e.destroy());
  tippyInstance = tippy('[data-tippy-content]', {
    delay: [500, 0],
    // Display on "long press"
    touch: ['hold', 500],
  });
}

function userSearch(text: string, cb: any) {
  if (text) {
    let form: SearchForm = {
      q: text,
      type_: SearchType[SearchType.Users],
      sort: SortType[SortType.TopAll],
      page: 1,
      limit: mentionDropdownFetchLimit,
    };

    WebSocketService.Instance.search(form);

    this.userSub = WebSocketService.Instance.subject.subscribe(
      msg => {
        let res = wsJsonToRes(msg);
        if (res.op == UserOperation.Search) {
          let data = res.data as SearchResponse;
          let users = data.users.map(u => {
            const currentHost = hostname(window.location.href);
            const userHost = hostname(u.actor_id);

            return {
              // don't show hostname if it's the current instance
              key: `@${u.name}${
                currentHost !== userHost ? `@${hostname(u.actor_id)}` : ''
              }`,
              name: u.name,
              local: u.local,
              id: u.id,
            };
          });
          cb(users);
          this.userSub.unsubscribe();
        }
      },
      err => console.error(err),
      () => console.log('complete')
    );
  } else {
    cb([]);
  }
}

function communitySearch(text: string, cb: any) {
  if (text) {
    let form: SearchForm = {
      q: text,
      type_: SearchType[SearchType.Communities],
      sort: SortType[SortType.TopAll],
      page: 1,
      limit: mentionDropdownFetchLimit,
    };

    WebSocketService.Instance.search(form);

    this.communitySub = WebSocketService.Instance.subject.subscribe(
      msg => {
        let res = wsJsonToRes(msg);
        if (res.op == UserOperation.Search) {
          let data = res.data as SearchResponse;
          let communities = data.communities.map(c => {
            return {
              key: `!${c.name}@${hostname(c.actor_id)}`,
              name: c.name,
              local: c.local,
              id: c.id,
            };
          });
          cb(communities);
          this.communitySub.unsubscribe();
        }
      },
      err => console.error(err),
      () => console.log('complete')
    );
  } else {
    cb([]);
  }
}

export function getListingTypeFromProps(props: any): ListingType {
  return props.match.params.listing_type
    ? routeListingTypeToEnum(props.match.params.listing_type)
    : UserService.Instance.user &&
      UserService.Instance.user.default_listing_type
    ? UserService.Instance.user.default_listing_type
    : ListingType.All;
}

// TODO might need to add a user setting for this too
export function getDataTypeFromProps(props: any): DataType {
  return props.match.params.data_type
    ? routeDataTypeToEnum(props.match.params.data_type)
    : DataType.Post;
}

export function getSortTypeFromProps(props: any): SortType {
  return props.match.params.sort
    ? routeSortTypeToEnum(props.match.params.sort)
    : UserService.Instance.user && UserService.Instance.user.default_sort_type
    ? UserService.Instance.user.default_sort_type
    : SortType.Hot;
}

export function getPageFromProps(props: any): number {
  return props.match.params.page ? Number(props.match.params.page) : 1;
}

export function editCommentRes(
  data: CommentResponse,
  comments: Array<Comment>
) {
  let found = comments.find(c => c.id == data.comment.id);
  if (found) {
    found.content = data.comment.content;
    found.updated = data.comment.updated;
    found.removed = data.comment.removed;
    found.deleted = data.comment.deleted;
    found.upvotes = data.comment.upvotes;
    found.downvotes = data.comment.downvotes;
    found.score = data.comment.score;
  }
}

export function saveCommentRes(
  data: CommentResponse,
  comments: Array<Comment>
) {
  let found = comments.find(c => c.id == data.comment.id);
  if (found) {
    found.saved = data.comment.saved;
  }
}

export function createCommentLikeRes(
  data: CommentResponse,
  comments: Array<Comment>
) {
  let found: Comment = comments.find(c => c.id === data.comment.id);
  if (found) {
    found.score = data.comment.score;
    found.upvotes = data.comment.upvotes;
    found.downvotes = data.comment.downvotes;
    if (data.comment.my_vote !== null) {
      found.my_vote = data.comment.my_vote;
    }
  }
}

export function createPostLikeFindRes(data: PostResponse, posts: Array<Post>) {
  let found = posts.find(c => c.id == data.post.id);
  if (found) {
    createPostLikeRes(data, found);
  }
}

export function createPostLikeRes(data: PostResponse, post: Post) {
  if (post) {
    post.score = data.post.score;
    post.upvotes = data.post.upvotes;
    post.downvotes = data.post.downvotes;
    post.saved = data.post.saved;
    if (data.post.my_vote !== null) {
      post.my_vote = data.post.my_vote;
    }
  }
}

export function editPostFindRes(data: PostResponse, posts: Array<Post>) {
  let found = posts.find(c => c.id == data.post.id);
  if (found) {
    editPostRes(data, found);
  }
}

export function editPostRes(data: PostResponse, post: Post) {
  if (post) {
    post.url = data.post.url;
    post.name = data.post.name;
    post.nsfw = data.post.nsfw;
    post.deleted = data.post.deleted;
    post.removed = data.post.removed;
    post.stickied = data.post.stickied;
    post.body = data.post.body;
    post.locked = data.post.locked;
  }
}

export function commentsToFlatNodes(
  comments: Array<Comment>
): Array<CommentNodeI> {
  let nodes: Array<CommentNodeI> = [];
  for (let comment of comments) {
    nodes.push({ comment: comment });
  }
  return nodes;
}

export function commentSort(tree: Array<CommentNodeI>, sort: CommentSortType) {
  // First, put removed and deleted comments at the bottom, then do your other sorts
  if (sort == CommentSortType.Top) {
    tree.sort(
      (a, b) =>
        +a.comment.removed - +b.comment.removed ||
        +a.comment.deleted - +b.comment.deleted ||
        b.comment.score - a.comment.score
    );
  } else if (sort == CommentSortType.New) {
    tree.sort(
      (a, b) =>
        +a.comment.removed - +b.comment.removed ||
        +a.comment.deleted - +b.comment.deleted ||
        b.comment.published.localeCompare(a.comment.published)
    );
  } else if (sort == CommentSortType.Old) {
    tree.sort(
      (a, b) =>
        +a.comment.removed - +b.comment.removed ||
        +a.comment.deleted - +b.comment.deleted ||
        a.comment.published.localeCompare(b.comment.published)
    );
  } else if (sort == CommentSortType.Hot) {
    tree.sort(
      (a, b) =>
        +a.comment.removed - +b.comment.removed ||
        +a.comment.deleted - +b.comment.deleted ||
        hotRankComment(b.comment) - hotRankComment(a.comment)
    );
  }

  // Go through the children recursively
  for (let node of tree) {
    if (node.children) {
      commentSort(node.children, sort);
    }
  }
}

export function commentSortSortType(tree: Array<CommentNodeI>, sort: SortType) {
  commentSort(tree, convertCommentSortType(sort));
}

function convertCommentSortType(sort: SortType): CommentSortType {
  if (
    sort == SortType.TopAll ||
    sort == SortType.TopDay ||
    sort == SortType.TopWeek ||
    sort == SortType.TopMonth ||
    sort == SortType.TopYear
  ) {
    return CommentSortType.Top;
  } else if (sort == SortType.New) {
    return CommentSortType.New;
  } else if (sort == SortType.Hot) {
    return CommentSortType.Hot;
  } else {
    return CommentSortType.Hot;
  }
}

export function postSort(
  posts: Array<Post>,
  sort: SortType,
  communityType: boolean
) {
  // First, put removed and deleted comments at the bottom, then do your other sorts
  if (
    sort == SortType.TopAll ||
    sort == SortType.TopDay ||
    sort == SortType.TopWeek ||
    sort == SortType.TopMonth ||
    sort == SortType.TopYear
  ) {
    posts.sort(
      (a, b) =>
        +a.removed - +b.removed ||
        +a.deleted - +b.deleted ||
        (communityType && +b.stickied - +a.stickied) ||
        b.score - a.score
    );
  } else if (sort == SortType.New) {
    posts.sort(
      (a, b) =>
        +a.removed - +b.removed ||
        +a.deleted - +b.deleted ||
        (communityType && +b.stickied - +a.stickied) ||
        b.published.localeCompare(a.published)
    );
  } else if (sort == SortType.Hot) {
    posts.sort(
      (a, b) =>
        +a.removed - +b.removed ||
        +a.deleted - +b.deleted ||
        (communityType && +b.stickied - +a.stickied) ||
        b.hot_rank - a.hot_rank
    );
  }
}

export const colorList: Array<string> = [
  hsl(0),
  hsl(100),
  hsl(150),
  hsl(200),
  hsl(250),
  hsl(300),
];

function hsl(num: number) {
  return `hsla(${num}, 35%, 50%, 1)`;
}

function randomHsl() {
  return `hsla(${Math.random() * 360}, 100%, 50%, 1)`;
}

export function previewLines(text: string, lines = 3): string {
  // Use lines * 2 because markdown requires 2 lines
  return text
    .split('\n')
    .slice(0, lines * 2)
    .join('\n');
}

export function hostname(url: string): string {
  let cUrl = new URL(url);
  return window.location.port
    ? `${cUrl.hostname}:${cUrl.port}`
    : `${cUrl.hostname}`;
}

function canUseWebP() {
  // TODO pictshare might have a webp conversion bug, try disabling this
  return false;

  // var elem = document.createElement('canvas');
  // if (!!(elem.getContext && elem.getContext('2d'))) {
  //   var testString = !(window.mozInnerScreenX == null) ? 'png' : 'webp';
  //   // was able or not to get WebP representation
  //   return (
  //     elem.toDataURL('image/webp').startsWith('data:image/' + testString)
  //   );
  // }

  // // very old browser like IE 8, canvas not supported
  // return false;
}

export function imagesDownsize(
  html: string,
  very_low: boolean,
  can_expand: boolean
): string {
  const imgPictrsRegex = new RegExp(
    /<img src=(("https:\/\/.*?chapo\.chat\/pictrs\/image\/)(.{10})(.jpg"))( alt=".*?">)/g
  );
  const imgTagRegex = new RegExp(/<img((?!icon).)*$/g);
  html = html.replace(
    imgPictrsRegex,
    (can_expand
      ? '<a target="_blank" rel="noopener noreferrer" href=$1>'
      : '') +
      '<img id="$3" src=$2thumbnail' +
      (very_low ? '96' : '256') +
      '/$3$4$5' +
      (can_expand ? '</a>' : '')
  );
  html = html.replace(
    imgTagRegex,
    '$& className="' + (very_low ? 'notification-image' : 'comment-image') + '"'
  );
  return html;
}

export function replaceImageEmbeds(html: string): string {
  const imgTagRegex = new RegExp(/<img.*?src="(.*?)"[^>]+>/g);
  html = html.replace(imgTagRegex, '<a href="$1">Embedded image</a>');
  return html;
}

export function validTitle(title?: string): boolean {
  // Initial title is null, minimum length is taken care of by textarea's minLength={3}
  if (title === null || title.length < 3) return true;

  const regex = new RegExp(/.*\S.*/, 'g');

  return regex.test(title);
}

export const mapSiteModeratorsResponse = (
  data: GetSiteModeratorsResponse
): CommunityModsState => {
  return data.communities.reduce((agg, item) => {
    agg[item.community.id] = item;
    return agg;
  }, {});
};

interface DoesUserModerateCommunityArgs {
  moderatorId: number;
  communityId: number;
  siteModerators: CommunityModsState;
}

export const doesUserModerateCommunity = ({
  moderatorId,
  communityId,
  siteModerators,
}: DoesUserModerateCommunityArgs) => {
  if (siteModerators[communityId] == null) return false;

  return siteModerators[communityId].moderators.includes(moderatorId);
};

export const getAllUserModeratedCommunities = ({
  moderatorId,
  siteModerators,
}) => {
  return Object.keys(siteModerators).reduce((agg, communityId) => {
    if (
      doesUserModerateCommunity({
        moderatorId,
        communityId: +communityId,
        siteModerators,
      })
    ) {
      agg.push(+communityId);
    }

    return agg;
  }, []);
};

// any of these comment changes should trigger a re-render
export function isCommentChanged(operation: UserOperation): boolean {
  return (
    operation == UserOperation.EditComment ||
    operation == UserOperation.MarkCommentAsRead ||
    operation == UserOperation.RemoveComment ||
    operation == UserOperation.DeleteComment
  );
}

// any of these post changes should trigger a re-render
export function isPostChanged(operation: UserOperation): boolean {
  return (
    operation == UserOperation.EditPost ||
    operation == UserOperation.DeletePost ||
    operation == UserOperation.RemovePost ||
    operation == UserOperation.LockPost ||
    operation == UserOperation.StickyPost
  );
}

// any of these message changes should trigger a re-render
export function isMessageChanged(operation: UserOperation): boolean {
  return (
    operation == UserOperation.EditPrivateMessage ||
    operation == UserOperation.MarkPrivateMessageAsRead ||
    operation == UserOperation.DeletePrivateMessage
  );
}

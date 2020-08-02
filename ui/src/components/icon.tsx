import { Component } from 'inferno';

const icons = {
  report: (
    <>
      <path d="M6,6a20.34,20.34,0,0,0,5,1c1.58,0,4.42-2,6-2a4.38,4.38,0,0,1,3,1l-2,6a3.29,3.29,0,0,0-2-1c-3-.12-4,2-7,2a42,42,0,0,1-5-1Z" />
      <path d="M9,13.75a40.19,40.19,0,0,1-5.18-1L3,12.53l2.5-7.48.71.24a19.73,19.73,0,0,0,4.76,1,9.07,9.07,0,0,0,2.69-.93A9.11,9.11,0,0,1,17,4.25a5.14,5.14,0,0,1,3.53,1.22l.33.33-2.55,7.65-.86-.94A2.53,2.53,0,0,0,16,11.75a5.9,5.9,0,0,0-3.18.9A7.69,7.69,0,0,1,9,13.75ZM5,11.47a30.79,30.79,0,0,0,4,.78,6.29,6.29,0,0,0,3.1-.93A7.38,7.38,0,0,1,16,10.25a3.47,3.47,0,0,1,1.59.5l1.5-4.47A4.13,4.13,0,0,0,17,5.75a9.07,9.07,0,0,0-2.69.93A9.11,9.11,0,0,1,11,7.75a18.17,18.17,0,0,1-4.52-.82Z" />
      <rect
        x="9.59"
        y="12.75"
        width="15.81"
        height="1.5"
        transform="translate(-0.84 25.83) rotate(-71.55)"
      />
      <path d="M9.21,16.52a15.84,15.84,0,0,1-4.73-1.09l-.67-.26,1-3,1.42.48-.56,1.66a10.72,10.72,0,0,0,4,.72,8.84,8.84,0,0,0,2.7-1c1.37-.69,2.78-1.41,4.9-.7l-.48,1.42c-1.52-.51-2.46,0-3.75.62a9.92,9.92,0,0,1-3.15,1.14A4.4,4.4,0,0,1,9.21,16.52Z" />
    </>
  ),
  comment: (
    <path d="M20,4H4A2,2,0,0,0,2,6v9a2,2,0,0,0,2,2h7l1,3,6-3h2a2,2,0,0,0,2-2V6A2,2,0,0,0,20,4Z" />
  ),
  upvote: (
    <path d="M15,21H9V14H4.14a1,1,0,0,1-.77-1.64l7.86-9.44a1,1,0,0,1,1.54,0l7.86,9.44A1,1,0,0,1,19.86,14H15Z" />
  ),
  downvote: (
    <path d="M9,3h6v7h4.86a1,1,0,0,1,.77,1.64l-7.86,9.44a1,1,0,0,1-1.54,0L3.37,11.64A1,1,0,0,1,4.14,10H9Z" />
  ),
  notification: (
    <>
      <path d="M14,20H10a2,2,0,0,0,4,0Z" />
      <path d="M7,9v3L4.71,16a2,2,0,0,0,1.74,3H17.56a2,2,0,0,0,1.73-3L17,12V9s0-5-5-5S7,9,7,9Z" />
      <path d="M12,2a1,1,0,0,0-1,1V4a1,1,0,0,0,2,0V3a1,1,0,0,0-1-1Z" />
    </>
  ),
  search: (
    <>
      <path d="M9.5,5A4.5,4.5,0,1,1,5,9.5,4.51,4.51,0,0,1,9.5,5m0-2A6.5,6.5,0,1,0,16,9.5,6.5,6.5,0,0,0,9.5,3Z" />
      <rect
        x="15.5"
        y="12.96"
        width="2"
        height="7.07"
        transform="translate(-6.83 16.5) rotate(-45)"
      />
    </>
  ),
  image: (
    <>
      <path d="M9.17,13.5,8,15.92A6.2,6.2,0,0,0,9,16a10,10,0,0,0,2.45-.45l-1-2.05Z" />
      <path d="M20,4H4A2,2,0,0,0,2,6V18a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V6A2,2,0,0,0,20,4ZM7.9,7.25h3.61l.66,2.87L10.42,11V9.75H9.17V11L7.26,10ZM20,18H4V15.33a15.37,15.37,0,0,1,3.84.58L7.33,15,6.09,12.88l.74-1.8,2.34,1.17h1.25l2.18-1.09.71,1.72L12.17,15l-.19.37A12.38,12.38,0,0,1,15,15a14.23,14.23,0,0,1,5,1Z" />
    </>
  ),
  contribute: (
    <>
      <path d="M17 19h-12c-0.553 0-1-0.447-1-1s0.447-1 1-1h12c0.553 0 1 0.447 1 1s-0.447 1-1 1z"></path>
      <path d="M17.5 5h-12.5v9c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2v-2h0.5c1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5zM15 14h-8v-7h8v7zM17.5 10h-1.5v-3h1.5c0.827 0 1.5 0.673 1.5 1.5s-0.673 1.5-1.5 1.5z"></path>
    </>
  ),
  rss: (
    <>
      <path d="M12,4a8,8,0,1,1-8,8,8,8,0,0,1,8-8m0-2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Z" />
      <path d="M16.75,15h-1.5c0-6.15-6-6.25-6.25-6.25V7.25C9.08,7.25,16.75,7.34,16.75,15Z" />
      <path d="M12.25,15A3.13,3.13,0,0,0,9,11.75v-1.5A4.58,4.58,0,0,1,13.75,15Z" />
      <path d="M10,13a1,1,0,1,0,1,1,1,1,0,0,0-1-1Z" />
    </>
  ),
  help: (
    <>
      <path d="M12,4a8,8,0,1,1-8,8,8,8,0,0,1,8-8m0-2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Z" />
      <path d="M11.25,14a3.68,3.68,0,0,1,1.21-2.55,2.5,2.5,0,0,0,.79-1.5A1.18,1.18,0,0,0,12,8.75,1.18,1.18,0,0,0,10.75,10H9.25A2.67,2.67,0,0,1,12,7.25,2.67,2.67,0,0,1,14.75,10a3.89,3.89,0,0,1-1.21,2.52A2.4,2.4,0,0,0,12.75,14Z" />
      <rect x="11.25" y="15" width="1.5" height="1.5" />
    </>
  ),
  reply: (
    <>
      <defs>
        <symbol id="a" viewBox="0 0 48 48">
          <rect width="48" height="48" style="fill:none" />
        </symbol>
      </defs>
      <path d="M9,9V4L2,12l7,8V14.84c4.88-.57,11,1.42,11,5.16h1a4.38,4.38,0,0,0,1-3C22,11.25,16.49,9.18,9,9Z" />
      <use width="48" height="48" transform="translate(0 0) scale(0.5)" />
    </>
  ),
  star: (
    <polygon points="12 2.29 14.18 9 21.23 9 15.53 13.15 17.71 19.85 12 15.71 6.29 19.85 8.47 13.15 2.77 9 9.82 9 12 2.29" />
  ),
  more: (
    <>
      <path d="M4,10a2,2,0,1,0,2,2,2,2,0,0,0-2-2Z" />
      <path d="M12,10a2,2,0,1,0,2,2,2,2,0,0,0-2-2Z" />
      <path d="M20,10a2,2,0,1,0,2,2,2,2,0,0,0-2-2Z" />
    </>
  ),
  edit: (
    <>
      <path d="M18.71,9.29l1.58-1.58a1,1,0,0,0,0-1.42L17.71,3.71a1,1,0,0,0-1.42,0L14.71,5.29Z" />
      <path d="M13.29,6.71,4,16v4H8l9.29-9.29Z" />
    </>
  ),
  plus: (
    <>
      <path d="M12,20.25A1.25,1.25,0,0,1,10.75,19V5a1.25,1.25,0,0,1,2.5,0V19A1.25,1.25,0,0,1,12,20.25Z" />
      <path d="M19,13.25H5a1.25,1.25,0,0,1,0-2.5H19a1.25,1.25,0,0,1,0,2.5Z" />
    </>
  ),
  minus: (
    <path d="M19,13.25H5a1.25,1.25,0,0,1,0-2.5H19a1.25,1.25,0,0,1,0,2.5Z" />
  ),
  link: (
    <>
      <path d="M11,6H6A2,2,0,0,0,4,8V18a2,2,0,0,0,2,2H16a2,2,0,0,0,2-2V13H16v5H6V8h5V6Z" />
      <polygon points="20 11 18 11 18 6 13 6 13 4 20 4 20 11" />
      <rect
        x="9.34"
        y="8"
        width="11.31"
        height="2"
        transform="translate(-1.97 13.24) rotate(-45)"
      />
    </>
  ),
  hexbear: (
    <path d="M18.6,8.51l.67-.64a2.27,2.27,0,0,0-3.21-3.21L14.62,6.1H9.38L7.94,4.66A2.27,2.27,0,0,0,4.73,7.87l.67.64L3,16l6.73,5h4.54L21,16ZM8,12a1,1,0,0,1,1-1h1a1,1,0,0,1,1,1v1H9A1,1,0,0,1,8,12Zm6,7H10s-1.17-2.35.09-3.44a2,2,0,0,0,3.82,0C15.17,16.65,14,19,14,19Zm1-6H13V12a1,1,0,0,1,1-1h1a1,1,0,0,1,0,2Z" />
  ),
  hexagon: (
    <>
      <path d="M15.85,5.34,19.69,12l-3.84,6.66H8.15L4.31,12,8.15,5.34h7.7m.57-2H7.58a1,1,0,0,0-.87.5L2.29,11.5a1,1,0,0,0,0,1l4.42,7.66a1,1,0,0,0,.87.5h8.84a1,1,0,0,0,.87-.5l4.42-7.66a1,1,0,0,0,0-1L17.29,3.84a1,1,0,0,0-.87-.5Z" />
      <polygon points="14.5 7.67 9.5 7.67 7 12 9.5 16.33 14.5 16.33 17 12 14.5 7.67" />
    </>
  ),
  pin: (
    <path d="M15 2v-1h-12v1c0 0.552 0.448 1 1 1v8c-0.552 0-1 0.448-1 1v1h5v3c0 0.552 0.448 1 1 1s1-0.448 1-1v-3h5v-1c0-0.552-0.448-1-1-1v-8c0.552 0 1-0.448 1-1zM12 11h-6v-8h6v8z" />
  ),
};

type Icons = typeof icons;

export function Icon<T extends keyof Icons>({
  name,
  size = '20px',
  ...props
}: {
  name: T;
  size?: number | string;
}): Icons[T] {
  if (!Object.keys(icons).includes(name)) {
    console.warn(`Icon ${name} not found`);
    return null;
  }

  return (
    <svg
      class="icon custom-icon"
      viewBox="0 0 24 24"
      aria-labelledby={name}
      fill="currentColor"
      style={{
        width: size,
        height: size,
      }}
      // height={size}
      // width={size}
      {...props}
    >
      <title id="title">{name}</title>
      {icons[name]}
    </svg>
  );
}

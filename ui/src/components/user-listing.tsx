import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { UserView } from '../interfaces';
import {
  pictrsAvatarThumbnail,
  showAvatars,
  hostname,
  isCakeDay,
} from '../utils';
import { CakeDay } from './cake-day';

interface UserOther {
  name: string;
  id?: number; // Necessary if its federated
  avatar?: string;
  local?: boolean;
  actor_id?: string;
  published?: string;
}

interface UserListingProps {
  user: UserView | UserOther;
  realLink?: boolean;
  isMod?: boolean;
  isAdmin?: boolean;
}

function getTextColor({
  isMod,
  isAdmin,
}: {
  isMod?: boolean;
  isAdmin?: boolean;
}): string {
  if (isMod) return 'mod-text';

  if (isAdmin) return 'admin-text';

  return '';
}

export class UserListing extends Component<UserListingProps, any> {
  constructor(props: any, context: any) {
    super(props, context);
  }

  render() {
    const { isMod, isAdmin } = this.props;
    let user = this.props.user;
    let local = user.local == null ? true : user.local;
    let name_: string, link: string;

    if (local) {
      name_ = user.name;
      link = `/u/${user.name}`;
    } else {
      name_ = `${user.name}@${hostname(user.actor_id)}`;
      link = !this.props.realLink ? `/user/${user.id}` : user.actor_id;
    }

    const textStyle = isMod ? '' : isAdmin ? 'red' : '';

    return (
      <>
        <Link className="text-body font-weight-bold" to={link}>
          {user.avatar && showAvatars() && (
            <img
              height="32"
              width="32"
              src={pictrsAvatarThumbnail(user.avatar)}
              className="rounded-circle mr-2"
            />
          )}
          <span className={getTextColor({ isMod, isAdmin })}>{name_}</span>
        </Link>

        {isCakeDay(user.published) && <CakeDay creatorName={name_} />}
      </>
    );
  }
}

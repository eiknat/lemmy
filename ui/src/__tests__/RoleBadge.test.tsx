import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { RoleBadge } from '../components/RoleBadge';

// import { RoleBadge } from '../components/comment-node';

test('<RoleBadge /> to render', async () => {
  const { container } = render(
    <RoleBadge tooltipText="admin" role="admin">
      Admin
    </RoleBadge>
  );

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="badge badge-light mx-1 comment-badge admin-badge"
        data-tippy-content="admin"
      >
        Admin
      </div>
    </div>
  `);

  expect(container).toHaveTextContent('Admin');
  expect(container.firstChild).toHaveClass('admin-badge');
  expect(container.firstChild).toHaveAttribute('data-tippy-content', 'admin')
});

use crate::{
  api::{APIError, Oper, Perform},
  blocking,
  db::{
    comment::*,
    comment_view::*,
    community_view::*,
    post::*,
    post_view::*,
    user::*,
    Crud,
  },
  websocket::{
    server::{JoinCommunityRoom, SendComment},
    UserOperation,
    WebsocketInfo,
  },
  DbPool,
  LemmyError,
};

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct CreateCommentReport {
  comment: i32,
  reason: Option<String>,
  auth: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CommentReportResponse {
  pub comment: CommentView,
}

#[derive(Serialize, Deserialize)]
pub struct CreatePostReport {
  post: i32,
  reason: Option<String>,
  auth: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PostReportResponse {
  pub post: PostView,
}

#[async_trait::async_trait(?Send)]
impl Perform for Oper<CreateCommentReport> {
  type Response = CommentReportResponse;

  async fn perform(
    &self,
    pool: &DbPool,
    websocket_info: Option<WebsocketInfo>,
  ) -> Result<CommentReportResponse, LemmyError> {
    let data: &CreateCommentReport = &self.data;
    
    // Verify auth token
    let claims = match Claims::decode(&data.auth) {
      Ok(claims) => claims.claims,
      Err(_e) => return Err(APIError::err("not_logged_in").into()),
    };

    // Check for site ban
    let user_id = claims.id;
    let user = blocking(pool, move |conn| User_::read(&conn, user_id)).await??;
    if user.banned {
      return Err(APIError::err("site_ban").into());
    }

    // Fetch comment information from the database
    let comment_id = data.comment;
    let comment = blocking
      (pool, move |conn| CommentView::read(&conn, comment_id, None)).await??;

    // Check for community ban
    let is_banned =
      move |conn: &'_ _| CommunityUserBanView::get(conn, user_id,
						   comment.community_id).is_ok();
    if blocking(pool, is_banned).await? {
      return Err(APIError::err("community_ban").into());
    }
    
    return Err(APIError::err("comment_report_not_implemented").into());
  }
}

#[async_trait::async_trait(?Send)]
impl Perform for Oper<CreatePostReport> {
  type Response = PostReportResponse;

  async fn perform(
    &self,
    pool: &DbPool,
    websocket_info: Option<WebsocketInfo>,
  ) -> Result<PostReportResponse, LemmyError> {
    let data: &CreatePostReport = &self.data;
    
    // Verify auth token
    let claims = match Claims::decode(&data.auth) {
      Ok(claims) => claims.claims,
      Err(_e) => return Err(APIError::err("not_logged_in").into()),
    };

    // Check for site ban
    let user_id = claims.id;
    let user = blocking(pool, move |conn| User_::read(&conn, user_id)).await??;
    if user.banned {
      return Err(APIError::err("site_ban").into());
    }

    // Fetch post information from the database
    let post_id = data.post;
    let post = blocking
      (pool, move |conn| PostView::read(&conn, post_id, None)).await??;

    // Check for community ban
    let is_banned =
      move |conn: &'_ _| CommunityUserBanView::get(conn, user_id,
						   post.community_id).is_ok();
    if blocking(pool, is_banned).await? {
      return Err(APIError::err("community_ban").into());
    }
    
    return Err(APIError::err("post_report_not_implemented").into());
  }
}

-- add sketchmoor schema

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  color text not null,
  passwordHash text not null
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table boards (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  title text not null,
  ownerId uuid not null references users(id) on delete cascade
);

create trigger boardsTouchUpdatedAt
  before update on boards
  for each row execute function touchUpdatedAt();

-- A row per user who can open a board: the owner, and anyone who opened its link.
create table boardMembers (
  boardId uuid not null references boards(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  createdAt timestamptz not null default now(),
  primary key (boardId, userId)
);

create index boardMembersUserIdIdx on boardMembers (userId);

-- Every drawable thing on a board. Geometry is a box (x, y, w, h); an arrow
-- runs from (x, y) to (x + w, y + h), so its w and h may be negative. A pen
-- stroke keeps its points normalized to 0..1000 inside the box, so moving and
-- resizing never rewrite them. Erasing sets deleted, which keeps undo a plain
-- update in both directions.
create table shapes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  boardId uuid not null references boards(id) on delete cascade,
  createdBy uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('pen', 'note', 'rect', 'arrow', 'text')),
  x double precision not null,
  y double precision not null,
  w double precision not null,
  h double precision not null,
  z double precision not null,
  color text not null,
  strokeWidth double precision not null default 4,
  points text not null default '',
  text text not null default '',
  deleted boolean not null default false
);

create index shapesBoardIdIdx on shapes (boardId);

create trigger shapesTouchUpdatedAt
  before update on shapes
  for each row execute function touchUpdatedAt();

-- A change to a shape is a change to its board, so the board list sorts by
-- last edit and its thumbnail url changes.
create or replace function touchBoardFromShape()
returns trigger
language plpgsql
as $$
begin
  update boards set updatedAt = now() where id = new.boardId;
  return new;
end;
$$;

create trigger shapesTouchBoard
  after insert or update on shapes
  for each row execute function touchBoardFromShape();
